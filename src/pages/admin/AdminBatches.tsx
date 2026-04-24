import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  Hash,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  Video,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminBatches = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [batchLiveClasses, setBatchLiveClasses] = useState<any[]>([]);
  const [batchAssignments, setBatchAssignments] = useState<any[]>([]);
  const [batchSchedules, setBatchSchedules] = useState<any[]>([]);
  const [batchSubmissions, setBatchSubmissions] = useState<any[]>([]);
  const [batchGrades, setBatchGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [showEnroll, setShowEnroll] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    batch_code: "",
    course_id: "",
    instructor_id: "",
    start_date: "",
    end_date: "",
    max_students: "",
    is_active: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [bRes, cRes, mRes, eRes, iRes, sRes] = await Promise.all([
      supabase.from("batches").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title"),
      supabase.from("curriculum_modules").select("id, subject_name, course_code, semester, batch_id, hours").order("semester"),
      supabase.from("batch_enrollments").select("*"),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("user_roles").select("user_id").eq("role", "student"),
    ]);

    const instructorIds = (iRes.data || []).map((r) => r.user_id);
    const studentIds = (sRes.data || []).map((r) => r.user_id);
    const [instrProfiles, studProfiles] = await Promise.all([
      instructorIds.length
        ? supabase.from("profiles").select("user_id, display_name").in("user_id", instructorIds)
        : Promise.resolve({ data: [] }),
      studentIds.length
        ? supabase.from("profiles").select("user_id, display_name, enrollment_id").in("user_id", studentIds)
        : Promise.resolve({ data: [] }),
    ]);

    setBatches(bRes.data || []);
    setCourses(cRes.data || []);
    setModules(mRes.data || []);
    setAllEnrollments(eRes.data || []);
    setInstructors(instrProfiles.data || []);
    setStudents(studProfiles.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const instructorById = useMemo(() => new Map(instructors.map((instructor) => [instructor.user_id, instructor])), [instructors]);

  const getBatchModules = (batch: any) => modules.filter((module) => module.batch_id === batch.id);
  const getBatchEnrollmentCount = (batchId: string) => allEnrollments.filter((row) => row.batch_id === batchId).length;
  const getStudentName = (id: string) => students.find((student) => student.user_id === id)?.display_name || id.slice(0, 8);

  const filtered = batches.filter((batch) => {
    const query = search.toLowerCase();
    const courseTitle = courseById.get(batch.course_id)?.title?.toLowerCase() || "";
    const tutorName = instructorById.get(batch.instructor_id)?.display_name?.toLowerCase() || "";
    return [batch.name, batch.batch_code, courseTitle, tutorName].some((value) => value?.toLowerCase().includes(query));
  });

  const openCreate = () => {
    setEditBatch(null);
    setForm({ name: "", description: "", batch_code: "", course_id: "", instructor_id: "", start_date: "", end_date: "", max_students: "", is_active: true });
    setShowForm(true);
  };

  const openEdit = (batch: any) => {
    setEditBatch(batch);
    setForm({
      name: batch.name || "",
      description: batch.description || "",
      batch_code: batch.batch_code || "",
      course_id: batch.course_id || "",
      instructor_id: batch.instructor_id || "",
      start_date: batch.start_date || "",
      end_date: batch.end_date || "",
      max_students: batch.max_students?.toString() || "",
      is_active: batch.is_active ?? true,
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
    const { error } = editBatch
      ? await supabase.from("batches").update(payload).eq("id", editBatch.id)
      : await supabase.from("batches").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: editBatch ? "Batch updated" : "Batch created" });
    setShowForm(false);
    fetchAll();
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Batch deleted" });
    fetchAll();
  };

  const openEnroll = async (batch: any) => {
    setShowEnroll(batch);
    setSelectedStudent("");
    const [enrollRes, lcRes, asgRes, schedRes] = await Promise.all([
      supabase.from("batch_enrollments").select("*").eq("batch_id", batch.id),
      supabase.from("live_classes").select("*").eq("batch_id", batch.id).order("scheduled_at", { ascending: false }),
      supabase.from("assignments").select("*").eq("batch_id", batch.id).order("created_at", { ascending: false }),
      supabase.from("schedules").select("*").eq("batch_id", batch.id).order("start_time", { ascending: true }),
    ]);
    setEnrollments(enrollRes.data || []);
    setBatchLiveClasses(lcRes.data || []);
    setBatchAssignments(asgRes.data || []);
    setBatchSchedules(schedRes.data || []);

    // Fetch submissions for assignments in this batch (for status/grade context)
    const assignmentIds = (asgRes.data || []).map((a: any) => a.id);
    if (assignmentIds.length) {
      const { data: subs } = await supabase.from("assignment_submissions").select("*").in("assignment_id", assignmentIds);
      setBatchSubmissions(subs || []);
    } else {
      setBatchSubmissions([]);
    }

    // Fetch CIE/SEE grades for this batch
    const { data: grades } = await (supabase as any).from("student_grades").select("*").eq("batch_id", batch.id);
    setBatchGrades(grades || []);
  };

  const enrollStudent = async () => {
    if (!selectedStudent || !showEnroll) return;
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("batch_enrollments").insert({
      batch_id: showEnroll.id,
      student_id: selectedStudent,
      enrolled_by: auth.user?.id,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Student enrolled" });
    fetchAll();
    openEnroll(showEnroll);
  };

  const unenroll = async (enrollId: string) => {
    const { error } = await supabase.from("batch_enrollments").delete().eq("id", enrollId);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Student removed" });
    fetchAll();
    openEnroll(showEnroll);
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-brand-primary">Batch Management</h1>
          <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" />
          <p className="mt-2 text-sm text-brand-warm-grey">Manage programme-linked cohorts, subjects, students, timetable slots and live classes.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Batch
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Students", value: allEnrollments.length, icon: Users },
          { label: "Total Batches", value: batches.length, icon: Layers },
          { label: "Active Batches", value: batches.filter((batch) => batch.is_active).length, icon: Hash },
          { label: "Past Batches", value: batches.filter((batch) => batch.end_date && new Date(batch.end_date) < new Date()).length, icon: Calendar },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-3xl text-brand-primary">{stat.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-warm-grey">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by batch, code, programme or tutor..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card py-16 text-center shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <Layers className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="font-display text-xl text-brand-primary">No Batches Found</h3>
          <p className="mt-1 text-sm text-brand-warm-grey">Create a batch or adjust your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((batch, index) => {
            const batchModules = getBatchModules(batch);
            const studentCount = getBatchEnrollmentCount(batch.id);
            const course = courseById.get(batch.course_id);
            const tutor = instructorById.get(batch.instructor_id);
            const semesterLabel = batchModules.length ? `Semester ${batchModules[0].semester}` : "Term not assigned";

            return (
              <motion.div key={batch.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={batch.is_active ? "default" : "secondary"}>{batch.is_active ? "Active" : "Inactive"}</Badge>
                      {batch.batch_code && <Badge variant="outline">{batch.batch_code}</Badge>}
                    </div>
                    <h2 className="font-display text-xl text-brand-primary">{batch.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-brand-warm-grey">{course?.title || "Programme not linked"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(batch)} aria-label="Edit batch"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteBatch(batch.id)} className="text-destructive" aria-label="Delete batch"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Students</p>
                    <p className="mt-1 font-display text-2xl text-brand-primary">{studentCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subjects</p>
                    <p className="mt-1 font-display text-2xl text-brand-primary">{batchModules.length}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-brand-warm-grey">
                  <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-brand-gold" /> {semesterLabel}</p>
                  <p className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-gold" /> {tutor?.display_name || "Tutor not assigned"}</p>
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-brand-gold" /> {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "Start date pending"}</p>
                </div>

                <div className="mt-5">
                  <Button onClick={() => openEnroll(batch)} variant="outline" className="w-full gap-2">
                    <Layers className="h-4 w-4" /> Manage Batch
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editBatch ? "Edit Batch" : "Create Batch"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Batch Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Batch Code</label><Input value={form.batch_code} onChange={(e) => setForm({ ...form, batch_code: e.target.value })} /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Programme</label><Select value={form.course_id} onValueChange={(course_id) => setForm({ ...form, course_id })}><SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Tutor</label><Select value={form.instructor_id} onValueChange={(instructor_id) => setForm({ ...form, instructor_id })}><SelectTrigger><SelectValue placeholder="Assign tutor" /></SelectTrigger><SelectContent>{instructors.map((instructor) => <SelectItem key={instructor.user_id} value={instructor.user_id}>{instructor.display_name || instructor.user_id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Start Date</label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">End Date</label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">Max Students</label><Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={saveBatch} disabled={!form.name}>{editBatch ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEnroll} onOpenChange={() => setShowEnroll(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-brand-primary"><Layers className="mr-2 inline h-5 w-5 text-brand-gold" />{showEnroll?.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="students">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl sm:grid-cols-7">
              <TabsTrigger value="students" className="text-xs">Students ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="subjects" className="text-xs">Subjects ({showEnroll ? getBatchModules(showEnroll).length : 0})</TabsTrigger>
              <TabsTrigger value="timetable" className="text-xs">Timetable ({batchSchedules.length})</TabsTrigger>
              <TabsTrigger value="live" className="text-xs">Live ({batchLiveClasses.length})</TabsTrigger>
              <TabsTrigger value="past" className="text-xs">Past Asg.</TabsTrigger>
              <TabsTrigger value="inprogress" className="text-xs">In Progress</TabsTrigger>
              <TabsTrigger value="grades" className="text-xs">Grades</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.filter((student) => !enrollments.some((enrollment) => enrollment.student_id === student.user_id)).map((student) => <SelectItem key={student.user_id} value={student.user_id}>{student.display_name || student.user_id.slice(0, 8)} {student.enrollment_id ? `(${student.enrollment_id})` : ""}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={enrollStudent} disabled={!selectedStudent} className="gap-2"><UserPlus className="h-4 w-4" /> Add</Button>
              </div>
              {enrollments.length === 0 ? <EmptyState icon={Users} label="No students enrolled yet" /> : enrollments.map((enrollment) => <Row key={enrollment.id} title={getStudentName(enrollment.student_id)} meta="Student" action={<Button size="icon" variant="ghost" onClick={() => unenroll(enrollment.id)} className="text-destructive"><X className="h-4 w-4" /></Button>} />)}
            </TabsContent>

            <TabsContent value="subjects" className="mt-4 space-y-2">
              {showEnroll && getBatchModules(showEnroll).length === 0 ? <EmptyState icon={BookOpen} label="No subjects linked to this batch" /> : showEnroll && getBatchModules(showEnroll).map((module) => <Row key={module.id} title={`${module.course_code} · ${module.subject_name}`} meta={`Semester ${module.semester}${module.hours ? ` · ${module.hours} hours` : ""}`} />)}
            </TabsContent>

            <TabsContent value="timetable" className="mt-4 space-y-2">
              {batchSchedules.length === 0 ? <EmptyState icon={Calendar} label="No timetable slots for this batch" /> : batchSchedules.map((slot) => <Row key={slot.id} title={slot.event_title} meta={`${new Date(slot.start_time).toLocaleString()} · ${slot.location || slot.event_type}`} />)}
            </TabsContent>

            <TabsContent value="live" className="mt-4 space-y-2">
              <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">Upcoming and recent online classes scheduled for this batch — quick join links and history.</p>
              {batchLiveClasses.length === 0 ? <EmptyState icon={Video} label="No live classes for this batch" /> : batchLiveClasses.map((liveClass) => <Row key={liveClass.id} title={liveClass.title} meta={new Date(liveClass.scheduled_at).toLocaleString()} action={<Badge variant="secondary" className="gap-1">{liveClass.class_type === "offline" ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}{liveClass.class_type === "offline" ? "Offline" : "Online"}</Badge>} />)}
            </TabsContent>

            <TabsContent value="past" className="mt-4 space-y-2">
              {(() => {
                const past = batchAssignments.filter((a) => a.due_date && new Date(a.due_date) < new Date());
                return past.length === 0 ? <EmptyState icon={ClipboardList} label="No past assignments" /> : past.map((assignment) => <Row key={assignment.id} title={assignment.title} meta={`Due ${new Date(assignment.due_date).toLocaleDateString()} · ${batchSubmissions.filter((s) => s.assignment_id === assignment.id).length} submissions`} />);
              })()}
            </TabsContent>

            <TabsContent value="inprogress" className="mt-4 space-y-2">
              {(() => {
                const inProgress = batchAssignments.filter((a) => !a.due_date || new Date(a.due_date) >= new Date());
                return inProgress.length === 0 ? <EmptyState icon={ClipboardList} label="No assignments in progress" /> : inProgress.map((assignment) => <Row key={assignment.id} title={assignment.title} meta={assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleDateString()}` : "No due date"} />);
              })()}
            </TabsContent>

            <TabsContent value="grades" className="mt-4 space-y-2">
              {enrollments.length === 0 ? <EmptyState icon={GraduationCap} label="No students enrolled — add students first" /> : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-2 text-left">Student</th>
                        <th className="p-2 text-left">Subject</th>
                        <th className="p-2 text-right">CIE</th>
                        <th className="p-2 text-right">SEE</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.flatMap((enr) => {
                        const subjects = showEnroll ? getBatchModules(showEnroll) : [];
                        if (subjects.length === 0) return [<tr key={`${enr.id}-empty`}><td colSpan={5} className="p-3 text-center text-xs text-muted-foreground">No subjects linked to this batch yet</td></tr>];
                        return subjects.map((mod) => {
                          const grade = batchGrades.find((g) => g.student_id === enr.student_id && g.curriculum_module_id === mod.id);
                          const cie = grade?.cie_marks ?? "—";
                          const see = grade?.see_marks ?? "—";
                          const total = grade?.cie_marks != null && grade?.see_marks != null ? grade.cie_marks + grade.see_marks : "—";
                          return (
                            <tr key={`${enr.id}-${mod.id}`} className="border-t border-border">
                              <td className="p-2">{getStudentName(enr.student_id)}</td>
                              <td className="p-2 text-xs text-muted-foreground">{mod.course_code} · {mod.subject_name}</td>
                              <td className="p-2 text-right">{cie}</td>
                              <td className="p-2 text-right">{see}</td>
                              <td className="p-2 text-right font-semibold">{total}</td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                  <p className="border-t border-border bg-muted/20 p-2 text-[11px] text-muted-foreground">CIE / SEE marks are entered in the Grades management area. This view aggregates across all subjects for this batch.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmptyState = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="rounded-xl bg-muted/50 py-8 text-center text-sm text-muted-foreground">
    <Icon className="mx-auto mb-3 h-6 w-6" />
    {label}
  </div>
);

const Row = ({ title, meta, action }: { title: string; meta?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      {meta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>}
    </div>
    {action}
  </div>
);

export default AdminBatches;
