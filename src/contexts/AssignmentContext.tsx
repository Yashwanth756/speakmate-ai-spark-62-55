import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
const backend_url = import.meta.env.VITE_backend_url
export interface Assignment {
  id: string;
  type: 'reflex' | 'story' | 'puzzle' | 'quick_quiz';
  title: string;
  content: string;
  targetClass: string;
  targetSection: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  status: 'draft' | 'published' | 'archived';
  isRequired?: boolean;
  metadata?: {
    words?: string[];
    scrambleWords?: Array<{word: string, difficulty: 'easy' | 'medium' | 'hard'}>;
    vocabularyWords: Array<{
      word: string;
      definition: string;
      wrongDefinitions: string[];
      partOfSpeech: string;
      hint: string;
      example: string;
      difficulty?: 'easy' | 'medium' | 'hard';
    }>;
    searchWords?: Array<{word: string, definition: string, difficulty:string}>;
    difficulty?: string;
    timeLimit?: number;
    maxAttempts?: number;
    quizTimer?: number;
    questions?: {
      question: string;
      answer: string;
    }[];
  };
}

export interface StudentProgress {
  assignmentId: string;
  studentId: string;
  attempts: number;
  bestScore: number;
  timeSpent: number;
  status: 'pending' | 'in-progress' | 'completed';
  lastAttempt: string;
  responses?: string[];
}

interface AssignmentContextType {
  assignments: Assignment[];
  studentProgress: StudentProgress[];
  createAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  getAssignmentsForStudent: (studentClass: string, studentSection: string) => Assignment[];
  getAssignmentsForTeacher: (teacherClasses: string[], teacherSections: string[]) => Assignment[];
  updateStudentProgress: (progress: Partial<StudentProgress> & { assignmentId: string; studentId: string }) => void;
  getStudentProgress: (studentId: string, assignmentId: string) => StudentProgress | undefined;
  getProgressForAssignment: (assignmentId: string) => StudentProgress[];
  markAssignmentAsRequired: (id: string, isRequired: boolean) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);


export const AssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  let MOCK_PROGRESS: StudentProgress[] = [
    {
      assignmentId: '3',
      studentId: 'alice_johnson',
      attempts: 2,
      bestScore: 80,
      timeSpent: 120,
      status: 'completed',
      lastAttempt: '2024-06-12T08:30:00Z'
    }
  ];
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>(MOCK_PROGRESS);
  

  // ✅ Fetch assignments for logged-in teacher
  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const email = user?.email || userSession.email || "";
    const fetchAssignmentsForTeacher = async () => {
      
      try {
        

        if (!email) {
          console.warn("No teacher email found, skipping fetch.");
          return;
        }

        const res = await fetch(backend_url + 'get-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data.assignments)) {
          console.log('Fetched assignments:', data.assignments);
          setAssignments(data.assignments);
        } else {
          console.warn('Invalid assignments format from server:', data);
          setAssignments([]);
        }
      } catch (err) {
        console.error('Error fetching assignments for teacher:', err);
        setAssignments([]);
      }

      await fetch(backend_url+"teacher-assignments-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherEmail: email })
      })
      .then(res => res.json())
      .then(data => {
        setStudentProgress(data)
      console.log('assighments',data, MOCK_PROGRESS);
      
      });
    };
    if (userSession.role === 'teacher' || user?.role === 'teacher')  // Check if the user is a teacher
    fetchAssignmentsForTeacher();


  }, [user]);

  const createAssignment = (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRequired: true
    };
    setAssignments(prev => [...prev, newAssignment]);

    const sendAssignment = async () => {
      try {
        const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
        const email = user?.email || userSession.email || "";
        await fetch(backend_url+'add-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newAssignment })
        });
      } catch (error) {
        console.error('Error sending assignment:', error);
      }
    };
    sendAssignment();
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(assignment =>
      assignment.id === id
        ? { ...assignment, ...updates, updatedAt: new Date().toISOString() }
        : assignment
    ));
  };

  const deleteAssignment = (id: string) => {
    async function deleteAssignmentfromserver(assignmentId: string) {
      try {
        const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
        const email = user?.email || userSession.email || "";
        const response = await fetch(backend_url + 'delete-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, id: assignmentId })
        });

        const data = await response.json();
        if (response.ok) {
          console.log('Deleted successfully:', data);
          // Maybe refresh assignments or update state here
        } else {
          console.error('Error deleting:', data);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    }
    deleteAssignmentfromserver(id)
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    setStudentProgress(prev => prev.filter(progress => progress.assignmentId !== id));
  };

  const markAssignmentAsRequired = (id: string, isRequired: boolean) => {
    updateAssignment(id, { isRequired });
  };

  const getAssignmentsForStudent = (studentClass: string, studentSection: string) => {
    return assignments.filter(assignment =>
      assignment.targetClass === studentClass &&
      assignment.targetSection === studentSection &&
      assignment.status === 'published'
    );
  };

  const getAssignmentsForTeacher = (teacherClasses: string[], teacherSections: string[]) => {
    return assignments.filter(assignment =>
      teacherClasses.includes(assignment.targetClass) &&
      teacherSections.includes(assignment.targetSection)
    );
  };

  const updateStudentProgress = (progressData: Partial<StudentProgress> & { assignmentId: string; studentId: string }) => {
    setStudentProgress(prev => {
      const existingIndex = prev.findIndex(p =>
        p.assignmentId === progressData.assignmentId && p.studentId === progressData.studentId
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...progressData, lastAttempt: new Date().toISOString() };
        return updated;
      } else {
        return [...prev, {
          assignmentId: progressData.assignmentId,
          studentId: progressData.studentId,
          attempts: 1,
          bestScore: 0,
          timeSpent: 0,
          status: 'pending',
          lastAttempt: new Date().toISOString(),
          ...progressData
        } as StudentProgress];
      }
    });
  };

  const getStudentProgress = (studentId: string, assignmentId: string) => {
  // fetch("http://localhost:5000/student-assignment-status", {
  // method: "POST",
  // headers: { "Content-Type": "application/json" },
  // body: JSON.stringify({
  //   studentEmail: studentId+"@gmail.com", 
  //   assignmentId: assignmentId
  // })
  // })
  // .then(res => res.json())
  // .then(data => {
  // console.log(data.percentage);
  // // {
  // //   assignmentId: "...",
  // //   studentEmail: "...",
  // //   totalItems: 3,
  // //   completedItems: 2,
  // //   percentage: 66.67
  // // }
  // });
  // console.log(studentProgress)
    return studentProgress.find(p => p.studentId === studentId+"@gmail.com" && p.assignmentId === assignmentId);
    // return 0
  };

  const getProgressForAssignment = (assignmentId: string) => {
    return studentProgress.filter(p => p.assignmentId === assignmentId);
  };

  return (
    <AssignmentContext.Provider value={{
      assignments,
      studentProgress,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      getAssignmentsForStudent,
      getAssignmentsForTeacher,
      updateStudentProgress,
      getStudentProgress,
      getProgressForAssignment,
      markAssignmentAsRequired
    }}>
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignments = () => {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentProvider');
  }
  return context;
};
