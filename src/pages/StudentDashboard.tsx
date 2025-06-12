import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Zap, 
  Puzzle, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Lock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { 
    getAssignmentsForStudent, 
    getStudentProgress, 
    updateStudentProgress 
  } = useAssignments();

  const studentAssignments = getAssignmentsForStudent(
    user?.class || '', 
    user?.section || ''
  );

  const requiredIncompleteAssignments = studentAssignments.filter(assignment => {
    const progress = getStudentProgress(user?.id || '', assignment.id);
    return assignment.isRequired && (!progress || progress.status !== 'completed');
  });

  const hasBlockingAssignment = requiredIncompleteAssignments.length > 0;
  const nextRequiredAssignment = requiredIncompleteAssignments[0];

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'reflex': return <Zap className="h-5 w-5" />;
      case 'story': return <BookOpen className="h-5 w-5" />;
      case 'puzzle': return <Puzzle className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  const getAssignmentPath = (assignment: any) => {
    const baseUrl = {
      'story': '/story',
      'puzzle': '/word-puzzle',
      'reflex': '/reflex'
    }[assignment.type] || '/story';
    
    return `${baseUrl}?assignmentId=${assignment.id}`;
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (hasBlockingAssignment) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
          <p className="text-muted-foreground">You have a required assignment to complete</p>
        </div>

        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">Required Assignment</CardTitle>
              <Badge variant="destructive">Must Complete</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-white rounded-lg">
                  {getAssignmentIcon(nextRequiredAssignment.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{nextRequiredAssignment.title}</h3>
                  <p className="text-muted-foreground mb-3">{nextRequiredAssignment.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="capitalize">{nextRequiredAssignment.type} Challenge</span>
                    {nextRequiredAssignment.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDueDate(nextRequiredAssignment.dueDate)}</span>
                      </div>
                    )}
                  </div>
                  <Link to={getAssignmentPath(nextRequiredAssignment)}>
                    <Button size="lg" className="w-full sm:w-auto">
                      Start Assignment
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Other Activities Locked</h3>
              <p className="text-gray-500">
                Complete your required assignment above to unlock all other dashboard features and exercises.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
        <p className="text-muted-foreground">Continue your learning journey</p>
      </div>

      {/* Assignments Section */}
      {studentAssignments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Your Assignments</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {studentAssignments.map((assignment) => {
              const progress = getStudentProgress(user?.id || '', assignment.id);
              const isCompleted = progress?.status === 'completed';
              
              return (
                <Card key={assignment.id} className={isCompleted ? 'border-green-200 bg-green-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAssignmentIcon(assignment.type)}
                        <span className="font-medium capitalize">{assignment.type}</span>
                      </div>
                      {isCompleted ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : assignment.isRequired ? (
                        <Badge variant="destructive">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-2">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {assignment.content}
                    </p>
                    {assignment.dueDate && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <Clock className="h-4 w-4" />
                        <span>{formatDueDate(assignment.dueDate)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link to={getAssignmentPath(assignment)} className="flex-1">
                        <Button variant={isCompleted ? "outline" : "default"} className="w-full">
                          {isCompleted ? 'Review' : 'Start'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <h3 className="font-semibold">Continue Learning</h3>
          <p className="text-sm text-gray-500">Explore new activities</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <div className="flex items-center">
                  <BookOpen className="mr-2 text-blue-500" />
                  <h4 className="font-medium">Story Builder</h4>
                </div>
                <p className="text-sm text-gray-500">
                  Create your own stories and share them with friends.
                </p>
                <Button variant="outline" className="mt-4">
                  Start
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center">
                  <Zap className="mr-2 text-yellow-500" />
                  <h4 className="font-medium">Reflex Challenge</h4>
                </div>
                <p className="text-sm text-gray-500">
                  Test your reflexes with timed challenges.
                </p>
                <Button variant="outline" className="mt-4">
                  Start
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center">
                  <Puzzle className="mr-2 text-green-500" />
                  <h4 className="font-medium">Word Puzzle</h4>
                </div>
                <p className="text-sm text-gray-500">
                  Improve your vocabulary with fun word puzzles.
                </p>
                <Button variant="outline" className="mt-4">
                  Start
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
