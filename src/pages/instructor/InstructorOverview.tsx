import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Video, ClipboardList, BookOpen, ArrowRight, Calendar, Flame, Sparkles, TrendingUp, GraduationCap, Wifi, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import LiveClassesBlock from "@/components/overview/LiveClassesBlock";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIdx = (new Date().getDay() + 6) % 7;

const statGradients = [
  "from-brand-primary to-brand-primary-dark",
  "from-brand-gold to-[hsl(35_62%_55%)]",
  "from-[hsl(25_60%_45%)] to-[hsl(15_55%_35%)]",
  "from-[hsl(340_50%_35%)] to-brand-primary-dark",
];

type BatchRow = { id: string; name: string; semester: number | null; program_id: string | null };
type StudentRow = { user_id: string; display_name: string | null; enrollment_id: string | null; semester: number | null; program: string | null };
type ClassRow = { id: string; title: string; class_type: string | null; scheduled_at: string; duration_minutes: number | null; batch_id: string | null; audience_type: string | null; meeting_link?: string | null };

const InstructorOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, todayClassesCount: 0, pendingGrading: 0, activeBatches: 0 });
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassRow[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<any[]>([]);
  const [activityData, setActivityData] = useState(weekDays.map((day) => ({ day, teaching: 0, online: 0 })));
  const [programMap, setProgramMap] = useState<Record<string, string>>({});
  const [batchEnrollments, setBatchEnrollments] = useState<{ batch_id: string; student_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [openDialog, setOpenDialog] = useState<null | "students" | "today" | "batches">(null);
  const [openBatchStudents, setOpenBatchStudents] = useState<BatchRow | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Batches assigned to this instructor
      const { data: batchesData } = await supabase
        .from("batches")
        .select("id, name, semester, program_id")
        .eq("instructor_id", user.id)
        .eq("is_active", true)
        .order("semester", { ascending: true });
      const myBatches = (batchesData || []) as BatchRow[];
      const batchIds = myBatches.map((b) => b.id);

      // Program names
      const programIds = [...new Set(myBatches.map((b) => b.program_id).filter(Boolean) as string[])];
      let progMap: Record<string, string> = {};
      if (programIds.length > 0) {
        const { data: progs } = await supabase.from("categories").select("id, name").in("id", programIds);
        progMap = Object.fromEntries((progs || []).map((p: any) => [p.id, p.name]));
      }

      // Enrollments + students
      let enrollments: { batch_id: string; student_id: string }[] = [];
      let studentRows: StudentRow[] = [];
      if (batchIds.length > 0) {
        const { data: ens } = await supabase.from("batch_enrollments").select("batch_id, student_id").in("batch_id", batchIds);
        enrollments = ens || [];
        const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
        if (studentIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("user_id, display_name, enrollment_id").in("user_id", studentIds);
          const batchById = Object.fromEntries(myBatches.map((b) => [b.id, b]));
          const studentBatch: Record<string, BatchRow | undefined> = {};
          enrollments.forEach((e) => {
            const b = batchById[e.batch_id];
            const cur = studentBatch[e.student_id];
            if (!cur || ((b?.semester ?? 0) > (cur.semester ?? 0))) studentBatch[e.student_id] = b;
          });
          studentRows = (profs || []).map((p: any) => {
            const b = studentBatch[p.user_id];
            return {
              user_id: p.user_id,
              display_name: p.display_name,
              enrollment_id: p.enrollment_id,
              semester: b?.semester ?? null,
              program: b?.program_id ? progMap[b.program_id] || null : null,
            };
          });
        }
      }

      // Today's classes
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const { data: todayCls } = await supabase
        .from("live_classes")
        .select("id, title, class_type, scheduled_at, duration_minutes, batch_id, audience_type, meeting_link")
        .eq("instructor_id", user.id)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at");

      // Assignments + submissions
      const { data: assignments } = await supabase.from("assignments").select("id").eq("instructor_id", user.id);
      const assignmentIds = (assignments || []).map((a: any) => a.id);
      let pendingGrading = 0;
      let recent: any[] = [];
      if (assignmentIds.length > 0) {
        const { count } = await supabase.from("assignment_submissions").select("id", { count: "exact", head: true })
          .in("assignment_id", assignmentIds).eq("status", "submitted");
        pendingGrading = count || 0;

        const { data: subs } = await supabase.from("assignment_submissions").select("*, assignments(title)")
          .in("assignment_id", assignmentIds).order("submitted_at", { ascending: false }).limit(5);
        if (subs?.length) {
          const studentIds = [...new Set(subs.map((s: any) => s.student_id))];
          const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", studentIds);
          const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
          recent = subs.map((s: any) => ({ ...s, student_name: profileMap[s.student_id] || "Student" }));
        }
      }

      // Allocated subjects
      const { data: allocations } = await supabase
        .from("subject_allocations")
        .select("*, curriculum_modules(id, subject_name, course_code, module_name, semester)")
        .eq("instructor_id", user.id);

      // Teaching activity for the week (Mon-Sat)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      const [{ data: logs }, { data: weekLive }] = await Promise.all([
        supabase.from("class_logs").select("date").eq("instructor_id", user.id)
          .gte("date", format(weekStart, "yyyy-MM-dd")).lte("date", format(weekEnd, "yyyy-MM-dd")),
        supabase.from("live_classes").select("scheduled_at, duration_minutes, class_type").eq("instructor_id", user.id)
          .gte("scheduled_at", weekStart.toISOString()).lte("scheduled_at", addDays(weekEnd, 1).toISOString()),
      ]);
      const activity = weekDays.map((day, i) => {
        const d = addDays(weekStart, i);
        const teaching = (logs || []).filter((l: any) => isSameDay(new Date(l.date), d)).length; // 1 hr per log fallback
        const online = (weekLive || []).filter((c: any) => c.class_type === "online" && isSameDay(new Date(c.scheduled_at), d))
          .reduce((sum: number, c: any) => sum + ((c.duration_minutes || 60) / 60), 0);
        return { day, teaching, online: Math.round(online * 10) / 10 };
      });

      setStats({
        students: studentRows.length,
        todayClassesCount: (todayCls || []).length,
        pendingGrading,
        activeBatches: myBatches.length,
      });
      setBatches(myBatches);
      setStudents(studentRows);
      setBatchEnrollments(enrollments);
      setProgramMap(progMap);
      setTodayClasses((todayCls || []) as ClassRow[]);
      setRecentSubmissions(recent);
      setAllocatedSubjects(allocations || []);
      setActivityData(activity);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const batchNameById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches]);

  const newSubsCount = recentSubmissions.filter((s: any) => s.status === "submitted" && !s.grade && !s.feedback).length;

  const statCards = [
    { key: "students", label: "Total Students", value: stats.students, icon: Users, onClick: () => setOpenDialog("students") },
    { key: "today", label: "Today's Classes", value: stats.todayClassesCount, icon: Video, onClick: () => setOpenDialog("today") },
    { key: "assignments", label: "Assignments Ongoing", value: stats.pendingGrading, icon: ClipboardList, onClick: () => navigate("/dashboard/tutor/assignments") },
    { key: "batches", label: "Assigned Batches", value: stats.activeBatches, icon: BookOpen, onClick: () => setOpenDialog("batches") },
  ];

  // Today's Schedule table
  const todayOrdered = useMemo(() =>
    [...todayClasses].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
  [todayClasses]);

  const todayRow = useMemo(() => {
    const now = new Date();
    return {
      dateLabel: format(now, "do MMM"),
      day: format(now, "EEEE"),
    };
  }, []);

  return (
    <div className="space-y-6 pt-2">
      {/* Motivational Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-primary p-5 sm:p-6 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, hsl(33 62% 58%), transparent 50%)" }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-brand-gold" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium tracking-wider uppercase">Today's Focus</p>
            <p className="font-serif text-lg sm:text-xl font-bold mt-0.5">"Teaching is the art of lighting a fire within."</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-auto bg-white/10 rounded-full px-4 py-2">
            <Flame className="w-4 h-4 text-brand-gold" />
            <span className="text-sm font-bold">{stats.todayClassesCount} classes today</span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.button
            key={stat.key}
            type="button"
            onClick={stat.onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-2xl"
          >
            <div className={`bg-gradient-to-br ${statGradients[i]} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 min-h-[120px]`}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-serif text-3xl font-bold mt-3">
                {loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : stat.value}
              </p>
              <p className="text-[11px] text-white/80 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* My Allocated Subjects */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-primary/5 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-brand-primary">My Allocated Subjects</h3>
            <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : allocatedSubjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid text-sm">No subjects allocated yet</p>
            <p className="text-xs text-brand-warm-grey mt-1">Contact admin for subject allocation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allocatedSubjects.map((alloc: any) => (
              <Link
                key={alloc.id}
                to={`/dashboard/tutor/curriculum?module=${alloc.curriculum_modules?.id || ""}`}
                className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold text-brand-charcoal-mid text-sm truncate hover:text-brand-primary">{alloc.curriculum_modules?.subject_name}</p>
                    <p className="text-xs text-brand-warm-grey mt-0.5">{alloc.curriculum_modules?.course_code}</p>
                  </div>
                  <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px] shrink-0">
                    Sem {alloc.curriculum_modules?.semester}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-brand-warm-grey">
                  <span className="bg-brand-cream rounded-md px-2 py-0.5">{alloc.academic_year}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Teaching Activity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand-gold" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-brand-primary">Teaching Activity</h3>
            </div>
            <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={activityData} barCategoryGap="20%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C7B6B' }} />
              <YAxis hide />
              <Tooltip formatter={(v: number, k: string) => [`${v} hrs`, k === "teaching" ? "Teaching" : "Online"]} cursor={false}
                contentStyle={{ borderRadius: 12, border: '1px solid #EDE3CC', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              <Bar dataKey="teaching" name="Teaching" radius={[6, 6, 0, 0]}>
                {activityData.map((_, i) => (
                  <Cell key={i} fill={i === todayIdx ? '#7D1E24' : '#C49A3C'} />
                ))}
              </Bar>
              <Bar dataKey="online" name="Online" radius={[6, 6, 0, 0]} fill="#4A6FA5" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Today's Schedule — table format */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-primary/5 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-brand-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-brand-primary">Today's Schedule</h3>
            </div>
            <Link to="/dashboard/tutor/live-classes" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">See All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {todayOrdered.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-brand-gold" />
              </div>
              <p className="font-serif text-brand-charcoal-mid text-sm">No classes today</p>
              <p className="text-xs text-brand-warm-grey mt-1">Enjoy your free time!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 bg-brand-cream rounded-l-lg font-semibold text-brand-charcoal-mid">Date / Day</th>
                    {todayOrdered.map((c) => {
                      const start = new Date(c.scheduled_at);
                      const end = new Date(start.getTime() + (c.duration_minutes || 60) * 60000);
                      return (
                        <th key={c.id} className="text-left px-3 py-2 bg-brand-cream font-semibold text-brand-charcoal-mid whitespace-nowrap">
                          {format(start, "h:mma").toLowerCase()} – {format(end, "h:mma").toLowerCase()}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-3 align-top border-b border-brand-parchment">
                      <p className="font-semibold text-brand-charcoal-mid">{todayRow.dateLabel}</p>
                      <p className="text-brand-warm-grey">{todayRow.day}</p>
                    </td>
                    {todayOrdered.map((c) => {
                      const b = c.batch_id ? batchNameById[c.batch_id] : null;
                      const semLabel = b?.semester ? ` — Sem ${b.semester}` : "";
                      return (
                        <td key={c.id} className="px-3 py-3 align-top border-b border-brand-parchment">
                          <p className="font-semibold text-brand-charcoal-mid">{c.title}{semLabel}</p>
                          <span className={`inline-flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                            c.class_type === "online" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {c.class_type === "online" ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {c.class_type || "offline"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Submissions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-brand-gold" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-brand-primary">Recent Submissions</h3>
              {newSubsCount > 0 && (
                <p className="text-[11px] text-brand-primary font-semibold mt-0.5">
                  ● {newSubsCount} new submission{newSubsCount === 1 ? "" : "s"} awaiting review
                </p>
              )}
            </div>
          </div>
          <Link to="/dashboard/tutor/assignments" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">See All <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {recentSubmissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid">No submissions yet</p>
            <p className="text-xs text-brand-warm-grey mt-1">Submissions will appear here</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block rounded-2xl border border-brand-parchment overflow-hidden bg-white shadow-[0_2px_24px_rgba(125,30,36,0.04)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-primary-dark to-brand-primary text-brand-gold-light text-[11px] uppercase tracking-widest">
                    <th className="px-5 py-3.5 text-left font-semibold">Student</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Assignment</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Submitted</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub: any, i) => {
                    const isNew = sub.status === "submitted" && !sub.grade && !sub.feedback;
                    return (
                      <tr key={sub.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream'} border-b border-brand-cream-dark hover:bg-brand-gold-pale/30 transition-colors`}>
                        <td className="px-5 py-3.5 text-sm font-medium text-brand-charcoal-mid">
                          <span className="flex items-center gap-2">
                            {isNew && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            {sub.student_name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-brand-charcoal-mid">{sub.assignments?.title}</td>
                        <td className="px-5 py-3.5 text-sm text-brand-warm-grey">{format(new Date(sub.submitted_at), "MMM dd, h:mm a")}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                            sub.status === "graded" ? "bg-green-50 text-green-700" : isNew ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {sub.status === "graded" ? `Graded: ${sub.grade}` : isNew ? "New" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2">
              {recentSubmissions.map((sub: any) => {
                const isNew = sub.status === "submitted" && !sub.grade && !sub.feedback;
                return (
                  <div key={sub.id} className="bg-white rounded-2xl border border-brand-parchment p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-brand-charcoal-mid flex items-center gap-2">
                        {isNew && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        {sub.student_name}
                      </p>
                      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                        sub.status === "graded" ? "bg-green-50 text-green-700" : isNew ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {sub.status === "graded" ? `${sub.grade}` : isNew ? "New" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-brand-warm-grey">{sub.assignments?.title}</p>
                    <p className="text-xs text-brand-warm-grey mt-1">{format(new Date(sub.submitted_at), "MMM dd, h:mm a")}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Quick action CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 90% 50%, hsl(33 62% 58%), transparent 40%)" }} />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-base font-semibold">Schedule a Live Class</p>
              <p className="text-xs text-white/60">Set up your next session with students</p>
            </div>
          </div>
          <Link to="/dashboard/tutor/live-classes" className="relative z-10">
            <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-charcoal font-bold rounded-xl shadow-lg px-6">
              Schedule Class <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* === STUDENTS DIALOG === */}
      <Dialog open={openDialog === "students"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary">My Students</DialogTitle>
            <DialogDescription>Students enrolled in your assigned batches</DialogDescription>
          </DialogHeader>
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-warm-grey">No students yet.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Registered No.</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Program</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">{s.display_name || "—"}</TableCell>
                      <TableCell>{s.enrollment_id || "—"}</TableCell>
                      <TableCell>{s.semester ?? "—"}</TableCell>
                      <TableCell>{s.program || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === TODAY'S CLASSES DIALOG === */}
      <Dialog open={openDialog === "today"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary">Today's Classes</DialogTitle>
            <DialogDescription>{format(new Date(), "EEEE, do MMMM")}</DialogDescription>
          </DialogHeader>
          {todayClasses.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-warm-grey">No classes scheduled today.</p>
          ) : (
            <div className="space-y-5 max-h-[60vh] overflow-y-auto">
              {(["offline", "online"] as const).map((mode) => {
                const list = todayClasses
                  .filter((c) => (c.class_type || "offline") === mode)
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                if (list.length === 0) return null;
                return (
                  <div key={mode}>
                    <h4 className="text-xs uppercase tracking-wider text-brand-warm-grey font-semibold mb-2 flex items-center gap-2">
                      {mode === "online" ? <Wifi className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {mode === "online" ? "Online Classes" : "Offline Classes"} ({list.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((c) => {
                          const b = c.batch_id ? batchNameById[c.batch_id] : null;
                          const batchLabel = c.audience_type === "all" ? "All my batches" : (b?.name || "—");
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.title}</TableCell>
                              <TableCell className="capitalize">{c.class_type || "offline"}</TableCell>
                              <TableCell>{batchLabel}</TableCell>
                              <TableCell>{format(new Date(c.scheduled_at), "h:mm a")}</TableCell>
                              <TableCell>{c.duration_minutes || 60} min</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === BATCHES DIALOG === */}
      <Dialog open={openDialog === "batches"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary">Assigned Batches</DialogTitle>
            <DialogDescription>All batches assigned to you, sorted by semester</DialogDescription>
          </DialogHeader>
          {batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-warm-grey">No batches assigned.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => {
                    const count = batchEnrollments.filter((e) => e.batch_id === b.id).length;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <button
                            className="font-medium text-brand-primary hover:underline text-left"
                            onClick={() => setOpenBatchStudents(b)}
                          >
                            {b.name}
                          </button>
                        </TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>{b.program_id ? programMap[b.program_id] || "—" : "—"}</TableCell>
                        <TableCell>{b.semester ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === BATCH STUDENTS DIALOG === */}
      <Dialog open={!!openBatchStudents} onOpenChange={(o) => !o && setOpenBatchStudents(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary">{openBatchStudents?.name} — Students</DialogTitle>
            <DialogDescription>
              {openBatchStudents?.program_id ? programMap[openBatchStudents.program_id] : ""}{openBatchStudents?.semester ? ` · Sem ${openBatchStudents.semester}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Registered No.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchEnrollments
                  .filter((e) => e.batch_id === openBatchStudents?.id)
                  .map((e) => {
                    const s = students.find((st) => st.user_id === e.student_id);
                    return (
                      <TableRow key={e.student_id}>
                        <TableCell className="font-medium">{s?.display_name || "—"}</TableCell>
                        <TableCell>{s?.enrollment_id || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                {batchEnrollments.filter((e) => e.batch_id === openBatchStudents?.id).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-brand-warm-grey">No students enrolled.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorOverview;
