import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, UserCheck, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminUserVerification = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = role === "super_admin";

  // Fetch all profiles with roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("*");
      if (rErr) throw rErr;

      return (profiles || []).map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || "student",
        role_id: roles?.find((r) => r.user_id === p.user_id)?.id,
      }));
    },
  });

  const unverifiedUsers = users?.filter((u) => !u.is_verified) || [];
  const verifiedUsers = users?.filter((u) => u.is_verified) || [];

  // Verify user mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, verify }: { userId: string; verify: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: verify })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { verify }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success(verify ? "User verified successfully" : "User verification revoked");
    },
    onError: () => toast.error("Failed to update verification status"),
  });

  // Change role mutation (super_admin only)
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success("Role updated successfully");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const renderUserRow = (u: any, showVerifyActions: boolean) => (
    <TableRow key={u.user_id}>
      <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
      <TableCell>{u.roll_number || u.employee_id || "—"}</TableCell>
      <TableCell>
        <Badge variant={u.role === "super_admin" ? "default" : u.role === "admin" ? "default" : u.role === "instructor" ? "secondary" : "outline"}>
          {u.role === "super_admin" ? "Super Admin" : u.role === "admin" ? "Admin" : u.role === "instructor" ? "Educator" : "Student"}
        </Badge>
      </TableCell>
      <TableCell>
        {u.is_verified ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Verified</Badge>
        ) : (
          <Badge variant="destructive">Pending</Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(u.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {showVerifyActions && !u.is_verified && (
            <Button
              size="sm"
              onClick={() => verifyMutation.mutate({ userId: u.user_id, verify: true })}
              disabled={verifyMutation.isPending}
              className="gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
          )}
          {showVerifyActions && u.is_verified && u.role !== "super_admin" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => verifyMutation.mutate({ userId: u.user_id, verify: false })}
              disabled={verifyMutation.isPending}
              className="gap-1 text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" />
              Revoke
            </Button>
          )}
          {isSuperAdmin && u.role !== "super_admin" && (
            <Select
              value={u.role}
              onValueChange={(val) => changeRoleMutation.mutate({ userId: u.user_id, newRole: val })}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Educator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="p-6 pt-16 lg:pt-6 flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">User Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">Approve or manage user accounts</p>
        </div>
        <div className="flex gap-3">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{verifiedUsers.length} Verified</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">{unverifiedUsers.length} Pending</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Pending Approvals */}
      {unverifiedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Pending Approvals ({unverifiedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unverifiedUsers.map((u) => renderUserRow(u, true))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Users ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifiedUsers.map((u) => renderUserRow(u, isSuperAdmin))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserVerification;
