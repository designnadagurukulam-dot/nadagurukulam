import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const AdminStudents = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, rolesRes, enrollRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("enrollments").select("user_id"),
      ]);

      setProfiles(profilesRes.data || []);

      const roleMap: Record<string, string> = {};
      (rolesRes.data || []).forEach((r) => { roleMap[r.user_id] = r.role; });
      setRoles(roleMap);

      const countMap: Record<string, number> = {};
      (enrollRes.data || []).forEach((e) => { countMap[e.user_id] = (countMap[e.user_id] || 0) + 1; });
      setEnrollCounts(countMap);

      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = profiles.filter((p) =>
    !search || (p.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    instructor: "bg-secondary text-secondary-foreground",
    student: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-foreground">Students & Users</h1>
        <p className="text-muted-foreground mt-1">{profiles.length} total users</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(p.display_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{p.display_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{enrollCounts[p.user_id] || 0} courses</span>
                    <Badge className={roleColors[roles[p.user_id] || "student"] || roleColors.student}>
                      {roles[p.user_id] || "student"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
