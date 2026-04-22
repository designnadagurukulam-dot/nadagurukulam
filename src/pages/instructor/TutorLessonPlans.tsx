import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCheck, Download, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadLessonPlanPdf } from "@/lib/lessonPlanPdf";
import { toast } from "sonner";

const db = supabase as any;

const TutorLessonPlans = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["tutor-lesson-plan-data", user?.id],
    enabled: !!user,
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
      return (modules || []).map((m: any) => ({ module: m, sections: (sections || []).filter((s: any) => s.module_id === m.id), plan: (plans || []).find((p: any) => p.curriculum_module_id === m.id), outcomes: (outcomes || []).filter((o: any) => o.curriculum_module_id === m.id), entries: entries || [], logs: logs || [] }));
    },
  });

  const active = useMemo(() => data.find((d: any) => d.module.id === activeModuleId) || data[0], [data, activeModuleId]);

  const savePlan = useMutation({
    mutationFn: async ({ moduleId, lecture, sectionId, remarks, date }: any) => {
      const item = data.find((d: any) => d.module.id === moduleId);
      const section = item.sections.find((s: any) => s.id === sectionId);
      let plan = item.plan;
      if (!plan) {
        const { data: created, error } = await db.from("lesson_plans").insert({ curriculum_module_id: moduleId, instructor_id: user!.id, academic_semester: `Semester ${item.module.semester}`, total_periods: 60 }).select().single();
        if (error) throw error;
        plan = created;
      }
      const { error } = await db.from("lesson_plan_entries").upsert({ lesson_plan_id: plan.id, lecture_number: lecture, module_number: item.module.sort_order || 1, curriculum_section_id: sectionId, topic_title: section?.title || null, rbt_level: section?.rbt_levels || null, co_mapping: section?.co_mapping || null, actual_date: date || null, faculty_remarks: remarks || null }, { onConflict: "lesson_plan_id,lecture_number" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutor-lesson-plan-data"] }); toast.success("Lesson plan saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">Loading lesson plans…</div>;
  if (!data.length) return <div className="brand-card rounded-2xl p-10 text-center"><h1>Lesson Plans</h1><p className="text-muted-foreground">No allocated subjects found.</p></div>;

  return <div className="space-y-6 pt-2">
    <div><h1>Lesson Plans</h1><p className="text-muted-foreground">Maintain lecture-wise plans for assigned subjects.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{data.map((d: any) => {
      const done = d.entries.filter((e: any) => e.lesson_plan_id === d.plan?.id && e.actual_date).length;
      return <Card key={d.module.id} className="cursor-pointer" onClick={() => setActiveModuleId(d.module.id)}><CardContent className="p-5"><BookCheck className="h-5 w-5 text-accent mb-3" /><h3 className="text-primary">{d.module.subject_name}</h3><p className="text-sm text-muted-foreground">{d.module.course_code} · Sem {d.module.semester}</p><p className="mt-3 text-sm font-semibold text-primary">{Math.round((done / (d.plan?.total_periods || 60)) * 100)}% Completed</p></CardContent></Card>;
    })}</div>
    {active && <Card><CardContent className="p-5 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2>{active.module.course_code} — {active.module.subject_name}</h2><p className="text-muted-foreground">Teacher: {profile?.display_name || "Tutor"}</p></div><Button onClick={() => downloadLessonPlanPdf({ plan: active.plan || { total_periods: 60, academic_semester: `Semester ${active.module.semester}` }, module: active.module, teacher: profile, outcomes: active.outcomes, sections: active.sections, entries: active.entries.filter((e: any) => e.lesson_plan_id === active.plan?.id) })}><Download className="h-4 w-4" /> Download PDF</Button></div>
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="bg-primary text-primary-foreground"><th className="p-2">Period</th><th className="p-2">Topic</th><th className="p-2">Date</th><th className="p-2">Remarks</th><th className="p-2">Save</th></tr></thead><tbody>{Array.from({ length: active.plan?.total_periods || 60 }, (_, i) => {
        const lecture = i + 1; const entry = active.entries.find((e: any) => e.lesson_plan_id === active.plan?.id && e.lecture_number === lecture) || {}; const logged = active.logs.find((l: any) => l.curriculum_section_id === entry.curriculum_section_id);
        return <tr key={lecture} className="border-b"><td className="p-2">{lecture}</td><td className="p-2"><Select defaultValue={entry.curriculum_section_id || ""} onValueChange={(v) => (entry.curriculum_section_id = v)}><SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger><SelectContent>{active.sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title} · {s.co_mapping || "CO"}</SelectItem>)}</SelectContent></Select></td><td className="p-2"><Input type="date" defaultValue={entry.actual_date || logged?.date || ""} onChange={(e) => (entry.actual_date = e.target.value)} /></td><td className="p-2"><Textarea defaultValue={entry.faculty_remarks || ""} onChange={(e) => (entry.faculty_remarks = e.target.value)} className="min-h-10" /></td><td className="p-2"><Button size="sm" onClick={() => savePlan.mutate({ moduleId: active.module.id, lecture, sectionId: entry.curriculum_section_id, remarks: entry.faculty_remarks, date: entry.actual_date || logged?.date })}><Save className="h-3 w-3" /></Button></td></tr>;
      })}</tbody></table></div></CardContent></Card>}
  </div>;
};
export default TutorLessonPlans;
