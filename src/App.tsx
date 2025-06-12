
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AssignmentProvider } from "@/contexts/AssignmentContext";
import { PerformanceProvider } from "@/contexts/PerformanceContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherRegister from "./pages/TeacherRegister";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Speaking from "./pages/Speaking";
import Pronunciation from "./pages/Pronunciation";
import Vocabulary from "./pages/Vocabulary";
import Grammar from "./pages/Grammar";
import Story from "./pages/Story";
import WordPuzzle from "./pages/WordPuzzle";
import Reflex from "./pages/Reflex";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'student' | 'teacher' }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/teacher/register" element={<TeacherRegister />} />
      
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/teacher/dashboard" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/speaking" 
        element={
          <ProtectedRoute allowedRole="student">
            <Speaking />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/pronunciation" 
        element={
          <ProtectedRoute allowedRole="student">
            <Pronunciation />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/vocabulary" 
        element={
          <ProtectedRoute allowedRole="student">
            <Vocabulary />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/grammar" 
        element={
          <ProtectedRoute allowedRole="student">
            <Grammar />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/story" 
        element={
          <ProtectedRoute allowedRole="student">
            <Story />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/word-puzzle" 
        element={
          <ProtectedRoute allowedRole="student">
            <WordPuzzle />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/reflex" 
        element={
          <ProtectedRoute allowedRole="student">
            <Reflex />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AssignmentProvider>
            <PerformanceProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </PerformanceProvider>
          </AssignmentProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
