import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PlayCircle, FileText, Type, ChevronLeft, ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activityLogger";

/** Extract YouTube video ID from various URL formats */
const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match?.[1] ?? null;
};

const lessonIcon = (type: string, size = "h-4 w-4") => {
  switch (type) {
    case "video": return <PlayCircle className={`${size} text-secondary`} />;
    case "pdf": return <FileText className={`${size} text-primary`} />;
    default: return <Type className={`${size} text-muted-foreground`} />;
  }
};

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch course + all modules/lessons for sidebar
  const { data: course } = useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*, course_lessons(id, title, lesson_type, duration_minutes, is_preview, sort_order)")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        course_lessons: (m.course_lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
    enabled: !!courseId,
  });

  // Current lesson
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("id", lessonId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  // Progress for this user on all lessons in this course
  const { data: progressMap = {} } = useQuery({
    queryKey: ["lesson-progress", courseId, user?.id],
    queryFn: async () => {
      const allLessonIds = modules.flatMap((m: any) => (m.course_lessons || []).map((l: any) => l.id));
      if (allLessonIds.length === 0) return {};
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user!.id)
        .in("lesson_id", allLessonIds);
      const map: Record<string, boolean> = {};
      (data || []).forEach((p: any) => { map[p.lesson_id] = p.completed; });
      return map;
    },
    enabled: !!user && modules.length > 0,
  });

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      // Upsert progress
      const { error } = await supabase.from("lesson_progress").upsert(
        { lesson_id: lessonId!, user_id: user!.id, completed: true, progress_pct: 100, completed_at: new Date().toISOString() },
        { onConflict: "lesson_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", courseId] });
      logActivity("lesson.completed", "course_lesson", lessonId, { courseId });
      toast({ title: "Lesson completed!" });
    },
  });

  // Flat list for prev/next
  const allLessons = modules.flatMap((m: any) => (m.course_lessons || []).map((l: any) => ({ ...l, moduleTitle: m.title })));
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Lesson not found.</p>
      </div>
    );
  }

  const isCompleted = progressMap[lessonId!] ?? false;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <Link to={`/course/${courseId}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to course
          </Link>
          <h2 className="font-serif font-bold mt-2 text-lg truncate">{course?.title}</h2>
        </div>
        <ScrollArea className="h-[30vh] lg:h-[calc(100vh-120px)]">
          <div className="p-3 space-y-4">
            {modules.map((mod: any, mi: number) => (
              <div key={mod.id}>
                <p className="text-xs font-bold text-muted-foreground px-2 mb-1">Module {mi + 1}: {mod.title}</p>
                <ul className="space-y-0.5">
                  {(mod.course_lessons || []).map((l: any) => (
                    <li key={l.id}>
                      <Link
                        to={`/course/${courseId}/lesson/${l.id}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          l.id === lessonId
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {progressMap[l.id] ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          lessonIcon(l.lesson_type)
                        )}
                        <span className="flex-1 truncate">{l.title}</span>
                        {l.duration_minutes && (
                          <span className="text-xs text-muted-foreground">{l.duration_minutes}m</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Lesson content */}
        <div className="flex-1 p-4 md:p-8">
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6">{lesson.title}</h1>

          {/* Video */}
          {lesson.lesson_type === "video" && lesson.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-foreground/5 mb-6">
              {getYouTubeId(lesson.video_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(lesson.video_url)}?rel=0`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <video src={lesson.video_url} controls className="w-full h-full" />
              )}
            </div>
          )}

          {/* PDF */}
          {lesson.lesson_type === "pdf" && lesson.pdf_url && (
            <div className="mb-6">
              <iframe
                src={lesson.pdf_url}
                title={lesson.title}
                className="w-full h-[70vh] rounded-xl border border-border"
              />
            </div>
          )}

          {/* Text */}
          {lesson.lesson_type === "text" && lesson.content_text && (
            <div className="prose prose-stone max-w-none mb-6">
              <div className="whitespace-pre-line text-foreground leading-relaxed">{lesson.content_text}</div>
            </div>
          )}

          {lesson.description && (
            <p className="text-muted-foreground mt-4">{lesson.description}</p>
          )}
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 border-t border-border bg-card p-4 flex items-center justify-between gap-4">
          <div>
            {prevLesson && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/course/${courseId}/lesson/${prevLesson.id}`)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
            )}
          </div>

          {user && (
            <Button
              variant={isCompleted ? "secondary" : "default"}
              size="sm"
              onClick={() => !isCompleted && markCompleteMutation.mutate()}
              disabled={isCompleted || markCompleteMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {isCompleted ? "Completed" : "Mark Complete"}
            </Button>
          )}

          <div>
            {nextLesson && (
              <Button size="sm" onClick={() => navigate(`/course/${courseId}/lesson/${nextLesson.id}`)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonPlayer;
