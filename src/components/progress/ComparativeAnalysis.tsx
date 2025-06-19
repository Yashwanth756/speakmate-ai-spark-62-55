
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar } from "lucide-react";
import { loadDailyData } from "@/data/progressData";

const chartConfig = {
  current: { label: "This Week", color: "#9b87f5" },
  previous: { label: "Last Week", color: "#e5e7eb" },
};

export const ComparativeAnalysis = () => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const getComparativeData = () => {
    if (view === 'weekly') {
      const thisWeek = loadDailyData().slice(0, 7).reverse();
      const lastWeek = loadDailyData().slice(7, 14).reverse();
      
      const modules = ['speaking', 'pronunciation', 'vocabulary', 'grammar', 'story', 'reflex'];
      
      return modules.map(module => {
        const currentAvg = thisWeek.reduce((sum, day) => sum + day[module], 0) / 7;
        const previousAvg = lastWeek.reduce((sum, day) => sum + day[module], 0) / 7;
        
        return {
          module: module.charAt(0).toUpperCase() + module.slice(1),
          current: Math.round(currentAvg),
          previous: Math.round(previousAvg),
          improvement: Math.round((currentAvg - previousAvg) * 10) / 10,
        };
      });
    } else {
      // Monthly comparison (last 15 days vs previous 15 days)
      const thisMonth = loadDailyData().slice(0, 15).reverse();
      const lastMonth = loadDailyData().slice(15, 30).reverse();
      
      const modules = ['speaking', 'pronunciation', 'vocabulary', 'grammar', 'story', 'reflex'];
      
      return modules.map(module => {
        const currentAvg = thisMonth.reduce((sum, day) => sum + day[module], 0) / 15;
        const previousAvg = lastMonth.reduce((sum, day) => sum + day[module], 0) / 15;
        
        return {
          module: module.charAt(0).toUpperCase() + module.slice(1),
          current: Math.round(currentAvg),
          previous: Math.round(previousAvg),
          improvement: Math.round((currentAvg - previousAvg) * 10) / 10,
        };
      });
    }
  };

  const data = getComparativeData();
  const overallImprovement = data.reduce((sum, item) => sum + item.improvement, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparative Performance Analysis
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={view === 'weekly' ? "default" : "outline"}
              size="sm"
              onClick={() => setView('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={view === 'monthly' ? "default" : "outline"}
              size="sm"
              onClick={() => setView('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className={`text-2xl font-bold ${overallImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallImprovement > 0 ? '+' : ''}{overallImprovement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Overall Change</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.filter(item => item.improvement > 0).length}/{data.length}
            </div>
            <div className="text-sm text-gray-600">Modules Improved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(...data.map(item => item.current))}%
            </div>
            <div className="text-sm text-gray-600">Best Performance</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="module" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 100]}
                fontSize={12}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'current' ? `This ${view === 'weekly' ? 'Week' : 'Month'}` : `Last ${view === 'weekly' ? 'Week' : 'Month'}`
                    ]}
                    labelFormatter={(label) => `Module: ${label}`}
                  />
                }
              />
              <Legend />
              
              <Bar
                dataKey="previous"
                fill={chartConfig.previous.color}
                name={`Last ${view === 'weekly' ? 'Week' : 'Month'}`}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="current"
                fill={chartConfig.current.color}
                name={`This ${view === 'weekly' ? 'Week' : 'Month'}`}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <div key={item.module} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm">{item.module}</h4>
                <div className={`text-sm font-bold ${item.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.improvement > 0 ? '+' : ''}{item.improvement}%
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Current: {item.current}% | Previous: {item.previous}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
