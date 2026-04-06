import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, BookCheck, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const InstructorOverview = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, pendingLogs: 0, upcoming: 0 });
  const [recentLogs, setRecentLogs] = useState<{ topic: string; date: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [coursesRes, logsRes, schedRes] = await Promise.all([
        supabase.from("courses").select("id").eq("instructor_id", user.id),
        supabase.from("class_logs").select("id, topic_covered, date, status").eq("instructor_id", user.id).order("date", { ascending: false }).limit(5),
        supabase.from("schedules").select("id").eq("instructor_id", user.id).gte("start_time", new Date().toISOString()),
      ]);

      const courseIds = (coursesRes.data || []).map((c) => c.id);
      let studentCount = 0;
      if (courseIds.length > 0) {
        const { count } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).in("course_id", courseIds);
        studentCount = count || 0;
      }

      const pendingLogs = (logsRes.data || []).filter((l) => l.status === "pending_confirmation").length;

      setStats({
        courses: courseIds.length,
        students: studentCount,
        pendingLogs,
        upcoming: (schedRes.data || []).length,
      });

      setRecentLogs(
        (logsRes.data || []).slice(0, 5).map((l) => ({
          topic: l.topic_covered,
          date: l.date,
          status: l.status,
        }))
      );
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: "My Courses", value: stats.courses, icon: BookOpen, gradient: "from-primary to-primary/70", to: "/dashboard/instructor/courses" },
    { label: "Total Students", value: stats.students, icon: Users, gradient: "from-secondary to-accent", to: "/dashboard/instructor/students" },
    { label: "Pending Logs", value: stats.pendingLogs, icon: BookCheck, gradient: "from-primary/80 to-secondary", to: "/dashboard/instructor/class-log" },
    { label: "Upcoming Classes", value: stats.upcoming, icon: Calendar, gradient: "from-secondary/80 to-primary", to: "/dashboard/instructor/schedule" },
  ];

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, hsl(358 68% 25%) 0%, hsl(358 68% 18%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, hsl(0 0% 100%) 1px, transparent 1px), radial-gradient(circle at 75% 75%, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground">
            Welcome back, {profile?.display_name || "Educator"} 🎶
          </h1>
          <p className="text-primary-foreground/50 mt-2 text-sm">Here's your teaching overview for today.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={stat.to}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden border-0 shadow-md">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${stat.gradient} p-4 md:p-5 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-foreground/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                    <stat.icon className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground/80 mb-2 md:mb-3" />
                    <p className="text-2xl md:text-3xl font-extrabold text-primary-foreground">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="text-[10px] md:text-xs text-primary-foreground/60 mt-1 tracking-wide">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Class Logs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-foreground">Recent Class Logs</h2>
          <Link to="/dashboard/instructor/class-log">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recentLogs.length === 0 && !loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No class logs yet. Start logging your sessions!</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{log.topic}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${log.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {log.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Action */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent overflow-hidden">
          <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3" />
            <div className="relative z-10">
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" /> Log today's class
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Record what you covered in today's session</p>
            </div>
            <Link to="/dashboard/instructor/class-log">
              <Button className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 relative z-10">
                Log Class
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InstructorOverview;
