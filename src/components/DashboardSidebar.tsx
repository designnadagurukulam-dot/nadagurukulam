import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Award, User, LogOut,
  ChevronLeft, ChevronRight, PlusCircle, Settings, Users, BarChart3, CheckSquare, Tag, Ticket
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const studentNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/courses", icon: BookOpen },
  { label: "Assignments", to: "/dashboard/assignments", icon: ClipboardList },
  { label: "Schedule", to: "/dashboard/schedule", icon: Calendar },
  { label: "Certificates", to: "/dashboard/certificates", icon: Award },
  { label: "Profile", to: "/dashboard/profile", icon: User },
];

const instructorNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/instructor/courses", icon: BookOpen },
  { label: "Create Course", to: "/dashboard/instructor/create", icon: PlusCircle },
  { label: "Submissions", to: "/dashboard/instructor/submissions", icon: CheckSquare },
  { label: "Profile", to: "/dashboard/profile", icon: User },
];

const adminNav = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Course Approvals", to: "/dashboard/admin/approvals", icon: CheckSquare },
  { label: "All Courses", to: "/dashboard/admin/courses", icon: BookOpen },
  { label: "Students", to: "/dashboard/admin/students", icon: Users },
  { label: "Categories", to: "/dashboard/admin/categories", icon: Tag },
  { label: "Coupons", to: "/dashboard/admin/coupons", icon: Ticket },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/admin/settings", icon: Settings },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, profile, role } = useAuth();

  const navItems = role === "admin" ? adminNav : role === "instructor" ? instructorNav : studentNav;

  const isActive = (path: string) =>
    path === "/dashboard" || path === "/dashboard/admin"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const roleLabel = role === "admin" ? "Admin" : role === "instructor" ? "Instructor" : "Student";

  return (
    <aside
      className={`sticky top-0 h-screen flex flex-col border-r border-border bg-sidebar-background transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8" />
            <span className="font-serif text-sm font-semibold text-sidebar-foreground">Nada Gurukulam</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary/80">{roleLabel} Dashboard</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.to)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && profile?.display_name && (
          <p className="text-xs text-sidebar-foreground/60 mb-2 px-3 truncate">
            {profile.display_name}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
