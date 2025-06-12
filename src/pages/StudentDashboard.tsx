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

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Mock assigned content (would come from teacher assignments)
  const assignedContent = {
    reflexChallenges: [
      {
        id: 1,
        question: "Describe the importance of environmental conservation in modern society.",
        assignedBy: "Ms. Johnson",
        dueDate: "Today",
        status: "pending"
      }
    ],
    stories: [
      {
        id: 1,
        title: "The Time Traveler's Dilemma",
        content: "Sarah discovered an old pocket watch in her grandmother's attic. When she wound it, strange things began to happen...",
        assignedBy: "Ms. Johnson",
        status: "assigned"
      }
    ],
    puzzles: [
      {
        id: 1,
        title: "Science Vocabulary Challenge",
        words: ["experiment", "hypothesis", "analysis", "conclusion", "laboratory"],
        assignedBy: "Ms. Johnson",
        attempts: 2,
        bestScore: 80
      }
    ]
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSubmitReflexAnswer = (challengeId: number, answer: string) => {
    if (!answer.trim()) return;
    
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

            {/* Assigned Reflex Challenges */}
            {assignedContent.reflexChallenges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Reflex Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignedContent.reflexChallenges.map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium mb-2">{challenge.question}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>By: {challenge.assignedBy}</span>
                            <span>•</span>
                            <span>Due: {challenge.dueDate}</span>
                          </div>
                        </div>
                        <Badge variant={challenge.status === 'pending' ? 'default' : 'secondary'}>
                          {challenge.status}
                        </Badge>
                      </div>
                      {challenge.status === 'pending' && (
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Assigned Stories */}
            {assignedContent.stories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Story Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignedContent.stories.map((story) => (
                    <div key={story.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{story.title}</h3>
                          <p className="text-sm text-muted-foreground">By: {story.assignedBy}</p>
                        </div>
                        <Badge variant="outline">{story.status}</Badge>
                      </div>
                      <div className="bg-muted/50 p-3 rounded text-sm">
                        {story.content}
                      </div>
                      <Button onClick={() => handleStartActivity('story')} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Story
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Assigned Puzzles */}
            {assignedContent.puzzles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Puzzle className="h-5 w-5 text-green-500" />
                    Word Puzzles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignedContent.puzzles.map((puzzle) => (
                    <div key={puzzle.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{puzzle.title}</h3>
                          <p className="text-sm text-muted-foreground">By: {puzzle.assignedBy}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Attempts: {puzzle.attempts}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">Best: {puzzle.bestScore}%</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {puzzle.words.map((word, index) => (
                          <Badge key={index} variant="secondary">{word}</Badge>
                        ))}
                      </div>
                      <Button onClick={() => handleStartActivity('puzzle')} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Solve Puzzle
                      </Button>
                    </div>
                  ))}
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
