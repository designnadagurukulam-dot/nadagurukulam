import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  Video,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

const db = supabase as any;

type View = "home" | "active" | "past" | "program" | "students";

const isPast = (b: any) => b.end_date && new Date(b.end_date) < new Date();
const isActive = (b: any) => (b.is_manually_active ?? b.is_active ?? true) && !isPast(b);

const AdminBatches = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [view, setView] = useState<View>("home");
  const [viewProgramId, setViewProgramId] = useState<string | null>(null);
  const [viewStudentsBatchId, setViewStudentsBatchId] = useState<string | null>(null);

  // Search / batch form
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    batch_code: "",
    program_id: "",
    course_id: "",
    instructor_id: "",
    semester: "",
    start_date: "",
    end_date: "",
    max_students: "",
    is_manually_active: true,
  });

  // Manage-batch dialog state
  const [showEnroll, setShowEnroll] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [batchLiveClasses, setBatchLiveClasses] = useState<any[]>([]);
  const [batchAssignments, setBatchAssignments] = useState<any[]>([]);
  const [batchSchedules, setBatchSchedules] = useState<any[]>([]);
  const [batchSubmissions, setBatchSubmissions] = useState<any[]>([]);
  const [batchGrades, setBatchGrades] = useState<any[]>([]);

  // Inline subject add
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ course_code: "", subject_name: "", semester: "", hours: "" });

  const fetchAll = async () => {
    setLoading(true);
    const [bRes, cRes, pRes, mRes, eRes, iRes, sRes] = await Promise.all([
      db.from("batches").select("*").order("created_at", { ascending: false }),
      db.from("courses").select("id, title, program_id"),
      db.from("categories").select("id, name, slug, total_semesters").order("name"),
      db.from("curriculum_modules").select("id, subject_name, course_code, semester, batch_id, hours, program_id").order("semester"),
      db.from("batch_enrollments").select("*"),
      db.from("user_roles").select("user_id").eq("role", "instructor"),
      db.from("user_roles").select("user_id").eq("role", "student"),
    ]);

    const instructorIds = (iRes.data || []).map((r: any) => r.user_id);
    const studentIds = (sRes.data || []).map((r: any) => r.user_id);
    const [instrProfiles, studProfiles] = await Promise.all([
      instructorIds.length
        ? db.from("profiles").select("user_id, display_name").in("user_id", instructorIds)
        : Promise.resolve({ data: [] }),
      studentIds.length
        ? db.from("profiles").select("user_id, display_name, enrollment_id, created_at").in("user_id", studentIds)
        : Promise.resolve({ data: [] }),
    ]);

    setBatches(bRes.data || []);
    setCourses(cRes.data || []);
    setPrograms(pRes.data || []);
    setModules(mRes.data || []);
    setAllEnrollments(eRes.data || []);
    setInstructors(instrProfiles.data || []);
    setStudents(studProfiles.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
  const instructorById = useMemo(() => new Map(instructors.map((i) => [i.user_id, i])), [instructors]);

  const getBatchProgramId = (b: any) => b.program_id || courseById.get(b.course_id)?.program_id || null;
  const getBatchModules = (b: any) => modules.filter((m) => m.batch_id === b.id);
  const getBatchEnrollmentCount = (id: string) => allEnrollments.filter((r) => r.batch_id === id).length;
  const getStudentName = (id: string) => students.find((s) => s.user_id === id)?.display_name || id.slice(0, 8);
  const getStudent = (id: string) => students.find((s) => s.user_id === id);
  const getCoursesForBatch = (b: any) => {
    const progId = getBatchProgramId(b);
    if (!progId || !b.semester) return [];
    return modules.filter((m) => m.program_id === progId && m.semester === b.semester);
  };

  const activeBatches = batches.filter(isActive);
  const pastBatches = batches.filter(isPast);

  const openCreate = () => {
    setEditBatch(null);
    setForm({ name: "", description: "", batch_code: "", program_id: "", course_id: "", instructor_id: "", semester: "", start_date: "", end_date: "", max_students: "", is_manually_active: true });
    setShowForm(true);
  };
  const openEdit = (b: any) => {
    setEditBatch(b);
    setForm({
      name: b.name || "",
      description: b.description || "",
      batch_code: b.batch_code || "",
      program_id: b.program_id || "",
      course_id: b.course_id || "",
      instructor_id: b.instructor_id || "",
      semester: b.semester ? String(b.semester) : "",
      start_date: b.start_date || "",
      end_date: b.end_date || "",
      max_students: b.max_students?.toString() || "",
      is_manually_active: b.is_manually_active ?? true,
    });
    setShowForm(true);
  };
  const saveBatch = async () => {
    const payload: any = {
      name: form.name,
      description: form.description || null,
      batch_code: form.batch_code || null,
      program_id: form.program_id || null,
      course_id: form.course_id || null,
      instructor_id: form.instructor_id || null,
      semester: form.semester ? parseInt(form.semester) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      max_students: form.max_students ? parseInt(form.max_students) : null,
      is_manually_active: form.is_manually_active,
      is_active: form.is_manually_active,
    };
    const { error } = editBatch ? await db.from("batches").update(payload).eq("id", editBatch.id) : await db.from("batches").insert(payload);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: editBatch ? "Batch updated" : "Batch created" });
    setShowForm(false);
    fetchAll();
  };
  const deleteBatch = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    const { error } = await db.from("batches").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Batch deleted" });
    fetchAll();
  };

  const toggleManualActive = async (b: any) => {
    const next = !(b.is_manually_active ?? b.is_active ?? true);
    const { error } = await db.from("batches").update({ is_manually_active: next, is_active: next }).eq("id", b.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: next ? "Batch activated" : "Batch deactivated" });
    if (showEnroll?.id === b.id) setShowEnroll({ ...showEnroll, is_manually_active: next, is_active: next });
    fetchAll();
  };

  const openManage = async (batch: any) => {
    setShowEnroll(batch);
    setSelectedStudent("");
    const [enrollRes, lcRes, asgRes, schedRes] = await Promise.all([
      db.from("batch_enrollments").select("*").eq("batch_id", batch.id),
      db.from("live_classes").select("*").eq("batch_id", batch.id).order("scheduled_at", { ascending: false }),
      db.from("assignments").select("*").eq("batch_id", batch.id).order("created_at", { ascending: false }),
      db.from("schedules").select("*").eq("batch_id", batch.id).order("start_time", { ascending: true }),
    ]);
    setEnrollments(enrollRes.data || []);
    setBatchLiveClasses(lcRes.data || []);
    setBatchAssignments(asgRes.data || []);
    setBatchSchedules(schedRes.data || []);
    const assignmentIds = (asgRes.data || []).map((a: any) => a.id);
    if (assignmentIds.length) {
      const { data: subs } = await db.from("assignment_submissions").select("*").in("assignment_id", assignmentIds);
      setBatchSubmissions(subs || []);
    } else setBatchSubmissions([]);
    const { data: grades } = await db.from("student_grades").select("*").eq("batch_id", batch.id);
    setBatchGrades(grades || []);
  };

  const enrollStudent = async () => {
    if (!selectedStudent || !showEnroll) return;
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await db.from("batch_enrollments").insert({ batch_id: showEnroll.id, student_id: selectedStudent, enrolled_by: auth.user?.id });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Student enrolled" });
    setSelectedStudent("");
    fetchAll();
    openManage(showEnroll);
  };
  const unenroll = async (id: string) => {
    const { error } = await db.from("batch_enrollments").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Student removed" });
    fetchAll();
    openManage(showEnroll);
  };

  const addSubject = async () => {
    if (!showEnroll) return;
    const progId = getBatchProgramId(showEnroll);
    const { error } = await db.from("curriculum_modules").insert({
      batch_id: showEnroll.id,
      program_id: progId,
      course_code: subjectForm.course_code,
      subject_name: subjectForm.subject_name,
      module_name: subjectForm.subject_name,
      semester: subjectForm.semester ? parseInt(subjectForm.semester) : (showEnroll.semester || 1),
      hours: subjectForm.hours ? parseInt(subjectForm.hours) : null,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Subject added" });
    setShowAddSubject(false);
    setSubjectForm({ course_code: "", subject_name: "", semester: "", hours: "" });
    fetchAll();
  };
  const deleteSubject = async (id: string) => {
    if (!confirm("Delete this subject from the batch?")) return;
    const { error } = await db.from("curriculum_modules").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Subject removed" });
    fetchAll();
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

  // ============== VIEW: STUDENTS ROSTER ==============
  if (view === "students" && viewStudentsBatchId) {
    const batch = batches.find((b) => b.id === viewStudentsBatchId);
    const roster = allEnrollments.filter((e) => e.batch_id === viewStudentsBatchId);
    return (
      <div className="space-y-6 pt-2">
        <Button variant="ghost" size="sm" onClick={() => setView(isPast(batch) ? "past" : "active")}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <h1 className="font-display text-brand-primary">Students — {batch?.name}</h1>
        <div className="overflow-x-auto rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3 text-left">Student Name</th><th className="p-3 text-left">Student ID</th><th className="p-3 text-left">Program</th><th className="p-3 text-left">Joined</th></tr>
            </thead>
            <tbody>
              {roster.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No students enrolled.</td></tr>}
              {roster.map((e) => {
                const s = getStudent(e.student_id);
                return (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-3 font-medium">{s?.display_name || e.student_id.slice(0, 8)}</td>
                    <td className="p-3 text-muted-foreground">{s?.enrollment_id || "—"}</td>
                    <td className="p-3 text-muted-foreground">{programById.get(getBatchProgramId(batch))?.name || "—"}</td>
                    <td className="p-3 text-muted-foreground">{e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============== VIEW: ACTIVE TABLE ==============
  if (view === "active") {
    const sorted = [...activeBatches].sort((a, b) => (a.semester || 99) - (b.semester || 99));
    return (
      <div className="space-y-6 pt-2">
        <Button variant="ghost" size="sm" onClick={() => setView("home")}><ArrowLeft className="h-4 w-4" /> Back to Batches</Button>
        <h1 className="font-display text-brand-primary">Active Batches</h1>
        <div className="overflow-x-auto rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Batch</th>
                <th className="p-3 text-left">Sem</th>
                <th className="p-3 text-left">Program</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Students</th>
                <th className="p-3 text-left">Courses</th>
                <th className="p-3 text-left">Faculty</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No active batches.</td></tr>}
              {sorted.map((b) => {
                const cnt = getBatchEnrollmentCount(b.id);
                const cs = getCoursesForBatch(b);
                const daysLeft = b.end_date ? Math.max(0, Math.ceil((new Date(b.end_date).getTime() - Date.now()) / 86400000)) : null;
                return (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3"><button onClick={() => openManage(b)} className="font-semibold text-primary hover:underline">{b.name}</button></td>
                    <td className="p-3">{b.semester || "—"}</td>
                    <td className="p-3 text-muted-foreground">{programById.get(getBatchProgramId(b))?.name || "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} → {b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}
                      {daysLeft !== null && <span className="ml-2 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{daysLeft}d left</span>}
                    </td>
                    <td className="p-3"><button onClick={() => { setViewStudentsBatchId(b.id); setView("students"); }} className="text-primary hover:underline">{cnt}</button></td>
                    <td className="p-3 text-xs text-muted-foreground">{cs.length ? cs.map((c) => c.course_code).join(", ") : "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{instructorById.get(b.instructor_id)?.display_name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============== VIEW: PAST TABLE ==============
  if (view === "past") {
    const sorted = [...pastBatches].sort((a, b) => new Date(b.end_date || 0).getTime() - new Date(a.end_date || 0).getTime());
    return (
      <div className="space-y-6 pt-2">
        <Button variant="ghost" size="sm" onClick={() => setView("home")}><ArrowLeft className="h-4 w-4" /> Back to Batches</Button>
        <h1 className="font-display text-brand-primary">Past Batches</h1>
        <div className="overflow-x-auto rounded-2xl bg-card shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3 text-left">Batch</th><th className="p-3 text-left">Program</th><th className="p-3 text-left">Duration</th><th className="p-3 text-left">Students</th></tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No past batches.</td></tr>}
              {sorted.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3"><button onClick={() => openManage(b)} className="font-semibold text-primary hover:underline">{b.name}</button></td>
                  <td className="p-3 text-muted-foreground">{programById.get(getBatchProgramId(b))?.name || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} → {b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}</td>
                  <td className="p-3"><button onClick={() => { setViewStudentsBatchId(b.id); setView("students"); }} className="text-primary hover:underline">{getBatchEnrollmentCount(b.id)}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderManageDialog()}
      </div>
    );
  }

  // ============== VIEW: PROGRAM DETAIL (semesters → batches) ==============
  if (view === "program" && viewProgramId) {
    const prog = programById.get(viewProgramId);
    const progBatches = batches.filter((b) => getBatchProgramId(b) === viewProgramId);
    const sems = prog?.total_semesters || 8;
    return (
      <div className="space-y-6 pt-2">
        <Button variant="ghost" size="sm" onClick={() => setView("home")}><ArrowLeft className="h-4 w-4" /> Back to Programs</Button>
        <h1 className="font-display text-brand-primary">{prog?.name}</h1>
        <div className="space-y-3">
          {Array.from({ length: sems }, (_, i) => i + 1).map((sem) => {
            const semBatches = progBatches.filter((b) => b.semester === sem);
            if (semBatches.length === 0) return null;
            return (
              <div key={sem} className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
                <h3 className="mb-3 font-display text-lg text-brand-primary">Semester {sem}</h3>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {semBatches.map((b) => (
                    <button key={b.id} onClick={() => openManage(b)} className="rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/50 hover:bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{b.name}</span>
                        <Badge variant={isActive(b) ? "default" : "secondary"} className="text-[10px]">{isActive(b) ? "Active" : isPast(b) ? "Past" : "Inactive"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{getBatchEnrollmentCount(b.id)} students · {instructorById.get(b.instructor_id)?.display_name || "No tutor"}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {progBatches.length === 0 && <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">No batches under this program yet.</div>}
        </div>
        {renderManageDialog()}
      </div>
    );
  }

  // ============== VIEW: HOME ==============
  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-brand-primary">Batch Management</h1>
          <div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" />
          <p className="mt-2 text-sm text-brand-warm-grey">Programs → Semesters → Batches.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> New Batch</Button>
      </motion.div>

      {/* Three clickable stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Batches", value: batches.length, icon: Layers, onClick: () => setView("active") },
          { label: "Active Batches", value: activeBatches.length, icon: GraduationCap, onClick: () => setView("active") },
          { label: "Past Batches", value: pastBatches.length, icon: Calendar, onClick: () => setView("past") },
        ].map((stat, i) => (
          <motion.button key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={stat.onClick} className="rounded-2xl bg-card p-5 text-left shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition hover:shadow-[0_4px_24px_hsl(var(--primary)/0.12)]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><stat.icon className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-display text-3xl text-brand-primary">{stat.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-warm-grey">{stat.label}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Program tiles */}
      <div>
        <h2 className="mb-3 font-display text-lg text-brand-primary">Programs</h2>
        {programs.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">No programs yet. Add programs from <Link to="/dashboard/admin/categories" className="text-primary underline">Categories</Link>.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {programs.map((p) => {
              const count = batches.filter((b) => getBatchProgramId(b) === p.id).length;
              return (
                <button key={p.id} onClick={() => { setViewProgramId(p.id); setView("program"); }} className="rounded-2xl bg-card p-5 text-left shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition hover:shadow-[0_4px_24px_hsl(var(--primary)/0.12)]">
                  <h3 className="font-display text-lg text-brand-primary">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{count} {count === 1 ? "batch" : "batches"} · {p.total_semesters || 8} semesters</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Search + classic grid (kept as quick access) */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search batches…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.filter((b) => !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.batch_code?.toLowerCase().includes(search.toLowerCase())).map((b) => {
          const cnt = getBatchEnrollmentCount(b.id);
          const tutor = instructorById.get(b.instructor_id);
          return (
            <div key={b.id} className="rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={isActive(b) ? "default" : "secondary"}>{isActive(b) ? "Active" : isPast(b) ? "Past" : "Inactive"}</Badge>
                    {b.batch_code && <Badge variant="outline">{b.batch_code}</Badge>}
                    {b.semester && <Badge variant="outline">Sem {b.semester}</Badge>}
                  </div>
                  <h2 className="font-display text-xl text-brand-primary">{b.name}</h2>
                  <p className="mt-1 text-sm text-brand-warm-grey">{programById.get(getBatchProgramId(b))?.name || "Program not linked"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteBatch(b.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-brand-warm-grey">
                <p className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-gold" /> {cnt} students · {tutor?.display_name || "No tutor"}</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-brand-gold" /> {b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"}</p>
              </div>
              <Button onClick={() => openManage(b)} variant="outline" className="mt-4 w-full gap-2"><Layers className="h-4 w-4" /> Manage Batch</Button>
            </div>
          );
        })}
      </div>

      {/* Create / Edit batch dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">{editBatch ? "Edit Batch" : "Create Batch"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Batch Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Batch Code"><Input value={form.batch_code} onChange={(e) => setForm({ ...form, batch_code: e.target.value })} /></Field>
            <Field label="Program *">
              <Select value={form.program_id} onValueChange={(program_id) => setForm({ ...form, program_id })}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Semester">
                <Select value={form.semester} onValueChange={(semester) => setForm({ ...form, semester })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: programById.get(form.program_id)?.total_semesters || 8 }, (_, i) => i + 1).map((n) => <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Faculty">
                <Select value={form.instructor_id} onValueChange={(instructor_id) => setForm({ ...form, instructor_id })}>
                  <SelectTrigger><SelectValue placeholder="Assign tutor" /></SelectTrigger>
                  <SelectContent>{instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || i.user_id.slice(0, 8)}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
              <Field label="End Date"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
            </div>
            <Field label="Max Students"><Input type="number" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} /></Field>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Manually toggle this batch on/off</p>
              </div>
              <Switch checked={form.is_manually_active} onCheckedChange={(is_manually_active) => setForm({ ...form, is_manually_active })} />
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={saveBatch} disabled={!form.name}>{editBatch ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {renderManageDialog()}
    </div>
  );

  // ============== MANAGE BATCH DIALOG (shared) ==============
  function renderManageDialog() {
    return (
      <Dialog open={!!showEnroll} onOpenChange={() => setShowEnroll(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-brand-primary">
              <Layers className="mr-2 inline h-5 w-5 text-brand-gold" />{showEnroll?.name}
            </DialogTitle>
            {showEnroll && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span> <Badge variant={isActive(showEnroll) ? "default" : "secondary"}>{isActive(showEnroll) ? "Active" : isPast(showEnroll) ? "Past" : "Inactive"}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Manually Active</span>
                  <Switch checked={showEnroll.is_manually_active ?? showEnroll.is_active ?? true} onCheckedChange={() => toggleManualActive(showEnroll)} />
                </div>
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="students">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl sm:grid-cols-6">
              <TabsTrigger value="students" className="text-xs">Students ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="subjects" className="text-xs">Subjects ({showEnroll ? getBatchModules(showEnroll).length : 0})</TabsTrigger>
              <TabsTrigger value="timetable" className="text-xs">Timetable ({batchSchedules.length})</TabsTrigger>
              <TabsTrigger value="live" className="text-xs">Live ({batchLiveClasses.filter((l) => l.class_type !== "offline").length})</TabsTrigger>
              <TabsTrigger value="assignments" className="text-xs">Assignments</TabsTrigger>
              <TabsTrigger value="grades" className="text-xs">Grades</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select student to add" /></SelectTrigger>
                  <SelectContent>{students.filter((s) => !enrollments.some((e) => e.student_id === s.user_id)).map((s) => <SelectItem key={s.user_id} value={s.user_id}>{s.display_name || s.user_id.slice(0, 8)} {s.enrollment_id ? `(${s.enrollment_id})` : ""}</SelectItem>)}</SelectContent>
                </Select>
                {selectedStudent && <Button size="icon" variant="ghost" onClick={() => setSelectedStudent("")} title="Clear selection"><X className="h-4 w-4" /></Button>}
                <Button onClick={enrollStudent} disabled={!selectedStudent} className="gap-2"><UserPlus className="h-4 w-4" /> Add</Button>
              </div>
              {enrollments.length === 0 ? <EmptyState icon={Users} label="No students enrolled yet" /> : enrollments.map((e) => <Row key={e.id} title={getStudentName(e.student_id)} meta={getStudent(e.student_id)?.enrollment_id || "Student"} action={<Button size="icon" variant="ghost" onClick={() => unenroll(e.id)} className="text-destructive" title="Remove"><X className="h-4 w-4" /></Button>} />)}
            </TabsContent>

            <TabsContent value="subjects" className="mt-4 space-y-2">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowAddSubject(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Subject</Button>
              </div>
              {showEnroll && getBatchModules(showEnroll).length === 0 ? <EmptyState icon={BookOpen} label="No subjects linked to this batch" /> : showEnroll && getBatchModules(showEnroll).map((m) => (
                <Row key={m.id} title={`${m.course_code} · ${m.subject_name}`} meta={`Semester ${m.semester}${m.hours ? ` · ${m.hours} hours` : ""}`} action={<Button size="icon" variant="ghost" onClick={() => deleteSubject(m.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>} />
              ))}
            </TabsContent>

            <TabsContent value="timetable" className="mt-4 space-y-2">
              <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">Read-only view. Edit slots from the Timetable page.</p>
              {batchSchedules.length === 0 ? <EmptyState icon={Calendar} label="No timetable slots for this batch" /> : batchSchedules.map((s) => <Row key={s.id} title={s.event_title} meta={`${new Date(s.start_time).toLocaleString()} · ${s.location || s.event_type}`} />)}
            </TabsContent>

            <TabsContent value="live" className="mt-4 space-y-2">
              <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">Online live classes only — offline sessions appear in the Timetable.</p>
              {(() => {
                const online = batchLiveClasses.filter((l) => l.class_type !== "offline");
                if (online.length === 0) return <EmptyState icon={Video} label="No online live classes for this batch" />;
                return online.map((l) => (
                  <Link key={l.id} to="/dashboard/admin/live-classes" className="block">
                    <Row title={l.title} meta={new Date(l.scheduled_at).toLocaleString()} action={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
                  </Link>
                ));
              })()}
            </TabsContent>

            <TabsContent value="assignments" className="mt-4 space-y-3">
              {(() => {
                const inProgress = batchAssignments.filter((a) => !a.due_date || new Date(a.due_date) >= new Date()).sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime());
                const past = batchAssignments.filter((a) => a.due_date && new Date(a.due_date) < new Date()).sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
                return (
                  <>
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">In Progress</h4>
                      {inProgress.length === 0 ? <EmptyState icon={ClipboardList} label="No assignments in progress" /> : inProgress.map((a) => <Row key={a.id} title={a.title} meta={a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : "No due date"} />)}
                    </div>
                    <div>
                      <h4 className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Past</h4>
                      {past.length === 0 ? <EmptyState icon={ClipboardList} label="No past assignments" /> : past.map((a) => <Row key={a.id} title={a.title} meta={`Due ${new Date(a.due_date).toLocaleDateString()} · ${batchSubmissions.filter((s) => s.assignment_id === a.id).length} submissions`} />)}
                    </div>
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="grades" className="mt-4 space-y-2">
              {(() => {
                const gradedAssignmentIds = new Set(batchSubmissions.filter((s) => s.grade != null).map((s) => s.assignment_id));
                const graded = batchAssignments.filter((a) => gradedAssignmentIds.has(a.id));
                if (graded.length === 0) return <EmptyState icon={GraduationCap} label="Grades will appear here once you grade submissions" />;
                return (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-2 text-left">Student</th><th className="p-2 text-left">Assignment</th><th className="p-2 text-right">Grade</th></tr></thead>
                      <tbody>
                        {graded.flatMap((a) => batchSubmissions.filter((s) => s.assignment_id === a.id && s.grade != null).map((s) => (
                          <tr key={s.id} className="border-t border-border"><td className="p-2">{getStudentName(s.student_id)}</td><td className="p-2 text-xs text-muted-foreground">{a.title}</td><td className="p-2 text-right font-semibold">{s.grade}</td></tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>

          {/* Inline Add Subject */}
          <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader><DialogTitle>Add Subject to Batch</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Field label="Course Code *"><Input value={subjectForm.course_code} onChange={(e) => setSubjectForm({ ...subjectForm, course_code: e.target.value })} /></Field>
                <Field label="Subject Name *"><Input value={subjectForm.subject_name} onChange={(e) => setSubjectForm({ ...subjectForm, subject_name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Semester"><Input type="number" value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })} placeholder={String(showEnroll?.semester || 1)} /></Field>
                  <Field label="Hours"><Input type="number" value={subjectForm.hours} onChange={(e) => setSubjectForm({ ...subjectForm, hours: e.target.value })} /></Field>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button><Button onClick={addSubject} disabled={!subjectForm.course_code || !subjectForm.subject_name}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    );
  }
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">{label}</label>{children}</div>
);
const EmptyState = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="rounded-xl bg-muted/50 py-8 text-center text-sm text-muted-foreground"><Icon className="mx-auto mb-3 h-6 w-6" />{label}</div>
);
const Row = ({ title, meta, action }: { title: string; meta?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
    <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{title}</p>{meta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>}</div>
    {action}
  </div>
);

export default AdminBatches;
