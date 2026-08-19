import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Save, Shield, ShieldCheck, Lock, User as UserIcon, GraduationCap, Briefcase, Heart, Users as UsersIcon, BookOpen, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

const db = supabase as any;

type ProfileRecord = Record<string, any>;

const PERSONAL_FIELDS = ["display_name","phone","alternate_email","date_of_birth","gender","blood_group","address","city","state","pincode","emergency_contact_name","emergency_contact_phone","bio"];
const FAMILY_FIELDS = ["father_name","father_occupation","father_email","father_phone","mother_name","mother_occupation","mother_email","mother_phone","family_notes"];
const ACADEMIC_STUDENT = ["roll_number","enrollment_id","course_name","year_of_commencement"];
const ACADEMIC_INSTRUCTOR = ["employee_id","designation","department","specialization","qualifications","years_of_experience","instructor_type","zoom_link","meet_link"];
const KYC_FIELDS = ["kyc_document_type","kyc_document_number","aadhar_number","pan_number","passport_number"];

const Field = ({ label, value, onChange, type = "text", disabled, placeholder }: any) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
    <Input type={type} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} placeholder={placeholder} className="mt-1 rounded-xl" />
  </div>
);

const AdminUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { role: callerRole } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileRecord>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPwd, setResetPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isSuperAdmin = callerRole === "super_admin";

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !userId) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return toast.error("Use a JPG, PNG, WEBP or GIF image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploadingAvatar(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("profile-avatars").getPublicUrl(path);
    const { error } = await db.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", userId);
    setUploadingAvatar(false);
    if (error) return toast.error(error.message);
    setProfile((p: any) => ({ ...(p || {}), avatar_url: pub.publicUrl }));
    setForm((p) => ({ ...p, avatar_url: pub.publicUrl }));
    logActivity("user.avatar_updated_by_admin", "profile", userId);
    toast.success("Profile image updated");
  };

  const handleAvatarRemove = async () => {
    if (!userId) return;
    setUploadingAvatar(true);
    const { error } = await db.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
    setUploadingAvatar(false);
    if (error) return toast.error(error.message);
    setProfile((p: any) => ({ ...(p || {}), avatar_url: null }));
    setForm((p) => ({ ...p, avatar_url: null }));
    logActivity("user.avatar_removed_by_admin", "profile", userId);
    toast.success("Profile image removed");
  };


  const fetchAll = async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: prof }, { data: roles }, { data: requests }] = await Promise.all([
      db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      db.from("user_roles").select("role").eq("user_id", userId),
      db.from("profile_change_requests").select("*").eq("user_id", userId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setProfile(prof || null);
    setForm(prof || {});
    setUserRole((roles?.[0]?.role) || "student");
    setPendingRequests(requests || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [userId]);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const targetIsAdmin = userRole === "admin" || userRole === "super_admin";

  const handleSave = async () => {
    if (!userId) return;
    const altEmail = (form.alternate_email || "").trim();
    if (userRole === "instructor" && !altEmail) {
      toast.error("Backup email is mandatory for faculty");
      return;
    }
    if (altEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(altEmail)) {
      toast.error("Enter a valid backup email address");
      return;
    }
    setSaving(true);
    const payload: ProfileRecord = {};
    [...PERSONAL_FIELDS, ...FAMILY_FIELDS, ...(userRole === "student" ? ACADEMIC_STUDENT : []), ...(userRole === "instructor" ? ACADEMIC_INSTRUCTOR : []), ...KYC_FIELDS].forEach((k) => {
      const v = form[k];
      payload[k] = v === "" || v === undefined ? null : v;
    });
    if (payload.year_of_commencement) payload.year_of_commencement = Number(payload.year_of_commencement);
    if (payload.years_of_experience) payload.years_of_experience = Number(payload.years_of_experience);
    const { error } = await db.from("profiles").update(payload).eq("user_id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    logActivity("user.profile_updated_by_admin", "profile", userId);
    toast.success("Profile saved");
    fetchAll();
  };

  const handleVerify = async (verify: boolean) => {
    if (!userId) return;
    const { error } = await db.from("profiles").update({ is_verified: verify }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    logActivity(verify ? "user.verified" : "user.verification_revoked", "user", userId);
    toast.success(verify ? "User verified" : "Verification revoked");
    fetchAll();
  };

  const handleAdminReset = async () => {
    if (!userId || resetPwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setResetting(true);
    const { data, error } = await supabase.functions.invoke("admin-reset-password", {
      body: { target_user_id: userId, new_password: resetPwd },
    });
    setResetting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed to reset password");
      return;
    }
    toast.success("Password reset. Share new password with user securely.");
    setResetPwd("");
    setResetOpen(false);
  };

  const handleApplyRequest = async (req: any, approve: boolean) => {
    if (!userId) return;
    if (approve) {
      const { error: upErr } = await db.from("profiles").update(req.requested_changes).eq("user_id", userId);
      if (upErr) return toast.error(upErr.message);
    }
    await db.from("profile_change_requests").update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() }).eq("id", req.id);
    logActivity(approve ? "profile_change.approved" : "profile_change.rejected", "profile_change_request", req.id);
    toast.success(approve ? "Changes applied" : "Request rejected");
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!profile) return <div className="py-20 text-center text-muted-foreground">User not found.</div>;

  const roleLabel = userRole === "super_admin" ? "Super Admin" : userRole === "admin" ? "Admin" : userRole === "instructor" ? "Faculty" : "Student";
  const initials = (profile.display_name || "?")[0].toUpperCase();

  return (
    <div className="space-y-6 pt-2">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`${profile.display_name || "User"} profile photo`} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-2xl font-bold text-primary">{initials}</div>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md" title="Upload profile image">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={uploadingAvatar} onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div>
              <h1 className="font-serif text-2xl text-primary">{profile.display_name || "Unnamed"}</h1>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary">{roleLabel}</Badge>
                <Badge variant={profile.is_verified ? "secondary" : "outline"}>{profile.is_verified ? "Verified" : "Pending"}</Badge>
                {profile.enrollment_id && <Badge variant="outline">{profile.enrollment_id}</Badge>}
                {profile.employee_id && <Badge variant="outline">{profile.employee_id}</Badge>}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{profile.email || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Account actions are in the {userRole === "instructor" ? "Admin" : "Academic"} tab</p>
        </div>
      </motion.div>

      {pendingRequests.length > 0 && (
        <div className="space-y-3 rounded-2xl bg-amber-50 p-4 border border-amber-200">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2"><Shield className="h-4 w-4" /> Pending profile-change requests ({pendingRequests.length})</h3>
          {pendingRequests.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs text-muted-foreground mb-2">Submitted {new Date(r.created_at).toLocaleString()}</p>
              <pre className="text-xs bg-muted/40 p-2 rounded overflow-x-auto">{JSON.stringify(r.requested_changes, null, 2)}</pre>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => handleApplyRequest(r, true)}>Approve & apply</Button>
                <Button size="sm" variant="outline" onClick={() => handleApplyRequest(r, false)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="personal">
        <TabsList className="rounded-xl">
          <TabsTrigger value="personal" className="gap-1.5"><UserIcon className="h-4 w-4" /> Personal</TabsTrigger>
          {userRole === "student" && <TabsTrigger value="family" className="gap-1.5"><UsersIcon className="h-4 w-4" /> Family</TabsTrigger>}
          <TabsTrigger value="academic" className="gap-1.5">{userRole === "instructor" ? <Briefcase className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />} {userRole === "instructor" ? "Admin" : "Academic"}</TabsTrigger>
          <TabsTrigger value="kyc" className="gap-1.5"><Lock className="h-4 w-4" /> KYC <Badge variant="outline" className="ml-1 text-[9px]">Admin only</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <div className="grid gap-3 rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-xl bg-muted/30 p-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`${profile.display_name || "User"} profile photo`} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 text-xl font-bold text-primary">{initials}</div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label>
                  <span className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-sm hover:bg-accent">
                    <Camera className="h-4 w-4" /> {uploadingAvatar ? "Uploading…" : profile.avatar_url ? "Replace image" : "Upload image"}
                  </span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={uploadingAvatar} onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)} />
                </label>
                {profile.avatar_url && (
                  <Button size="sm" variant="outline" className="gap-1 text-destructive rounded-xl" disabled={uploadingAvatar} onClick={handleAvatarRemove}><Trash2 className="h-4 w-4" /> Remove</Button>
                )}
                <p className="w-full text-[11px] text-muted-foreground">JPG, PNG, WEBP or GIF · max 5 MB. Without an image, the first letter of the name is shown.</p>
              </div>
            </div>
            <Field label="Full Name" value={form.display_name} onChange={(v: string) => update("display_name", v)} />
            <Field label="Email" value={form.email} disabled />
            <Field label="Phone" value={form.phone} onChange={(v: string) => update("phone", v)} />
            <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v: string) => update("date_of_birth", v)} />
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Gender</Label>
              <Select value={form.gender || ""} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <Field label="Blood Group" value={form.blood_group} onChange={(v: string) => update("blood_group", v)} placeholder="O+, A−, etc." />
            <div className="sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Address</Label>
              <Textarea value={form.address || ""} onChange={(e) => update("address", e.target.value)} rows={2} className="mt-1 rounded-xl" />
            </div>
            <Field label="City" value={form.city} onChange={(v: string) => update("city", v)} />
            <Field label="State" value={form.state} onChange={(v: string) => update("state", v)} />
            <Field label="Pincode" value={form.pincode} onChange={(v: string) => update("pincode", v)} />
            <Field label="Emergency Contact Name" value={form.emergency_contact_name} onChange={(v: string) => update("emergency_contact_name", v)} />
            <Field label="Emergency Contact Phone" value={form.emergency_contact_phone} onChange={(v: string) => update("emergency_contact_phone", v)} />
            <div className="sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Bio</Label>
              <Textarea value={form.bio || ""} onChange={(e) => update("bio", e.target.value)} rows={3} className="mt-1 rounded-xl" />
            </div>
          </div>
        </TabsContent>

        {userRole === "student" && (
          <TabsContent value="family" className="mt-4">
            <div className="grid gap-3 rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] sm:grid-cols-2">
              <Field label="Father's Name" value={form.father_name} onChange={(v: string) => update("father_name", v)} />
              <Field label="Father's Occupation" value={form.father_occupation} onChange={(v: string) => update("father_occupation", v)} />
              <Field label="Father's Email" value={form.father_email} onChange={(v: string) => update("father_email", v)} />
              <Field label="Father's Phone" value={form.father_phone} onChange={(v: string) => update("father_phone", v)} />
              <Field label="Mother's Name" value={form.mother_name} onChange={(v: string) => update("mother_name", v)} />
              <Field label="Mother's Occupation" value={form.mother_occupation} onChange={(v: string) => update("mother_occupation", v)} />
              <Field label="Mother's Email" value={form.mother_email} onChange={(v: string) => update("mother_email", v)} />
              <Field label="Mother's Phone" value={form.mother_phone} onChange={(v: string) => update("mother_phone", v)} />
              <div className="sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Brief about family</Label>
                <Textarea value={form.family_notes || ""} onChange={(e) => update("family_notes", e.target.value)} rows={3} className="mt-1 rounded-xl" />
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="academic" className="mt-4">
          <div className="grid gap-3 rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] sm:grid-cols-2">
            {userRole === "student" && (
              <>
                <Field label="Roll Number" value={form.roll_number} onChange={(v: string) => update("roll_number", v)} />
                <Field label="Enrollment ID" value={form.enrollment_id} disabled />
                <Field label="Program / Course" value={form.course_name} onChange={(v: string) => update("course_name", v)} />
                <Field label="Year of Commencement" type="number" value={form.year_of_commencement} onChange={(v: string) => update("year_of_commencement", v)} />
              </>
            )}
            {userRole === "instructor" && (
              <>
                <Field label="Employee ID" value={form.employee_id} onChange={(v: string) => update("employee_id", v)} />
                <Field label="Designation" value={form.designation} onChange={(v: string) => update("designation", v)} />
                <div>
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Faculty Type</Label>
                  <Select value={form.instructor_type || "regular"} onValueChange={(v) => update("instructor_type", v)}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Staff</SelectItem>
                      <SelectItem value="guest">Guest Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Department / Program" value={form.department} onChange={(v: string) => update("department", v)} />
                <Field label="Specialization" value={form.specialization} onChange={(v: string) => update("specialization", v)} />
                <Field label="Years of Experience" type="number" value={form.years_of_experience} onChange={(v: string) => update("years_of_experience", v)} />
                <div className="sm:col-span-2">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Qualifications</Label>
                  <Textarea value={form.qualifications || ""} onChange={(e) => update("qualifications", e.target.value)} rows={3} className="mt-1 rounded-xl" />
                </div>
                <Field label="Zoom Link" value={form.zoom_link} onChange={(v: string) => update("zoom_link", v)} />
                <Field label="Google Meet Link" value={form.meet_link} onChange={(v: string) => update("meet_link", v)} />
              </>
            )}
            {targetIsAdmin && (
              <>
                <Field label="Admin Label" value={form.admin_label} onChange={(v: string) => update("admin_label", v)} />
                <Field label="Department" value={form.department} onChange={(v: string) => update("department", v)} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="kyc" className="mt-4">
          <div className="grid gap-3 rounded-2xl bg-card p-5 shadow-[0_2px_16px_hsl(var(--primary)/0.06)] sm:grid-cols-2">
            <p className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">These fields are visible to admins only — never shown in the user's own profile view.</p>
            <Field label="Aadhar Number" value={form.aadhar_number} onChange={(v: string) => update("aadhar_number", v)} />
            <Field label="PAN Number" value={form.pan_number} onChange={(v: string) => update("pan_number", v)} />
            <Field label="Passport Number" value={form.passport_number} onChange={(v: string) => update("passport_number", v)} />
            <Field label="Other KYC Document Type" value={form.kyc_document_type} onChange={(v: string) => update("kyc_document_type", v)} />
            <Field label="Other KYC Document Number" value={form.kyc_document_number} onChange={(v: string) => update("kyc_document_number", v)} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2 min-h-11 rounded-xl"><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</Button>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Reset password for {profile.display_name}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Set a new temporary password and share it with the user securely. They can change it after signing in.</p>
          <Field label="New Password (min 8 chars)" type="password" value={resetPwd} onChange={setResetPwd} placeholder="Generate or enter password" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminReset} disabled={resetting || resetPwd.length < 8} className="gap-1"><KeyRound className="h-4 w-4" /> {resetting ? "Resetting…" : "Reset Password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserProfile;
