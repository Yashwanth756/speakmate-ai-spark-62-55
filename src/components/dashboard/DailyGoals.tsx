
import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProgress } from "@/data/hooks/useStudentProgress";

export interface Goal {
  id: string;
  name: string;
  completed: boolean;
  target: number;
  current: number;
}

export const DailyGoals: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.email || user?.id; // using email/id as unique key

  const { data, isLoading } = useStudentProgress(studentId);

  // Derive goals: each assignment becomes a goal for demo purposes.
  const goals: Goal[] = useMemo(() => {
    if (!data) return [];
    return data.assignments.map((a: any) => {
      const prog = data.progress.find((p: any) => p.assignmentId === a.id);
      return {
        id: a.id,
        name: a.title,
        completed: prog?.status === "completed",
        target: 1,
        current: prog?.status === "completed" ? 1 : 0
      };
    });
  }, [data]);

  const overallProgress = useMemo(() => {
    if (!goals.length) return 0;
    return Math.round((goals.reduce((acc, g) => acc + g.current, 0) / goals.reduce((acc, g) => acc + g.target, 0)) * 100);
  }, [goals]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span>Daily Goals</span>
          </div>
        </CardTitle>
        <div className="text-sm font-medium text-primary">
          {isLoading ? '--' : `${overallProgress}% completed`}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={overallProgress} />
        <div className="space-y-3">
          {(isLoading ? Array(3).fill(undefined) : goals).map((goal, i) =>
            goal ? (
              <div key={goal.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="text-sm flex items-center">
                    <span className={`mr-2 ${goal.completed ? 'text-primary' : 'text-gray-600'}`}>
                      {goal.name}
                    </span>
                    {goal.completed && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-1" />
              </div>
            ) : (
              // Skeleton loading state
              <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
