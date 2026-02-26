import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Courses from "./pages/Courses";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetail from "./pages/CourseDetail";
import LessonPlayer from "./pages/LessonPlayer";
import Faculty from "./pages/Faculty";
import FacultyDetail from "./pages/FacultyDetail";
import Admissions from "./pages/Admissions";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
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
import InstructorSubmissions from "./pages/instructor/InstructorSubmissions";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorAnalytics from "./pages/instructor/InstructorAnalytics";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import NotFound from "./pages/NotFound";

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
            <Route path="/catalog" element={<Layout><CourseCatalog /></Layout>} />
            <Route path="/course/:id" element={<Layout><CourseDetail /></Layout>} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<LessonPlayer />} />
            <Route path="/faculty" element={<Layout><Faculty /></Layout>} />
            <Route path="/faculty/:id" element={<Layout><FacultyDetail /></Layout>} />
            <Route path="/admissions" element={<Layout><Admissions /></Layout>} />
            <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />

            {/* Auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardOverview /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/courses" element={<ProtectedRoute><DashboardLayout><DashboardCourses /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/assignments" element={<ProtectedRoute><DashboardLayout><DashboardAssignments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/schedule" element={<ProtectedRoute><DashboardLayout><DashboardSchedule /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute><DashboardLayout><DashboardCertificates /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><DashboardProfile /></DashboardLayout></ProtectedRoute>} />

            {/* Instructor Dashboard */}
            <Route path="/dashboard/instructor/courses" element={<ProtectedRoute><DashboardLayout><InstructorCourses /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/instructor/create" element={<ProtectedRoute><DashboardLayout><CreateCourse /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/instructor/edit/:id" element={<ProtectedRoute><DashboardLayout><CreateCourse /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/instructor/submissions" element={<ProtectedRoute><DashboardLayout><InstructorSubmissions /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/instructor/students" element={<ProtectedRoute><DashboardLayout><InstructorStudents /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/instructor/analytics" element={<ProtectedRoute><DashboardLayout><InstructorAnalytics /></DashboardLayout></ProtectedRoute>} />
            {/* Admin Dashboard */}
            <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardLayout><AdminOverview /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admin/approvals" element={<ProtectedRoute><DashboardLayout><AdminApprovals /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admin/courses" element={<ProtectedRoute><DashboardLayout><AdminCourses /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admin/students" element={<ProtectedRoute><DashboardLayout><AdminStudents /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admin/categories" element={<ProtectedRoute><DashboardLayout><AdminCategories /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admin/coupons" element={<ProtectedRoute><DashboardLayout><AdminCoupons /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admin/analytics" element={<ProtectedRoute><DashboardLayout><AdminAnalytics /></DashboardLayout></ProtectedRoute>} />

            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
