import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InterviewLobby = lazy(() => import('./pages/InterviewLobby'));
const CompanySelection = lazy(() => import('./pages/CompanySelection'));
const AIInterviewRoom = lazy(() => import('./pages/AIInterviewRoom'));
const CodingProblems = lazy(() => import('./pages/CodingProblems'));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'));
const ResumeAnalysis = lazy(() => import('./pages/ResumeAnalysis'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const ConfidenceAnalysis = lazy(() => import('./pages/ConfidenceAnalysis'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const JobMatching = lazy(() => import('./pages/JobMatching'));
const JobMarket = lazy(() => import('./pages/JobMarket'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-500">
      <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" />
      <span>Loading...</span>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/job-market" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/job-market" /> : <Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/job-market" element={<ProtectedRoute><JobMarket /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ai-interview" element={<ProtectedRoute><InterviewLobby /></ProtectedRoute>} />
        <Route path="/company-prep" element={<ProtectedRoute><CompanySelection /></ProtectedRoute>} />
        <Route path="/ai-interview/:roundType" element={<ProtectedRoute><AIInterviewRoom /></ProtectedRoute>} />
        <Route path="/coding" element={<ProtectedRoute><CodingProblems /></ProtectedRoute>} />
        <Route path="/confidence" element={<ProtectedRoute><ConfidenceAnalysis /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
        <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        <Route path="/resume/:id/analysis" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="/job-matching" element={<ProtectedRoute><JobMatching /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

function AppShell() {
  const { user } = useAuth();

  return (
    <ProfileProvider currentUser={user}>
      <AppRoutes />
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
