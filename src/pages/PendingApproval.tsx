import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { getRoleDashboardPath } from "@/components/RoleProtectedRoute";
import ConfirmDialog from "@/components/ConfirmDialog";

const PendingApproval = () => {
  const { user, role, loading, isVerified, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isVerified) return <Navigate to={getRoleDashboardPath(role)} replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const userName = profile?.display_name || "there";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-brand-gold-pale flex items-center justify-center">
          <Clock className="h-10 w-10 text-brand-gold" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-brand-primary">
          Hello {userName}, your account is under review
        </h1>
        <p className="text-brand-warm-grey">
          Our team is reviewing your registration. You'll receive an email once your account is approved. This usually takes 1–2 business days.
        </p>
        <p className="text-sm text-brand-warm-grey">
          You will be able to sign in and access your dashboard once your account is approved.
        </p>
        <Button variant="outline" onClick={() => setShowSignOutConfirm(true)} className="gap-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="destructive"
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default PendingApproval;
