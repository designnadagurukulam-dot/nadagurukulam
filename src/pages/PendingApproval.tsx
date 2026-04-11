import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";

const PendingApproval = () => {
  const { user, role, loading, isVerified, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isVerified) return <Navigate to={getRoleDashboardPath(role)} replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
          <Clock className="h-10 w-10 text-secondary" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Account Pending Approval</h1>
        <p className="text-muted-foreground">
          Your account has been created successfully. Please wait for the administrator to verify your account before you can access the dashboard.
        </p>
        <p className="text-sm text-muted-foreground">
          You will be able to sign in and access your dashboard once your account is approved.
        </p>
        <Button variant="outline" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
