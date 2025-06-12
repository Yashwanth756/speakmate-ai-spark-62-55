
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Brain, Target, RotateCcw, Eye, Zap, Heart, BookOpen } from "lucide-react";
import { ChallengeSession } from "@/components/reflex/ChallengeSession";
import { DetailedAnalysis } from "@/components/reflex/DetailedAnalysis";

// Export SessionData type for other components
export interface SessionData {
  mode: string;
  responses: Array<{
    prompt: string;
    response: string;
    responseTime: number;
    accuracy: number;
    fluency: number;
    confidence: number;
    grammarErrors: Array<{
      error: string;
      correction: string;
      explanation: string;
    }>;
    vocabularyScore: number;
    pronunciationScore: number;
    detailedFeedback: string;
  }>;
  totalTime: number;
  streak: number;
  score: number;
  overallAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallGrade: string;
  };
}

const ReflexChallenge = () => {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const challenges = [
    {
      id: "ai-debate",
      title: "AI Debate",
      description: "Argue your point. Gemini gives counterpoints. You must respond logically.",
      icon: <Brain className="h-8 w-8" />,
      skill: "Spontaneous speaking, logic, persuasion",
      color: "from-blue-500 to-cyan-500",
      difficulty: "Advanced"
    },
    {
      id: "precision-word",
      title: "Precision Word",
      description: "You must use 3–5 specific target words in your speech.",
      icon: <Target className="h-8 w-8" />,
      skill: "Vocabulary usage, clarity",
      color: "from-green-500 to-emerald-500",
      difficulty: "Intermediate"
    },
    {
      id: "memory-loop",
      title: "Memory Loop",
      description: "Listen to a sentence and repeat it exactly. Gemini checks accuracy.",
      icon: <RotateCcw className="h-8 w-8" />,
      skill: "Memory, focus",
      color: "from-purple-500 to-violet-500",
      difficulty: "Beginner"
    },
    {
      id: "shadow-mode",
      title: "Shadow Mode",
      description: "Imitate a native speaker sentence in real-time. Pronunciation match is evaluated.",
      icon: <Mic className="h-8 w-8" />,
      skill: "Accent, pronunciation",
      color: "from-orange-500 to-red-500",
      difficulty: "Advanced"
    },
    {
      id: "visual-response",
      title: "Visual Response",
      description: "Describe an image or video shown. Use rich vocabulary.",
      icon: <Eye className="h-8 w-8" />,
      skill: "Descriptive power, grammar",
      color: "from-pink-500 to-rose-500",
      difficulty: "Intermediate"
    },
    {
      id: "quick-fire",
      title: "Quick Fire Questions",
      description: "Answer rapid random questions (personal, opinion-based) under 5 sec each.",
      icon: <Zap className="h-8 w-8" />,
      skill: "Thinking speed, fluency",
      color: "from-yellow-500 to-orange-500",
      difficulty: "Intermediate"
    },
    {
      id: "emotion-switcher",
      title: "Emotion Switcher",
      description: "Say the same sentence with 3 different emotions (e.g., happy, angry, sad).",
      icon: <Heart className="h-8 w-8" />,
      skill: "Expressiveness, emotion control",
      color: "from-red-500 to-pink-500",
      difficulty: "Beginner"
    },
    {
      id: "story-stretch",
      title: "Story Stretch",
      description: "Continue a story after hearing the first 2 sentences. Be creative!",
      icon: <BookOpen className="h-8 w-8" />,
      skill: "Creativity, narrative flow",
      color: "from-indigo-500 to-purple-500",
      difficulty: "Advanced"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const startChallenge = (challengeId: string) => {
    setSelectedChallenge(challengeId);
    setSessionData(null);
    setShowAnalysis(false);
  };

  const handleSessionComplete = (data: SessionData) => {
    setSessionData(data);
    setSelectedChallenge(null);
    setShowAnalysis(true);
  };

  const handleBackToHome = () => {
    setSelectedChallenge(null);
    setSessionData(null);
    setShowAnalysis(false);
  };

  // If showing detailed analysis
  if (showAnalysis && sessionData) {
    return (
      <AppLayout>
        <DetailedAnalysis 
          sessionData={sessionData} 
          onBackToHome={handleBackToHome}
        />
      </AppLayout>
    );
  }

  // If challenge is selected, show the challenge session
  if (selectedChallenge) {
    const challenge = challenges.find(c => c.id === selectedChallenge);
    return (
      <AppLayout>
        <ChallengeSession 
          challenge={challenge!}
          onSessionComplete={handleSessionComplete}
          onBack={handleBackToHome}
        />
      </AppLayout>
    );
  }

  // Main challenge selection page
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Reflex Challenge
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              AI-Powered Speaking Practice for English Fluency
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>Powered by Gemini AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-accent" />
                <span>Real-time Speech Analysis</span>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-center mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <h4 className="font-semibold mb-1">Choose Challenge</h4>
                <p className="text-gray-600 dark:text-gray-300">Select from 8 speaking exercises</p>
              </div>
              <div className="text-center p-3">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🗣️</span>
                </div>
                <h4 className="font-semibold mb-1">Speak Naturally</h4>
                <p className="text-gray-600 dark:text-gray-300">Auto-recording with timer</p>
              </div>
              <div className="text-center p-3">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <h4 className="font-semibold mb-1">AI Analysis</h4>
                <p className="text-gray-600 dark:text-gray-300">Detailed grammar & fluency feedback</p>
              </div>
              <div className="text-center p-3">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
                <h4 className="font-semibold mb-1">Detailed Report</h4>
                <p className="text-gray-600 dark:text-gray-300">Complete analysis with recommendations</p>
              </div>
            </div>
          </div>

          {/* Challenge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {challenges.map((challenge) => (
              <Card 
                key={challenge.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 overflow-hidden"
                onClick={() => startChallenge(challenge.id)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${challenge.color} rounded-2xl flex items-center justify-center text-white transform group-hover:scale-110 transition-transform`}>
                    {challenge.icon}
                  </div>
                  <CardTitle className="text-center text-lg">{challenge.title}</CardTitle>
                  <div className="flex justify-center">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 text-center">
                    {challenge.description}
                  </p>
                  <div className="text-xs text-center">
                    <span className="font-semibold text-primary">Skills: </span>
                    <span className="text-gray-600 dark:text-gray-300">{challenge.skill}</span>
                  </div>
                  <Button className="w-full mt-4 group-hover:bg-primary/90">
                    Start Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default ReflexChallenge;
