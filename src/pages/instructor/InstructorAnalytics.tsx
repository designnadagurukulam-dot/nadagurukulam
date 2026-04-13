import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const InstructorAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, approvedCourses: 0 });
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: courses } = await supabase.from("courses").select("id, title, status").eq("instructor_id", user.id);
      const courseIds = (courses || []).map((c) => c.id);
      const approved = (courses || []).filter((c) => c.status === "approved").length;
      const { data: enrollments } = courseIds.length > 0 ? await supabase.from("enrollments").select("course_id, enrolled_at").in("course_id", courseIds) : { data: [] };
      const monthMap: Record<string, number> = {};
      (enrollments || []).forEach((e) => { const month = new Date(e.enrolled_at).toLocaleDateString("en", { month: "short", year: "2-digit" }); monthMap[month] = (monthMap[month] || 0) + 1; });
      const courseCountMap: Record<string, number> = {};
      (enrollments || []).forEach((e) => { courseCountMap[e.course_id] = (courseCountMap[e.course_id] || 0) + 1; });
      const perCourse = (courses || []).map((c) => ({ title: c.title.length > 20 ? c.title.slice(0, 20) + "…" : c.title, students: courseCountMap[c.id] || 0 }));
      setStats({ totalCourses: courses?.length || 0, totalStudents: enrollments?.length || 0, approvedCourses: approved });
      setEnrollmentData(Object.entries(monthMap).map(([month, count]) => ({ month, count })));
      setCourseStats(perCourse); setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;

  const statCards = [
    { label: "My Courses", value: stats.totalCourses, icon: BookOpen },
    { label: "Total Students", value: stats.totalStudents, icon: Users },
    { label: "Live Courses", value: stats.approvedCourses, icon: Eye },
  ];

  return (
    <div className="space-y-8 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Analytics</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">Track your course performance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-brand-gold-pale flex items-center justify-center"><s.icon className="h-5 w-5 text-brand-gold" /></div>
                <div>
                  <p className="font-['Cormorant_Garamond'] text-4xl font-bold text-brand-primary">{s.value}</p>
                  <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-brand-primary"><TrendingUp className="h-5 w-5 text-brand-gold" /> Enrollment Trends</CardTitle></CardHeader>
          <CardContent>
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={enrollmentData}><CartesianGrid strokeDasharray="3 3" stroke="#EDE3CC" /><XAxis dataKey="month" tick={{ fill: '#8C7B6B', fontSize: 12 }} /><YAxis tick={{ fill: '#8C7B6B', fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="#7D1E24" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : (<p className="text-brand-warm-grey text-center py-8 font-serif">No enrollment data yet</p>)}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <CardHeader><CardTitle className="flex items-center gap-2 font-serif text-brand-primary"><Users className="h-5 w-5 text-brand-gold" /> Students per Course</CardTitle></CardHeader>
          <CardContent>
            {courseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={courseStats} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#EDE3CC" /><XAxis type="number" tick={{ fill: '#8C7B6B', fontSize: 12 }} /><YAxis dataKey="title" type="category" width={120} tick={{ fill: '#8C7B6B', fontSize: 12 }} /><Tooltip /><Bar dataKey="students" fill="#C49A3C" radius={[0, 4, 4, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : (<p className="text-brand-warm-grey text-center py-8 font-serif">No courses yet</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorAnalytics;
