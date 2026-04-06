import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Courses from "./pages/Courses";

import CourseDetail from "./pages/CourseDetail";
import LessonPlayer from "./pages/LessonPlayer";
import Faculty from "./pages/Faculty";
import FacultyDetail from "./pages/FacultyDetail";

import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import LoginSelect from "./pages/LoginSelect";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardCourses from "./pages/dashboard/DashboardCourses";
import DashboardAssignments from "./pages/dashboard/DashboardAssignments";
import DashboardSchedule from "./pages/dashboard/DashboardSchedule";
import DashboardCertificates from "./pages/dashboard/DashboardCertificates";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import InstructorCourses from "./pages/instructor/InstructorCourses";
import CreateCourse from "./pages/instructor/CreateCourse";
import InstructorAssignments from "./pages/instructor/InstructorAssignments";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorAnalytics from "./pages/instructor/InstructorAnalytics";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminCategories from "./pages/admin/AdminCategories";

import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCurriculum from "./pages/admin/AdminCurriculum";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import DashboardCurriculum from "./pages/dashboard/DashboardCurriculum";
import DashboardClassLog from "./pages/dashboard/DashboardClassLog";
import DashboardProjects from "./pages/dashboard/DashboardProjects";
import Curriculum from "./pages/Curriculum";
import NotFound from "./pages/NotFound";
import ProgramDetail from "./pages/ProgramDetail";
import AdminSchedule from "./pages/admin/AdminSchedule";
import InstructorClassLog from "./pages/instructor/InstructorClassLog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            <Route path="/curriculum" element={<ProtectedRoute><Layout><Curriculum /></Layout></ProtectedRoute>} />
            <Route path="/course/:id" element={<Layout><CourseDetail /></Layout>} />
            <Route path="/programs/:slug" element={<Layout><ProgramDetail /></Layout>} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPlayer />} />
            <Route path="/faculty" element={<Layout><Faculty /></Layout>} />
            <Route path="/faculty/:id" element={<Layout><FacultyDetail /></Layout>} />
            
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />

            {/* Auth pages */}
            <Route path="/login" element={<LoginSelect />} />
            <Route path="/login/student" element={<Login roleType="student" />} />
            <Route path="/login/educator" element={<Login roleType="educator" />} />
            <Route path="/register" element={<Register roleType="student" />} />
            <Route path="/register/student" element={<Register roleType="student" />} />
            <Route path="/register/educator" element={<Register roleType="educator" />} />

            {/* Student Dashboard */}
            <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardOverview /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/courses" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardCourses /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/assignments" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardAssignments /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/schedule" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardSchedule /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardCertificates /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/class-log" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardClassLog /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/projects" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardProjects /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/curriculum" element={<RoleProtectedRoute allowedRoles={["student"]}><DashboardLayout><DashboardCurriculum /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><DashboardProfile /></DashboardLayout></ProtectedRoute>} />

            {/* Instructor Dashboard */}
            <Route path="/dashboard/instructor/courses" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><InstructorCourses /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/create" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><CreateCourse /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/edit/:id" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><CreateCourse /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/assignments" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><InstructorAssignments /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/students" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><InstructorStudents /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/analytics" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><InstructorAnalytics /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/class-log" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><InstructorClassLog /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/schedule" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><DashboardSchedule /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/instructor/curriculum" element={<RoleProtectedRoute allowedRoles={["instructor"]}><DashboardLayout><AdminCurriculum /></DashboardLayout></RoleProtectedRoute>} />

            {/* Admin Dashboard */}
            <Route path="/dashboard/admin" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminOverview /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/inquiries" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminInquiries /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/approvals" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminApprovals /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/courses" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminCourses /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/students" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminStudents /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/categories" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminCategories /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/schedule" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminSchedule /></DashboardLayout></RoleProtectedRoute>} />
            
            <Route path="/dashboard/admin/analytics" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminAnalytics /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/jobs" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminJobs /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/events" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminEvents /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/curriculum" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminCurriculum /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/dashboard/admin/activity" element={<RoleProtectedRoute allowedRoles={["admin"]}><DashboardLayout><AdminActivityLog /></DashboardLayout></RoleProtectedRoute>} />

            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
