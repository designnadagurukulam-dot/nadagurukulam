import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, MessageSquare, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const InstructorStudents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: batches = [] } = useQuery({ queryKey: ["tutor-batches", user?.id], queryFn: async () => { const { data } = await supabase.from("batches").select("id, name").eq("instructor_id", user!.id); return data || []; }, enabled: !!user });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["tutor-students", user?.id, batches],
    queryFn: async () => {
      const batchIds = batches.map((b) => b.id); if (!batchIds.length) return [];
      const { data: enrollments } = await supabase.from("batch_enrollments").select("student_id, batch_id, enrolled_at").in("batch_id", batchIds);
      if (!enrollments?.length) return [];
      const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, roll_number, phone, course_name").in("user_id", studentIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      const batchMap = Object.fromEntries(batches.map((b) => [b.id, b.name]));
      return enrollments.map((e) => ({ ...e, profile: profileMap[e.student_id] || {}, batch_name: batchMap[e.batch_id] || "Unknown" }));
    },
    enabled: batches.length > 0,
  });

  const filtered = students.filter((s: any) => {
    const matchesSearch = !search || s.profile?.display_name?.toLowerCase().includes(search.toLowerCase()) || s.profile?.roll_number?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (batchFilter === "all" || s.batch_id === batchFilter);
  });

  const getInitials = (name: string) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-semibold text-brand-primary">My Students</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-2 text-sm">Students enrolled in your batches</p>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-grey" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="pl-9 rounded-xl border-brand-parchment focus:border-brand-gold" />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-48 rounded-xl border-brand-parchment"><SelectValue placeholder="Filter by batch" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Batches</SelectItem>{batches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-gold-pale flex items-center justify-center mx-auto mb-3"><Users className="h-6 w-6 text-brand-gold" /></div>
            <p className="font-serif text-brand-primary font-semibold">No students found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#5C1219] text-[#E2B95A] text-[11px] uppercase tracking-widest">
                <th className="text-left p-3 rounded-tl-2xl">Student</th>
                <th className="text-left p-3">Roll No</th>
                <th className="text-left p-3">Batch</th>
                <th className="text-left p-3">Enrolled</th>
                <th className="text-right p-3 rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any, i: number) => (
                <tr key={`${s.student_id}-${s.batch_id}-${i}`} className={`border-b border-brand-parchment hover:bg-brand-cream transition-all ${i % 2 === 0 ? "bg-white" : "bg-brand-cream"}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-gold-pale flex items-center justify-center text-brand-primary font-bold text-xs">{getInitials(s.profile?.display_name || "")}</div>
                      <div>
                        <p className="font-medium text-brand-charcoal-mid text-sm">{s.profile?.display_name || "—"}</p>
                        <p className="text-xs text-brand-warm-grey">{s.profile?.course_name || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-brand-warm-grey font-mono">{s.profile?.roll_number || "—"}</td>
                  <td className="p-3"><Badge className="text-xs bg-brand-gold-pale text-brand-primary border-0">{s.batch_name}</Badge></td>
                  <td className="p-3 text-sm text-brand-warm-grey">{s.enrolled_at ? format(new Date(s.enrolled_at), "MMM dd, yyyy") : "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(s)} className="gap-1 text-xs text-brand-primary hover:bg-brand-gold-pale"><Eye className="h-3 w-3" /> View</Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/tutor/messages")} className="gap-1 text-xs text-brand-primary hover:bg-brand-gold-pale"><MessageSquare className="h-3 w-3" /> Message</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="rounded-2xl border-brand-parchment">
          <DialogHeader><DialogTitle className="font-serif text-brand-primary">Student Profile</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-gold-pale flex items-center justify-center text-brand-primary font-bold text-lg">{getInitials(selectedStudent.profile?.display_name || "")}</div>
                <div>
                  <p className="font-serif text-lg font-bold text-brand-charcoal-mid">{selectedStudent.profile?.display_name || "—"}</p>
                  <Badge className="bg-brand-gold-pale text-brand-primary border-0">{selectedStudent.batch_name}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Roll Number</span><p className="font-medium text-brand-charcoal-mid">{selectedStudent.profile?.roll_number || "—"}</p></div>
                <div><span className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Phone</span><p className="font-medium text-brand-charcoal-mid">{selectedStudent.profile?.phone || "—"}</p></div>
                <div><span className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Course</span><p className="font-medium text-brand-charcoal-mid">{selectedStudent.profile?.course_name || "—"}</p></div>
                <div><span className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">Enrolled</span><p className="font-medium text-brand-charcoal-mid">{selectedStudent.enrolled_at ? format(new Date(selectedStudent.enrolled_at), "MMM dd, yyyy") : "—"}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorStudents;
