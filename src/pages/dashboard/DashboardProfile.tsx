import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";

const DashboardProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone, bio })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "NG";

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
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardProfile;
