import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { usePerformance } from "@/contexts/PerformanceContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    getAssignmentsForStudent,
    getStudentProgress,
    updateStudentProgress
  } = useAssignments();
  const { getStudentPerformance } = usePerformance();

  // Get real assignments from context instead of mock data
  const userClass = user?.classes[0] || '';
  const userSection = user?.sections[0] || '';
  const assignedContent = getAssignmentsForStudent(userClass, userSection);
  
  // Use email as student identifier since username doesn't exist on User type
  const studentId = user?.email || '';

  // Get real performance data
  const studentPerformance = getStudentPerformance(user?.id || '');

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

  // Use real student performance data or fallback to defaults
  const studentData = studentPerformance || {
    currentStreak: 0,
    totalTimeSpent: 0,
    weeklyTimeSpent: 0,
    level: 'Beginner',
    totalPoints: 0,
    nextLevelXP: 100,
    badges: [],
    performance: {
      speaking: 0,
      pronunciation: 0,
      vocabulary: 0,
      grammar: 0,
      story: 0,
      reflex: 0
    },
    recentActivities: []
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

        {/* Real-time Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardContent className="flex items-center p-6">
              <Flame className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{studentPerformance?.streak || 0}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Star className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{studentPerformance?.totalPoints || 0}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Trophy className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{studentPerformance?.level || 'Beginner'}</p>
                <p className="text-sm text-muted-foreground">Current Level</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{studentPerformance?.timeSpent || 0}m</p>
                <p className="text-sm text-muted-foreground">Time Spent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {studentPerformance ? (
                    Object.entries({
                      speaking: studentPerformance.averageScore,
                      pronunciation: studentPerformance.averageScore,
                      vocabulary: studentPerformance.averageScore,
                      grammar: studentPerformance.averageScore,
                      story: studentPerformance.averageScore,
                      reflex: studentPerformance.averageScore
                    }).map(([skill, score]) => (
                      <div key={skill} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{skill}</span>
                          <span className={`text-sm font-bold ${getPerformanceColor(score)}`}>
                            {score}%
                          </span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground">
                      Complete exercises to see your performance data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{studentPerformance?.level || 'Beginner'}</div>
                  <div className="text-sm text-muted-foreground">
                    {studentPerformance?.totalPoints || 0} points earned
                  </div>
                </div>
                {studentPerformance && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Points</span>
                      <span>{studentPerformance.totalPoints}</span>
                    </div>
                    <Progress value={Math.min(100, (studentPerformance.totalPoints % 100))} className="h-3" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentPerformance?.badges && studentPerformance.badges.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {studentPerformance.badges.map((badge, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{badge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Complete exercises to earn badges!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Practice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => handleStartActivity('speaking')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Speaking Practice
                </Button>
                <Button 
                  onClick={() => handleStartActivity('vocabulary')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Vocabulary Trainer
                </Button>
                <Button 
                  onClick={() => handleStartActivity('grammar')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Grammar Clinic
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studentPerformance?.exerciseHistory && studentPerformance.exerciseHistory.length > 0 ? (
                  studentPerformance.exerciseHistory.slice(-5).reverse().map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{activity.exerciseTitle}</p>
                        <p className="text-muted-foreground">
                          {new Date(activity.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getPerformanceColor(activity.score)}>
                          {activity.score}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          +{activity.pointsEarned} points
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentDashboard;
