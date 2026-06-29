import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewLobby from './pages/InterviewLobby';
import CompanySelection from './pages/CompanySelection';
import AIInterviewRoom from './pages/AIInterviewRoom';
import CodingProblems from './pages/CodingProblems';

import EmotionDetection from './pages/EmotionDetection';
import ResumeUpload from './pages/ResumeUpload';
import ResumeAnalysis from './pages/ResumeAnalysis';
import ResumeBuilder from './pages/ResumeBuilder';
import ConfidenceAnalysis from './pages/ConfidenceAnalysis';
import Roadmap from './pages/Roadmap';
import JobMatching from './pages/JobMatching';
import JobMarket from './pages/JobMarket';
import Profile from './pages/Profile';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-500">
      <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full loader-spin" />
      <span>Loading…</span>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/job-market" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/job-market" /> : <Register />} />
      <Route path="/job-market" element={<ProtectedRoute><JobMarket /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/ai-interview" element={<ProtectedRoute><InterviewLobby /></ProtectedRoute>} />
      <Route path="/company-prep" element={<ProtectedRoute><CompanySelection /></ProtectedRoute>} />
      <Route path="/ai-interview/:roundType" element={<ProtectedRoute><AIInterviewRoom /></ProtectedRoute>} />
      <Route path="/coding" element={<ProtectedRoute><CodingProblems /></ProtectedRoute>} />

      {/* <Route path="/emotion" element={<ProtectedRoute><EmotionDetection /></ProtectedRoute>} /> */}
      <Route path="/confidence" element={<ProtectedRoute><ConfidenceAnalysis /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
      <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
      <Route path="/resume/:id/analysis" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
      <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
      <Route path="/job-matching" element={<ProtectedRoute><JobMatching /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
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
