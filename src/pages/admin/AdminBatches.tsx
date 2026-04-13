import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Layers, Plus, Pencil, Trash2, Users, Search, X, UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (loading) {
    return (
      <div className="space-y-4 pt-12 lg:pt-0">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Layers className="h-7 w-7 text-primary" />
            <h1 className="font-serif text-2xl text-foreground">Batch Management</h1>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Batch</Button>
        </div>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search batches..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No batches found</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create First Batch</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.batch_code || "—"}</TableCell>
                    <TableCell>{getName(b.instructor_id)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} — {b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEnroll(b)}><Users className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteBatch(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBatch ? "Edit Batch" : "Create Batch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Batch Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Batch Code" value={form.batch_code} onChange={e => setForm({ ...form, batch_code: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Select value={form.course_id} onValueChange={v => setForm({ ...form, course_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.instructor_id} onValueChange={v => setForm({ ...form, instructor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Assign Instructor" /></SelectTrigger>
              <SelectContent>{instructors.map(i => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || i.user_id.slice(0, 8)}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <Input type="number" placeholder="Max Students" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveBatch} disabled={!form.name}>{editBatch ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={!!showEnroll} onOpenChange={() => setShowEnroll(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enrollments — {showEnroll?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select Student" /></SelectTrigger>
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
            <Button onClick={enrollStudent} disabled={!selectedStudent}><UserPlus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2 mt-2">
            {enrollments.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No students enrolled</p>
            )}
            {enrollments.map(e => (
              <div key={e.id} className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span>{getStudentName(e.student_id)}</span>
                <Button size="sm" variant="ghost" onClick={() => unenroll(e.id)}><X className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBatches;
