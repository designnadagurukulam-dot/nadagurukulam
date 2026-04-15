import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, BookOpen, IndianRupee, Award, BarChart3, Sparkles,
  ClipboardList, MessageSquare, Video, Wifi, WifiOff, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#7D1E24", "#C49A3C", "#E2B95A", "#5C1219", "#8C7B6B"];
const FEEDBACK_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

const AdminAnalytics = () => {
  const [enrollmentsByMonth, setEnrollmentsByMonth] = useState<any[]>([]);
  const [coursesByStatus, setCoursesByStatus] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [totals, setTotals] = useState({ enrollments: 0, courses: 0, revenue: 0, certificates: 0 });
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const [liveClassData, setLiveClassData] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [enrollRes, coursesRes, enrollCountRes, ordersRes, certsRes,
        assignRes, subRes, fbRes, lcRes, alRes] = await Promise.all([
        supabase.from("enrollments").select("enrolled_at"),
        supabase.from("courses").select("status"),
        supabase.from("enrollments").select("course_id, courses(title)"),
        supabase.from("orders").select("amount, created_at, status").eq("status", "completed"),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("assignments").select("id, due_date, course_id"),
        supabase.from("assignment_submissions").select("id, grade, assignment_id"),
        supabase.from("feedback").select("rating, categories, submitted_at"),
        supabase.from("live_classes").select("id, class_type, scheduled_at, status"),
        supabase.from("activity_logs").select("created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);

      // Enrollment trends
      const monthMap: Record<string, number> = {};
      (enrollRes.data || []).forEach(e => { const month = new Date(e.enrolled_at).toLocaleDateString("en", { month: "short", year: "2-digit" }); monthMap[month] = (monthMap[month] || 0) + 1; });
      setEnrollmentsByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })));

      // Revenue
      const revMap: Record<string, number> = {};
      let totalRev = 0;
      (ordersRes.data || []).forEach(o => { const month = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" }); const amt = Number(o.amount); revMap[month] = (revMap[month] || 0) + amt; totalRev += amt; });
      setRevenueByMonth(Object.entries(revMap).map(([month, amount]) => ({ month, amount })));

      // Courses by status
      const statusMap: Record<string, number> = {};
      (coursesRes.data || []).forEach(c => { statusMap[c.status || "draft"] = (statusMap[c.status || "draft"] || 0) + 1; });
      setCoursesByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Top courses
      const courseCountMap: Record<string, { title: string; count: number }> = {};
      (enrollCountRes.data || []).forEach((e: any) => { const id = e.course_id; if (!courseCountMap[id]) courseCountMap[id] = { title: e.courses?.title || "Unknown", count: 0 }; courseCountMap[id].count++; });
      setTopCourses(Object.values(courseCountMap).sort((a, b) => b.count - a.count).slice(0, 5));

      setTotals({ enrollments: enrollRes.data?.length || 0, courses: coursesRes.data?.length || 0, revenue: totalRev, certificates: certsRes.count || 0 });
      setAssignments(assignRes.data || []);
      setSubmissions(subRes.data || []);
      setFeedbackData(fbRes.data || []);
      setLiveClassData(lcRes.data || []);
      setActivityLogs(alRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Assignment analytics
  const assignmentAnalytics = useMemo(() => {
    const total = assignments.length;
    const totalSubs = submissions.length;
    const graded = submissions.filter(s => s.grade).length;
    const ungraded = totalSubs - graded;
    const completionRate = total > 0 ? Math.round((totalSubs / total) * 100) : 0;
    return { total, totalSubs, graded, ungraded, completionRate };
  }, [assignments, submissions]);

  // Feedback analytics
  const feedbackAnalytics = useMemo(() => {
    const ratingDist = [0, 0, 0, 0, 0];
    const categoryMap: Record<string, number> = {};
    feedbackData.forEach(f => {
      const cats = Array.isArray(f.categories) && f.categories.length > 0 ? f.categories : null;
      if (cats) {
        cats.forEach((c: any) => {
          if (c.rating >= 1 && c.rating <= 5) ratingDist[c.rating - 1]++;
          if (c.category) categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
        });
      } else if (f.rating >= 1 && f.rating <= 5) {
        ratingDist[f.rating - 1]++;
      }
    });
    return {
      ratingDist: ratingDist.map((count, i) => ({ stars: `${i + 1}★`, count })),
      categories: Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
    };
  }, [feedbackData]);

  // Live class analytics
  const liveClassAnalytics = useMemo(() => {
    const total = liveClassData.length;
    const online = liveClassData.filter(c => c.class_type !== "offline").length;
    const offline = liveClassData.filter(c => c.class_type === "offline").length;
    return { total, online, offline, split: [{ name: "Online", value: online }, { name: "Offline", value: offline }].filter(s => s.value > 0) };
  }, [liveClassData]);

  // Active users (last 30 days)
  const activeUsersData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    activityLogs.forEach(l => {
      const day = new Date(l.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });
    return Object.entries(dayMap).map(([date, count]) => ({ date, count })).slice(-14);
  }, [activityLogs]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Enrollments", value: totals.enrollments, icon: Users, gradient: "from-brand-primary to-brand-primary-dark" },
    { label: "Total Courses", value: totals.courses, icon: BookOpen, gradient: "from-brand-gold to-amber-600" },
    { label: "Revenue", value: `₹${totals.revenue.toLocaleString()}`, icon: IndianRupee, gradient: "from-emerald-700 to-green-600" },
    { label: "Certificates", value: totals.certificates, icon: Award, gradient: "from-brand-gold-dark to-brand-gold" },
  ];

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Analytics</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
        <p className="text-sm text-brand-warm-grey mt-2">Platform insights and trends</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollments Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Enrollment Trends</h3>
          </div>
          {enrollmentsByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE3CC" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8C7B6B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#8C7B6B" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #EDE3CC" }} />
                <Bar dataKey="count" fill="#7D1E24" radius={[6, 6, 0, 0]} name="Enrollments" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-brand-warm-grey text-center py-8">No enrollment data yet</p>}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Revenue Trends</h3>
          </div>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE3CC" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8C7B6B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#8C7B6B" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #EDE3CC" }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="amount" stroke="#C49A3C" strokeWidth={2} dot={{ r: 4, fill: "#C49A3C" }} name="Revenue (₹)" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-brand-warm-grey text-center py-8">No revenue data yet</p>}
        </motion.div>

        {/* Courses by Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary-dark to-rose-900 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Courses by Status</h3>
          </div>
          {coursesByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={coursesByStatus} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`} paddingAngle={3}>
                  {coursesByStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-brand-warm-grey text-center py-8">No course data yet</p>}
        </motion.div>

        {/* Top Courses */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-amber-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Top Courses by Enrollment</h3>
          </div>
          {topCourses.length > 0 ? (
            <div className="space-y-4">
              {topCourses.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-serif text-2xl font-bold text-brand-primary w-8">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-charcoal truncate">{c.title}</p>
                    <div className="h-2 bg-brand-cream rounded-full mt-1.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(c.count / topCourses[0].count) * 100}%`, background: "linear-gradient(90deg, #7D1E24, #C49A3C)" }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brand-warm-grey whitespace-nowrap">{c.count} enrolled</span>
                </div>
              ))}
            </div>
          ) : <p className="text-brand-warm-grey text-center py-8">No enrollment data yet</p>}
        </motion.div>

        {/* Assignment Analytics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Assignment Analytics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total", value: assignmentAnalytics.total },
              { label: "Submissions", value: assignmentAnalytics.totalSubs },
              { label: "Graded", value: assignmentAnalytics.graded },
              { label: "Ungraded", value: assignmentAnalytics.ungraded },
            ].map(s => (
              <div key={s.label} className="bg-brand-cream/50 rounded-xl p-3 text-center">
                <p className="font-serif text-2xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-brand-cream rounded-xl p-3">
            <div className="flex justify-between text-xs text-brand-warm-grey mb-1">
              <span>Completion Rate</span>
              <span className="font-bold text-brand-primary">{assignmentAnalytics.completionRate}%</span>
            </div>
            <div className="h-2 bg-brand-parchment rounded-full">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-gold transition-all" style={{ width: `${assignmentAnalytics.completionRate}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Feedback Analytics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold-dark to-brand-gold flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Feedback Analytics</h3>
          </div>
          {feedbackAnalytics.ratingDist.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={feedbackAnalytics.ratingDist}>
                <XAxis dataKey="stars" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8C7B6B" }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDE3CC", fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Ratings">
                  {feedbackAnalytics.ratingDist.map((_, i) => <Cell key={i} fill={FEEDBACK_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-brand-warm-grey text-center py-8">No feedback data yet</p>}
          {feedbackAnalytics.categories.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-brand-warm-grey font-semibold uppercase tracking-widest">Top Categories</p>
              {feedbackAnalytics.categories.map(c => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-brand-charcoal">{c.name}</span>
                  <span className="text-brand-warm-grey font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Live Class Analytics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-pink-800 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Live Class Analytics</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Total", value: liveClassAnalytics.total, icon: Video },
              { label: "Online", value: liveClassAnalytics.online, icon: Wifi },
              { label: "Offline", value: liveClassAnalytics.offline, icon: WifiOff },
            ].map(s => (
              <div key={s.label} className="bg-brand-cream/50 rounded-xl p-3 text-center">
                <s.icon className="h-4 w-4 text-brand-gold mx-auto mb-1" />
                <p className="font-serif text-xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm-grey">{s.label}</p>
              </div>
            ))}
          </div>
          {liveClassAnalytics.split.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={liveClassAnalytics.split} cx="50%" cy="50%" outerRadius={60} innerRadius={35} dataKey="value" label paddingAngle={5}>
                  {liveClassAnalytics.split.map((_, idx) => <Cell key={idx} fill={idx === 0 ? "#3b82f6" : "#8C7B6B"} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Active Users */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-brand-primary">Active Users (Last 14 Days)</h3>
          </div>
          {activeUsersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activeUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE3CC" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8C7B6B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8C7B6B" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDE3CC", fontSize: 12 }} />
                <Bar dataKey="count" fill="#7D1E24" radius={[4, 4, 0, 0]} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-brand-warm-grey text-center py-8">No activity data yet</p>}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
