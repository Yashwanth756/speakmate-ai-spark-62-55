import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Volume2, Play, Pause } from "lucide-react";
import { SessionData } from "@/pages/Reflex";

interface ShadowModeProps {
  onSessionEnd: (data: SessionData) => void;
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  energy: number;
  setEnergy: (value: number) => void;
}

const shadowTexts = [
  {
    text: "Good morning everyone. Welcome to today's presentation on modern technology and its impact on our daily lives.",
    difficulty: "Beginner",
    focus: "Clear pronunciation and steady pace"
  },
  {
    text: "The implementation of artificial intelligence in healthcare has revolutionized diagnostic procedures and treatment methodologies.",
    difficulty: "Intermediate", 
    focus: "Complex vocabulary and technical terms"
  },
  {
    text: "Notwithstanding the unprecedented challenges we face, our organization remains committed to delivering exceptional results.",
    difficulty: "Advanced",
    focus: "Formal language and complex sentence structures"
  }
];

export const ShadowMode: React.FC<ShadowModeProps> = ({
  onSessionEnd,
  transcript,
  isListening,
  startListening,
  stopListening,
  resetTranscript,
  energy,
  setEnergy
}) => {
  const [currentText, setCurrentText] = useState(shadowTexts[0]);
  const [phase, setPhase] = useState<"ready" | "shadowing" | "feedback">("ready");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [shadowingScore, setShadowingScore] = useState(0);

  const audioRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    startNewRound();
    return () => {
      if (audioRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startNewRound = () => {
    const randomText = shadowTexts[Math.floor(Math.random() * shadowTexts.length)];
    setCurrentText(randomText);
    setPhase("ready");
    setShadowingScore(0);
    resetTranscript();
  };

  const startShadowing = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentText.text);
      utterance.rate = 0.7; // Slower for shadowing
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setPhase("shadowing");
        startListening();
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        stopListening();
        evaluateResponse();
      };
      
      audioRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopShadowing = () => {
    if (audioRef.current) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      stopListening();
      evaluateResponse();
    }
  };

  const calculateShadowingScore = (original: string, spoken: string): number => {
    const originalWords = original.toLowerCase().split(' ').filter(word => word.length > 0);
    const spokenWords = spoken.toLowerCase().split(' ').filter(word => word.length > 0);
    
    if (spokenWords.length === 0) return 0;
    
    let matches = 0;
    let partialMatches = 0;
    
    // Check for exact and partial matches
    originalWords.forEach(originalWord => {
      const exactMatch = spokenWords.find(spokenWord => spokenWord === originalWord);
      if (exactMatch) {
        matches++;
      } else {
        // Check for partial matches (at least 3 characters)
        const partialMatch = spokenWords.find(spokenWord => 
          originalWord.length >= 3 && spokenWord.length >= 3 && 
          (originalWord.includes(spokenWord) || spokenWord.includes(originalWord))
        );
        if (partialMatch) {
          partialMatches++;
        }
      }
    });
    
    // Calculate score: full points for exact matches, half points for partial
    const totalScore = (matches + partialMatches * 0.5) / originalWords.length * 100;
    return Math.min(100, totalScore);
  };

  const evaluateResponse = () => {
    const hasResponse = transcript.trim().length > 0;
    
    // Calculate shadowing accuracy
    const accuracy = hasResponse ? calculateShadowingScore(currentText.text, transcript) : 0;
    setShadowingScore(accuracy);
    
    // Calculate other metrics
    let fluency = hasResponse ? Math.min(100, transcript.split(' ').length * 3) : 0;
    let confidence = hasResponse ? Math.min(100, 60 + (accuracy * 0.4)) : 0;

    // Difficulty bonus
    const difficultyMultiplier = currentText.difficulty === "Advanced" ? 1.3 : 
                                currentText.difficulty === "Intermediate" ? 1.2 : 1.0;
    
    const roundScore = Math.round(((accuracy + fluency + confidence) / 3) * difficultyMultiplier);
    
    if (hasResponse) {
      setScore(prev => prev + roundScore);
    } else {
      setEnergy(Math.max(0, energy - 20));
    }

    const responseData = {
      prompt: `Shadow: "${currentText.text}"`,
      response: transcript,
      responseTime: 0, // Not applicable for shadowing
      accuracy,
      fluency,
      confidence,
      grammarErrors: [],
      vocabularyScore: hasResponse ? 75 : 0,
      pronunciationScore: accuracy,
      detailedFeedback: accuracy >= 70 ? "Great shadowing! Good pronunciation match." : "Keep practicing pronunciation and timing."
    };

    setResponses(prev => [...prev, responseData]);
    setPhase("feedback");

    // End session after 5 rounds or if energy is depleted
    if (round >= 5 || energy <= 0) {
      setTimeout(() => {
        const avgAccuracy = responses.length > 0 ? responses.reduce((sum, r) => sum + r.accuracy, 0) / responses.length : accuracy;
        
        onSessionEnd({
          mode: "shadow-mode",
          responses: [...responses, responseData],
          totalTime: (Date.now() - sessionStartTime) / 1000,
          streak: responses.filter(r => r.accuracy >= 60).length,
          score: score + roundScore,
          overallAnalysis: {
            strengths: avgAccuracy >= 70 ? ["Good pronunciation", "Accurate shadowing"] : ["Effort", "Persistence"],
            weaknesses: avgAccuracy < 50 ? ["Pronunciation accuracy", "Listening skills"] : [],
            recommendations: ["Practice more shadowing exercises", "Focus on pronunciation"],
            overallGrade: avgAccuracy >= 80 ? "A" : avgAccuracy >= 60 ? "B" : "C"
          }
        });
      }, 4000);
    } else {
      setTimeout(() => {
        setRound(prev => prev + 1);
        startNewRound();
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Shadow Mode Challenge 🗣️</h1>
        <div className="flex items-center justify-center gap-6 text-sm">
          <span>Round {round}/5</span>
          <span>Score: {score}</span>
          <span className={`font-bold ${currentText.difficulty === 'Advanced' ? 'text-red-500' : currentText.difficulty === 'Intermediate' ? 'text-orange-500' : 'text-green-500'}`}>
            {currentText.difficulty}
          </span>
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
      <Card className="w-full max-w-3xl">
        <CardContent className="p-8">
          
          {/* Phase Content */}
          {phase === "ready" && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold">Get Ready to Shadow!</h2>
              
              <div className="bg-primary/10 rounded-lg p-6">
                <h3 className="font-bold mb-3">Text to Shadow:</h3>
                <p className="text-lg leading-relaxed">{currentText.text}</p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Focus: {currentText.focus}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Speak along with the audio as closely as possible. Match the rhythm, pace, and pronunciation.
                </p>
              </div>
              
              <Button 
                size="lg"
                onClick={startShadowing}
                className="bg-green-500 hover:bg-green-600"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Shadowing
              </Button>
            </div>
          )}

          {phase === "shadowing" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🗣️</div>
                <h2 className="text-2xl font-bold mb-4">Shadow the Speaker!</h2>
                <p className="text-lg text-green-600 dark:text-green-400">
                  Speak along with the audio
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-bold mb-3">Original Text:</h3>
                <p className="text-lg leading-relaxed mb-4">{currentText.text}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-blue-500" />
                    <span className="text-sm">Audio Playing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-red-500 animate-pulse" />
                    <span className="text-sm">Recording</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 min-h-[100px]">
                <h3 className="text-sm font-medium mb-2">Your Shadowing:</h3>
                <p className="text-lg">{transcript || "Start speaking along with the audio..."}</p>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={stopShadowing}
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Early
                </Button>
              </div>
            </div>
          )}

          {phase === "feedback" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {shadowingScore >= 80 ? "🎯" : shadowingScore >= 60 ? "👍" : shadowingScore >= 40 ? "📈" : "🔄"}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {shadowingScore >= 80 ? "Excellent Shadowing!" : 
                   shadowingScore >= 60 ? "Good Shadowing!" : 
                   shadowingScore >= 40 ? "Keep Practicing!" : "Try Again!"}
                </h3>
                <p className="text-lg text-primary font-semibold">
                  Shadowing Score: {shadowingScore.toFixed(1)}%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <h4 className="font-bold mb-1">Accuracy</h4>
                  <p className="text-2xl font-bold text-blue-600">{shadowingScore.toFixed(0)}%</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <h4 className="font-bold mb-1">Words Captured</h4>
                  <p className="text-2xl font-bold text-green-600">{transcript.split(' ').length}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <h4 className="font-bold mb-1">Difficulty</h4>
                  <p className="text-2xl font-bold text-purple-600">{currentText.difficulty}</p>
                </div>
              </div>
              
              {round < 5 && energy > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Next round starting soon...
                  </p>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="text-center mt-6 max-w-2xl">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Shadowing helps improve pronunciation, rhythm, and listening skills. Speak simultaneously with the audio, matching pace and intonation.
        </p>
      </div>

    </div>
  );
};
