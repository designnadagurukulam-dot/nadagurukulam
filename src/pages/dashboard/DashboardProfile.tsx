import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Save, Hash, GraduationCap, Calendar, Lock, Shield, MapPin, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const PERSONAL_KEYS = ["display_name","phone","date_of_birth","gender","blood_group","address","city","state","pincode","emergency_contact_name","emergency_contact_phone","bio"];
const FAMILY_KEYS = ["father_name","father_occupation","father_email","father_phone","mother_name","mother_occupation","mother_email","mother_phone","family_notes"];

const DashboardProfile = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [original, setOriginal] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [pendingRequestNote, setPendingRequestNote] = useState<string | null>(null);

  const isStudent = role === "student";

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        const init: Record<string, string> = {
          display_name: data.display_name || "", phone: data.phone || "", bio: data.bio || "",
          date_of_birth: data.date_of_birth || "", gender: data.gender || "", blood_group: (data as any).blood_group || "",
          address: data.address || "", city: data.city || "", state: data.state || "", pincode: data.pincode || "",
          emergency_contact_name: data.emergency_contact_name || "", emergency_contact_phone: data.emergency_contact_phone || "",
          father_name: (data as any).father_name || "", father_occupation: (data as any).father_occupation || "", father_email: (data as any).father_email || "", father_phone: (data as any).father_phone || "",
          mother_name: (data as any).mother_name || "", mother_occupation: (data as any).mother_occupation || "", mother_email: (data as any).mother_email || "", mother_phone: (data as any).mother_phone || "",
          family_notes: (data as any).family_notes || "",
          roll_number: data.roll_number || "", course_name: data.course_name || "",
          year_of_commencement: data.year_of_commencement?.toString() || "", enrollment_id: data.enrollment_id || "",
          employee_id: data.employee_id || "", designation: data.designation || "", department: data.department || "",
          qualifications: data.qualifications || "", specialization: data.specialization || "",
        };
        setFormData(init);
        setOriginal(init);
      }
    });
    // Check for pending request (students)
    if (isStudent) {
      (supabase.from("profile_change_requests" as any) as any).select("id, created_at").eq("user_id", user.id).eq("status", "pending").order("created_at", { ascending: false }).limit(1).then((r: any) => {
        if (r.data && r.data.length) setPendingRequestNote(`Your previous edits (submitted ${new Date(r.data[0].created_at).toLocaleString()}) are awaiting admin approval.`);
      });
    }
  }, [user, isStudent]);

  const update = (key: string, val: string) => setFormData((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Build diff of personal/family fields
    const editableKeys = [...PERSONAL_KEYS, ...(isStudent ? FAMILY_KEYS : [])];
    const diff: Record<string, any> = {};
    editableKeys.forEach((k) => {
      const v = formData[k] ?? "";
      const orig = original[k] ?? "";
      if (String(v) !== String(orig)) diff[k] = v === "" ? null : v;
    });

    if (isStudent && Object.keys(diff).length > 0) {
      // Submit for approval
      const { error } = await (supabase.from("profile_change_requests" as any) as any).insert({
        user_id: user.id,
        requested_changes: diff,
        status: "pending",
      });
      setSaving(false);
      if (error) { toast({ title: "Could not submit for approval", description: error.message, variant: "destructive" }); return; }
      logActivity("profile.change_requested", "profile_change_request", undefined, { fields: Object.keys(diff) });
      toast({ title: "Submitted for admin approval", description: "Your edits will appear once an admin approves them." });
      setPendingRequestNote("Your latest edits are awaiting admin approval.");
      return;
    }

    // Instructors / admins update directly
    const updateData: Record<string, any> = {};
    Object.assign(updateData, diff);
    if (role === "instructor") {
      ["qualifications","specialization"].forEach((k) => {
        if ((formData[k] ?? "") !== (original[k] ?? "")) updateData[k] = formData[k] || null;
      });
    }
    if (Object.keys(updateData).length === 0) { setSaving(false); toast({ title: "Nothing to save" }); return; }
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Failed to update profile", description: error.message, variant: "destructive" }); }
    else { logActivity("profile.updated", "profile"); toast({ title: "Profile updated!" }); setOriginal({ ...original, ...formData }); }
  };

  const handlePasswordChange = async () => {
    if (!user?.email) return;
    if (!passwords.current) { toast({ title: "Enter your current password", variant: "destructive" }); return; }
    if (passwords.new !== passwords.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (passwords.new.length < 8) { toast({ title: "Use at least 8 characters", variant: "destructive" }); return; }
    setChangingPassword(true);
    // Re-authenticate with current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: passwords.current });
    if (signInErr) { setChangingPassword(false); toast({ title: "Current password is incorrect", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    setChangingPassword(false);
    if (error) { toast({ title: "Failed to change password", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Password changed successfully!" }); setPasswords({ current: "", new: "", confirm: "" }); }
  };

  const initials = formData.display_name ? formData.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "NG";
  const roleLabel = role === "admin" || role === "super_admin" ? "Admin" : role === "instructor" ? "Tutor" : "Student";
  const maskValue = (val: string) => { if (!val || val.length < 8) return val; return val.slice(0, 4) + "****" + val.slice(-4); };

  const Field = ({ label, icon: Icon, value, onChange, disabled, type = "text", placeholder = "" }: any) => (
    <div>
      <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-brand-gold" />} {label}
      </label>
      <Input type={type} value={value || ""} onChange={onChange ? (e: any) => onChange(e.target.value) : undefined}
        disabled={disabled} placeholder={placeholder}
        className={`h-11 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20 ${disabled ? "bg-brand-cream" : ""}`} />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
          <User className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Profile Settings</h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-brand-gold to-transparent mt-1" />
          <p className="text-brand-warm-grey mt-1 text-xs sm:text-sm">Manage your account information</p>
        </div>
      </motion.div>

      {/* Avatar card */}
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
        <div className="h-24 sm:h-28 bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-primary relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(196,154,60,0.15),transparent)]" />
        </div>
        <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="relative inline-block -mt-10 sm:-mt-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center text-brand-charcoal font-bold text-xl sm:text-2xl border-4 border-white shadow-lg ring-2 ring-brand-gold/20">
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center border border-brand-parchment cursor-pointer hover:bg-brand-cream transition-colors">
              <Camera className="w-3.5 h-3.5 text-brand-warm-grey" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="font-serif text-base sm:text-lg font-bold text-brand-charcoal-mid">{formData.display_name || "Your Name"}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-brand-warm-grey truncate max-w-[200px] sm:max-w-none">{user?.email}</p>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold bg-gradient-to-r from-brand-gold/20 to-brand-gold/10 text-brand-primary px-2.5 py-0.5 rounded-full border border-brand-gold/20">{roleLabel}</span>
            </div>
            {formData.enrollment_id && (
              <p className="text-[10px] sm:text-xs text-brand-warm-grey mt-1">Enrollment ID: <span className="font-mono font-medium">{formData.enrollment_id}</span></p>
            )}
          </div>
        </CardContent>
      </Card>

      {pendingRequestNote && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">
          {pendingRequestNote}
        </div>
      )}

      <Tabs defaultValue="personal">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1 w-full overflow-x-auto flex">
          <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 min-h-[40px] whitespace-nowrap gap-1.5">
            <User className="h-3.5 w-3.5" /> Personal
          </TabsTrigger>
          <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 min-h-[40px] whitespace-nowrap gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Academic
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 min-h-[40px] whitespace-nowrap gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary" />
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <Field label="Full Name" icon={User} value={formData.display_name} onChange={(v: string) => update("display_name", v)} />
                <Field label="Email" icon={Mail} value={user?.email} disabled />
                <Field label="Phone" icon={Phone} value={formData.phone} onChange={(v: string) => update("phone", v)} placeholder="+91 9876543210" />
                <Field label="Date of Birth" icon={Calendar} value={formData.date_of_birth} onChange={(v: string) => update("date_of_birth", v)} type="date" />
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Gender</label>
                  <select value={formData.gender || ""} onChange={(e) => update("gender", e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-brand-parchment bg-white px-3 py-2 text-sm focus:border-brand-gold focus:ring-brand-gold/20">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-brand-gold" /> Address
                </label>
                <Textarea value={formData.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="Full address" rows={2} className="rounded-xl border-brand-parchment focus:border-brand-gold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <Field label="City" value={formData.city} onChange={(v: string) => update("city", v)} />
                <Field label="State" value={formData.state} onChange={(v: string) => update("state", v)} />
                <Field label="Pincode" value={formData.pincode} onChange={(v: string) => update("pincode", v)} />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Bio</label>
                <Textarea value={formData.bio || ""} onChange={(e) => update("bio", e.target.value)} placeholder="Tell us about yourself..." rows={3} className="rounded-xl border-brand-parchment focus:border-brand-gold" />
              </div>
            </CardContent>
          </Card>
          {/* Sticky save on mobile */}
          <div className="sticky bottom-0 bg-brand-cream/95 backdrop-blur-sm py-3 -mx-3 px-3 sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0 sm:mx-0 sm:px-0">
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white rounded-xl w-full sm:w-auto min-h-[44px] shadow-lg">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="mt-3 sm:mt-4">
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-brand-gold via-brand-primary to-brand-gold" />
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-serif text-brand-primary flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-brand-gold" />
                {role === "instructor" ? "Educator Details" : "Student Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
              {role === "student" && (
                <>
                  <Field label="Roll Number" icon={Hash} value={formData.roll_number} disabled />
                  <Field label="Enrollment ID" icon={Hash} value={formData.enrollment_id} disabled />
                  <Field label="Course Name" icon={GraduationCap} value={formData.course_name} disabled />
                  <Field label="Year of Commencement" icon={Calendar} value={formData.year_of_commencement} disabled />
                  <Field label="KYC Document Type" icon={Shield} value={formData.kyc_document_type} disabled />
                  <Field label="KYC Document Number" icon={Shield} value={maskValue(formData.kyc_document_number || "")} disabled />
                </>
              )}
              {role === "instructor" && (
                <>
                  <Field label="Employee ID" icon={Hash} value={formData.employee_id} disabled />
                  <Field label="Designation" value={formData.designation} disabled />
                  <Field label="Department" value={formData.department} disabled />
                  <div>
                    <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Qualifications</label>
                    <Textarea value={formData.qualifications || ""} disabled className="rounded-xl bg-brand-cream border-brand-parchment" rows={3} />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest font-semibold text-brand-warm-grey mb-1.5 block">Specialization</label>
                    <Textarea value={formData.specialization || ""} disabled className="rounded-xl bg-brand-cream border-brand-parchment" rows={3} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-3 sm:mt-4">
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-brand-primary via-red-500 to-brand-primary" />
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-serif text-brand-primary flex items-center gap-2">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-brand-gold" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
              <Field label="Current Password" icon={Lock} type="password" value={passwords.current}
                onChange={(v: string) => setPasswords((p) => ({ ...p, current: v }))} placeholder="Enter current password" />
              <Field label="New Password" icon={Lock} type="password" value={passwords.new}
                onChange={(v: string) => setPasswords((p) => ({ ...p, new: v }))} placeholder="At least 8 characters" />
              <Field label="Confirm Password" icon={Lock} type="password" value={passwords.confirm}
                onChange={(v: string) => setPasswords((p) => ({ ...p, confirm: v }))} placeholder="Confirm new password" />
              <Button onClick={handlePasswordChange} disabled={changingPassword || !passwords.new || !passwords.current} className="gap-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-xl w-full sm:w-auto min-h-[44px] shadow-lg">
                <Shield className="h-4 w-4" /> {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardProfile;