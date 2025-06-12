import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Play
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
      studentId: user?.username || '',
      status: 'completed',
      attempts: 1,
      bestScore: 85,
      timeSpent: 5,
      responses: [answer]
    });
    
    toast({
      title: "Answer Submitted!",
      description: "Your reflex challenge response has been recorded.",
    });
  };

  const handleStartActivity = (activityType: string) => {
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

        {/* Streak & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardContent className="flex items-center p-6">
              <Flame className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{studentData.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{studentData.weeklyTimeSpent}m</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{studentData.level}</p>
                <p className="text-sm text-muted-foreground">Current Level</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Star className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{studentData.xp}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
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
                  {Object.entries(studentData.performance).map(([skill, score]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{skill}</span>
                        <span className={`text-sm font-bold ${getPerformanceColor(score)}`}>
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
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
                    const progress = getStudentProgress(user?.username || '', challenge.id);
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
                    const progress = getStudentProgress(user?.username || '', story.id);
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
                    const progress = getStudentProgress(user?.username || '', puzzle.id);
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
                  <div className="text-2xl font-bold">{studentData.level}</div>
                  <div className="text-sm text-muted-foreground">
                    {studentData.xp} / {studentData.nextLevelXP} XP
                  </div>
                </div>
                <Progress 
                  value={(studentData.xp / studentData.nextLevelXP) * 100} 
                  className="h-3"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {studentData.nextLevelXP - studentData.xp} XP to next level
                </div>
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
                <div className="grid grid-cols-1 gap-2">
                  {studentData.badges.map((badge, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{badge}</span>
                    </div>
                  ))}
                </div>
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
                {studentData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="outline" className={getPerformanceColor(activity.score)}>
                      {activity.score}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentDashboard;
