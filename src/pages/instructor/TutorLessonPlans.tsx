import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCheck, Download, Save, CheckCircle2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadLessonPlanPdf } from "@/lib/lessonPlanPdf";
import { toast } from "sonner";

const db = supabase as any;
type RowDraft = { curriculum_section_id?: string; topic_title?: string; co_mapping?: string; faculty_remarks?: string };

const semParity = (sem?: number) => (sem ? (sem % 2 === 1 ? "Odd Semester" : "Even Semester") : "—");

const TutorLessonPlans = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [contentDelivery, setContentDelivery] = useState("");
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["tutor-lesson-plan-data", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: allocations } = await db.from("subject_allocations").select("*").eq("instructor_id", user!.id);
      const ids = [...new Set((allocations || []).map((a: any) => a.curriculum_module_id).filter(Boolean))];
      if (!ids.length) return [];
      const [{ data: modules }, { data: sections }, { data: topics }, { data: plans }, { data: outcomes }, { data: logs }, { data: programs }] = await Promise.all([
        db.from("curriculum_modules").select("*").in("id", ids).order("semester"),
        db.from("curriculum_sections").select("*").in("module_id", ids).order("sort_order"),
        db.from("curriculum_topics").select("*").in("module_id", ids).order("sort_order"),
        db.from("lesson_plans").select("*").eq("instructor_id", user!.id).in("curriculum_module_id", ids),
        db.from("course_outcomes").select("*").in("curriculum_module_id", ids).order("co_number"),
        db.from("class_logs").select("*").eq("instructor_id", user!.id),
        db.from("categories").select("id,name"),
      ]);
      const planIds = (plans || []).map((p: any) => p.id);
      const { data: entries } = planIds.length ? await db.from("lesson_plan_entries").select("*").in("lesson_plan_id", planIds).order("lecture_number") : { data: [] };
      return (modules || []).map((m: any) => {
        const plan = (plans || []).find((p: any) => p.curriculum_module_id === m.id);
        const allocation = (allocations || []).find((a: any) => a.curriculum_module_id === m.id);
        const program = (programs || []).find((p: any) => p.id === m.program_id);
        return {
          module: m, allocation, program,
          sections: (sections || []).filter((s: any) => s.module_id === m.id),
          topics: (topics || []).filter((t: any) => t.module_id === m.id),
          plan,
          outcomes: (outcomes || []).filter((o: any) => o.curriculum_module_id === m.id),
          entries: (entries || []).filter((e: any) => e.lesson_plan_id === plan?.id),
          logs: logs || [],
        };
      });
    },
  });

  const active = useMemo(() => data.find((d: any) => d.module.id === activeModuleId) || data[0], [data, activeModuleId]);
  const totalPeriods = active?.module?.periods || active?.plan?.total_periods || 60;
  const contactHours = active?.module?.teaching_hours || active?.module?.periods || active?.plan?.contact_hours_per_week || 3;

  useEffect(() => {
    if (!active) return;
    setContentDelivery(active.plan?.content_delivery_methods || active.module?.pedagogy || "");
    const next: Record<number, RowDraft> = {};
    Array.from({ length: totalPeriods }, (_, i) => i + 1).forEach((lecture) => {
      const entry = active.entries.find((e: any) => e.lecture_number === lecture) || {};
      next[lecture] = {
        curriculum_section_id: entry.curriculum_section_id || "",
        topic_title: entry.topic_title || "",
        co_mapping: entry.co_mapping || "",
        faculty_remarks: entry.faculty_remarks || "",
      };
    });
    setDrafts(next);
  }, [active?.module?.id, active?.plan?.id, totalPeriods]);

  const ensurePlan = async () => {
    if (active.plan) {
      const { error } = await db.from("lesson_plans").update({
        content_delivery_methods: contentDelivery,
        academic_semester: semParity(active.module.semester),
        contact_hours_per_week: contactHours,
        total_periods: totalPeriods,
      }).eq("id", active.plan.id);
      if (error) throw error;
      return active.plan;
    }
    const { data: created, error } = await db.from("lesson_plans").insert({
      curriculum_module_id: active.module.id,
      instructor_id: user!.id,
      academic_semester: semParity(active.module.semester),
      contact_hours_per_week: contactHours,
      total_periods: totalPeriods,
      content_delivery_methods: contentDelivery,
    }).select().single();
    if (error) throw error;
    return created;
  };

  const saveHeader = useMutation({
    mutationFn: ensurePlan,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutor-lesson-plan-data"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Date is auto-populated from class_logs - not editable here
  const findLoggedDate = (sectionId?: string, topicTitle?: string) => {
    if (!active) return "";
    const log = active.logs.find((l: any) =>
      (sectionId && l.curriculum_section_id === sectionId) ||
      (topicTitle && l.topic_covered && l.topic_covered.toLowerCase() === topicTitle.toLowerCase())
    );
    return log?.date || "";
  };

  const saveRow = useMutation({
    mutationFn: async ({ lecture }: { lecture: number }) => {
      const plan = await ensurePlan();
      const row = drafts[lecture] || {};
      const section = active.sections.find((s: any) => s.id === row.curriculum_section_id);
      const topic = active.topics.find((t: any) => t.title === row.topic_title);
      const actualDate = findLoggedDate(row.curriculum_section_id, row.topic_title);
      const payload = {
        lesson_plan_id: plan.id,
        lecture_number: lecture,
        module_number: active.module.sort_order || 1,
        curriculum_section_id: row.curriculum_section_id || null,
        topic_title: row.topic_title || section?.title || topic?.title || null,
        rbt_level: section?.rbt_levels || active.module.exam_type || null,
        co_mapping: row.co_mapping || null,
        actual_date: actualDate || null,
        faculty_remarks: row.faculty_remarks || null,
      };
      const { error } = await db.from("lesson_plan_entries").upsert(payload, { onConflict: "lesson_plan_id,lecture_number" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutor-lesson-plan-data"] }); toast.success("Lecture saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveAll = useMutation({
    mutationFn: async () => { for (const lecture of Object.keys(drafts).map(Number)) await saveRow.mutateAsync({ lecture }); },
    onSuccess: () => toast.success("All lectures saved"),
  });

  const updateDraft = (lecture: number, patch: RowDraft) => setDrafts((p) => ({ ...p, [lecture]: { ...p[lecture], ...patch } }));

  // When selecting a topic, find matching section (if any) for RBT auto-fill
  const selectTopic = (lecture: number, topicTitle: string) => {
    const section = active.sections.find((s: any) => s.title === topicTitle);
    updateDraft(lecture, { topic_title: topicTitle, curriculum_section_id: section?.id || "" });
  };

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">Loading lesson plans…</div>;
  if (!data.length) return <div className="brand-card rounded-2xl p-10 text-center"><h1>Lesson Plans</h1><p className="text-muted-foreground">No allocated subjects found.</p></div>;

  const m = active?.module;
  const header = [
    ["Academic Semester", semParity(m?.semester)],
    ["Academic Year", active?.allocation?.academic_year || "—"],
    ["Semester No.", m?.semester ?? "—"],
    ["Program", active?.program?.name || "—"],
    ["Course Code", m?.course_code || "—"],
    ["Contact Hrs / Week", contactHours],
    ["Course Name", m?.subject_name || m?.module_name || "—"],
    ["No. of Credits", m?.credits ?? "—"],
    ["Instructor Name", profile?.display_name || "—"],
    ["Designation", (profile as any)?.designation || "—"],
    ["CIE Marks", m?.assessment_cie_marks ?? "—"],
    ["SEE Marks", m?.assessment_see_marks ?? "—"],
    ["Exam Hours", m?.exam_hours || m?.cie_exam_hours || m?.see_exam_hours || "—"],
  ];

  const done = (active?.entries || []).filter((e: any) => e.actual_date).length;
  const coCount = active?.outcomes?.length || 0;

  return <div className="space-y-6 pt-2">
    <div><h1 className="font-display text-brand-primary">Lesson Plans</h1><p className="text-sm text-muted-foreground">Maintain lecture-wise plans for assigned subjects.</p></div>

    <div className="grid gap-4 md:grid-cols-3">
      {data.map((d: any) => {
        const periods = d.module?.periods || d.plan?.total_periods || 60;
        const count = d.entries.filter((e: any) => e.actual_date).length;
        return <Card key={d.module.id} className={`cursor-pointer border-0 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] ${active?.module.id === d.module.id ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveModuleId(d.module.id)}>
          <CardContent className="p-5">
            <BookCheck className="mb-3 h-5 w-5 text-accent" />
            <h3 className="font-display text-brand-primary">{d.module.subject_name}</h3>
            <p className="text-sm text-muted-foreground">{d.module.course_code} · Sem {d.module.semester}</p>
            <p className="mt-3 text-sm font-semibold text-brand-primary">{Math.round((count / periods) * 100)}% Completed</p>
          </CardContent>
        </Card>;
      })}
    </div>

    {active && <Card className="border-0 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]"><CardContent className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-xl text-brand-primary">{m.course_code} — {m.subject_name}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{totalPeriods} periods</Badge>
            <Badge variant="secondary">{contactHours} hrs/week</Badge>
            <Badge variant="secondary">{Math.round((done / totalPeriods) * 100)}% complete</Badge>
          </div>
        </div>
        <Button onClick={() => downloadLessonPlanPdf({
          plan: { ...(active.plan || {}), content_delivery_methods: contentDelivery, academic_semester: semParity(m.semester), contact_hours_per_week: contactHours, total_periods: totalPeriods },
          module: m, teacher: profile, outcomes: active.outcomes, sections: active.sections, entries: active.entries,
          program: active.program, allocation: active.allocation, topics: active.topics,
        })}><Download className="h-4 w-4" /> Download PDF</Button>
      </div>

      {/* Header table (read-only) */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <tbody>
            {Array.from({ length: Math.ceil(header.length / 2) }, (_, i) => (
              <tr key={i} className="border-b">
                {[header[i * 2], header[i * 2 + 1]].filter(Boolean).map(([k, v]) => (
                  <>
                    <td className="border-r bg-muted/50 p-2 font-semibold w-1/4">{k}</td>
                    <td className="border-r p-2 w-1/4">{String(v)}</td>
                  </>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prerequisites */}
      <section>
        <h3 className="font-display text-brand-primary mb-2">Prerequisites (if any)</h3>
        <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap min-h-[3rem]">{m.prerequisites || "—"}</div>
      </section>

      {/* Content Delivery Methods - editable */}
      <section>
        <h3 className="font-display text-brand-primary mb-2 flex items-center gap-2">Content Delivery Methods <Badge variant="outline" className="text-xs">Editable</Badge></h3>
        <Textarea rows={3} value={contentDelivery} onChange={(e) => setContentDelivery(e.target.value)} placeholder="e.g. Chalk and talk, demonstrations, group practice…" />
        <div className="mt-2"><Button size="sm" onClick={() => saveHeader.mutate()} disabled={saveHeader.isPending}><Save className="h-4 w-4" /> Save</Button></div>
      </section>

      {/* Course Syllabus */}
      <section>
        <h3 className="font-display text-brand-primary mb-2">Course Syllabus (As prescribed by SSSUHE)</h3>
        <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
          {m.description && <p className="whitespace-pre-wrap">{m.description}</p>}
          {Array.isArray(m.course_objectives) && m.course_objectives.length > 0 && (
            <div>
              <div className="font-semibold mt-2">Course Objectives</div>
              <ul className="list-disc pl-5">{m.course_objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}</ul>
            </div>
          )}
          {active.topics.length > 0 && (
            <div>
              <div className="font-semibold mt-2">Topics</div>
              <ul className="list-disc pl-5">{active.topics.map((t: any) => <li key={t.id}>{t.title}{t.description ? ` — ${t.description}` : ""}</li>)}</ul>
            </div>
          )}
          {!m.description && !(m.course_objectives?.length) && !active.topics.length && <span className="text-muted-foreground">—</span>}
        </div>
      </section>

      {/* Course Outcomes */}
      <section>
        <h3 className="font-display text-brand-primary mb-2">Course Outcomes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead><tr className="bg-primary text-primary-foreground"><th className="p-2 text-left">CO#</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">RBT Levels</th><th className="p-2 text-left">Hours</th></tr></thead>
            <tbody>
              {active.outcomes.length === 0 && <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">No course outcomes added by admin.</td></tr>}
              {active.outcomes.map((o: any) => (
                <tr key={o.id} className="border-b">
                  <td className="p-2 font-semibold">CO{o.co_number}</td>
                  <td className="p-2">{o.description}</td>
                  <td className="p-2">{o.rbt_levels || "—"}</td>
                  <td className="p-2">{o.hours || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lesson Plan Grid */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-brand-primary">Lesson Plan</h3>
          <Button variant="outline" size="sm" onClick={() => saveAll.mutate()} disabled={saveAll.isPending}><CheckCircle2 className="h-4 w-4" /> Save All</Button>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full border text-sm">
            <thead><tr className="bg-primary text-primary-foreground">
              <th className="p-2 text-left">Period</th>
              <th className="p-2 text-left">Module Name</th>
              <th className="p-2 text-left">Topic</th>
              <th className="p-2 text-left">RBT Levels</th>
              <th className="p-2 text-left">CO Mapping</th>
              <th className="p-2 text-left">Actual Date</th>
              <th className="p-2 text-left">Faculty Sign</th>
              <th className="p-2 text-left">Remarks</th>
              <th className="p-2"></th>
            </tr></thead>
            <tbody>
              {Array.from({ length: totalPeriods }, (_, i) => {
                const lecture = i + 1;
                const row = drafts[lecture] || {};
                const section = active.sections.find((s: any) => s.id === row.curriculum_section_id) || active.sections.find((s: any) => s.title === row.topic_title);
                const moduleName = m.module_name;
                const rbt = section?.rbt_levels || "—";
                const actualDate = findLoggedDate(row.curriculum_section_id, row.topic_title);
                return <tr key={lecture} className="border-b align-top">
                  <td className="p-2 font-medium">{lecture}</td>
                  <td className="p-2 text-muted-foreground"><div className="flex items-center gap-1"><Lock className="h-3 w-3" />{moduleName}</div></td>
                  <td className="p-2">
                    <Select value={row.topic_title || ""} onValueChange={(v) => selectTopic(lecture, v)}>
                      <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                      <SelectContent>
                        {active.topics.map((t: any) => <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>)}
                        {active.sections.filter((s: any) => !active.topics.some((t: any) => t.title === s.title)).map((s: any) => <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-muted-foreground"><div className="flex items-center gap-1"><Lock className="h-3 w-3" />{rbt}</div></td>
                  <td className="p-2">
                    <Select value={row.co_mapping || ""} onValueChange={(v) => updateDraft(lecture, { co_mapping: v })}>
                      <SelectTrigger><SelectValue placeholder="CO" /></SelectTrigger>
                      <SelectContent>
                        {coCount === 0 && <SelectItem value="__none__" disabled>No COs defined</SelectItem>}
                        {Array.from({ length: coCount }, (_, k) => `CO${k + 1}`).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-muted-foreground"><div className="flex items-center gap-1"><Lock className="h-3 w-3" />{actualDate || "—"}</div></td>
                  <td className="p-2 text-muted-foreground"><div className="flex items-center gap-1"><Lock className="h-3 w-3" />{actualDate ? (profile?.display_name || "—") : "—"}</div></td>
                  <td className="p-2"><Textarea value={row.faculty_remarks || ""} onChange={(e) => updateDraft(lecture, { faculty_remarks: e.target.value })} className="min-h-10" /></td>
                  <td className="p-2"><Button size="sm" onClick={() => saveRow.mutate({ lecture })}><Save className="h-3 w-3" /></Button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 lg:hidden">
          {Array.from({ length: totalPeriods }, (_, i) => {
            const lecture = i + 1;
            const row = drafts[lecture] || {};
            const section = active.sections.find((s: any) => s.id === row.curriculum_section_id) || active.sections.find((s: any) => s.title === row.topic_title);
            const rbt = section?.rbt_levels || "—";
            const actualDate = findLoggedDate(row.curriculum_section_id, row.topic_title);
            return <div key={lecture} className="rounded-xl bg-muted p-3 space-y-3">
              <div className="flex items-center justify-between"><b>Period {lecture}</b><Button size="sm" onClick={() => saveRow.mutate({ lecture })}><Save className="h-3 w-3" /></Button></div>
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Module: {m.module_name}</div>
              <Select value={row.topic_title || ""} onValueChange={(v) => selectTopic(lecture, v)}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>
                  {active.topics.map((t: any) => <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>)}
                  {active.sections.filter((s: any) => !active.topics.some((t: any) => t.title === s.title)).map((s: any) => <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-background p-2"><Lock className="inline h-3 w-3" /> RBT: {rbt}</div>
                <div className="rounded bg-background p-2"><Lock className="inline h-3 w-3" /> Date: {actualDate || "—"}</div>
              </div>
              <Select value={row.co_mapping || ""} onValueChange={(v) => updateDraft(lecture, { co_mapping: v })}>
                <SelectTrigger><SelectValue placeholder="CO Mapping" /></SelectTrigger>
                <SelectContent>
                  {coCount === 0 && <SelectItem value="__none__" disabled>No COs defined</SelectItem>}
                  {Array.from({ length: coCount }, (_, k) => `CO${k + 1}`).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Remarks" value={row.faculty_remarks || ""} onChange={(e) => updateDraft(lecture, { faculty_remarks: e.target.value })} />
            </div>;
          })}
        </div>
      </section>
    </CardContent></Card>}
  </div>;
};
export default TutorLessonPlans;
