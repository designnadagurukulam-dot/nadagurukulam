import { useQuery } from "@tanstack/react-query";
import { Download, BookCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadLessonPlanPdf } from "@/lib/lessonPlanPdf";
const db = supabase as any;
const AdminLessonPlans = () => {
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-lesson-plans"], queryFn: async () => {
    const [{ data: plans }, { data: modules }, { data: profiles }, { data: outcomes }, { data: entries }, { data: sections }] = await Promise.all([
      db.from("lesson_plans").select("*").order("created_at", { ascending: false }), db.from("curriculum_modules").select("*"), db.from("profiles").select("user_id, display_name, designation, department"), db.from("course_outcomes").select("*"), db.from("lesson_plan_entries").select("*"), db.from("curriculum_sections").select("*"),
    ]);
    return (plans || []).map((p: any) => ({ plan: p, module: (modules || []).find((m: any) => m.id === p.curriculum_module_id), teacher: (profiles || []).find((r: any) => r.user_id === p.instructor_id), outcomes: (outcomes || []).filter((o: any) => o.curriculum_module_id === p.curriculum_module_id), entries: (entries || []).filter((e: any) => e.lesson_plan_id === p.id), sections: (sections || []).filter((s: any) => s.module_id === p.curriculum_module_id) }));
  }});
  if (isLoading) return <div className="py-16 text-center text-muted-foreground">Loading lesson plans…</div>;
  return <div className="space-y-6 pt-2"><div><h1>Lesson Plans</h1><p className="text-muted-foreground">Review and download tutor lesson plans.</p></div><div className="grid gap-4 md:grid-cols-2">{data.map((item: any) => <Card key={item.plan.id}><CardContent className="p-5 flex items-center justify-between gap-4"><div><BookCheck className="h-5 w-5 text-accent mb-2" /><h3 className="text-primary">{item.module?.subject_name || "Subject"}</h3><p className="text-sm text-muted-foreground">{item.module?.course_code} · {item.teacher?.display_name || "Tutor"} · {item.plan.academic_semester}</p></div><Button onClick={() => downloadLessonPlanPdf(item)}><Download className="h-4 w-4" /> PDF</Button></CardContent></Card>)}{!data.length && <Card><CardContent className="p-10 text-center text-muted-foreground">No lesson plans yet.</CardContent></Card>}</div></div>;
};
export default AdminLessonPlans;
