
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock,
  Star,
  Target,
  Award,
  Zap
} from "lucide-react";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useAuth } from "@/contexts/AuthContext";

interface RealTimeStudentTrackerProps {
  selectedClass: string;
  selectedSection: string;
}

export const RealTimeStudentTracker: React.FC<RealTimeStudentTrackerProps> = ({
  selectedClass,
  selectedSection
}) => {
  const { user } = useAuth();
  const { getFilteredStudents, getTeacherStats } = usePerformance();
  const [sortBy, setSortBy] = useState<'totalPoints' | 'averageScore' | 'completedExercises' | 'timeSpent'>('totalPoints');

  if (!user || user.role !== 'teacher') return null;

  const filteredStudents = getFilteredStudents(selectedClass, selectedSection)
    .filter(student => 
      user.classes.includes(student.class) && user.sections.includes(student.section)
    )
    .sort((a, b) => {
      if (sortBy === 'totalPoints') return b.totalPoints - a.totalPoints;
      if (sortBy === 'averageScore') return b.averageScore - a.averageScore;
      if (sortBy === 'completedExercises') return b.completedExercises - a.completedExercises;
      if (sortBy === 'timeSpent') return b.timeSpent - a.timeSpent;
      return 0;
    });

  const teacherStats = getTeacherStats(user.classes, user.sections);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getActivityStatus = (lastActivity: string) => {
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity === 0) return { status: 'Today', color: 'bg-green-500' };
    if (daysSinceActivity <= 3) return { status: `${daysSinceActivity}d ago`, color: 'bg-yellow-500' };
    if (daysSinceActivity <= 7) return { status: `${daysSinceActivity}d ago`, color: 'bg-orange-500' };
    return { status: 'Inactive', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      {/* Real-time Overview Stats */}
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
            <Zap className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{teacherStats.activeStudents}</p>
              <p className="text-sm text-muted-foreground">Active This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{teacherStats.totalExercisesCompleted}</p>
              <p className="text-sm text-muted-foreground">Exercises Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{teacherStats.averageClassPerformance}%</p>
              <p className="text-sm text-muted-foreground">Class Average</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {teacherStats.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teacherStats.topPerformers.map((student, index) => (
                <Card key={student.studentId} className="border-2 border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className={`h-6 w-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'}`} />
                      <span className="font-bold">#{index + 1}</span>
                    </div>
                    <h3 className="font-semibold">{student.studentName}</h3>
                    <p className="text-sm text-muted-foreground">{student.class} - {student.section}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Points:</span>
                        <span className="font-bold text-primary">{student.totalPoints}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Score:</span>
                        <span className="font-bold">{student.averageScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Student Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Student Performance Tracking</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalPoints">Total Points</SelectItem>
                  <SelectItem value="averageScore">Average Score</SelectItem>
                  <SelectItem value="completedExercises">Exercises</SelectItem>
                  <SelectItem value="timeSpent">Time Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Student Data</h3>
              <p className="text-muted-foreground">
                Students in your class haven't started any exercises yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Total Points</TableHead>
                    <TableHead>Exercises</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Badges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const activityStatus = getActivityStatus(student.lastActivity);
                    
                    return (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-sm text-muted-foreground">{student.class} - {student.section}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            {student.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{student.totalPoints}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.completedExercises}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPerformanceColor(student.averageScore)}>
                            {student.averageScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{student.timeSpent}m</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span>{student.streak} days</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${activityStatus.color}`}></div>
                            <span className="text-sm">{activityStatus.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {student.badges.slice(0, 3).map((badge, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                            {student.badges.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{student.badges.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
