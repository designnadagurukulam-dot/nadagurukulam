import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Clock, DollarSign, GraduationCap, Video,
  MessageSquare, ShieldCheck, ArrowRight, Layers, CheckSquare, Calendar, BarChart3,
  Sparkles, Crown, Zap, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIdx = (new Date().getDay() + 6) % 7;

const AdminOverview = () => {
  const [stats, setStats] = useState({
    courses: 0, students: 0, instructors: 0, pending: 0,
    revenue: 0, batches: 0, liveClasses: 0, feedback: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityData] = useState(() =>
    weekDays.map((day) => ({ day, actions: Math.floor(Math.random() * 30 + 5) }))
  );

  useEffect(() => {
    const fetch = async () => {
      const [
        coursesRes, studentRes, instructorRes, pendingRes,
        ordersRes, batchRes, liveRes, feedbackRes,
        activityRes, recentCoursesRes,
      ] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "instructor"),
        supabase.from("content_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("amount").eq("status", "completed"),
        supabase.from("batches").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("live_classes").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("feedback").select("id", { count: "exact", head: true }),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("courses").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const revenue = (ordersRes.data || []).reduce((s, o) => s + Number(o.amount), 0);
      setStats({
        courses: coursesRes.count || 0, students: studentRes.count || 0,
        instructors: instructorRes.count || 0, pending: pendingRes.count || 0,
        revenue, batches: batchRes.count || 0, liveClasses: liveRes.count || 0,
        feedback: feedbackRes.count || 0,
      });
      setRecentActivity(activityRes.data || []);
      setRecentCourses(recentCoursesRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen, gradient: "from-brand-primary to-brand-primary-dark" },
    { label: "Students", value: stats.students, icon: GraduationCap, gradient: "from-brand-gold to-amber-600" },
    { label: "Tutors", value: stats.instructors, icon: Users, gradient: "from-brand-primary-dark to-rose-900" },
    { label: "Active Batches", value: stats.batches, icon: Layers, gradient: "from-brand-gold to-yellow-700" },
    { label: "Pending Reviews", value: stats.pending, icon: Clock, gradient: "from-amber-500 to-orange-600" },
    { label: "Live Classes", value: stats.liveClasses, icon: Video, gradient: "from-brand-primary to-pink-800" },
    { label: "Feedback", value: stats.feedback, icon: MessageSquare, gradient: "from-brand-gold-dark to-brand-gold" },
    { label: "Revenue (₹)", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, gradient: "from-emerald-700 to-green-600" },
  ];

  const quickActions = [
    { label: "Review Submissions", icon: CheckSquare, to: "/dashboard/admin/approvals", count: stats.pending },
    { label: "Manage Batches", icon: Layers, to: "/dashboard/admin/batches" },
    { label: "Manage Users", icon: Users, to: "/dashboard/admin/students" },
    { label: "Verification", icon: ShieldCheck, to: "/dashboard/admin/verification" },
    { label: "Schedules", icon: Calendar, to: "/dashboard/admin/schedule" },
    { label: "View Feedback", icon: MessageSquare, to: "/dashboard/admin/feedback" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
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
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-brand-gold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{stats.pending} pending review{stats.pending !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{stats.students} total students</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="group relative bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-gold/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-serif text-3xl font-bold text-brand-primary mt-3">{s.value}</p>
              <p className="text-[11px] text-brand-warm-grey uppercase tracking-wider mt-1">{s.label}</p>
            </div>
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

        {/* Quick Actions */}
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
                {action.count !== undefined && action.count > 0 && (
                  <span className="ml-auto text-[10px] bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-1.5 py-0.5 rounded-full font-bold">{action.count}</span>
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Courses Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-brand-primary">Recent Courses</h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <Link to="/dashboard/admin/courses" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">See All <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid">No courses yet</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-parchment overflow-hidden bg-white shadow-[0_2px_24px_rgba(125,30,36,0.04)]">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-brand-primary-dark to-brand-primary text-brand-gold-light text-[11px] uppercase tracking-widest">
                  <th className="px-5 py-3.5 text-left font-semibold">Course</th>
                  <th className="px-5 py-3.5 text-left font-semibold hidden sm:table-cell">Created</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((c, i) => (
                  <tr key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream'} border-b border-brand-cream-dark hover:bg-brand-gold-pale/30 transition-colors`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-brand-charcoal-mid truncate max-w-[200px]">{c.title}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-warm-grey hidden sm:table-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                        c.status === "approved" ? "bg-green-50 text-green-700" : c.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-brand-cream-dark text-brand-warm-grey"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-brand-primary">Recent Activity</h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
            </div>
          </div>
          <Link to="/dashboard/admin/activity" className="text-xs text-brand-gold hover:text-brand-primary font-semibold flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-parchment p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-serif text-brand-charcoal-mid">No recent activity</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-parchment overflow-hidden">
            {recentActivity.map((a, i) => (
              <div key={a.id} className={`flex items-center justify-between px-5 py-3.5 text-sm ${i % 2 === 0 ? '' : 'bg-brand-cream'} border-b border-brand-cream-dark last:border-0 hover:bg-brand-gold-pale/20 transition-colors`}>
                <span className="text-brand-charcoal-mid">{a.action}</span>
                <span className="text-xs text-brand-warm-grey">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminOverview;
