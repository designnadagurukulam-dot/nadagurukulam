import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Clock,
  ShieldCheck, Layers,
  Sparkles, Crown, Zap, TrendingUp, ClipboardList, Mail, Star
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import LiveClassesBlock from "@/components/overview/LiveClassesBlock";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const AdminOverview = () => {
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    courses: 0, students: 0, instructors: 0,
    batches: 0, liveClasses: 0,
    pendingVerifications: 0,
    pendingReviews: 0,
    ungradedSubmissions: 0,
    unreadMessages: 0,
    pendingInquiries: 0,
    unreadFeedback: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<{ day: string; actions: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const dayOfWeek = (now.getDay() + 6) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        coursesRes, studentRes, instructorRes,
        batchRes, liveRes,
        pendingVerifRes,
        ungradedRes, unreadRes,
        pendingInquiriesRes,
        weekActivityRes,
      ] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "instructor"),
        supabase.from("batches").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("live_classes").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
        supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).is("grade", null),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("program_inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("activity_logs").select("created_at").gte("created_at", weekStart.toISOString()),
      ]);

      setStats({
        courses: coursesRes.count || 0,
        students: studentRes.count || 0,
        instructors: instructorRes.count || 0,
        batches: batchRes.count || 0,
        liveClasses: liveRes.count || 0,
        pendingVerifications: pendingVerifRes.count || 0,
        pendingReviews: pendingReviewsRes.count || 0,
        ungradedSubmissions: ungradedRes.count || 0,
        unreadMessages: unreadRes.count || 0,
        pendingInquiries: pendingInquiriesRes.count || 0,
        unreadFeedback: recentFeedbackRes.count || 0,
      });

      const dayCounts: Record<string, number> = {};
      weekDays.forEach(d => { dayCounts[d] = 0; });
      (weekActivityRes.data || []).forEach(log => {
        const d = new Date(log.created_at);
        const idx = (d.getDay() + 6) % 7;
        if (idx < 7) dayCounts[weekDays[idx]]++;
      });
      setActivityData(weekDays.map(day => ({ day, actions: dayCounts[day] })));

      setLoading(false);
    };
    fetchAll();
  }, []);

  const todayIdx = (new Date().getDay() + 6) % 7;

  // Every stat block links to its respective management page
  const statCards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen, gradient: "from-brand-primary to-brand-primary-dark", to: "/dashboard/admin/curriculum" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Clock, gradient: "from-amber-500 to-orange-600", to: "/dashboard/admin/approvals" },
    { label: "Ungraded", value: stats.ungradedSubmissions, icon: ClipboardList, gradient: "from-red-600 to-red-800", to: "/dashboard/admin/assignments" },
    { label: "Recent Feedback", value: stats.unreadFeedback, icon: Star, gradient: "from-brand-gold-dark to-brand-gold", to: "/dashboard/admin/feedback" },
  ];

  // Quick actions show ONLY unread / pending counts (not totals)
  const quickActions = [
    { label: "Verification", icon: ShieldCheck, to: "/dashboard/admin/verification", count: stats.pendingVerifications },
    { label: "Assignments", icon: ClipboardList, to: "/dashboard/admin/assignments", count: stats.ungradedSubmissions },
    { label: "Inquiries", icon: Mail, to: "/dashboard/admin/inquiries", count: stats.pendingInquiries },
    { label: "Manage Batches", icon: Layers, to: "/dashboard/admin/batches", count: 0 },
    { label: "Manage Users", icon: Users, to: "/dashboard/admin/students", count: 0 },
    ...(isSuperAdmin ? [{ label: "Message Monitor", icon: Mail, to: "/dashboard/admin/messages", count: stats.unreadMessages }] : []),
  ];

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary-dark to-[#3a0a0e] p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-brand-gold" />
            <span className="text-brand-gold text-xs font-semibold uppercase tracking-widest">Admin Dashboard</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Welcome Back, Administrator</h1>
          <p className="text-white/70 text-sm mt-1.5 max-w-md">Monitor platform health, manage users, and oversee all institutional operations from one place.</p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-brand-gold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{stats.pendingVerifications} pending verification{stats.pendingVerifications !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>{stats.ungradedSubmissions} ungraded</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{stats.students} total students</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid — every card is now clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <button
              type="button"
              onClick={() => navigate(s.to)}
              className="w-full text-left group relative bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              aria-label={`Open ${s.label}`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-gold/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-serif text-3xl font-bold text-brand-primary mt-3">{s.value}</p>
              <p className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1">{s.label}</p>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Platform Activity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-brand-primary">Platform Activity</h3>
            </div>
            <span className="text-[11px] text-brand-warm-grey uppercase tracking-wider">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={activityData} barCategoryGap="25%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C7B6B' }} />
              <Tooltip formatter={(v: number) => [`${v}`, 'Actions']} cursor={false}
                contentStyle={{ borderRadius: 12, border: '1px solid #EDE3CC', fontSize: 12 }} />
              <Bar dataKey="actions" radius={[6, 6, 0, 0]}>
                {activityData.map((_, i) => (
                  <Cell key={i} fill={i === todayIdx ? '#7D1E24' : '#C49A3C'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Actions — counts shown only for unread/pending items */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-brand-primary">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.to}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-brand-parchment hover:bg-brand-cream hover:border-brand-gold/40 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center group-hover:from-brand-gold/30 group-hover:to-brand-gold/10 transition-all">
                  <action.icon className="w-3.5 h-3.5 text-brand-gold" />
                </div>
                <span className="text-xs font-semibold text-brand-charcoal-mid group-hover:text-brand-primary transition-colors">{action.label}</span>
                {action.count > 0 && (
                  <span className="ml-auto text-[10px] bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-1.5 py-0.5 rounded-full font-bold">{action.count}</span>
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live Classes — All */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <LiveClassesBlock scope={{ kind: "admin" }} seeAllLink="/dashboard/admin/live-classes" />
      </motion.div>
    </div>
  );
};

export default AdminOverview;
