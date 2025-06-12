
import { usePerformance } from '@/contexts/PerformanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseCompletion } from '@/contexts/PerformanceContext';

export const useExerciseCompletion = () => {
  const { addExerciseCompletion } = usePerformance();
  const { user } = useAuth();

  const completeExercise = (
    exerciseType: ExerciseCompletion['exerciseType'],
    exerciseTitle: string,
    score: number,
    timeSpent: number,
    difficulty: string = 'medium'
  ) => {
    if (!user || user.role !== 'student') {
      console.warn('Exercise completion can only be tracked for students');
      return;
    }

    addExerciseCompletion({
      exerciseType,
      exerciseTitle,
      completedAt: new Date().toISOString(),
      score: Math.max(0, Math.min(100, score)), // Ensure score is between 0-100
      timeSpent: Math.max(0, timeSpent), // Ensure positive time
      difficulty,
      pointsEarned: 0 // This will be calculated in the context
    });
  };

  return {
    completeExercise
  };
};
