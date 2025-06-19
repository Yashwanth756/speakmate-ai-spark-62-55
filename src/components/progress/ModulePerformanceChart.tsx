
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { moduleCompletionData } from "@/data/progressData";

export const ModulePerformanceChart = () => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-medium">Module Performance</h2>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={moduleCompletionData()}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completion" name="Completion">
              {moduleCompletionData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
