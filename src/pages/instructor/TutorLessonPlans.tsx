import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCheck, Download, Save, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { downloadLessonPlanPdf } from "@/lib/lessonPlanPdf";
import { toast } from "sonner";

const db = supabase as any;
type RowDraft = { curriculum_section_id?: string; actual_date?: string; faculty_remarks?: string; topic_title?: string; rbt_level?: string; co_mapping?: string };

const TutorLessonPlans = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [header, setHeader] = useState({ academic_semester: "", section: "", contact_hours_per_week: 3, total_periods: 60, is_published: false });
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["tutor-lesson-plan-data", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: allocations } = await db.from("subject_allocations").select("curriculum_module_id").eq("instructor_id", user!.id);
      const ids = [...new Set((allocations || []).map((a: any) => a.curriculum_module_id).filter(Boolean))];
      if (!ids.length) return [];
      const [{ data: modules }, { data: sections }, { data: plans }, { data: outcomes }, { data: logs }] = await Promise.all([
        db.from("curriculum_modules").select("*").in("id", ids).order("semester"),
        db.from("curriculum_sections").select("*").in("module_id", ids).order("sort_order"),
        db.from("lesson_plans").select("*").eq("instructor_id", user!.id).in("curriculum_module_id", ids),
        db.from("course_outcomes").select("*").in("curriculum_module_id", ids).order("sort_order"),
        db.from("class_logs").select("*").eq("instructor_id", user!.id),
      ]);
      const planIds = (plans || []).map((p: any) => p.id);
      const { data: entries } = planIds.length ? await db.from("lesson_plan_entries").select("*").in("lesson_plan_id", planIds).order("lecture_number") : { data: [] };
      return (modules || []).map((m: any) => {
        const plan = (plans || []).find((p: any) => p.curriculum_module_id === m.id);
        return { module: m, sections: (sections || []).filter((s: any) => s.module_id === m.id), plan, outcomes: (outcomes || []).filter((o: any) => o.curriculum_module_id === m.id), entries: (entries || []).filter((e: any) => e.lesson_plan_id === plan?.id), logs: logs || [] };
      });
    },
  });

  const active = useMemo(() => data.find((d: any) => d.module.id === activeModuleId) || data[0], [data, activeModuleId]);

  useEffect(() => {
    if (!active) return;
    setHeader({ academic_semester: active.plan?.academic_semester || `Semester ${active.module.semester}`, section: active.plan?.section || "", contact_hours_per_week: active.plan?.contact_hours_per_week || 3, total_periods: active.plan?.total_periods || 60, is_published: !!active.plan?.is_published });
    const next: Record<number, RowDraft> = {};
    Array.from({ length: active.plan?.total_periods || 60 }, (_, i) => i + 1).forEach((lecture) => {
      const entry = active.entries.find((e: any) => e.lecture_number === lecture) || {};
      const logged = active.logs.find((l: any) => l.curriculum_section_id === entry.curriculum_section_id);
      next[lecture] = { curriculum_section_id: entry.curriculum_section_id || "", actual_date: entry.actual_date || logged?.date || "", faculty_remarks: entry.faculty_remarks || "", topic_title: entry.topic_title || "", rbt_level: entry.rbt_level || "", co_mapping: entry.co_mapping || "" };
    });
    setDrafts(next);
  }, [active?.module?.id, active?.plan?.id]);

  const ensurePlan = async (moduleId: string) => {
    const item = data.find((d: any) => d.module.id === moduleId);
    if (item.plan) {
      const { error } = await db.from("lesson_plans").update(header).eq("id", item.plan.id);
      if (error) throw error;
      return item.plan;
    }
    const { data: created, error } = await db.from("lesson_plans").insert({ curriculum_module_id: moduleId, instructor_id: user!.id, ...header }).select().single();
    if (error) throw error;
    return created;
  };

  const saveHeader = useMutation({ mutationFn: async () => ensurePlan(active.module.id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutor-lesson-plan-data"] }); toast.success("Header saved"); }, onError: (e: any) => toast.error(e.message) });

  const saveRow = useMutation({
    mutationFn: async ({ lecture }: { lecture: number }) => {
      const plan = await ensurePlan(active.module.id);
      const row = drafts[lecture] || {};
      const section = active.sections.find((s: any) => s.id === row.curriculum_section_id);
      const payload = { lesson_plan_id: plan.id, lecture_number: lecture, module_number: active.module.sort_order || 1, curriculum_section_id: row.curriculum_section_id || null, topic_title: row.topic_title || section?.title || null, rbt_level: row.rbt_level || section?.rbt_levels || null, co_mapping: row.co_mapping || section?.co_mapping || null, actual_date: row.actual_date || null, faculty_remarks: row.faculty_remarks || null };
      const { error } = await db.from("lesson_plan_entries").upsert(payload, { onConflict: "lesson_plan_id,lecture_number" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutor-lesson-plan-data"] }); toast.success("Lecture saved"); }, onError: (e: any) => toast.error(e.message),
  });

  const saveAll = useMutation({ mutationFn: async () => { for (const lecture of Object.keys(drafts).map(Number)) await saveRow.mutateAsync({ lecture }); }, onSuccess: () => toast.success("All lectures saved") });

  const updateDraft = (lecture: number, patch: RowDraft) => setDrafts((prev) => ({ ...prev, [lecture]: { ...prev[lecture], ...patch } }));
  const selectSection = (lecture: number, sectionId: string) => { const section = active.sections.find((s: any) => s.id === sectionId); const logged = active.logs.find((l: any) => l.curriculum_section_id === sectionId); updateDraft(lecture, { curriculum_section_id: sectionId, topic_title: section?.title || "", rbt_level: section?.rbt_levels || "", co_mapping: section?.co_mapping || "", actual_date: drafts[lecture]?.actual_date || logged?.date || "" }); };

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">Loading lesson plans…</div>;
  if (!data.length) return <div className="brand-card rounded-2xl p-10 text-center"><h1>Lesson Plans</h1><p className="text-muted-foreground">No allocated subjects found.</p></div>;

  const entries = active?.entries || [];
  const done = entries.filter((e: any) => e.actual_date).length;
  const total = header.total_periods || 60;

  return <div className="space-y-6 pt-2">
    <div><h1 className="font-display text-brand-primary">Lesson Plans</h1><p className="text-sm text-muted-foreground">Maintain lecture-wise plans for assigned subjects.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{data.map((d: any) => { const count = d.entries.filter((e: any) => e.actual_date).length; const periods = d.plan?.total_periods || 60; return <Card key={d.module.id} className={`cursor-pointer border-0 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] ${active?.module.id === d.module.id ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveModuleId(d.module.id)}><CardContent className="p-5"><BookCheck className="mb-3 h-5 w-5 text-accent" /><h3 className="font-display text-brand-primary">{d.module.subject_name}</h3><p className="text-sm text-muted-foreground">{d.module.course_code} · Sem {d.module.semester}</p><p className="mt-3 text-sm font-semibold text-brand-primary">{Math.round((count / periods) * 100)}% Completed</p></CardContent></Card>; })}</div>

    {active && <Card className="border-0 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]"><CardContent className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h2 className="font-display text-xl text-brand-primary">{active.module.course_code} — {active.module.subject_name}</h2><p className="text-sm text-muted-foreground">Teacher: {profile?.display_name || "Tutor"}</p><div className="mt-3 flex flex-wrap gap-2"><Badge>{total} periods</Badge><Badge variant="secondary">{header.contact_hours_per_week} hrs/week</Badge><Badge variant="secondary">{Math.round((done / total) * 100)}% complete</Badge></div></div><Button onClick={() => downloadLessonPlanPdf({ plan: active.plan || header, module: active.module, teacher: profile, outcomes: active.outcomes, sections: active.sections, entries })}><Download className="h-4 w-4" /> Download PDF</Button></div>
      <div className="grid gap-3 md:grid-cols-5"><Input value={header.academic_semester} onChange={(e) => setHeader({ ...header, academic_semester: e.target.value })} placeholder="Academic semester" /><Input value={header.section} onChange={(e) => setHeader({ ...header, section: e.target.value })} placeholder="Section" /><Input type="number" value={header.contact_hours_per_week} onChange={(e) => setHeader({ ...header, contact_hours_per_week: Number(e.target.value) })} placeholder="Hrs/week" /><Input type="number" value={header.total_periods} onChange={(e) => setHeader({ ...header, total_periods: Number(e.target.value) })} placeholder="Total periods" /><div className="flex items-center gap-2"><Switch checked={header.is_published} onCheckedChange={(is_published) => setHeader({ ...header, is_published })} /><Label>Published</Label></div></div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => saveHeader.mutate()} disabled={saveHeader.isPending}><Save className="h-4 w-4" /> Save Header</Button><Button variant="outline" onClick={() => saveAll.mutate()} disabled={saveAll.isPending}><CheckCircle2 className="h-4 w-4" /> Save All Rows</Button></div>
      <div className="hidden overflow-x-auto lg:block"><table className="min-w-full text-sm"><thead><tr className="bg-primary text-primary-foreground"><th className="p-2 text-left">Period</th><th className="p-2 text-left">Topic</th><th className="p-2 text-left">RBT</th><th className="p-2 text-left">CO</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Remarks</th><th className="p-2">Save</th></tr></thead><tbody>{Array.from({ length: total }, (_, i) => { const lecture = i + 1; const row = drafts[lecture] || {}; return <tr key={lecture} className="border-b"><td className="p-2 font-medium">{lecture}</td><td className="p-2"><Select value={row.curriculum_section_id || ""} onValueChange={(v) => selectSection(lecture, v)}><SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger><SelectContent>{active.sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title} · {s.co_mapping || "CO"}</SelectItem>)}</SelectContent></Select></td><td className="p-2"><Input value={row.rbt_level || ""} onChange={(e) => updateDraft(lecture, { rbt_level: e.target.value })} /></td><td className="p-2"><Input value={row.co_mapping || ""} onChange={(e) => updateDraft(lecture, { co_mapping: e.target.value })} /></td><td className="p-2"><Input type="date" value={row.actual_date || ""} onChange={(e) => updateDraft(lecture, { actual_date: e.target.value })} /></td><td className="p-2"><Textarea value={row.faculty_remarks || ""} onChange={(e) => updateDraft(lecture, { faculty_remarks: e.target.value })} className="min-h-10" /></td><td className="p-2"><Button size="sm" onClick={() => saveRow.mutate({ lecture })}><Save className="h-3 w-3" /></Button></td></tr>; })}</tbody></table></div>
      <div className="space-y-3 lg:hidden">{Array.from({ length: total }, (_, i) => { const lecture = i + 1; const row = drafts[lecture] || {}; return <div key={lecture} className="rounded-xl bg-muted p-3 space-y-3"><div className="flex items-center justify-between"><b>Period {lecture}</b><Button size="sm" onClick={() => saveRow.mutate({ lecture })}><Save className="h-3 w-3" /></Button></div><Select value={row.curriculum_section_id || ""} onValueChange={(v) => selectSection(lecture, v)}><SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger><SelectContent>{active.sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent></Select><div className="grid grid-cols-2 gap-2"><Input placeholder="RBT" value={row.rbt_level || ""} onChange={(e) => updateDraft(lecture, { rbt_level: e.target.value })} /><Input placeholder="CO" value={row.co_mapping || ""} onChange={(e) => updateDraft(lecture, { co_mapping: e.target.value })} /></div><Input type="date" value={row.actual_date || ""} onChange={(e) => updateDraft(lecture, { actual_date: e.target.value })} /><Textarea placeholder="Remarks" value={row.faculty_remarks || ""} onChange={(e) => updateDraft(lecture, { faculty_remarks: e.target.value })} /></div>; })}</div>
    </CardContent></Card>}
  </div>;
};
export default TutorLessonPlans;
