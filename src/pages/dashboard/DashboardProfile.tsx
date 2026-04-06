import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, FileText, Save, Hash, Briefcase, GraduationCap, Building, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const DashboardProfile = () => {
  const { user, profile, role } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  // Role-specific fields
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [courseName, setCourseName] = useState("");
  const [yearOfCommencement, setYearOfCommencement] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch full profile from DB (not just useAuth's subset)
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setEmployeeId(data.employee_id || "");
        setDesignation(data.designation || "");
        setDepartment(data.department || "");
        setRollNumber(data.roll_number || "");
        setCourseName(data.course_name || "");
        setYearOfCommencement(data.year_of_commencement?.toString() || "");
        setEnrollmentId(data.enrollment_id || "");
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updateData: Record<string, any> = { display_name: displayName, phone, bio };

    if (role === "instructor") {
      updateData.employee_id = employeeId || null;
      updateData.designation = designation || null;
      updateData.department = department || null;
    }
    if (role === "student") {
      updateData.roll_number = rollNumber || null;
      updateData.course_name = courseName || null;
      updateData.year_of_commencement = yearOfCommencement ? parseInt(yearOfCommencement) : null;
    }
    if (role === "admin") {
      updateData.department = department || null;
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } else {
      logActivity("profile.updated", "profile", undefined, { displayName, phone });
      toast({ title: "Profile updated!" });
    }
  };

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "NG";

  const roleLabel = role === "admin" ? "Admin" : role === "instructor" ? "Educator" : "Student";

  return (
    <div className="space-y-6 max-w-2xl pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account information</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {/* Avatar card */}
        <Card className="border-0 shadow-md overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-primary to-primary/70 relative">
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: "radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }} />
          </div>
          <CardContent className="relative px-6 pb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-secondary-foreground font-bold text-2xl -mt-10 border-4 border-card shadow-lg">
              {initials}
            </div>
            <div className="mt-3">
              <p className="font-serif text-lg font-bold text-foreground">{displayName || "Your Name"}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{roleLabel}</span>
              </div>
              {enrollmentId && (
                <p className="text-xs text-muted-foreground mt-1">Enrollment ID: <span className="font-mono font-medium">{enrollmentId}</span></p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info form */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Display Name
              </label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </label>
              <Input value={user?.email || ""} disabled className="bg-muted h-11 rounded-xl" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> Phone
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Bio
              </label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} className="rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Role-specific fields */}
        {role === "instructor" && (
          <Card className="border-0 shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Educator Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" /> Employee ID
                </label>
                <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP-001" className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" /> Designation
                </label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Instructor" className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" /> Department
                </label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Carnatic Vocal" className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        )}

        {role === "student" && (
          <Card className="border-0 shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" /> Roll Number
                </label>
                <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. NG-2025-00001" className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" /> Course Name
                </label>
                <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. BPA Carnatic Vocal" className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> Year of Commencement
                </label>
                <Input type="number" value={yearOfCommencement} onChange={(e) => setYearOfCommencement(e.target.value)} placeholder="e.g. 2025" className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        )}

        {role === "admin" && (
          <Card className="border-0 shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Admin Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" /> Department
                </label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Administration" className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all mt-6"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </motion.div>
    </div>
  );
};

export default DashboardProfile;
