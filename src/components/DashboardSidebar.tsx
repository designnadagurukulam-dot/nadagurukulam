import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Award, User, LogOut,
  ChevronLeft, ChevronRight, PlusCircle, Settings, Users, BarChart3, CheckSquare, Tag, Ticket, Menu
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, role } = useAuth();

  const navItems = role === "admin" ? adminNav : role === "instructor" ? instructorNav : studentNav;

  const isActive = (path: string) =>
    path === "/dashboard" || path === "/dashboard/admin"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const roleLabel = role === "admin" ? "Admin" : role === "instructor" ? "Instructor" : "Student";

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "NG";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="flex items-center justify-between p-4 border-b border-secondary/10">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-9" />
            <span className="font-serif text-sm font-bold text-foreground">Nada Gurukulam</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="mx-auto">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary/10 text-muted-foreground hidden lg:block"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* User avatar + role badge */}
      <div className={`border-b border-secondary/10 ${collapsed ? "p-3" : "px-4 py-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 shadow-md">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || "User"}</p>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary">{roleLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
              isActive(item.to)
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary/8 hover:text-foreground"
            }`}
            title={collapsed ? item.label : undefined}
          >
            {/* Golden left accent for active item */}
            {isActive(item.to) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-secondary shadow-sm shadow-secondary/50" />
            )}
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-secondary/10">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card shadow-lg border border-border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-72 h-full flex flex-col bg-card shadow-2xl border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen flex-col border-r border-border/50 bg-card transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default DashboardSidebar;
