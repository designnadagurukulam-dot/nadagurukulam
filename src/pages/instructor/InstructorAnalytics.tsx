import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Eye, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const statGradients = [
  "from-brand-primary to-brand-primary-dark",
  "from-brand-gold to-[hsl(35_62%_55%)]",
  "from-[hsl(150_40%_35%)] to-[hsl(150_40%_25%)]",
];

const InstructorAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, approvedCourses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: courses } = await supabase.from("courses").select("id, title, status").eq("instructor_id", user.id);
      const courseIds = (courses || []).map((c) => c.id);
      const approved = (courses || []).filter((c) => c.status === "approved").length;
      const { data: enrollments } = courseIds.length > 0 ? await supabase.from("enrollments").select("course_id").in("course_id", courseIds) : { data: [] };
      setStats({ totalCourses: courses?.length || 0, totalStudents: enrollments?.length || 0, approvedCourses: approved });
      setLoading(false);
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-brand-gold" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Analytics</h1>
        </div>
        <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1 ml-10" />
        <p className="text-brand-warm-grey mt-2 text-sm ml-10">Track your course performance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className={`bg-gradient-to-br ${statGradients[i]} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-serif text-4xl font-bold">{s.value}</p>
                  <p className="text-[11px] uppercase tracking-widest text-white/70 font-semibold">{s.label}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InstructorAnalytics;
