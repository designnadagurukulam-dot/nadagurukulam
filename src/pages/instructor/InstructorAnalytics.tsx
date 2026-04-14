import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Eye, BarChart3, GraduationCap, FolderOpen, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const COLORS = ["hsl(var(--brand-primary))", "hsl(var(--brand-gold))", "#059669", "#7C3AED", "#EC4899"];

const InstructorAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState({ total: 0, approved: 0, courses: [] as any[] });
  const [curriculumStats, setCurriculumStats] = useState({ totalModules: 0, totalSections: 0, modules: [] as any[] });
  const [batchStats, setBatchStats] = useState({ totalBatches: 0, totalStudents: 0, batches: [] as any[] });
  const [assignmentStats, setAssignmentStats] = useState({ total: 0, submitted: 0, pending: 0, assignments: [] as any[] });

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      // Section 1: My Courses
      const { data: courses } = await supabase.from("courses").select("id, title, status").eq("instructor_id", user.id);
      const courseList = courses || [];
      const courseIds = courseList.map(c => c.id);
      let enrollmentsByCourseBulk: Record<string, number> = {};
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase.from("enrollments").select("course_id").in("course_id", courseIds);
        (enrollments || []).forEach(e => { enrollmentsByCourseBulk[e.course_id] = (enrollmentsByCourseBulk[e.course_id] || 0) + 1; });
      }
      const coursesWithCount = courseList.map(c => ({ ...c, students: enrollmentsByCourseBulk[c.id] || 0 })).sort((a, b) => b.students - a.students);
      setCourseStats({ total: courseList.length, approved: courseList.filter(c => c.status === "approved").length, courses: coursesWithCount.slice(0, 5) });

      // Section 2: My Curriculum
      const { data: sections } = await supabase.from("curriculum_sections").select("id, module_id, curriculum_modules(id, subject_name, course_code)").eq("created_by", user.id);
      const sectionList = sections || [];
      const moduleMap: Record<string, { name: string; code: string; count: number }> = {};
      sectionList.forEach(s => {
        const mod = s.curriculum_modules as any;
        if (mod) {
          if (!moduleMap[mod.id]) moduleMap[mod.id] = { name: mod.subject_name, code: mod.course_code, count: 0 };
          moduleMap[mod.id].count++;
        }
      });
      setCurriculumStats({ totalModules: Object.keys(moduleMap).length, totalSections: sectionList.length, modules: Object.values(moduleMap) });

      // Section 3: My Batches
      const { data: batchesData } = await supabase.from("batches").select("id, name, start_date, end_date, is_active").eq("instructor_id", user.id);
      const batchList = batchesData || [];
      const batchIdsArr = batchList.map(b => b.id);
      let batchStudentCounts: Record<string, number> = {};
      if (batchIdsArr.length > 0) {
        const { data: batchEnrollments } = await supabase.from("batch_enrollments").select("batch_id").in("batch_id", batchIdsArr);
        (batchEnrollments || []).forEach(be => { batchStudentCounts[be.batch_id] = (batchStudentCounts[be.batch_id] || 0) + 1; });
      }
      const batchesWithStudents = batchList.map(b => ({ ...b, studentCount: batchStudentCounts[b.id] || 0 }));
      const totalStudents = batchesWithStudents.reduce((s, b) => s + b.studentCount, 0);
      setBatchStats({ totalBatches: batchList.filter(b => b.is_active).length, totalStudents, batches: batchesWithStudents });

      // Section 4: Assignment Completion
      const { data: assignmentsData } = await supabase.from("assignments").select("id, title, batch_id, batches(name)").eq("instructor_id", user.id);
      const assignmentList = assignmentsData || [];
      let submissionCounts: Record<string, number> = {};
      if (assignmentList.length > 0) {
        const { data: subs } = await supabase.from("assignment_submissions").select("assignment_id").in("assignment_id", assignmentList.map(a => a.id));
        (subs || []).forEach(s => { submissionCounts[s.assignment_id] = (submissionCounts[s.assignment_id] || 0) + 1; });
      }
      const assignmentsWithStats = assignmentList.map(a => {
        const batchId = a.batch_id;
        const totalStudentsForBatch = batchId ? (batchStudentCounts[batchId] || 0) : totalStudents;
        const subCount = submissionCounts[a.id] || 0;
        const pct = totalStudentsForBatch > 0 ? Math.round((subCount / totalStudentsForBatch) * 100) : 0;
        return { ...a, totalStudents: totalStudentsForBatch, submissionCount: subCount, completionPct: pct, batchName: (a.batches as any)?.name || "All" };
      });
      const totalSubs = Object.values(submissionCounts).reduce((s, v) => s + v, 0);
      setAssignmentStats({ total: assignmentList.length, submitted: totalSubs, pending: Math.max(0, assignmentList.length * totalStudents - totalSubs), assignments: assignmentsWithStats });

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;

  const pieData = batchStats.batches.map(b => ({ name: b.name, value: b.studentCount }));

  return (
    <div className="space-y-8 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-brand-gold" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Analytics</h1>
        </div>
        <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1 ml-10" />
        <p className="text-brand-warm-grey mt-2 text-sm ml-10">Track your teaching performance</p>
      </motion.div>

      {/* Section 1: My Courses */}
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <CardContent className="p-5">
          <h2 className="font-serif text-lg font-bold text-brand-primary mb-1">My Courses</h2>
          <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total Courses", value: courseStats.total, bg: "bg-brand-cream" },
              { label: "Live Courses", value: courseStats.approved, bg: "bg-green-50" },
              { label: "Top Course Students", value: courseStats.courses[0]?.students || 0, bg: "bg-blue-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className="font-serif text-2xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[10px] text-brand-warm-grey">{s.label}</p>
              </div>
            ))}
          </div>
          {courseStats.courses.length > 0 && (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseStats.courses}>
                  <XAxis dataKey="title" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--brand-parchment))" }} />
                  <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                    {courseStats.courses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: My Curriculum */}
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <CardContent className="p-5">
          <h2 className="font-serif text-lg font-bold text-brand-primary mb-1">My Curriculum</h2>
          <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-brand-cream rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-brand-primary">{curriculumStats.totalModules}</p>
              <p className="text-[10px] text-brand-warm-grey">Subjects</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-brand-primary">{curriculumStats.totalSections}</p>
              <p className="text-[10px] text-brand-warm-grey">Topics Created</p>
            </div>
          </div>
          {curriculumStats.modules.length > 0 && (
            <div className="space-y-2">
              {curriculumStats.modules.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-brand-cream/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-gold" />
                    <span className="text-sm font-medium text-brand-charcoal">{m.name}</span>
                    <span className="text-[10px] text-brand-warm-grey font-mono">{m.code}</span>
                  </div>
                  <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px]">{m.count} topics</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: My Batches */}
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <CardContent className="p-5">
          <h2 className="font-serif text-lg font-bold text-brand-primary mb-1">My Batches</h2>
          <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-brand-cream rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-brand-primary">{batchStats.totalBatches}</p>
              <p className="text-[10px] text-brand-warm-grey">Active Batches</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-brand-primary">{batchStats.totalStudents}</p>
              <p className="text-[10px] text-brand-warm-grey">Total Students</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {batchStats.batches.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-brand-cream/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-brand-charcoal">{b.name}</p>
                    <p className="text-[10px] text-brand-warm-grey">{b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} — {b.end_date ? new Date(b.end_date).toLocaleDateString() : "ongoing"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 text-[10px] ${b.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{b.is_active ? "Active" : "Inactive"}</Badge>
                    <span className="text-sm font-bold text-brand-primary">{b.studentCount}</span>
                  </div>
                </div>
              ))}
            </div>
            {pieData.length > 0 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Assignment Completion */}
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <CardContent className="p-5">
          <h2 className="font-serif text-lg font-bold text-brand-primary mb-1">Assignment Completion</h2>
          <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-brand-cream rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-brand-primary">{assignmentStats.total}</p>
              <p className="text-[10px] text-brand-warm-grey">Total Assigned</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-green-700">{assignmentStats.submitted}</p>
              <p className="text-[10px] text-brand-warm-grey">Submitted</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="font-serif text-2xl font-bold text-red-700">{Math.max(0, assignmentStats.total - assignmentStats.submitted)}</p>
              <p className="text-[10px] text-brand-warm-grey">Pending</p>
            </div>
          </div>

          {assignmentStats.assignments.length > 0 && (
            <>
              <div className="border border-brand-parchment rounded-xl overflow-hidden mb-5">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2.5 bg-gradient-to-r from-brand-primary-dark to-brand-primary">
                  {["Assignment", "Batch", "Submitted", "Completion"].map(col => (
                    <p key={col} className="text-[9px] font-bold text-brand-gold uppercase tracking-wide">{col}</p>
                  ))}
                </div>
                {assignmentStats.assignments.map((a: any) => (
                  <div key={a.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 border-b border-brand-cream last:border-0">
                    <p className="text-[12px] font-semibold text-brand-charcoal truncate">{a.title}</p>
                    <p className="text-[11px] text-brand-warm-grey">{a.batchName}</p>
                    <p className="text-[11px] text-brand-charcoal">{a.submissionCount} / {a.totalStudents}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-brand-cream-dark rounded-full">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${a.completionPct}%`, background: a.completionPct >= 80 ? "#C49A3C" : a.completionPct >= 50 ? "#F59E0B" : "#EF4444" }} />
                      </div>
                      <span className="text-[10px] font-bold text-brand-primary min-w-[28px]">{a.completionPct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[12px] text-brand-warm-grey mb-3">Submission Rate by Assignment</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assignmentStats.assignments}>
                    <XAxis dataKey="title" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={35} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Completion"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--brand-parchment))" }} />
                    <Bar dataKey="completionPct" radius={[4, 4, 0, 0]}>
                      {assignmentStats.assignments.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.completionPct >= 80 ? "#C49A3C" : entry.completionPct >= 50 ? "#F59E0B" : "#EF4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorAnalytics;
