import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";

interface Allocation {
  id: string;
  instructor_id: string;
  curriculum_module_id: string;
  semester: number;
  academic_year: string;
  instructor_name?: string;
  module_name?: string;
  subject_name?: string;
  course_code?: string;
}

const AdminSubjectAllocation = () => {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [instructors, setInstructors] = useState<{ user_id: string; display_name: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; module_name: string; subject_name: string; course_code: string; semester: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [instructorId, setInstructorId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  const fetchAll = async () => {
    const [{ data: allocs }, { data: instrRoles }, { data: mods }] = await Promise.all([
      supabase.from("subject_allocations").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "instructor"),
      supabase.from("curriculum_modules").select("id, module_name, subject_name, course_code, semester").order("semester").order("sort_order"),
    ]);

    // Fetch instructor names
    const instrIds = (instrRoles || []).map((r) => r.user_id);
    let instrProfiles: { user_id: string; display_name: string }[] = [];
    if (instrIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name").in("user_id", instrIds);
      instrProfiles = data || [];
    }
    setInstructors(instrProfiles);

    const profileMap = Object.fromEntries(instrProfiles.map((p) => [p.user_id, p.display_name || "Unnamed"]));
    const moduleMap = Object.fromEntries((mods || []).map((m) => [m.id, m]));

    setAllocations(
      (allocs || []).map((a) => ({
        ...a,
        instructor_name: profileMap[a.instructor_id] || "Unknown",
        module_name: moduleMap[a.curriculum_module_id]?.module_name || "Unknown",
        subject_name: moduleMap[a.curriculum_module_id]?.subject_name || "",
        course_code: moduleMap[a.curriculum_module_id]?.course_code || "",
      }))
    );
    setModules(mods || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!instructorId || !moduleId) {
      toast({ title: "Please select both instructor and module", variant: "destructive" });
      return;
    }

    const selectedModule = modules.find((m) => m.id === moduleId);
    const { error } = await supabase.from("subject_allocations").insert({
      instructor_id: instructorId,
      curriculum_module_id: moduleId,
      semester: selectedModule?.semester || 1,
      academic_year: academicYear,
    });

    if (error) {
      toast({ title: "Failed to create allocation", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subject allocated successfully" });
      logActivity("allocation.created", "subject_allocation", undefined, {
        instructor_id: instructorId,
        module: selectedModule?.module_name,
      });
      setDialogOpen(false);
      setInstructorId(""); setModuleId("");
      fetchAll();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("subject_allocations").delete().eq("id", id);
    logActivity("allocation.deleted", "subject_allocation", id);
    toast({ title: "Allocation removed" });
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Subject Allocation</h1>
          <p className="text-muted-foreground mt-1 text-sm">Assign curriculum subjects to educators</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Assign Subject</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Subject to Educator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Educator *</label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger><SelectValue placeholder="Select educator" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.user_id} value={i.user_id}>{i.display_name || "Unnamed"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Curriculum Module *</label>
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        Sem {m.semester} — {m.subject_name} → {m.module_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Academic Year</label>
                <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2025" />
              </div>
              <Button onClick={handleCreate} className="w-full">Assign Subject</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {allocations.length === 0 ? (
        <Card className="text-center p-12 border-0 shadow-md">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-xl text-foreground">No allocations yet</h3>
          <p className="text-muted-foreground mt-2">Assign curriculum subjects to educators to get started</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Educator</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.instructor_name}</TableCell>
                  <TableCell>{a.subject_name} ({a.course_code})</TableCell>
                  <TableCell className="text-muted-foreground">{a.module_name}</TableCell>
                  <TableCell>{a.semester}</TableCell>
                  <TableCell>{a.academic_year}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AdminSubjectAllocation;
