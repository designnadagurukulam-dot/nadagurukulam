import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, UserCheck, Users, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createUserSchema = z.object({
  display_name: z.string().trim().min(1, "Full name is required").max(100, "Full name must be under 100 characters"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(20, "Phone number is too long").optional().or(z.literal("")),
  designation: z.string().trim().max(100).optional().or(z.literal("")),
  role: z.enum(["student", "instructor", "admin"]),
});

const emptyForm = { display_name: "", email: "", password: "", phone: "", designation: "", role: "student" as const };

const AdminUserVerification = () => {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = role === "super_admin";
  const canCreateUsers = role === "super_admin" || role === "admin";
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });


  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
      if (rErr) throw rErr;
      return (profiles || []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || "student",
        role_id: roles?.find((r) => r.user_id === p.user_id)?.id,
      }));
    },
  });

  const superAdminCount = (users || []).filter((u) => u.role === "super_admin").length;

  const visibleUsers = (users || []).filter((u) => {
    // Hide solo super admin from list to prevent accidental tampering
    if (u.role === "super_admin" && superAdminCount <= 1) return false;
    return true;
  });

  const unverifiedUsers = visibleUsers.filter((u) => !u.is_verified);
  const verifiedUsers = visibleUsers.filter((u) => u.is_verified);

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, verify }: { userId: string; verify: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_verified: verify }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { verify }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success(verify ? "User verified successfully" : "User verification revoked");
    },
    onError: () => toast.error("Failed to update verification status"),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const targetUser = users?.find((u) => u.user_id === userId);
      if (!isSuperAdmin) throw new Error("Only Super Admin can change roles");
      if (userId === user?.id) throw new Error("You cannot change your own role");
      if (targetUser?.role === "super_admin") throw new Error("Super Admin roles are protected");
      if (newRole === "super_admin") throw new Error("Use backend recovery for Super Admin changes");
      const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success("Role updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update role"),
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const parsed = createUserSchema.safeParse(values);
      if (!parsed.success) throw new Error(parsed.error.errors[0].message);
      if (parsed.data.role === "admin" && !isSuperAdmin) throw new Error("Only a Super Admin can create Admin accounts");
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
          display_name: parsed.data.display_name,
          role: parsed.data.role,
          phone: parsed.data.phone || null,
          designation: parsed.data.designation || null,
        },
      });
      if (error) throw new Error(error.message || "Failed to create user");
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success("User created successfully");
      setCreateOpen(false);
      setForm({ ...emptyForm });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create user"),
  });



  const roleColors: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary border border-primary/20",
    admin: "bg-primary/10 text-primary border border-primary/20",
    instructor: "bg-secondary/20 text-secondary-foreground border border-secondary/30",
    student: "bg-muted text-muted-foreground border border-border",
  };

  const renderRoleCell = (u: any) => {
    const canEdit = isSuperAdmin && u.role !== "super_admin" && u.user_id !== user?.id;
    if (!canEdit) {
      return (
        <Badge className={roleColors[u.role] || roleColors.student}>
          {u.role === "super_admin" ? "Super Admin" : u.role === "admin" ? "Admin" : u.role === "instructor" ? "Educator" : "Student"}
        </Badge>
      );
    }
    return (
      <Select value={u.role} onValueChange={(val) => changeRoleMutation.mutate({ userId: u.user_id, newRole: val })}>
        <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="instructor">Educator</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  const renderUserRow = (u: any, showVerifyActions: boolean, i: number) => (
    <TableRow key={u.user_id} className={`${i % 2 === 1 ? "bg-muted/40" : "bg-card"} hover:bg-muted/60 transition-colors border-b border-border`}>
      <TableCell className="font-medium text-foreground">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-primary font-serif font-bold text-xs">{(u.display_name || "?")[0].toUpperCase()}</div>
          {u.display_name || "—"}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground font-mono">{u.roll_number || u.employee_id || u.enrollment_id || "—"}</TableCell>
      <TableCell>{renderRoleCell(u)}</TableCell>
      <TableCell>{u.is_verified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="destructive">Pending</Badge>}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          {showVerifyActions && !u.is_verified && (
            <Button size="sm" onClick={() => verifyMutation.mutate({ userId: u.user_id, verify: true })} disabled={verifyMutation.isPending} className="gap-1 rounded-xl text-xs">
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </Button>
          )}
          {showVerifyActions && u.is_verified && u.role !== "super_admin" && (
            <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate({ userId: u.user_id, verify: false })} disabled={verifyMutation.isPending} className="gap-1 rounded-xl text-destructive text-xs">
              <XCircle className="h-3.5 w-3.5" /> Revoke
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-primary">User Verification</h1>
          <div className="w-12 h-0.5 bg-secondary mt-1" />
          <p className="text-sm text-muted-foreground mt-2">Approve or manage user accounts. Roles can be changed inline in the Role column.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] px-4 py-2 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-secondary" /><span className="text-sm font-medium text-foreground">{verifiedUsers.length} Verified</span>
          </div>
          <div className="bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] px-4 py-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /><span className="text-sm font-medium text-foreground">{unverifiedUsers.length} Pending</span>
          </div>
          {canCreateUsers && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl h-11">
              <UserPlus className="h-4 w-4" /> Create User
            </Button>
          )}

        </div>
      </div>

      {canCreateUsers && (
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm({ ...emptyForm }); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-primary">Create User</DialogTitle>
              <DialogDescription>Create an account directly. The user can sign in immediately with these credentials.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cu-name">Full Name *</Label>
                <Input id="cu-name" value={form.display_name} maxLength={100} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-email">Email *</Label>
                <Input id="cu-email" type="email" value={form.email} maxLength={255} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-phone">Phone Number</Label>
                <Input id="cu-phone" value={form.phone} maxLength={20} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-password">Temporary Password *</Label>
                <Input id="cu-password" type="text" value={form.password} maxLength={72} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
              </div>
              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val as typeof form.role })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Faculty</SelectItem>
                    {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cu-designation">Designation</Label>
                <Input id="cu-designation" value={form.designation} maxLength={100} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Optional (e.g. Principal, Guest Faculty)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="rounded-xl gap-2" disabled={createUserMutation.isPending} onClick={() => createUserMutation.mutate(form)}>
                <UserPlus className="h-4 w-4" /> {createUserMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}



      {unverifiedUsers.length > 0 && (
        <div className="bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] overflow-hidden">
          <div className="p-5 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center"><Shield className="h-4 w-4 text-secondary-foreground" /></div>
            <h3 className="font-serif text-lg text-primary">Pending Approvals ({unverifiedUsers.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Name</TableHead>
                  <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">ID</TableHead>
                  <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Role</TableHead>
                  <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                  <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Registered</TableHead>
                  <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{unverifiedUsers.map((u, i) => renderUserRow(u, true, i))}</TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-[0_2px_24px_hsl(var(--primary)/0.06)] overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="font-serif text-lg text-primary">Managed Users ({verifiedUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Name</TableHead>
                <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">ID</TableHead>
                <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Role</TableHead>
                <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Status</TableHead>
                <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Registered</TableHead>
                <TableHead className="text-primary-foreground text-[11px] uppercase tracking-widest font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{verifiedUsers.map((u, i) => renderUserRow(u, isSuperAdmin, i))}</TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserVerification;
