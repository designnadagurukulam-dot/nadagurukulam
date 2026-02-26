import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, DollarSign, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#4ade80", "#f59e0b", "#f43f5e"];

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

      // Enrollments by month
      const monthMap: Record<string, number> = {};
      (enrollRes.data || []).forEach((e) => {
        const month = new Date(e.enrolled_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });
      setEnrollmentsByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })));

      // Revenue by month
      const revMap: Record<string, number> = {};
      let totalRev = 0;
      (ordersRes.data || []).forEach((o) => {
        const month = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
        const amt = Number(o.amount);
        revMap[month] = (revMap[month] || 0) + amt;
        totalRev += amt;
      });
      setRevenueByMonth(Object.entries(revMap).map(([month, amount]) => ({ month, amount })));

      // Courses by status
      const statusMap: Record<string, number> = {};
      (coursesRes.data || []).forEach((c) => {
        statusMap[c.status || "draft"] = (statusMap[c.status || "draft"] || 0) + 1;
      });
      setCoursesByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Top courses
      const courseCountMap: Record<string, { title: string; count: number }> = {};
      (enrollCountRes.data || []).forEach((e: any) => {
        const id = e.course_id;
        if (!courseCountMap[id]) courseCountMap[id] = { title: e.courses?.title || "Unknown", count: 0 };
        courseCountMap[id].count++;
      });
      setTopCourses(Object.values(courseCountMap).sort((a, b) => b.count - a.count).slice(0, 5));

      setTotals({
        enrollments: enrollRes.data?.length || 0,
        courses: coursesRes.data?.length || 0,
        revenue: totalRev,
        certificates: certsRes.count || 0,
      });

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Enrollments", value: totals.enrollments, icon: Users, color: "from-primary to-primary/80" },
    { label: "Total Courses", value: totals.courses, icon: BookOpen, color: "from-secondary to-secondary/80" },
    { label: "Revenue", value: `₹${totals.revenue.toLocaleString()}`, icon: DollarSign, color: "from-green-600 to-green-700" },
    { label: "Certificates", value: totals.certificates, icon: Award, color: "from-yellow-500 to-yellow-600" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform insights and trends</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${s.color} p-5 text-white`}>
                  <s.icon className="h-7 w-7 mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-sm opacity-90 mt-1">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollments Chart */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Enrollment Trends</CardTitle></CardHeader>
          <CardContent>
            {enrollmentsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={enrollmentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Enrollments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No enrollment data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Revenue Trends</CardTitle></CardHeader>
          <CardContent>
            {revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                  <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No revenue data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Courses by Status */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Courses by Status</CardTitle></CardHeader>
          <CardContent>
            {coursesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={coursesByStatus} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`} paddingAngle={3}>
                    {coursesByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No course data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader><CardTitle>Top Courses by Enrollment</CardTitle></CardHeader>
          <CardContent>
            {topCourses.length > 0 ? (
              <div className="space-y-4">
                {topCourses.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary w-8">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{c.title}</p>
                      <div className="h-2 bg-muted rounded-full mt-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(c.count / topCourses[0].count) * 100}%`,
                            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{c.count} enrolled</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No enrollment data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
