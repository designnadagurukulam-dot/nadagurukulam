import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Calendar, Award, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stats = [
  { label: "Enrolled Courses", value: "3", icon: BookOpen, gradient: "from-primary to-primary/70", to: "/dashboard/courses" },
  { label: "Pending Assignments", value: "5", icon: ClipboardList, gradient: "from-secondary to-accent", to: "/dashboard/assignments" },
  { label: "Upcoming Classes", value: "2", icon: Calendar, gradient: "from-primary/80 to-secondary", to: "/dashboard/schedule" },
  { label: "Certificates", value: "1", icon: Award, gradient: "from-secondary/80 to-primary", to: "/dashboard/certificates" },
];

const recentCourses = [
  { title: "Carnatic Vocal - Basics", progress: 65, instructor: "Smt. Lakshmi Devi" },
  { title: "Bharatanatyam - Adavus", progress: 40, instructor: "Smt. Meenakshi Iyer" },
  { title: "Mridangam Foundations", progress: 25, instructor: "Sri. Ramesh Kumar" },
];

const DashboardOverview = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      {/* Welcome banner with decorative pattern */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, hsl(0 69% 25%) 0%, hsl(345 75% 18%) 100%)" }}
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

      {/* Stats Grid — gradient cards with white icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={stat.to}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden border-0 shadow-md">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${stat.gradient} p-5 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-foreground/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                    <stat.icon className="h-7 w-7 text-primary-foreground/80 mb-3" />
                    <p className="text-3xl font-extrabold text-primary-foreground">{stat.value}</p>
                    <p className="text-xs text-primary-foreground/60 mt-1 tracking-wide">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Courses — with golden progress bars */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-foreground">Continue Learning</h2>
          <Link to="/dashboard/courses">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recentCourses.map((course, i) => (
            <motion.div key={course.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-primary/90 to-primary/60 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(circle, hsl(43 72% 52%) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }} />
                  <BookOpen className="h-10 w-10 text-primary-foreground/50 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-serif font-bold text-foreground text-sm">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold text-secondary">{course.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${course.progress}%`,
                          background: "linear-gradient(90deg, hsl(43 72% 52%), hsl(48 90% 60%))"
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Action — Join Class CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3" />
            <div className="relative z-10">
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" /> Ready for your next lesson?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Your next class is Carnatic Vocal at 4:00 PM today</p>
            </div>
            <Button className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 relative z-10">
              Join Class
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
