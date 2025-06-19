import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { weeklyData } from "@/data/progressData";

export const WeeklyProgressChart = () => {
  const data = weeklyData(); // assuming this returns the array you posted

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-medium">Weekly Progress</h2>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="fullDate" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="speaking" stroke="#9b87f5" />
            <Line type="monotone" dataKey="pronunciation" stroke="#33C3F0" />
            <Line type="monotone" dataKey="vocabulary" stroke="#F06292" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
