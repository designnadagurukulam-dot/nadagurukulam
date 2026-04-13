import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Layers, Plus, Pencil, Trash2, Users, Search, X, UserPlus, Calendar, Hash, GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminBatches = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [showEnroll, setShowEnroll] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  const [form, setForm] = useState({
    name: "", description: "", batch_code: "",
    course_id: "", instructor_id: "",
    start_date: "", end_date: "", max_students: "",
    is_active: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [bRes, cRes, iRes, sRes] = await Promise.all([
      supabase.from("batches").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("user_roles").select("user_id").eq("role", "student"),
    ]);
    const instructorIds = (iRes.data || []).map(r => r.user_id);
    const studentIds = (sRes.data || []).map(r => r.user_id);

    let instrProfiles: any[] = [];
    let studProfiles: any[] = [];
    if (instructorIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds);
      instrProfiles = data || [];
    }
    if (studentIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, enrollment_id").in("user_id", studentIds);
      studProfiles = data || [];
    }

    setBatches(bRes.data || []);
    setCourses(cRes.data || []);
    setInstructors(instrProfiles);
    setStudents(studProfiles);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditBatch(null);
    setForm({ name: "", description: "", batch_code: "", course_id: "", instructor_id: "", start_date: "", end_date: "", max_students: "", is_active: true });
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditBatch(b);
    setForm({
      name: b.name || "", description: b.description || "", batch_code: b.batch_code || "",
      course_id: b.course_id || "", instructor_id: b.instructor_id || "",
      start_date: b.start_date || "", end_date: b.end_date || "",
      max_students: b.max_students?.toString() || "", is_active: b.is_active ?? true,
    });
    setShowForm(true);
  };

  const saveBatch = async () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      batch_code: form.batch_code || null,
      course_id: form.course_id || null,
      instructor_id: form.instructor_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      max_students: form.max_students ? parseInt(form.max_students) : null,
      is_active: form.is_active,
    };
    if (editBatch) {
      const { error } = await supabase.from("batches").update(payload).eq("id", editBatch.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Batch updated" });
    } else {
      const { error } = await supabase.from("batches").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Batch created" });
    }
    setShowForm(false);
    fetchAll();
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    await supabase.from("batches").delete().eq("id", id);
    toast({ title: "Batch deleted" });
    fetchAll();
  };

  const openEnroll = async (batch: any) => {
    setShowEnroll(batch);
    const { data } = await supabase.from("batch_enrollments").select("*").eq("batch_id", batch.id);
    setEnrollments(data || []);
    setSelectedStudent("");
  };

  const enrollStudent = async () => {
    if (!selectedStudent || !showEnroll) return;
    const { error } = await supabase.from("batch_enrollments").insert({
      batch_id: showEnroll.id,
      student_id: selectedStudent,
      enrolled_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Student enrolled" });
    openEnroll(showEnroll);
  };

  const unenroll = async (enrollId: string) => {
    await supabase.from("batch_enrollments").delete().eq("id", enrollId);
    toast({ title: "Student removed" });
    openEnroll(showEnroll);
  };

  const filtered = batches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.batch_code?.toLowerCase().includes(search.toLowerCase())
  );

  const getName = (id: string) => instructors.find(i => i.user_id === id)?.display_name || "—";
  const getStudentName = (id: string) => students.find(s => s.user_id === id)?.display_name || id.slice(0, 8);

  const activeBatches = batches.filter(b => b.is_active).length;

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Batch Management</h1>
            <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          </div>
          <Button onClick={openCreate} className="bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl gap-2">
            <Plus className="h-4 w-4" /> New Batch
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Batches", value: batches.length, icon: Layers, color: "#7D1E24" },
          { label: "Active Batches", value: activeBatches, icon: Hash, color: "#C49A3C" },
          { label: "Courses Linked", value: courses.length, icon: GraduationCap, color: "#5C1219" },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[#8C7B6B]" />
        <Input
          placeholder="Search batches..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4">
            <Layers className="h-7 w-7 text-[#C49A3C]" />
          </div>
          <h3 className="font-serif text-xl text-[#7D1E24] mb-1">No Batches Found</h3>
          <p className="text-sm text-[#8C7B6B] mb-4">Create your first batch to get started</p>
          <Button onClick={openCreate} className="bg-[#C49A3C] hover:bg-[#B08A2E] text-[#3D2E22] rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Create First Batch
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#5C1219] hover:bg-[#5C1219]">
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Batch</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Code</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Instructor</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Dates</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                  <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b, i) => (
                  <TableRow key={b.id} className={`${i % 2 === 1 ? "bg-[#FAF6EE]" : "bg-white"} hover:bg-[#FAF6EE] transition-colors border-b border-[#EDE3CC]`}>
                    <TableCell className="font-medium text-[#3D2E22]">{b.name}</TableCell>
                    <TableCell className="text-[#8C7B6B] font-mono text-xs">{b.batch_code || "—"}</TableCell>
                    <TableCell className="text-[#3D2E22]">{getName(b.instructor_id)}</TableCell>
                    <TableCell className="text-sm text-[#8C7B6B]">
                      {b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} — {b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={b.is_active
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                      }>
                        {b.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEnroll(b)} className="hover:bg-[#F5E9CE] text-[#C49A3C]">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(b)} className="hover:bg-[#F5E9CE] text-[#7D1E24]">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteBatch(b.id)} className="hover:bg-red-50 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-[#EDE3CC]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#7D1E24]">{editBatch ? "Edit Batch" : "Create Batch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Batch Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Batch Code</label>
              <Input value={form.batch_code} onChange={e => setForm({ ...form, batch_code: e.target.value })} className="border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Course</label>
              <Select value={form.course_id} onValueChange={v => setForm({ ...form, course_id: v })}>
                <SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Select Course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Instructor</label>
              <Select value={form.instructor_id} onValueChange={v => setForm({ ...form, instructor_id: v })}>
                <SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Assign Instructor" /></SelectTrigger>
                <SelectContent>{instructors.map(i => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || i.user_id.slice(0, 8)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Start Date</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="border-[#EDE3CC] rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">End Date</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="border-[#EDE3CC] rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Max Students</label>
              <Input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} className="border-[#EDE3CC] rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl border-[#EDE3CC]">Cancel</Button>
            <Button onClick={saveBatch} disabled={!form.name} className="bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">
              {editBatch ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={!!showEnroll} onOpenChange={() => setShowEnroll(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-[#EDE3CC]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#7D1E24]">
              <Users className="inline h-5 w-5 mr-2 text-[#C49A3C]" />
              Enrollments — {showEnroll?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="flex-1 border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Select Student" /></SelectTrigger>
              <SelectContent>
                {students
                  .filter(s => !enrollments.some(e => e.student_id === s.user_id))
                  .map(s => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {s.display_name || s.user_id.slice(0, 8)} {s.enrollment_id ? `(${s.enrollment_id})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={enrollStudent} disabled={!selectedStudent} className="bg-[#C49A3C] hover:bg-[#B08A2E] text-[#3D2E22] rounded-xl">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1 mt-2">
            {enrollments.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-[#C49A3C]" />
                </div>
                <p className="text-sm text-[#8C7B6B]">No students enrolled yet</p>
              </div>
            )}
            {enrollments.map(e => (
              <div key={e.id} className="flex items-center justify-between border-b border-[#EDE3CC] py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#F5E9CE] flex items-center justify-center text-[#7D1E24] text-xs font-bold">
                    {getStudentName(e.student_id)[0]?.toUpperCase()}
                  </div>
                  <span className="text-[#3D2E22]">{getStudentName(e.student_id)}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => unenroll(e.id)} className="hover:bg-red-50 text-red-500">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBatches;
