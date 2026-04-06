import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Clock, Eye, Edit, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const InstructorCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    };
    fetchCourses();
  }, [user]);

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your course content</p>
        </div>
        <Link to="/dashboard/instructor/create">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Create Course</Button>
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-serif text-xl text-foreground mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Create your first course to get started</p>
            <Link to="/dashboard/instructor/create">
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Course</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="h-36 gradient-maroon flex items-center justify-center relative">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-primary-foreground/40" />
                  )}
                  <Badge className={`absolute top-3 right-3 ${statusColors[course.status] || statusColors.draft}`}>
                    {course.status}
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-serif text-lg text-foreground line-clamp-1">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration || "—"}</span>
                    <span>₹{course.price || 0}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link to={`/dashboard/instructor/edit/${course.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                    </Link>
                    <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;
