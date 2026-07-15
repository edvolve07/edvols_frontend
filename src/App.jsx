import { ChevronDown, Flame, Menu, Search, Sparkles } from "lucide-react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AccessRevoked from "@/src/pages/AccessRevoked";
import AdminsList from "@/src/pages/admin/AdminsList";
import AptitudePage from "@/src/pages/AptitudePage";
import DashboardPage from "@/src/pages/DashboardPage";
import InterviewPage from "@/src/pages/InterviewPage";
import ReportPage from "@/src/pages/ReportPage";
import ReportsResultsPage from "@/src/pages/ReportsResultsPage";
import ProfilePage from "@/src/pages/ProfilePage";
import ResumeBuilderPage from "@/src/pages/ResumeBuilderPage";
import ResultDetails from "@/src/pages/aptitude/ResultDetails";
import AdminAptitudeAnalytics from "@/src/pages/admin/AdminAptitudeAnalytics";
import AdminInterviewAnalytics from "@/src/pages/admin/AdminInterviewAnalytics";
import AiUsagePage from "@/src/pages/admin/AiUsagePage";
import CreateAdmin from "@/src/pages/admin/CreateAdmin";
import CreateUser from "@/src/pages/admin/CreateUser";
import InstitutionsPage from "@/src/pages/admin/Institutions";
import InstitutionDetailPage from "@/src/pages/admin/InstitutionDetail";
import MasterAdminDashboard from "@/src/pages/admin/MasterAdminDashboard";
import MasterAdminsList from "@/src/pages/admin/MasterAdminsList";
import EdvolsAdminDashboard from "@/src/pages/admin/EdvolsAdminDashboard";
import StudentsList from "@/src/pages/admin/StudentsList";
import UserManagement from "@/src/pages/admin/UserManagement";
import AppSidebar from "../components/Sidebar";
import { APP_NAME } from "./constants";
import RoleGuard from "./portal/components/RoleGuard";
import PortalSidebar from "./portal/components/Sidebar";
import PortalLoadingSkeleton from "./portal/components/LoadingSkeleton";
import { useAuth } from "./portal/context/AuthContext";
import ForgotPassword from "./portal/pages/ForgotPassword";
import PortalLogin from "./portal/pages/Login";
import ResetPassword from "./portal/pages/ResetPassword";
import PortalSignup from "./portal/pages/Signup";
import AdminAssessments from "./portal/pages/admin/AdminAssessments";
import AssessmentResults from "./portal/pages/admin/AssessmentResults";
import CreateAssessment from "./portal/pages/admin/CreateAssessment";
import QuestionReview from "./portal/pages/admin/QuestionReview";
import PortalResultDetails from "./portal/pages/student/ResultDetails";
import PortalStartAssessment from "./portal/pages/student/StartAssessment";
import PortalStudentAssessments from "./portal/pages/student/StudentAssessments";
import StudentDashboard from "./portal/pages/student/StudentDashboard";
import PortalStudentResults from "./portal/pages/student/StudentResults";
import ProgrammingProblems from "./portal/pages/programming/Problems";
import PracticeTopics from "./portal/pages/programming/PracticeTopics";
import ProblemView from "./portal/pages/programming/ProblemView";
import ProgrammingSubmissions from "./portal/pages/programming/Submissions";
import AdminProgrammingProblems from "./portal/pages/programming/AdminProblems";
import AdminProgrammingProblemForm from "./portal/pages/programming/AdminProblemForm";
import MasterAdminProblems from "./pages/admin/programming/MasterAdminProblems";
import MasterAdminProblemForm from "./pages/admin/programming/MasterAdminProblemForm";
import AdminProgrammingAnalytics from "./pages/admin/programming/AdminProgrammingAnalytics";
import ProgrammingLanding from "./portal/pages/programming/ProgrammingLanding";
import AssessmentList from "./portal/pages/programming/AssessmentList";
import TakeAssessment from "./portal/pages/programming/TakeAssessment";
import AssessmentResult from "./portal/pages/programming/AssessmentResult";
import AdminAssessmentList from "./pages/admin/programming/AdminAssessmentList";
import AdminAssessmentForm from "./pages/admin/programming/AdminAssessmentForm";
import AdminAssessmentResults from "./pages/admin/programming/AdminAssessmentResults";
import MasterAdminAssessmentList from "./pages/admin/programming/MasterAdminAssessmentList";
import MasterAdminAssessmentForm from "./pages/admin/programming/MasterAdminAssessmentForm";
import MasterAdminAssessmentResults from "./pages/admin/programming/MasterAdminAssessmentResults";
import CommunicationPage from "./pages/CommunicationPage";
import CommunicationReport from "./pages/CommunicationReport";
import AdminCommunicationAnalytics from "./pages/admin/AdminCommunicationAnalytics";

function AppShell({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pathname = useLocation().pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (window.innerWidth < 1024) return 288;
    const stored = Number(window.localStorage.getItem("app-sidebar-width"));
    return Number.isFinite(stored) ? Math.min(Math.max(stored, 88), 360) : 288;
  });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      window.localStorage.setItem("app-sidebar-width", String(sidebarWidth));
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (!user || user.role === "admin" || user.role === "master_admin") return;
    import("@/lib/api").then(({ apiFetch }) =>
      apiFetch("/api/student/dashboard")
        .then((data) => setStreak(data.study_streak?.current || 0))
        .catch(() => {})
    );
  }, [user]);

  return (
    <div className="flex min-h-screen bg-canvas" style={{ "--app-sidebar-width": `${sidebarWidth}px` }}>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
        />
      ) : null}
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[var(--app-sidebar-width)]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden flex-1 justify-center md:flex">
            <label className="flex h-12 w-full max-w-[520px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-500">
              <Search size={19} className="text-slate-400" />
              <input
                type="search"
                placeholder="Search topics, questions, or tests..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="min-w-0 flex-1 md:hidden">
            <p className="text-base font-bold leading-none text-slate-900">{APP_NAME}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Unified prep workspace</p>
          </div>

          {(user?.role === "admin" || user?.role === "master_admin") && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 ml-4">
              <span className="text-slate-500">/</span>
              <span className="text-slate-700 font-semibold capitalize">
                {user?.role === "master_admin" ? "Master Admin" : "Admin"}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-500">
                {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
              </span>
            </div>
          )}

          {user?.role !== "admin" && user?.role !== "master_admin" ? (
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:inline-flex">
              <Flame size={17} className="text-amber-500" />
              {streak}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex shrink-0 items-center gap-3 rounded-xl px-1 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-2"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden max-w-36 truncate sm:inline">{user?.name || "User"}</span>
          </button>
        </header>

        <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function RequireSession() {
  const { user, loading, revoked } = useAuth();
  if (loading) return <PortalLoadingSkeleton label="Checking session" />;
  if (revoked) return <Navigate to="/access-revoked" replace />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AuthLanding() {
  const { user, loading } = useAuth();
  if (loading) return <PortalLoadingSkeleton label="Checking session" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

function ReportsResultDetailsRoute() {
  const { attemptId } = useParams();
  return <ResultDetails attemptId={attemptId} backPath="/reports" />;
}

function homeForRole(role) {
  if (role === "master_admin") return "/master-admin/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/dashboard";
}

function RequireRole({ roles }) {
  const { user, loading, revoked } = useAuth();
  if (loading) return <PortalLoadingSkeleton label="Checking session" />;
  if (revoked) return <Navigate to="/access-revoked" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthLanding />} />
      <Route path="/login" element={<PortalLogin />} />
      <Route path="/access-revoked" element={<AccessRevoked />} />
      <Route path="/signup" element={<PortalSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireSession />}>
        <Route path="/dashboard" element={<AppShell><DashboardPage /></AppShell>} />
        <Route path="/interview" element={<AppShell><InterviewPage /></AppShell>} />
        <Route path="/aptitude" element={<AppShell><AptitudePage /></AppShell>} />
        <Route path="/aptitude/:assessmentId/start" element={<AppShell><AptitudePage /></AppShell>} />
        <Route path="/aptitude/results" element={<AppShell><AptitudePage /></AppShell>} />
        <Route path="/aptitude/results/:attemptId" element={<AppShell><AptitudePage /></AppShell>} />
        <Route path="/programming" element={<AppShell><ProgrammingLanding /></AppShell>} />
        <Route path="/programming/practice" element={<AppShell><PracticeTopics /></AppShell>} />
        <Route path="/programming/practice/topics/:topicName" element={<AppShell><ProgrammingProblems /></AppShell>} />
        <Route path="/programming/practice/problems/:id" element={<AppShell><ProblemView /></AppShell>} />
        <Route path="/programming/practice/submissions" element={<AppShell><ProgrammingSubmissions /></AppShell>} />
        <Route path="/programming/assessments" element={<AppShell><AssessmentList /></AppShell>} />
        <Route path="/programming/assessments/:assessmentId" element={<AppShell><TakeAssessment /></AppShell>} />
        <Route path="/programming/assessments/results/:attemptId" element={<AppShell><AssessmentResult /></AppShell>} />
        <Route path="/report" element={<AppShell><ReportPage /></AppShell>} />
        <Route path="/reports" element={<AppShell><ReportsResultsPage /></AppShell>} />
        <Route path="/reports/results/:attemptId" element={<AppShell><ReportsResultDetailsRoute /></AppShell>} />
        <Route path="/resume-builder" element={<AppShell><ResumeBuilderPage /></AppShell>} />
        <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
        <Route path="/communication" element={<AppShell><CommunicationPage /></AppShell>} />
        <Route path="/communication/report" element={<AppShell><CommunicationReport /></AppShell>} />
      </Route>

      <Route element={<RequireRole roles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AppShell><EdvolsAdminDashboard /></AppShell>} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/analytics/aptitude" element={<AppShell><AdminAptitudeAnalytics /></AppShell>} />
        <Route path="/admin/analytics/interviews" element={<AppShell><AdminInterviewAnalytics /></AppShell>} />
        <Route path="/admin/analytics/communication" element={<AppShell><AdminCommunicationAnalytics /></AppShell>} />
        <Route path="/admin/assessments" element={<AppShell><AdminAssessments /></AppShell>} />
        <Route path="/admin/assessments/create" element={<AppShell><CreateAssessment /></AppShell>} />
        <Route path="/admin/assessments/:id/questions" element={<AppShell><QuestionReview /></AppShell>} />
        <Route path="/admin/assessments/:id/results" element={<AppShell><AssessmentResults /></AppShell>} />
        <Route path="/admin/programming/analytics/students" element={<AppShell><AdminProgrammingAnalytics /></AppShell>} />
        <Route path="/admin/programming/assessments" element={<AppShell><AdminAssessmentList /></AppShell>} />
        <Route path="/admin/programming/assessments/create" element={<AppShell><AdminAssessmentForm /></AppShell>} />
        <Route path="/admin/programming/assessments/:assessmentId/problems" element={<AppShell><AdminAssessmentForm /></AppShell>} />
        <Route path="/admin/programming/assessments/:assessmentId/results" element={<AppShell><AdminAssessmentResults /></AppShell>} />
      </Route>

      <Route element={<RequireRole roles={["master_admin"]} />}>
        <Route path="/master-admin/dashboard" element={<AppShell><MasterAdminDashboard /></AppShell>} />
        <Route path="/master-admin-dashboard" element={<Navigate to="/master-admin/dashboard" replace />} />
        <Route path="/master-admin/students" element={<AppShell><StudentsList /></AppShell>} />
        <Route path="/master-admin/admins" element={<AppShell><AdminsList /></AppShell>} />
        <Route path="/master-admin/master-admins" element={<AppShell><MasterAdminsList /></AppShell>} />
        <Route path="/master-admin/institutions" element={<AppShell><InstitutionsPage /></AppShell>} />
        <Route path="/master-admin/institutions/:id" element={<AppShell><InstitutionDetailPage /></AppShell>} />
        <Route path="/master-admin/create-admin" element={<AppShell><CreateAdmin /></AppShell>} />
        <Route path="/master-admin/create-user" element={<AppShell><CreateUser /></AppShell>} />
        <Route path="/master-admin/ai-usage" element={<AppShell><AiUsagePage /></AppShell>} />
        <Route path="/master-admin/programming" element={<AppShell><MasterAdminProblems /></AppShell>} />
        <Route path="/master-admin/programming/create" element={<AppShell><MasterAdminProblemForm /></AppShell>} />
        <Route path="/master-admin/programming/:id/edit" element={<AppShell><MasterAdminProblemForm /></AppShell>} />
        <Route path="/master-admin/programming/assessments" element={<AppShell><MasterAdminAssessmentList /></AppShell>} />
        <Route path="/master-admin/programming/assessments/create" element={<AppShell><MasterAdminAssessmentForm /></AppShell>} />
        <Route path="/master-admin/programming/assessments/:assessmentId/problems" element={<AppShell><MasterAdminAssessmentForm /></AppShell>} />
        <Route path="/master-admin/programming/assessments/:assessmentId/results" element={<AppShell><MasterAdminAssessmentResults /></AppShell>} />
      </Route>

      <Route element={<RoleGuard role="student" />}>
        <Route element={<PortalSidebar role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/assessments" element={<PortalStudentAssessments />} />
          <Route path="/student/assessments/:id/start" element={<PortalStartAssessment />} />
          <Route path="/student/results" element={<PortalStudentResults />} />
          <Route path="/student/results/:attemptId" element={<PortalResultDetails />} />
          <Route path="/student/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={["admin"]} />}>
        <Route path="/admin/programming" element={<AppShell><AdminProgrammingProblems /></AppShell>} />
        <Route path="/admin/programming/create" element={<AppShell><AdminProgrammingProblemForm /></AppShell>} />
        <Route path="/admin/programming/:id/edit" element={<AppShell><AdminProgrammingProblemForm /></AppShell>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
