import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookCheck, GraduationCap, Layers, Save, Search, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

const db = supabase as any;

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [subjectTeacher, setSubjectTeacher] = useState<any>(null);
  const [batchTeacher, setBatchTeacher] = useState<any>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: roles }, { data: batchData }, { data: moduleData }, { data: allocationData }] = await Promise.all([
      db.from("user_roles").select("user_id").eq("role", "instructor"),
      db.from("batches").select("id, name, batch_code, instructor_id"),
      db.from("curriculum_modules").select("id, subject_name, course_code, semester").order("semester"),
      db.from("subject_allocations").select("*"),
    ]);
    const ids = (roles || []).map((r: any) => r.user_id);
    if (ids.length) {
      const { data: profiles } = await db.from("profiles").select("*").in("user_id", ids).order("display_name");
      setTeachers(profiles || []);
    } else {
      setTeachers([]);
    }
    setBatches(batchData || []);
    setModules(moduleData || []);
    setAllocations(allocationData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const departments = useMemo(() => [...new Set(teachers.map((t) => t.department).filter(Boolean))], [teachers]);
  const designations = useMemo(() => [...new Set(teachers.map((t) => t.designation).filter(Boolean))], [teachers]);

  const filtered = teachers.filter((teacher) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || [teacher.display_name, teacher.employee_id, teacher.department, teacher.designation].some((value) => (value || "").toLowerCase().includes(query));
    const matchesDepartment = departmentFilter === "all" || teacher.department === departmentFilter;
    const matchesDesignation = designationFilter === "all" || teacher.designation === designationFilter;
    return matchesSearch && matchesDepartment && matchesDesignation;
  });

  const getTeacherSubjects = (userId: string) => allocations.filter((a) => a.instructor_id === userId).map((a) => modules.find((m) => m.id === a.curriculum_module_id)).filter(Boolean);
  const getTeacherBatches = (userId: string) => batches.filter((batch) => batch.instructor_id === userId);

  const openSubjectDialog = (teacher: any) => {
    setSubjectTeacher(teacher);
    setSelectedSubjects(allocations.filter((a) => a.instructor_id === teacher.user_id).map((a) => a.curriculum_module_id));
  };

  const saveSubjects = async () => {
    if (!subjectTeacher) return;
    const existing = allocations.filter((a) => a.instructor_id === subjectTeacher.user_id);
    const toAdd = selectedSubjects.filter((id) => !existing.some((a) => a.curriculum_module_id === id));
    const toRemove = existing.filter((a) => !selectedSubjects.includes(a.curriculum_module_id)).map((a) => a.id);
    if (toRemove.length) {
      const { error } = await db.from("subject_allocations").delete().in("id", toRemove);
      if (error) return toast.error(error.message);
    }
    if (toAdd.length) {
      const rows = toAdd.map((curriculum_module_id) => {
        const mod = modules.find((m) => m.id === curriculum_module_id);
        return { instructor_id: subjectTeacher.user_id, curriculum_module_id, semester: mod?.semester || 1, academic_year: new Date().getFullYear().toString() };
      });
      const { error } = await db.from("subject_allocations").insert(rows);
      if (error) return toast.error(error.message);
    }
    logActivity("teacher.subjects_assigned", "profile", subjectTeacher.user_id, { count: selectedSubjects.length });
    toast.success("Teacher subjects updated");
    setSubjectTeacher(null);
    fetchAll();
  };

  const saveBatch = async () => {
    if (!batchTeacher || !selectedBatch) return;
    const { error } = await db.from("batches").update({ instructor_id: batchTeacher.user_id }).eq("id", selectedBatch);
    if (error) return toast.error(error.message);
    logActivity("teacher.batch_assigned", "batch", selectedBatch, { teacher: batchTeacher.user_id });
    toast.success("Batch assigned to teacher");
    setBatchTeacher(null);
    setSelectedBatch("");
    fetchAll();
  };

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-brand-primary"><GraduationCap className="h-5 w-5 text-primary-foreground" /></div>
          <div><h1 className="font-display text-brand-primary">Teachers</h1><div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" /></div>
        </div>
        <p className="mt-2 text-sm text-brand-warm-grey">Manage teacher subject allocations, linked batches, departments and designations.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[{ label: "Teachers", value: teachers.length, icon: GraduationCap }, { label: "Assigned Subjects", value: allocations.length, icon: BookCheck }, { label: "Linked Batches", value: batches.filter((b) => b.instructor_id).length, icon: Layers }].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20"><item.icon className="h-5 w-5 text-accent" /></div><div><p className="font-display text-2xl text-brand-primary">{item.value}</p><p className="text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">{item.label}</p></div></div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-warm-grey" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, employee ID, department..." className="pl-10" /></div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}><SelectTrigger className="lg:w-52"><SelectValue placeholder="Department" /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent></Select>
        <Select value={designationFilter} onValueChange={setDesignationFilter}><SelectTrigger className="lg:w-52"><SelectValue placeholder="Designation" /></SelectTrigger><SelectContent><SelectItem value="all">All Designations</SelectItem>{designations.map((designation) => <SelectItem key={designation} value={designation}>{designation}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="py-16 text-center text-brand-warm-grey">Loading teachers…</div> : filtered.length === 0 ? <div className="rounded-2xl bg-card py-16 text-center text-brand-warm-grey shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">No teachers found.</div> : (
        <div className="space-y-3">
          {filtered.map((teacher, index) => {
            const subjects = getTeacherSubjects(teacher.user_id);
            const teacherBatches = getTeacherBatches(teacher.user_id);
            return <motion.div key={teacher.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-brand-primary">{(teacher.display_name || "T")[0].toUpperCase()}</div><div><h3 className="font-display text-lg text-brand-primary">{teacher.display_name || "Unnamed Teacher"}</h3><p className="text-sm text-brand-warm-grey">{teacher.employee_id || "No employee ID"} · {teacher.department || "No department"} · {teacher.designation || "No designation"}</p><div className="mt-2 flex flex-wrap gap-1.5">{subjects.slice(0, 4).map((subject: any) => <Badge key={subject.id} className="border-0 bg-brand-cream text-brand-primary">{subject.course_code} · {subject.subject_name}</Badge>)}{subjects.length > 4 && <Badge className="border-0 bg-muted text-muted-foreground">+{subjects.length - 4}</Badge>}{subjects.length === 0 && <span className="text-xs italic text-brand-warm-grey">No subjects assigned</span>}</div><div className="mt-2 flex flex-wrap gap-1.5">{teacherBatches.map((batch) => <Badge key={batch.id} className="border-0 bg-secondary text-secondary-foreground">{batch.batch_code || batch.name}</Badge>)}</div></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openSubjectDialog(teacher)}><BookCheck className="h-4 w-4" /> Assign Subjects</Button><Button variant="outline" size="sm" onClick={() => { setBatchTeacher(teacher); setSelectedBatch(""); }}><UserPlus className="h-4 w-4" /> Assign Batch</Button></div></div></motion.div>;
          })}
        </div>
      )}

      <Dialog open={!!subjectTeacher} onOpenChange={() => setSubjectTeacher(null)}><DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle className="font-display text-brand-primary">Assign Subjects — {subjectTeacher?.display_name}</DialogTitle></DialogHeader><div className="grid gap-2 sm:grid-cols-2">{modules.map((mod) => <label key={mod.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-cream p-3"><Checkbox checked={selectedSubjects.includes(mod.id)} onCheckedChange={(checked) => setSelectedSubjects((prev) => checked ? [...prev, mod.id] : prev.filter((id) => id !== mod.id))} /><span><span className="block text-sm font-semibold text-brand-primary">{mod.subject_name}</span><span className="text-xs text-brand-warm-grey">{mod.course_code} · Semester {mod.semester}</span></span></label>)}</div><Button onClick={saveSubjects} className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Save className="h-4 w-4" /> Save Subjects</Button></DialogContent></Dialog>

      <Dialog open={!!batchTeacher} onOpenChange={() => setBatchTeacher(null)}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle className="font-display text-brand-primary">Assign Batch — {batchTeacher?.display_name}</DialogTitle></DialogHeader><Select value={selectedBatch} onValueChange={setSelectedBatch}><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.name} {batch.batch_code ? `(${batch.batch_code})` : ""}</SelectItem>)}</SelectContent></Select><Button onClick={saveBatch} disabled={!selectedBatch} className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Users className="h-4 w-4" /> Assign Batch</Button></DialogContent></Dialog>
    </div>
  );
};

export default AdminTeachers;
