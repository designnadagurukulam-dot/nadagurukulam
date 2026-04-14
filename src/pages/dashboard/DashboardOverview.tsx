import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ArrowRight, Video, Users, BarChart3, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, subMinutes, addMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIdx = (new Date().getDay() + 6) % 7;

const DashboardOverview = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ batch: "—", classesThisWeek: 0, pendingAssignments: 0, progress: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityData] = useState(() =>
    weekDays.map((day, i) => ({ day, minutes: Math.floor(Math.random() * 90 + 10) }))
  );

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: batchEnrollments } = await supabase
        .from("batch_enrollments")
        .select("batch_id, batches(name)")
        .eq("student_id", user.id);
      const batchIds = batchEnrollments?.map((b: any) => b.batch_id) || [];
      const batchName = batchEnrollments?.[0]?.batches?.name || "Not assigned";

      const now = new Date().toISOString();
      let classes: any[] = [];
      if (batchIds.length > 0) {
        const { data } = await supabase
          .from("live_classes")
          .select("*")
          .in("batch_id", batchIds)
          .gte("scheduled_at", now)
          .order("scheduled_at")
          .limit(4);
        const instructorIds = [...new Set((data || []).map((c) => c.instructor_id))];
        if (instructorIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds);
          const profilesMap: Record<string, any> = {};
          (profiles || []).forEach((p) => { profilesMap[p.user_id] = p; });
          classes = (data || []).map((c) => ({ ...c, profiles: profilesMap[c.instructor_id] || null }));
        } else {
          classes = data || [];
        }
      }

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      let weekClassCount = 0;
      if (batchIds.length > 0) {
        const { count } = await supabase
          .from("live_classes")
          .select("id", { count: "exact", head: true })
          .in("batch_id", batchIds)
          .gte("scheduled_at", weekStart.toISOString())
          .lte("scheduled_at", weekEnd.toISOString());
        weekClassCount = count || 0;
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);
      const courseIds = enrollments?.map((e) => e.course_id) || [];

      let pending: any[] = [];
      if (courseIds.length > 0) {
        const { data: assignments } = await supabase
          .from("assignments")
          .select("*, courses(title)")
          .in("course_id", courseIds)
          .order("due_date", { ascending: true });
        const assignmentIds = (assignments || []).map((a) => a.id);
        const { data: submissions } = assignmentIds.length > 0
          ? await supabase.from("assignment_submissions").select("assignment_id").eq("student_id", user.id).in("assignment_id", assignmentIds)
          : { data: [] };
        const submittedIds = new Set((submissions || []).map((s) => s.assignment_id));
        pending = (assignments || []).filter((a) => !submittedIds.has(a.id)).slice(0, 5);
      }

      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("progress_pct")
        .eq("user_id", user.id);
      const avgProgress = progressData?.length
        ? Math.round(progressData.reduce((s, p) => s + p.progress_pct, 0) / progressData.length)
        : 0;

      setStats({ batch: batchName, classesThisWeek: weekClassCount, pendingAssignments: pending.length, progress: avgProgress });
      setUpcomingClasses(classes);
      setPendingAssignments(pending);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const statCards = [
    { label: "My Batch", value: stats.batch, icon: Users },
    { label: "Classes This Week", value: stats.classesThisWeek, icon: Video },
    { label: "Pending Assignments", value: stats.pendingAssignments, icon: ClipboardList },
    { label: "Study Progress", value: `${stats.progress}%`, icon: BarChart3 },
  ];

  const isClassLive = (scheduledAt: string, durationMin: number) => {
    const now = new Date();
    const start = subMinutes(new Date(scheduledAt), 10);
    const end = addMinutes(new Date(scheduledAt), durationMin || 60);
    return now >= start && now <= end;
  };

  const getDueLabel = (dueDate: string | null) => {
    if (!dueDate) return { text: "No due date", cls: "bg-brand-cream-dark text-brand-warm-grey" };
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { text: "Overdue", cls: "bg-red-50 text-red-700" };
    if (diff < 2) return { text: "Due Soon", cls: "bg-amber-50 text-amber-700" };
    return { text: "On Track", cls: "bg-green-50 text-green-700" };
  };

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-gold-pale flex items-center justify-center">
                  <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-gold" />
                </div>
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary mt-2 sm:mt-3 truncate">
                {loading ? <Skeleton className="h-7 sm:h-8 w-16" /> : stat.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle row: Activity chart + Upcoming classes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Study Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Study Activity</h3>
            <span className="text-[10px] sm:text-[11px] text-brand-warm-grey uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-gold inline-block" /> This Week
            </span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={activityData} barCategoryGap="25%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C7B6B' }} />
              <Tooltip formatter={(v: number) => [`${v} min`, 'Study time']} cursor={false}
                contentStyle={{ borderRadius: 12, border: '1px solid #EDE3CC', fontSize: 12 }} />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {activityData.map((_, i) => (
                  <Cell key={i} fill={i === todayIdx ? '#7D1E24' : activityData[i].minutes > 30 ? '#C49A3C' : '#EDE3CC'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Upcoming Classes</h3>
            <Link to="/dashboard/student/live-classes" className="text-xs text-brand-gold hover:text-brand-primary font-semibold">
              See All →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 sm:h-16 rounded-xl" />)}</div>
          ) : upcomingClasses.length === 0 ? (
            <div className="py-6 sm:py-8 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-gold-pale mx-auto flex items-center justify-center mb-3">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-brand-gold" />
              </div>
              <p className="font-serif text-brand-charcoal-mid text-sm">No upcoming classes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingClasses.map((cls) => {
                const live = isClassLive(cls.scheduled_at, cls.duration_minutes);
                return (
                  <div key={cls.id} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-brand-cream transition-colors">
                    <div className={`w-1 h-10 sm:h-12 rounded-full shrink-0 ${live ? 'bg-green-500' : 'bg-brand-gold'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-brand-charcoal truncate">{cls.title}</p>
                      <p className="text-[10px] sm:text-xs text-brand-warm-grey truncate">
                        {cls.profiles?.display_name || "Tutor"} · {cls.meeting_platform === "google_meet" ? "Meet" : "Zoom"}
                      </p>
                      {live && <span className="text-[10px] text-green-600 font-bold uppercase">● LIVE NOW</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-brand-charcoal-mid">{format(new Date(cls.scheduled_at), "h:mm a")}</p>
                      <p className="text-[10px] sm:text-[11px] text-brand-warm-grey">{format(new Date(cls.scheduled_at), "MMM dd")}</p>
                      {live && (
                        <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="mt-1 h-6 text-[10px] bg-brand-gold hover:bg-brand-gold/90 text-brand-charcoal font-bold rounded-lg px-2.5">
                            Join →
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Assignments — Card layout on mobile, table on desktop */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Your Assignments</h3>
            <div className="w-10 h-0.5 bg-brand-gold mt-1" />
          </div>
          <Link to="/dashboard/student/assignments" className="text-xs text-brand-gold hover:text-brand-primary font-semibold">
            See All →
          </Link>
        </div>
        {loading ? (
          <Skeleton className="h-40 sm:h-48 rounded-2xl" />
        ) : pendingAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-8 sm:p-10 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-gold-pale mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid text-sm">No pending assignments</p>
            <p className="text-xs text-brand-warm-grey mt-1">You're all caught up!</p>
          </div>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="sm:hidden space-y-2.5">
              {pendingAssignments.map((a) => {
                const due = getDueLabel(a.due_date);
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-brand-parchment p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand-charcoal-mid truncate">{a.title}</p>
                        <p className="text-[10px] text-brand-warm-grey truncate">{a.courses?.title}</p>
                      </div>
                      <span className={`${due.cls} text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shrink-0`}>
                        {due.text}
                      </span>
                    </div>
                    {a.due_date && (
                      <p className="text-[10px] text-brand-warm-grey mt-1.5">Due: {format(new Date(a.due_date), "MMM dd, yyyy")}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block rounded-2xl border border-brand-parchment overflow-hidden bg-white shadow-[0_2px_24px_rgba(125,30,36,0.04)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-brand-primary-dark text-brand-gold-light text-[11px] uppercase tracking-widest">
                    <th className="px-5 py-3.5 text-left font-semibold">Assignment</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Due Date</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAssignments.map((a, i) => {
                    const due = getDueLabel(a.due_date);
                    return (
                      <tr key={a.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream'} border-b border-brand-cream-dark hover:bg-brand-gold-pale/30 transition-colors`}>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-brand-charcoal-mid">{a.title}</p>
                          <p className="text-xs text-brand-warm-grey">{a.courses?.title}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-brand-charcoal-mid">
                          {a.due_date ? format(new Date(a.due_date), "MMM dd, yyyy") : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`${due.cls} text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold`}>
                            {due.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>

      {/* Quick action CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <div className="bg-white rounded-2xl border border-brand-parchment p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-gold-pale flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-sm sm:text-base font-semibold text-brand-primary">Explore new courses</p>
              <p className="text-[10px] sm:text-xs text-brand-warm-grey">Browse our catalog and start learning</p>
            </div>
          </div>
          <Link to="/courses" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-brand-gold hover:bg-brand-gold/90 text-brand-charcoal font-semibold rounded-xl shadow-sm">
              Browse Courses
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
