
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, RotateCcw, Mic, Eye, Zap, Heart, BookOpen, Play, ArrowRight } from "lucide-react";
import { ChallengeSession } from "@/components/reflex/ChallengeSession";
import { DetailedAnalysis } from "@/components/reflex/DetailedAnalysis";

// Export SessionData type for other components
export interface SessionData {
  mode: string;
  responses: Array<{
    question: string;
    original: string;
    corrected: string;
    explanation: string;
    grammarErrors: Array<{
      error: string;
      correction: string;
      explanation: string;
    }>;
    accuracy: number;
    fluency: number;
    confidence: number;
    vocabularyScore: number;
    pronunciationScore: number;
    speed: number;
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
  metrics: {
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    precision: number;
    accuracy: number;
    speed: number;
    totalTime: number;
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
      description: "Argue your point. Gemini counters. You respond.",
      icon: <Brain className="h-8 w-8" />,
      skill: "Spontaneous speaking, logic, persuasion",
      color: "from-blue-500 to-cyan-500",
      difficulty: "Advanced"
    },
    {
      id: "precision-word",
      title: "Precision Word",
      description: "Use 3–5 target words naturally in your speech.",
      icon: <Target className="h-8 w-8" />,
      skill: "Vocabulary usage, clarity",
      color: "from-green-500 to-emerald-500",
      difficulty: "Intermediate"
    },
    {
      id: "memory-loop",
      title: "Memory Loop",
      description: "Repeat a spoken sentence exactly as heard. Gemini checks accuracy.",
      icon: <RotateCcw className="h-8 w-8" />,
      skill: "Memory, focus",
      color: "from-purple-500 to-violet-500",
      difficulty: "Beginner"
    },
    {
      id: "shadow-mode",
      title: "Shadow Mode",
      description: "Imitate a native speaker in real-time. Pronunciation match is analyzed.",
      icon: <Mic className="h-8 w-8" />,
      skill: "Accent, pronunciation",
      color: "from-orange-500 to-red-500",
      difficulty: "Advanced"
    },
    {
      id: "visual-response",
      title: "Visual Response",
      description: "Describe an image or video. Use rich vocabulary and structure.",
      icon: <Eye className="h-8 w-8" />,
      skill: "Descriptive power, grammar",
      color: "from-pink-500 to-rose-500",
      difficulty: "Intermediate"
    },
    {
      id: "quick-fire",
      title: "Quick Fire Questions",
      description: "Answer random, timed questions in under 5 seconds.",
      icon: <Zap className="h-8 w-8" />,
      skill: "Thinking speed, fluency",
      color: "from-yellow-500 to-orange-500",
      difficulty: "Intermediate"
    },
    {
      id: "emotion-switcher",
      title: "Emotion Switcher",
      description: "Say one sentence in 3 different emotions: happy, angry, sad.",
      icon: <Heart className="h-8 w-8" />,
      skill: "Expressiveness, emotion control",
      color: "from-red-500 to-pink-500",
      difficulty: "Beginner"
    },
    {
      id: "story-stretch",
      title: "Story Stretch",
      description: "Continue a short story creatively after hearing the first lines.",
      icon: <BookOpen className="h-8 w-8" />,
      skill: "Creativity, narrative flow",
      color: "from-indigo-500 to-purple-500",
      difficulty: "Advanced"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Reflex Challenge
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-Powered Speaking Practice for English Fluency
            </p>
            
            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Choose Challenge</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Select from 8 speaking exercises</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🗣️</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Speak Naturally</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Auto-recording with timer</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-bold text-lg mb-2">AI Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Detailed grammar & fluency feedback</p>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Detailed Report</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Complete analysis with recommendations</p>
              </div>
            </div>
          </div>

          {/* Challenge Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
              🚀 Challenge Types
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              Each challenge is crafted to sharpen specific speaking skills
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {challenges.map((challenge) => (
                <Card 
                  key={challenge.id}
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:scale-105 overflow-hidden"
                  onClick={() => startChallenge(challenge.id)}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${challenge.color} rounded-2xl flex items-center justify-center text-white transform group-hover:scale-110 transition-transform shadow-lg`}>
                      {challenge.icon}
                    </div>
                    <CardTitle className="text-center text-xl font-bold">{challenge.title}</CardTitle>
                    <div className="flex justify-center">
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center min-h-[40px]">
                      {challenge.description}
                    </p>
                    <div className="text-xs text-center mb-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Skills: </span>
                      <span className="text-gray-600 dark:text-gray-300">{challenge.skill}</span>
                    </div>
                    <Button className={`w-full bg-gradient-to-r ${challenge.color} text-white font-semibold py-3 hover:opacity-90 transition-opacity group-hover:shadow-lg`}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Challenge
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4">Choose a Challenge</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Pick from 8 unique speaking exercises, tailored to different skills and levels — from beginner to advanced.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4">Speak Naturally</h3>
                <div className="text-gray-600 dark:text-gray-300 space-y-2">
                  <p>• Auto-recording begins when you start speaking</p>
                  <p>• Live AI-powered transcription appears as you talk</p>
                  <p>• Word count tracked in real time</p>
                  <p>• Transcription saved automatically after each question</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4">🤖 AI Analysis</h3>
                <div className="text-gray-600 dark:text-gray-300 space-y-2">
                  <p className="font-semibold text-purple-600 dark:text-purple-400">(Powered by Gemini)</p>
                  <p>• Corrected version of your answer</p>
                  <p>• Explanation of mistakes</p>
                  <p>• Grammar rules that were broken</p>
                  <p>• Accuracy score for each question</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  4
                </div>
                <h3 className="text-xl font-bold mb-4">📈 Detailed Report</h3>
                <div className="text-gray-600 dark:text-gray-300 space-y-2">
                  <p>• Pronunciation Accuracy (%)</p>
                  <p>• Fluency Level & Vocabulary Strength</p>
                  <p>• Precision of Word Use</p>
                  <p>• Overall Accuracy & Response Speed</p>
                  <p>• Total Time Taken</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default ReflexChallenge;
