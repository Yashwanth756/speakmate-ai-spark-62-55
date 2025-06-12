
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  class: string;
  section: string;
  totalPoints: number;
  completedExercises: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: string;
  exerciseHistory: ExerciseCompletion[];
  badges: string[];
  streak: number;
  level: string;
}

export interface ExerciseCompletion {
  id: string;
  exerciseType: 'story' | 'reflex' | 'puzzle' | 'speaking' | 'vocabulary' | 'grammar';
  exerciseTitle: string;
  completedAt: string;
  score: number;
  pointsEarned: number;
  timeSpent: number;
  difficulty: string;
}

export interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  averageClassPerformance: number;
  totalExercisesCompleted: number;
  totalTimeSpent: number;
  topPerformers: StudentPerformance[];
}

interface PerformanceContextType {
  studentPerformances: StudentPerformance[];
  teacherStats: TeacherStats;
  addExerciseCompletion: (completion: Omit<ExerciseCompletion, 'id'>) => void;
  getStudentPerformance: (studentId: string) => StudentPerformance | undefined;
  getTeacherStats: (teacherClasses: string[], teacherSections: string[]) => TeacherStats;
  resetUserData: (userId: string) => void;
  getFilteredStudents: (className?: string, section?: string) => StudentPerformance[];
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// Points system configuration
const POINTS_CONFIG = {
  story: { easy: 10, medium: 15, hard: 20 },
  reflex: { easy: 8, medium: 12, hard: 16 },
  puzzle: { easy: 12, medium: 18, hard: 25 },
  speaking: { easy: 15, medium: 20, hard: 30 },
  vocabulary: { easy: 5, medium: 8, hard: 12 },
  grammar: { easy: 8, medium: 12, hard: 18 }
};

const LEVEL_THRESHOLDS = [
  { level: 'Beginner', minPoints: 0 },
  { level: 'Intermediate', minPoints: 100 },
  { level: 'Advanced', minPoints: 300 },
  { level: 'Expert', minPoints: 600 },
  { level: 'Master', minPoints: 1000 }
];

export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);

  // Initialize or reset user data when they register/login
  useEffect(() => {
    if (user) {
      const existingPerformance = studentPerformances.find(p => p.studentId === user.id);
      
      if (!existingPerformance && user.role === 'student') {
        // Create new student performance record
        const newPerformance: StudentPerformance = {
          studentId: user.id,
          studentName: user.fullName,
          studentEmail: user.email,
          class: user.classes[0] || '',
          section: user.sections[0] || '',
          totalPoints: 0,
          completedExercises: 0,
          averageScore: 0,
          timeSpent: 0,
          lastActivity: new Date().toISOString(),
          exerciseHistory: [],
          badges: [],
          streak: 0,
          level: 'Beginner'
        };
        
        setStudentPerformances(prev => [...prev, newPerformance]);
      }
    }
  }, [user]);

  const calculateLevel = (points: number): string => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i].minPoints) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 'Beginner';
  };

  const calculatePoints = (exerciseType: keyof typeof POINTS_CONFIG, score: number, difficulty: string = 'medium'): number => {
    const basePoints = POINTS_CONFIG[exerciseType][difficulty as keyof typeof POINTS_CONFIG[typeof exerciseType]] || 10;
    const multiplier = Math.max(0.1, score / 100); // Minimum 10% of points even for low scores
    return Math.round(basePoints * multiplier);
  };

  const addExerciseCompletion = (completion: Omit<ExerciseCompletion, 'id'>) => {
    if (!user || user.role !== 'student') return;

    const completionWithId: ExerciseCompletion = {
      ...completion,
      id: Math.random().toString(36).substr(2, 9),
      pointsEarned: calculatePoints(completion.exerciseType, completion.score, completion.difficulty)
    };

    setStudentPerformances(prev => prev.map(performance => {
      if (performance.studentId === user.id) {
        const newHistory = [...performance.exerciseHistory, completionWithId];
        const newTotalPoints = performance.totalPoints + completionWithId.pointsEarned;
        const newCompletedExercises = performance.completedExercises + 1;
        const newAverageScore = newHistory.reduce((sum, ex) => sum + ex.score, 0) / newHistory.length;
        const newTimeSpent = performance.timeSpent + completion.timeSpent;
        const newLevel = calculateLevel(newTotalPoints);

        // Update streak (simplified logic)
        const lastExercise = newHistory[newHistory.length - 2];
        const isConsecutiveDay = lastExercise && 
          new Date(completion.completedAt).getDate() === new Date(lastExercise.completedAt).getDate() + 1;
        const newStreak = isConsecutiveDay ? performance.streak + 1 : 1;

        // Award badges based on achievements
        const newBadges = [...performance.badges];
        if (newCompletedExercises === 1 && !newBadges.includes('First Steps')) {
          newBadges.push('First Steps');
        }
        if (newStreak >= 7 && !newBadges.includes('Week Warrior')) {
          newBadges.push('Week Warrior');
        }
        if (newAverageScore >= 90 && !newBadges.includes('Excellence')) {
          newBadges.push('Excellence');
        }

        return {
          ...performance,
          totalPoints: newTotalPoints,
          completedExercises: newCompletedExercises,
          averageScore: Math.round(newAverageScore),
          timeSpent: newTimeSpent,
          lastActivity: completion.completedAt,
          exerciseHistory: newHistory,
          badges: newBadges,
          streak: newStreak,
          level: newLevel
        };
      }
      return performance;
    }));
  };

  const getStudentPerformance = (studentId: string): StudentPerformance | undefined => {
    return studentPerformances.find(p => p.studentId === studentId);
  };

  const getFilteredStudents = (className?: string, section?: string): StudentPerformance[] => {
    return studentPerformances.filter(student => {
      const classMatch = !className || className === 'all-classes' || student.class === className;
      const sectionMatch = !section || section === 'all-sections' || student.section === section;
      return classMatch && sectionMatch;
    });
  };

  const getTeacherStats = (teacherClasses: string[], teacherSections: string[]): TeacherStats => {
    const relevantStudents = studentPerformances.filter(student =>
      teacherClasses.includes(student.class) && teacherSections.includes(student.section)
    );

    if (relevantStudents.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        averageClassPerformance: 0,
        totalExercisesCompleted: 0,
        totalTimeSpent: 0,
        topPerformers: []
      };
    }

    const totalExercisesCompleted = relevantStudents.reduce((sum, student) => sum + student.completedExercises, 0);
    const totalTimeSpent = relevantStudents.reduce((sum, student) => sum + student.timeSpent, 0);
    const averageClassPerformance = Math.round(
      relevantStudents.reduce((sum, student) => sum + student.averageScore, 0) / relevantStudents.length
    );

    // Students who have activity in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeStudents = relevantStudents.filter(student => 
      new Date(student.lastActivity) > sevenDaysAgo
    ).length;

    // Top 3 performers by total points
    const topPerformers = relevantStudents
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);

    return {
      totalStudents: relevantStudents.length,
      activeStudents,
      averageClassPerformance,
      totalExercisesCompleted,
      totalTimeSpent,
      topPerformers
    };
  };

  const resetUserData = (userId: string) => {
    setStudentPerformances(prev => prev.filter(p => p.studentId !== userId));
  };

  return (
    <PerformanceContext.Provider value={{
      studentPerformances,
      teacherStats: user?.role === 'teacher' ? getTeacherStats(user.classes, user.sections) : {
        totalStudents: 0,
        activeStudents: 0,
        averageClassPerformance: 0,
        totalExercisesCompleted: 0,
        totalTimeSpent: 0,
        topPerformers: []
      },
      addExerciseCompletion,
      getStudentPerformance,
      getTeacherStats,
      resetUserData,
      getFilteredStudents
    }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
