import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Save, Hash, GraduationCap, Calendar, Lock, Shield, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const DashboardProfile = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setFormData({
          display_name: data.display_name || "", phone: data.phone || "", bio: data.bio || "",
          date_of_birth: data.date_of_birth || "", gender: data.gender || "", address: data.address || "",
          city: data.city || "", state: data.state || "", pincode: data.pincode || "",
          roll_number: data.roll_number || "", course_name: data.course_name || "",
          year_of_commencement: data.year_of_commencement?.toString() || "", enrollment_id: data.enrollment_id || "",
          kyc_document_type: data.kyc_document_type || "", kyc_document_number: data.kyc_document_number || "",
          employee_id: data.employee_id || "", designation: data.designation || "", department: data.department || "",
          qualifications: data.qualifications || "", specialization: data.specialization || "",
        });
      }
    });
  }, [user]);

  const update = (key: string, val: string) => setFormData((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updateData: Record<string, any> = {
      display_name: formData.display_name, phone: formData.phone, bio: formData.bio,
      date_of_birth: formData.date_of_birth || null, gender: formData.gender || null,
      address: formData.address || null, city: formData.city || null, state: formData.state || null, pincode: formData.pincode || null,
    };
    if (role === "student") {
      updateData.roll_number = formData.roll_number || null;
      updateData.course_name = formData.course_name || null;
      updateData.year_of_commencement = formData.year_of_commencement ? parseInt(formData.year_of_commencement) : null;
    }
    if (role === "instructor") {
      updateData.employee_id = formData.employee_id || null;
      updateData.designation = formData.designation || null;
      updateData.department = formData.department || null;
      updateData.qualifications = formData.qualifications || null;
      updateData.specialization = formData.specialization || null;
    }
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Failed to update profile", description: error.message, variant: "destructive" }); }
    else { logActivity("profile.updated", "profile"); toast({ title: "Profile updated!" }); }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (passwords.new.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setChangingPassword(true);
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
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </label>
      <Input type={type} value={value || ""} onChange={onChange ? (e: any) => onChange(e.target.value) : undefined}
        disabled={disabled} placeholder={placeholder}
        className={`h-11 rounded-xl border-brand-parchment focus:border-brand-gold focus:ring-brand-gold/20 ${disabled ? "bg-brand-cream" : ""}`} />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-brand-primary">Profile Settings</h1>
        <div className="w-12 h-0.5 bg-brand-gold mt-1" />
        <p className="text-brand-warm-grey mt-1.5 sm:mt-2 text-xs sm:text-sm">Manage your account information</p>
      </motion.div>

      {/* Avatar card */}
      <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
        <div className="h-20 sm:h-24 bg-brand-primary relative" />
        <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-gold flex items-center justify-center text-brand-charcoal font-bold text-xl sm:text-2xl -mt-8 sm:-mt-10 border-4 border-white shadow-lg">
            {initials}
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="font-serif text-base sm:text-lg font-bold text-brand-charcoal-mid">{formData.display_name || "Your Name"}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-brand-warm-grey truncate max-w-[200px] sm:max-w-none">{user?.email}</p>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold bg-brand-gold-pale text-brand-primary px-2 py-0.5 rounded-full">{roleLabel}</span>
            </div>
            {formData.enrollment_id && (
              <p className="text-[10px] sm:text-xs text-brand-warm-grey mt-1">Enrollment ID: <span className="font-mono font-medium">{formData.enrollment_id}</span></p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="bg-brand-cream-dark rounded-xl p-1 w-full overflow-x-auto flex">
          <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 min-h-[40px] whitespace-nowrap">Personal</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 min-h-[40px] whitespace-nowrap">Academic</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-brand-primary data-[state=active]:text-white text-brand-warm-grey text-[11px] sm:text-sm flex-1 min-h-[40px] whitespace-nowrap">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
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
                  <MapPin className="h-3.5 w-3.5" /> Address
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
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl w-full sm:w-auto min-h-[44px]">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="mt-3 sm:mt-4">
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3"><CardTitle className="text-base sm:text-lg font-serif text-brand-primary">{role === "instructor" ? "Educator Details" : "Student Details"}</CardTitle></CardHeader>
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
          <Card className="bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3"><CardTitle className="text-base sm:text-lg font-serif text-brand-primary flex items-center gap-2"><Lock className="h-4 w-4 sm:h-5 sm:w-5" /> Change Password</CardTitle></CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
              <Field label="New Password" icon={Lock} type="password" value={passwords.new}
                onChange={(v: string) => setPasswords((p) => ({ ...p, new: v }))} placeholder="Enter new password" />
              <Field label="Confirm Password" icon={Lock} type="password" value={passwords.confirm}
                onChange={(v: string) => setPasswords((p) => ({ ...p, confirm: v }))} placeholder="Confirm new password" />
              <Button onClick={handlePasswordChange} disabled={changingPassword || !passwords.new} className="gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl w-full sm:w-auto min-h-[44px]">
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
