import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, User, Play, CheckCircle2, Sparkles } from "lucide-react";
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
      const { data: courseData } = await supabase.from("courses").select("id, title, instructor_name, duration, level, image_url").in("id", courseIds).is("archived_at", null);
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
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">My Courses</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">Track your enrolled courses and progress</p>
        </div>
      </motion.div>

      {courses.length === 0 ? (
        <Card className="text-center p-8 sm:p-12 bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-brand-gold" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-brand-primary">No courses enrolled yet</h3>
          <p className="text-brand-warm-grey mt-2 text-xs sm:text-sm">Browse available courses and start your learning journey!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-[0_8px_40px_rgba(196,154,60,0.15)] hover:-translate-y-1 transition-all duration-500 group cursor-pointer bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
                <div className="h-36 sm:h-44 overflow-hidden relative bg-brand-cream-dark">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-gold/20">
                      <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-brand-warm-grey" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                      <Play className="w-5 h-5 text-brand-primary ml-0.5" />
                    </div>
                  </div>
                  {course.level && <Badge className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 bg-brand-gold text-brand-charcoal border-0 shadow-md text-[10px] sm:text-xs">{course.level}</Badge>}
                  {course.progress === 100 && (
                    <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-lg" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-charcoal-mid line-clamp-2">{course.title}</h3>
                  <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-brand-warm-grey flex-wrap">
                    {course.instructor_name && <span className="flex items-center gap-1"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{course.instructor_name}</span>}
                    {course.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{course.duration}</span>}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                      <svg className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="27" fill="none" stroke="#EDE3CC" strokeWidth="5" />
                        <defs>
                          <linearGradient id={`prog-${course.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7D1E24" />
                            <stop offset="100%" stopColor="#C49A3C" />
                          </linearGradient>
                        </defs>
                        <circle cx="32" cy="32" r="27" fill="none" stroke={`url(#prog-${course.id})`} strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${course.progress * 1.696} ${169.6 - course.progress * 1.696}`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-brand-charcoal-mid">
                        {course.progress === 100 ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : `${course.progress}%`}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-brand-warm-grey">
                      <p className="font-medium text-brand-charcoal-mid">{course.progress === 100 ? "🎉 Completed!" : "In Progress"}</p>
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