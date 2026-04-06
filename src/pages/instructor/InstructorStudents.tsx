import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StudentRow {
  user_id: string;
  course_title: string;
  enrolled_at: string;
  progress: number;
  display_name: string | null;
}

const InstructorStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      // Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", user.id);

      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = courses.map((c) => c.id);
      const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

      // Get enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, course_id, enrolled_at, progress")
        .in("course_id", courseIds)
        .order("enrolled_at", { ascending: false });

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      // Get profiles for enrolled users
      const userIds = [...new Set(enrollments.map((e) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));

      const rows: StudentRow[] = enrollments.map((e) => ({
        user_id: e.user_id,
        course_title: courseMap[e.course_id] || "Unknown",
        enrolled_at: e.enrolled_at,
        progress: e.progress,
        display_name: profileMap[e.user_id] || null,
      }));

      setStudents(rows);
      setLoading(false);
    };
    fetchStudents();
  }, [user]);

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">My Students</h1>
        <p className="text-muted-foreground mt-1">Students enrolled in your courses</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-serif text-xl text-foreground mb-2">No students yet</h3>
            <p className="text-muted-foreground">Students will appear here once they enroll in your courses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((s, i) => (
            <motion.div key={`${s.user_id}-${s.course_title}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(s.display_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{s.display_name || "Anonymous"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <BookOpen className="h-3 w-3" />
                        <span>{s.course_title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(s.enrolled_at).toLocaleDateString()}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {s.progress}% complete
                    </Badge>
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

export default InstructorStudents;
