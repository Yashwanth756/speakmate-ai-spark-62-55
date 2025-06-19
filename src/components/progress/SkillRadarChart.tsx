
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { radarData } from "@/data/progressData";

export const SkillRadarChart = () => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-medium">Skill Radar</h2>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart outerRadius={90} data={radarData()}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Skills" dataKey="value" stroke="#9b87f5" fill="#9b87f5" fillOpacity={0.5} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
