import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Award, User, LogOut,
  ChevronLeft, ChevronRight, PlusCircle, Settings, Users, BarChart3, CheckSquare, Tag, Ticket, Menu, X, MessageSquare, Briefcase, CalendarDays, GraduationCap, Activity, BookCheck, FolderOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const studentNav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/courses", icon: BookOpen },
  { label: "Curriculum", to: "/dashboard/curriculum", icon: GraduationCap },
  { label: "Assignments", to: "/dashboard/assignments", icon: ClipboardList },
  { label: "Schedule", to: "/dashboard/schedule", icon: Calendar },
  { label: "Class Log", to: "/dashboard/class-log", icon: BookCheck },
  { label: "Projects", to: "/dashboard/projects", icon: FolderOpen },
  { label: "Certificates", to: "/dashboard/certificates", icon: Award },
  { label: "Profile", to: "/dashboard/profile", icon: User },
];

const instructorNav = [
  { label: "Overview", to: "/dashboard/instructor", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/instructor/courses", icon: BookOpen },
  { label: "Curriculum", to: "/dashboard/instructor/curriculum", icon: GraduationCap },
  { label: "Create Course", to: "/dashboard/instructor/create", icon: PlusCircle },
  { label: "Assignments", to: "/dashboard/instructor/assignments", icon: ClipboardList },
  { label: "Class Log", to: "/dashboard/instructor/class-log", icon: BookCheck },
  { label: "Schedule", to: "/dashboard/instructor/schedule", icon: Calendar },
  { label: "My Students", to: "/dashboard/instructor/students", icon: Users },
  { label: "Analytics", to: "/dashboard/instructor/analytics", icon: BarChart3 },
  { label: "Profile", to: "/dashboard/profile", icon: User },
];

import { ShieldCheck } from "lucide-react";

const adminNav = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Inquiries", to: "/dashboard/admin/inquiries", icon: MessageSquare },
  { label: "Curriculum", to: "/dashboard/admin/curriculum", icon: GraduationCap },
  { label: "Course Approvals", to: "/dashboard/admin/approvals", icon: CheckSquare },
  { label: "All Courses", to: "/dashboard/admin/courses", icon: BookOpen },
  { label: "Students", to: "/dashboard/admin/students", icon: Users },
  { label: "Timetable", to: "/dashboard/admin/schedule", icon: Calendar },
  { label: "Categories", to: "/dashboard/admin/categories", icon: Tag },
  { label: "Jobs & Volunteers", to: "/dashboard/admin/jobs", icon: Briefcase },
  { label: "Events", to: "/dashboard/admin/events", icon: CalendarDays },
  { label: "Subject Allocation", to: "/dashboard/admin/subject-allocation", icon: BookCheck },
  { label: "Activity Log", to: "/dashboard/admin/activity", icon: Activity },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
];

const superAdminNav = [
  ...adminNav,
  { label: "User Verification", to: "/dashboard/admin/verification", icon: ShieldCheck },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, role } = useAuth();

  const navItems = role === "super_admin" ? superAdminNav : role === "admin" ? adminNav : role === "instructor" ? instructorNav : studentNav;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (path: string) =>
    path === "/dashboard" || path === "/dashboard/admin" || path === "/dashboard/instructor"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const roleLabel = role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role === "instructor" ? "Educator" : "Student";

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "NG";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Logo area */}
      <div className="flex items-center justify-between p-4 border-b border-secondary/10">
        {(!collapsed || isMobile) ? (
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-9" />
            <span className="font-serif text-sm font-bold text-foreground">Nada Gurukulam</span>
          </Link>
        ) : (
          <Link to="/" className="mx-auto">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary/10 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-secondary/10 text-muted-foreground hidden lg:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* User avatar + role badge */}
      <div className={`border-b border-secondary/10 ${(collapsed && !isMobile) ? "p-3" : "px-4 py-4"}`}>
        <div className={`flex items-center ${(collapsed && !isMobile) ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 shadow-md">
            {initials}
          </div>
          {(!collapsed || isMobile) && (
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
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
              isActive(item.to)
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary/8 hover:text-foreground"
            }`}
            title={(collapsed && !isMobile) ? item.label : undefined}
          >
            {isActive(item.to) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-secondary shadow-sm shadow-secondary/50" />
            )}
            <item.icon className="h-5 w-5 shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
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
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle - only show when sidebar is closed */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-card shadow-lg border border-border"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] h-full flex flex-col bg-card shadow-2xl border-r border-border animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen flex-col border-r border-border/50 bg-card transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default DashboardSidebar;
