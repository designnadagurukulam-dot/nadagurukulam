import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, User, Play, CheckCircle2, Sparkles, Plus, GraduationCap, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

interface CourseRow {
  id: string;
  title: string;
  facultyName: string | null;
  duration: string | null;
  level: string | null;
  image_url: string | null;
  program: string | null;
  semester: number | null;
  progress: number;
}

const DashboardCourses = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab");
    if (t === "explore") return "explore";
    if (t === "mine") return "mine";
    return "curriculum";
  })();
  const [tab, setTab] = useState<string>(initialTab);
  const [curriculumCourses, setCurriculumCourses] = useState<CourseRow[]>([]);
  const [myCourses, setMyCourses] = useState<CourseRow[]>([]);
  const [exploreCourses, setExploreCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // 1. Batch-linked courses → My Curriculum
    const { data: batchEnrollments } = await supabase
      .from("batch_enrollments")
      .select("batch_id, batches(id, name, course_id, semester)")
      .eq("student_id", user.id);
    const batchCourseInfo: Record<string, { semester: number | null }> = {};
    (batchEnrollments || []).forEach((be: any) => {
      const b = be.batches;
      if (b?.course_id) batchCourseInfo[b.course_id] = { semester: b.semester ?? null };
    });
    const curriculumCourseIds = Object.keys(batchCourseInfo);

    // 2. Self-enrollments
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id, progress")
      .eq("user_id", user.id);
    const progressMap: Record<string, number> = {};
    (enrollments || []).forEach((e: any) => { progressMap[e.course_id] = e.progress || 0; });
    const enrolledIds = new Set((enrollments || []).map((e: any) => e.course_id));

    // Combined course IDs we need to fetch details for (curriculum ∪ extra)
    const extraCourseIds = Array.from(enrolledIds).filter((id) => !batchCourseInfo[id as string]) as string[];
    const allMyIds = [...new Set([...curriculumCourseIds, ...extraCourseIds])];

    let courseDetails: any[] = [];
    if (allMyIds.length > 0) {
      const { data } = await supabase
        .from("courses")
        .select("id, title, instructor_name, instructor_id, duration, level, image_url, category, program_id")
        .in("id", allMyIds)
        .is("archived_at", null);
      courseDetails = data || [];
    }

    // Hydrate program names (from categories) and faculty names (from profiles)
    const programIds = [...new Set(courseDetails.map((c) => c.program_id).filter(Boolean))];
    const instructorIds = [...new Set(courseDetails.map((c) => c.instructor_id).filter(Boolean))];
    const [progRes, facRes] = await Promise.all([
      programIds.length
        ? supabase.from("categories").select("id, name").in("id", programIds)
        : Promise.resolve({ data: [] as any[] }),
      instructorIds.length
        ? supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const progMap: Record<string, string> = {};
    (progRes.data || []).forEach((p: any) => { progMap[p.id] = p.name; });
    const facMap: Record<string, string> = {};
    (facRes.data || []).forEach((p: any) => { facMap[p.user_id] = p.display_name; });

    const mapRow = (c: any): CourseRow => ({
      id: c.id,
      title: c.title,
      facultyName: c.instructor_id ? facMap[c.instructor_id] || c.instructor_name : c.instructor_name,
      duration: c.duration,
      level: c.level,
      image_url: c.image_url,
      program: c.program_id ? progMap[c.program_id] || null : c.category || null,
      semester: batchCourseInfo[c.id]?.semester ?? null,
      progress: progressMap[c.id] || 0,
    });

    setCurriculumCourses(courseDetails.filter((c) => curriculumCourseIds.includes(c.id)).map(mapRow));
    setMyCourses(courseDetails.filter((c) => extraCourseIds.includes(c.id)).map(mapRow));

    // 3. Explore Courses — approved, not yet enrolled and not in curriculum
    const { data: allApproved } = await supabase
      .from("courses")
      .select("id, title, instructor_name, instructor_id, duration, level, image_url, category, program_id")
      .eq("status", "approved")
      .is("archived_at", null);
    const exclude = new Set([...curriculumCourseIds, ...extraCourseIds]);
    const explore = (allApproved || []).filter((c: any) => !exclude.has(c.id));
    const exploreInstructorIds = [...new Set(explore.map((c: any) => c.instructor_id).filter(Boolean))];
    const exploreProgramIds = [...new Set(explore.map((c: any) => c.program_id).filter(Boolean))];
    const newInstructorIds = exploreInstructorIds.filter((id) => !facMap[id as string]);
    const newProgramIds = exploreProgramIds.filter((id) => !progMap[id as string]);
    const [progRes2, facRes2] = await Promise.all([
      newProgramIds.length
        ? supabase.from("categories").select("id, name").in("id", newProgramIds as string[])
        : Promise.resolve({ data: [] as any[] }),
      newInstructorIds.length
        ? supabase.from("profiles").select("user_id, display_name").in("user_id", newInstructorIds as string[])
        : Promise.resolve({ data: [] as any[] }),
    ]);
    (progRes2.data || []).forEach((p: any) => { progMap[p.id] = p.name; });
    (facRes2.data || []).forEach((p: any) => { facMap[p.user_id] = p.display_name; });
    setExploreCourses(explore.map(mapRow));

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
    setSearchParams(v === "curriculum" ? {} : { tab: v });
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
          {course.program && (
            <p className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">{course.program}</p>
          )}
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-charcoal-mid line-clamp-2">{course.title}</h3>
          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-brand-warm-grey flex-wrap">
            {course.facultyName && <span className="flex items-center gap-1"><User className="h-3 w-3" />{course.facultyName}</span>}
            {course.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>}
            {course.semester != null && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />Sem {course.semester}</span>}
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

  const renderGrid = (rows: CourseRow[], mode: "mine" | "explore", emptyTitle: string, emptyBody: string) => {
    if (loading) {
      return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
    }
    if (rows.length === 0) {
      return (
        <Card className="text-center p-8 sm:p-12 bg-white rounded-2xl border border-brand-parchment">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-10 w-10 text-brand-gold" />
          </div>
          <h3 className="font-serif text-lg text-brand-primary">{emptyTitle}</h3>
          <p className="text-brand-warm-grey mt-2 text-xs sm:text-sm">{emptyBody}</p>
        </Card>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {rows.map((c) => renderCourseCard(c, mode))}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">My Courses</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">Curriculum, extra courses, and new ones to explore</p>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="bg-brand-cream-dark rounded-xl p-1 flex-wrap h-auto">
          <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> My Curriculum ({curriculumCourses.length})
          </TabsTrigger>
          <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> My Courses ({myCourses.length})
          </TabsTrigger>
          <TabsTrigger value="explore" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Explore Courses ({exploreCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="mt-4">
          {renderGrid(curriculumCourses, "mine", "No curriculum assigned yet", "Your batch curriculum will appear here once your institution allocates a batch.")}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          {renderGrid(myCourses, "mine", "No extra courses enrolled", "Browse Explore Courses to enroll in offerings outside your curriculum.")}
        </TabsContent>

        <TabsContent value="explore" className="mt-4">
          {renderGrid(exploreCourses, "explore", "No new courses to explore right now", "Check back soon for new offerings from our faculty.")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardCourses;
