
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Assignment {
  id: string;
  type: 'reflex' | 'story' | 'puzzle';
  title: string;
  content: string;
  targetClass: string;
  targetSection: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  status: 'draft' | 'published' | 'archived';
  metadata?: {
    words?: string[];
    difficulty?: string;
    timeLimit?: number;
    maxAttempts?: number;
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
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

// Mock data for demonstration
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: '1',
    type: 'reflex',
    title: 'Environmental Conservation Challenge',
    content: 'Describe the importance of environmental conservation in modern society.',
    targetClass: 'Class 8',
    targetSection: 'A',
    createdBy: 'Ms. Johnson',
    createdAt: '2024-06-10T10:00:00Z',
    updatedAt: '2024-06-10T10:00:00Z',
    dueDate: '2024-06-15T23:59:59Z',
    status: 'published',
    metadata: {
      timeLimit: 300 // 5 minutes
    }
  },
  {
    id: '2',
    type: 'story',
    title: 'The Time Traveler\'s Dilemma',
    content: 'Sarah discovered an old pocket watch in her grandmother\'s attic. When she wound it, strange things began to happen...',
    targetClass: 'Class 8',
    targetSection: 'A',
    createdBy: 'Ms. Johnson',
    createdAt: '2024-06-11T09:00:00Z',
    updatedAt: '2024-06-11T09:00:00Z',
    status: 'published'
  },
  {
    id: '3',
    type: 'puzzle',
    title: 'Science Vocabulary Challenge',
    content: 'Word puzzle focusing on scientific terminology',
    targetClass: 'Class 8',
    targetSection: 'A',
    createdBy: 'Ms. Johnson',
    createdAt: '2024-06-09T14:00:00Z',
    updatedAt: '2024-06-09T14:00:00Z',
    status: 'published',
    metadata: {
      words: ['experiment', 'hypothesis', 'analysis', 'conclusion', 'laboratory'],
      difficulty: 'medium',
      maxAttempts: 3
    }
  }
];

const MOCK_PROGRESS: StudentProgress[] = [
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

export const AssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>(MOCK_PROGRESS);

  const createAssignment = (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id 
        ? { ...assignment, ...updates, updatedAt: new Date().toISOString() }
        : assignment
    ));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    setStudentProgress(prev => prev.filter(progress => progress.assignmentId !== id));
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
    return studentProgress.find(p => p.studentId === studentId && p.assignmentId === assignmentId);
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
      getProgressForAssignment
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
