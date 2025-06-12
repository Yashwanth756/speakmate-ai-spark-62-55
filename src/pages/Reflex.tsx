
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Clock, ArrowLeft } from "lucide-react";
import { ChallengeSession } from "@/components/reflex/ChallengeSession";
import { useAssignment } from "@/hooks/use-assignment";
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignments } from '@/contexts/AssignmentContext';

export default function Reflex() {
  const { assignment, loading, error, isAssignmentMode } = useAssignment();
  const { user } = useAuth();
  const { updateStudentProgress, getStudentProgress } = useAssignments();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleChallengeComplete = (score: number, timeSpent: number) => {
    if (assignment && user) {
      updateStudentProgress({
        assignmentId: assignment.id,
        studentId: user.id,
        status: 'completed',
        attempts: 1,
        bestScore: score,
        timeSpent: timeSpent
      });
      setIsCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assignment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold text-red-800 mb-2">Assignment Loading Error</h3>
              <p className="text-red-600 mb-4">
                Oops! Something went wrong while loading the assignment. Please try again or contact your teacher.
              </p>
              <Link to="/student/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-green-800 mb-2">Assignment Completed!</h3>
              <p className="text-green-600 mb-4">
                Outstanding! You've successfully completed this reflex challenge assignment.
              </p>
              <Link to="/student/dashboard">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if student has already completed this assignment
  const progress = assignment && user ? getStudentProgress(user.id, assignment.id) : null;
  const alreadyCompleted = progress?.status === 'completed';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {isAssignmentMode && assignment && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Assignment: {assignment.title}</CardTitle>
                {assignment.isRequired && (
                  <Badge variant="destructive">Required</Badge>
                )}
              </div>
              <Link to="/student/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">{assignment.content}</p>
            <div className="flex items-center gap-4 text-sm text-yellow-600">
              <span>Created by: {assignment.createdBy}</span>
              {assignment.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            {assignment.metadata?.timeLimit && (
              <div className="mt-2">
                <span className="text-sm text-yellow-600">Time limit: </span>
                <span className="text-sm font-medium text-yellow-800">
                  {assignment.metadata.timeLimit} seconds
                </span>
              </div>
            )}
            {alreadyCompleted && (
              <Badge variant="success" className="mt-2">
                Already Completed
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <ChallengeSession 
        prompt={assignment?.content || "Default reflex challenge for practice"}
        timeLimit={assignment?.metadata?.timeLimit || 300}
        onComplete={isAssignmentMode ? handleChallengeComplete : undefined}
        isAssignment={isAssignmentMode}
      />
    </div>
  );
}
