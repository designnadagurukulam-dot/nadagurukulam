import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Award, User,
  Users, BarChart3, CheckSquare, Tag, MessageSquare, Briefcase, CalendarDays,
  GraduationCap, Activity, BookCheck, FolderOpen, Video, Star,
} from "lucide-react";

export type NavItem = { label: string; to: string; icon: typeof LayoutDashboard };

export const studentNav: NavItem[] = [
  { label: "Overview", to: "/dashboard/student", icon: LayoutDashboard },
  { label: "My Courses", to: "/dashboard/student/courses", icon: BookOpen },
  { label: "Assignments", to: "/dashboard/student/assignments", icon: ClipboardList },
  { label: "Schedule", to: "/dashboard/student/schedule", icon: Calendar },
  { label: "Events", to: "/dashboard/student/events", icon: CalendarDays },
  { label: "Reach Out", to: "/dashboard/student/chat", icon: MessageSquare },
  { label: "Feedback", to: "/dashboard/student/feedback", icon: Star },
  { label: "Certificates", to: "/dashboard/student/certificates", icon: Award },
  { label: "Analytics", to: "/dashboard/student/analytics", icon: BarChart3 },
  { label: "Profile", to: "/dashboard/student/profile", icon: User },
];

export const instructorNav: NavItem[] = [
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

export const adminNav: NavItem[] = [
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
  { label: "Programs", to: "/dashboard/admin/categories", icon: Tag },
  { label: "Jobs", to: "/dashboard/admin/jobs", icon: Briefcase },
  { label: "Inquiries", to: "/dashboard/admin/inquiries", icon: MessageSquare },
  { label: "Activity Log", to: "/dashboard/admin/activity", icon: Activity },
  { label: "Analytics", to: "/dashboard/admin/analytics", icon: BarChart3 },
];

export const superAdminNav: NavItem[] = adminNav.map((item) =>
  item.label === "Messages" ? { ...item, label: "Message Monitor" } : item
);

export const getNavItems = (role: string | null | undefined): NavItem[] => {
  if (role === "super_admin") return superAdminNav;
  if (role === "admin") return adminNav;
  if (role === "instructor") return instructorNav;
  return studentNav;
};
