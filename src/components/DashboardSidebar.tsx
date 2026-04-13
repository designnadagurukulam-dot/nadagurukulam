import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Award, User, LogOut,
  ChevronLeft, ChevronRight, PlusCircle, Users, BarChart3, CheckSquare, Tag, Menu, X, MessageSquare, Briefcase, CalendarDays, GraduationCap, Activity, BookCheck, FolderOpen, Video, Star, ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const studentNav = [
  { label: "Overview", to: "/dashboard/student", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/student/courses", icon: BookOpen },
  { label: "Curriculum", to: "/dashboard/student/curriculum", icon: GraduationCap },
  { label: "Live Classes", to: "/dashboard/student/live-classes", icon: Video },
  { label: "Assignments", to: "/dashboard/student/assignments", icon: ClipboardList },
  { label: "Chat", to: "/dashboard/student/chat", icon: MessageSquare },
  { label: "Feedback", to: "/dashboard/student/feedback", icon: Star },
  { label: "Certificates", to: "/dashboard/student/certificates", icon: Award },
  { label: "Profile", to: "/dashboard/student/profile", icon: User },
];

const instructorNav = [
  { label: "Overview", to: "/dashboard/tutor", icon: LayoutDashboard },
  { label: "My Students", to: "/dashboard/tutor/students", icon: Users },
  { label: "Curriculum", to: "/dashboard/tutor/curriculum", icon: GraduationCap },
  { label: "Live Classes", to: "/dashboard/tutor/live-classes", icon: Video },
  { label: "Assignments", to: "/dashboard/tutor/assignments", icon: ClipboardList },
  { label: "Messages", to: "/dashboard/tutor/messages", icon: MessageSquare },
  { label: "My Courses", to: "/dashboard/tutor/courses", icon: BookOpen },
  { label: "Create Course", to: "/dashboard/tutor/create", icon: PlusCircle },
  { label: "Analytics", to: "/dashboard/tutor/analytics", icon: BarChart3 },
  { label: "Profile", to: "/dashboard/tutor/profile", icon: User },
];

const adminNav = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Verification", to: "/dashboard/admin/verification", icon: ShieldCheck },
  { label: "Students", to: "/dashboard/admin/students", icon: Users },
  { label: "Tutors", to: "/dashboard/admin/tutors", icon: GraduationCap },
  { label: "Batches", to: "/dashboard/admin/batches", icon: FolderOpen },
  { label: "Curriculum", to: "/dashboard/admin/curriculum", icon: BookOpen },
  { label: "Live Classes", to: "/dashboard/admin/live-classes", icon: Video },
  { label: "Assignments", to: "/dashboard/admin/assignments", icon: ClipboardList },
  { label: "Feedback", to: "/dashboard/admin/feedback", icon: Star },
  { label: "Timetable", to: "/dashboard/admin/schedule", icon: Calendar },
  { label: "Events", to: "/dashboard/admin/events", icon: CalendarDays },
  { label: "Course Approvals", to: "/dashboard/admin/approvals", icon: CheckSquare },
  { label: "All Courses", to: "/dashboard/admin/courses", icon: BookOpen },
  { label: "Categories", to: "/dashboard/admin/categories", icon: Tag },
  { label: "Jobs", to: "/dashboard/admin/jobs", icon: Briefcase },
  { label: "Inquiries", to: "/dashboard/admin/inquiries", icon: MessageSquare },
  { label: "Subject Allocation", to: "/dashboard/admin/subject-allocation", icon: BookCheck },
  { label: "Activity Log", to: "/dashboard/admin/activity", icon: Activity },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
];

const superAdminNav = [...adminNav];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, role } = useAuth();

  const navItems = role === "super_admin" ? superAdminNav : role === "admin" ? adminNav : role === "instructor" ? instructorNav : studentNav;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (path: string) =>
    path === "/dashboard/student" || path === "/dashboard/admin" || path === "/dashboard/tutor"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const roleLabel = role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role === "instructor" ? "Tutor" : "Student";

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
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {(!collapsed || isMobile) ? (
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-9" />
            <span className="font-serif text-sm font-bold text-sidebar-foreground">Nada Gurukulam</span>
          </Link>
        ) : (
          <Link to="/" className="mx-auto">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hidden lg:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* User avatar + role badge */}
      <div className={`border-b border-sidebar-border ${(collapsed && !isMobile) ? "p-3" : "px-4 py-4"}`}>
        <div className={`flex items-center ${(collapsed && !isMobile) ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center text-sidebar-primary-foreground font-bold text-xs shrink-0 shadow-md">
            {initials}
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile?.display_name || "User"}</p>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sidebar-primary">{roleLabel}</span>
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
                ? "bg-sidebar-accent text-sidebar-primary shadow-lg"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
            title={(collapsed && !isMobile) ? item.label : undefined}
          >
            {isActive(item.to) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-sidebar-primary shadow-sm" />
            )}
            <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.to) ? "text-sidebar-primary" : ""}`} />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
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
      {/* Mobile toggle */}
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
            className="w-72 max-w-[85vw] h-full flex flex-col bg-sidebar shadow-2xl border-r border-sidebar-border animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default DashboardSidebar;
