import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Clock, BarChart3, IndianRupee, BookOpen, PlayCircle, FileText, Type, ChevronDown, ChevronUp, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import SectionDivider from "@/components/SectionDivider";
import { logActivity } from "@/lib/activityLogger";

const lessonIcon = (type: string) => {
  switch (type) {
    case "video": return <PlayCircle className="h-4 w-4 text-secondary" />;
    case "pdf": return <FileText className="h-4 w-4 text-primary" />;
    default: return <Type className="h-4 w-4 text-muted-foreground" />;
  }
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*, course_lessons(id, title, lesson_type, duration_minutes, is_preview, sort_order)")
        .eq("course_id", id!)
        .order("sort_order");
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        course_lessons: (m.course_lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id, progress")
        .eq("course_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("enrollments").insert({
        course_id: id!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      toast({ title: "Enrolled!", description: "You have been enrolled in this course." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.course_lessons?.length || 0), 0);
  const totalMinutes = modules.reduce((acc: number, m: any) =>
    acc + (m.course_lessons || []).reduce((s: number, l: any) => s + (l.duration_minutes || 0), 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const isEnrolled = !!enrollment;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden">
        {course.thumbnail_url || course.image_url ? (
          <motion.img
            src={course.thumbnail_url || course.image_url || ""}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
          />
        ) : (
          <div className="absolute inset-0 gradient-maroon" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%/0.95)] via-[hsl(0_0%_0%/0.5)] to-[hsl(0_0%_0%/0.2)]" />

        <div className="relative z-10 container mx-auto px-4 pb-12 pt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.level && <Badge variant="secondary" className="capitalize">{course.level}</Badge>}
              {(course as any).categories?.name && <Badge variant="outline" className="bg-background/80">{(course as any).categories.name}</Badge>}
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-extrabold text-primary-foreground mb-4" style={{ textShadow: "0 4px 30px hsl(0 0% 0% / 0.6)" }}>
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-primary-foreground/70 text-sm mb-6">
              {course.instructor_name && <span>by <strong className="text-primary-foreground">{course.instructor_name}</strong></span>}
              {course.duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>}
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {totalLessons} lessons</span>
              {totalMinutes > 0 && <span>{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              {isEnrolled ? (
                <Button size="lg" onClick={() => {
                  const firstLesson = modules[0]?.course_lessons?.[0];
                  if (firstLesson) navigate(`/course/${id}/lesson/${firstLesson.id}`);
                }}>
                  <PlayCircle className="h-5 w-5 mr-2" /> Continue Learning
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    if (!user) { navigate("/login"); return; }
                    enrollMutation.mutate();
                  }}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? "Enrolling..." : (
                    <>
                      {course.price > 0 ? (
                        <span className="flex items-center gap-1">
                          Enroll — <IndianRupee className="h-4 w-4" />
                          {course.discount_price ?? course.price}
                        </span>
                      ) : "Enroll for Free"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Description */}
          {course.description && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-4">About this Course</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{course.description}</p>
            </div>
          )}

          {/* Curriculum */}
          <div>
            <h2 className="font-serif text-2xl font-bold mb-6">Curriculum</h2>
            {modules.length === 0 ? (
              <p className="text-muted-foreground">Curriculum is being prepared.</p>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {modules.map((mod: any, mi: number) => (
                  <AccordionItem key={mod.id} value={mod.id} className="border border-border rounded-xl overflow-hidden bg-card">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xs font-bold text-muted-foreground">Module {mi + 1}</span>
                        <span className="font-semibold">{mod.title}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {mod.course_lessons?.length || 0} lessons
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <ul className="space-y-2">
                        {(mod.course_lessons || []).map((lesson: any) => {
                          const canAccess = isEnrolled || lesson.is_preview;
                          return (
                            <li key={lesson.id}>
                              {canAccess ? (
                                <Link
                                  to={`/course/${id}/lesson/${lesson.id}`}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                                >
                                  {lessonIcon(lesson.lesson_type)}
                                  <span className="flex-1 text-sm">{lesson.title}</span>
                                  {lesson.duration_minutes && (
                                    <span className="text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                                  )}
                                  {lesson.is_preview && !isEnrolled && (
                                    <Badge variant="secondary" className="text-xs">Preview</Badge>
                                  )}
                                </Link>
                              ) : (
                                <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                  <span className="flex-1 text-sm">{lesson.title}</span>
                                  {lesson.duration_minutes && (
                                    <span className="text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;
