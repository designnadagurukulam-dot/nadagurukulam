import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#D4AF37", "#4ade80", "#f59e0b"];

const AdminAnalytics = () => {
  const [enrollmentsByMonth, setEnrollmentsByMonth] = useState<any[]>([]);
  const [coursesByStatus, setCoursesByStatus] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [enrollRes, coursesRes, enrollCountRes] = await Promise.all([
        supabase.from("enrollments").select("enrolled_at"),
        supabase.from("courses").select("status"),
        supabase.from("enrollments").select("course_id, courses(title)"),
      ]);

      // Enrollments by month
      const monthMap: Record<string, number> = {};
      (enrollRes.data || []).forEach((e) => {
        const month = new Date(e.enrolled_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });
      setEnrollmentsByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })));

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

      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform insights and trends</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollments Chart */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Enrollment Trends</CardTitle></CardHeader>
          <CardContent>
            {enrollmentsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={enrollmentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No enrollment data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Courses by Status */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Courses by Status</CardTitle></CardHeader>
          <CardContent>
            {coursesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={coursesByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {coursesByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No course data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Courses */}
      <Card>
        <CardHeader><CardTitle>Top Courses by Enrollment</CardTitle></CardHeader>
        <CardContent>
          {topCourses.length > 0 ? (
            <div className="space-y-3">
              {topCourses.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary w-8">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{c.title}</p>
                    <div className="h-2 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(c.count / topCourses[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{c.count} enrolled</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No enrollment data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
