import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type UserRole = "super_admin" | "admin" | "student" | "instructor";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const getRoleDashboardPath = (role: UserRole | null): string => {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/dashboard/admin";
    case "instructor":
      return "/dashboard/instructor";
    case "student":
    default:
      return "/dashboard";
  }
};

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, role, loading, isVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Unverified students/instructors go to pending approval page
  if (role && (role === "student" || role === "instructor") && !isVerified) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
