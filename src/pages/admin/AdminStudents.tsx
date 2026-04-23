import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  GraduationCap,
  UserCog,
  FileSpreadsheet,
  FileText,
  Users,
  BookOpen,
  Video,
  Save,
  UserPlus,
  CheckCircle2,
  Clock3,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type AppRole = "super_admin" | "admin" | "student" | "instructor";

type Batch = {
  id: string;
  name: string;
  batch_code: string | null;
  course_id: string | null;
  is_active: boolean | null;
};

type BatchEnrollment = {
  id: string;
  batch_id: string;
  student_id: string;
  enrolled_at: string | null;
};

const AdminStudents = () => {
  const { role: currentUserRole } = useAuth();
  const isSuperAdmin = currentUserRole === "super_admin";

  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchEnrollments, setBatchEnrollments] = useState<BatchEnrollment[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("student");
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigningBatch, setAssigningBatch] = useState(false);

  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [zoomLink, setZoomLink] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [savingLinks, setSavingLinks] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, enrollRes, batchesRes, batchEnrollRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("enrollments").select("user_id"),
      supabase.from("batches").select("id, name, batch_code, course_id, is_active").order("name", { ascending: true }),
      supabase.from("batch_enrollments").select("id, batch_id, student_id, enrolled_at"),
    ]);

    setProfiles(profilesRes.data || []);
    const roleMap: Record<string, AppRole> = {};
    (rolesRes.data || []).forEach((r) => {
      roleMap[r.user_id] = r.role as AppRole;
    });
    setRoles(roleMap);

    const countMap: Record<string, number> = {};
    (enrollRes.data || []).forEach((e) => {
      countMap[e.user_id] = (countMap[e.user_id] || 0) + 1;
    });
    setEnrollCounts(countMap);
    setBatches(batchesRes.data || []);
    setBatchEnrollments(batchEnrollRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const batchById = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);

  const getStudentBatchIds = (userId: string) => batchEnrollments.filter((e) => e.student_id === userId).map((e) => e.batch_id);
  const getStudentBatchNames = (userId: string) => {
    const names = getStudentBatchIds(userId).map((id) => batchById.get(id)?.name).filter(Boolean) as string[];
    return names.length ? names.join(", ") : "Unassigned";
  };

  const programmeOptions = useMemo(() => {
    return Array.from(new Set(profiles.map((p) => p.course_name).filter(Boolean))).sort();
  }, [profiles]);

  const openLinksDialog = (profile: any) => {
    setSelectedTutor(profile);
    setZoomLink(profile.zoom_link || "");
    setMeetLink(profile.meet_link || "");
    setLinksDialogOpen(true);
  };

  const saveMasterLinks = async () => {
    if (!selectedTutor) return;
    setSavingLinks(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ zoom_link: zoomLink || null, meet_link: meetLink || null })
        .eq("user_id", selectedTutor.user_id);
      if (error) throw error;
      setProfiles((prev) => prev.map((p) => (p.user_id === selectedTutor.user_id ? { ...p, zoom_link: zoomLink || null, meet_link: meetLink || null } : p)));
      toast.success("Master meeting links updated");
      setLinksDialogOpen(false);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSavingLinks(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      const currentRole = roles[p.user_id] || "student";
      if (currentRole === "super_admin") return false;
      const batchIds = getStudentBatchIds(p.user_id);
      const searchable = [p.display_name, p.roll_number, p.enrollment_id, p.phone, p.course_name].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      const matchesRole = roleFilter === "all" || currentRole === roleFilter;
      const matchesProgramme = programmeFilter === "all" || p.course_name === programmeFilter;
      const matchesBatch = batchFilter === "all" || batchIds.includes(batchFilter);
      const matchesStatus = statusFilter === "all" || (statusFilter === "verified" ? p.is_verified : !p.is_verified);
      return matchesSearch && matchesRole && matchesProgramme && matchesBatch && matchesStatus;
    });
  }, [profiles, roles, search, roleFilter, programmeFilter, batchFilter, statusFilter, batchEnrollments, batchById]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filtered.some((p) => p.user_id === id)));
  }, [filtered]);

  const openAssignBatch = (userIds: string[]) => {
    setAssignTargetIds(userIds);
    setSelectedBatchId("");
    setAssignDialogOpen(true);
  };

  const assignBatch = async () => {
    if (!selectedBatchId || assignTargetIds.length === 0) return;
    setAssigningBatch(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const existing = new Set(batchEnrollments.filter((e) => e.batch_id === selectedBatchId).map((e) => e.student_id));
      const rows = assignTargetIds
        .filter((userId) => !existing.has(userId))
        .map((student_id) => ({ batch_id: selectedBatchId, student_id, enrolled_by: userData.user?.id || null }));

      if (rows.length > 0) {
        const { error } = await supabase.from("batch_enrollments").insert(rows);
        if (error) throw error;
      }

      toast.success(rows.length ? `${rows.length} student${rows.length > 1 ? "s" : ""} assigned to batch` : "Selected students are already in this batch");
      logActivity("students.batch_assigned", "batch", selectedBatchId, { count: rows.length });
      setAssignDialogOpen(false);
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to assign batch: " + (err.message || "Unknown error"));
    } finally {
      setAssigningBatch(false);
    }
  };

  const toggleSelected = (userId: string) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const selectAllVisibleStudents = () => {
    const ids = filtered.filter((p) => (roles[p.user_id] || "student") === "student").map((p) => p.user_id);
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  };

  const getExportData = () => {
    return filtered.map((p) => ({
      "Enrollment ID": p.enrollment_id || "N/A",
      "Roll No": p.roll_number || "-",
      Name: p.display_name || "Unnamed",
      Role: roles[p.user_id] || "student",
      Programme: p.course_name || "-",
      Batch: getStudentBatchNames(p.user_id),
      Status: p.is_verified ? "Verified" : "Pending",
      "Courses Enrolled": enrollCounts[p.user_id] || 0,
      Joined: new Date(p.created_at).toLocaleDateString(),
      Phone: p.phone || "-",
    }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Student Data Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Records: ${filtered.length}`, 14, 28);
    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const rows = data.map((d) => headers.map((h) => String(d[h as keyof typeof d])));
    autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 }, headStyles: { fillColor: [126, 35, 32] } });
    doc.save(`students_${new Date().toISOString().slice(0, 10)}.pdf`);
    logActivity("students.exported", "export", undefined, { format: "pdf", count: filtered.length });
    toast.success("PDF downloaded");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students_${new Date().toISOString().slice(0, 10)}.xlsx`);
    logActivity("students.exported", "export", undefined, { format: "excel", count: filtered.length });
    toast.success("Excel downloaded");
  };

  const roleColors: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary",
    admin: "bg-primary/10 text-primary",
    instructor: "bg-secondary/20 text-secondary-foreground",
    student: "bg-muted text-muted-foreground",
  };

  const roleIcons: Record<string, typeof ShieldCheck> = {
    super_admin: ShieldCheck,
    admin: ShieldCheck,
    instructor: GraduationCap,
    student: UserCog,
  };

  const visibleStudentIds = filtered.filter((p) => (roles[p.user_id] || "student") === "student").map((p) => p.user_id);
  const visibleProfiles = profiles.filter((p) => (roles[p.user_id] || "student") !== "super_admin");
  const studentCount = visibleProfiles.filter((p) => (roles[p.user_id] || "student") === "student").length;
  const instructorCount = visibleProfiles.filter((p) => (roles[p.user_id] || "student") === "instructor").length;
  const pendingCount = visibleProfiles.filter((p) => !p.is_verified).length;

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-primary">Students & Users</h1>
              <div className="mt-1 h-0.5 w-12 bg-secondary" />
            </div>
          </div>
          {selectedIds.length > 0 && (
            <Button onClick={() => openAssignBatch(selectedIds)} className="min-h-11 gap-2 rounded-xl bg-primary text-primary-foreground">
              <UserPlus className="h-4 w-4" /> Assign {selectedIds.length} to Batch
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{visibleProfiles.length} managed users • {filtered.length} shown</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Students", value: studentCount, icon: GraduationCap },
          { label: "Instructors", value: instructorCount, icon: BookOpen },
          { label: "Pending Verification", value: pendingCount, icon: Clock3 },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,180px)_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, roll no, ID..." className="min-h-11 rounded-xl pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="instructor">Instructors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
          <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Programme" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programmes</SelectItem>
            {programmeOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0} className="min-h-11 rounded-xl gap-1">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={filtered.length === 0} className="min-h-11 rounded-xl gap-1">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {!loading && visibleStudentIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Button variant="outline" size="sm" onClick={selectAllVisibleStudents} className="min-h-10 rounded-xl">
            {selectedIds.length === visibleStudentIds.length ? "Clear selection" : "Select visible students"}
          </Button>
          <span>{selectedIds.length} selected</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p, i) => {
            const currentRole = roles[p.user_id] || "student";
            const RoleIcon = roleIcons[currentRole] || UserCog;
            const isInstructor = currentRole === "instructor";
            const isStudent = currentRole === "student";
            const isSelected = selectedIds.includes(p.user_id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <div className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      {isStudent && (
                        <button
                          type="button"
                          onClick={() => toggleSelected(p.user_id)}
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1 ring-border ${isSelected ? "bg-primary text-primary-foreground" : "bg-background"}`}
                          aria-label={`Select ${p.display_name || "student"}`}
                        >
                          {isSelected && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      )}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/20 text-primary font-bold">
                        {p.avatar_url ? <img src={p.avatar_url} alt={p.display_name || "User"} className="h-full w-full object-cover" /> : (p.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-foreground">{p.display_name || "Unnamed"}</p>
                          <Badge className={roleColors[currentRole]}><RoleIcon className="mr-1 h-3 w-3" />{currentRole.replace("_", " ")}</Badge>
                          <Badge variant={p.is_verified ? "secondary" : "outline"}>{p.is_verified ? "Verified" : "Pending"}</Badge>
                        </div>
                        <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                          <span>Roll: {p.roll_number || p.enrollment_id || "—"}</span>
                          <span>Programme: {p.course_name || "—"}</span>
                          <span>Batch: {getStudentBatchNames(p.user_id)}</span>
                          <span>Joined {new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {isStudent && (
                        <Button variant="outline" size="sm" onClick={() => openAssignBatch([p.user_id])} className="min-h-10 rounded-xl gap-1">
                          <Layers className="h-4 w-4" /> Batch
                        </Button>
                      )}
                      {isInstructor && (
                        <Button variant="outline" size="sm" onClick={() => openLinksDialog(p)} className="min-h-10 rounded-xl gap-1">
                          <Video className="h-4 w-4" /> Links
                        </Button>
                      )}
                      <Badge variant="outline" className="min-h-10 rounded-xl px-3 text-xs text-muted-foreground">
                        Roles are managed in Verification
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl bg-card py-12 text-center shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
              <Users className="mx-auto mb-3 h-8 w-8 text-secondary" />
              <h3 className="font-serif text-xl text-primary">No Users Found</h3>
            </div>
          )}
        </div>
      )}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Assign Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Assign {assignTargetIds.length} selected student{assignTargetIds.length === 1 ? "" : "s"} to a batch.</p>
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Choose batch" /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{b.batch_code ? ` (${b.batch_code})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={assignBatch} disabled={!selectedBatchId || assigningBatch} className="min-h-11 w-full rounded-xl bg-primary text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> {assigningBatch ? "Assigning..." : "Assign to Batch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={linksDialogOpen} onOpenChange={setLinksDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Master Meeting Links</DialogTitle>
          </DialogHeader>
          {selectedTutor && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{selectedTutor.display_name}</span> — These links auto-fill when this tutor schedules online classes.</p>
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Zoom Personal Link</Label>
                <Input value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} placeholder="https://zoom.us/j/your-personal-room" className="mt-1 rounded-xl" disabled={!isSuperAdmin} />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Google Meet Link</Label>
                <Input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" className="mt-1 rounded-xl" disabled={!isSuperAdmin} />
              </div>
              {isSuperAdmin ? (
                <Button onClick={saveMasterLinks} disabled={savingLinks} className="min-h-11 w-full rounded-xl bg-primary text-primary-foreground">
                  <Save className="mr-2 h-4 w-4" /> {savingLinks ? "Saving..." : "Save Links"}
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">Only Super Admin can edit master links.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
