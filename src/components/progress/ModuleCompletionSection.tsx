
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { moduleCompletionData } from "@/data/progressData";

export const ModuleCompletionSection = () => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-medium">Module Completion</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {moduleCompletionData().map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-gray-500">{item.completion}%</span>
              </div>
              <ProgressBar value={item.completion} className="h-2" style={{ backgroundColor: `${item.color}40` }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.completion}%`, backgroundColor: item.color }}
                />
              </ProgressBar>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
