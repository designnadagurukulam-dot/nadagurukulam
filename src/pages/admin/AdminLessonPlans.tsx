import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookCheck, Download, Eye, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadLessonPlanPdf } from "@/lib/lessonPlanPdf";

const db = supabase as any;
const ALL = "all";

const AdminLessonPlans = () => {
  const [tutor, setTutor] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [semester, setSemester] = useState(ALL);
  const [published, setPublished] = useState(ALL);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-lesson-plans"],
    queryFn: async () => {
      const [{ data: plans }, { data: modules }, { data: profiles }, { data: outcomes }, { data: entries }, { data: sections }] = await Promise.all([
        db.from("lesson_plans").select("*").order("created_at", { ascending: false }),
        db.from("curriculum_modules").select("*"),
        db.from("profiles").select("user_id, display_name, designation, department"),
        db.from("course_outcomes").select("*").order("sort_order"),
        db.from("lesson_plan_entries").select("*").order("lecture_number"),
        db.from("curriculum_sections").select("*").order("sort_order"),
      ]);
      return (plans || []).map((p: any) => ({
        plan: p,
        module: (modules || []).find((m: any) => m.id === p.curriculum_module_id),
        teacher: (profiles || []).find((r: any) => r.user_id === p.instructor_id),
        outcomes: (outcomes || []).filter((o: any) => o.curriculum_module_id === p.curriculum_module_id),
        entries: (entries || []).filter((e: any) => e.lesson_plan_id === p.id),
        sections: (sections || []).filter((s: any) => s.module_id === p.curriculum_module_id),
      }));
    },
  });

  const tutors = useMemo(() => [...new Map(data.map((i: any) => [i.teacher?.user_id, i.teacher]).filter(([id]: any) => id)).values()], [data]);
  const subjects = useMemo(() => [...new Map(data.map((i: any) => [i.module?.id, i.module]).filter(([id]: any) => id)).values()], [data]);
  const semesters = useMemo(() => [...new Set(data.map((i: any) => i.plan?.academic_semester || `Semester ${i.module?.semester || ""}`).filter(Boolean))], [data]);

  const filtered = data.filter((item: any) => {
    const text = `${item.module?.subject_name || ""} ${item.module?.course_code || ""} ${item.teacher?.display_name || ""}`.toLowerCase();
    return (tutor === ALL || item.teacher?.user_id === tutor)
      && (subject === ALL || item.module?.id === subject)
      && (semester === ALL || (item.plan?.academic_semester || `Semester ${item.module?.semester}`) === semester)
      && (published === ALL || String(!!item.plan?.is_published) === published)
      && (!query || text.includes(query.toLowerCase()));
  });

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">Loading lesson plans…</div>;

  return <div className="space-y-6 pt-2">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><h1 className="font-display text-brand-primary">Lesson Plans</h1><p className="text-sm text-muted-foreground">Review tutor lesson plans, lecture completion, and academic metadata.</p></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={tutor} onValueChange={setTutor}><SelectTrigger><SelectValue placeholder="Faculty" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All tutors</SelectItem>{tutors.map((t: any) => <SelectItem key={t.user_id} value={t.user_id}>{t.display_name || "Faculty"}</SelectItem>)}</SelectContent></Select>
        <Select value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All subjects</SelectItem>{subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent></Select>
        <Select value={semester} onValueChange={setSemester}><SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All semesters</SelectItem>{semesters.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={published} onValueChange={setPublished}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All status</SelectItem><SelectItem value="true">Published</SelectItem><SelectItem value="false">Unpublished</SelectItem></SelectContent></Select>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((item: any) => {
        const total = item.plan.total_periods || 60;
        const done = item.entries.filter((e: any) => e.actual_date).length;
        return <Card key={item.plan.id} className="border-0 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]"><CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3"><div><BookCheck className="h-5 w-5 text-accent mb-2" /><h3 className="font-display text-lg text-brand-primary">{item.module?.subject_name || "Subject"}</h3><p className="text-sm text-muted-foreground">{item.module?.course_code} · {item.teacher?.display_name || "Faculty"}</p></div><Badge variant={item.plan.is_published ? "default" : "secondary"}>{item.plan.is_published ? "Published" : "Draft"}</Badge></div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg bg-muted p-2"><p className="font-semibold text-brand-primary">{total}</p><p className="text-xs text-muted-foreground">Periods</p></div><div className="rounded-lg bg-muted p-2"><p className="font-semibold text-brand-primary">{done}</p><p className="text-xs text-muted-foreground">Logged</p></div><div className="rounded-lg bg-muted p-2"><p className="font-semibold text-brand-primary">{Math.round((done / total) * 100)}%</p><p className="text-xs text-muted-foreground">Done</p></div></div>
          <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /> Details</Button><Button className="flex-1" onClick={() => downloadLessonPlanPdf(item)}><Download className="h-4 w-4" /> PDF</Button></div>
        </CardContent></Card>;
      })}
      {!filtered.length && <Card className="border-0 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] md:col-span-2 xl:col-span-3"><CardContent className="p-10 text-center text-muted-foreground"><Filter className="mx-auto mb-3 h-8 w-8 opacity-40" />No lesson plans match your filters.</CardContent></Card>}
    </div>

    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle className="font-display text-brand-primary">{selected?.module?.subject_name} Lesson Plan</DialogTitle></DialogHeader>{selected && <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4 text-sm"><div><b>Course</b><p>{selected.module?.course_code}</p></div><div><b>Faculty</b><p>{selected.teacher?.display_name || "—"}</p></div><div><b>Semester</b><p>{selected.plan?.academic_semester || `Semester ${selected.module?.semester}`}</p></div><div><b>Contact Hours</b><p>{selected.plan?.contact_hours_per_week || 3}/week</p></div></div>
      <div><h3 className="font-semibold text-brand-primary mb-2">Course Outcomes</h3><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">CO</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">RBT</th><th className="p-2 text-left">Hours</th></tr></thead><tbody>{selected.outcomes.map((o: any) => <tr key={o.id} className="border-b"><td className="p-2">CO{o.co_number}</td><td className="p-2">{o.description}</td><td className="p-2">{o.rbt_levels || "—"}</td><td className="p-2">{o.hours || "—"}</td></tr>)}</tbody></table></div></div>
      <div><h3 className="font-semibold text-brand-primary mb-2">Lecture Log</h3><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Period</th><th className="p-2 text-left">Topic</th><th className="p-2 text-left">RBT</th><th className="p-2 text-left">CO</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Remarks</th></tr></thead><tbody>{selected.entries.map((e: any) => <tr key={e.id} className="border-b"><td className="p-2">{e.lecture_number}</td><td className="p-2">{e.topic_title || "—"}</td><td className="p-2">{e.rbt_level || "—"}</td><td className="p-2">{e.co_mapping || "—"}</td><td className="p-2">{e.actual_date || "—"}</td><td className="p-2">{e.faculty_remarks || "—"}</td></tr>)}</tbody></table></div></div>
    </div>}</DialogContent></Dialog>
  </div>;
};
export default AdminLessonPlans;
