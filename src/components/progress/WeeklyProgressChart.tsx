
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProgress } from "@/data/hooks/useStudentProgress";
import { format, subDays } from "date-fns";

export const WeeklyProgressChart = () => {
  const { user } = useAuth();
  const studentId = user?.email || user?.id;
  const { data, isLoading } = useStudentProgress(studentId);

  // Build week-long stats: For each day, sum average of scores for assignments completed that day
  const weeklyData = useMemo(() => {
    if (!data || !data.progress) return [];
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const key = format(day, "yyyy-MM-dd");
      // Here: pick progress by "updated that day". You may want to store updatedAt in your schema for best accuracy.
      const progresses = data.progress.filter(
        (p: any) => (p.updatedAt ? format(new Date(p.updatedAt), "yyyy-MM-dd") : null) === key
      );
      stats.push({
        name: format(day, "EE dd"),
        Score: progresses.length 
          ? Math.round(progresses.reduce((s: number, p: any) => s + (p.bestScore || 0), 0) / progresses.length) 
          : 0
      });
    }
    return stats;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-medium">Weekly Progress</h2>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] bg-gray-50 flex items-center justify-center text-gray-400 font-medium animate-pulse">
            Loading weekly progress...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Score" stroke="#9b87f5" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
