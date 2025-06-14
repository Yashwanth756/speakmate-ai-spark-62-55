import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Trophy, 
  BookOpen, 
  Zap, 
  Puzzle, 
  TrendingUp, 
  Clock,
  Award,
  Plus,
  Eye,
  Filter
} from "lucide-react";
import { useAuth, MOCK_CLASSES, MOCK_SECTIONS } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AssignmentManager } from "@/components/teacher/AssignmentManager";
import { StudentActivityTracker } from "@/components/teacher/StudentActivityTracker";
import { useAssignments } from "@/contexts/AssignmentContext";

// Mock student data
const MOCK_STUDENTS = [
  {
    id: '1',
    username: 'alice_johnson',
    fullName: 'Alice Johnson',
    class: 'Class 8',
    section: 'A',
    speaking: 85,
    pronunciation: 78,
    vocabulary: 92,
    grammar: 88,
    story: 90,
    reflex: 75,
    timeSpent: 120,
    overall: 86
  },
  {
    id: '2',
    username: 'bob_smith',
    fullName: 'Bob Smith',
    class: 'Class 8',
    section: 'A',
    speaking: 65,
    pronunciation: 60,
    vocabulary: 70,
    grammar: 55,
    story: 68,
    reflex: 58,
    timeSpent: 95,
    overall: 63
  },
  {
    id: '3',
    username: 'carol_white',
    fullName: 'Carol White',
    class: 'Class 8',
    section: 'B',
    speaking: 95,
    pronunciation: 88,
    vocabulary: 96,
    grammar: 92,
    story: 94,
    reflex: 89,
    timeSpent: 180,
    overall: 92
  },
  {
    id: '4',
    username: 'david_brown',
    fullName: 'David Brown',
    class: 'Class 9',
    section: 'A',
    speaking: 40,
    pronunciation: 35,
    vocabulary: 45,
    grammar: 38,
    story: 42,
    reflex: 36,
    timeSpent: 45,
    overall: 39
  }
];

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAssignmentsForTeacher, getProgressForAssignment } = useAssignments();
  const [selectedClass, setSelectedClass] = useState(user?.classes[0] || '');
  const [selectedSection, setSelectedSection] = useState(user?.sections[0] || '');
  const [sortBy, setSortBy] = useState('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get assignments data from context
  const teacherAssignments = getAssignmentsForTeacher(user?.classes || [], user?.sections || []);
  const activeAssignments = teacherAssignments.filter(a => a.status === 'published');

  // Filter students based on teacher's classes/sections and selected filters
  const filteredStudents = MOCK_STUDENTS.filter(student => 
    (!selectedClass || selectedClass === 'all-classes' || student.class === selectedClass) &&
    (!selectedSection || selectedSection === 'all-sections' || student.section === selectedSection) &&
    user?.classes.includes(student.class) &&
    user?.sections.includes(student.section)
  ).sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] as number;
    const bValue = b[sortBy as keyof typeof b] as number;
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const topPerformers = filteredStudents.slice(0, 3);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [puzzleTitle, setPuzzleTitle] = useState('');
  const [puzzleWords, setPuzzleWords] = useState('');

  const handleCreateStory = () => {
    if (!storyTitle.trim() || !storyContent.trim()) return;
    toast({
      title: "Story Created!",
      description: `"${storyTitle}" assigned to ${selectedClass === 'all-classes' ? 'All Classes' : selectedClass} - Section ${selectedSection === 'all-sections' ? 'All' : selectedSection}`,
    });
    setStoryTitle('');
    setStoryContent('');
  };

  const handleCreatePuzzle = () => {
    if (!puzzleTitle.trim() || !puzzleWords.trim()) return;
    toast({
      title: "Word Puzzle Created!",
      description: `"${puzzleTitle}" assigned to ${selectedClass === 'all-classes' ? 'All Classes' : selectedClass} - Section ${selectedSection === 'all-sections' ? 'All' : selectedSection}`,
    });
    setPuzzleTitle('');
    setPuzzleWords('');
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
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
                <p className="text-2xl font-bold">{Math.round(filteredStudents.reduce((sum, s) => sum + s.timeSpent, 0) / filteredStudents.length || 0)}m</p>
                <p className="text-sm text-muted-foreground">Avg Study Time</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{user?.classes.length}</p>
                <p className="text-sm text-muted-foreground">Your Classes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assignments">Assignment Manager</TabsTrigger>
            <TabsTrigger value="activity">Student Activity</TabsTrigger>
            <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Assignment Manager Tab */}
          <TabsContent value="assignments" className="space-y-6">
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

            <AssignmentManager 
              selectedClass={selectedClass}
              selectedSection={selectedSection}
            />
          </TabsContent>

          {/* Student Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <StudentActivityTracker 
              selectedClass={selectedClass}
              selectedSection={selectedSection}
            />
          </TabsContent>

          {/* Performance Analytics Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Sorting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes" />
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
                        <SelectValue placeholder="All Sections" />
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
                  <div>
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overall">Overall %</SelectItem>
                        <SelectItem value="speaking">Speaking</SelectItem>
                        <SelectItem value="pronunciation">Pronunciation</SelectItem>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="timeSpent">Time Spent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Order</Label>
                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Highest First</SelectItem>
                        <SelectItem value="asc">Lowest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top 3 Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topPerformers.map((student, index) => (
                    <Card key={student.id} className="border-2 border-yellow-200 bg-yellow-50/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Trophy className={`h-6 w-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'}`} />
                          <span className="font-bold">#{index + 1}</span>
                        </div>
                        <h3 className="font-semibold">{student.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{student.class} - {student.section}</p>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-green-600">{student.overall}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Student Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Student Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class/Section</TableHead>
                        <TableHead>Speaking</TableHead>
                        <TableHead>Pronunciation</TableHead>
                        <TableHead>Vocabulary</TableHead>
                        <TableHead>Grammar</TableHead>
                        <TableHead>Story</TableHead>
                        <TableHead>Reflex</TableHead>
                        <TableHead>Time (min)</TableHead>
                        <TableHead>Overall %</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-sm text-muted-foreground">@{student.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>{student.class} - {student.section}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(student.speaking)}>
                              {student.speaking}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(student.pronunciation)}>
                              {student.pronunciation}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(student.vocabulary)}>
                              {student.vocabulary}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(student.grammar)}>
                              {student.grammar}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(student.story)}>
                              {student.story}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScoreColor(student.reflex)}>
                              {student.reflex}%
                            </Badge>
                          </TableCell>
                          <TableCell>{student.timeSpent}m</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className={getScoreColor(student.overall)}>
                                {student.overall}%
                              </Badge>
                              <Progress value={student.overall} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                    <Select defaultValue="assignments">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignments">Assignment Manager</SelectItem>
                        <SelectItem value="activity">Student Activity</SelectItem>
                        <SelectItem value="performance">Performance Analytics</SelectItem>
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
