import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ArrowRight, Video, Users, BarChart3, BookOpen, Sparkles, Flame, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, subMinutes, addMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIdx = (new Date().getDay() + 6) % 7;

const statGradients = [
  "from-brand-primary to-brand-primary-dark",
  "from-blue-600 to-blue-800",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-emerald-700",
];
const statIconBgs = [
  "from-white/20 to-white/5",
  "from-white/20 to-white/5",
  "from-white/20 to-white/5",
  "from-white/20 to-white/5",
];

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
    if (!dueDate) return { text: "No due date", cls: "bg-brand-cream-dark text-brand-warm-grey", border: "border-l-brand-warm-grey" };
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { text: "Overdue", cls: "bg-red-50 text-red-700", border: "border-l-red-500" };
    if (diff < 2) return { text: "Due Soon", cls: "bg-amber-50 text-amber-700", border: "border-l-amber-500" };
    return { text: "On Track", cls: "bg-green-50 text-green-700", border: "border-l-green-500" };
  };

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      {/* Motivational hero strip */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-primary p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-gold/5 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
          </div>
          <div>
            <p className="text-white/90 text-xs sm:text-sm font-medium">"The mind is everything. What you think, you become."</p>
            <p className="text-white/50 text-[10px] sm:text-xs mt-0.5">— Buddha · Keep learning, keep growing ✨</p>
          </div>
        </div>
      </motion.div>

      {/* Stat cards — gradient style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className={`bg-gradient-to-br ${statGradients[i]} rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${statIconBgs[i]} flex items-center justify-center mb-2 sm:mb-3`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1 truncate">
                {loading ? <Skeleton className="h-7 sm:h-8 w-16 bg-white/20" /> : stat.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle row: Activity chart + Upcoming classes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Study Activity Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <div className="bg-gradient-to-r from-brand-primary/5 to-brand-gold/5 px-3 sm:px-5 pt-3 sm:pt-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-brand-gold" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Study Activity</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-brand-warm-grey bg-white/80 px-2.5 py-1 rounded-full border border-brand-parchment">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="font-bold text-orange-600">5</span> day streak
              </div>
            </div>
          </div>
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
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
          </div>
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <div className="bg-gradient-to-r from-brand-primary/5 to-brand-gold/5 px-3 sm:px-5 pt-3 sm:pt-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
                  <Video className="w-4 h-4 text-brand-primary" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Upcoming Classes</h3>
              </div>
              <Link to="/dashboard/student/live-classes" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">
                See All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            {loading ? (
              <div className="space-y-3 pt-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 sm:h-16 rounded-xl" />)}</div>
            ) : upcomingClasses.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
                  <Video className="w-6 h-6 sm:w-7 sm:h-7 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-charcoal-mid text-sm">No upcoming classes</p>
                <p className="text-[10px] text-brand-warm-grey mt-1">Check back later for your schedule</p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {upcomingClasses.map((cls) => {
                  const live = isClassLive(cls.scheduled_at, cls.duration_minutes);
                  return (
                    <div key={cls.id} className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-brand-cream transition-all duration-200 border ${live ? 'border-green-200 bg-green-50/30' : 'border-transparent'}`}>
                      {/* Tutor avatar */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-[10px] sm:text-xs shrink-0 border border-brand-gold/20">
                        {getInitials(cls.profiles?.display_name || "T")}
                      </div>
                      <div className={`w-1 h-10 sm:h-12 rounded-full shrink-0 ${live ? 'bg-green-500 animate-pulse' : 'bg-gradient-to-b from-brand-gold to-brand-gold/30'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-brand-charcoal truncate">{cls.title}</p>
                        <p className="text-[10px] sm:text-xs text-brand-warm-grey truncate">
                          {cls.profiles?.display_name || "Tutor"} · {cls.meeting_platform === "google_meet" ? "Meet" : "Zoom"}
                        </p>
                        {live && <span className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE NOW</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-brand-charcoal-mid">{format(new Date(cls.scheduled_at), "h:mm a")}</p>
                        <p className="text-[10px] sm:text-[11px] text-brand-warm-grey">{format(new Date(cls.scheduled_at), "MMM dd")}</p>
                        {live && (
                          <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="mt-1 h-6 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-2.5">
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
          </div>
        </motion.div>
      </div>

      {/* Assignments — Card layout with urgency borders */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Your Assignments</h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <Link to="/dashboard/student/assignments" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">
            See All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <Skeleton className="h-40 sm:h-48 rounded-2xl" />
        ) : pendingAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-8 sm:p-10 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid text-sm">No pending assignments</p>
            <p className="text-xs text-brand-warm-grey mt-1">You're all caught up! 🎉</p>
          </div>
        ) : (
          <>
            {/* Mobile: card layout with urgency left-border */}
            <div className="sm:hidden space-y-2.5">
              {pendingAssignments.map((a) => {
                const due = getDueLabel(a.due_date);
                return (
                  <div key={a.id} className={`bg-white rounded-xl border border-brand-parchment p-3 shadow-sm border-l-4 ${due.border}`}>
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
                  <tr className="bg-gradient-to-r from-brand-primary-dark to-brand-primary text-brand-gold-light text-[11px] uppercase tracking-widest">
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

      {/* Quick action CTA — gradient */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            </div>
            <div>
              <p className="font-serif text-sm sm:text-base font-semibold text-white">Explore new courses</p>
              <p className="text-[10px] sm:text-xs text-white/60">Browse our catalog and start your next journey</p>
            </div>
          </div>
          <Link to="/courses" className="w-full sm:w-auto relative">
            <Button className="w-full sm:w-auto bg-brand-gold hover:bg-brand-gold-light text-brand-charcoal font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              Browse Courses <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;