import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Award, User, LogOut,
  ChevronLeft, ChevronRight, PlusCircle, Users, BarChart3, CheckSquare, Tag, Menu, X, MessageSquare, Briefcase, CalendarDays, GraduationCap, Activity, BookCheck, FolderOpen, Video, Star, ShieldCheck, Waves
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

const studentNav = [
  { label: "Overview", to: "/dashboard/student", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/student/courses", icon: BookOpen },
  { label: "Assignments", to: "/dashboard/student/assignments", icon: ClipboardList },
  { label: "Schedule", to: "/dashboard/student/schedule", icon: Calendar },
  { label: "Events", to: "/dashboard/student/events", icon: CalendarDays },
  { label: "Reach Out", to: "/dashboard/student/chat", icon: MessageSquare },
  { label: "Feedback", to: "/dashboard/student/feedback", icon: Star },
  { label: "Certificates", to: "/dashboard/student/certificates", icon: Award },
  { label: "Profile", to: "/dashboard/student/profile", icon: User },
];

const instructorNav = [
  { label: "Overview", to: "/dashboard/tutor", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/tutor/courses", icon: BookOpen },
  { label: "Lesson Plans", to: "/dashboard/tutor/lesson-plans", icon: BookCheck },
  { label: "Assignments", to: "/dashboard/tutor/assignments", icon: ClipboardList },
  { label: "Schedule", to: "/dashboard/tutor/schedule", icon: Calendar },
  { label: "Events", to: "/dashboard/tutor/events", icon: CalendarDays },
  { label: "Reach Out", to: "/dashboard/tutor/messages", icon: MessageSquare },
  { label: "Analytics", to: "/dashboard/tutor/analytics", icon: BarChart3 },
  { label: "Profile", to: "/dashboard/tutor/profile", icon: User },
];

const adminNav = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", to: "/dashboard/admin/users", icon: Users },
  { label: "Faculty", to: "/dashboard/admin/teachers", icon: GraduationCap },
  { label: "Batches", to: "/dashboard/admin/batches", icon: FolderOpen },
  { label: "Curriculum", to: "/dashboard/admin/curriculum", icon: BookOpen },
  { label: "Lesson Plans", to: "/dashboard/admin/lesson-plans", icon: BookCheck },
  { label: "Assignments", to: "/dashboard/admin/assignments", icon: ClipboardList },
  { label: "Feedback", to: "/dashboard/admin/feedback", icon: Star },
  { label: "Timetable", to: "/dashboard/admin/schedule", icon: Calendar },
  { label: "Events", to: "/dashboard/admin/events", icon: CalendarDays },
  { label: "Messages", to: "/dashboard/admin/messages", icon: MessageSquare },
  { label: "Course Approvals", to: "/dashboard/admin/approvals", icon: CheckSquare },
  { label: "Faculty's Courses", to: "/dashboard/admin/courses", icon: BookOpen },
  { label: "Programs", to: "/dashboard/admin/categories", icon: Tag },
  { label: "Jobs", to: "/dashboard/admin/jobs", icon: Briefcase },
  { label: "Inquiries", to: "/dashboard/admin/inquiries", icon: MessageSquare },
  { label: "Activity Log", to: "/dashboard/admin/activity", icon: Activity },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
];

const superAdminNav = [
  ...adminNav.map(item => item.label === "Messages" ? { ...item, label: "Message Monitor" } : item),
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, role, user } = useAuth();

  const getLastViewed = (key: string) => {
    if (typeof window === "undefined") return "1970-01-01T00:00:00Z";
    return localStorage.getItem(`lastViewed:${key}`) || "1970-01-01T00:00:00Z";
  };

  const { data: counts = {} } = useQuery({
    queryKey: ["sidebar-counts", role, user?.id],
    enabled: !!role,
    refetchInterval: 30000,
    queryFn: async () => {
      const next: Record<string, number> = {};
      if (role === "admin" || role === "super_admin") {
        const usersSince = getLastViewed("users");
        const assignSince = getLastViewed("assignments");
        const feedbackSince = getLastViewed("feedback");
        const profilesP = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", false).gt("created_at", usersSince);
        const reviewsP = supabase.from("content_reviews").select("id", { count: "exact", head: true }).eq("status", "pending");
        const submissionsP = supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).is("grade", null).gt("submitted_at", assignSince);
        const messagesP = supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false);
        const feedbackP = (supabase.from("feedback") as any).select("id", { count: "exact", head: true }).eq("read_by_admin", false).gt("created_at", feedbackSince);
        const [profiles, reviews, submissions, messages, feedback] = await Promise.all([profilesP, reviewsP, submissionsP, messagesP, feedbackP]);
        next["Users"] = profiles.count || 0;
        next["Course Approvals"] = reviews.count || 0;
        next["Assignments"] = submissions.count || 0;
        next[role === "super_admin" ? "Message Monitor" : "Messages"] = messages.count || 0;
        next["Feedback"] = (feedback as any).count || 0;
      } else if (user?.id) {
        const [messages, submissions] = await Promise.all([
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
          role === "student" ? supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("status", "submitted") : Promise.resolve({ count: 0 }),
        ]);
        next["Reach Out"] = messages.count || 0;
        next["Assignments"] = submissions.count || 0;
      }
      return next;
    },
  });

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

  const roleLabel = role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role === "instructor" ? "Faculty" : "Student";

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
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-primary">
        {(!collapsed || isMobile) ? (
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="h-9" />
            <div>
              <span className="font-serif text-lg font-semibold text-brand-gold-light tracking-wide block leading-tight">Nada Gurukulam</span>
              <span className="text-[10px] text-brand-warm-grey-light uppercase tracking-widest">Classical Arts Academy</span>
            </div>
          </Link>
        ) : (
          <Link to="/" className="flex justify-center">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>
        )}
      </div>

      {/* User avatar + role badge */}
      <div className={`border-b border-brand-primary ${(collapsed && !isMobile) ? "p-3" : "px-4 sm:px-5 py-3 sm:py-4"}`}>
        <div className={`flex items-center ${(collapsed && !isMobile) ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-brand-primary-dark font-bold text-xs shrink-0 shadow-md">
            {initials}
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="font-serif text-base font-semibold text-brand-gold-light truncate">{profile?.display_name || "User"}</p>
              <span className="inline-block bg-brand-gold text-brand-primary-dark text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wide">{roleLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 sm:px-4 py-3 text-[13px] uppercase tracking-widest transition-all duration-200 rounded-lg mx-1 min-h-[44px] ${
              isActive(item.to)
                ? "text-brand-gold-light bg-brand-primary border-l-4 border-brand-gold font-semibold"
                : "text-brand-warm-grey-light hover:text-brand-gold-light hover:bg-brand-primary/60"
            }`}
            title={(collapsed && !isMobile) ? item.label : undefined}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {(!collapsed || isMobile) && <span className="flex-1 truncate">{item.label}</span>}
            {(!collapsed || isMobile) && !!counts[item.label] && <Badge className="ml-auto h-5 min-w-5 rounded-full bg-brand-gold px-1.5 text-[10px] text-brand-primary-dark">{counts[item.label] > 99 ? "99+" : counts[item.label]}</Badge>}
          </Link>
        ))}
      </nav>

      {/* Certificate promo card (student only) */}
      {role === "student" && (!collapsed || isMobile) && (
        <button
          onClick={() => navigate('/dashboard/student/courses')}
          className="mx-3 mb-3 p-3 sm:p-4 rounded-xl border border-brand-gold/30 bg-brand-primary/40 hover:bg-brand-primary/60 transition-colors cursor-pointer group text-left w-[calc(100%-1.5rem)]"
        >
          <div className="w-9 h-9 rounded-full bg-brand-gold-pale flex items-center justify-center mb-2">
            <Award className="w-[18px] h-[18px] text-brand-gold group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-serif text-sm font-semibold text-brand-gold-light">Earn Your Certificate!</p>
          <p className="text-[11px] text-brand-warm-grey-light mt-0.5">Complete your course to get certified</p>
          <p className="text-brand-gold text-[10px] font-semibold mt-1.5">View My Courses →</p>
        </button>
      )}

      {(!collapsed || isMobile) && (
        <div className="px-3 pb-2 text-sidebar-primary/70">
          <Waves className="h-8 w-full" strokeWidth={1.5} />
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-brand-primary">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-brand-warm-grey-light hover:text-white hover:bg-brand-primary/60 rounded-xl text-[12px] min-h-[44px]"
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
      {/* Mobile toggle — 44x44 tap target */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-2.5 left-2.5 z-50 w-11 h-11 flex items-center justify-center rounded-xl bg-brand-primary-dark shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-brand-gold-light" />
        </button>
      )}

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-[85vw] max-w-80 h-full flex flex-col bg-brand-primary-dark shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-2">
              <button onClick={() => setMobileOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-brand-primary text-brand-warm-grey-light">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen flex-col bg-brand-primary-dark transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="absolute -right-3 top-6 z-10 p-1 rounded-full bg-brand-primary-dark border border-brand-primary text-brand-warm-grey-light hover:text-brand-gold-light"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-6 z-10 p-1 rounded-full bg-brand-primary-dark border border-brand-primary text-brand-warm-grey-light hover:text-brand-gold-light"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default DashboardSidebar;
