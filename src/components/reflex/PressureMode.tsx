import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Skull, Zap, Clock } from "lucide-react";
import { SessionData } from "@/pages/Reflex";

interface PressureModeProps {
  onSessionEnd: (data: SessionData) => void;
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  energy: number;
  setEnergy: (value: number) => void;
}

const pressureChallenges = [
  "Name 3 countries starting with 'B'",
  "Count backwards from 20 to 1",
  "Say the alphabet backwards from M to A", 
  "Name 5 animals that live in water",
  "Spell your full name backwards",
  "Name 4 colors that start with vowels",
  "Count by 3s from 3 to 30",
  "Say 5 words that rhyme with 'cat'",
  "Name the months with 31 days",
  "List 3 things you can do with a pencil"
];

export const PressureMode: React.FC<PressureModeProps> = ({
  onSessionEnd,
  transcript,
  isListening,
  startListening,
  stopListening,
  resetTranscript,
  energy,
  setEnergy
}) => {
  const [gameMode, setGameMode] = useState<"menu" | "sudden-death" | "time-attack">("menu");
  const [currentChallenge, setCurrentChallenge] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [responses, setResponses] = useState<any[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [isGameOver, setIsGameOver] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startSuddenDeath = () => {
    setGameMode("sudden-death");
    setLives(3);
    setRound(1);
    setScore(0);
    setStreakCount(0);
    setIsGameOver(false);
    startNewChallenge(5); // 5 seconds per challenge
  };

  const startTimeAttack = () => {
    setGameMode("time-attack");
    setRound(1);
    setScore(0);
    setStreakCount(0);
    setIsGameOver(false);
    startNewChallenge(3); // 3 seconds per challenge
  };

  const startNewChallenge = (timeLimit: number) => {
    const randomChallenge = pressureChallenges[Math.floor(Math.random() * pressureChallenges.length)];
    setCurrentChallenge(randomChallenge);
    setTimeLeft(timeLimit);
    resetTranscript();

    // Auto-start listening
    startListening();

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
    evaluateResponse(false); // Time's up = failed
  };

  const evaluateResponse = (isCorrect: boolean) => {
    const hasResponse = transcript.trim().length > 0;
    
    // Simple evaluation - if they spoke something, consider it a success for pressure mode
    const success = hasResponse && isCorrect !== false;
    
    const responseData = {
      prompt: currentChallenge,
      response: transcript,
      responseTime: 0,
      accuracy: success ? 100 : 0,
      fluency: hasResponse ? 80 : 0,
      confidence: success ? 90 : 0,
      grammarErrors: [],
      vocabularyScore: hasResponse ? 75 : 0,
      pronunciationScore: hasResponse ? 80 : 0,
      detailedFeedback: success ? "Good quick response!" : "Try to respond faster next time."
    };

    setResponses(prev => [...prev, responseData]);

    if (success) {
      const pointsEarned = gameMode === "time-attack" ? 15 : 20;
      setScore(prev => prev + pointsEarned);
      setStreakCount(prev => prev + 1);
      
      // Continue to next challenge
      setTimeout(() => {
        if (gameMode === "time-attack" && round >= 10) {
          // Time attack ends after 10 challenges
          endGame();
        } else {
          setRound(prev => prev + 1);
          startNewChallenge(gameMode === "time-attack" ? 3 : 5);
        }
      }, 1000);
    } else {
      if (gameMode === "sudden-death") {
        const newLives = lives - 1;
        setLives(newLives);
        setStreakCount(0);
        
        if (newLives <= 0) {
          setIsGameOver(true);
          endGame();
        } else {
          // Continue with one less life
          setTimeout(() => {
            setRound(prev => prev + 1);
            startNewChallenge(5);
          }, 2000);
        }
      } else {
        // Time attack continues even on failure
        setStreakCount(0);
        setTimeout(() => {
          if (round >= 10) {
            endGame();
          } else {
            setRound(prev => prev + 1);
            startNewChallenge(3);
          }
        }, 1000);
      }
    }
  };

  const endGame = () => {
    const successRate = responses.length > 0 ? (responses.filter(r => r.accuracy >= 50).length / responses.length) * 100 : 0;
    
    onSessionEnd({
      mode: "pressure-mode",
      responses,
      totalTime: (Date.now() - sessionStartTime) / 1000,
      streak: streakCount,
      score,
      overallAnalysis: {
        strengths: successRate >= 70 ? ["Quick thinking", "Fast responses"] : ["Persistence", "Effort"],
        weaknesses: successRate < 50 ? ["Response speed", "Accuracy under pressure"] : [],
        recommendations: ["Practice more quick-fire questions", "Work on thinking faster"],
        overallGrade: successRate >= 80 ? "A" : successRate >= 60 ? "B" : "C"
      }
    });
  };

  const handleCorrect = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    stopListening();
    evaluateResponse(true);
  };

  const handleSkip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    stopListening();
    evaluateResponse(false);
  };

  if (gameMode === "menu") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🔥 PRESSURE MODE 🔥</h1>
          <p className="text-xl text-red-600 dark:text-red-400 font-bold">
            EXTREME CHALLENGE - HIGH INTENSITY
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          
          {/* Sudden Death */}
          <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-2xl font-bold mb-4 text-red-600">Sudden Death</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                You have 3 lives. One mistake and you lose a life. No lives = Game Over!
              </p>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-2">Rules:</h3>
                <ul className="text-sm text-left space-y-1">
                  <li>• 5 seconds per challenge</li>
                  <li>• 3 lives total</li>
                  <li>• No response = lose a life</li>
                  <li>• Wrong answer = lose a life</li>
                </ul>
              </div>
              <Button 
                onClick={startSuddenDeath}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
                size="lg"
              >
                <Skull className="h-5 w-5 mr-2" />
                Enter Sudden Death
              </Button>
            </CardContent>
          </Card>

          {/* Time Attack */}
          <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold mb-4 text-orange-600">Time Attack</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Answer 10 challenges as fast as possible. Every second counts!
              </p>
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-2">Rules:</h3>
                <ul className="text-sm text-left space-y-1">
                  <li>• 3 seconds per challenge</li>
                  <li>• 10 challenges total</li>
                  <li>• No lives system</li>
                  <li>• Speed bonus points</li>
                </ul>
              </div>
              <Button 
                onClick={startTimeAttack}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Time Attack
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {gameMode === "sudden-death" ? "💀 SUDDEN DEATH" : "⚡ TIME ATTACK"}
        </h1>
        <div className="flex items-center justify-center gap-6 text-sm">
          <span>Round {round}{gameMode === "time-attack" ? "/10" : ""}</span>
          <span>Score: {score}</span>
          <span>Streak: {streakCount}</span>
          {gameMode === "sudden-death" && (
            <span className="text-red-500 font-bold">Lives: {lives}</span>
          )}
        </div>
      </div>

      {/* Lives Display for Sudden Death */}
      {gameMode === "sudden-death" && (
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i < lives ? 'bg-red-500 text-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              {i < lives ? '❤️' : '💔'}
            </div>
          ))}
        </div>
      )}

      {/* Main Challenge Card */}
      <Card className={`w-full max-w-2xl ${gameMode === "sudden-death" ? 'border-red-500' : 'border-orange-500'}`}>
        <CardContent className="p-8">
          
          {!isGameOver ? (
            <>
              {/* Timer */}
              <div className="text-center mb-6">
                <div className={`text-8xl font-bold mb-4 ${timeLeft <= 2 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                  {timeLeft}
                </div>
                <p className="text-lg font-bold">ANSWER NOW!</p>
              </div>

              {/* Challenge */}
              <div className={`${gameMode === "sudden-death" ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'} rounded-lg p-6 mb-6`}>
                <h2 className="text-2xl font-bold text-center">{currentChallenge}</h2>
              </div>

              {/* Response */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 min-h-[80px]">
                <h3 className="text-sm font-medium mb-2">Your Answer:</h3>
                <p className="text-lg">{transcript || "Speak your answer now!"}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleCorrect}
                  className="bg-green-500 hover:bg-green-600"
                >
                  ✓ Correct
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="border-red-500 text-red-500"
                >
                  ✗ Skip/Wrong
                </Button>
              </div>

              {/* Mic Status */}
              <div className="text-center mt-4">
                <div className="flex items-center justify-center gap-2">
                  {isListening ? (
                    <Mic className="h-5 w-5 text-red-500 animate-pulse" />
                  ) : (
                    <MicOff className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="text-sm">
                    {isListening ? "Recording..." : "Not recording"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-2xl font-bold mb-4">GAME OVER!</h2>
              <p className="text-lg mb-4">
                You survived {round - 1} rounds with a score of {score}!
              </p>
              <Button onClick={() => setGameMode("menu")}>
                Return to Menu
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
};
