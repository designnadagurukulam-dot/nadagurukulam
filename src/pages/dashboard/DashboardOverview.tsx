import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Calendar, Award, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const DashboardOverview = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, assignments: 0, schedules: 0, certificates: 0 });
  const [recentCourses, setRecentCourses] = useState<{ title: string; progress: number; instructor: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [enrollRes, certRes, schedRes] = await Promise.all([
        supabase.from("enrollments").select("course_id, progress, courses(title, instructor_name)").eq("user_id", user.id),
        supabase.from("certificates").select("id").eq("user_id", user.id),
        supabase.from("schedules").select("id").eq("user_id", user.id),
      ]);

      const enrollments = enrollRes.data || [];
      // Get assignment count from enrolled courses
      const courseIds = enrollments.map((e: any) => e.course_id);
      let assignmentCount = 0;
      if (courseIds.length > 0) {
        const { count } = await supabase.from("assignments").select("id", { count: "exact", head: true }).in("course_id", courseIds);
        assignmentCount = count || 0;
      }

      setStats({
        courses: enrollments.length,
        assignments: assignmentCount,
        schedules: (schedRes.data || []).length,
        certificates: (certRes.data || []).length,
      });

      setRecentCourses(
        enrollments.slice(0, 3).map((e: any) => ({
          title: (e.courses as any)?.title || "Untitled",
          progress: e.progress || 0,
          instructor: (e.courses as any)?.instructor_name || "Instructor",
        }))
      );
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: "Enrolled Courses", value: stats.courses, icon: BookOpen, gradient: "from-primary to-primary/70", to: "/dashboard/courses" },
    { label: "Assignments", value: stats.assignments, icon: ClipboardList, gradient: "from-secondary to-accent", to: "/dashboard/assignments" },
    { label: "Scheduled Events", value: stats.schedules, icon: Calendar, gradient: "from-primary/80 to-secondary", to: "/dashboard/schedule" },
    { label: "Certificates", value: stats.certificates, icon: Award, gradient: "from-secondary/80 to-primary", to: "/dashboard/certificates" },
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
            Welcome back, {profile?.display_name || "Student"} 🎵
          </h1>
          <p className="text-primary-foreground/50 mt-2 text-sm">Here's your learning overview for today.</p>
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

      {/* Recent Courses */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-foreground">Continue Learning</h2>
          <Link to="/dashboard/courses">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recentCourses.length === 0 && !loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No enrolled courses yet. Browse the <Link to="/catalog" className="text-primary underline">catalog</Link> to get started!</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {recentCourses.map((course, i) => (
              <motion.div key={course.title + i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                  <div className="h-24 md:h-28 bg-gradient-to-br from-primary/90 to-primary/60 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: "radial-gradient(circle, hsl(33 62% 58%) 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }} />
                    <BookOpen className="h-10 w-10 text-primary-foreground/50 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-4 md:p-5">
                    <h3 className="font-serif font-bold text-foreground text-sm truncate">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{course.instructor}</p>
                    <div className="mt-3 md:mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-secondary">{course.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${course.progress}%`,
                            background: "linear-gradient(90deg, hsl(33 62% 58%), hsl(35 62% 65%))"
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
                <Sparkles className="h-5 w-5 text-secondary" /> Explore new courses
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Browse our catalog and start your next learning journey</p>
            </div>
            <Link to="/catalog">
              <Button className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 relative z-10">
                Browse Catalog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
