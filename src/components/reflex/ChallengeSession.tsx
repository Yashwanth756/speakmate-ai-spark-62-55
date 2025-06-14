import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Clock, ArrowLeft, Play, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { getLanguageFeedback } from "@/lib/gemini-api";
import { SessionData } from "@/pages/Reflex";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  skill: string;
  color: string;
  difficulty: string;
}

interface ChallengeSessionProps {
  challenge: Challenge;
  onSessionComplete: (data: SessionData) => void;
  onBack: () => void;
}

const challengeQuestions = {
  "ai-debate": [
    "Should social media platforms ban political advertisements? Defend your position.",
    "Is artificial intelligence more beneficial or harmful to society? Argue your case.",
    "Should schools replace textbooks with tablets? Present your argument.",
    "Is remote work better than office work? Make your case.",
    "Should fast food advertising be banned? Defend your viewpoint."
  ],
  "precision-word": [
    "Describe your ideal vacation using these words: adventure, tranquil, explore, memorable, authentic.",
    "Talk about technology using: innovative, transform, efficiency, digital, revolutionary.",
    "Discuss education using: knowledge, inspire, critical, development, foundation.",
    "Describe leadership using: vision, influence, integrity, guidance, empowerment.",
    "Talk about friendship using: loyalty, trust, support, genuine, connection."
  ],
  "memory-loop": [
    "The quick brown fox jumps over the lazy dog near the sparkling river.",
    "Yesterday's meeting discussed important strategic planning for next quarter's ambitious goals.",
    "Professional development requires continuous learning, practical application, and constructive feedback from experienced mentors.",
    "The conference featured innovative speakers presenting cutting-edge research on sustainable technology solutions.",
    "International collaboration facilitates knowledge exchange, cultural understanding, and global problem-solving initiatives."
  ],
  "visual-response": [
    "Describe a bustling city market scene with vendors, customers, and various products.",
    "Explain what you see in a peaceful mountain landscape during sunrise.",
    "Describe a modern office environment with people working collaboratively.",
    "Paint a picture of a family gathering during a holiday celebration.",
    "Describe a scientific laboratory with researchers conducting experiments."
  ],
  "quick-fire": [
    "What's your favorite season and why?",
    "If you could have dinner with anyone, who would it be?",
    "What skill would you most like to learn?",
    "Describe your perfect weekend.",
    "What motivates you to keep learning?"
  ],
  "emotion-switcher": [
    "Say 'I can't believe this happened' with joy, then anger, then surprise.",
    "Express 'Thank you so much' with gratitude, sarcasm, then excitement.",
    "Say 'This is interesting' with curiosity, boredom, then enthusiasm.",
    "Express 'I understand' with empathy, frustration, then relief.",
    "Say 'Good morning' with happiness, tiredness, then enthusiasm."
  ],
  "story-stretch": [
    "Sarah found an old key in her grandmother's attic. When she touched it, strange things began to happen... Continue the story.",
    "The last person on Earth sat alone in a room. Then there was a knock at the door... What happens next?",
    "Tom discovered he could understand what animals were saying. The first conversation he had was shocking... Continue.",
    "Every morning, Lisa woke up to find a different flower on her doorstep. Today's flower was unlike any she'd seen... What unfolds?"
  ]
};

const ChallengeSession: React.FC<ChallengeSessionProps> = ({ challenge, onSessionComplete, onBack }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [sessionResponses, setSessionResponses] = useState<SessionData["responses"]>([]);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcript, isListening, supported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const [showMicError, setShowMicError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions];

  useEffect(() => {
    if (!supported) {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, [supported]);

  useEffect(() => {
    if (isRecording) {
      startListening();
      setStartTime(Date.now());
      setResponseTime(0);

      intervalRef.current = setInterval(() => {
        setResponseTime((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      stopListening();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, startListening, stopListening, startTime]);

  useEffect(() => {
    setUserResponse(transcript);
  }, [transcript]);

  const handleStartRecording = () => {
    setIsRecording(true);
    resetTranscript();
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    clearInterval(intervalRef.current as NodeJS.Timeout);

    if (!userResponse.trim()) {
      alert("Please provide a response before submitting.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const prompt = questions ? questions[questionIndex] : "Respond to the prompt.";
      const responseTimeInSeconds = (Date.now() - startTime) / 1000;
      const feedback = await getLanguageFeedback(prompt, userResponse);

      setSessionResponses(prev => [
        ...prev,
        {
          prompt: prompt,
          response: userResponse,
          responseTime: responseTimeInSeconds,
          accuracy: feedback.accuracy,
          fluency: feedback.fluency,
          confidence: feedback.confidence,
          grammarErrors: feedback.grammarErrors,
          vocabularyScore: feedback.vocabularyScore,
          pronunciationScore: feedback.pronunciationScore,
          detailedFeedback: feedback.detailedFeedback
        }
      ]);

      setTotalSessionTime(prev => prev + responseTimeInSeconds);
      resetTranscript();
      if (questions && questionIndex < questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
      } else {
        // Session complete - aggregate and send data
        const accuracySum = sessionResponses.reduce((acc, res) => acc + res.accuracy, 0);
        const fluencySum = sessionResponses.reduce((acc, res) => acc + res.fluency, 0);
        const confidenceSum = sessionResponses.reduce((acc, res) => acc + res.confidence, 0);

        const averageAccuracy = accuracySum / sessionResponses.length;
        const averageFluency = fluencySum / sessionResponses.length;
        const averageConfidence = confidenceSum / sessionResponses.length;

        // Mock overall analysis (replace with actual logic later)
        const overallAnalysis = {
          strengths: ["Good vocabulary", "Clear pronunciation"],
          weaknesses: ["Grammar errors", "Hesitations"],
          recommendations: ["Practice verb tenses", "Speak slower"],
          overallGrade: "B+"
        };

        const sessionData: SessionData = {
          mode: challenge.title,
          responses: sessionResponses,
          totalTime: totalSessionTime,
          streak: 5,
          score: Math.round((averageAccuracy + averageFluency + averageConfidence) / 3),
          overallAnalysis: overallAnalysis
        };

        onSessionComplete(sessionData);
      }
    } catch (error) {
      console.error("Error analyzing response:", error);
      alert("Failed to analyze response. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentQuestion = questions ? questions[questionIndex] : "No question available.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">{challenge.title}</CardTitle>
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-gray-600 dark:text-gray-400">
                <p>{challenge.description}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Question {questionIndex + 1}:</h3>
                <p className="text-lg">{currentQuestion}</p>
              </div>

              <div className="mb-4">
                <label htmlFor="userResponse" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Response:
                </label>
                <textarea
                  id="userResponse"
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  rows={4}
                  className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Speak or type your response here..."
                  disabled={isRecording || isAnalyzing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {isRecording ? (
                    <div className="text-red-500 font-semibold">
                      <Mic className="inline-block align-middle mr-1 animate-pulse" />
                      Recording... ({responseTime.toFixed(1)}s)
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <MicOff className="inline-block align-middle mr-1" />
                      Not Recording
                    </div>
                  )}
                </div>
                <div>
                  {isAnalyzing ? (
                    <Button disabled>Analyzing...</Button>
                  ) : (
                    <>
                      {!isRecording ? (
                        <Button onClick={handleStartRecording} disabled={isAnalyzing}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button onClick={handleStopRecording} disabled={isAnalyzing}>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { ChallengeSession };
