import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap, Clock, BarChart3, TrendingUp, Star } from "lucide-react";
import { SessionData } from "@/pages/Reflex";

interface SpeakingAnalyticsProps {
  sessionData: SessionData;
  onNewSession: () => void;
}

export const SpeakingAnalytics: React.FC<SpeakingAnalyticsProps> = ({
  sessionData,
  onNewSession
}) => {
  const averageAccuracy = sessionData.responses.length > 0 
    ? sessionData.responses.reduce((sum, r) => sum + r.accuracy, 0) / sessionData.responses.length 
    : 0;
  
  const averageFluency = sessionData.responses.length > 0 
    ? sessionData.responses.reduce((sum, r) => sum + r.fluency, 0) / sessionData.responses.length 
    : 0;
  
  const averageConfidence = sessionData.responses.length > 0 
    ? sessionData.responses.reduce((sum, r) => sum + r.confidence, 0) / sessionData.responses.length 
    : 0;

  const getOverallGrade = () => {
    const overall = (averageAccuracy + averageFluency + averageConfidence) / 3;
    if (overall >= 90) return { grade: "A+", color: "text-green-600", emoji: "🏆" };
    if (overall >= 80) return { grade: "A", color: "text-green-500", emoji: "⭐" };
    if (overall >= 70) return { grade: "B+", color: "text-blue-500", emoji: "👍" };
    if (overall >= 60) return { grade: "B", color: "text-blue-400", emoji: "👌" };
    if (overall >= 50) return { grade: "C", color: "text-orange-500", emoji: "📈" };
    return { grade: "D", color: "text-red-500", emoji: "📚" };
  };

  const grade = getOverallGrade();

  const getModeTitle = (mode: string): string => {
    const titles = {
      "emotion-shift": "Emotion Shift",
      "ai-debate": "AI Debate",
      "precision-word": "Precision Word",
      "repetition-memory": "Memory Loop",
      "shadow-mode": "Shadow Mode",
      "visual-prompt": "Visual Response",
      "pressure-mode": "Pressure Mode"
    };
    return titles[mode] || mode;
  };

  const getFeedbackMessage = () => {
    if (averageAccuracy >= 85) {
      return "Outstanding performance! Your speaking skills are excellent.";
    } else if (averageAccuracy >= 70) {
      return "Great job! You're showing strong speaking abilities.";
    } else if (averageAccuracy >= 55) {
      return "Good progress! Keep practicing to improve further.";
    } else {
      return "Keep practicing! Every session makes you better.";
    }
  };

  const getImprovementTip = () => {
    if (averageAccuracy < 60) {
      return "Focus on accuracy: Take your time to think before speaking.";
    } else if (averageFluency < 60) {
      return "Work on fluency: Practice speaking more smoothly and naturally.";
    } else if (averageConfidence < 60) {
      return "Build confidence: Speak louder and with more conviction.";
    } else {
      return "Excellent work! Try a harder mode to challenge yourself further.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">📊 Speaking Analytics</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {getModeTitle(sessionData.mode)} Session Complete
          </p>
        </div>

        {/* Overall Grade */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-8 text-center">
            <div className="text-8xl mb-4">{grade.emoji}</div>
            <h2 className={`text-6xl font-bold mb-4 ${grade.color}`}>{grade.grade}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              {getFeedbackMessage()}
            </p>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 inline-block">
              <p className="font-semibold text-lg">Session Score: {sessionData.score} points</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Accuracy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-green-500" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {averageAccuracy.toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Grammar & vocabulary</p>
              <Progress value={averageAccuracy} className="mt-3 h-2" />
            </CardContent>
          </Card>

          {/* Fluency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Fluency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {averageFluency.toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Smoothness & flow</p>
              <Progress value={averageFluency} className="mt-3 h-2" />
            </CardContent>
          </Card>

          {/* Confidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-orange-500" />
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {averageConfidence.toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tone & clarity</p>
              <Progress value={averageConfidence} className="mt-3 h-2" />
            </CardContent>
          </Card>

        </div>

        {/* Session Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Session Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Responses:</span>
                  <span className="font-bold">{sessionData.responses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate:</span>
                  <span className="font-bold">
                    {sessionData.responses.length > 0 
                      ? Math.round((sessionData.responses.filter(r => r.accuracy >= 50).length / sessionData.responses.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Time:</span>
                  <span className="font-bold">{sessionData.totalTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Best Streak:</span>
                  <span className="font-bold">{sessionData.streak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mode:</span>
                  <span className="font-bold">{getModeTitle(sessionData.mode)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-bold mb-2">💡 Pro Tip:</h4>
                  <p className="text-sm">{getImprovementTip()}</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-bold mb-2">🎯 Recommended:</h4>
                  <p className="text-sm">
                    {averageAccuracy >= 80 
                      ? "Try a more challenging mode or enable Level-Up mode!" 
                      : "Practice this mode again to improve your scores."}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-bold mb-2">🏆 Achievement:</h4>
                  <p className="text-sm">
                    {sessionData.streak >= 5 
                      ? `Amazing ${sessionData.streak} response streak!` 
                      : "Keep practicing to build longer streaks!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Individual Response Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Response Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {sessionData.responses.map((response, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">Challenge {index + 1}</h4>
                    <span className={`text-sm font-bold ${
                      response.accuracy >= 70 ? 'text-green-600' : 
                      response.accuracy >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {response.accuracy.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    "{response.question}"
                  </p>
                  <p className="text-sm italic">
                    Your response: "{response.original || 'No response'}"
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Button onClick={onNewSession} size="lg" className="mr-4">
            Try Another Mode
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="lg"
          >
            Practice Same Mode
          </Button>
        </div>

      </div>
    </div>
  );
};
