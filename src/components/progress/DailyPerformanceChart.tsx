
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, Clock } from "lucide-react";
import { loadDailyData } from "@/data/progressData";

const chartConfig = {
  speaking: { label: "Speaking", color: "#9b87f5" },
  pronunciation: { label: "Pronunciation", color: "#33C3F0" },
  vocabulary: { label: "Vocabulary", color: "#F06292" },
  grammar: { label: "Grammar", color: "#AED581" },
  story: { label: "Story", color: "#FFD54F" },
  reflex: { label: "Reflex", color: "#FF7043" },
};

export const DailyPerformanceChart = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [selectedModules, setSelectedModules] = useState<string[]>(['speaking', 'pronunciation', 'vocabulary']);

  const getFilteredData = () => {
   if (timeRange === '7d') {
      return loadDailyData().slice(0, 7).reverse();
    }
    if (timeRange === '14d') {
      return loadDailyData().slice(0, 14).reverse();
    }
    return loadDailyData().slice(0, 30).reverse();
  };

  const toggleModule = (module: string) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const data = getFilteredData();
  const averagePerformance = selectedModules.reduce((sum, module) => {
    const moduleAvg = data.reduce((moduleSum, day) => moduleSum + day[module], 0) / data.length;
    return sum + moduleAvg;
  }, 0) / selectedModules.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Performance Tracking
          </CardTitle>
          <div className="flex gap-2">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(chartConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedModules.includes(key) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleModule(key)}
              className="text-xs"
              style={{
                backgroundColor: selectedModules.includes(key) ? config.color : undefined,
                borderColor: config.color,
              }}
            >
              {config.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(averagePerformance)}%
            </div>
            <div className="text-sm text-gray-600">Average Performance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.length}
            </div>
            <div className="text-sm text-gray-600">Days Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(data.reduce((sum, day) => sum + day.totalTime, 0) / data.length)}m
            </div>
            <div className="text-sm text-gray-600">Avg Daily Time</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="fullDate" 
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                domain={[0, 100]}
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [
                      `${Math.round(Number(value))}%`,
                      chartConfig[name as keyof typeof chartConfig]?.label || name
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                }
              />
              <Legend />
              
              {selectedModules.map((module) => (
                <Line
                  key={module}
                  type="monotone"
                  dataKey={module}
                  stroke={chartConfig[module as keyof typeof chartConfig].color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={chartConfig[module as keyof typeof chartConfig].label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
