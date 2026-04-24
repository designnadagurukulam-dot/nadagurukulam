import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Plus, Trash2, PlayCircle, Type, X, Save, Link as LinkIcon, Target, Edit3, FolderTree, ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const getYouTubeId = (url: string): string | null => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/)?.[1] ?? null;
const splitList = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const joinList = (v?: string[] | null) => (v || []).join("\n");
const db = supabase as any;

type LinkEntry = { url: string; label: string };
type SectionForm = { title: string; contentType: "youtube" | "text"; textContent: string; rbt_levels: string; co_mapping: string; hours_allocated: number; teaching_methodology: string; links: LinkEntry[]; topic_id: string };
const emptySection: SectionForm = { title: "", contentType: "youtube", textContent: "", rbt_levels: "", co_mapping: "", hours_allocated: 1, teaching_methodology: "", links: [{ url: "", label: "" }], topic_id: "" };

type CourseForm = { course_code: string; subject_name: string; module_name: string; description: string; hours: number; semester: number };

const AdminCurriculum = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState<{ moduleId: string; topicId: string } | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySection);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleForm, setModuleForm] = useState<any>({});
  const [coDraft, setCoDraft] = useState({ co_number: 1, description: "", rbt_levels: "", hours: 1 });

  // New — course/topic state
  const [openCourseSemester, setOpenCourseSemester] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>({ course_code: "", subject_name: "", module_name: "", description: "", hours: 0, semester: 1 });
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState({ title: "", description: "" });
  const [activeCourse, setActiveCourse] = useState<string | null>(null); // courseCode being viewed in detail

  const { data: modules = [], isLoading } = useQuery({ queryKey: ["curriculum-modules"], queryFn: async () => { const { data, error } = await db.from("curriculum_modules").select("*").order("semester").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: sections = [] } = useQuery({ queryKey: ["curriculum-sections"], queryFn: async () => { const { data, error } = await db.from("curriculum_sections").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: sectionLinks = [] } = useQuery({ queryKey: ["curriculum-section-links"], queryFn: async () => { const { data, error } = await db.from("curriculum_section_links").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: outcomes = [] } = useQuery({ queryKey: ["course-outcomes"], queryFn: async () => { const { data, error } = await db.from("course_outcomes").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: topics = [] } = useQuery({ queryKey: ["curriculum-topics"], queryFn: async () => { const { data, error } = await db.from("curriculum_topics").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: allocations = [] } = useQuery({ queryKey: ["subject-allocations-curr"], queryFn: async () => { const { data } = await db.from("subject_allocations").select("*"); return data || []; } });
  const { data: instructors = [] } = useQuery({ queryKey: ["instructors-curr"], queryFn: async () => { const { data: roles } = await db.from("user_roles").select("user_id").eq("role", "instructor"); const ids = (roles || []).map((r: any) => r.user_id); if (!ids.length) return []; const { data } = await db.from("profiles").select("user_id, display_name").in("user_id", ids); return data || []; } });
  const { data: batches = [] } = useQuery({ queryKey: ["batches-curr"], queryFn: async () => { const { data } = await db.from("batches").select("id, name, batch_code, course_id"); return data || []; } });

  const resetSection = () => { setAddingTo(null); setSectionForm(emptySection); };
  const updateLink = (index: number, field: "url" | "label", value: string) => setSectionForm((p) => ({ ...p, links: p.links.map((l, i) => i === index ? { ...l, [field]: value } : l) }));
  const getLinksForSection = (sectionId: string) => sectionLinks.filter((l: any) => l.section_id === sectionId);
  const getSectionsForModule = (moduleId: string) => sections.filter((s: any) => s.module_id === moduleId);
  const getSectionsForTopic = (topicId: string) => sections.filter((s: any) => s.topic_id === topicId);
  const getTopicsForModule = (moduleId: string) => topics.filter((t: any) => t.module_id === moduleId);
  const getOutcomesForModule = (moduleId: string) => outcomes.filter((o: any) => o.curriculum_module_id === moduleId);

  const addSection = useMutation({
    mutationFn: async (moduleId: string) => {
      const validLinks = sectionForm.links.filter((l) => l.url.trim());
      let topicId = sectionForm.topic_id;
      // Ensure a topic exists
      if (!topicId) {
        const existing = getTopicsForModule(moduleId);
        if (existing.length) topicId = existing[0].id;
        else {
          const { data: t, error: tErr } = await db.from("curriculum_topics").insert({ module_id: moduleId, title: "General", sort_order: 0 }).select().single();
          if (tErr) throw tErr;
          topicId = t.id;
        }
      }
      const topicSections = getSectionsForTopic(topicId);
      const { data: newSection, error } = await db.from("curriculum_sections").insert({ module_id: moduleId, topic_id: topicId, title: sectionForm.title, content_type: sectionForm.contentType, youtube_url: sectionForm.contentType === "youtube" && validLinks[0] ? validLinks[0].url : null, text_content: sectionForm.contentType === "text" ? sectionForm.textContent : null, sort_order: topicSections.length + 1, created_by: user?.id, rbt_levels: sectionForm.rbt_levels || null, co_mapping: sectionForm.co_mapping || null, hours_allocated: sectionForm.hours_allocated || null, teaching_methodology: sectionForm.teaching_methodology || null }).select().single();
      if (error) throw error;
      if (sectionForm.contentType === "youtube" && validLinks.length) { const { error: linkErr } = await db.from("curriculum_section_links").insert(validLinks.map((l, i) => ({ section_id: newSection.id, url: l.url.trim(), label: l.label.trim() || null, sort_order: i }))); if (linkErr) throw linkErr; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] }); queryClient.invalidateQueries({ queryKey: ["curriculum-section-links"] }); queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); logActivity("curriculum.section_added", "curriculum_section", undefined, { title: sectionForm.title }); toast({ title: "Material added" }); resetSection(); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSection = useMutation({ mutationFn: async (sectionId: string) => { const { error } = await db.from("curriculum_sections").delete().eq("id", sectionId); if (error) throw error; }, onSuccess: (_, sectionId) => { queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] }); logActivity("curriculum.section_deleted", "curriculum_section", sectionId); toast({ title: "Material deleted" }); } });

  const addTopic = useMutation({
    mutationFn: async ({ moduleId, title, description }: { moduleId: string; title: string; description: string }) => {
      const existing = getTopicsForModule(moduleId);
      const { error } = await db.from("curriculum_topics").insert({ module_id: moduleId, title, description: description || null, sort_order: existing.length });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); toast({ title: "Topic added" }); setAddingTopicTo(null); setTopicDraft({ title: "", description: "" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTopic = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("curriculum_topics").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] }); toast({ title: "Topic deleted" }); },
  });

  const addCourse = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("curriculum_modules").insert({ course_code: courseForm.course_code, subject_name: courseForm.subject_name, module_name: courseForm.module_name || courseForm.subject_name, description: courseForm.description || null, hours: courseForm.hours || null, semester: courseForm.semester });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] }); toast({ title: "Course added" }); setOpenCourseSemester(null); setCourseForm({ course_code: "", subject_name: "", module_name: "", description: "", hours: 0, semester: 1 }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveModule = useMutation({ mutationFn: async () => { const { error } = await db.from("curriculum_modules").update({ course_objectives: splitList(moduleForm.course_objectives || ""), pedagogy: moduleForm.pedagogy || null, assessment_cie_marks: Number(moduleForm.assessment_cie_marks) || null, assessment_see_marks: Number(moduleForm.assessment_see_marks) || null, exam_hours: moduleForm.exam_hours || null, references_list: splitList(moduleForm.references_list || ""), module_name: moduleForm.module_name || editingModule.module_name, description: moduleForm.description ?? editingModule.description, hours: Number(moduleForm.hours) || editingModule.hours }).eq("id", editingModule.id); if (error) throw error; }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] }); toast({ title: "Module saved" }); }, onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const addOutcome = useMutation({ mutationFn: async () => { const { error } = await db.from("course_outcomes").insert({ curriculum_module_id: editingModule.id, co_number: coDraft.co_number, description: coDraft.description, rbt_levels: coDraft.rbt_levels || null, hours: coDraft.hours || null, sort_order: coDraft.co_number }); if (error) throw error; }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["course-outcomes"] }); setCoDraft({ co_number: coDraft.co_number + 1, description: "", rbt_levels: "", hours: 1 }); toast({ title: "Course outcome added" }); } });
  const deleteOutcome = useMutation({ mutationFn: async (id: string) => { const { error } = await db.from("course_outcomes").delete().eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-outcomes"] }) });

  const openModuleEditor = (mod: any) => { setEditingModule(mod); setModuleForm({ module_name: mod.module_name || "", description: mod.description || "", hours: mod.hours || 0, course_objectives: joinList(mod.course_objectives), pedagogy: mod.pedagogy || "", assessment_cie_marks: mod.assessment_cie_marks || 20, assessment_see_marks: mod.assessment_see_marks || 30, exam_hours: mod.exam_hours || "", references_list: joinList(mod.references_list) }); setCoDraft({ co_number: getOutcomesForModule(mod.id).length + 1, description: "", rbt_levels: "", hours: 1 }); };
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const hasAdditional = modules.some((m: any) => m.semester === 9);
  const getSubjectsForSemester = (sem: number) => Object.values(modules.filter((m: any) => m.semester === sem).reduce((acc: any, m: any) => { const key = `${m.course_code}-${m.subject_name}`; acc[key] = acc[key] || { courseCode: m.course_code, subjectName: m.subject_name, modules: [], totalHours: 0 }; acc[key].modules.push(m); acc[key].totalHours += m.hours || 0; return acc; }, {}));

  // Helpers for course-tile metadata
  const getTutorsForCourseCode = (code: string) => {
    const courseModuleIds = modules.filter((m: any) => m.course_code === code).map((m: any) => m.id);
    const tutorIds = [...new Set(allocations.filter((a: any) => courseModuleIds.includes(a.curriculum_module_id)).map((a: any) => a.instructor_id))];
    return tutorIds.map((id) => instructors.find((p: any) => p.user_id === id)?.display_name).filter(Boolean);
  };
  const getBatchesForCourseCode = (code: string) => {
    // Match by curriculum_modules.batch_id (legacy) — fallback to course title equality
    const courseModuleBatchIds = modules.filter((m: any) => m.course_code === code).map((m: any) => m.batch_id).filter(Boolean);
    return batches.filter((b: any) => courseModuleBatchIds.includes(b.id)).map((b: any) => b.batch_code || b.name);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="font-display text-brand-primary">Curriculum Management</h1>
        <div className="mt-1 h-0.5 w-12 bg-accent" />
        <p className="mt-2 text-sm text-muted-foreground">Hierarchy: Semester → Course → Module → Topic → Materials.</p>
      </div>

      <Tabs defaultValue="1" className="w-full">
        <TabsList className="mb-6 flex h-auto flex-wrap gap-1 rounded-xl bg-muted p-1.5">
          {[...semesters, ...(hasAdditional ? [9] : [])].map((s) => (
            <TabsTrigger key={s} value={String(s)} className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold">{s === 9 ? "Additional" : `Sem ${s}`}</TabsTrigger>
          ))}
        </TabsList>

        {[...semesters, ...(hasAdditional ? [9] : [])].map((sem) => (
          <TabsContent key={sem} value={String(sem)} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-brand-primary">{sem === 9 ? "Additional Courses" : `Semester ${sem} Courses`}</h2>
              <Button size="sm" variant="outline" onClick={() => { setOpenCourseSemester(sem); setCourseForm({ ...courseForm, semester: sem }); }}>
                <Plus className="h-4 w-4" /> Add Course
              </Button>
            </div>

            {activeCourse ? (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setActiveCourse(null)}><ArrowLeft className="h-4 w-4" /> Back to courses</Button>
                {getSubjectsForSemester(sem).filter((s: any) => s.courseCode === activeCourse).map((subject: any) => (
                  <CourseDetail key={subject.courseCode} subject={subject} {...{ getOutcomesForModule, getSectionsForModule, getTopicsForModule, getSectionsForTopic, getLinksForSection, openModuleEditor, deleteSection, addingTo, setAddingTo, addingTopicTo, setAddingTopicTo, topicDraft, setTopicDraft, addTopic, deleteTopic, sectionForm, setSectionForm, updateLink, addSection, resetSection }} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {getSubjectsForSemester(sem).length === 0 && <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">No courses in this semester yet. Click <strong>Add Course</strong> above.</div>}
                {getSubjectsForSemester(sem).map((subject: any) => {
                  const tutors = getTutorsForCourseCode(subject.courseCode);
                  const batchNames = getBatchesForCourseCode(subject.courseCode);
                  return (
                    <button key={subject.courseCode} onClick={() => setActiveCourse(subject.courseCode)} className="w-full rounded-2xl bg-card p-5 text-left shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition hover:shadow-[0_4px_24px_hsl(var(--primary)/0.12)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-lg text-brand-primary">{subject.subjectName}</h3>
                            <Badge className="bg-accent/15 text-accent-foreground">{subject.courseCode}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Assigned to: {tutors.length ? tutors.join(", ") : "— Unassigned"}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Batches: {batchNames.length ? batchNames.join(", ") : "— None"}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-accent" /> {subject.totalHours}h</span>
                          <span className="flex items-center gap-1"><FolderTree className="h-4 w-4 text-accent" /> {subject.modules.length} modules</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Course dialog */}
      <Dialog open={openCourseSemester !== null} onOpenChange={(open) => !open && setOpenCourseSemester(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Add Course — Semester {openCourseSemester}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Course Code (e.g. NG101)" value={courseForm.course_code} onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })} />
            <Input placeholder="Subject Name" value={courseForm.subject_name} onChange={(e) => setCourseForm({ ...courseForm, subject_name: e.target.value })} />
            <Input placeholder="First Module Name (e.g. Introduction)" value={courseForm.module_name} onChange={(e) => setCourseForm({ ...courseForm, module_name: e.target.value })} />
            <Textarea placeholder="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
            <Input type="number" placeholder="Hours" value={courseForm.hours} onChange={(e) => setCourseForm({ ...courseForm, hours: Number(e.target.value) })} />
            <Button onClick={() => addCourse.mutate()} disabled={!courseForm.course_code || !courseForm.subject_name || addCourse.isPending} className="w-full"><Save className="h-4 w-4" /> Save Course</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module academic-fields editor */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Edit Module — {editingModule?.module_name}</DialogTitle></DialogHeader>
          {editingModule && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Module Name</Label><Input value={moduleForm.module_name} onChange={(e) => setModuleForm({ ...moduleForm, module_name: e.target.value })} /></div>
                <div><Label>Hours</Label><Input type="number" value={moduleForm.hours} onChange={(e) => setModuleForm({ ...moduleForm, hours: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} /></div>
                <div><Label>Course Objectives (one per line)</Label><Textarea rows={5} value={moduleForm.course_objectives} onChange={(e) => setModuleForm({ ...moduleForm, course_objectives: e.target.value })} /></div>
                <div><Label>References (one per line)</Label><Textarea rows={5} value={moduleForm.references_list} onChange={(e) => setModuleForm({ ...moduleForm, references_list: e.target.value })} /></div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Input placeholder="Pedagogy" value={moduleForm.pedagogy} onChange={(e) => setModuleForm({ ...moduleForm, pedagogy: e.target.value })} />
                <Input type="number" placeholder="CIE marks" value={moduleForm.assessment_cie_marks} onChange={(e) => setModuleForm({ ...moduleForm, assessment_cie_marks: e.target.value })} />
                <Input type="number" placeholder="SEE marks" value={moduleForm.assessment_see_marks} onChange={(e) => setModuleForm({ ...moduleForm, assessment_see_marks: e.target.value })} />
                <Input placeholder="Exam hours" value={moduleForm.exam_hours} onChange={(e) => setModuleForm({ ...moduleForm, exam_hours: e.target.value })} />
              </div>
              <Button onClick={() => saveModule.mutate()}><Save className="h-4 w-4" /> Save Module</Button>
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-brand-primary"><Target className="h-4 w-4" /> Course Outcomes</h3>
                {getOutcomesForModule(editingModule.id).map((o: any) => (
                  <div key={o.id} className="flex items-start gap-3 rounded-xl bg-muted p-3">
                    <Badge>CO{o.co_number}</Badge>
                    <div className="flex-1"><p className="text-sm font-medium">{o.description}</p><p className="text-xs text-muted-foreground">RBT: {o.rbt_levels || "—"} · Hours: {o.hours || "—"}</p></div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteOutcome.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="grid gap-2 rounded-xl bg-muted p-3 md:grid-cols-[80px_1fr_140px_100px_auto]">
                  <Input type="number" value={coDraft.co_number} onChange={(e) => setCoDraft({ ...coDraft, co_number: Number(e.target.value) })} />
                  <Input placeholder="Outcome description" value={coDraft.description} onChange={(e) => setCoDraft({ ...coDraft, description: e.target.value })} />
                  <Input placeholder="RBT levels" value={coDraft.rbt_levels} onChange={(e) => setCoDraft({ ...coDraft, rbt_levels: e.target.value })} />
                  <Input type="number" value={coDraft.hours} onChange={(e) => setCoDraft({ ...coDraft, hours: Number(e.target.value) })} />
                  <Button disabled={!coDraft.description} onClick={() => addOutcome.mutate()}><Plus className="h-4 w-4" /> Add</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// === CourseDetail subcomponent: shows modules → topics → materials ===
const CourseDetail = ({ subject, getOutcomesForModule, getSectionsForModule, getTopicsForModule, getSectionsForTopic, getLinksForSection, openModuleEditor, deleteSection, addingTo, setAddingTo, addingTopicTo, setAddingTopicTo, topicDraft, setTopicDraft, addTopic, deleteTopic, sectionForm, setSectionForm, updateLink, addSection, resetSection }: any) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
      <div className="p-5 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-brand-primary">{subject.subjectName}</h3>
            <Badge className="mt-1 bg-accent/15 text-accent-foreground">{subject.courseCode}</Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4 text-accent" /> {subject.totalHours}h</div>
        </div>
      </div>
      <div className="px-5 pb-5">
        <Accordion type="multiple" className="w-full">
          {subject.modules.map((mod: any) => {
            const modTopics = getTopicsForModule(mod.id);
            const allModSections = getSectionsForModule(mod.id);
            const modOutcomes = getOutcomesForModule(mod.id);
            return (
              <AccordionItem key={mod.id} value={mod.id} className="border-border/50">
                <AccordionTrigger className="rounded-xl px-3 text-left hover:bg-muted hover:no-underline">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15"><BookOpen className="h-4 w-4 text-accent" /></span>
                    <span className="font-medium text-foreground">{mod.module_name}</span>
                    <Badge variant="secondary">{modTopics.length} topics</Badge>
                    <Badge variant="outline">{allModSections.length} materials</Badge>
                    <Badge variant="outline">{modOutcomes.length} COs</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 sm:pl-7">
                  <div className="rounded-xl bg-muted/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">{mod.description || "No description"}</p>
                      <Button variant="outline" size="sm" onClick={() => openModuleEditor(mod)}><Edit3 className="h-4 w-4" /> Edit Module</Button>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                      <span>Pedagogy: {mod.pedagogy || "—"}</span>
                      <span>CIE/SEE: {mod.assessment_cie_marks || "—"}/{mod.assessment_see_marks || "—"}</span>
                      <span>Exam: {mod.exam_hours || "—"}</span>
                    </div>
                  </div>

                  {/* TOPICS */}
                  {modTopics.map((topic: any) => {
                    const topicSections = getSectionsForTopic(topic.id);
                    return (
                      <div key={topic.id} className="rounded-xl border border-border bg-background/40 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FolderTree className="h-4 w-4 text-brand-gold" />
                            <span className="text-sm font-semibold text-brand-primary">{topic.title}</span>
                            <Badge variant="outline">{topicSections.length} materials</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setAddingTo({ moduleId: mod.id, topicId: topic.id })}><Plus className="h-3.5 w-3.5" /> Material</Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete this topic and all its materials?")) deleteTopic.mutate(topic.id); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>

                        {/* MATERIALS for this topic */}
                        <div className="space-y-2">
                          {topicSections.map((section: any) => {
                            const links = getLinksForSection(section.id);
                            const displayLinks = links.length ? links : section.youtube_url ? [{ id: "legacy", url: section.youtube_url, label: null }] : [];
                            return (
                              <div key={section.id} className="rounded-lg bg-muted p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      {section.content_type === "youtube" ? <PlayCircle className="h-4 w-4 text-destructive" /> : <Type className="h-4 w-4 text-muted-foreground" />}
                                      <span className="truncate text-sm font-medium">{section.title}</span>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {section.rbt_levels && <Badge variant="outline" className="text-[10px]">RBT: {section.rbt_levels}</Badge>}
                                      {section.co_mapping && <Badge variant="outline" className="text-[10px]">CO: {section.co_mapping}</Badge>}
                                      {section.hours_allocated ? <Badge variant="outline" className="text-[10px]">{section.hours_allocated}h</Badge> : null}
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSection.mutate(section.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                {/* YouTube-style thumbnail tiles */}
                                {section.content_type === "youtube" && displayLinks.length > 0 && (
                                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                    {displayLinks.map((link: any, idx: number) => {
                                      const ytId = getYouTubeId(link.url);
                                      if (ytId) {
                                        return (
                                          <a key={link.id || idx} href={link.url} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-lg bg-background shadow-sm transition hover:shadow-md">
                                            <div className="relative aspect-video bg-muted">
                                              <img src={`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`} alt={link.label || "Video thumbnail"} className="h-full w-full object-cover" loading="lazy" />
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100"><PlayCircle className="h-8 w-8 text-white" /></div>
                                            </div>
                                            <p className="truncate p-1.5 text-[11px] font-medium text-foreground">{link.label || "Watch"}</p>
                                          </a>
                                        );
                                      }
                                      return (
                                        <a key={link.id || idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-background p-2 text-xs text-primary underline">
                                          <LinkIcon className="h-3 w-3" /> {link.label || link.url}
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                {section.content_type === "text" && section.text_content && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{section.text_content}</p>}
                              </div>
                            );
                          })}

                          {/* Add Material form (scoped to this topic) */}
                          {addingTo?.moduleId === mod.id && addingTo?.topicId === topic.id && (
                            <AddMaterialForm sectionForm={sectionForm} setSectionForm={setSectionForm} updateLink={updateLink} resetSection={resetSection} onSave={() => { setSectionForm({ ...sectionForm, topic_id: topic.id }); addSection.mutate(mod.id); }} pending={addSection.isPending} />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Topic */}
                  {addingTopicTo === mod.id ? (
                    <div className="space-y-2 rounded-xl bg-accent/5 p-3 ring-1 ring-accent/30">
                      <Input placeholder="Topic title" value={topicDraft.title} onChange={(e) => setTopicDraft({ ...topicDraft, title: e.target.value })} />
                      <Textarea placeholder="Description (optional)" value={topicDraft.description} onChange={(e) => setTopicDraft({ ...topicDraft, description: e.target.value })} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addTopic.mutate({ moduleId: mod.id, title: topicDraft.title, description: topicDraft.description })} disabled={!topicDraft.title}><Save className="h-4 w-4" /> Save Topic</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAddingTopicTo(null); setTopicDraft({ title: "", description: "" }); }}><X className="h-4 w-4" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setAddingTopicTo(mod.id)}><Plus className="h-4 w-4" /> Add Topic</Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};

const AddMaterialForm = ({ sectionForm, setSectionForm, updateLink, resetSection, onSave, pending }: any) => (
  <div className="space-y-3 rounded-lg bg-accent/5 p-3 ring-1 ring-accent/30">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-brand-primary">New Material</span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetSection}><X className="h-4 w-4" /></Button>
    </div>
    <Input placeholder="Material title" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} />
    <div className="grid gap-2 sm:grid-cols-4">
      <Select value={sectionForm.contentType} onValueChange={(v) => setSectionForm({ ...sectionForm, contentType: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="youtube">Video / Links</SelectItem>
          <SelectItem value="text">Text Content</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="RBT" value={sectionForm.rbt_levels} onChange={(e) => setSectionForm({ ...sectionForm, rbt_levels: e.target.value })} />
      <Input placeholder="CO" value={sectionForm.co_mapping} onChange={(e) => setSectionForm({ ...sectionForm, co_mapping: e.target.value })} />
      <Input type="number" min={1} placeholder="Hours" value={sectionForm.hours_allocated} onChange={(e) => setSectionForm({ ...sectionForm, hours_allocated: Number(e.target.value) })} />
    </div>
    {sectionForm.contentType === "youtube" ? (
      <div className="space-y-2">
        {sectionForm.links.map((link: any, idx: number) => (
          <div key={idx} className="space-y-1.5 rounded-lg bg-background p-2">
            <Input placeholder="Label (optional)" value={link.label} onChange={(e) => updateLink(idx, "label", e.target.value)} />
            <Input placeholder="YouTube URL" value={link.url} onChange={(e) => updateLink(idx, "url", e.target.value)} />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setSectionForm((p: any) => ({ ...p, links: [...p.links, { url: "", label: "" }] }))}><Plus className="h-4 w-4" /> Add Link</Button>
      </div>
    ) : (
      <Textarea placeholder="Enter text content..." value={sectionForm.textContent} onChange={(e) => setSectionForm({ ...sectionForm, textContent: e.target.value })} rows={4} />
    )}
    <Button onClick={onSave} disabled={!sectionForm.title || pending}><Save className="h-4 w-4" /> {pending ? "Saving..." : "Save Material"}</Button>
  </div>
);

export default AdminCurriculum;
