import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, BookOpen, Clock, Calendar, Layers, Video, FileText, Type, Headphones, Tag, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const lessonTypeIcons: Record<string, any> = { video: Video, audio: Headphones, pdf: FileText, text: Type };

const statusColors: Record<string, string> = {
  draft: "bg-brand-cream-dark text-brand-warm-grey",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);
      setError(null);
      try {
        const { data: courseData, error: courseErr } = await supabase
          .from("courses")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (courseErr) throw courseErr;
        if (!courseData) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const { data: modulesData, error: modulesErr } = await supabase
          .from("course_modules")
          .select("*, course_lessons(*)")
          .eq("course_id", id)
          .order("sort_order", { ascending: true });
        if (modulesErr) throw modulesErr;

        if (cancelled) return;
        setCourse(courseData);
        setModules(
          (modulesData || []).map((m: any) => ({
            ...m,
            course_lessons: (m.course_lessons || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order),
          }))
        );
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const brandCard = "bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)]";
  const brandLabel = "text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold";

  const BackButton = (
    <Button variant="ghost" onClick={() => navigate("/dashboard/tutor/courses")} className="gap-2 mb-2 text-[#8C7B6B] hover:text-[#7D1E24] hover:bg-[#FAF6EE] rounded-xl">
      <ArrowLeft className="h-4 w-4" /> Back to My Courses
    </Button>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-2">
        {BackButton}
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto pt-2">
        {BackButton}
        <div className={`${brandCard} p-12 text-center`}>
          <p className="text-lg font-serif text-[#7D1E24]">Course not found.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto pt-2">
        {BackButton}
        <div className={`${brandCard} p-12 text-center`}>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const totalLessons = modules.reduce((sum, m) => sum + (m.course_lessons?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {BackButton}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">{course.title}</h1>
            <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[course.status] || statusColors.draft} border-0`}>{course.status}</Badge>
            <Button onClick={() => navigate(`/dashboard/tutor/edit/${course.id}`)} className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">
              <Edit className="h-4 w-4" /> Edit Course
            </Button>
          </div>
        </div>
      </motion.div>

      {course.thumbnail_url && (
        <div className="h-48 rounded-2xl overflow-hidden border border-[#EDE3CC]">
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className={brandCard}>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-serif text-lg text-[#7D1E24] mb-1 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Course Details</h3>
            <div className="w-8 h-0.5 bg-[#C49A3C] mb-4" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label className={brandLabel}>Total Hours</Label>
              <p className="mt-1 flex items-center gap-1.5 text-[#3D2E22]"><Clock className="h-3.5 w-3.5 text-[#C49A3C]" />{course.total_hours ? `${course.total_hours}h` : (course.duration || "—")}</p>
            </div>
            {course.category && (
              <div>
                <Label className={brandLabel}>Category</Label>
                <p className="mt-1 flex items-center gap-1.5 text-[#3D2E22]"><Tag className="h-3.5 w-3.5 text-[#C49A3C]" />{course.category}</p>
              </div>
            )}
            {course.level && (
              <div>
                <Label className={brandLabel}>Level</Label>
                <p className="mt-1 text-[#3D2E22]">{course.level}</p>
              </div>
            )}
            {course.instructor_name && (
              <div>
                <Label className={brandLabel}>Instructor</Label>
                <p className="mt-1 flex items-center gap-1.5 text-[#3D2E22]"><GraduationCap className="h-3.5 w-3.5 text-[#C49A3C]" />{course.instructor_name}</p>
              </div>
            )}
            <div>
              <Label className={brandLabel}>Created</Label>
              <p className="mt-1 flex items-center gap-1.5 text-[#3D2E22]"><Calendar className="h-3.5 w-3.5 text-[#C49A3C]" />{new Date(course.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className={brandLabel}>Modules / Topics</Label>
              <p className="mt-1 flex items-center gap-1.5 text-[#3D2E22]"><Layers className="h-3.5 w-3.5 text-[#C49A3C]" />{modules.length} / {totalLessons}</p>
            </div>
          </div>

          {course.description && (
            <div>
              <Label className={brandLabel}>Description</Label>
              <p className="mt-1 text-sm text-[#3D2E22] whitespace-pre-line">{course.description}</p>
            </div>
          )}

          {Array.isArray(course.course_outcomes) && course.course_outcomes.length > 0 && (
            <div>
              <Label className={brandLabel}>Course Outcomes</Label>
              <ul className="mt-1 space-y-1 list-disc list-inside text-sm text-[#3D2E22]">
                {course.course_outcomes.map((o: string, i: number) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {modules.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg text-[#7D1E24]">Modules & Topics</h3>
          {modules.map((mod) => (
            <div key={mod.id} className={brandCard}>
              <div className="p-5 space-y-3">
                <h4 className="font-serif font-semibold text-[#7D1E24]">{mod.title}</h4>
                {mod.description && <p className="text-sm text-[#3D2E22]">{mod.description}</p>}
                {mod.teaching_outcomes && (
                  <p className="text-xs text-[#8C7B6B]"><span className="font-semibold">Teaching outcomes: </span>{mod.teaching_outcomes}</p>
                )}
                {mod.hours ? <p className="text-xs text-[#8C7B6B]">{mod.hours}h</p> : null}

                {mod.course_lessons?.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-[#C49A3C]/30">
                    {mod.course_lessons.map((les: any) => {
                      const LesIcon = lessonTypeIcons[les.lesson_type] || Video;
                      return (
                        <div key={les.id} className="bg-[#FAF6EE] rounded-xl p-3 border border-[#EDE3CC] flex items-start gap-2">
                          <LesIcon className="h-4 w-4 text-[#7D1E24] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#3D2E22]">{les.title}</p>
                            {les.description && <p className="text-xs text-[#8C7B6B] mt-0.5">{les.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={className}>{children}</span>
);

export default CourseDetails;
