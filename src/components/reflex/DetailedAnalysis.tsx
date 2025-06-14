import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Target, Clock, Brain, CheckCircle, XCircle, 
  TrendingUp, Award, BookOpen, Lightbulb 
} from "lucide-react";
import { SessionData } from "@/pages/Reflex";

interface DetailedAnalysisProps {
  sessionData: SessionData;
  onBackToHome: () => void;
}

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({
  sessionData,
  onBackToHome
}) => {
  const averageAccuracy = sessionData.responses.reduce((sum, r) => sum + r.accuracy, 0) / sessionData.responses.length;
  const averageFluency = sessionData.responses.reduce((sum, r) => sum + r.fluency, 0) / sessionData.responses.length;
  const averageConfidence = sessionData.responses.reduce((sum, r) => sum + r.confidence, 0) / sessionData.responses.length;
  const averageVocabulary = sessionData.responses.reduce((sum, r) => sum + r.vocabularyScore, 0) / sessionData.responses.length;
  const averagePronunciation = sessionData.responses.reduce((sum, r) => sum + r.pronunciationScore, 0) / sessionData.responses.length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeEmoji = (grade: string) => {
    const gradeEmojis = {
      "A+": "🏆", "A": "⭐", "B+": "👍", "B": "👌", 
      "C+": "📈", "C": "📚", "D": "🎯"
    };
    return gradeEmojis[grade as keyof typeof gradeEmojis] || "📊";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBackToHome} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenges
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Detailed Analysis Report</h1>
            <p className="text-gray-600">Complete breakdown of your speaking performance</p>
          </div>
        </div>

        {/* Overall Grade */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">{getGradeEmoji(sessionData.overallAnalysis.overallGrade)}</div>
            <h2 className="text-4xl font-bold mb-4 text-primary">
              Grade: {sessionData.overallAnalysis.overallGrade}
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Overall Score: {Math.round(averageAccuracy)}%
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(averageAccuracy)}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(averageFluency)}%</div>
                <div className="text-sm text-gray-600">Fluency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(averageConfidence)}%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round(averageVocabulary)}%</div>
                <div className="text-sm text-gray-600">Vocabulary</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{Math.round(averagePronunciation)}%</div>
                <div className="text-sm text-gray-600">Pronunciation</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessionData.overallAnalysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{strength}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <TrendingUp className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessionData.overallAnalysis.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{weakness}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Detailed Response Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Response-by-Response Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sessionData.responses.map((response, index) => (
                <div key={index} className="border-l-4 border-primary/30 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Question {index + 1}</h4>
                    <Badge variant="outline" className={getScoreColor(response.accuracy)}>
                      {response.accuracy}% Accuracy
                    </Badge>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium mb-1">Prompt:</p>
                    <p className="text-sm italic">{response.question}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium mb-1">Your Response:</p>
                    <p className="text-sm">{response.original}</p>
                  </div>
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-600">Fluency</div>
                      <Progress value={response.fluency} className="h-2" />
                      <div className="text-xs mt-1">{response.fluency}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Confidence</div>
                      <Progress value={response.confidence} className="h-2" />
                      <div className="text-xs mt-1">{response.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Vocabulary</div>
                      <Progress value={response.vocabularyScore} className="h-2" />
                      <div className="text-xs mt-1">{response.vocabularyScore}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Pronunciation</div>
                      <Progress value={response.pronunciationScore} className="h-2" />
                      <div className="text-xs mt-1">{response.pronunciationScore}%</div>
                    </div>
                  </div>
                  {/* Grammar Errors */}
                  {response.grammarErrors && response.grammarErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-3">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Grammar Issues
                      </h5>
                      {response.grammarErrors.map((error, errorIndex) => (
                        <div key={errorIndex} className="text-xs space-y-1 border-l-2 border-red-300 pl-2 mb-2">
                          <p><strong>Error:</strong> {error.error}</p>
                          <p><strong>Correction:</strong> {error.correction}</p>
                          <p><strong>Explanation:</strong> {error.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <h5 className="text-sm font-semibold mb-2">AI Feedback:</h5>
                    <p className="text-sm">{response.detailedFeedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionData.overallAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Session Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-lg font-bold">{sessionData.totalTime.toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-lg font-bold">{sessionData.responses.length}</div>
                <div className="text-sm text-gray-600">Responses</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <div className="text-lg font-bold">{sessionData.streak}</div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Award className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-lg font-bold">{sessionData.score}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Button onClick={onBackToHome} size="lg">
            Try Another Challenge
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="lg"
          >
            Practice Same Challenge
          </Button>
        </div>

      </div>
    </div>
  );
};
