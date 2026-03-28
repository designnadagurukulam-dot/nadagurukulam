import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, GripVertical, Video, FileText, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const steps = ["Details", "Modules & Lessons", "Review"];

const lessonTypeIcons: Record<string, any> = { video: Video, pdf: FileText, text: Type };

interface Lesson {
  id: string;
  title: string;
  lesson_type: "video" | "pdf" | "text";
  video_url: string;
  pdf_url: string;
  content_text: string;
  duration_minutes: number;
  is_preview: boolean;
  sort_order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  lessons: Lesson[];
}

interface CurriculumModule {
  id: string;
  semester: number;
  subject_name: string;
  module_name: string;
  course_code: string;
  description: string | null;
}

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Course type choice
  const [courseType, setCourseType] = useState<"new" | "curriculum">("new");
  const [curriculumModules, setCurriculumModules] = useState<CurriculumModule[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Step 1: Course details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("beginner");
  const [duration, setDuration] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [tags, setTags] = useState("");

  // Step 2: Modules & Lessons
  const [modules, setModules] = useState<Module[]>([
    { id: crypto.randomUUID(), title: "Module 1", description: "", sort_order: 0, lessons: [] },
  ]);


  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data || []));
    supabase.from("curriculum_modules").select("*").order("semester").order("sort_order").then(({ data }) => {
      setCurriculumModules((data as CurriculumModule[]) || []);
    });
  }, []);

  // Derive available semesters
  const semesters = [...new Set(curriculumModules.map((m) => m.semester))].sort((a, b) => a - b);

  // Derive subjects for selected semester (curriculum mode)
  const subjectsForSemester = selectedSemester
    ? [...new Map(
        curriculumModules
          .filter((m) => m.semester === Number(selectedSemester))
          .map((m) => [m.subject_name, m])
      ).values()]
    : [];

  // Get the selected curriculum module id for saving sections
  const selectedCurriculumModule = selectedSubject
    ? curriculumModules.find(
        (m) => m.semester === Number(selectedSemester) && m.subject_name === selectedSubject
      )
    : null;

  const addModule = () => {
    setModules([...modules, {
      id: crypto.randomUUID(),
      title: `Module ${modules.length + 1}`,
      description: "",
      sort_order: modules.length,
      lessons: [],
    }]);
  };

  const removeModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const updateModule = (idx: number, field: string, value: string) => {
    const updated = [...modules];
    (updated[idx] as any)[field] = value;
    setModules(updated);
  };

  const addLesson = (modIdx: number) => {
    const updated = [...modules];
    updated[modIdx].lessons.push({
      id: crypto.randomUUID(),
      title: `Lesson ${updated[modIdx].lessons.length + 1}`,
      lesson_type: "video",
      video_url: "",
      pdf_url: "",
      content_text: "",
      duration_minutes: 0,
      is_preview: false,
      sort_order: updated[modIdx].lessons.length,
    });
    setModules(updated);
  };

  const removeLesson = (modIdx: number, lesIdx: number) => {
    const updated = [...modules];
    updated[modIdx].lessons = updated[modIdx].lessons.filter((_, i) => i !== lesIdx);
    setModules(updated);
  };

  const updateLesson = (modIdx: number, lesIdx: number, field: string, value: any) => {
    const updated = [...modules];
    (updated[modIdx].lessons[lesIdx] as any)[field] = value;
    setModules(updated);
  };
  const handleSaveCurriculumSections = async () => {
    if (!user || !selectedCurriculumModule) return;
    setSaving(true);
    try {
      for (const mod of modules) {
        // Create a curriculum_section for each module entry
        const validLessons = mod.lessons.filter((l) => l.video_url || l.pdf_url || l.content_text);
        const { data: newSection, error: secErr } = await supabase.from("curriculum_sections").insert({
          module_id: selectedCurriculumModule.id,
          title: mod.title,
          content_type: validLessons.some((l) => l.lesson_type === "video") ? "youtube" : "text",
          youtube_url: validLessons.find((l) => l.lesson_type === "video")?.video_url || null,
          text_content: validLessons.find((l) => l.lesson_type === "text")?.content_text || null,
          sort_order: 0,
          created_by: user.id,
        } as any).select().single();
        if (secErr) throw secErr;

        // Add links for video lessons
        const videoLessons = validLessons.filter((l) => l.lesson_type === "video" && l.video_url);
        if (videoLessons.length > 0) {
          const linkRows = videoLessons.map((l, i) => ({
            section_id: newSection.id,
            url: l.video_url,
            label: l.title || null,
            sort_order: i,
          }));
          await supabase.from("curriculum_section_links").insert(linkRows as any);
        }
      }
      toast({ title: "Sections added to curriculum successfully!" });
      navigate("/dashboard/instructor/curriculum");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (submitForReview = false) => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Create course
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          category_id: categoryId || null,
          level,
          duration,
          preview_video_url: previewVideoUrl || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          price: 0,
          discount_price: null,
          instructor_id: user.id,
          instructor_name: user.user_metadata?.display_name || user.email,
          status: submitForReview ? "pending" : "draft",
        } as any)
        .select()
        .single();

      if (courseErr) throw courseErr;

      // 2. Create modules & lessons
      for (const mod of modules) {
        const { data: dbModule, error: modErr } = await supabase
          .from("course_modules")
          .insert({ course_id: course.id, title: mod.title, description: mod.description, sort_order: mod.sort_order } as any)
          .select()
          .single();

        if (modErr) throw modErr;

        if (mod.lessons.length > 0) {
          const lessonsToInsert = mod.lessons.map((les) => ({
            module_id: dbModule.id,
            title: les.title,
            lesson_type: les.lesson_type,
            video_url: les.video_url || null,
            pdf_url: les.pdf_url || null,
            content_text: les.content_text || null,
            duration_minutes: les.duration_minutes || null,
            is_preview: les.is_preview,
            sort_order: les.sort_order,
          }));
          const { error: lesErr } = await supabase.from("course_lessons").insert(lessonsToInsert as any);
          if (lesErr) throw lesErr;
        }
      }

      // 3. Create curriculum_module entry if semester selected
      if (selectedSemester) {
        const semNum = Number(selectedSemester);
        const courseCode = semNum === 9 ? `ADD-${course.id.slice(0, 4).toUpperCase()}` : `SEM${semNum}-${course.id.slice(0, 4).toUpperCase()}`;
        await supabase.from("curriculum_modules").insert({
          semester: semNum,
          subject_name: title,
          course_code: courseCode,
          module_name: title,
          description: description || null,
          sort_order: 0,
        } as any);
      }

      // 4. Submit for review if requested
      if (submitForReview) {
        await supabase.from("content_reviews").insert({ course_id: course.id, status: "pending" } as any);
      }

      toast({ title: submitForReview ? "Course submitted for review!" : "Course saved as draft!" });
      navigate("/dashboard/instructor/courses");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="font-serif text-3xl text-foreground">Create New Course</h1>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">{i + 1}</span>
            {s}
          </button>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Course type choice */}
          <Card>
            <CardHeader><CardTitle>What would you like to do?</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer"
                  style={{ borderColor: courseType === "new" ? "hsl(var(--primary))" : undefined }}
                  onClick={() => setCourseType("new")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${courseType === "new" ? "border-primary" : "border-muted-foreground"}`}>
                    {courseType === "new" && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Create a new course</span>
                    <p className="text-sm text-muted-foreground">Start from scratch with a brand new course</p>
                  </div>
                </div>
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer"
                  style={{ borderColor: courseType === "curriculum" ? "hsl(var(--primary))" : undefined }}
                  onClick={() => setCourseType("curriculum")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${courseType === "curriculum" ? "border-primary" : "border-muted-foreground"}`}>
                    {courseType === "curriculum" && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Add to existing curriculum</span>
                    <p className="text-sm text-muted-foreground">Add modules and sections to an existing curriculum subject</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Semester selection for new courses */}
          <Card>
            <CardHeader><CardTitle>Course Placement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Which semester is this course for?</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger><SelectValue placeholder="Select semester or additional" /></SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                    ))}
                    <SelectItem value="9">Additional Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedSemester && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    This course will appear under{" "}
                    <span className="font-medium text-foreground">
                      {selectedSemester === "9" ? "Additional Courses" : `Semester ${selectedSemester}`}
                    </span>{" "}
                    in the curriculum.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course details */}
          <Card>
            <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Course Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Carnatic Vocal Masterclass" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" rows={4} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Duration</Label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 6 months" />
                </div>
                <div>
                  <Label>Preview Video URL (YouTube)</Label>
                  <Input value={previewVideoUrl} onChange={(e) => setPreviewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vocal, carnatic, music" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setStep(1)} disabled={!title || !selectedSemester} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Modules & Lessons */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {modules.map((mod, modIdx) => (
            <Card key={mod.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={mod.title}
                    onChange={(e) => updateModule(modIdx, "title", e.target.value)}
                    className="font-semibold text-lg border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                  />
                </div>
                {modules.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeModule(modIdx)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={mod.description}
                  onChange={(e) => updateModule(modIdx, "description", e.target.value)}
                  placeholder="Module description (optional)"
                  className="text-sm"
                />

                {/* Lessons */}
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  {mod.lessons.map((les, lesIdx) => {
                    const LesIcon = lessonTypeIcons[les.lesson_type] || Video;
                    return (
                      <div key={les.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <LesIcon className="h-4 w-4 text-primary shrink-0" />
                          <Input
                            value={les.title}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "title", e.target.value)}
                            className="flex-1 h-8 text-sm"
                            placeholder="Lesson title"
                          />
                          <Select value={les.lesson_type} onValueChange={(v) => updateLesson(modIdx, lesIdx, "lesson_type", v)}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={les.is_preview}
                              onChange={(e) => updateLesson(modIdx, lesIdx, "is_preview", e.target.checked)}
                              className="rounded"
                            />
                            Free
                          </label>
                          <Button variant="ghost" size="sm" onClick={() => removeLesson(modIdx, lesIdx)} className="h-8 w-8 p-0 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {les.lesson_type === "video" && (
                          <Input
                            value={les.video_url}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "video_url", e.target.value)}
                            placeholder="YouTube URL (unlisted)"
                            className="h-8 text-xs"
                          />
                        )}
                        {les.lesson_type === "pdf" && (
                          <Input
                            value={les.pdf_url}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "pdf_url", e.target.value)}
                            placeholder="PDF file URL"
                            className="h-8 text-xs"
                          />
                        )}
                        {les.lesson_type === "text" && (
                          <Textarea
                            value={les.content_text}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "content_text", e.target.value)}
                            placeholder="Lesson text content..."
                            rows={3}
                            className="text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                  <Button variant="ghost" size="sm" onClick={() => addLesson(modIdx)} className="gap-1 text-primary">
                    <Plus className="h-3 w-3" /> Add Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addModule} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Add Module
          </Button>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

          <Card>
            <CardHeader><CardTitle>Review Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Title:</span> {title || "—"}</p>
              <p><span className="font-medium">Level:</span> {level}</p>
              <p><span className="font-medium">Duration:</span> {duration || "—"}</p>
              
              <p><span className="font-medium">Modules:</span> {modules.length}</p>
              <p><span className="font-medium">Total Lessons:</span> {modules.reduce((sum, m) => sum + m.lessons.length, 0)}</p>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !title} className="gap-2">
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving || !title} className="gap-2">
                Submit for Review
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CreateCourse;
