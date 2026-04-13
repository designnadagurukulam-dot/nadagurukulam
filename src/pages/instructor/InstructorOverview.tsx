import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Video, ClipboardList, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const InstructorOverview = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ students: 0, upcomingClasses: 0, pendingGrading: 0, activeBatches: 0 });
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get batches where this tutor is instructor
      const { data: batches } = await supabase
        .from("batches")
        .select("id, name")
        .eq("instructor_id", user.id)
        .eq("is_active", true);

      const batchIds = (batches || []).map((b) => b.id);

      // Student count across batches
      let studentCount = 0;
      if (batchIds.length > 0) {
        const { count } = await supabase
          .from("batch_enrollments")
          .select("id", { count: "exact", head: true })
          .in("batch_id", batchIds);
        studentCount = count || 0;
      }

      // Upcoming classes this week
      const now = new Date();
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      const { count: upcomingCount } = await supabase
        .from("live_classes")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", user.id)
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", weekEnd.toISOString());

      // Today's classes
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const { data: todayCls } = await supabase
        .from("live_classes")
        .select("*")
        .eq("instructor_id", user.id)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at");

      // Pending grading
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("instructor_id", user.id);
      const assignmentIds = (assignments || []).map((a) => a.id);
      let pendingGrading = 0;
      if (assignmentIds.length > 0) {
        const { count } = await supabase
          .from("assignment_submissions")
          .select("id", { count: "exact", head: true })
          .in("assignment_id", assignmentIds)
          .eq("status", "submitted");
        pendingGrading = count || 0;
      }

      // Recent submissions
      let recent: any[] = [];
      if (assignmentIds.length > 0) {
        const { data: subs } = await supabase
          .from("assignment_submissions")
          .select("*, assignments(title)")
          .in("assignment_id", assignmentIds)
          .order("submitted_at", { ascending: false })
          .limit(5);

        if (subs?.length) {
          const studentIds = [...new Set(subs.map((s) => s.student_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", studentIds);
          const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));
          recent = subs.map((s) => ({
            ...s,
            student_name: profileMap[s.student_id] || "Student",
          }));
        }
      }

      setStats({
        students: studentCount,
        upcomingClasses: upcomingCount || 0,
        pendingGrading,
        activeBatches: batches?.length || 0,
      });
      setTodayClasses(todayCls || []);
      setRecentSubmissions(recent);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const statCards = [
    { label: "Total Students", value: stats.students, icon: Users, to: "/dashboard/tutor/students" },
    { label: "Upcoming Classes", value: stats.upcomingClasses, icon: Video, to: "/dashboard/tutor/live-classes" },
    { label: "Pending Grading", value: stats.pendingGrading, icon: ClipboardList, to: "/dashboard/tutor/assignments" },
    { label: "Active Batches", value: stats.activeBatches, icon: BookOpen, to: "/dashboard/tutor/students" },
  ];

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-primary"
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground">
            Welcome back, {profile?.display_name || "Educator"} 🎶
          </h1>
          <p className="text-primary-foreground/60 mt-2 text-sm">Here's your teaching overview for today.</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={stat.to}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border-0 shadow-md">
                <CardContent className="p-4 md:p-5 relative">
                  <stat.icon className="h-5 w-5 text-accent absolute top-4 right-4" />
                  <p className="text-2xl md:text-3xl font-extrabold text-primary">
                    {loading ? <Skeleton className="h-8 w-12" /> : stat.value}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 tracking-wide uppercase">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Today's Schedule</h2>
          <Link to="/dashboard/tutor/live-classes">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {todayClasses.length === 0 ? (
          <Card><CardContent className="py-10 text-center">
            <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {todayClasses.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{cls.title}</h3>
                    <p className="text-xs text-muted-foreground">{format(new Date(cls.scheduled_at), "h:mm a")} • {cls.duration_minutes || 60} min</p>
                  </div>
                  <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1 text-xs">
                      Join <ArrowRight className="h-3 w-3" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Submissions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Recent Submissions</h2>
          <Link to="/dashboard/tutor/assignments">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {recentSubmissions.length === 0 ? (
          <Card><CardContent className="py-10 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No recent submissions.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((sub: any) => (
              <Card key={sub.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{sub.student_name}</p>
                    <p className="text-xs text-muted-foreground">{sub.assignments?.title} • {format(new Date(sub.submitted_at), "MMM dd, h:mm a")}</p>
                  </div>
                  <Badge variant={sub.status === "graded" ? "default" : "secondary"} className="text-xs">
                    {sub.status === "graded" ? `Graded: ${sub.grade}` : "Pending"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Action */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> Schedule a live class
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Set up your next session with students</p>
            </div>
            <Link to="/dashboard/tutor/live-classes">
              <Button className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                Schedule Class
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InstructorOverview;
