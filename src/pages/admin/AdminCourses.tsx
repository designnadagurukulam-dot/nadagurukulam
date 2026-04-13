import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Trash2, Eye, GraduationCap, IndianRupee, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const AdminCourses = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCourses = async () => {
    let query = supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, [statusFilter, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
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

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">All Courses</h1>
        <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
        <p className="text-sm text-[#8C7B6B] mt-2">Manage platform courses</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Courses", value: courses.length, icon: BookOpen, color: "#7D1E24" },
          { label: "Approved", value: courses.filter(c => c.status === "approved").length, icon: GraduationCap, color: "#C49A3C" },
          { label: "Pending", value: courses.filter(c => c.status === "pending").length, icon: Layers, color: "#5C1219" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#F5E9CE] flex items-center justify-center">
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-[#7D1E24]">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C7B6B]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="pl-10 border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-[#C49A3C]" />
          </div>
          <h3 className="font-serif text-xl text-[#7D1E24]">No Courses Found</h3>
          <p className="text-sm text-[#8C7B6B] mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:bg-[#FAF6EE] transition-colors">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F5E9CE] flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-[#7D1E24]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-[#3D2E22] truncate">{course.title}</h3>
                        <Badge className={statusColors[course.status] || statusColors.draft}>{course.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#8C7B6B] mt-1">
                        <span>{course.instructor_name || "—"}</span>
                        <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{course.price || 0}</span>
                        <span>{course.level || "—"}</span>
                        <span>{new Date(course.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="hover:bg-[#F5E9CE] text-[#7D1E24]"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(course.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
