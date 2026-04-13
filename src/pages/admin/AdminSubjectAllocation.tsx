import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface Allocation { id: string; instructor_id: string; curriculum_module_id: string; semester: number; academic_year: string; instructor_name?: string; module_name?: string; subject_name?: string; course_code?: string; }

const AdminSubjectAllocation = () => {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [instructors, setInstructors] = useState<{ user_id: string; display_name: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; module_name: string; subject_name: string; course_code: string; semester: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [instructorId, setInstructorId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  const fetchAll = async () => {
    const [{ data: allocs }, { data: instrRoles }, { data: mods }] = await Promise.all([
      supabase.from("subject_allocations").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("curriculum_modules").select("id, module_name, subject_name, course_code, semester").order("semester").order("sort_order"),
    ]);
    const instrIds = (instrRoles || []).map((r) => r.user_id);
    let instrProfiles: { user_id: string; display_name: string }[] = [];
    if (instrIds.length > 0) { const { data } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instrIds); instrProfiles = data || []; }
    setInstructors(instrProfiles);
    const profileMap = Object.fromEntries(instrProfiles.map((p) => [p.user_id, p.display_name || "Unnamed"]));
    const moduleMap = Object.fromEntries((mods || []).map((m) => [m.id, m]));
    setAllocations((allocs || []).map((a) => ({ ...a, instructor_name: profileMap[a.instructor_id] || "Unknown", module_name: moduleMap[a.curriculum_module_id]?.module_name || "Unknown", subject_name: moduleMap[a.curriculum_module_id]?.subject_name || "", course_code: moduleMap[a.curriculum_module_id]?.course_code || "" })));
    setModules(mods || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!instructorId || !moduleId) { toast({ title: "Please select both educator and module", variant: "destructive" }); return; }
    const selectedModule = modules.find((m) => m.id === moduleId);
    const { error } = await supabase.from("subject_allocations").insert({ instructor_id: instructorId, curriculum_module_id: moduleId, semester: selectedModule?.semester || 1, academic_year: academicYear });
    if (error) { toast({ title: "Failed to create allocation", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Subject allocated successfully" }); logActivity("allocation.created", "subject_allocation", undefined, { instructor_id: instructorId, module: selectedModule?.module_name }); setDialogOpen(false); setInstructorId(""); setModuleId(""); fetchAll(); }
  };

  const handleDelete = async (id: string) => { await supabase.from("subject_allocations").delete().eq("id", id); logActivity("allocation.deleted", "subject_allocation", id); toast({ title: "Allocation removed" }); fetchAll(); };

  if (loading) return <div className="flex justify-center py-20"><div className="h-10 w-10 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">Subject Allocation</h1>
          <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          <p className="text-sm text-[#8C7B6B] mt-2">Assign curriculum subjects to educators</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl"><Plus className="h-4 w-4" /> Assign Subject</Button></DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl border-[#EDE3CC]">
            <DialogHeader><DialogTitle className="font-serif text-xl text-[#7D1E24]">Assign Subject to Educator</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Educator *</label><Select value={instructorId} onValueChange={setInstructorId}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Select educator" /></SelectTrigger><SelectContent>{instructors.map((i) => <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Unnamed"}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Curriculum Module *</label><Select value={moduleId} onValueChange={setModuleId}><SelectTrigger className="border-[#EDE3CC] rounded-xl"><SelectValue placeholder="Select module" /></SelectTrigger><SelectContent>{modules.map((m) => <SelectItem key={m.id} value={m.id}>Sem {m.semester} — {m.subject_name} → {m.module_name}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold mb-1 block">Academic Year</label><Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="border-[#EDE3CC] rounded-xl" /></div>
              <Button onClick={handleCreate} className="w-full bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl">Assign Subject</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {allocations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5E9CE] flex items-center justify-center mx-auto mb-4"><BookOpen className="h-7 w-7 text-[#C49A3C]" /></div>
          <h3 className="font-serif text-xl text-[#7D1E24]">No Allocations Yet</h3>
          <p className="text-sm text-[#8C7B6B] mt-1">Assign curriculum subjects to educators to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#5C1219] hover:bg-[#5C1219]">
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Educator</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Subject</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Module</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Semester</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Year</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((a, i) => (
                <TableRow key={a.id} className={`${i % 2 === 1 ? "bg-[#FAF6EE]" : "bg-white"} hover:bg-[#FAF6EE] transition-colors border-b border-[#EDE3CC]`}>
                  <TableCell className="font-medium text-[#3D2E22]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#F5E9CE] flex items-center justify-center"><GraduationCap className="h-3.5 w-3.5 text-[#7D1E24]" /></div>
                      {a.instructor_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#3D2E22]">{a.subject_name} <span className="text-[#8C7B6B]">({a.course_code})</span></TableCell>
                  <TableCell className="text-[#8C7B6B]">{a.module_name}</TableCell>
                  <TableCell className="text-[#3D2E22]">{a.semester}</TableCell>
                  <TableCell className="text-[#3D2E22]">{a.academic_year}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectAllocation;
