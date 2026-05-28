import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ArrowRight, Video, Users, BarChart3, BookOpen, Sparkles, Flame, TrendingUp, ChevronRight, FileText, PlayCircle, Headphones, CalendarDays, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, subMinutes, addMinutes, formatDistanceToNow, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import BatchRosterDialog from "@/components/dashboard/BatchRosterDialog";
import TodayClassesDialog from "@/components/dashboard/TodayClassesDialog";
import CourseProgressDialog from "@/components/dashboard/CourseProgressDialog";
import LiveClassesBlock from "@/components/overview/LiveClassesBlock";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const todayIdx = (new Date().getDay() + 6) % 7;

const statGradients = [
  "from-brand-primary to-brand-primary-dark",
  "from-blue-600 to-blue-800",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-emerald-700",
];

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchName, setBatchName] = useState("Not assigned");
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [todayOnlineClasses, setTodayOnlineClasses] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState<{ id: string; title: string; progress: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [activityData, setActivityData] = useState(() => weekDays.map((day) => ({ day, minutes: 0 })));
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showBatch, setShowBatch] = useState(false);
  const [showClasses, setShowClasses] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const todayCounts = useMemo(() => {
    let online = 0, offline = 0;
    todayClasses.forEach((c) => {
      if (c.class_type === "offline") offline++; else online++;
    });
    return { online, offline };
  }, [todayClasses]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Batch
      const { data: batchEnrollments } = await supabase
        .from("batch_enrollments")
        .select("batch_id, batches(id, name)")
        .eq("student_id", user.id);
      const batchIds = (batchEnrollments || []).map((b: any) => b.batch_id);
      const firstBatch = batchEnrollments?.[0]?.batches as any;
      setBatchId(firstBatch?.id || null);
      setBatchName(firstBatch?.name || "Not assigned");

      // Today's classes (for tile + dialog) — batch-specific or audience='all'
      const dayStart = startOfDay(new Date()).toISOString();
      const dayEnd = endOfDay(new Date()).toISOString();
      let allToday: any[] = [];
      const orFilter = batchIds.length > 0
        ? `batch_id.in.(${batchIds.join(",")}),audience_type.eq.all`
        : `audience_type.eq.all`;
      const { data: tcs } = await supabase
        .from("live_classes")
        .select("*")
        .gte("scheduled_at", dayStart)
        .lte("scheduled_at", dayEnd)
        .or(orFilter)
        .order("scheduled_at");
      allToday = tcs || [];
      setTodayClasses(allToday);

      // Online classes block — today, online only, with faculty name
      const onlineToday = allToday.filter((c) => (c.class_type || "online") === "online");
      const instructorIds = [...new Set(onlineToday.map((c) => c.instructor_id))];
      let profilesMap: Record<string, any> = {};
      if (instructorIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds);
        (profs || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
      }
      setTodayOnlineClasses(onlineToday.map((c) => ({ ...c, profiles: profilesMap[c.instructor_id] || null })));

      // Enrollments + assignments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, progress")
        .eq("user_id", user.id);
      const courseIds = (enrollments || []).map((e) => e.course_id);

      let pendingN = 0;
      if (courseIds.length > 0) {
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id")
          .in("course_id", courseIds);
        const aIds = (assignments || []).map((a) => a.id);
        if (aIds.length > 0) {
          const { data: subs } = await supabase
            .from("assignment_submissions")
            .select("assignment_id")
            .eq("student_id", user.id)
            .in("assignment_id", aIds);
          const submitted = new Set((subs || []).map((s) => s.assignment_id));
          pendingN = aIds.filter((id) => !submitted.has(id)).length;
        }
      }
      setPendingCount(pendingN);

      // Course titles for progress dialog
      if (courseIds.length > 0) {
        const { data: courseData } = await supabase
          .from("courses").select("id, title").in("id", courseIds);
        const progMap = Object.fromEntries((enrollments || []).map((e) => [e.course_id, e.progress]));
        setEnrolledCourses((courseData || []).map((c) => ({ id: c.id, title: c.title, progress: progMap[c.id] || 0 })));
      } else {
        setEnrolledCourses([]);
      }

      // Avg progress
      const { data: progressData } = await supabase
        .from("lesson_progress").select("progress_pct, updated_at").eq("user_id", user.id);
      const avg = progressData?.length
        ? Math.round(progressData.reduce((s, p) => s + p.progress_pct, 0) / progressData.length)
        : 0;
      setProgress(avg);

      // Real study activity per weekday (Mon-Sun) — approximate from lesson_progress updates this week
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const buckets = weekDays.map((day) => ({ day, minutes: 0 }));
      (progressData || []).forEach((p: any) => {
        const d = new Date(p.updated_at);
        if (d >= weekStart && d <= weekEnd) {
          const idx = (d.getDay() + 6) % 7;
          // approximate 5 minutes per progress update
          buckets[idx].minutes += 5;
        }
      });
      setActivityData(buckets);

      // Recent activity
      const { data: recentProgress } = await supabase
        .from("lesson_progress")
        .select("id, updated_at, lesson_id, course_lessons(title, lesson_type)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);
      setRecentActivity(recentProgress || []);

      // Today's events
      const { data: events } = await supabase
        .from("events")
        .select("id, title, event_date, location, event_type, image_url")
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .gte("event_date", dayStart)
        .lte("event_date", dayEnd)
        .order("event_date");
      setTodayEvents(events || []);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const isClassLive = (scheduledAt: string, durationMin: number) => {
    const now = new Date();
    const start = subMinutes(new Date(scheduledAt), 10);
    const end = addMinutes(new Date(scheduledAt), durationMin || 60);
    return now >= start && now <= end;
  };

  const handleProgressClick = () => {
    if (enrolledCourses.length === 1) navigate("/dashboard/student/courses");
    else setShowProgress(true);
  };

  const getLessonTypeIcon = (type: string) => {
    if (type === "video") return { icon: PlayCircle, bg: "bg-red-100", color: "text-red-600" };
    if (type === "pdf") return { icon: FileText, bg: "bg-blue-100", color: "text-blue-600" };
    if (type === "audio") return { icon: Headphones, bg: "bg-amber-100", color: "text-amber-600" };
    return { icon: FileText, bg: "bg-stone-100", color: "text-stone-600" };
  };

  const getInitials = (name: string) => name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      {/* Hero quote */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-primary p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-10 -mt-10 blur-2xl" />
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

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* My Batch */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div onClick={() => batchId && setShowBatch(true)}
            className={`bg-gradient-to-br ${statGradients[0]} rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${batchId ? "cursor-pointer" : ""}`}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center mb-2 sm:mb-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-end justify-between">
              <div className="min-w-0">
                <p className="font-serif text-lg sm:text-xl font-bold text-white mt-1 truncate">
                  {loading ? <Skeleton className="h-6 w-16 bg-white/20" /> : batchName}
                </p>
                <p className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-wider mt-1">My Batch</p>
              </div>
              {batchId && <ChevronRight className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>
        </motion.div>

        {/* My Classes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div onClick={() => setShowClasses(true)}
            className={`bg-gradient-to-br ${statGradients[1]} rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center mb-2 sm:mb-3">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                {loading ? <Skeleton className="h-7 w-20 bg-white/20" /> : (
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-white">{todayCounts.offline}</span>
                    <span className="text-[10px] text-white/70 uppercase">Offline</span>
                    <span className="text-white/40">·</span>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-white">{todayCounts.online}</span>
                    <span className="text-[10px] text-white/70 uppercase">Online</span>
                  </div>
                )}
                <p className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-wider mt-1">My Classes (Today)</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>

        {/* My Assignments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div onClick={() => navigate("/dashboard/student/assignments")}
            className={`bg-gradient-to-br ${statGradients[2]} rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center mb-2 sm:mb-3">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  {loading ? <Skeleton className="h-7 w-12 bg-white/20" /> : pendingCount}
                </p>
                <p className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-wider mt-1">My Assignments</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>

        {/* Study Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <div onClick={handleProgressClick}
            className={`bg-gradient-to-br ${statGradients[3]} rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/15 flex items-center justify-center mb-2 sm:mb-3">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  {loading ? <Skeleton className="h-7 w-16 bg-white/20" /> : `${progress}%`}
                </p>
                <p className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-wider mt-1">Study Progress</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle row: Activity + Online Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
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
                <span className="font-bold text-orange-600">{activityData.filter(d => d.minutes > 0).length}</span> active days
              </div>
            </div>
          </div>
          <div className="px-3 sm:px-5 pb-1">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={activityData} barCategoryGap="25%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8C7B6B" }} />
                <Tooltip formatter={(v: number) => [`${v} min`, "Study time"]} cursor={false}
                  contentStyle={{ borderRadius: 12, border: "1px solid #EDE3CC", fontSize: 12 }} />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {activityData.map((_, i) => (
                    <Cell key={i} fill={i === todayIdx ? "#7D1E24" : activityData[i].minutes > 30 ? "#C49A3C" : "#EDE3CC"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {recentActivity.length > 0 && (
            <div className="px-3 sm:px-5 pb-3 sm:pb-5 border-t border-brand-parchment/50">
              <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey font-semibold pt-2.5 pb-2">Recent Activity</p>
              <div className="space-y-1.5">
                {recentActivity.map((item: any) => {
                  const lesson = item.course_lessons;
                  const meta = getLessonTypeIcon(lesson?.lesson_type || "text");
                  const Icon = meta.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                      <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-brand-charcoal-mid truncate">{lesson?.title || "Lesson"}</p>
                      </div>
                      <p className="text-[10px] text-brand-warm-grey shrink-0">
                        {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Online Classes (Today) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <div className="bg-gradient-to-r from-brand-primary/5 to-brand-gold/5 px-3 sm:px-5 pt-3 sm:pt-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
                  <Video className="w-4 h-4 text-brand-primary" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Online Classes</h3>
              </div>
              <Link to="/dashboard/student/live-classes" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">
                See All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            {loading ? (
              <div className="space-y-3 pt-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 sm:h-16 rounded-xl" />)}</div>
            ) : todayOnlineClasses.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
                  <Video className="w-6 h-6 sm:w-7 sm:h-7 text-brand-gold" />
                </div>
                <p className="font-serif text-brand-charcoal-mid text-sm">No online classes today</p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {todayOnlineClasses.map((cls) => {
                  const live = isClassLive(cls.scheduled_at, cls.duration_minutes);
                  const faculty = cls.profiles?.display_name || "Faculty";
                  return (
                    <div key={cls.id}
                      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-brand-cream transition-all duration-200 border ${live ? "border-green-200 bg-green-50/30" : "border-transparent hover:border-brand-gold/30"}`}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-brand-primary font-bold text-[10px] sm:text-xs shrink-0 border border-brand-gold/20">
                        {getInitials(faculty)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-brand-charcoal truncate">{cls.title}</p>
                        <p className="text-[10px] sm:text-xs text-brand-warm-grey truncate">{faculty}</p>
                        <p className="text-[10px] text-brand-warm-grey">
                          {format(new Date(cls.scheduled_at), "h:mm a")} · {cls.duration_minutes ?? 60} min
                        </p>
                      </div>
                      <div className="shrink-0">
                        {live ? (
                          <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-3">
                              Join →
                            </Button>
                          </a>
                        ) : (
                          <Button size="sm" disabled className="h-7 text-[10px] rounded-lg px-3" title="Available 10 min before start">
                            Join
                          </Button>
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

      {/* Events for Today */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-primary">Events for Today</h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <Link to="/dashboard/student/events" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">
            See All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : todayEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid text-sm">No events today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayEvents.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl border border-brand-parchment p-4 hover:border-brand-gold/40 transition-all">
                <p className="text-sm font-bold text-brand-charcoal-mid">{ev.title}</p>
                <p className="text-[11px] text-brand-warm-grey mt-1">
                  {format(new Date(ev.event_date), "h:mm a")}
                </p>
                {ev.location && (
                  <p className="text-[11px] text-brand-warm-grey mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {ev.location}
                  </p>
                )}
                {ev.event_type && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider bg-brand-cream px-2 py-0.5 rounded-full text-brand-primary font-bold">
                    {ev.event_type}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Explore courses CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-dark rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
            </div>
            <div>
              <p className="font-serif text-sm sm:text-base font-semibold text-white">Explore new courses</p>
              <p className="text-[10px] sm:text-xs text-white/60">Browse all available courses and enroll</p>
            </div>
          </div>
          <Link to="/dashboard/student/courses?tab=explore" className="w-full sm:w-auto relative">
            <Button className="w-full sm:w-auto bg-brand-gold hover:bg-brand-gold-light text-brand-charcoal font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              Explore Courses <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Dialogs */}
      <BatchRosterDialog open={showBatch} onOpenChange={setShowBatch} batchId={batchId} batchName={batchName} />
      <TodayClassesDialog open={showClasses} onOpenChange={setShowClasses} classes={todayClasses} />
      <CourseProgressDialog open={showProgress} onOpenChange={setShowProgress} courses={enrolledCourses} />
    </div>
  );
};

export default DashboardOverview;
