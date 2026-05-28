import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, ClipboardList, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = {
  primary: "hsl(var(--brand-primary))",
  gold: "hsl(var(--brand-gold))",
  green: "#059669",
  amber: "#D97706",
  red: "#DC2626",
  muted: "#94A3B8",
};

interface ModuleStat {
  id: string;
  name: string;
  total: number;
  completed: number;
  sections: { id: string; title: string; completed: boolean }[];
}
interface CourseStat {
  id: string;
  title: string;
  totalSections: number;
  completedSections: number;
  modules: ModuleStat[];
}

const DashboardAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [assignmentStats, setAssignmentStats] = useState({
    submitted: 0, graded: 0, pending: 0, overdue: 0, total: 0,
  });

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setLoading(true);

      // 1. Student batches → courses
      const { data: enrolls } = await supabase
        .from("batch_enrollments")
        .select("batch_id, batches(id, course_id, courses(id, title))")
        .eq("student_id", user.id);

      const courseMap = new Map<string, { title: string; batchIds: string[] }>();
      (enrolls || []).forEach((e: any) => {
        const c = e.batches?.courses;
        if (c?.id) {
          const cur = courseMap.get(c.id) || { title: c.title, batchIds: [] };
          if (e.batch_id) cur.batchIds.push(e.batch_id);
          courseMap.set(c.id, cur);
        }
      });

      const courseIds = [...courseMap.keys()];
      const allBatchIds = [...new Set((enrolls || []).map((e: any) => e.batch_id).filter(Boolean))];

      const courseStats: CourseStat[] = [];

      if (courseIds.length > 0) {
        // 2. Modules for these courses (curriculum_modules uses course_code; map via courses.course_code if exists)
        // Simpler: fetch modules whose batch_id is in student's batches OR fallback via course_code
        const { data: coursesData } = await supabase
          .from("courses").select("id, title, course_code").in("id", courseIds);

        for (const c of coursesData || []) {
          const courseCode = (c as any).course_code;
          let modulesQuery = supabase
            .from("curriculum_modules")
            .select("id, subject_name, module_name");
          if (courseCode) modulesQuery = modulesQuery.eq("course_code", courseCode);
          else modulesQuery = modulesQuery.in("batch_id", allBatchIds.length ? allBatchIds : ["00000000-0000-0000-0000-000000000000"]);
          const { data: modules } = await modulesQuery;

          const moduleIds = (modules || []).map((m: any) => m.id);
          let sections: any[] = [];
          if (moduleIds.length > 0) {
            const { data: secs } = await supabase
              .from("curriculum_sections")
              .select("id, title, module_id")
              .in("module_id", moduleIds);
            sections = secs || [];
          }

          // 3. Completed sections = curriculum_section_id in class_logs where confirmed by student
          const sectionIds = sections.map((s) => s.id);
          let completedIds = new Set<string>();
          if (sectionIds.length > 0) {
            const { data: logs } = await supabase
              .from("class_logs")
              .select("id, curriculum_section_id, class_log_confirmations!inner(student_id, confirmed)")
              .in("curriculum_section_id", sectionIds)
              .eq("class_log_confirmations.student_id", user.id)
              .eq("class_log_confirmations.confirmed", true);
            (logs || []).forEach((l: any) => {
              if (l.curriculum_section_id) completedIds.add(l.curriculum_section_id);
            });
          }

          const moduleStats: ModuleStat[] = (modules || []).map((m: any) => {
            const modSections = sections.filter((s) => s.module_id === m.id);
            const completedSecs = modSections.filter((s) => completedIds.has(s.id));
            return {
              id: m.id,
              name: m.subject_name || m.module_name,
              total: modSections.length,
              completed: completedSecs.length,
              sections: modSections.map((s) => ({
                id: s.id, title: s.title, completed: completedIds.has(s.id),
              })),
            };
          });

          courseStats.push({
            id: c.id,
            title: c.title,
            totalSections: sections.length,
            completedSections: completedIds.size,
            modules: moduleStats,
          });
        }
      }
      setCourses(courseStats);

      // 4. Assignments
      if (allBatchIds.length > 0) {
        const { data: assigns } = await supabase
          .from("assignments")
          .select("id, due_date, batch_id")
          .in("batch_id", allBatchIds);
        const assignIds = (assigns || []).map((a) => a.id);
        let subs: any[] = [];
        if (assignIds.length > 0) {
          const { data: s } = await supabase
            .from("assignment_submissions")
            .select("assignment_id, status, grade")
            .eq("student_id", user.id)
            .in("assignment_id", assignIds);
          subs = s || [];
        }
        const subMap = new Map(subs.map((s) => [s.assignment_id, s]));
        let submitted = 0, graded = 0, pending = 0, overdue = 0;
        (assigns || []).forEach((a) => {
          const sub = subMap.get(a.id);
          if (sub?.grade) graded++;
          else if (sub) submitted++;
          else if (a.due_date && new Date(a.due_date) < new Date()) overdue++;
          else pending++;
        });
        setAssignmentStats({
          submitted, graded, pending, overdue, total: (assigns || []).length,
        });
      }

      setLoading(false);
    };
    run();
  }, [user]);

  const toggleCourse = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const assignmentPieData = [
    { name: "Graded", value: assignmentStats.graded, color: COLORS.green },
    { name: "Submitted", value: assignmentStats.submitted, color: COLORS.primary },
    { name: "Pending", value: assignmentStats.pending, color: COLORS.amber },
    { name: "Overdue", value: assignmentStats.overdue, color: COLORS.red },
  ].filter((d) => d.value > 0);

  return (
    <div className="px-3 sm:px-0 pt-2 sm:pt-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-4 sm:mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">My Analytics</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-0.5" />
            <p className="text-brand-warm-grey text-xs sm:text-sm mt-0.5">Track your course and assignment progress</p>
          </div>
        </div>

        {loading ? (
          <p className="text-brand-warm-grey text-sm py-10 text-center">Loading analytics…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Course completion */}
            <Card className="lg:col-span-2 bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)]">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-brand-primary" />
                  <h2 className="font-serif text-lg text-brand-primary">Course Completion</h2>
                </div>
                {courses.length === 0 ? (
                  <p className="text-sm text-brand-warm-grey py-6 text-center">
                    Once your courses and assignments have activity, analytics will populate here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {courses.map((c) => {
                      const pct = c.totalSections > 0 ? Math.round((c.completedSections / c.totalSections) * 100) : 0;
                      const open = !!expanded[c.id];
                      return (
                        <div key={c.id} className="border border-brand-parchment rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleCourse(c.id)}
                            className="w-full p-3 sm:p-4 flex items-center gap-3 hover:bg-brand-cream/40 text-left"
                          >
                            {open ? <ChevronDown className="w-4 h-4 text-brand-warm-grey shrink-0" /> : <ChevronRight className="w-4 h-4 text-brand-warm-grey shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-medium text-brand-charcoal-mid text-sm truncate">{c.title}</p>
                                <Badge variant="outline" className="text-[10px] shrink-0">{c.completedSections}/{c.totalSections} topics</Badge>
                              </div>
                              <Progress value={pct} className="h-2" />
                              <p className="text-[10px] text-brand-warm-grey mt-1">{pct}% complete</p>
                            </div>
                          </button>
                          {open && (
                            <div className="px-3 sm:px-4 pb-4 space-y-3">
                              {c.modules.length === 0 ? (
                                <p className="text-xs text-brand-warm-grey">No modules yet.</p>
                              ) : (
                                <>
                                  <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={c.modules.map((m) => ({
                                        name: m.name.length > 14 ? m.name.slice(0, 14) + "…" : m.name,
                                        Completed: m.completed,
                                        Pending: Math.max(0, m.total - m.completed),
                                      }))}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="Completed" stackId="a" fill={COLORS.green} />
                                        <Bar dataKey="Pending" stackId="a" fill={COLORS.muted} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="space-y-2">
                                    {c.modules.map((m) => (
                                      <div key={m.id} className="bg-brand-cream/40 rounded-lg p-2.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <p className="text-xs font-medium text-brand-charcoal-mid">{m.name}</p>
                                          <span className="text-[10px] text-brand-warm-grey">{m.completed}/{m.total}</span>
                                        </div>
                                        {m.sections.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {m.sections.map((s) => (
                                              <span
                                                key={s.id}
                                                title={s.title}
                                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                  s.completed
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-brand-parchment text-brand-warm-grey"
                                                }`}
                                              >
                                                {s.title.length > 22 ? s.title.slice(0, 22) + "…" : s.title}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card className="lg:col-span-2 bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)]">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-4 h-4 text-brand-primary" />
                  <h2 className="font-serif text-lg text-brand-primary">Assignments Completion</h2>
                </div>
                {assignmentStats.total === 0 ? (
                  <p className="text-sm text-brand-warm-grey py-6 text-center">No assignments yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={assignmentPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                            {assignmentPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Graded", value: assignmentStats.graded, color: COLORS.green },
                        { label: "Submitted", value: assignmentStats.submitted, color: COLORS.primary },
                        { label: "Pending", value: assignmentStats.pending, color: COLORS.amber },
                        { label: "Overdue", value: assignmentStats.overdue, color: COLORS.red },
                      ].map((s) => (
                        <div key={s.label} className="bg-brand-cream/40 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-xs text-brand-warm-grey">{s.label}</span>
                          </div>
                          <p className="text-2xl font-serif text-brand-primary mt-1">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardAnalytics;
