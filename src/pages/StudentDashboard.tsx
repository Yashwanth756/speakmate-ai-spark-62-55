import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Flame, 
  Clock, 
  Trophy, 
  Star, 
  Zap, 
  BookOpen, 
  Puzzle,
  TrendingUp,
  Award,
  Target,
  Send,
  Play,
  Lock,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAssignments } from "@/contexts/AssignmentContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    getAssignmentsForStudent,
    getStudentProgress,
    updateStudentProgress
  } = useAssignments();

  // Get real assignments from context instead of mock data
  const userClass = user?.classes[0] || '';
  const userSection = user?.sections[0] || '';
  const assignedContent = getAssignmentsForStudent(userClass, userSection);
  
  // Use email as student identifier since username doesn't exist on User type
  const studentId = user?.email || '';

  // Find the most recent incomplete assignment that should be prioritized
  const incompleteAssignments = assignedContent.filter(assignment => {
    const progress = getStudentProgress(studentId, assignment.id);
    return !progress || progress.status !== 'completed';
  });

  // Sort by creation date (newest first) to find the priority assignment
  const priorityAssignment = incompleteAssignments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const hasUncompletedRequiredAssignment = !!priorityAssignment;

  const reflexChallenges = assignedContent.filter(a => a.type === 'reflex');
  const stories = assignedContent.filter(a => a.type === 'story');
  const puzzles = assignedContent.filter(a => a.type === 'puzzle');

  // Mock student performance data
  const studentData = {
    currentStreak: 7,
    totalTimeSpent: 245,
    weeklyTimeSpent: 85,
    level: 'Intermediate',
    xp: 1250,
    nextLevelXP: 1500,
    badges: ['Early Bird', 'Consistent Learner', 'Grammar Master'],
    performance: {
      speaking: 85,
      pronunciation: 78,
      vocabulary: 92,
      grammar: 88,
      story: 90,
      reflex: 75
    },
    recentActivities: [
      { type: 'Reflex Challenge', score: 85, time: '2 hours ago' },
      { type: 'Story Builder', score: 90, time: '5 hours ago' },
      { type: 'Word Puzzle', score: 78, time: '1 day ago' },
      { type: 'Speaking Practice', score: 88, time: '1 day ago' }
    ]
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSubmitReflexAnswer = (assignmentId: string, answer: string) => {
    if (!answer.trim()) return;
    
    updateStudentProgress({
      assignmentId,
      studentId,
      status: 'completed',
      attempts: 1,
      bestScore: 85,
      timeSpent: 5,
      responses: [answer]
    });
    
    toast({
      title: "Assignment Completed!",
      description: "Great work! You can now access other exercises.",
    });
  };

  const handleStartActivity = (activityType: string) => {
    if (hasUncompletedRequiredAssignment) {
      toast({
        title: "Assignment Required",
        description: "Please complete your current assignment first.",
        variant: "destructive"
      });
      return;
    }

    const routes: { [key: string]: string } = {
      speaking: '/speaking',
      pronunciation: '/pronunciation',
      vocabulary: '/vocabulary',
      grammar: '/grammar',
      story: '/story',
      reflex: '/reflex',
      puzzle: '/word-puzzle'
    };
    
    if (routes[activityType]) {
      navigate(routes[activityType]);
    }
  };

  const handleCompleteAssignment = (assignmentId: string, type: string) => {
    updateStudentProgress({
      assignmentId,
      studentId,
      status: 'completed',
      attempts: 1,
      bestScore: 90,
      timeSpent: 10
    });
    
    toast({
      title: "Assignment Completed!",
      description: "Excellent! You can now access all other exercises.",
    });
  };

  // Render priority assignment view if there's an uncompleted required assignment
  if (hasUncompletedRequiredAssignment && priorityAssignment) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          {/* Priority Assignment Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Required Assignment
            </h1>
            <p className="text-muted-foreground">
              Complete this assignment to unlock your dashboard
            </p>
          </div>

          {/* Assignment Requirement Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your teacher has assigned a new task. Please complete it before accessing other activities.
            </AlertDescription>
          </Alert>

          {/* Priority Assignment Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {priorityAssignment.type === 'reflex' && <Zap className="h-5 w-5 text-yellow-500" />}
                  {priorityAssignment.type === 'story' && <BookOpen className="h-5 w-5 text-blue-500" />}
                  {priorityAssignment.type === 'puzzle' && <Puzzle className="h-5 w-5 text-green-500" />}
                  {priorityAssignment.title}
                </CardTitle>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  Required
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm mb-3">{priorityAssignment.content}</p>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>By: {priorityAssignment.createdBy}</span>
                  <span>•</span>
                  <span>
                    Due: {priorityAssignment.dueDate 
                      ? new Date(priorityAssignment.dueDate).toLocaleDateString() 
                      : 'No due date'
                    }
                  </span>
                </div>
              </div>

              {priorityAssignment.type === 'reflex' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your response here..."
                    rows={4}
                    id={`priority-challenge-${priorityAssignment.id}`}
                  />
                  <Button 
                    onClick={() => {
                      const textarea = document.getElementById(`priority-challenge-${priorityAssignment.id}`) as HTMLTextAreaElement;
                      handleSubmitReflexAnswer(priorityAssignment.id, textarea?.value || '');
                    }}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                </div>
              )}

              {priorityAssignment.type === 'story' && (
                <Button 
                  onClick={() => navigate('/story')}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Story Assignment
                </Button>
              )}

              {priorityAssignment.type === 'puzzle' && (
                <Button 
                  onClick={() => navigate('/word-puzzle')}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Solve Puzzle Assignment
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Locked Features Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Locked Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'Speaking Practice', icon: Zap },
                  { name: 'Vocabulary Trainer', icon: BookOpen },
                  { name: 'Grammar Clinic', icon: Target },
                  { name: 'Story Builder', icon: BookOpen },
                  { name: 'Word Puzzles', icon: Puzzle },
                  { name: 'Progress Tracking', icon: TrendingUp }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg opacity-60">
                    <feature.icon className="h-4 w-4" />
                    <span className="text-sm">{feature.name}</span>
                    <Lock className="h-3 w-3 ml-auto" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Complete your assignment above to unlock these features
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Normal dashboard view when no priority assignments
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            {user?.classes[0]} - Section {user?.sections[0]} • Keep up the great work!
          </p>
          {assignedContent.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {assignedContent.length} Assignment{assignedContent.length !== 1 ? 's' : ''} Available
              </Badge>
              {assignedContent.some(a => new Date(a.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  New Updates!
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Quick Quiz Button */}
        <div className="flex justify-end mb-2">
          <Button
            onClick={() => navigate('/quick-quiz')}
            variant="default"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-primary shadow-lg hover:scale-105 transition-all text-white px-6 py-4 rounded-2xl font-semibold text-lg border-none"
          >
            <Trophy className="h-5 w-5 mr-2" />
            Quick Quiz
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mt-2">
          <Button 
            onClick={() => handleStartActivity('speaking')} 
            variant="outline"
            className="justify-start"
          >
            <Zap className="h-4 w-4 mr-2" />
            Speaking Practice
          </Button>
          <Button 
            onClick={() => handleStartActivity('vocabulary')} 
            variant="outline" 
            className="justify-start"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Vocabulary Trainer
          </Button>
          <Button 
            onClick={() => handleStartActivity('grammar')} 
            variant="outline"
            className="justify-start"
          >
            <Target className="h-4 w-4 mr-2" />
            Grammar Clinic
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            

            {/* Dynamic Reflex Challenges */}
            {reflexChallenges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Reflex Challenges ({reflexChallenges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reflexChallenges.map((challenge) => {
                    const progress = getStudentProgress(studentId, challenge.id);
                    const isNew = new Date(challenge.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                    
                    return (
                      <div key={challenge.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">{challenge.title}</p>
                              {isNew && <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">New!</Badge>}
                            </div>
                            <p className="text-sm mb-2">{challenge.content}</p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>By: {challenge.createdBy}</span>
                              <span>•</span>
                              <span>Due: {challenge.dueDate ? new Date(challenge.dueDate).toLocaleDateString() : 'No due date'}</span>
                            </div>
                          </div>
                          <Badge variant={progress?.status === 'completed' ? 'default' : 'secondary'}>
                            {progress?.status || 'pending'}
                          </Badge>
                        </div>
                        {(!progress || progress.status !== 'completed') && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Type your response here..."
                              rows={3}
                              id={`challenge-${challenge.id}`}
                            />
                            <Button 
                              onClick={() => {
                                const textarea = document.getElementById(`challenge-${challenge.id}`) as HTMLTextAreaElement;
                                handleSubmitReflexAnswer(challenge.id, textarea?.value || '');
                              }}
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Answer
                            </Button>
                          </div>
                        )}
                        {progress?.status === 'completed' && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-700 font-medium">✓ Completed</p>
                            <p className="text-sm text-green-600">Score: {progress.bestScore}% • Time: {progress.timeSpent}m</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Dynamic Story Assignments */}
            {stories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Story Assignments ({stories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stories.map((story) => {
                    const progress = getStudentProgress(studentId, story.id);
                    const isNew = new Date(story.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                    
                    return (
                      <div key={story.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{story.title}</h3>
                              {isNew && <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">New!</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">By: {story.createdBy}</p>
                          </div>
                          <Badge variant="outline">{progress?.status || 'assigned'}</Badge>
                        </div>
                        <div className="bg-muted/50 p-3 rounded text-sm">
                          {story.content}
                        </div>
                        <Button onClick={() => handleStartActivity('story')} className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          {progress?.status === 'completed' ? 'Review Story' : 'Continue Story'}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Dynamic Puzzle Assignments */}
            {puzzles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Puzzle className="h-5 w-5 text-green-500" />
                    Word Puzzles ({puzzles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {puzzles.map((puzzle) => {
                    const progress = getStudentProgress(studentId, puzzle.id);
                    const isNew = new Date(puzzle.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                    
                    return (
                      <div key={puzzle.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{puzzle.title}</h3>
                              {isNew && <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">New!</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">By: {puzzle.createdBy}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">Attempts: {progress?.attempts || 0}</Badge>
                            {progress && <p className="text-sm text-muted-foreground mt-1">Best: {progress.bestScore}%</p>}
                          </div>
                        </div>
                        {puzzle.metadata?.words && (
                          <div className="flex flex-wrap gap-2">
                            {puzzle.metadata.words.map((word, index) => (
                              <Badge key={index} variant="secondary">{word}</Badge>
                            ))}
                          </div>
                        )}
                        <Button onClick={() => handleStartActivity('puzzle')} className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          {progress?.status === 'completed' ? 'Try Again' : 'Solve Puzzle'}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* No Assignments Message */}
            {assignedContent.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                  <p className="text-muted-foreground">
                    Your teacher hasn't assigned any exercises yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Level Progress */}
            

            {/* Badges */}
            

            {/* Quick Actions */}
            

            {/* Recent Activity */}
            

            {/* Quick Quiz card */}
            <div
              onClick={() => window.location.pathname = "/quick-quiz"}
              className="cursor-pointer group bg-gradient-to-br from-purple-200 via-cyan-100 to-blue-100 dark:from-purple-900 dark:via-cyan-950 dark:to-blue-950 border borer-primary rounded-2xl shadow hover:shadow-lg transform transition hover:scale-105 flex flex-col items-center justify-center gap-4 p-6"
            >
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/20">
                <span className="text-2xl">🧠</span>
              </div>
              <div className="font-semibold text-primary text-lg">Quick Quiz</div>
              <div className="text-xs text-gray-600 dark:text-gray-200 text-center">Take a rapid, AI-generated English skills quiz and get instant feedback.</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentDashboard;
