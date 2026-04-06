import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminOverview = () => {
  const [stats, setStats] = useState({ courses: 0, students: 0, pending: 0, revenue: 0 });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [coursesRes, studentRolesRes, pendingRes, ordersRes, recentRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("content_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("amount").eq("status", "completed"),
        supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.amount), 0);
      setStats({
        courses: coursesRes.count || 0,
        students: studentRolesRes.count || 0,
        pending: pendingRes.count || 0,
        revenue,
      });
      setRecentCourses(recentRes.data || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen, color: "from-primary to-primary/80" },
    { label: "Total Students", value: stats.students, icon: Users, color: "from-secondary to-secondary/80" },
    { label: "Pending Reviews", value: stats.pending, icon: Clock, color: "from-yellow-500 to-yellow-600" },
    { label: "Revenue (₹)", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "from-green-600 to-green-700" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${s.color} p-5 text-white`}>
                  <s.icon className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-sm opacity-90 mt-1">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/dashboard/admin/approvals"><Button variant="outline" size="sm">Review Submissions ({stats.pending})</Button></Link>
            <Link to="/dashboard/admin/courses"><Button variant="outline" size="sm">Manage Courses</Button></Link>
            <Link to="/dashboard/admin/students"><Button variant="outline" size="sm">Manage Students</Button></Link>
            <Link to="/dashboard/admin/categories"><Button variant="outline" size="sm">Manage Categories</Button></Link>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Courses</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentCourses.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-foreground font-medium truncate">{c.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === "approved" ? "bg-green-100 text-green-700" :
                  c.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-muted text-muted-foreground"
                }`}>{c.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
