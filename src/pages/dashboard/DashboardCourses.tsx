import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface EnrolledCourse {
  id: string; title: string; instructor_name: string | null; duration: string | null;
  level: string | null; image_url: string | null; progress: number;
}

const DashboardCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: enrollments } = await supabase.from("enrollments").select("course_id, progress").eq("user_id", user.id);
      if (!enrollments || enrollments.length === 0) { setCourses([]); setLoading(false); return; }
      const courseIds = enrollments.map((e) => e.course_id);
      const { data: courseData } = await supabase.from("courses").select("id, title, instructor_name, duration, level, image_url").in("id", courseIds);
      const progressMap = Object.fromEntries(enrollments.map((e) => [e.course_id, e.progress]));
      setCourses((courseData || []).map((c) => ({ ...c, progress: progressMap[c.id] || 0 })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Courses</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">Track your enrolled courses and progress</p>
      </motion.div>

      {courses.length === 0 ? (
        <Card className="text-center p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-16 h-16 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-brand-gold" />
          </div>
          <h3 className="font-serif text-xl text-brand-primary">No courses enrolled</h3>
          <p className="text-brand-warm-grey mt-2">Browse available courses and enroll to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
                <div className="h-44 overflow-hidden relative bg-brand-cream-dark">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-gold/20">
                      <BookOpen className="h-12 w-12 text-brand-warm-grey" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {course.level && <Badge className="absolute top-3 right-3 bg-brand-gold text-brand-charcoal border-0 shadow-md">{course.level}</Badge>}
                </div>
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal-mid">{course.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-brand-warm-grey">
                    {course.instructor_name && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{course.instructor_name}</span>}
                    {course.duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#EDE3CC" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#7D1E24" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${course.progress * 1.508} ${150.8 - course.progress * 1.508}`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-charcoal-mid">{course.progress}%</span>
                    </div>
                    <div className="text-xs text-brand-warm-grey">
                      <p className="font-medium text-brand-charcoal-mid">{course.progress === 100 ? "Completed" : "In Progress"}</p>
                      <p>{course.progress}% completed</p>
                    </div>
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

export default DashboardCourses;
