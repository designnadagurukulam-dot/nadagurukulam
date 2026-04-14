import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, GripVertical, Video, FileText, Type, BookOpen, CheckCircle2, Layers, ClipboardList, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const steps = ["Details", "Modules & Lessons", "Review"];
const stepIcons = [ClipboardList, Layers, CheckCircle2];

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

  const [courseType, setCourseType] = useState<"new" | "curriculum">("new");
  const [curriculumModules, setCurriculumModules] = useState<CurriculumModule[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("beginner");
  const [duration, setDuration] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [tags, setTags] = useState("");

  const [modules, setModules] = useState<Module[]>([
    { id: crypto.randomUUID(), title: "Module 1", description: "", sort_order: 0, lessons: [] },
  ]);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data || []));
    supabase.from("curriculum_modules").select("*").order("semester").order("sort_order").then(({ data }) => {
      setCurriculumModules((data as CurriculumModule[]) || []);
    });
  }, []);

  const semesters = [...new Set(curriculumModules.map((m) => m.semester))].sort((a, b) => a - b);

  const subjectsForSemester = selectedSemester
    ? [...new Map(
        curriculumModules
          .filter((m) => m.semester === Number(selectedSemester))
          .map((m) => [m.subject_name, m])
      ).values()]
    : [];

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
      logActivity("curriculum.sections_added", "curriculum_module", selectedCurriculumModule.id, { subject: selectedSubject, semester: selectedSemester });
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

      if (submitForReview) {
        await supabase.from("content_reviews").insert({ course_id: course.id, status: "pending" } as any);
      }

      logActivity(submitForReview ? "course.submitted" : "course.created", "course", course.id, { title, status: submitForReview ? "pending" : "draft" });
      toast({ title: submitForReview ? "Course submitted for review!" : "Course saved as draft!" });
      navigate("/dashboard/instructor/courses");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const brandLabel = "text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold";
  const brandInput = "rounded-xl border-[#EDE3CC] focus:border-[#C49A3C]";
  const brandCard = "bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)]";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-2 text-[#8C7B6B] hover:text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Create New Course</h1>
        <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const Icon = stepIcons[i];
          return (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                i === step
                  ? "bg-[#7D1E24] text-white shadow-lg"
                  : i < step
                  ? "bg-[#F5E9CE] text-[#7D1E24]"
                  : "bg-[#FAF6EE] text-[#8C7B6B] border border-[#EDE3CC]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s}</span>
              <span className="sm:hidden w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={brandCard}>
            <div className="p-6">
              <h3 className="font-serif text-lg text-[#7D1E24] mb-1">What would you like to do?</h3>
              <div className="w-8 h-0.5 bg-[#C49A3C] mb-4" />
              <div className="space-y-3">
                <div
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${courseType === "new" ? "border-[#7D1E24] bg-[#7D1E24]/5" : "border-[#EDE3CC] hover:border-[#C49A3C]"}`}
                  onClick={() => setCourseType("new")}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${courseType === "new" ? "border-[#7D1E24]" : "border-[#8C7B6B]"}`}>
                    {courseType === "new" && <div className="h-2.5 w-2.5 rounded-full bg-[#7D1E24]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#C49A3C]" />
                      <span className="font-serif font-medium text-[#3D2E22]">Create a new course</span>
                    </div>
                    <p className="text-sm text-[#8C7B6B] ml-6">Start from scratch with a brand new course</p>
                  </div>
                </div>
                <div
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${courseType === "curriculum" ? "border-[#7D1E24] bg-[#7D1E24]/5" : "border-[#EDE3CC] hover:border-[#C49A3C]"}`}
                  onClick={() => setCourseType("curriculum")}
                >
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${courseType === "curriculum" ? "border-[#7D1E24]" : "border-[#8C7B6B]"}`}>
                    {courseType === "curriculum" && <div className="h-2.5 w-2.5 rounded-full bg-[#7D1E24]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#C49A3C]" />
                      <span className="font-serif font-medium text-[#3D2E22]">Add to existing curriculum</span>
                    </div>
                    <p className="text-sm text-[#8C7B6B] ml-6">Add modules and sections to an existing curriculum subject</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {courseType === "curriculum" && (
            <div className={brandCard}>
              <div className="p-6">
                <h3 className="font-serif text-lg text-[#7D1E24] mb-1">Select Curriculum Subject</h3>
                <div className="w-8 h-0.5 bg-[#C49A3C] mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={brandLabel}>Semester *</Label>
                    <Select value={selectedSemester} onValueChange={(v) => { setSelectedSemester(v); setSelectedSubject(""); }}>
                      <SelectTrigger className={`mt-1 ${brandInput}`}><SelectValue placeholder="Select semester" /></SelectTrigger>
                      <SelectContent>
                        {semesters.map((s) => (
                          <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={brandLabel}>Subject *</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedSemester}>
                      <SelectTrigger className={`mt-1 ${brandInput}`}><SelectValue placeholder={selectedSemester ? "Select subject" : "Select semester first"} /></SelectTrigger>
                      <SelectContent>
                        {subjectsForSemester.map((m) => (
                          <SelectItem key={m.subject_name} value={m.subject_name}>{m.subject_name} ({m.course_code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedSubject && (
                  <div className="mt-4 p-3 rounded-xl bg-[#F5E9CE] border border-[#EDE3CC]">
                    <p className="text-sm text-[#3D2E22]">
                      You will add sections to <span className="font-serif font-semibold text-[#7D1E24]">{selectedSubject}</span> — Semester {selectedSemester}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {courseType === "new" && (
            <>
              <div className={brandCard}>
                <div className="p-6">
                  <h3 className="font-serif text-lg text-[#7D1E24] mb-1">Course Placement</h3>
                  <div className="w-8 h-0.5 bg-[#C49A3C] mb-4" />
                  <div>
                    <Label className={brandLabel}>Which semester is this course for?</Label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger className={`mt-1 ${brandInput}`}><SelectValue placeholder="Select semester or additional" /></SelectTrigger>
                      <SelectContent>
                        {semesters.map((s) => (
                          <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                        ))}
                        <SelectItem value="9">Additional Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedSemester && (
                    <div className="mt-4 p-3 rounded-xl bg-[#F5E9CE] border border-[#EDE3CC]">
                      <p className="text-sm text-[#3D2E22]">
                        This course will appear under{" "}
                        <span className="font-serif font-semibold text-[#7D1E24]">
                          {selectedSemester === "9" ? "Additional Courses" : `Semester ${selectedSemester}`}
                        </span>{" "}
                        in the curriculum.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={brandCard}>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-serif text-lg text-[#7D1E24] mb-1">Course Details</h3>
                    <div className="w-8 h-0.5 bg-[#C49A3C] mb-4" />
                  </div>
                  <div>
                    <Label className={brandLabel}>Course Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Carnatic Vocal Masterclass" className={`mt-1 ${brandInput}`} />
                  </div>
                  <div>
                    <Label className={brandLabel}>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" rows={4} className={`mt-1 ${brandInput}`} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={brandLabel}>Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className={`mt-1 ${brandInput}`}><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={brandLabel}>Level</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger className={`mt-1 ${brandInput}`}><SelectValue /></SelectTrigger>
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
                      <Label className={brandLabel}>Duration</Label>
                      <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 6 months" className={`mt-1 ${brandInput}`} />
                    </div>
                    <div>
                      <Label className={brandLabel}>Preview Video URL</Label>
                      <Input value={previewVideoUrl} onChange={(e) => setPreviewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className={`mt-1 ${brandInput}`} />
                    </div>
                  </div>
                  <div>
                    <Label className={brandLabel}>Tags (comma-separated)</Label>
                    <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vocal, carnatic, music" className={`mt-1 ${brandInput}`} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setStep(1)}
              disabled={courseType === "new" ? (!title || !selectedSemester) : !selectedSubject}
              className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl"
            >
              {courseType === "curriculum" ? "Go to Modules" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Modules & Lessons */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {modules.map((mod, modIdx) => (
            <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: modIdx * 0.05 }} className={brandCard}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-[#F5E9CE] flex items-center justify-center">
                      <GripVertical className="h-4 w-4 text-[#C49A3C]" />
                    </div>
                    <Input
                      value={mod.title}
                      onChange={(e) => updateModule(modIdx, "title", e.target.value)}
                      className="font-serif font-semibold text-lg text-[#7D1E24] border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                    />
                  </div>
                  {modules.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeModule(modIdx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  value={mod.description}
                  onChange={(e) => updateModule(modIdx, "description", e.target.value)}
                  placeholder="Module description (optional)"
                  className={`text-sm mb-3 ${brandInput}`}
                />

                {/* Lessons */}
                <div className="space-y-2 pl-4 border-l-2 border-[#C49A3C]/30">
                  {mod.lessons.map((les, lesIdx) => {
                    const LesIcon = lessonTypeIcons[les.lesson_type] || Video;
                    return (
                      <div key={les.id} className="bg-[#FAF6EE] rounded-xl p-3 space-y-2 border border-[#EDE3CC]">
                        <div className="flex items-center gap-2">
                          <LesIcon className="h-4 w-4 text-[#7D1E24] shrink-0" />
                          <Input
                            value={les.title}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "title", e.target.value)}
                            className="flex-1 h-8 text-sm border-[#EDE3CC] rounded-lg"
                            placeholder="Lesson title"
                          />
                          <Select value={les.lesson_type} onValueChange={(v) => updateLesson(modIdx, lesIdx, "lesson_type", v)}>
                            <SelectTrigger className="w-28 h-8 text-xs border-[#EDE3CC] rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-1 text-xs text-[#8C7B6B] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={les.is_preview}
                              onChange={(e) => updateLesson(modIdx, lesIdx, "is_preview", e.target.checked)}
                              className="rounded accent-[#7D1E24]"
                            />
                            Free
                          </label>
                          <Button variant="ghost" size="sm" onClick={() => removeLesson(modIdx, lesIdx)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {les.lesson_type === "video" && (
                          <Input
                            value={les.video_url}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "video_url", e.target.value)}
                            placeholder="YouTube URL (unlisted)"
                            className="h-8 text-xs border-[#EDE3CC] rounded-lg"
                          />
                        )}
                        {les.lesson_type === "pdf" && (
                          <div className="space-y-1">
                            {les.pdf_url ? (
                              <div className="flex items-center gap-2 p-2 bg-[#FAF6EE] rounded-lg border border-[#EDE3CC]">
                                <FileText className="h-3.5 w-3.5 text-[#7D1E24] shrink-0" />
                                <span className="text-xs text-[#3D2E22] truncate flex-1">{les.pdf_url.split('/').pop()}</span>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded" onClick={() => updateLesson(modIdx, lesIdx, "pdf_url", "")}>Remove</Button>
                              </div>
                            ) : (
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f || !user) return;
                                  const filePath = `lessons/${user.id}/${Date.now()}_${f.name}`;
                                  const { error } = await supabase.storage.from("course-pdfs").upload(filePath, f);
                                  if (error) {
                                    toast({ title: "Upload failed", description: error.message, variant: "destructive" });
                                    return;
                                  }
                                  updateLesson(modIdx, lesIdx, "pdf_url", filePath);
                                  toast({ title: "PDF uploaded successfully!" });
                                }}
                                className="h-8 text-xs border-[#EDE3CC] rounded-lg"
                              />
                            )}
                          </div>
                        )}
                        {les.lesson_type === "text" && (
                          <Textarea
                            value={les.content_text}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "content_text", e.target.value)}
                            placeholder="Lesson text content..."
                            rows={3}
                            className="text-xs border-[#EDE3CC] rounded-lg"
                          />
                        )}
                      </div>
                    );
                  })}
                  <Button variant="ghost" size="sm" onClick={() => addLesson(modIdx)} className="gap-1 text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl">
                    <Plus className="h-3 w-3" /> Add Lesson
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          <Button variant="outline" onClick={addModule} className="w-full gap-2 border-[#EDE3CC] text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl border-dashed border-2">
            <Plus className="h-4 w-4" /> Add Module
          </Button>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(0)} className="gap-2 border-[#EDE3CC] text-[#8C7B6B] hover:bg-[#FAF6EE] rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {courseType === "curriculum" ? (
              <Button onClick={handleSaveCurriculumSections} disabled={saving || modules.length === 0} className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save to Curriculum"}
              </Button>
            ) : (
              <Button onClick={() => setStep(2)} className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Step 3: Review */}
      {step === 2 && courseType === "new" && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={brandCard}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#F5E9CE] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#C49A3C]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#7D1E24]">Review Summary</h3>
                  <div className="w-8 h-0.5 bg-[#C49A3C] mt-0.5" />
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Title", title || "—"],
                  ["Level", level],
                  ["Duration", duration || "—"],
                  ["Semester", selectedSemester === "9" ? "Additional" : `Semester ${selectedSemester}`],
                  ["Modules", String(modules.length)],
                  ["Total Lessons", String(modules.reduce((sum, m) => sum + m.lessons.length, 0))],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-[#EDE3CC] last:border-0">
                    <span className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold">{label}</span>
                    <span className="font-serif font-medium text-[#3D2E22]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2 border-[#EDE3CC] text-[#8C7B6B] hover:bg-[#FAF6EE] rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !title} className="gap-2 border-[#EDE3CC] text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl">
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving || !title} className="gap-2 bg-[#C49A3C] hover:bg-[#B08A2E] text-[#3D2E22] rounded-xl">
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
