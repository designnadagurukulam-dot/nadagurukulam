import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Calendar, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const stats = [
  { label: "Enrolled Courses", value: "3", icon: BookOpen, color: "text-primary", to: "/dashboard/courses" },
  { label: "Pending Assignments", value: "5", icon: ClipboardList, color: "text-secondary", to: "/dashboard/assignments" },
  { label: "Upcoming Classes", value: "2", icon: Calendar, color: "text-accent-foreground", to: "/dashboard/schedule" },
  { label: "Certificates", value: "1", icon: Award, color: "text-primary", to: "/dashboard/certificates" },
];

const recentCourses = [
  { title: "Carnatic Vocal - Basics", progress: 65, instructor: "Smt. Lakshmi Devi" },
  { title: "Bharatanatyam - Adavus", progress: 40, instructor: "Smt. Meenakshi Iyer" },
  { title: "Mridangam Foundations", progress: 25, instructor: "Sri. Ramesh Kumar" },
];

const DashboardOverview = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">
          Welcome back, {profile?.display_name || "Student"} 🎵
        </h1>
        <p className="text-muted-foreground mt-1">Here's your learning overview</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={stat.to}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-primary/10 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Courses */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-foreground">Continue Learning</h2>
          <Link to="/dashboard/courses">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentCourses.map((course) => (
            <Card key={course.title} className="hover:shadow-md transition-shadow">
              <div className="h-32 gradient-maroon rounded-t-lg flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-primary-foreground/60" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground text-sm">{course.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg text-foreground">Ready for your next lesson?</h3>
              <p className="text-sm text-muted-foreground">Your next class is Carnatic Vocal at 4:00 PM today</p>
            </div>
            <Button className="shrink-0">Join Class</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
