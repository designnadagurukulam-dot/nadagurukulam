import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const InstructorAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, approvedCourses: 0 });
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, status")
        .eq("instructor_id", user.id);

      const courseIds = (courses || []).map((c) => c.id);
      const approved = (courses || []).filter((c) => c.status === "approved").length;

      // Get enrollments for instructor's courses
      const { data: enrollments } = courseIds.length > 0
        ? await supabase.from("enrollments").select("course_id, enrolled_at").in("course_id", courseIds)
        : { data: [] };

      // Enrollments by month
      const monthMap: Record<string, number> = {};
      (enrollments || []).forEach((e) => {
        const month = new Date(e.enrolled_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      // Per-course enrollment counts
      const courseCountMap: Record<string, number> = {};
      (enrollments || []).forEach((e) => {
        courseCountMap[e.course_id] = (courseCountMap[e.course_id] || 0) + 1;
      });
      const perCourse = (courses || []).map((c) => ({
        title: c.title.length > 20 ? c.title.slice(0, 20) + "…" : c.title,
        students: courseCountMap[c.id] || 0,
      }));

      setStats({
        totalCourses: courses?.length || 0,
        totalStudents: enrollments?.length || 0,
        approvedCourses: approved,
      });
      setEnrollmentData(Object.entries(monthMap).map(([month, count]) => ({ month, count })));
      setCourseStats(perCourse);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "My Courses", value: stats.totalCourses, icon: BookOpen },
    { label: "Total Students", value: stats.totalStudents, icon: Users },
    { label: "Live Courses", value: stats.approvedCourses, icon: Eye },
  ];

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">My Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your course performance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Enrollment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={enrollmentData}>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Students per Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={courseStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="students" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No courses yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorAnalytics;
