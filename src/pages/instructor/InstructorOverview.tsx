import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Video, ClipboardList, BookOpen, ArrowRight, Calendar, Flame, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIdx = (new Date().getDay() + 6) % 7;

const statGradients = [
  "from-brand-primary to-brand-primary-dark",
  "from-brand-gold to-[hsl(35_62%_55%)]",
  "from-[hsl(25_60%_45%)] to-[hsl(15_55%_35%)]",
  "from-[hsl(340_50%_35%)] to-brand-primary-dark",
];
const statIconBgs = [
  "bg-white/20",
  "bg-white/20",
  "bg-white/20",
  "bg-white/20",
];

const InstructorOverview = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ students: 0, upcomingClasses: 0, pendingGrading: 0, activeBatches: 0 });
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityData] = useState(() =>
    weekDays.map((day) => ({ day, hours: Math.floor(Math.random() * 5 + 1) }))
  );

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: batches } = await supabase
        .from("batches").select("id, name").eq("instructor_id", user.id).eq("is_active", true);
      const batchIds = (batches || []).map((b) => b.id);

      let studentCount = 0;
      if (batchIds.length > 0) {
        const { count } = await supabase.from("batch_enrollments").select("id", { count: "exact", head: true }).in("batch_id", batchIds);
        studentCount = count || 0;
      }

      const now = new Date();
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
      const { count: upcomingCount } = await supabase.from("live_classes").select("id", { count: "exact", head: true })
        .eq("instructor_id", user.id).gte("scheduled_at", now.toISOString()).lte("scheduled_at", weekEnd.toISOString());

      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
      const { data: todayCls } = await supabase.from("live_classes").select("*").eq("instructor_id", user.id)
        .gte("scheduled_at", todayStart.toISOString()).lte("scheduled_at", todayEnd.toISOString()).order("scheduled_at");

      const { data: assignments } = await supabase.from("assignments").select("id").eq("instructor_id", user.id);
      const assignmentIds = (assignments || []).map((a) => a.id);
      let pendingGrading = 0;
      let recent: any[] = [];
      if (assignmentIds.length > 0) {
        const { count } = await supabase.from("assignment_submissions").select("id", { count: "exact", head: true })
          .in("assignment_id", assignmentIds).eq("status", "submitted");
        pendingGrading = count || 0;

        const { data: subs } = await supabase.from("assignment_submissions").select("*, assignments(title)")
          .in("assignment_id", assignmentIds).order("submitted_at", { ascending: false }).limit(5);
        if (subs?.length) {
          const studentIds = [...new Set(subs.map((s) => s.student_id))];
          const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", studentIds);
          const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));
          recent = subs.map((s) => ({ ...s, student_name: profileMap[s.student_id] || "Student" }));
        }
      }

      setStats({ students: studentCount, upcomingClasses: upcomingCount || 0, pendingGrading, activeBatches: batches?.length || 0 });
      setTodayClasses(todayCls || []);
      setRecentSubmissions(recent);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const statCards = [
    { label: "Total Students", value: stats.students, icon: Users },
    { label: "Upcoming Classes", value: stats.upcomingClasses, icon: Video },
    { label: "Pending Grading", value: stats.pendingGrading, icon: ClipboardList },
    { label: "Active Batches", value: stats.activeBatches, icon: BookOpen },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* Motivational Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-primary p-5 sm:p-6 text-white"
      >
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
            <span className="text-sm font-bold">{todayClasses.length} classes today</span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards — gradient style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className={`bg-gradient-to-br ${statGradients[i]} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
              <div className={`w-10 h-10 rounded-full ${statIconBgs[i]} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-serif text-3xl font-bold mt-3">
                {loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : stat.value}
              </p>
              <p className="text-[11px] text-white/70 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

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
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={activityData} barCategoryGap="25%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C7B6B' }} />
              <Tooltip formatter={(v: number) => [`${v} hrs`, 'Teaching']} cursor={false}
                contentStyle={{ borderRadius: 12, border: '1px solid #EDE3CC', fontSize: 12 }} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {activityData.map((_, i) => (
                  <Cell key={i} fill={i === todayIdx ? '#7D1E24' : '#C49A3C'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Today's Schedule */}
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
          {todayClasses.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-brand-gold" />
              </div>
              <p className="font-serif text-brand-charcoal-mid text-sm">No classes today</p>
              <p className="text-xs text-brand-warm-grey mt-1">Enjoy your free time!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayClasses.map((cls) => (
                <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-cream transition-colors border border-transparent hover:border-brand-gold/20">
                  <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-brand-gold to-brand-gold/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-charcoal truncate">{cls.title}</p>
                    <p className="text-xs text-brand-warm-grey">{format(new Date(cls.scheduled_at), "h:mm a")} · {cls.duration_minutes || 60} min</p>
                  </div>
                  <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-brand-gold to-[hsl(35_62%_55%)] hover:from-brand-gold/90 hover:to-[hsl(35_62%_50%)] text-brand-charcoal font-bold rounded-lg px-4 shadow-sm">
                      Join <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </a>
                </div>
              ))}
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
              <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
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
          /* Mobile: card layout, Desktop: table */
          <>
            {/* Desktop table */}
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
                  {recentSubmissions.map((sub: any, i) => (
                    <tr key={sub.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream'} border-b border-brand-cream-dark hover:bg-brand-gold-pale/30 transition-colors`}>
                      <td className="px-5 py-3.5 text-sm font-medium text-brand-charcoal-mid">{sub.student_name}</td>
                      <td className="px-5 py-3.5 text-sm text-brand-charcoal-mid">{sub.assignments?.title}</td>
                      <td className="px-5 py-3.5 text-sm text-brand-warm-grey">{format(new Date(sub.submitted_at), "MMM dd, h:mm a")}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                          sub.status === "graded" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {sub.status === "graded" ? `Graded: ${sub.grade}` : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {recentSubmissions.map((sub: any) => (
                <div key={sub.id} className="bg-white rounded-2xl border border-brand-parchment p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-brand-charcoal-mid">{sub.student_name}</p>
                    <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                      sub.status === "graded" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {sub.status === "graded" ? `${sub.grade}` : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-brand-warm-grey">{sub.assignments?.title}</p>
                  <p className="text-xs text-brand-warm-grey mt-1">{format(new Date(sub.submitted_at), "MMM dd, h:mm a")}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Quick action — gradient CTA */}
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
    </div>
  );
};

export default InstructorOverview;
