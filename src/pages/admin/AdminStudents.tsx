import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, GraduationCap, UserCog, FileSpreadsheet, FileText, Users, BookOpen, Video, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type AppRole = "admin" | "student" | "instructor";

const AdminStudents = () => {
  const { role: currentUserRole } = useAuth();
  const isSuperAdmin = currentUserRole === "super_admin";

  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Master links dialog state
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [zoomLink, setZoomLink] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [savingLinks, setSavingLinks] = useState(false);

  const fetchData = async () => {
    const [profilesRes, rolesRes, enrollRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("enrollments").select("user_id"),
    ]);
    setProfiles(profilesRes.data || []);
    const roleMap: Record<string, AppRole> = {};
    (rolesRes.data || []).forEach((r) => { roleMap[r.user_id] = r.role as AppRole; });
    setRoles(roleMap);
    const countMap: Record<string, number> = {};
    (enrollRes.data || []).forEach((e) => { countMap[e.user_id] = (countMap[e.user_id] || 0) + 1; });
    setEnrollCounts(countMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const previousRole = roles[userId] || "student";
    setUpdatingRole(userId);
    try {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      const { error: insertError } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (insertError) throw insertError;
      setRoles((prev) => ({ ...prev, [userId]: newRole }));
      logActivity("role.changed", "user_role", userId, { newRole, previousRole });
      toast.success(`Role updated to ${newRole}`);
    } catch (err: any) {
      toast.error("Failed to update role: " + (err.message || "Unknown error"));
    } finally {
      setUpdatingRole(null);
    }
  };

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
      const { error } = await supabase.from("profiles").update({ zoom_link: zoomLink || null, meet_link: meetLink || null }).eq("user_id", selectedTutor.user_id);
      if (error) throw error;
      // Update local state
      setProfiles(prev => prev.map(p => p.user_id === selectedTutor.user_id ? { ...p, zoom_link: zoomLink || null, meet_link: meetLink || null } : p));
      toast.success("Master meeting links updated");
      setLinksDialogOpen(false);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSavingLinks(false);
    }
  };

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch = !search || (p.display_name || "").toLowerCase().includes(search.toLowerCase());
      const currentRole = roles[p.user_id] || "student";
      const matchesRole = roleFilter === "all" || currentRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [profiles, roles, search, roleFilter]);

  const getExportData = () => {
    return filtered.map((p) => ({
      "Enrollment ID": p.enrollment_id || "N/A",
      "Name": p.display_name || "Unnamed",
      "Role": roles[p.user_id] || "student",
      "Courses Enrolled": enrollCounts[p.user_id] || 0,
      "Joined": new Date(p.created_at).toLocaleDateString(),
      "Phone": p.phone || "-",
    }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Student Data Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Filter: ${roleFilter === "all" ? "All Roles" : roleFilter}`, 14, 28);
    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const rows = data.map((d) => headers.map((h) => String(d[h as keyof typeof d])));
    autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 9 }, headStyles: { fillColor: [134, 25, 28] } });
    doc.save(`students_${roleFilter}_${new Date().toISOString().slice(0, 10)}.pdf`);
    logActivity("students.exported", "export", undefined, { format: "pdf", count: filtered.length, roleFilter });
    toast.success("PDF downloaded");
  };

  const exportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students_${roleFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    logActivity("students.exported", "export", undefined, { format: "excel", count: filtered.length, roleFilter });
    toast.success("Excel downloaded");
  };

  const roleColors: Record<string, string> = {
    admin: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
    instructor: "bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20",
    student: "bg-brand-cream text-brand-warm-grey border border-brand-parchment",
  };

  const roleIcons: Record<string, typeof ShieldCheck> = {
    admin: ShieldCheck,
    instructor: GraduationCap,
    student: UserCog,
  };

  const studentCount = Object.values(roles).filter(r => r === "student").length;
  const instructorCount = Object.values(roles).filter(r => r === "instructor").length;

  return (
    <div className="space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-brand-primary">Students & Users</h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          </div>
        </div>
        <p className="text-sm text-brand-warm-grey mt-2">{profiles.length} total users • {filtered.length} shown</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: profiles.length, icon: Users, gradient: "from-brand-primary to-brand-primary-dark" },
          { label: "Students", value: studentCount, icon: GraduationCap, gradient: "from-brand-gold to-amber-600" },
          { label: "Instructors", value: instructorCount, icon: BookOpen, gradient: "from-brand-primary-dark to-rose-900" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-serif text-3xl font-bold text-brand-primary">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-warm-grey" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-10 border-brand-parchment rounded-xl focus:border-brand-gold" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px] h-10 border-brand-parchment rounded-xl">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="instructor">Instructors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0} className="border-brand-parchment rounded-xl hover:bg-brand-cream gap-1">
            <FileText className="h-4 w-4 text-brand-primary" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={filtered.length === 0} className="border-brand-parchment rounded-xl hover:bg-brand-cream gap-1">
            <FileSpreadsheet className="h-4 w-4 text-brand-gold" /> Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => {
            const currentRole = roles[p.user_id] || "student";
            const RoleIcon = roleIcons[currentRole] || UserCog;
            const isInstructor = currentRole === "instructor";
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="group bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] hover:bg-brand-cream hover:-translate-y-0.5 hover:shadow-[0_4px_30px_rgba(196,154,60,0.15)] transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-primary font-bold text-sm shrink-0 font-serif group-hover:from-brand-gold/30 group-hover:to-brand-gold/10 transition-all">
                        {(p.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-charcoal truncate">{p.display_name || "Unnamed"}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-brand-warm-grey">
                          {p.enrollment_id && (
                            <span className="font-mono text-brand-primary/70">{p.enrollment_id}</span>
                          )}
                          <span>Joined {new Date(p.created_at).toLocaleDateString()}</span>
                          <span>{enrollCounts[p.user_id] || 0} courses</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <Badge className={`${roleColors[currentRole]} gap-1 shrink-0`}>
                        <RoleIcon className="h-3 w-3" />
                        {currentRole}
                      </Badge>
                      {/* Master Links button for instructors */}
                      {isInstructor && (
                        <Button variant="outline" size="sm" onClick={() => openLinksDialog(p)} className="gap-1 text-xs border-brand-parchment rounded-xl hover:bg-brand-cream">
                          <Video className="h-3 w-3" /> Links
                        </Button>
                      )}
                      <Select
                        value={currentRole}
                        onValueChange={(val) => handleRoleChange(p.user_id, val as AppRole)}
                        disabled={updatingRole === p.user_id}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs border-brand-parchment rounded-xl">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-brand-gold" />
              </div>
              <h3 className="font-serif text-xl text-brand-primary">No Users Found</h3>
            </div>
          )}
        </div>
      )}

      {/* Master Meeting Links Dialog */}
      <Dialog open={linksDialogOpen} onOpenChange={setLinksDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-brand-parchment">
          <DialogHeader>
            <DialogTitle className="font-serif text-brand-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <Video className="w-4 h-4 text-brand-gold" />
              </div>
              Master Meeting Links
            </DialogTitle>
          </DialogHeader>
          {selectedTutor && (
            <div className="space-y-4">
              <p className="text-sm text-brand-warm-grey">
                <span className="font-semibold text-brand-charcoal">{selectedTutor.display_name}</span> — These links will be auto-filled when this tutor schedules online classes.
              </p>
              {!isSuperAdmin && (
                <p className="text-[10px] text-brand-warm-grey">Only Super Admin can edit master links.</p>
              )}

              <div>
                <Label className="text-[10px] uppercase tracking-wide text-brand-warm-grey">Zoom Personal Link</Label>
                <Input
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/your-personal-room"
                  className="mt-1 rounded-xl border-brand-parchment"
                  disabled={!isSuperAdmin}
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wide text-brand-warm-grey">Google Meet Link</Label>
                <Input
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="mt-1 rounded-xl border-brand-parchment"
                  disabled={!isSuperAdmin}
                />
              </div>

              {isSuperAdmin ? (
                <Button onClick={saveMasterLinks} disabled={savingLinks} className="w-full gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl shadow-lg">
                  <Save className="h-4 w-4" /> {savingLinks ? "Saving..." : "Save Links"}
                </Button>
              ) : (
                <p className="text-[10px] text-brand-warm-grey text-center">Only Super Admin can edit master links.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
