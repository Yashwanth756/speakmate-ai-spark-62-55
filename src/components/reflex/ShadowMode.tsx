import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { SessionData } from "@/pages/Reflex";

interface ShadowModeProps {
  onSessionComplete: (data: SessionData) => void;
}

const ShadowMode: React.FC<ShadowModeProps> = ({ onSessionComplete }) => {
  const [mockResponses, setMockResponses] = useState([
    {
      prompt: "Repeat: The quick brown fox jumps over the lazy dog.",
      response: "The quick brown fox jumps over the lazy dog.",
      responseTime: 5.2,
      accuracy: 95,
      fluency: 88,
      confidence: 92,
      grammarErrors: [],
      vocabularyScore: 85,
      pronunciationScore: 90,
      detailedFeedback: "Excellent pronunciation and rhythm."
    },
    {
      prompt: "Repeat: She sells seashells by the seashore.",
      response: "She sells seashells by the seashore.",
      responseTime: 4.8,
      accuracy: 98,
      fluency: 92,
      confidence: 95,
      grammarErrors: [],
      vocabularyScore: 90,
      pronunciationScore: 93,
      detailedFeedback: "Near-perfect imitation. Keep it up!"
    },
    {
      prompt: "Repeat: How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
      response: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
      responseTime: 6.5,
      accuracy: 92,
      fluency: 85,
      confidence: 88,
      grammarErrors: [],
      vocabularyScore: 80,
      pronunciationScore: 87,
      detailedFeedback: "Good attempt. Work on pacing."
    },
    {
      prompt: "Repeat: Peter Piper picked a peck of pickled peppers.",
      response: "Peter Piper picked a peck of pickled peppers.",
      responseTime: 5.5,
      accuracy: 96,
      fluency: 90,
      confidence: 93,
      grammarErrors: [],
      vocabularyScore: 88,
      pronunciationScore: 91,
      detailedFeedback: "Very clear and precise."
    },
    {
      prompt: "Repeat: The rain in Spain falls mainly on the plain.",
      response: "The rain in Spain falls mainly on the plain.",
      responseTime: 5.0,
      accuracy: 94,
      fluency: 87,
      confidence: 90,
      grammarErrors: [],
      vocabularyScore: 83,
      pronunciationScore: 89,
      detailedFeedback: "Good job. Focus on intonation."
    }
  ]);

  useEffect(() => {
    // Simulate session completion after a delay
    const totalTime = 27; // seconds
    setTimeout(() => {
      const sessionData: SessionData = {
        mode: "shadow-mode",
        responses: mockResponses,
        totalTime,
        streak: 4,
        score: 82,
        overallAnalysis: {
          strengths: ["Excellent pronunciation", "Good rhythm matching", "Clear articulation"],
          weaknesses: ["Intonation patterns", "Stress placement"],
          recommendations: ["Focus on word stress patterns", "Practice with native audio"],
          overallGrade: "A-"
        },
        metrics: {
          pronunciation: 88,
          fluency: 82,
          vocabulary: 75,
          precision: 85,
          accuracy: 82,
          speed: 80,
          totalTime: Math.round(totalTime)
        }
      };

      onSessionComplete(sessionData);
    }, 3000);
  }, [onSessionComplete, mockResponses]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <Card className="divide-y divide-gray-200">
            <CardHeader className="px-5 py-8">
              <CardTitle className="text-3xl font-semibold text-center">
                Shadow Mode Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-5">
              <p className="text-gray-700 text-center">
                Simulating a shadow mode challenge. Repeat the phrases as accurately as possible.
              </p>
              <div className="mt-4 text-center">
                Analyzing your performance...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ShadowMode;
