
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { activityLog } from "@/data/progressData";

export const ActivityLogSection = () => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-medium">Recent Activity</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityLog().map((entry, index) => (
            <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.module}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{entry.date}</span>
                </div>
                <p className="text-sm text-gray-600">{entry.activity}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{entry.score}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
