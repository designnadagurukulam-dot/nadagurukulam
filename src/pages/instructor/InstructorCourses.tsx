import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Clock, Eye, Edit, Sparkles, GraduationCap, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TutorCurriculum from "./TutorCurriculum";

const statusColors: Record<string, string> = {
  draft: "bg-brand-cream-dark text-brand-warm-grey",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const InstructorCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("courses")
      .select("*")
      .eq("instructor_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCourses(data || []);
        setLoading(false);
      });
  }, [user]);

  const createBtn = (
    <Link to="/dashboard/tutor/create">
      <Button className="gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
        <Plus className="h-4 w-4" /> Create Course
      </Button>
    </Link>
  );

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-gold" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Courses & Curriculum</h1>
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1 ml-10" />
          <p className="text-brand-warm-grey mt-2 text-sm ml-10">Content you have created or that has been allocated to you</p>
        </div>
        {courses.length > 0 && createBtn}
      </motion.div>

      <Tabs defaultValue="courses">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1">
          <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> My Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> My Curriculum
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : courses.length === 0 ? (
            <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-brand-gold" />
                </div>
                <h3 className="font-serif text-xl text-brand-primary mb-2">No courses yet</h3>
                <p className="text-brand-warm-grey mb-6 text-sm">Create your first course to share extra learning material</p>
                {createBtn}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="overflow-hidden hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] hover:-translate-y-0.5 transition-all duration-300 group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
                    <div className="h-36 bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-white/30" />
                      )}
                      <Badge className={`absolute top-3 right-3 ${statusColors[course.status] || statusColors.draft} border-0 shadow-sm`}>{course.status}</Badge>
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-serif text-lg text-brand-charcoal-mid line-clamp-1 group-hover:text-brand-primary transition-colors">{course.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-brand-warm-grey">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.total_hours ? `${course.total_hours}h` : (course.duration || "—")}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(course.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Link to={`/dashboard/tutor/edit/${course.id}`} className="flex-1">
                          <Button size="sm" className="w-full gap-1 border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-gold-pale rounded-xl text-xs font-semibold"><Edit className="h-3 w-3" /> Edit</Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="hover:bg-brand-gold-pale rounded-xl"><Eye className="h-3 w-3 text-brand-primary" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="curriculum" className="mt-4">
          <TutorCurriculum />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorCourses;
