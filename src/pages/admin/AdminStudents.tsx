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
  Save,
  Clock3,
  Pencil,
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
  const { role: currentUserRole, user } = useAuth();
  const isSuperAdmin = currentUserRole === "super_admin";

  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchEnrollments, setBatchEnrollments] = useState<BatchEnrollment[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all"); // default ALL users
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Admin label edit dialog
  const [adminLabelOpen, setAdminLabelOpen] = useState(false);
  const [adminLabelTarget, setAdminLabelTarget] = useState<any>(null);
  const [adminLabelValue, setAdminLabelValue] = useState("");
  const [savingAdminLabel, setSavingAdminLabel] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, batchesRes, batchEnrollRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("batches").select("id, name, batch_code, course_id, is_active").order("name", { ascending: true }),
      supabase.from("batch_enrollments").select("id, batch_id, student_id, enrolled_at"),
    ]);

    setProfiles(profilesRes.data || []);
    const roleMap: Record<string, AppRole> = {};
    (rolesRes.data || []).forEach((r) => {
      roleMap[r.user_id] = r.role as AppRole;
    });
    setRoles(roleMap);
    setBatches(batchesRes.data || []);
    setBatchEnrollments(batchEnrollRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const batchById = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);
  const superAdminCount = useMemo(
    () => Object.values(roles).filter((r) => r === "super_admin").length,
    [roles]
  );

  const getStudentBatchIds = (userId: string) => batchEnrollments.filter((e) => e.student_id === userId).map((e) => e.batch_id);
  const getStudentBatchNames = (userId: string) => {
    const names = getStudentBatchIds(userId).map((id) => batchById.get(id)?.name).filter(Boolean) as string[];
    return names.length ? names.join(", ") : "Unassigned";
  };

  const visibleProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const r = roles[p.user_id] || "student";
      // Hide solo super admin
      if (r === "super_admin" && superAdminCount <= 1) return false;
      return true;
    });
  }, [profiles, roles, superAdminCount]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleProfiles.filter((p) => {
      const currentRole = roles[p.user_id] || "student";
      const searchable = [p.display_name, p.roll_number, p.enrollment_id, p.employee_id, p.phone, p.course_name, p.admin_label].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      const matchesRole = roleFilter === "all" || currentRole === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "verified" ? p.is_verified : !p.is_verified);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [visibleProfiles, roles, search, roleFilter, statusFilter]);

  const changeRole = async (userId: string, newRole: AppRole) => {
    if (!isSuperAdmin) return toast.error("Only Super Admin can change roles");
    if (userId === user?.id) return toast.error("You cannot change your own role");
    const targetRole = roles[userId];
    if (targetRole === "super_admin") return toast.error("Super Admin roles are protected");
    if (newRole === "super_admin") return toast.error("Use backend recovery for Super Admin changes");
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    logActivity("user.role_changed", "user_role", userId, { newRole });
    toast.success("Role updated");
    fetchData();
  };

  const openAdminLabel = (p: any) => {
    setAdminLabelTarget(p);
    setAdminLabelValue(p.admin_label || "");
    setAdminLabelOpen(true);
  };

  const saveAdminLabel = async () => {
    if (!adminLabelTarget) return;
    setSavingAdminLabel(true);
    const { error } = await supabase.from("profiles").update({ admin_label: adminLabelValue || null } as any).eq("user_id", adminLabelTarget.user_id);
    setSavingAdminLabel(false);
    if (error) return toast.error(error.message);
    toast.success("Admin label saved");
    setAdminLabelOpen(false);
    fetchData();
  };

  const getContextLabel = (p: any, currentRole: string) => {
    if (currentRole === "student") return getStudentBatchNames(p.user_id);
    if (currentRole === "instructor") return p.course_name || p.department || "Programme not set";
    if (currentRole === "admin" || currentRole === "super_admin") return p.admin_label || "Set admin label";
    return "—";
  };

  const getExportData = () => {
    return filtered.map((p) => {
      const r = roles[p.user_id] || "student";
      return {
        Name: p.display_name || "Unnamed",
        "User Type": r === "super_admin" ? "Super Admin" : r === "admin" ? "Admin" : r === "instructor" ? "Instructor" : "Student",
        Status: p.is_verified ? "Verified" : "Pending",
        "Date Joined": new Date(p.created_at).toLocaleDateString(),
        "ID / Roll No.": p.roll_number || p.employee_id || p.enrollment_id || "—",
        Context: getContextLabel(p, r),
        Phone: p.phone || "-",
      };
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Users Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Records: ${filtered.length}`, 14, 28);
    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const rows = data.map((d) => headers.map((h) => String(d[h as keyof typeof d])));
    autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 }, headStyles: { fillColor: [126, 35, 32] } });
    doc.save(`users_${new Date().toISOString().slice(0, 10)}.pdf`);
    logActivity("students.exported", "export", undefined, { format: "pdf", count: filtered.length });
    toast.success("PDF downloaded");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    instructor: "Instructor",
    student: "Student",
  };

  const studentCount = visibleProfiles.filter((p) => (roles[p.user_id] || "student") === "student").length;
  const instructorCount = visibleProfiles.filter((p) => (roles[p.user_id] || "student") === "instructor").length;
  const adminCount = visibleProfiles.filter((p) => {
    const r = roles[p.user_id] || "student";
    return r === "admin" || r === "super_admin";
  }).length;
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
              <h1 className="font-serif text-2xl font-semibold text-primary">Users</h1>
              <div className="mt-1 h-0.5 w-12 bg-secondary" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{visibleProfiles.length} managed users • {filtered.length} shown. Roles can be changed inline; batch and subject assignment moved to their own pages.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Students", value: studentCount, icon: GraduationCap },
          { label: "Instructors", value: instructorCount, icon: BookOpen },
          { label: "Admins", value: adminCount, icon: ShieldCheck },
          { label: "Pending Verification", value: pendingCount, icon: Clock3 },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center gap-3 rounded-2xl bg-card p-4 sm:p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground shrink-0">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground truncate">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, programme, label..." className="min-h-11 rounded-xl pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="instructor">Instructors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p, i) => {
            const currentRole = roles[p.user_id] || "student";
            const RoleIcon = roleIcons[currentRole] || UserCog;
            const canChangeRole = isSuperAdmin && currentRole !== "super_admin" && p.user_id !== user?.id;
            const isAdminLike = currentRole === "admin" || currentRole === "super_admin";
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <div className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/20 text-primary font-bold">
                        {p.avatar_url ? <img src={p.avatar_url} alt={p.display_name || "User"} className="h-full w-full object-cover" /> : (p.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-foreground">{p.display_name || "Unnamed"}</p>
                          <Badge className={roleColors[currentRole]}><RoleIcon className="mr-1 h-3 w-3" />{roleLabels[currentRole]}</Badge>
                          <Badge variant={p.is_verified ? "secondary" : "outline"}>{p.is_verified ? "Verified" : "Pending"}</Badge>
                        </div>
                        <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                          <span className="truncate">ID: {p.roll_number || p.employee_id || p.enrollment_id || "—"}</span>
                          <span className="truncate">
                            {currentRole === "student" ? "Batch: " : currentRole === "instructor" ? "Programme: " : "Admin Label: "}
                            {getContextLabel(p, currentRole)}
                          </span>
                          <span className="truncate">Joined {new Date(p.created_at).toLocaleDateString()}</span>
                          {p.phone && <span className="truncate">{p.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {canChangeRole ? (
                        <Select value={currentRole} onValueChange={(val) => changeRole(p.user_id, val as AppRole)}>
                          <SelectTrigger className="min-h-10 w-[140px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="min-h-10 rounded-xl px-3 text-xs text-muted-foreground">
                          {currentRole === "super_admin" ? "Protected role" : "Role change in Verification"}
                        </Badge>
                      )}
                      {isAdminLike && isSuperAdmin && currentRole !== "super_admin" && (
                        <Button variant="outline" size="sm" onClick={() => openAdminLabel(p)} className="min-h-10 rounded-xl gap-1">
                          <Pencil className="h-4 w-4" /> Label
                        </Button>
                      )}
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

      {/* Admin label dialog */}
      <Dialog open={adminLabelOpen} onOpenChange={setAdminLabelOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Admin Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Give <span className="font-semibold text-foreground">{adminLabelTarget?.display_name}</span> a custom admin role name (e.g. "Academic Admin", "Operations Admin").
            </p>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Label</Label>
              <Input value={adminLabelValue} onChange={(e) => setAdminLabelValue(e.target.value)} placeholder="Academic Admin" className="mt-1 rounded-xl" />
            </div>
            <Button onClick={saveAdminLabel} disabled={savingAdminLabel} className="min-h-11 w-full rounded-xl bg-primary text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> {savingAdminLabel ? "Saving..." : "Save Label"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
