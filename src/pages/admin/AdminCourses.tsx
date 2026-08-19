import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Trash2, Eye, GraduationCap, IndianRupee, Layers, Archive, RotateCcw, Tag, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { useNavigate } from "react-router-dom";

const AdminCourses = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [tutors, setTutors] = useState<Record<string, string>>({});
  const [programs, setPrograms] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tutorFilter, setTutorFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState<"active" | "archived">("active");

  const fetchCourses = async () => {
    setLoading(true);
    const [{ data: rows }, { data: progs }, { data: tps }, { data: instrRoles }] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("curriculum_topics").select("id, title, module_id"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
    ]);
    setPrograms(progs || []);
    setTopics(tps || []);
    if ((instrRoles || []).length) {
      const ids = (instrRoles || []).map(r => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach(p => { map[p.user_id] = p.display_name || "Faculty"; });
      setTutors(map);
    }
    setCourses(rows || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const archive = async (id: string) => {
    if (!confirm("Archive this course? Students will no longer see it.")) return;
    await supabase.from("courses").update({ archived_at: new Date().toISOString() } as any).eq("id", id);
    logActivity("course.archived", "course", id);
    toast({ title: "Course archived" });
    fetchCourses();
  };

  const restore = async (id: string) => {
    await supabase.from("courses").update({ archived_at: null } as any).eq("id", id);
    logActivity("course.restored", "course", id);
    toast({ title: "Course restored" });
    fetchCourses();
  };

  const hardDelete = async (id: string) => {
    if (!confirm("Permanently delete this archived course? This cannot be undone.")) return;
    await supabase.from("courses").delete().eq("id", id);
    logActivity("course.deleted", "course", id);
    toast({ title: "Course deleted" });
    fetchCourses();
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-50 text-gray-600 border border-gray-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    rejected: "bg-red-50 text-red-600 border border-red-200",
  };

  // Apply filters & search
  const matchesSearch = (c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (c.title?.toLowerCase().includes(q)) return true;
    if ((c.instructor_id && tutors[c.instructor_id]?.toLowerCase().includes(q))) return true;
    const program = programs.find(p => p.id === c.program_id || p.id === c.category_id);
    if (program?.name?.toLowerCase().includes(q)) return true;
    // topic search would require module_id linkage we don't have here; skip
    return false;
  };

  const visible = courses.filter(c => {
    const archived = !!(c as any).archived_at;
    if (tab === "active" && archived) return false;
    if (tab === "archived" && !archived) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (tutorFilter !== "all" && c.instructor_id !== tutorFilter) return false;
    if (programFilter !== "all" && c.program_id !== programFilter && c.category_id !== programFilter) return false;
    if (typeFilter !== "all" && (c.course_type || "online") !== typeFilter) return false;
    return matchesSearch(c);
  });

  const tutorOptions = Object.entries(tutors).sort(([, a], [, b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Faculty's Courses</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
        <p className="text-sm text-brand-warm-grey mt-2">Review, archive or restore tutor-created courses.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Active", value: courses.filter(c => !(c as any).archived_at).length, icon: BookOpen, gradient: "from-brand-primary to-brand-primary-dark" },
          { label: "Approved", value: courses.filter(c => c.status === "approved" && !(c as any).archived_at).length, icon: GraduationCap, gradient: "from-brand-gold to-amber-600" },
          { label: "Pending", value: courses.filter(c => c.status === "pending" && !(c as any).archived_at).length, icon: Layers, gradient: "from-amber-500 to-orange-600" },
          { label: "Archived", value: courses.filter(c => !!(c as any).archived_at).length, icon: Archive, gradient: "from-gray-400 to-gray-600" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList className="bg-brand-cream border border-brand-parchment rounded-xl p-1">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white">Active</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white">Archived</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-grey" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by course, tutor, program…" className="pl-10 border-brand-parchment rounded-xl focus:border-brand-gold" />
          </div>
          <Select value={tutorFilter} onValueChange={setTutorFilter}>
            <SelectTrigger className="w-44 border-brand-parchment rounded-xl"><SelectValue placeholder="Faculty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculty</SelectItem>
              {tutorOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-44 border-brand-parchment rounded-xl"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 border-brand-parchment rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-brand-parchment rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : visible.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
              <BookOpen className="h-7 w-7 text-brand-gold mx-auto mb-2" />
              <h3 className="font-serif text-xl text-brand-primary">No Courses Found</h3>
              <p className="text-sm text-brand-warm-grey mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((course) => {
                const program = programs.find(p => p.id === course.program_id || p.id === course.category_id);
                return (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:bg-brand-cream transition-all duration-300 overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/course/${course.id}`)}>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5 text-brand-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-medium text-brand-charcoal truncate">{course.title}</h3>
                              <Badge className={statusColors[course.status] || statusColors.draft}>{course.status}</Badge>
                              {program && <Badge className="bg-brand-gold-pale text-brand-gold-dark border border-brand-parchment text-[10px] gap-1"><Tag className="h-2.5 w-2.5" />{program.name}</Badge>}
                              <Badge className="bg-brand-cream-dark text-brand-charcoal-mid border-0 text-[10px]">{course.course_type || "online"}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-brand-warm-grey mt-1">
                              <span>{tutors[course.instructor_id] || course.instructor_name || "—"}</span>
                              <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{course.price || 0}</span>
                              <span>{course.level || "—"}</span>
                              <span>{new Date(course.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="hover:bg-brand-gold-pale text-brand-primary" onClick={() => navigate(`/course/${course.id}`)} title="View course"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:bg-brand-gold-pale text-brand-primary" onClick={() => navigate(`/dashboard/admin/approvals?course=${course.id}`)} title="Review submission"><CheckSquare className="h-4 w-4" /></Button>
                          {tab === "active" ? (
                            <Button variant="ghost" size="sm" className="hover:bg-amber-50 text-amber-600" onClick={() => archive(course.id)}><Archive className="h-4 w-4" /></Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="hover:bg-green-50 text-green-600" onClick={() => restore(course.id)}><RotateCcw className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="hover:bg-red-50 text-red-500" onClick={() => hardDelete(course.id)}><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCourses;
