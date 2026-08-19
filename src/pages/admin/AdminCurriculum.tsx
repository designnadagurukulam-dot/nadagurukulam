import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Clock, Plus, Trash2, PlayCircle, Type, X, Save, Link as LinkIcon, Target, Edit3, FolderTree, ArrowLeft, Pencil,
  Lock,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCourses from "./AdminCourses";

const getYouTubeId = (url: string): string | null => url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/)?.[1] ?? null;
const splitList = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const joinList = (v?: string[] | null) => (v || []).join("\n");
const db = supabase as any;

type LinkEntry = { url: string; label: string };
type SectionForm = { title: string; contentType: "youtube" | "text"; textContent: string; rbt_levels: string; co_mapping: string; hours_allocated: number; teaching_methodology: string; links: LinkEntry[]; topic_id: string };
const emptySection: SectionForm = { title: "", contentType: "youtube", textContent: "", rbt_levels: "", co_mapping: "", hours_allocated: 1, teaching_methodology: "", links: [{ url: "", label: "" }], topic_id: "" };

type CourseForm = {
  id?: string;
  program_id: string;
  course_code: string;
  subject_name: string;
  module_name: string;
  description: string;
  semester: number;
  credits: number;
  teaching_hours: number;
  periods: number;
  instructor_id: string;
  batch_id: string;
  assessment_cie_marks: number;
  assessment_see_marks: number;
  exam_type: string;
  cie_exam_hours: string;
  see_exam_hours: string;
  course_objectives: string;
  pedagogy: string;
  prerequisites: string;
};
const emptyCourse: CourseForm = {
  program_id: "", course_code: "", subject_name: "", module_name: "", description: "", semester: 1,
  credits: 0, teaching_hours: 0, periods: 0,
  instructor_id: "", batch_id: "",
  assessment_cie_marks: 20, assessment_see_marks: 30,
  exam_type: "Theory", cie_exam_hours: "", see_exam_hours: "",
  course_objectives: "", pedagogy: "", prerequisites: "",
};

const TO_BE_ASSIGNED = "__tba__";

const CurriculumManager = () => {
  const { user, role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const queryClient = useQueryClient();

  // Program navigation
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

  // Program CRUD
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programDraft, setProgramDraft] = useState({ id: "", name: "", slug: "", description: "", total_semesters: 8 });

  // Course CRUD
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseDraft, setCourseDraft] = useState<CourseForm>(emptyCourse);

  // Other state
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleForm, setModuleForm] = useState<any>({});
  const [coDraft, setCoDraft] = useState({ co_number: 1, description: "", rbt_levels: "", hours: 1 });
  const [addingTo, setAddingTo] = useState<{ moduleId: string; topicId: string } | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySection);
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [topicDraft, setTopicDraft] = useState({ title: "", description: "" });
  const [addingModuleTo, setAddingModuleTo] = useState<string | null>(null); // course_code being added to
  const [moduleDraft, setModuleDraft] = useState({ module_name: "", hours: 0, pedagogy: "", rbt_levels: "", co_mapping: "" });

  const { data: programs = [] } = useQuery({ queryKey: ["programs-cats"], queryFn: async () => { const { data, error } = await db.from("categories").select("*").order("name"); if (error) throw error; return data || []; } });
  const { data: modules = [], isLoading } = useQuery({ queryKey: ["curriculum-modules"], queryFn: async () => { const { data, error } = await db.from("curriculum_modules").select("*").order("semester").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: sections = [] } = useQuery({ queryKey: ["curriculum-sections"], queryFn: async () => { const { data, error } = await db.from("curriculum_sections").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: sectionLinks = [] } = useQuery({ queryKey: ["curriculum-section-links"], queryFn: async () => { const { data, error } = await db.from("curriculum_section_links").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: outcomes = [] } = useQuery({ queryKey: ["course-outcomes"], queryFn: async () => { const { data, error } = await db.from("course_outcomes").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: topics = [] } = useQuery({ queryKey: ["curriculum-topics"], queryFn: async () => { const { data, error } = await db.from("curriculum_topics").select("*").order("sort_order"); if (error) throw error; return data || []; } });
  const { data: instructors = [] } = useQuery({ queryKey: ["instructors-curr"], queryFn: async () => { const { data: roles } = await db.from("user_roles").select("user_id").eq("role", "instructor"); const ids = (roles || []).map((r: any) => r.user_id); if (!ids.length) return []; const { data } = await db.from("profiles").select("user_id, display_name").in("user_id", ids); return data || []; } });
  const { data: batches = [] } = useQuery({ queryKey: ["batches-curr"], queryFn: async () => { const { data } = await db.from("batches").select("id, name, batch_code, course_id, program_id"); return data || []; } });

  const activeProgram = programs.find((p: any) => p.id === activeProgramId);

  const resetSection = () => { setAddingTo(null); setSectionForm(emptySection); };
  const updateLink = (index: number, field: "url" | "label", value: string) => setSectionForm((p) => ({ ...p, links: p.links.map((l, i) => i === index ? { ...l, [field]: value } : l) }));
  const getLinksForSection = (id: string) => sectionLinks.filter((l: any) => l.section_id === id);
  const getSectionsForTopic = (id: string) => sections.filter((s: any) => s.topic_id === id);
  const getSectionsForModule = (id: string) => sections.filter((s: any) => s.module_id === id);
  const getTopicsForModule = (id: string) => topics.filter((t: any) => t.module_id === id);
  const getOutcomesForModule = (id: string) => outcomes.filter((o: any) => o.curriculum_module_id === id);

  // === Program mutations ===
  const saveProgram = useMutation({
    mutationFn: async () => {
      const payload: any = { name: programDraft.name, slug: programDraft.slug || programDraft.name.toLowerCase().replace(/\s+/g, "-"), description: programDraft.description || null, total_semesters: programDraft.total_semesters };
      const { error } = programDraft.id ? await db.from("categories").update(payload).eq("id", programDraft.id) : await db.from("categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["programs-cats"] }); toast({ title: programDraft.id ? "Program updated" : "Program added" }); setShowProgramForm(false); setProgramDraft({ id: "", name: "", slug: "", description: "", total_semesters: 8 }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteProgram = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["programs-cats"] }); toast({ title: "Program deleted" }); if (activeProgramId) setActiveProgramId(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // === Course (curriculum_module head) mutations ===
  const saveCourse = useMutation({
    mutationFn: async () => {
      const instr = courseDraft.instructor_id === TO_BE_ASSIGNED ? null : (courseDraft.instructor_id || null);
      const payload: any = {
        program_id: courseDraft.program_id,
        course_code: courseDraft.course_code,
        subject_name: courseDraft.subject_name,
        module_name: courseDraft.module_name || courseDraft.subject_name,
        description: courseDraft.description || null,
        semester: courseDraft.semester,
        credits: courseDraft.credits || null,
        teaching_hours: courseDraft.teaching_hours || null,
        periods: courseDraft.periods || null,
        hours: courseDraft.teaching_hours || null,
        instructor_id: instr,
        batch_id: courseDraft.batch_id || null,
        assessment_cie_marks: courseDraft.assessment_cie_marks || null,
        assessment_see_marks: courseDraft.assessment_see_marks || null,
        exam_type: courseDraft.exam_type || null,
        cie_exam_hours: courseDraft.cie_exam_hours || null,
        see_exam_hours: courseDraft.see_exam_hours || null,
        course_objectives: splitList(courseDraft.course_objectives),
        pedagogy: courseDraft.pedagogy || null,
        prerequisites: courseDraft.prerequisites || null,
      };
      let moduleId = courseDraft.id;
      if (moduleId) {
        const { error } = await db.from("curriculum_modules").update(payload).eq("id", moduleId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await db.from("curriculum_modules").insert(payload).select().single();
        if (error) throw error;
        moduleId = inserted.id;
      }
      // Mirror allocation to subject_allocations: replace any existing rows for this module with current instructor (or none)
      if (moduleId) {
        await db.from("subject_allocations").delete().eq("curriculum_module_id", moduleId);
        if (instr) {
          await db.from("subject_allocations").insert({
            instructor_id: instr,
            curriculum_module_id: moduleId,
            semester: courseDraft.semester || 1,
            academic_year: new Date().getFullYear().toString(),
          });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] }); toast({ title: courseDraft.id ? "Course updated" : "Course added" }); setShowCourseForm(false); setCourseDraft(emptyCourse); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteCourse = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("curriculum_modules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] }); toast({ title: "Course deleted" }); setActiveCourse(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // === Module-academic editor (slimmed) ===
  const saveModule = useMutation({ mutationFn: async () => {
    const { error } = await db.from("curriculum_modules").update({
      module_name: moduleForm.module_name || editingModule.module_name,
      hours: Number(moduleForm.hours) || editingModule.hours,
      pedagogy: moduleForm.pedagogy || null,
      // RBT levels + CO mapping stored in description's last line? Use dedicated fields if present
      // Reusing description column to keep slim
    }).eq("id", editingModule.id); if (error) throw error;
  }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] }); toast({ title: "Module saved" }); setEditingModule(null); }, onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });

  // === Module sub-row CRUD (now an actual sub-entity = topic with module-level metadata stored on topic.description) ===
  // For simplicity we use curriculum_topics as Module rows under each Course (curriculum_module). Topic-level rows below = curriculum_sections.
  // To avoid confusing two layers, we treat: Course = curriculum_modules row; "Modules" tab = curriculum_topics; "Topics" inside module = legacy not needed.
  // But existing UI keeps Module → Topic → Materials. To minimise migration churn, we KEEP that hierarchy and add edit/delete on topics.

  // === Topic mutations ===
  const addTopic = useMutation({
    mutationFn: async ({ moduleId, title, description }: { moduleId: string; title: string; description: string }) => {
      const existing = getTopicsForModule(moduleId);
      const { error } = await db.from("curriculum_topics").insert({ module_id: moduleId, title, description: description || null, sort_order: existing.length });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); toast({ title: "Topic added" }); setAddingTopicTo(null); setTopicDraft({ title: "", description: "" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateTopic = useMutation({
    mutationFn: async () => { const { error } = await db.from("curriculum_topics").update({ title: editingTopic.title, description: editingTopic.description || null }).eq("id", editingTopic.id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); toast({ title: "Topic updated" }); setEditingTopic(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteTopic = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("curriculum_topics").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] }); toast({ title: "Topic deleted" }); },
  });

  // === Section / Material mutations ===
  const addSection = useMutation({
    mutationFn: async (moduleId: string) => {
      const validLinks = sectionForm.links.filter((l) => l.url.trim());
      let topicId = sectionForm.topic_id;
      if (!topicId) {
        const existing = getTopicsForModule(moduleId);
        if (existing.length) topicId = existing[0].id;
        else { const { data: t, error: tErr } = await db.from("curriculum_topics").insert({ module_id: moduleId, title: "General", sort_order: 0 }).select().single(); if (tErr) throw tErr; topicId = t.id; }
      }
      const topicSections = getSectionsForTopic(topicId);
      const { data: newSection, error } = await db.from("curriculum_sections").insert({ module_id: moduleId, topic_id: topicId, title: sectionForm.title, content_type: sectionForm.contentType, youtube_url: sectionForm.contentType === "youtube" && validLinks[0] ? validLinks[0].url : null, text_content: sectionForm.contentType === "text" ? sectionForm.textContent : null, sort_order: topicSections.length + 1, created_by: user?.id, rbt_levels: sectionForm.rbt_levels || null, co_mapping: sectionForm.co_mapping || null, hours_allocated: sectionForm.hours_allocated || null, teaching_methodology: sectionForm.teaching_methodology || null }).select().single();
      if (error) throw error;
      if (sectionForm.contentType === "youtube" && validLinks.length) { const { error: linkErr } = await db.from("curriculum_section_links").insert(validLinks.map((l, i) => ({ section_id: newSection.id, url: l.url.trim(), label: l.label.trim() || null, sort_order: i }))); if (linkErr) throw linkErr; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] }); queryClient.invalidateQueries({ queryKey: ["curriculum-section-links"] }); queryClient.invalidateQueries({ queryKey: ["curriculum-topics"] }); logActivity("curriculum.section_added", "curriculum_section", undefined, { title: sectionForm.title }); toast({ title: "Material added" }); resetSection(); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteSection = useMutation({ mutationFn: async (sectionId: string) => { const { error } = await db.from("curriculum_sections").delete().eq("id", sectionId); if (error) throw error; }, onSuccess: (_, sectionId) => { queryClient.invalidateQueries({ queryKey: ["curriculum-sections"] }); logActivity("curriculum.section_deleted", "curriculum_section", sectionId); toast({ title: "Material deleted" }); } });

  const addOutcome = useMutation({ mutationFn: async () => { const { error } = await db.from("course_outcomes").insert({ curriculum_module_id: editingModule.id, co_number: coDraft.co_number, description: coDraft.description, rbt_levels: coDraft.rbt_levels || null, hours: coDraft.hours || null, sort_order: coDraft.co_number }); if (error) throw error; }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["course-outcomes"] }); setCoDraft({ co_number: coDraft.co_number + 1, description: "", rbt_levels: "", hours: 1 }); toast({ title: "Course outcome added" }); } });
  const deleteOutcome = useMutation({ mutationFn: async (id: string) => { const { error } = await db.from("course_outcomes").delete().eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["course-outcomes"] }) });

  const openCreateCourse = (sem: number) => {
    setCourseDraft({ ...emptyCourse, program_id: activeProgramId || "", semester: sem });
    setShowCourseForm(true);
  };
  const openEditCourse = (m: any) => {
    setCourseDraft({
      id: m.id,
      program_id: m.program_id || activeProgramId || "",
      course_code: m.course_code || "",
      subject_name: m.subject_name || "",
      module_name: m.module_name || "",
      description: m.description || "",
      semester: m.semester || 1,
      credits: m.credits || 0,
      teaching_hours: m.teaching_hours || m.hours || 0,
      periods: m.periods || 0,
      instructor_id: m.instructor_id || TO_BE_ASSIGNED,
      batch_id: m.batch_id || "",
      assessment_cie_marks: m.assessment_cie_marks || 20,
      assessment_see_marks: m.assessment_see_marks || 30,
      exam_type: m.exam_type || "Theory",
      cie_exam_hours: m.cie_exam_hours || "",
      see_exam_hours: m.see_exam_hours || "",
      course_objectives: joinList(m.course_objectives),
      pedagogy: m.pedagogy || "",
      prerequisites: m.prerequisites || "",
    });
    setShowCourseForm(true);
  };

  const openModuleEditor = (mod: any) => {
    setEditingModule(mod);
    setModuleForm({ module_name: mod.module_name || "", hours: mod.hours || 0, pedagogy: mod.pedagogy || "" });
    setCoDraft({ co_number: getOutcomesForModule(mod.id).length + 1, description: "", rbt_levels: "", hours: 1 });
  };

  // Programme-scoped course list grouped by semester
  const programModules = activeProgramId ? modules.filter((m: any) => m.program_id === activeProgramId) : [];
  const semesters = activeProgram ? Array.from({ length: activeProgram.total_semesters || 8 }, (_, i) => i + 1) : [];

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  // ============ PROGRAM LANDING ============
  if (!activeProgramId) {
    return (
      <div className="space-y-6 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-brand-primary">Curriculum — Programs</h1>
            <div className="mt-1 h-0.5 w-12 bg-accent" />
            <p className="mt-2 text-sm text-muted-foreground">Select a program to manage its semesters and courses.</p>
          </div>
          <Button onClick={() => { setProgramDraft({ id: "", name: "", slug: "", description: "", total_semesters: 8 }); setShowProgramForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> Add Program</Button>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-2xl bg-card p-12 text-center text-sm text-muted-foreground">No programs yet. Click <strong>Add Program</strong> above.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {programs.map((p: any) => {
              const count = modules.filter((m: any) => m.program_id === p.id).length;
              return (
                <div key={p.id} className="group relative rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition hover:shadow-[0_4px_24px_hsl(var(--primary)/0.12)]">
                  <button onClick={() => setActiveProgramId(p.id)} className="block w-full text-left">
                    <h3 className="font-display text-lg text-brand-primary">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{count} {count === 1 ? "course" : "courses"} · {p.total_semesters || 8} semesters</p>
                    {p.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  </button>
                  <div className="absolute right-3 top-3 flex opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setProgramDraft({ id: p.id, name: p.name, slug: p.slug || "", description: p.description || "", total_semesters: p.total_semesters || 8 }); setShowProgramForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete program "${p.name}"? Linked courses keep program reference but lose link.`)) deleteProgram.mutate(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Program form dialog */}
        <Dialog open={showProgramForm} onOpenChange={setShowProgramForm}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>{programDraft.id ? "Edit Program" : "Add Program"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Name *"><Input value={programDraft.name} onChange={(e) => setProgramDraft({ ...programDraft, name: e.target.value })} /></Field>
              <Field label="Slug (URL)"><Input value={programDraft.slug} onChange={(e) => setProgramDraft({ ...programDraft, slug: e.target.value })} placeholder="auto-generated from name" /></Field>
              <Field label="Description"><Textarea value={programDraft.description} onChange={(e) => setProgramDraft({ ...programDraft, description: e.target.value })} /></Field>
              <Field label="Total Semesters"><Input type="number" min={1} max={12} value={programDraft.total_semesters} onChange={(e) => setProgramDraft({ ...programDraft, total_semesters: Number(e.target.value) })} /></Field>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowProgramForm(false)}>Cancel</Button><Button onClick={() => saveProgram.mutate()} disabled={!programDraft.name}><Save className="h-4 w-4" /> Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ PROGRAM DETAIL (semesters → courses) ============
  return (
    <div className="space-y-6 pt-2">
      <Button variant="ghost" size="sm" onClick={() => { setActiveProgramId(null); setActiveCourse(null); }}><ArrowLeft className="h-4 w-4" /> All Programs</Button>
      <div className="text-center">
        <h1 className="font-display text-3xl text-brand-primary">{activeProgram?.name}</h1>
        <div className="mx-auto mt-1 h-0.5 w-16 bg-accent" />
        <p className="mt-2 text-sm text-muted-foreground">{activeProgram?.total_semesters || 8} semester program</p>
      </div>

      {activeCourse ? (
        (() => {
          const course = programModules.find((m: any) => m.id === activeCourse);
          if (!course) return null;
          return (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveCourse(null)}><ArrowLeft className="h-4 w-4" /> Back to courses</Button>
              <CourseDetail
                course={course}
                programs={programs}
                instructors={instructors}
                batches={batches}
                outcomes={outcomes}
                getOutcomesForModule={getOutcomesForModule}
                getSectionsForModule={getSectionsForModule}
                getTopicsForModule={getTopicsForModule}
                getSectionsForTopic={getSectionsForTopic}
                getLinksForSection={getLinksForSection}
                openModuleEditor={openModuleEditor}
                openEditCourse={openEditCourse}
                deleteCourse={deleteCourse}
                deleteSection={deleteSection}
                addingTo={addingTo}
                setAddingTo={setAddingTo}
                addingTopicTo={addingTopicTo}
                setAddingTopicTo={setAddingTopicTo}
                topicDraft={topicDraft}
                setTopicDraft={setTopicDraft}
                addTopic={addTopic}
                deleteTopic={deleteTopic}
                editingTopic={editingTopic}
                setEditingTopic={setEditingTopic}
                updateTopic={updateTopic}
                sectionForm={sectionForm}
                setSectionForm={setSectionForm}
                updateLink={updateLink}
                addSection={addSection}
                resetSection={resetSection}
              />
            </div>
          );
        })()
      ) : (
        <div className="space-y-6">
          {semesters.map((sem) => {
            const semCourses = programModules.filter((m: any) => m.semester === sem);
            return (
              <div key={sem} className="rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg text-brand-primary">Semester {sem}</h2>
                  <Button size="sm" variant="outline" onClick={() => openCreateCourse(sem)}><Plus className="h-4 w-4" /> Add Course</Button>
                </div>
                {semCourses.length === 0 ? (
                  <p className="rounded-xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">No courses in this semester yet.</p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {semCourses.map((c: any) => {
                      const tutorName = c.instructor_id ? (instructors.find((i: any) => i.user_id === c.instructor_id)?.display_name || "Unknown") : "To be assigned";
                      const batchName = c.batch_id ? (batches.find((b: any) => b.id === c.batch_id)?.name || "—") : "—";
                      return (
                        <AccordionItem key={c.id} value={c.id} className="border-border/50">
                          <div className="flex items-center gap-2">
                            <AccordionTrigger className="flex-1 rounded-xl px-3 text-left hover:bg-muted hover:no-underline">
                              <div className="flex flex-wrap items-center gap-2 text-left">
                                <span className="font-medium text-foreground">{c.subject_name}</span>
                                <Badge className="bg-accent/15 text-accent-foreground">{c.course_code}</Badge>
                                <span className="text-xs text-muted-foreground">· {tutorName} · Batch: {batchName}</span>
                              </div>
                            </AccordionTrigger>
                            <Button size="icon" variant="ghost" onClick={() => openEditCourse(c)} title="Edit course"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setActiveCourse(c.id)} title="Open"><BookOpen className="h-4 w-4" /></Button>
                          </div>
                          <AccordionContent className="space-y-2 pt-2 sm:pl-7">
                            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                              <div className="grid gap-1 sm:grid-cols-2">
                                <span>Credits: {c.credits || "—"} · Hours: {c.teaching_hours || c.hours || "—"} · Periods: {c.periods || "—"}</span>
                                <span>CIE/SEE: {c.assessment_cie_marks || "—"}/{c.assessment_see_marks || "—"} · {c.exam_type || "—"}</span>
                              </div>
                              <p className="mt-1">{c.description || "No description"}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setActiveCourse(c.id)}><BookOpen className="h-4 w-4" /> Open Modules & Topics</Button>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === Course form === */}
      <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{courseDraft.id ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Program *"><Select value={courseDraft.program_id} onValueChange={(program_id) => setCourseDraft({ ...courseDraft, program_id })}><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger><SelectContent>{programs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Semester *"><Select value={String(courseDraft.semester)} onValueChange={(v) => setCourseDraft({ ...courseDraft, semester: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: (programs.find((p: any) => p.id === courseDraft.program_id)?.total_semesters || 8) }, (_, i) => i + 1).map((n) => <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Course Name *"><Input value={courseDraft.subject_name} onChange={(e) => setCourseDraft({ ...courseDraft, subject_name: e.target.value })} /></Field>
              <Field label="Course Code *"><Input value={courseDraft.course_code} onChange={(e) => setCourseDraft({ ...courseDraft, course_code: e.target.value })} /></Field>
              <Field label="Credits"><Input type="number" min={0} value={courseDraft.credits} onChange={(e) => { const credits = Number(e.target.value); setCourseDraft({ ...courseDraft, credits, teaching_hours: credits * 15, periods: credits * 20 }); }} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={<span className="flex items-center gap-1">Teaching hours {!isSuperAdmin && <Lock className="h-3 w-3" />}</span> as any}><Input type="number" value={courseDraft.teaching_hours} readOnly={!isSuperAdmin} onChange={(e) => setCourseDraft({ ...courseDraft, teaching_hours: Number(e.target.value) })} /></Field>
                <Field label={<span className="flex items-center gap-1">Periods {!isSuperAdmin && <Lock className="h-3 w-3" />}</span> as any}><Input type="number" value={courseDraft.periods} readOnly={!isSuperAdmin} onChange={(e) => setCourseDraft({ ...courseDraft, periods: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Assigned Faculty"><Select value={courseDraft.instructor_id || TO_BE_ASSIGNED} onValueChange={(instructor_id) => setCourseDraft({ ...courseDraft, instructor_id })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={TO_BE_ASSIGNED}>To be assigned</SelectItem>{instructors.map((i: any) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || i.user_id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Assigned Batch"><Select value={courseDraft.batch_id} onValueChange={(batch_id) => setCourseDraft({ ...courseDraft, batch_id })}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent>{batches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="CIE marks"><Input type="number" value={courseDraft.assessment_cie_marks} onChange={(e) => setCourseDraft({ ...courseDraft, assessment_cie_marks: Number(e.target.value) })} /></Field>
              <Field label="SEE marks"><Input type="number" value={courseDraft.assessment_see_marks} onChange={(e) => setCourseDraft({ ...courseDraft, assessment_see_marks: Number(e.target.value) })} /></Field>
              <Field label="Examination type"><Input value={courseDraft.exam_type} onChange={(e) => setCourseDraft({ ...courseDraft, exam_type: e.target.value })} placeholder="Theory / Practical / Viva" /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="CIE exam duration"><Input value={courseDraft.cie_exam_hours} onChange={(e) => setCourseDraft({ ...courseDraft, cie_exam_hours: e.target.value })} placeholder="e.g. 1h 30m" /></Field>
                <Field label="SEE exam duration"><Input value={courseDraft.see_exam_hours} onChange={(e) => setCourseDraft({ ...courseDraft, see_exam_hours: e.target.value })} placeholder="e.g. 3h" /></Field>
              </div>
            </div>
            <Field label="Course Objectives (one per line)"><Textarea rows={4} value={courseDraft.course_objectives} onChange={(e) => setCourseDraft({ ...courseDraft, course_objectives: e.target.value })} /></Field>
            <Field label="Pedagogy"><Textarea rows={3} value={courseDraft.pedagogy} onChange={(e) => setCourseDraft({ ...courseDraft, pedagogy: e.target.value })} /></Field>
            <Field label="Prerequisites (if any)"><Textarea rows={3} value={courseDraft.prerequisites} onChange={(e) => setCourseDraft({ ...courseDraft, prerequisites: e.target.value })} placeholder="One per line" /></Field>
            <Field label="Description"><Textarea rows={3} value={courseDraft.description} onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCourseForm(false)}>Cancel</Button><Button onClick={() => saveCourse.mutate()} disabled={!courseDraft.course_code || !courseDraft.subject_name || !courseDraft.program_id}><Save className="h-4 w-4" /> Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Module academic + Course Outcomes editor (slim) === */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Edit Module — {editingModule?.module_name}</DialogTitle></DialogHeader>
          {editingModule && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Module Name"><Input value={moduleForm.module_name} onChange={(e) => setModuleForm({ ...moduleForm, module_name: e.target.value })} /></Field>
                <Field label="Hours"><Input type="number" value={moduleForm.hours} onChange={(e) => setModuleForm({ ...moduleForm, hours: e.target.value })} /></Field>
                <Field label="Teaching methodology"><Input value={moduleForm.pedagogy} onChange={(e) => setModuleForm({ ...moduleForm, pedagogy: e.target.value })} /></Field>
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

      {/* === Topic Edit dialog === */}
      <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Edit Topic</DialogTitle></DialogHeader>
          {editingTopic && (
            <div className="space-y-3">
              <Field label="Topic title *"><Input value={editingTopic.title} onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })} /></Field>
              <Field label="Description"><Textarea value={editingTopic.description || ""} onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditingTopic(null)}>Cancel</Button><Button onClick={() => updateTopic.mutate()} disabled={!editingTopic?.title}><Save className="h-4 w-4" /> Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) => (
  <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">{label}</label>{children}</div>
);

// === CourseDetail subcomponent ===
const CourseDetail = ({ course, programs, instructors, batches, outcomes, getOutcomesForModule, getSectionsForModule, getTopicsForModule, getSectionsForTopic, getLinksForSection, openModuleEditor, openEditCourse, deleteCourse, deleteSection, addingTo, setAddingTo, addingTopicTo, setAddingTopicTo, topicDraft, setTopicDraft, addTopic, deleteTopic, editingTopic, setEditingTopic, updateTopic, sectionForm, setSectionForm, updateLink, addSection, resetSection }: any) => {
  const tutor = course.instructor_id ? (instructors.find((i: any) => i.user_id === course.instructor_id)?.display_name || "Unknown") : "To be assigned";
  const batchName = course.batch_id ? (batches.find((b: any) => b.id === course.batch_id)?.name || "—") : "—";
  const courseOutcomes = outcomes.filter((o: any) => o.curriculum_module_id === course.id);
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl text-brand-primary">{course.subject_name}</h3>
              <Badge className="bg-accent/15 text-accent-foreground">{course.course_code}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Faculty: {tutor} · Batch: {batchName} · Sem {course.semester}</p>
            <p className="mt-1 text-xs text-muted-foreground">Credits: {course.credits || "—"} · Hours: {course.teaching_hours || course.hours || "—"} · Periods: {course.periods || "—"} · CIE/SEE: {course.assessment_cie_marks || "—"}/{course.assessment_see_marks || "—"} · {course.exam_type || "—"}</p>
            {courseOutcomes.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Course Outcomes</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {courseOutcomes.map((o: any) => <li key={o.id}><Badge variant="outline" className="mr-2">CO{o.co_number}</Badge>{o.description}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => openEditCourse(course)}><Pencil className="h-4 w-4" /> Edit Course</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this course?")) deleteCourse.mutate(course.id); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 p-5 pt-3">
        <Accordion type="multiple" className="w-full">
          {/* Course is itself the curriculum_modules row; treat its topics as "Modules" for content authoring */}
          {[course].map((mod: any) => {
            const modTopics = getTopicsForModule(mod.id);
            const allModSections = getSectionsForModule(mod.id);
            return (
              <AccordionItem key={mod.id} value={mod.id} className="border-border/50">
                <AccordionTrigger className="rounded-xl px-3 text-left hover:bg-muted hover:no-underline">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15"><BookOpen className="h-4 w-4 text-accent" /></span>
                    <span className="font-medium text-foreground">Modules & Topics</span>
                    <Badge variant="secondary">{modTopics.length} topics</Badge>
                    <Badge variant="outline">{allModSections.length} materials</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 sm:pl-7">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => openModuleEditor(mod)}><Edit3 className="h-4 w-4" /> Module academic fields</Button>
                  </div>
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
                            <Button variant="ghost" size="icon" onClick={() => setEditingTopic({ ...topic })} title="Edit topic"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete this topic and all its materials?")) deleteTopic.mutate(topic.id); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        {topic.description && <p className="mb-2 text-xs text-muted-foreground">{topic.description}</p>}
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
                          {addingTo?.moduleId === mod.id && addingTo?.topicId === topic.id && (
                            <AddMaterialForm sectionForm={sectionForm} setSectionForm={setSectionForm} updateLink={updateLink} resetSection={resetSection} onSave={() => { setSectionForm({ ...sectionForm, topic_id: topic.id }); addSection.mutate(mod.id); }} pending={addSection.isPending} />
                          )}
                        </div>
                      </div>
                    );
                  })}
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

const AdminCurriculum = () => (
  <div className="space-y-4 pt-2">
    <Tabs defaultValue="curriculum" className="w-full">
      <TabsList className="rounded-xl border border-brand-parchment bg-brand-cream p-1">
        <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white">Curriculum</TabsTrigger>
        <TabsTrigger value="faculty-courses" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white">Faculty's Courses</TabsTrigger>
      </TabsList>
      <TabsContent value="curriculum" className="mt-2">
        <CurriculumManager />
      </TabsContent>
      <TabsContent value="faculty-courses" className="mt-2">
        <AdminCourses />
      </TabsContent>
    </Tabs>
  </div>
);

export default AdminCurriculum;
