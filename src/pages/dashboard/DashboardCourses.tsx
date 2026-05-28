import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, User, Play, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

interface CourseRow {
  id: string; title: string; instructor_name: string | null; duration: string | null;
  level: string | null; image_url: string | null; progress?: number;
}

const DashboardCourses = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "explore" ? "explore" : "mine";
  const [tab, setTab] = useState<string>(initialTab);
  const [myCourses, setMyCourses] = useState<CourseRow[]>([]);
  const [exploreCourses, setExploreCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: enrollments } = await supabase.from("enrollments").select("course_id, progress").eq("user_id", user.id);
    const enrolledIds = new Set((enrollments || []).map((e) => e.course_id));
    const progressMap = Object.fromEntries((enrollments || []).map((e) => [e.course_id, e.progress]));

    if (enrolledIds.size > 0) {
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, instructor_name, duration, level, image_url")
        .in("id", Array.from(enrolledIds))
        .is("archived_at", null);
      setMyCourses((courseData || []).map((c) => ({ ...c, progress: progressMap[c.id] || 0 })));
    } else {
      setMyCourses([]);
    }

    const { data: allApproved } = await supabase
      .from("courses")
      .select("id, title, instructor_name, duration, level, image_url")
      .eq("status", "approved")
      .is("archived_at", null);
    setExploreCourses((allApproved || []).filter((c) => !enrolledIds.has(c.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setEnrolling(courseId);
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    setEnrolling(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Enrolled!");
    load();
  };

  const handleTabChange = (v: string) => {
    setTab(v);
    setSearchParams(v === "explore" ? { tab: "explore" } : {});
  };

  const renderCourseCard = (course: CourseRow, mode: "mine" | "explore") => (
    <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:shadow-[0_8px_40px_rgba(196,154,60,0.15)] hover:-translate-y-1 transition-all duration-500 group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
        <div className="h-36 sm:h-44 overflow-hidden relative bg-brand-cream-dark">
          {course.image_url ? (
            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-gold/20">
              <BookOpen className="h-10 w-10 text-brand-warm-grey" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {mode === "mine" && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Play className="w-5 h-5 text-brand-primary ml-0.5" />
              </div>
            </div>
          )}
          {course.level && <Badge className="absolute top-2.5 right-2.5 bg-brand-gold text-brand-charcoal border-0 shadow-md text-[10px]">{course.level}</Badge>}
          {mode === "mine" && course.progress === 100 && (
            <div className="absolute top-2.5 left-2.5"><CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-lg" /></div>
          )}
        </div>
        <CardContent className="p-3.5 sm:p-5 space-y-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-charcoal-mid line-clamp-2">{course.title}</h3>
          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-brand-warm-grey flex-wrap">
            {course.instructor_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{course.instructor_name}</span>}
            {course.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>}
          </div>
          {mode === "mine" ? (
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#EDE3CC" strokeWidth="5" />
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#7D1E24" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(course.progress || 0) * 1.696} ${169.6 - (course.progress || 0) * 1.696}`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-charcoal-mid">
                  {course.progress === 100 ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : `${course.progress}%`}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-brand-warm-grey">
                <p className="font-medium text-brand-charcoal-mid">{course.progress === 100 ? "🎉 Completed!" : "In Progress"}</p>
                <p>{course.progress}% completed</p>
              </div>
            </div>
          ) : (
            <Button onClick={() => handleEnroll(course.id)} disabled={enrolling === course.id}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> {enrolling === course.id ? "Enrolling..." : "Enroll"}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">My Courses</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">Track your enrolled courses or explore new ones</p>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="mine">My Courses</TabsTrigger>
          <TabsTrigger value="explore">Explore Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : myCourses.length === 0 ? (
            <Card className="text-center p-8 sm:p-12 bg-white rounded-2xl border border-brand-parchment">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-brand-gold" />
              </div>
              <h3 className="font-serif text-lg text-brand-primary">No courses enrolled yet</h3>
              <p className="text-brand-warm-grey mt-2 text-xs sm:text-sm">Head over to Explore Courses to enroll!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {myCourses.map((c) => renderCourseCard(c, "mine"))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="explore" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : exploreCourses.length === 0 ? (
            <Card className="text-center p-8 bg-white rounded-2xl border border-brand-parchment">
              <p className="text-brand-warm-grey text-sm">No new courses to explore right now.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {exploreCourses.map((c) => renderCourseCard(c, "explore"))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardCourses;
