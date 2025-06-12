import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, RefreshCw } from "lucide-react";
import { SessionData } from "@/pages/Reflex";

interface VisualPromptResponseProps {
  onSessionEnd: (data: SessionData) => void;
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  energy: number;
  setEnergy: (value: number) => void;
}

const visualPrompts = [
  {
    type: "image",
    prompt: "Describe what you see in this busy marketplace scene",
    description: "A vibrant outdoor market with vendors selling fruits and vegetables",
    emoji: "🏪",
    keywords: ["people", "vendor", "fruits", "vegetables", "busy", "market", "selling", "buying"]
  },
  {
    type: "scenario", 
    prompt: "Explain what's happening in this office meeting",
    description: "A business meeting with people presenting charts and discussing strategy",
    emoji: "🏢",
    keywords: ["meeting", "presentation", "business", "charts", "discussion", "strategy", "office", "colleagues"]
  },
  {
    type: "image",
    prompt: "Describe this peaceful nature scene",
    description: "A serene lake surrounded by mountains and trees during sunset",
    emoji: "🌅",
    keywords: ["lake", "mountains", "trees", "sunset", "peaceful", "nature", "serene", "water"]
  },
  {
    type: "scenario",
    prompt: "Tell me what's happening at this restaurant",
    description: "A busy restaurant with waiters serving customers and chefs cooking",
    emoji: "🍽️",
    keywords: ["restaurant", "waiters", "customers", "serving", "cooking", "chefs", "busy", "dining"]
  }
];

export const VisualPromptResponse: React.FC<VisualPromptResponseProps> = ({
  onSessionEnd,
  transcript,
  isListening,
  startListening,
  stopListening,
  resetTranscript,
  energy,
  setEnergy
}) => {
  const [currentPrompt, setCurrentPrompt] = useState(visualPrompts[0]);
  const [timeLeft, setTimeLeft] = useState(12);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [descriptiveScore, setDescriptiveScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startNewRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startNewRound = () => {
    const randomPrompt = visualPrompts[Math.floor(Math.random() * visualPrompts.length)];
    setCurrentPrompt(randomPrompt);
    setTimeLeft(12);
    setShowFeedback(false);
    setDescriptiveScore(0);
    setRoundStartTime(Date.now());
    resetTranscript();

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    stopListening();
    evaluateResponse();
  };

  const calculateDescriptiveScore = (response: string, keywords: string[]): number => {
    const lowerResponse = response.toLowerCase();
    const wordsUsed = keywords.filter(keyword => lowerResponse.includes(keyword.toLowerCase()));
    
    // Base score for having a response
    let score = response.trim().length > 0 ? 40 : 0;
    
    // Keyword usage bonus
    score += (wordsUsed.length / keywords.length) * 40;
    
    // Length bonus (descriptive responses)
    const wordCount = response.split(' ').length;
    if (wordCount >= 15) score += 15;
    else if (wordCount >= 10) score += 10;
    else if (wordCount >= 5) score += 5;
    
    // Descriptive words bonus
    const descriptiveWords = ["colorful", "beautiful", "large", "small", "bright", "dark", "tall", "wide", "crowded", "quiet", "busy", "peaceful"];
    const descriptiveWordsUsed = descriptiveWords.filter(word => lowerResponse.includes(word));
    score += descriptiveWordsUsed.length * 3;
    
    return Math.min(100, score);
  };

  const evaluateResponse = () => {
    const responseTime = Date.now() - roundStartTime;
    const hasResponse = transcript.trim().length > 0;
    
    // Calculate descriptive accuracy
    const accuracy = hasResponse ? calculateDescriptiveScore(transcript, currentPrompt.keywords) : 0;
    setDescriptiveScore(accuracy);
    
    let fluency = Math.max(0, 100 - (responseTime / 150));
    let confidence = hasResponse ? Math.min(100, 60 + (accuracy * 0.4)) : 0;

    const roundScore = Math.round((accuracy + fluency + confidence) / 3);
    
    if (hasResponse) {
      setScore(prev => prev + roundScore);
    } else {
      setEnergy(Math.max(0, energy - 20));
    }

    const responseData = {
      prompt: currentPrompt.prompt,
      response: transcript,
      responseTime: responseTime / 1000,
      accuracy,
      fluency,
      confidence,
      grammarErrors: [],
      vocabularyScore: hasResponse ? 75 : 0,
      pronunciationScore: hasResponse ? 80 : 0,
      detailedFeedback: accuracy >= 70 ? "Great descriptive language!" : "Try to be more descriptive and use more keywords."
    };

    setResponses(prev => [...prev, responseData]);
    setShowFeedback(true);

    // End session after 6 rounds or if energy is depleted
    if (round >= 6 || energy <= 0) {
      setTimeout(() => {
        const avgAccuracy = responses.length > 0 ? responses.reduce((sum, r) => sum + r.accuracy, 0) / responses.length : accuracy;
        
        onSessionEnd({
          mode: "visual-prompt",
          responses: [...responses, responseData],
          totalTime: (Date.now() - sessionStartTime) / 1000,
          streak: responses.filter(r => r.accuracy >= 60).length,
          score: score + roundScore,
          overallAnalysis: {
            strengths: avgAccuracy >= 70 ? ["Descriptive language", "Good observation"] : ["Effort", "Participation"],
            weaknesses: avgAccuracy < 50 ? ["Descriptive vocabulary", "Observation skills"] : [],
            recommendations: ["Practice describing images", "Build descriptive vocabulary"],
            overallGrade: avgAccuracy >= 80 ? "A" : avgAccuracy >= 60 ? "B" : "C"
          }
        });
      }, 3000);
    } else {
      setTimeout(() => {
        setRound(prev => prev + 1);
        startNewRound();
      }, 4000);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Visual Response Challenge 💡</h1>
        <div className="flex items-center justify-center gap-6 text-sm">
          <span>Round {round}/6</span>
          <span>Score: {score}</span>
          {descriptiveScore > 0 && <span>Description: {descriptiveScore.toFixed(1)}%</span>}
        </div>
      </div>

      {/* Energy Bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Energy</span>
          <span className="text-sm">{energy}%</span>
        </div>
        <Progress value={energy} className="h-3" />
      </div>

      {/* Main Challenge Card */}
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          
          {!showFeedback ? (
            <>
              {/* Timer */}
              <div className="text-center mb-6">
                <div className="text-6xl font-bold mb-2 text-primary">{timeLeft}</div>
                <p className="text-lg">Describe what you see!</p>
              </div>

              {/* Visual Prompt */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-8 mb-6 text-center">
                <div className="text-8xl mb-4">{currentPrompt.emoji}</div>
                <h2 className="text-xl font-bold mb-4">{currentPrompt.prompt}</h2>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  {currentPrompt.description}
                </p>
              </div>

              {/* Keywords Hint */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-2">💡 Try to mention:</h3>
                <div className="flex flex-wrap gap-2">
                  {currentPrompt.keywords.slice(0, 4).map((keyword, index) => (
                    <span 
                      key={index}
                      className="bg-yellow-200 dark:bg-yellow-800 px-3 py-1 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Your Response */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 min-h-[100px]">
                <h3 className="text-sm font-medium mb-2">Your Description:</h3>
                <p className="text-lg">{transcript || "Start describing what you see..."}</p>
              </div>

              {/* Mic Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleMicToggle}
                  className={`w-20 h-20 rounded-full ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Feedback */}
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">
                  {descriptiveScore >= 80 ? "🎨" : descriptiveScore >= 60 ? "👁️" : descriptiveScore >= 40 ? "📝" : "🔍"}
                </div>
                <h3 className="text-xl font-bold">
                  {descriptiveScore >= 80 ? "Vivid Description!" : 
                   descriptiveScore >= 60 ? "Good Observation!" : 
                   descriptiveScore >= 40 ? "Nice Try!" : "More Detail Needed!"}
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-lg mb-2">Descriptive Score: <span className="font-bold text-primary">{descriptiveScore.toFixed(1)}%</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Based on keywords used, detail level, and descriptive language
                  </p>
                </div>

                {/* Keywords Used */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-bold mb-2">Keywords You Mentioned:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentPrompt.keywords.map((keyword, index) => {
                      const mentioned = transcript.toLowerCase().includes(keyword.toLowerCase());
                      return (
                        <span 
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${
                            mentioned 
                              ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {keyword} {mentioned ? '✓' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {round < 6 && energy > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Next visual coming up...
                  </p>
                )}
              </div>
            </>
          )}

        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="text-center mt-6 max-w-2xl">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Look at the visual prompt and describe what you see in detail. Use descriptive language and try to mention key elements to improve your observational speaking skills.
        </p>
      </div>

    </div>
  );
};
