import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Clock, DollarSign, GraduationCap, Video,
  MessageSquare, ShieldCheck, ArrowRight, Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const AdminOverview = () => {
  const [stats, setStats] = useState({
    courses: 0, students: 0, instructors: 0, pending: 0,
    revenue: 0, batches: 0, liveClasses: 0, feedback: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [
        coursesRes, studentRes, instructorRes, pendingRes,
        ordersRes, batchRes, liveRes, feedbackRes,
        activityRes, recentCoursesRes,
      ] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "instructor"),
        supabase.from("content_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("amount").eq("status", "completed"),
        supabase.from("batches").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("live_classes").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("feedback").select("id", { count: "exact", head: true }),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("courses").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (ordersRes.data || []).reduce((s, o) => s + Number(o.amount), 0);
      setStats({
        courses: coursesRes.count || 0,
        students: studentRes.count || 0,
        instructors: instructorRes.count || 0,
        pending: pendingRes.count || 0,
        revenue,
        batches: batchRes.count || 0,
        liveClasses: liveRes.count || 0,
        feedback: feedbackRes.count || 0,
      });
      setRecentActivity(activityRes.data || []);
      setRecentCourses(recentCoursesRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen, href: "/dashboard/admin/courses" },
    { label: "Students", value: stats.students, icon: GraduationCap, href: "/dashboard/admin/students" },
    { label: "Tutors", value: stats.instructors, icon: Users, href: "/dashboard/admin/students" },
    { label: "Active Batches", value: stats.batches, icon: Layers, href: "/dashboard/admin/batches" },
    { label: "Pending Reviews", value: stats.pending, icon: Clock, href: "/dashboard/admin/approvals" },
    { label: "Live Classes", value: stats.liveClasses, icon: Video, href: "/dashboard/admin/live-classes" },
    { label: "Feedback", value: stats.feedback, icon: MessageSquare, href: "/dashboard/admin/feedback" },
    { label: "Revenue (₹)", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, href: "/dashboard/admin/analytics" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-serif text-3xl text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform overview & management</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="h-5 w-5 text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/dashboard/admin/approvals"><Button variant="outline" size="sm">Review Submissions ({stats.pending})</Button></Link>
            <Link to="/dashboard/admin/batches"><Button variant="outline" size="sm">Manage Batches</Button></Link>
            <Link to="/dashboard/admin/students"><Button variant="outline" size="sm">Manage Users</Button></Link>
            <Link to="/dashboard/admin/verification"><Button variant="outline" size="sm">User Verification</Button></Link>
            <Link to="/dashboard/admin/schedule"><Button variant="outline" size="sm">Schedules</Button></Link>
            <Link to="/dashboard/admin/feedback"><Button variant="outline" size="sm">View Feedback</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Courses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentCourses.length === 0 && (
              <div className="text-center py-4 text-muted-foreground flex flex-col items-center gap-2">
                <BookOpen className="h-8 w-8 opacity-40" />
                <p className="text-sm">No courses yet</p>
              </div>
            )}
            {recentCourses.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-foreground font-medium truncate">{c.title}</span>
                <Badge variant={c.status === "approved" ? "default" : "secondary"} className="text-xs">{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Link to="/dashboard/admin/activity"><Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentActivity.length === 0 && (
            <div className="text-center py-6 text-muted-foreground flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 opacity-40" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className="text-foreground">{a.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
