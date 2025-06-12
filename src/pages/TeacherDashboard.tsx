
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock,
  Plus,
  Filter
} from "lucide-react";
import { useAuth, MOCK_CLASSES, MOCK_SECTIONS } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AssignmentManager } from "@/components/teacher/AssignmentManager";
import { RealTimeStudentTracker } from "@/components/teacher/RealTimeStudentTracker";
import { useAssignments } from "@/contexts/AssignmentContext";
import { usePerformance } from "@/contexts/PerformanceContext";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAssignmentsForTeacher } = useAssignments();
  const { getTeacherStats } = usePerformance();
  const [selectedClass, setSelectedClass] = useState(user?.classes[0] || '');
  const [selectedSection, setSelectedSection] = useState(user?.sections[0] || '');

  // Get real-time teacher statistics
  const teacherStats = getTeacherStats(user?.classes || [], user?.sections || []);
  const teacherAssignments = getAssignmentsForTeacher(user?.classes || [], user?.sections || []);
  const activeAssignments = teacherAssignments.filter(a => a.status === 'published');

  const [reflexQuestion, setReflexQuestion] = useState('');

  const handleCreateReflexChallenge = () => {
    if (!reflexQuestion.trim()) return;
    
    toast({
      title: "Reflex Challenge Created!",
      description: `Challenge assigned to ${selectedClass === 'all-classes' ? 'All Classes' : selectedClass} - Section ${selectedSection === 'all-sections' ? 'All' : selectedSection}`,
    });
    setReflexQuestion('');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName}! Manage your classes and track student progress.
          </p>
        </div>

        {/* Real-time Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{teacherStats.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{activeAssignments.length}</p>
                <p className="text-sm text-muted-foreground">Active Assignments</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{Math.round(teacherStats.totalTimeSpent / (teacherStats.totalStudents || 1))}m</p>
                <p className="text-sm text-muted-foreground">Avg Study Time</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{teacherStats.averageClassPerformance}%</p>
                <p className="text-sm text-muted-foreground">Class Average</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Student Performance</TabsTrigger>
            <TabsTrigger value="assignments">Assignment Manager</TabsTrigger>
            <TabsTrigger value="quick-create">Quick Create</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Real-time Student Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Class & Section Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-classes">All Classes</SelectItem>
                        {user?.classes.map(className => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-sections">All Sections</SelectItem>
                        {user?.sections.map(section => (
                          <SelectItem key={section} value={section}>
                            Section {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <RealTimeStudentTracker 
              selectedClass={selectedClass}
              selectedSection={selectedSection}
            />
          </TabsContent>

          {/* Assignment Manager Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <AssignmentManager 
              selectedClass={selectedClass}
              selectedSection={selectedSection}
            />
          </TabsContent>

          {/* Quick Create Tab */}
          <TabsContent value="quick-create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Reflex Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Target Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {user?.classes.map(className => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Section</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {user?.sections.map(section => (
                          <SelectItem key={section} value={section}>
                            Section {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Challenge Question</Label>
                  <Textarea
                    placeholder="Enter your reflex challenge question here..."
                    value={reflexQuestion}
                    onChange={(e) => setReflexQuestion(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateReflexChallenge} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Default View</Label>
                    <Select defaultValue="performance">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Student Performance</SelectItem>
                        <SelectItem value="assignments">Assignment Manager</SelectItem>
                        <SelectItem value="quick-create">Quick Create</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Auto-refresh Interval</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;
