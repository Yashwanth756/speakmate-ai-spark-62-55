
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AssignmentProvider } from '@/contexts/AssignmentContext';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import TeacherLogin from '@/pages/TeacherLogin';
import Register from '@/pages/Register';
import TeacherRegister from '@/pages/TeacherRegister';
import StudentDashboard from '@/pages/StudentDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import Speaking from '@/pages/Speaking';
import Pronunciation from '@/pages/Pronunciation';
import MirrorPractice from '@/pages/MirrorPractice';
import Conversation from '@/pages/Conversation';
import Vocabulary from '@/pages/Vocabulary';
import Grammar from '@/pages/Grammar';
import Story from '@/pages/Story';
import WordPuzzle from '@/pages/WordPuzzle';
import Progress from '@/pages/Progress';
import Settings from '@/pages/Settings';
import Reflex from '@/pages/Reflex';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <AssignmentProvider>
        <Router>
          <ConversationProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/teacher-login" element={<TeacherLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/teacher-register" element={<TeacherRegister />} />
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/speaking" element={<Speaking />} />
                <Route path="/pronunciation" element={<Pronunciation />} />
                <Route path="/mirror-practice" element={<MirrorPractice />} />
                <Route path="/conversation" element={<Conversation />} />
                <Route path="/vocabulary" element={<Vocabulary />} />
                <Route path="/grammar" element={<Grammar />} />
                <Route path="/story" element={<Story />} />
                <Route path="/word-puzzle" element={<WordPuzzle />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reflex" element={<Reflex />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </ConversationProvider>
        </Router>
      </AssignmentProvider>
    </AuthProvider>
  );
}

export default App;
