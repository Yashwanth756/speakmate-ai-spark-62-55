
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface ReflexAssignment {
  id: string;
  question: string;
  assignedBy: string;
  dueDate: string;
  targetClass: string;
  targetSection: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface StoryAssignment {
  id: string;
  title: string;
  content: string;
  assignedBy: string;
  targetClass: string;
  targetSection: string;
  status: 'assigned' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface PuzzleAssignment {
  id: string;
  title: string;
  words: string[];
  assignedBy: string;
  targetClass: string;
  targetSection: string;
  attempts: number;
  bestScore: number;
  createdAt: string;
}

export interface AssignmentContextType {
  reflexAssignments: ReflexAssignment[];
  storyAssignments: StoryAssignment[];
  puzzleAssignments: PuzzleAssignment[];
  createReflexAssignment: (assignment: Omit<ReflexAssignment, 'id' | 'createdAt' | 'status'>) => void;
  createStoryAssignment: (assignment: Omit<StoryAssignment, 'id' | 'createdAt' | 'status'>) => void;
  createPuzzleAssignment: (assignment: Omit<PuzzleAssignment, 'id' | 'createdAt' | 'attempts' | 'bestScore'>) => void;
  getStudentAssignments: (studentClass: string, studentSection: string) => {
    reflexChallenges: ReflexAssignment[];
    stories: StoryAssignment[];
    puzzles: PuzzleAssignment[];
  };
  updateAssignmentStatus: (type: 'reflex' | 'story' | 'puzzle', id: string, status: string) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

// Mock initial assignments for demonstration
const INITIAL_ASSIGNMENTS = {
  reflex: [
    {
      id: 'reflex-1',
      question: "Describe the importance of environmental conservation in modern society.",
      assignedBy: "Ms. Johnson",
      dueDate: "Today",
      targetClass: "Class 8",
      targetSection: "A",
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    }
  ],
  story: [
    {
      id: 'story-1',
      title: "The Time Traveler's Dilemma",
      content: "Sarah discovered an old pocket watch in her grandmother's attic. When she wound it, strange things began to happen...",
      assignedBy: "Ms. Johnson",
      targetClass: "Class 8",
      targetSection: "A",
      status: 'assigned' as const,
      createdAt: new Date().toISOString()
    }
  ],
  puzzle: [
    {
      id: 'puzzle-1',
      title: "Science Vocabulary Challenge",
      words: ["experiment", "hypothesis", "analysis", "conclusion", "laboratory"],
      assignedBy: "Ms. Johnson",
      targetClass: "Class 8",
      targetSection: "A",
      attempts: 2,
      bestScore: 80,
      createdAt: new Date().toISOString()
    }
  ]
};

export const AssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reflexAssignments, setReflexAssignments] = useState<ReflexAssignment[]>(INITIAL_ASSIGNMENTS.reflex);
  const [storyAssignments, setStoryAssignments] = useState<StoryAssignment[]>(INITIAL_ASSIGNMENTS.story);
  const [puzzleAssignments, setPuzzleAssignments] = useState<PuzzleAssignment[]>(INITIAL_ASSIGNMENTS.puzzle);

  const createReflexAssignment = (assignment: Omit<ReflexAssignment, 'id' | 'createdAt' | 'status'>) => {
    const newAssignment: ReflexAssignment = {
      ...assignment,
      id: `reflex-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setReflexAssignments(prev => [...prev, newAssignment]);
  };

  const createStoryAssignment = (assignment: Omit<StoryAssignment, 'id' | 'createdAt' | 'status'>) => {
    const newAssignment: StoryAssignment = {
      ...assignment,
      id: `story-${Date.now()}`,
      status: 'assigned',
      createdAt: new Date().toISOString()
    };
    setStoryAssignments(prev => [...prev, newAssignment]);
  };

  const createPuzzleAssignment = (assignment: Omit<PuzzleAssignment, 'id' | 'createdAt' | 'attempts' | 'bestScore'>) => {
    const newAssignment: PuzzleAssignment = {
      ...assignment,
      id: `puzzle-${Date.now()}`,
      attempts: 0,
      bestScore: 0,
      createdAt: new Date().toISOString()
    };
    setPuzzleAssignments(prev => [...prev, newAssignment]);
  };

  const getStudentAssignments = (studentClass: string, studentSection: string) => {
    return {
      reflexChallenges: reflexAssignments.filter(
        assignment => assignment.targetClass === studentClass && assignment.targetSection === studentSection
      ),
      stories: storyAssignments.filter(
        assignment => assignment.targetClass === studentClass && assignment.targetSection === studentSection
      ),
      puzzles: puzzleAssignments.filter(
        assignment => assignment.targetClass === studentClass && assignment.targetSection === studentSection
      )
    };
  };

  const updateAssignmentStatus = (type: 'reflex' | 'story' | 'puzzle', id: string, status: string) => {
    switch (type) {
      case 'reflex':
        setReflexAssignments(prev => 
          prev.map(assignment => 
            assignment.id === id ? { ...assignment, status: status as ReflexAssignment['status'] } : assignment
          )
        );
        break;
      case 'story':
        setStoryAssignments(prev => 
          prev.map(assignment => 
            assignment.id === id ? { ...assignment, status: status as StoryAssignment['status'] } : assignment
          )
        );
        break;
      case 'puzzle':
        setPuzzleAssignments(prev => 
          prev.map(assignment => 
            assignment.id === id ? { ...assignment, attempts: assignment.attempts + 1 } : assignment
          )
        );
        break;
    }
  };

  return (
    <AssignmentContext.Provider value={{
      reflexAssignments,
      storyAssignments,
      puzzleAssignments,
      createReflexAssignment,
      createStoryAssignment,
      createPuzzleAssignment,
      getStudentAssignments,
      updateAssignmentStatus
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
