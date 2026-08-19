import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, BookCheck, GraduationCap, Layers, Save, Search, Settings2, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import FacultyTypesDialog from "@/components/admin/FacultyTypesDialog";
import { fetchFacultyTypes, type FacultyType } from "@/components/admin/FacultyTypeSelect";
import DesignationsDialog from "@/components/admin/DesignationsDialog";
import { fetchDesignations, type Designation } from "@/components/admin/DesignationSelect";

const db = supabase as any;

const AdminTeachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [subjectTeacher, setSubjectTeacher] = useState<any>(null);
  const [batchTeacher, setBatchTeacher] = useState<any>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [showTeachersList, setShowTeachersList] = useState(true);
  const [facultyTypes, setFacultyTypes] = useState<FacultyType[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [typesOpen, setTypesOpen] = useState(false);
  const [designationList, setDesignationList] = useState<Designation[]>([]);
  const [designationsOpen, setDesignationsOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: roles }, { data: batchData }, { data: moduleData }, { data: allocationData }, { data: courseData }] = await Promise.all([
      db.from("user_roles").select("user_id").eq("role", "instructor"),
      db.from("batches").select("id, name, batch_code, instructor_id"),
      db.from("curriculum_modules").select("id, subject_name, course_code, semester").order("semester"),
      db.from("subject_allocations").select("*"),
      db.from("courses").select("id, title"),
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
    setCourses(courseData || []);
    setFacultyTypes(await fetchFacultyTypes());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // "All Programs" — pulled dynamically from instructor specialization or department
  const programs = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.specialization) set.add(t.specialization);
      else if (t.department) set.add(t.department);
    });
    return [...set].sort();
  }, [teachers]);
  const designations = useMemo(
    () => [...new Set([...designationList.filter((d) => d.is_active).map((d) => d.name), ...teachers.map((t) => t.designation).filter(Boolean)])],
    [teachers, designationList],
  );

  // Duplicate course-name detection (case-insensitive)
  const duplicateCourseTitles = useMemo(() => {
    const counts: Record<string, number> = {};
    courses.forEach((c) => {
      const k = (c.title || "").trim().toLowerCase();
      if (!k) return;
      counts[k] = (counts[k] || 0) + 1;
    });
    return new Set(Object.entries(counts).filter(([, n]) => n > 1).map(([k]) => k));
  }, [courses]);

  const filtered = teachers.filter((teacher) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || [teacher.display_name, teacher.employee_id, teacher.department, teacher.designation, teacher.specialization].some((value) => (value || "").toLowerCase().includes(query));
    const teacherProgram = teacher.specialization || teacher.department;
    const matchesProgram = programFilter === "all" || teacherProgram === programFilter;
    const matchesDesignation = designationFilter === "all" || teacher.designation === designationFilter;
    const matchesType = typeFilter === "all" || (teacher.instructor_type || "regular") === typeFilter;
    return matchesSearch && matchesProgram && matchesDesignation && matchesType;
  });

  const getTeacherSubjects = (userId: string) => allocations.filter((a) => a.instructor_id === userId).map((a) => modules.find((m) => m.id === a.curriculum_module_id)).filter(Boolean);
  const getTeacherBatches = (userId: string) => batches.filter((batch) => batch.instructor_id === userId);

  // For each module a teacher would be assigned: who else (in same semester) is on it?
  const getCoInstructorsForModule = (moduleId: string, excludeUserId?: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return [];
    return allocations
      .filter((a) => a.curriculum_module_id === moduleId && a.semester === mod.semester && a.instructor_id !== excludeUserId)
      .map((a) => teachers.find((t) => t.user_id === a.instructor_id))
      .filter(Boolean);
  };

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

  const tiles = [
    { key: "teachers", label: "Teachers", value: teachers.length, icon: GraduationCap, onClick: () => setShowTeachersList((v) => !v) },
    { key: "programs", label: "Programs", value: programs.length, icon: BookCheck, onClick: () => navigate("/dashboard/admin/curriculum") },
    { key: "batches", label: "Batches", value: batches.length, icon: Layers, onClick: () => navigate("/dashboard/admin/batches") },
  ];

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-brand-primary"><GraduationCap className="h-5 w-5 text-primary-foreground" /></div>
          <div><h1 className="font-display text-brand-primary">Subject Allocation</h1><div className="mt-1 h-0.5 w-12 bg-gradient-to-r from-brand-gold to-transparent" /></div>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-warm-grey">Allocate subjects to teachers, balance load across semesters, and link batches.</p>
          <Button variant="outline" size="sm" onClick={() => setTypesOpen(true)}><Settings2 className="h-4 w-4" /> Manage Faculty Types</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((item) => (
          <button key={item.key} onClick={item.onClick} className="flex items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition hover:shadow-[0_4px_24px_hsl(var(--primary)/0.12)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20"><item.icon className="h-5 w-5 text-accent" /></div>
            <div><p className="font-display text-2xl text-brand-primary">{item.value}</p><p className="text-[11px] font-bold uppercase tracking-widest text-brand-warm-grey">{item.label}</p></div>
          </button>
        ))}
      </div>

      {duplicateCourseTitles.size > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Duplicate course names detected</p>
            <p className="mt-1 text-xs">{duplicateCourseTitles.size} course title(s) appear more than once. New courses with these exact names will be blocked at save time. Please review and merge duplicates in the Courses page.</p>
          </div>
        </div>
      )}

      {showTeachersList && (
        <>
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] lg:flex-row lg:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-warm-grey" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, employee ID, program..." className="pl-10" /></div>
            <Select value={programFilter} onValueChange={setProgramFilter}><SelectTrigger className="lg:w-52"><SelectValue placeholder="Program" /></SelectTrigger><SelectContent><SelectItem value="all">All Programs</SelectItem>{programs.map((program) => <SelectItem key={program} value={program}>{program}</SelectItem>)}</SelectContent></Select>
            <Select value={designationFilter} onValueChange={setDesignationFilter}><SelectTrigger className="lg:w-52"><SelectValue placeholder="Designation" /></SelectTrigger><SelectContent><SelectItem value="all">All Designations</SelectItem>{designations.map((designation) => <SelectItem key={designation} value={designation}>{designation}</SelectItem>)}</SelectContent></Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="lg:w-52"><SelectValue placeholder="Faculty Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Faculty Types</SelectItem>{facultyTypes.map((t) => <SelectItem key={t.id} value={t.slug}>{t.name}</SelectItem>)}</SelectContent></Select>
          </div>

          {loading ? <div className="py-16 text-center text-brand-warm-grey">Loading teachers…</div> : filtered.length === 0 ? <div className="rounded-2xl bg-card py-16 text-center text-brand-warm-grey shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">No teachers found.</div> : (
            <div className="space-y-3">
              {filtered.map((teacher, index) => {
                const subjects = getTeacherSubjects(teacher.user_id);
                const teacherBatches = getTeacherBatches(teacher.user_id);
                return (
                  <motion.div key={teacher.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-brand-primary">{(teacher.display_name || "T")[0].toUpperCase()}</div>
                        <div>
                          <h3 className="font-display text-lg text-brand-primary">{teacher.display_name || "Unnamed Teacher"}</h3>
                          <p className="text-sm text-brand-warm-grey">{teacher.employee_id || "No employee ID"} · {teacher.specialization || teacher.department || "No program"} · {teacher.designation || "No designation"} · {facultyTypes.find((t) => t.slug === (teacher.instructor_type || "regular"))?.name || "Regular Staff"}</p>
                          <div className="mt-2 space-y-1">
                            {subjects.slice(0, 6).map((subject: any) => {
                              const co = getCoInstructorsForModule(subject.id, teacher.user_id);
                              return (
                                <div key={subject.id} className="flex flex-wrap items-center gap-1.5">
                                  <Badge className="border-0 bg-brand-cream text-brand-primary">{subject.course_code} · {subject.subject_name}</Badge>
                                  {co.length > 0 && <span className="text-[11px] text-brand-warm-grey">also taught by: {co.map((p: any) => p.display_name).filter(Boolean).join(", ")}</span>}
                                </div>
                              );
                            })}
                            {subjects.length > 6 && <Badge className="border-0 bg-muted text-muted-foreground">+{subjects.length - 6}</Badge>}
                            {subjects.length === 0 && <span className="text-xs italic text-brand-warm-grey">No subjects assigned</span>}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">{teacherBatches.map((batch) => <Badge key={batch.id} className="border-0 bg-secondary text-secondary-foreground">{batch.batch_code || batch.name}</Badge>)}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openSubjectDialog(teacher)}><BookCheck className="h-4 w-4" /> Assign Subjects</Button>
                        <Button variant="outline" size="sm" onClick={() => { setBatchTeacher(teacher); setSelectedBatch(""); }}><UserPlus className="h-4 w-4" /> Assign Batch</Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={!!subjectTeacher} onOpenChange={() => setSubjectTeacher(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Assign Subjects — {subjectTeacher?.display_name}</DialogTitle></DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {modules.map((mod) => {
              const co = getCoInstructorsForModule(mod.id, subjectTeacher?.user_id);
              return (
                <label key={mod.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-cream p-3">
                  <Checkbox checked={selectedSubjects.includes(mod.id)} onCheckedChange={(checked) => setSelectedSubjects((prev) => checked ? [...prev, mod.id] : prev.filter((id) => id !== mod.id))} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-brand-primary">{mod.subject_name}</span>
                    <span className="block text-xs text-brand-warm-grey">{mod.course_code} · Semester {mod.semester}</span>
                    {co.length > 0 && <span className="mt-1 block text-[11px] text-amber-700">Assigned to: {co.map((p: any) => p.display_name).filter(Boolean).join(", ")}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          <Button onClick={saveSubjects} className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Save className="h-4 w-4" /> Save Subjects</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!batchTeacher} onOpenChange={() => setBatchTeacher(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display text-brand-primary">Assign Batch — {batchTeacher?.display_name}</DialogTitle></DialogHeader>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.name} {batch.batch_code ? `(${batch.batch_code})` : ""}</SelectItem>)}</SelectContent></Select>
          <Button onClick={saveBatch} disabled={!selectedBatch} className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-dark"><Users className="h-4 w-4" /> Assign Batch</Button>
        </DialogContent>
      </Dialog>
      <FacultyTypesDialog open={typesOpen} onOpenChange={setTypesOpen} onChanged={fetchAll} />
    </div>
  );
};

export default AdminTeachers;
