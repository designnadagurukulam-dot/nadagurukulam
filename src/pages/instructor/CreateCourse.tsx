import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, GripVertical, Video, FileText, Type, Headphones, CheckCircle2, Layers, ClipboardList } from "lucide-react";
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

const steps = ["Details", "Modules & Topics", "Review"];
const stepIcons = [ClipboardList, Layers, CheckCircle2];

const lessonTypeIcons: Record<string, any> = { video: Video, audio: Headphones, pdf: FileText, text: Type };

interface Lesson {
  id: string;
  title: string;
  description: string;
  lesson_type: "video" | "audio" | "pdf" | "text";
  video_url: string;
  pdf_url: string;
  content_text: string;
  sort_order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  teaching_outcomes: string;
  hours: number;
  sort_order: number;
  lessons: Lesson[];
}

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseOutcomes, setCourseOutcomes] = useState("");
  const [totalHours, setTotalHours] = useState<number>(0);

  const [modules, setModules] = useState<Module[]>([
    { id: crypto.randomUUID(), title: "Module 1", description: "", teaching_outcomes: "", hours: 0, sort_order: 0, lessons: [] },
  ]);

  const sumModuleHours = modules.reduce((s, m) => s + (Number(m.hours) || 0), 0);
  const hoursExceeded = totalHours > 0 && sumModuleHours > totalHours;

  const addModule = () => {
    setModules([...modules, {
      id: crypto.randomUUID(),
      title: `Module ${modules.length + 1}`,
      description: "",
      teaching_outcomes: "",
      hours: 0,
      sort_order: modules.length,
      lessons: [],
    }]);
  };

  const removeModule = (idx: number) => setModules(modules.filter((_, i) => i !== idx));

  const updateModule = (idx: number, field: keyof Module, value: any) => {
    const updated = [...modules];
    (updated[idx] as any)[field] = value;
    setModules(updated);
  };

  const addLesson = (modIdx: number) => {
    const updated = [...modules];
    updated[modIdx].lessons.push({
      id: crypto.randomUUID(),
      title: `Topic ${updated[modIdx].lessons.length + 1}`,
      description: "",
      lesson_type: "video",
      video_url: "",
      pdf_url: "",
      content_text: "",
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

  const handleSave = async (submitForReview = false) => {
    if (!user) return;
    if (hoursExceeded) {
      toast({ title: "Total module hours exceed course hours", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const outcomesArr = courseOutcomes.split("\n").map(s => s.trim()).filter(Boolean);
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          total_hours: totalHours || null,
          course_outcomes: outcomesArr,
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
          .insert({
            course_id: course.id,
            title: mod.title,
            description: mod.description,
            teaching_outcomes: mod.teaching_outcomes || null,
            hours: mod.hours || null,
            sort_order: mod.sort_order,
          } as any)
          .select()
          .single();

        if (modErr) throw modErr;

        if (mod.lessons.length > 0) {
          const lessonsToInsert = mod.lessons.map((les) => ({
            module_id: dbModule.id,
            title: les.title,
            description: les.description || null,
            lesson_type: les.lesson_type,
            video_url: les.video_url || null,
            pdf_url: les.pdf_url || null,
            content_text: les.content_text || null,
            is_preview: false,
            sort_order: les.sort_order,
          }));
          const { error: lesErr } = await supabase.from("course_lessons").insert(lessonsToInsert as any);
          if (lesErr) throw lesErr;
        }
      }

      if (submitForReview) {
        await supabase.from("content_reviews").insert({ course_id: course.id, status: "pending" } as any);
      }

      logActivity(submitForReview ? "course.submitted" : "course.created", "course", course.id, { title, status: submitForReview ? "pending" : "draft" });
      toast({ title: submitForReview ? "Course submitted for review!" : "Course saved as draft!" });
      navigate("/dashboard/tutor/courses");
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
        <Button variant="ghost" onClick={() => navigate("/dashboard/tutor/courses")} className="gap-2 mb-2 text-[#8C7B6B] hover:text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back to My Courses
        </Button>
        <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Create New Course</h1>
        <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
        <p className="text-sm text-[#8C7B6B] mt-2">Extra learning material created by you</p>
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

      {/* Step 1: Course Details */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
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
                <Label className={brandLabel}>Course Outcomes (one per line)</Label>
                <Textarea value={courseOutcomes} onChange={(e) => setCourseOutcomes(e.target.value)} placeholder={"Outcome 1\nOutcome 2\nOutcome 3"} rows={4} className={`mt-1 ${brandInput}`} />
              </div>
              <div>
                <Label className={brandLabel}>Description of the Course</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" rows={4} className={`mt-1 ${brandInput}`} />
              </div>
              <div>
                <Label className={brandLabel}>Total No. of Hours *</Label>
                <Input type="number" min={1} value={totalHours || ""} onChange={(e) => setTotalHours(Number(e.target.value))} className={`mt-1 ${brandInput}`} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setStep(1)}
              disabled={!title || !totalHours}
              className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Modules & Topics */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={`${brandCard} p-4 flex items-center justify-between flex-wrap gap-2`}>
            <span className="text-sm text-[#3D2E22]">
              Hours allocated: <span className="font-semibold">{sumModuleHours}</span> / {totalHours}
            </span>
            {hoursExceeded && <span className="text-xs text-red-600 font-medium">Module hours exceed course total — adjust before continuing.</span>}
          </div>

          {modules.map((mod, modIdx) => (
            <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: modIdx * 0.05 }} className={brandCard}>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-[#F5E9CE] flex items-center justify-center">
                      <GripVertical className="h-4 w-4 text-[#C49A3C]" />
                    </div>
                    <Input
                      value={mod.title}
                      onChange={(e) => updateModule(modIdx, "title", e.target.value)}
                      placeholder="Module title"
                      className="font-serif font-semibold text-lg text-[#7D1E24] border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                    />
                  </div>
                  {modules.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeModule(modIdx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label className={brandLabel}>Teaching Outcomes</Label>
                  <Textarea value={mod.teaching_outcomes} onChange={(e) => updateModule(modIdx, "teaching_outcomes", e.target.value)} rows={2} className={`mt-1 ${brandInput}`} />
                </div>
                <div>
                  <Label className={brandLabel}>Description of the Module</Label>
                  <Textarea value={mod.description} onChange={(e) => updateModule(modIdx, "description", e.target.value)} rows={2} className={`mt-1 ${brandInput}`} />
                </div>
                <div>
                  <Label className={brandLabel}>No. of Hours (≤ total)</Label>
                  <Input type="number" min={0} value={mod.hours || ""} onChange={(e) => updateModule(modIdx, "hours", Number(e.target.value))} className={`mt-1 ${brandInput}`} />
                </div>

                {/* Topics */}
                <div className="space-y-2 pl-4 border-l-2 border-[#C49A3C]/30">
                  <p className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mt-2">Topics</p>
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
                            placeholder="Topic name"
                          />
                          <Select value={les.lesson_type} onValueChange={(v) => updateLesson(modIdx, lesIdx, "lesson_type", v)}>
                            <SelectTrigger className="w-28 h-8 text-xs border-[#EDE3CC] rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="audio">Audio</SelectItem>
                              <SelectItem value="pdf">Document</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => removeLesson(modIdx, lesIdx)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <Textarea
                          value={les.description}
                          onChange={(e) => updateLesson(modIdx, lesIdx, "description", e.target.value)}
                          placeholder="Topic description"
                          rows={2}
                          className="text-xs border-[#EDE3CC] rounded-lg"
                        />
                        {les.lesson_type === "video" && (
                          <Input
                            value={les.video_url}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "video_url", e.target.value)}
                            placeholder="YouTube URL (unlisted)"
                            className="h-8 text-xs border-[#EDE3CC] rounded-lg"
                          />
                        )}
                        {les.lesson_type === "audio" && (
                          <Input
                            value={les.video_url}
                            onChange={(e) => updateLesson(modIdx, lesIdx, "video_url", e.target.value)}
                            placeholder="Audio URL"
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
                                  toast({ title: "Document uploaded!" });
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
                            placeholder="Topic text content..."
                            rows={3}
                            className="text-xs border-[#EDE3CC] rounded-lg"
                          />
                        )}
                      </div>
                    );
                  })}
                  <Button variant="ghost" size="sm" onClick={() => addLesson(modIdx)} className="gap-1 text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl">
                    <Plus className="h-3 w-3" /> Add Topic
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
            <Button onClick={() => setStep(2)} disabled={hoursExceeded} className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
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
                  ["Total Hours", String(totalHours || "—")],
                  ["Hours Allocated", `${sumModuleHours} / ${totalHours}`],
                  ["Modules", String(modules.length)],
                  ["Total Topics", String(modules.reduce((sum, m) => sum + m.lessons.length, 0))],
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
