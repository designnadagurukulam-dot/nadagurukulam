import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Calendar, Award, ArrowRight, Sparkles, Video, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, subMinutes, addMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardOverview = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ batch: "—", classesThisWeek: 0, pendingAssignments: 0, progress: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get batch enrollments
      const { data: batchEnrollments } = await supabase
        .from("batch_enrollments")
        .select("batch_id, batches(name)")
        .eq("student_id", user.id);

      const batchIds = batchEnrollments?.map((b: any) => b.batch_id) || [];
      const batchName = batchEnrollments?.[0]?.batches?.name || "Not assigned";

      // Get upcoming live classes
      const now = new Date().toISOString();
      let classes: any[] = [];
      if (batchIds.length > 0) {
        const { data } = await supabase
          .from("live_classes")
          .select("*, profiles!live_classes_instructor_id_fkey(display_name, avatar_url)")
          .in("batch_id", batchIds)
          .gte("scheduled_at", now)
          .order("scheduled_at")
          .limit(3);
        classes = data || [];
      }

      // Get this week's class count
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      let weekClassCount = 0;
      if (batchIds.length > 0) {
        const { count } = await supabase
          .from("live_classes")
          .select("id", { count: "exact", head: true })
          .in("batch_id", batchIds)
          .gte("scheduled_at", weekStart.toISOString())
          .lte("scheduled_at", weekEnd.toISOString());
        weekClassCount = count || 0;
      }

      // Get assignments for enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);
      const courseIds = enrollments?.map((e) => e.course_id) || [];

      let pending: any[] = [];
      if (courseIds.length > 0) {
        const { data: assignments } = await supabase
          .from("assignments")
          .select("*, courses(title)")
          .in("course_id", courseIds)
          .order("due_date", { ascending: true });

        const assignmentIds = (assignments || []).map((a) => a.id);
        const { data: submissions } = assignmentIds.length > 0
          ? await supabase.from("assignment_submissions").select("assignment_id").eq("student_id", user.id).in("assignment_id", assignmentIds)
          : { data: [] };

        const submittedIds = new Set((submissions || []).map((s) => s.assignment_id));
        pending = (assignments || []).filter((a) => !submittedIds.has(a.id)).slice(0, 3);
      }

      // Get progress
      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("progress_pct")
        .eq("user_id", user.id);
      const avgProgress = progressData?.length
        ? Math.round(progressData.reduce((s, p) => s + p.progress_pct, 0) / progressData.length)
        : 0;

      setStats({
        batch: batchName,
        classesThisWeek: weekClassCount,
        pendingAssignments: pending.length,
        progress: avgProgress,
      });
      setUpcomingClasses(classes);
      setPendingAssignments(pending);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const statCards = [
    { label: "My Batch", value: stats.batch, icon: Users, to: "/dashboard/student/curriculum" },
    { label: "Classes This Week", value: stats.classesThisWeek, icon: Video, to: "/dashboard/student/live-classes" },
    { label: "Pending Assignments", value: stats.pendingAssignments, icon: ClipboardList, to: "/dashboard/student/assignments" },
    { label: "Study Progress", value: `${stats.progress}%`, icon: BarChart3, to: "/dashboard/student/courses" },
  ];

  const isClassLive = (scheduledAt: string, durationMin: number) => {
    const now = new Date();
    const start = subMinutes(new Date(scheduledAt), 10);
    const end = addMinutes(new Date(scheduledAt), durationMin || 60);
    return now >= start && now <= end;
  };

  const getDueBadgeColor = (dueDate: string | null) => {
    if (!dueDate) return "bg-muted text-muted-foreground";
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return "bg-destructive/15 text-destructive";
    if (diffDays < 2) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

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
            Namaste, {profile?.display_name || "Student"} 🎵
          </h1>
          <p className="text-primary-foreground/60 mt-2 text-sm">Here's your learning overview for today.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={stat.to}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden border-0 shadow-md">
                <CardContent className="p-4 md:p-5 relative">
                  <stat.icon className="h-5 w-5 text-accent absolute top-4 right-4" />
                  <p className="text-2xl md:text-3xl font-extrabold text-primary">
                    {loading ? <Skeleton className="h-8 w-16" /> : stat.value}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 tracking-wide uppercase">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Live Classes */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Upcoming Live Classes</h2>
          <Link to="/dashboard/student/live-classes">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : upcomingClasses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No upcoming live classes scheduled.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingClasses.map((cls) => {
              const live = isClassLive(cls.scheduled_at, cls.duration_minutes);
              return (
                <Card key={cls.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <h3 className="font-serif font-bold text-foreground text-sm">{cls.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cls.profiles?.display_name || "Tutor"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(cls.scheduled_at), "EEEE, dd MMM yyyy 'at' h:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground">{cls.duration_minutes || 60} minutes</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-[10px]">
                        {cls.meeting_platform === "google_meet" ? "Google Meet" : "Zoom"}
                      </Badge>
                      {live ? (
                        <>
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
                          </span>
                          <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-7">
                              Join Class →
                            </Button>
                          </a>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Scheduled</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Pending Assignments */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Pending Assignments</h2>
          <Link to="/dashboard/student/assignments">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {pendingAssignments.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-10 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pending assignments. You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingAssignments.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                    <p className="text-xs text-muted-foreground">{a.courses?.title}</p>
                  </div>
                  {a.due_date && (
                    <Badge className={`${getDueBadgeColor(a.due_date)} border-0 text-xs`}>
                      Due {format(new Date(a.due_date), "MMM dd")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Action */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent overflow-hidden">
          <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> Explore new courses
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Browse our courses and start your next learning journey</p>
            </div>
            <Link to="/courses">
              <Button className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
