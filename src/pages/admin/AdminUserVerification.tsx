import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, UserCheck, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminUserVerification = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = role === "super_admin";

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
      if (rErr) throw rErr;
      return (profiles || []).map((p) => ({ ...p, role: roles?.find((r) => r.user_id === p.user_id)?.role || "student", role_id: roles?.find((r) => r.user_id === p.user_id)?.id }));
    },
  });

  const unverifiedUsers = users?.filter((u) => !u.is_verified) || [];
  const verifiedUsers = users?.filter((u) => u.is_verified) || [];

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, verify }: { userId: string; verify: boolean }) => { const { error } = await supabase.from("profiles").update({ is_verified: verify }).eq("user_id", userId); if (error) throw error; },
    onSuccess: (_, { verify }) => { queryClient.invalidateQueries({ queryKey: ["admin-all-users"] }); toast.success(verify ? "User verified successfully" : "User verification revoked"); },
    onError: () => toast.error("Failed to update verification status"),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => { const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-users"] }); toast.success("Role updated successfully"); },
    onError: () => toast.error("Failed to update role"),
  });

  const roleColors: Record<string, string> = {
    super_admin: "bg-[#7D1E24]/10 text-[#7D1E24] border border-[#7D1E24]/20",
    admin: "bg-[#7D1E24]/10 text-[#7D1E24] border border-[#7D1E24]/20",
    instructor: "bg-[#C49A3C]/10 text-[#8B6914] border border-[#C49A3C]/20",
    student: "bg-[#FAF6EE] text-[#8C7B6B] border border-[#EDE3CC]",
  };

  const renderUserRow = (u: any, showVerifyActions: boolean, i: number) => (
    <TableRow key={u.user_id} className={`${i % 2 === 1 ? "bg-[#FAF6EE]" : "bg-white"} hover:bg-[#FAF6EE] transition-colors border-b border-[#EDE3CC]`}>
      <TableCell className="font-medium text-[#3D2E22]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#F5E9CE] flex items-center justify-center text-[#7D1E24] font-serif font-bold text-xs">{(u.display_name || "?")[0].toUpperCase()}</div>
          {u.display_name || "—"}
        </div>
      </TableCell>
      <TableCell className="text-sm text-[#8C7B6B] font-mono">{u.roll_number || u.employee_id || "—"}</TableCell>
      <TableCell><Badge className={roleColors[u.role] || roleColors.student}>{u.role === "super_admin" ? "Super Admin" : u.role === "admin" ? "Admin" : u.role === "instructor" ? "Educator" : "Student"}</Badge></TableCell>
      <TableCell>{u.is_verified ? <Badge className="bg-green-50 text-green-700 border border-green-200">Verified</Badge> : <Badge className="bg-red-50 text-red-600 border border-red-200">Pending</Badge>}</TableCell>
      <TableCell className="text-xs text-[#8C7B6B]">{new Date(u.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          {showVerifyActions && !u.is_verified && (
            <Button size="sm" onClick={() => verifyMutation.mutate({ userId: u.user_id, verify: true })} disabled={verifyMutation.isPending} className="gap-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs">
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </Button>
          )}
          {showVerifyActions && u.is_verified && u.role !== "super_admin" && (
            <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate({ userId: u.user_id, verify: false })} disabled={verifyMutation.isPending} className="gap-1 border-[#EDE3CC] rounded-xl text-red-500 text-xs">
              <XCircle className="h-3.5 w-3.5" /> Revoke
            </Button>
          )}
          {isSuperAdmin && u.role !== "super_admin" && (
            <Select value={u.role} onValueChange={(val) => changeRoleMutation.mutate({ userId: u.user_id, newRole: val })}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-[#EDE3CC] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="instructor">Educator</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
            </Select>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-4 border-[#7D1E24] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#7D1E24]">User Verification</h1>
          <div className="w-12 h-0.5 bg-[#C49A3C] mt-1" />
          <p className="text-sm text-[#8C7B6B] mt-2">Approve or manage user accounts</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] px-4 py-2 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" /><span className="text-sm font-medium text-[#3D2E22]">{verifiedUsers.length} Verified</span>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] px-4 py-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium text-[#3D2E22]">{unverifiedUsers.length} Pending</span>
          </div>
        </div>
      </div>

      {unverifiedUsers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
          <div className="p-5 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center"><Shield className="h-4 w-4 text-amber-600" /></div>
            <h3 className="font-serif text-lg text-[#7D1E24]">Pending Approvals ({unverifiedUsers.length})</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#5C1219] hover:bg-[#5C1219]">
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Name</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">ID</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Role</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Registered</TableHead>
                <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{unverifiedUsers.map((u, i) => renderUserRow(u, true, i))}</TableBody>
          </Table>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="font-serif text-lg text-[#7D1E24]">All Users ({users?.length || 0})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#5C1219] hover:bg-[#5C1219]">
              <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Name</TableHead>
              <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">ID</TableHead>
              <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Role</TableHead>
              <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
              <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Registered</TableHead>
              <TableHead className="text-[#E2B95A] text-[11px] uppercase tracking-widest font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{verifiedUsers.map((u, i) => renderUserRow(u, isSuperAdmin, i))}</TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUserVerification;
