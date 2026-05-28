import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  ChevronDown,
  ChevronUp,
  KeyRound,
  Edit3,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

const AdminStudents = ({ lockedRole }: { lockedRole?: AppRole } = {}) => {
  const { role: currentUserRole, user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    localStorage.setItem("lastViewed:users", new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["sidebar-counts"] });
  }, [queryClient]);
  const isSuperAdmin = currentUserRole === "super_admin";

  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchEnrollments, setBatchEnrollments] = useState<BatchEnrollment[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(lockedRole || "all");
  const [statusFilter, setStatusFilter] = useState(lockedRole ? "all" : "pending");
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Admin label edit dialog
  const [adminLabelOpen, setAdminLabelOpen] = useState(false);
  const [adminLabelTarget, setAdminLabelTarget] = useState<any>(null);
  const [adminLabelValue, setAdminLabelValue] = useState("");
  const [savingAdminLabel, setSavingAdminLabel] = useState(false);

  // Edit profile dialog
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [resettingFor, setResettingFor] = useState<string | null>(null);

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

  const toggleVerify = async (userId: string, verify: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_verified: verify }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    logActivity(verify ? "user.verified" : "user.verification_revoked", "user", userId);
    toast.success(verify ? "User verified" : "Verification revoked");
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

  const openEditDialog = (p: any) => {
    setEditTarget(p);
    const role = roles[p.user_id] || "student";
    setEditForm({
      phone: p.phone || "",
      date_of_birth: p.date_of_birth || "",
      gender: p.gender || "",
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      pincode: p.pincode || "",
      emergency_contact_name: p.emergency_contact_name || "",
      emergency_contact_phone: p.emergency_contact_phone || "",
      bio: p.bio || "",
      // Academic / role-specific
      roll_number: p.roll_number || "",
      enrollment_id: p.enrollment_id || "",
      course_name: p.course_name || "",
      year_of_commencement: p.year_of_commencement || "",
      employee_id: p.employee_id || "",
      designation: p.designation || "",
      department: p.department || "",
      specialization: p.specialization || "",
      qualifications: p.qualifications || "",
      years_of_experience: p.years_of_experience || "",
      meet_link: p.meet_link || "",
      zoom_link: p.zoom_link || "",
      admin_label: p.admin_label || "",
      __role: role,
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    const { __role, ...payload } = editForm;
    // Normalize numbers
    if (payload.year_of_commencement === "") payload.year_of_commencement = null;
    else if (payload.year_of_commencement) payload.year_of_commencement = Number(payload.year_of_commencement);
    if (payload.years_of_experience === "") payload.years_of_experience = null;
    else if (payload.years_of_experience) payload.years_of_experience = Number(payload.years_of_experience);
    // Convert empty strings to null
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    const { error } = await supabase.from("profiles").update(payload as any).eq("user_id", editTarget.user_id);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    logActivity("user.profile_updated", "profile", editTarget.user_id);
    toast.success("Profile updated");
    setEditTarget(null);
    fetchData();
  };

  const resetPassword = async (p: any) => {
    if (!p.email) return toast.error("No email on file for this user");
    setResettingFor(p.user_id);
    const { error } = await supabase.auth.resetPasswordForEmail(p.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResettingFor(null);
    if (error) return toast.error(error.message);
    logActivity("user.password_reset_sent", "user", p.user_id);
    toast.success(`Password reset email sent to ${p.email}`);
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
              <h1 className="font-serif text-2xl font-semibold text-primary">{lockedRole === "instructor" ? "Teachers" : "Users"}</h1>
              <div className="mt-1 h-0.5 w-12 bg-secondary" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{visibleProfiles.length} managed users • {filtered.length} shown.{lockedRole ? "" : " Roles can be changed inline; batch and subject assignment moved to their own pages."}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Students", value: studentCount, icon: GraduationCap, onClick: () => { setRoleFilter("student"); setStatusFilter("all"); } },
          { label: "Instructors", value: instructorCount, icon: BookOpen, onClick: () => { setRoleFilter("instructor"); setStatusFilter("all"); } },
          { label: "Admins", value: adminCount, icon: ShieldCheck, onClick: () => { setRoleFilter("admin"); setStatusFilter("all"); } },
          { label: "Pending Verification", value: pendingCount, icon: Clock3, onClick: () => { setRoleFilter("all"); setStatusFilter("pending"); } },
        ].map((s, i) => (
          <motion.button key={s.label} type="button" onClick={s.onClick} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-2xl bg-card p-4 sm:p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] text-left transition hover:-translate-y-0.5 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.12)] focus:outline-none focus:ring-2 focus:ring-primary/30">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground shrink-0">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground truncate">{s.label}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, programme, label..." className="min-h-11 rounded-xl pl-10" />
        </div>
        {!lockedRole && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="min-h-11 rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="instructor">Instructors</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        )}
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

      {/* Quick verify button when pending users exist */}
      {visibleProfiles.filter((p) => !p.is_verified).length > 0 && statusFilter !== "pending" && (
        <button
          onClick={() => setStatusFilter("pending")}
          className="w-full rounded-2xl bg-secondary/15 border border-secondary/30 px-4 py-3 text-left text-sm text-foreground hover:bg-secondary/20 transition"
        >
          <span className="font-semibold text-primary">{visibleProfiles.filter((p) => !p.is_verified).length} users</span> awaiting verification — click to review
        </button>
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
            const canChangeRole = isSuperAdmin && currentRole !== "super_admin" && p.user_id !== user?.id;
            const isAdminLike = currentRole === "admin" || currentRole === "super_admin";
            const isExpanded = expandedUserId === p.user_id;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <div className="rounded-2xl bg-card p-4 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] transition-all hover:shadow-[0_8px_24px_hsl(var(--primary)/0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : p.user_id)}
                      className="flex min-w-0 items-start gap-3 text-left flex-1"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/20 text-primary font-bold">
                        {p.avatar_url ? <img src={p.avatar_url} alt={p.display_name || "User"} className="h-full w-full object-cover" /> : (p.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-foreground">{p.display_name || "Unnamed"}</p>
                          <Badge className={roleColors[currentRole]}><RoleIcon className="mr-1 h-3 w-3" />{roleLabels[currentRole]}</Badge>
                          <Badge variant={p.is_verified ? "secondary" : "outline"}>{p.is_verified ? "Verified" : "Pending"}</Badge>
                          {isExpanded ? <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" /> : <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />}
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
                    </button>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {!p.is_verified ? (
                        <Button size="sm" onClick={() => toggleVerify(p.user_id, true)} className="min-h-10 rounded-xl gap-1 bg-primary text-primary-foreground">
                          <ShieldCheck className="h-4 w-4" /> Approve
                        </Button>
                      ) : currentRole !== "super_admin" && (
                        <Button size="sm" variant="outline" onClick={() => toggleVerify(p.user_id, false)} className="min-h-10 rounded-xl gap-1 text-destructive">
                          Revoke
                        </Button>
                      )}
                      {!lockedRole && canChangeRole ? (
                        <Select value={currentRole} onValueChange={(val) => changeRole(p.user_id, val as AppRole)}>
                          <SelectTrigger className="min-h-10 w-[140px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : !lockedRole ? (
                        <Badge variant="outline" className="min-h-10 rounded-xl px-3 text-xs text-muted-foreground">
                          {currentRole === "super_admin" ? "Protected role" : "Role locked"}
                        </Badge>
                      ) : null}
                      <Button variant="outline" size="sm" asChild className="min-h-10 rounded-xl gap-1">
                        <Link to={`/dashboard/admin/users/${p.user_id}`}><UserCog className="h-4 w-4" /> View Profile</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(p)} className="min-h-10 rounded-xl gap-1">
                        <Edit3 className="h-4 w-4" /> Quick Edit
                      </Button>
                      <Button variant="outline" size="sm" disabled={resettingFor === p.user_id || !p.email} onClick={() => resetPassword(p)} className="min-h-10 rounded-xl gap-1">
                        <KeyRound className="h-4 w-4" /> {resettingFor === p.user_id ? "Sending…" : "Email reset"}
                      </Button>
                      {isAdminLike && isSuperAdmin && currentRole !== "super_admin" && (
                        <Button variant="outline" size="sm" onClick={() => openAdminLabel(p)} className="min-h-10 rounded-xl gap-1">
                          <Pencil className="h-4 w-4" /> Label
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-brand-warm-grey/20 grid gap-4 lg:grid-cols-2"
                    >
                      {/* Account section */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Account</h4>
                        <div className="space-y-0">
                          <DetailRow label="Email" value={p.email || "—"} />
                          <DetailRow label="Role" value={roleLabels[currentRole]} />
                          <DetailRow label="Status" value={p.is_verified ? "Verified" : "Pending verification"} />
                          <DetailRow label="Joined" value={new Date(p.created_at).toLocaleDateString()} />
                          <DetailRow label="Last Updated" value={p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"} />
                        </div>
                      </div>

                      {/* Profile section */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Profile</h4>
                        <div className="space-y-0">
                          <DetailRow label="Display Name" value={p.display_name || "—"} />
                          <DetailRow label="Phone" value={p.phone || "—"} />
                          <DetailRow label="Date of Birth" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : "—"} />
                          <DetailRow label="Gender" value={p.gender || "—"} />
                          <DetailRow label="Address" value={[p.address, p.city, p.state, p.pincode].filter(Boolean).join(", ") || "—"} />
                        </div>
                      </div>

                      {/* Academic / Role-specific section */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                          {currentRole === "student" ? "Academic" : currentRole === "instructor" ? "Faculty" : "Administrative"}
                        </h4>
                        <div className="space-y-0">
                          {currentRole === "student" && (
                            <>
                              <DetailRow label="Roll Number" value={p.roll_number || "—"} />
                              <DetailRow label="Enrollment ID" value={p.enrollment_id || "—"} />
                              <DetailRow label="Batch" value={getStudentBatchNames(p.user_id)} />
                              <DetailRow label="Year of Commencement" value={p.year_of_commencement ? String(p.year_of_commencement) : "—"} />
                              <DetailRow label="Course" value={p.course_name || "—"} />
                            </>
                          )}
                          {currentRole === "instructor" && (
                            <>
                              <DetailRow label="Employee ID" value={p.employee_id || "—"} />
                              <DetailRow label="Designation" value={p.designation || "—"} />
                              <DetailRow label="Department" value={p.department || "—"} />
                              <DetailRow label="Specialization" value={p.specialization || "—"} />
                              <DetailRow label="Qualifications" value={p.qualifications || "—"} />
                              <DetailRow label="Experience (years)" value={p.years_of_experience ? String(p.years_of_experience) : "—"} />
                            </>
                          )}
                          {(currentRole === "admin" || currentRole === "super_admin") && (
                            <>
                              <DetailRow label="Employee ID" value={p.employee_id || "—"} />
                              <DetailRow label="Admin Label" value={p.admin_label || "—"} />
                              <DetailRow label="Department" value={p.department || "—"} />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Emergency / Bio section */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Additional</h4>
                        <div className="space-y-0">
                          <DetailRow label="Emergency Contact" value={p.emergency_contact_name || "—"} />
                          <DetailRow label="Emergency Phone" value={p.emergency_contact_phone || "—"} />
                          <DetailRow label="Bio" value={p.bio || "—"} />
                          {(currentRole === "instructor") && <DetailRow label="Meet Link" value={p.meet_link || "—"} />}
                          {(currentRole === "instructor") && <DetailRow label="Zoom Link" value={p.zoom_link || "—"} />}
                        </div>
                      </div>
                    </motion.div>
                  )}
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

      {/* Edit profile dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Edit details — {editTarget?.display_name}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">Name and email are managed by the user's account and cannot be changed here.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditField label="Phone" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} />
            <EditField label="Date of birth" type="date" value={editForm.date_of_birth} onChange={(v) => setEditForm({ ...editForm, date_of_birth: v })} />
            <EditField label="Gender" value={editForm.gender} onChange={(v) => setEditForm({ ...editForm, gender: v })} />
            <EditField label="City" value={editForm.city} onChange={(v) => setEditForm({ ...editForm, city: v })} />
            <EditField label="State" value={editForm.state} onChange={(v) => setEditForm({ ...editForm, state: v })} />
            <EditField label="Pincode" value={editForm.pincode} onChange={(v) => setEditForm({ ...editForm, pincode: v })} />
            <div className="sm:col-span-2">
              <EditField label="Address" value={editForm.address} onChange={(v) => setEditForm({ ...editForm, address: v })} />
            </div>
            <EditField label="Emergency contact name" value={editForm.emergency_contact_name} onChange={(v) => setEditForm({ ...editForm, emergency_contact_name: v })} />
            <EditField label="Emergency contact phone" value={editForm.emergency_contact_phone} onChange={(v) => setEditForm({ ...editForm, emergency_contact_phone: v })} />
            <div className="sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Bio</Label>
              <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="mt-1 rounded-xl" rows={2} />
            </div>

            {editForm.__role === "student" && (
              <>
                <EditField label="Roll number" value={editForm.roll_number} onChange={(v) => setEditForm({ ...editForm, roll_number: v })} />
                <EditField label="Enrollment ID" value={editForm.enrollment_id} onChange={(v) => setEditForm({ ...editForm, enrollment_id: v })} />
                <EditField label="Course / Programme" value={editForm.course_name} onChange={(v) => setEditForm({ ...editForm, course_name: v })} />
                <EditField label="Year of commencement" type="number" value={editForm.year_of_commencement} onChange={(v) => setEditForm({ ...editForm, year_of_commencement: v })} />
              </>
            )}
            {editForm.__role === "instructor" && (
              <>
                <EditField label="Employee ID" value={editForm.employee_id} onChange={(v) => setEditForm({ ...editForm, employee_id: v })} />
                <EditField label="Designation" value={editForm.designation} onChange={(v) => setEditForm({ ...editForm, designation: v })} />
                <EditField label="Department" value={editForm.department} onChange={(v) => setEditForm({ ...editForm, department: v })} />
                <EditField label="Specialization" value={editForm.specialization} onChange={(v) => setEditForm({ ...editForm, specialization: v })} />
                <EditField label="Qualifications" value={editForm.qualifications} onChange={(v) => setEditForm({ ...editForm, qualifications: v })} />
                <EditField label="Years of experience" type="number" value={editForm.years_of_experience} onChange={(v) => setEditForm({ ...editForm, years_of_experience: v })} />
                <EditField label="Google Meet link" value={editForm.meet_link} onChange={(v) => setEditForm({ ...editForm, meet_link: v })} />
                <EditField label="Zoom link" value={editForm.zoom_link} onChange={(v) => setEditForm({ ...editForm, zoom_link: v })} />
              </>
            )}
            {(editForm.__role === "admin" || editForm.__role === "super_admin") && (
              <>
                <EditField label="Employee ID" value={editForm.employee_id} onChange={(v) => setEditForm({ ...editForm, employee_id: v })} />
                <EditField label="Department" value={editForm.department} onChange={(v) => setEditForm({ ...editForm, department: v })} />
                <EditField label="Admin label" value={editForm.admin_label} onChange={(v) => setEditForm({ ...editForm, admin_label: v })} />
              </>
            )}
          </div>
          <Button onClick={saveEdit} disabled={savingEdit} className="min-h-11 w-full rounded-xl bg-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> {savingEdit ? "Saving…" : "Save changes"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EditField = ({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
    <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1 rounded-xl" />
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5 py-2 border-b border-brand-warm-grey/10 sm:flex-row sm:items-baseline sm:gap-3">
    <span className="text-[11px] uppercase tracking-wider text-muted-foreground sm:w-40 sm:shrink-0">{label}</span>
    <span className={`text-sm break-words ${value === "—" ? "text-muted-foreground italic" : "text-foreground"}`}>{value}</span>
  </div>
);

export default AdminStudents;
