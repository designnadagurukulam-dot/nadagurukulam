import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, IndianRupee, Award, BarChart3, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#7D1E24", "#C49A3C", "#E2B95A", "#5C1219", "#8C7B6B"];

const AdminAnalytics = () => {
  const [enrollmentsByMonth, setEnrollmentsByMonth] = useState<any[]>([]);
  const [coursesByStatus, setCoursesByStatus] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [totals, setTotals] = useState({ enrollments: 0, courses: 0, revenue: 0, certificates: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [enrollRes, coursesRes, enrollCountRes, ordersRes, certsRes] = await Promise.all([
        supabase.from("enrollments").select("enrolled_at"),
        supabase.from("courses").select("status"),
        supabase.from("enrollments").select("course_id, courses(title)"),
        supabase.from("orders").select("amount, created_at, status").eq("status", "completed"),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
      ]);
      const monthMap: Record<string, number> = {};
      (enrollRes.data || []).forEach((e) => { const month = new Date(e.enrolled_at).toLocaleDateString("en", { month: "short", year: "2-digit" }); monthMap[month] = (monthMap[month] || 0) + 1; });
      setEnrollmentsByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })));
      const revMap: Record<string, number> = {};
      let totalRev = 0;
      (ordersRes.data || []).forEach((o) => { const month = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" }); const amt = Number(o.amount); revMap[month] = (revMap[month] || 0) + amt; totalRev += amt; });
      setRevenueByMonth(Object.entries(revMap).map(([month, amount]) => ({ month, amount })));
      const statusMap: Record<string, number> = {};
      (coursesRes.data || []).forEach((c) => { statusMap[c.status || "draft"] = (statusMap[c.status || "draft"] || 0) + 1; });
      setCoursesByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));
      const courseCountMap: Record<string, { title: string; count: number }> = {};
      (enrollCountRes.data || []).forEach((e: any) => { const id = e.course_id; if (!courseCountMap[id]) courseCountMap[id] = { title: e.courses?.title || "Unknown", count: 0 }; courseCountMap[id].count++; });
      setTopCourses(Object.values(courseCountMap).sort((a, b) => b.count - a.count).slice(0, 5));
      setTotals({ enrollments: enrollRes.data?.length || 0, courses: coursesRes.data?.length || 0, revenue: totalRev, certificates: certsRes.count || 0 });
      setLoading(false);
    };
    fetchData();
  }, []);

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
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
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
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #EDE3CC", background: "#fff" }} />
                <Bar dataKey="count" fill="#7D1E24" radius={[6, 6, 0, 0]} name="Enrollments" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-brand-warm-grey text-center py-8">No enrollment data yet</p>}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
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
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
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
          className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
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
      </div>
    </div>
  );
};

export default AdminAnalytics;
