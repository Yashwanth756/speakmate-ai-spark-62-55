import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Calendar, BarChart2 } from "lucide-react";
import { OverviewTabContent } from "@/components/progress/OverviewTabContent";
import { ActivityLogSection } from "@/components/progress/ActivityLogSection";
import { AchievementsSection } from "@/components/progress/AchievementsSection";

const Progress = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center px-2 py-8 md:p-12">
          <header className="w-full max-w-6xl mb-8">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-primary mb-2">Progress Report</h1>
            <p className="text-gray-600">Track your English learning journey across all modules</p>
          </header>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full max-w-6xl"
          >
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Activity Log</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Achievements</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OverviewTabContent />
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              <ActivityLogSection />
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <AchievementsSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Progress;
