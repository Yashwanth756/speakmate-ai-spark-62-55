
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Clock, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useAuth } from "@/contexts/AuthContext";

// Mock student data
const MOCK_STUDENTS = [
  { id: 'alice_johnson', name: 'Alice Johnson', class: 'Class 8', section: 'A' },
  { id: 'bob_smith', name: 'Bob Smith', class: 'Class 8', section: 'A' },
  { id: 'carol_white', name: 'Carol White', class: 'Class 8', section: 'B' },
  { id: 'david_brown', name: 'David Brown', class: 'Class 9', section: 'A' }
];

interface StudentActivityTrackerProps {
  selectedClass: string;
  selectedSection: string;
}

export const StudentActivityTracker: React.FC<StudentActivityTrackerProps> = ({
  selectedClass,
  selectedSection
}) => {
  const { user } = useAuth();
  const { 
    assignments, 
    studentProgress,
    getAssignmentsForTeacher,
    getProgressForAssignment,
    getStudentProgress
  } = useAssignments();

  const teacherAssignments = getAssignmentsForTeacher(user?.classes || [], user?.sections || []);
  const filteredAssignments = teacherAssignments.filter(assignment =>
    (!selectedClass || selectedClass === 'all-classes' || assignment.targetClass === selectedClass) &&
    (!selectedSection || selectedSection === 'all-sections' || assignment.targetSection === selectedSection)
  );

  const filteredStudents = MOCK_STUDENTS.filter(student =>
    (!selectedClass || selectedClass === 'all-classes' || student.class === selectedClass) &&
    (!selectedSection || selectedSection === 'all-sections' || student.section === selectedSection) &&
    user?.classes.includes(student.class) &&
    user?.sections.includes(student.section)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const calculateOverallProgress = (studentId: string) => {
    const studentAssignments = filteredAssignments.length;
    if (studentAssignments === 0) return 0;
    
    const completedAssignments = filteredAssignments.filter(assignment => {
      const progress = getStudentProgress(studentId, assignment.id);
      return progress?.status === 'completed';
    }).length;
    
    return Math.round((completedAssignments / studentAssignments) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
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
            <Target className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{filteredAssignments.length}</p>
              <p className="text-sm text-muted-foreground">Active Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {filteredStudents.reduce((total, student) => {
                  const progress = calculateOverallProgress(student.id);
                  return total + (progress === 100 ? 1 : 0);
                }, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Students Complete</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {Math.round(filteredStudents.reduce((total, student) => 
                  total + calculateOverallProgress(student.id), 0) / (filteredStudents.length || 1))}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class/Section</TableHead>
                  <TableHead>Overall Progress</TableHead>
                  {filteredAssignments.slice(0, 3).map(assignment => (
                    <TableHead key={assignment.id}>
                      {assignment.title.substring(0, 15)}...
                    </TableHead>
                  ))}
                  <TableHead>Total Time</TableHead>
                  <TableHead>Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const overallProgress = calculateOverallProgress(student.id);
                  const studentProgressData = studentProgress.filter(p => p.studentId === student.id);
                  const totalTime = studentProgressData.reduce((sum, p) => sum + p.timeSpent, 0);
                  const avgScore = studentProgressData.length > 0 
                    ? Math.round(studentProgressData.reduce((sum, p) => sum + p.bestScore, 0) / studentProgressData.length)
                    : 0;

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">@{student.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{student.class} - {student.section}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{overallProgress}%</span>
                          </div>
                          <Progress value={overallProgress} className="h-2" />
                        </div>
                      </TableCell>
                      {filteredAssignments.slice(0, 3).map(assignment => {
                        const progress = getStudentProgress(student.id, assignment.id);
                        return (
                          <TableCell key={assignment.id}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(progress?.status || 'pending')}
                              {progress && (
                                <Badge variant="outline" className={getScoreColor(progress.bestScore)}>
                                  {progress.bestScore}%
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{totalTime}m</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getScoreColor(avgScore)}>
                          {avgScore}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
