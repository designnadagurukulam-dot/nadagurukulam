import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, ShieldCheck, GraduationCap, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "student" | "instructor";

const AdminStudents = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

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
    setUpdatingRole(userId);
    try {
      // Delete existing role then insert new one
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      setRoles((prev) => ({ ...prev, [userId]: newRole }));
      toast.success(`Role updated to ${newRole}`);
    } catch (err: any) {
      toast.error("Failed to update role: " + (err.message || "Unknown error"));
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = profiles.filter((p) =>
    !search || (p.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    instructor: "bg-secondary text-secondary-foreground",
    student: "bg-muted text-muted-foreground",
  };

  const roleIcons: Record<string, typeof ShieldCheck> = {
    admin: ShieldCheck,
    instructor: GraduationCap,
    student: UserCog,
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl md:text-3xl text-foreground">Students & Users</h1>
        <p className="text-muted-foreground mt-1">{profiles.length} total users • Manage roles below</p>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => {
            const currentRole = roles[p.user_id] || "student";
            const RoleIcon = roleIcons[currentRole] || UserCog;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {(p.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{p.display_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(p.created_at).toLocaleDateString()} • {enrollCounts[p.user_id] || 0} courses</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <Badge className={`${roleColors[currentRole]} gap-1 shrink-0`}>
                        <RoleIcon className="h-3 w-3" />
                        {currentRole}
                      </Badge>
                      <Select
                        value={currentRole}
                        onValueChange={(val) => handleRoleChange(p.user_id, val as AppRole)}
                        disabled={updatingRole === p.user_id}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
