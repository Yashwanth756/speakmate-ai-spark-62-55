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

const MAX_TIME = 30; // seconds

const ChallengeSession: React.FC<ChallengeSessionProps> = ({
  challenge,
  onSessionComplete,
  onBack,
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [sessionResponses, setSessionResponses] = useState<SessionData["responses"]>([]);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timer, setTimer] = useState<number>(MAX_TIME);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Only for display, never editable by keyboard!
  const { transcript, isListening, supported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions];

  // TIMER for 30 sec and progress bar
  useEffect(() => {
    if (isRecording) {
      setTimer(MAX_TIME);
      setStartTime(Date.now());
      setResponseTime(0);

      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            handleAutoStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      intervalRef.current = setInterval(() => {
        setResponseTime((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [isRecording, startTime]);

  // Live auto-advance to next question after stop
  useEffect(() => {
    if (!isRecording && !isAnalyzing && responseTime > 0) {
      // After recording is stopped manually or by time
      handleSubmitResponse();
    }
    // eslint-disable-next-line
  }, [isRecording, isAnalyzing]);

  // BEGIN recording
  const handleStartRecording = () => {
    setIsRecording(true);
    setStartTime(Date.now());
    resetTranscript();
  };

  // Called by STOP button or timer
  const handleStopRecording = () => {
    setIsRecording(false);
    // No need to do anything else, useEffect above handles submit
  };

  // Timer reached zero!
  const handleAutoStop = () => {
    setIsRecording(false);
  };

  // Save and advance for each question
  const handleSubmitResponse = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    const userResponse = transcript.trim();
    const prompt = questions[questionIndex] || "Respond to the prompt.";
    const responseTimeInSeconds = responseTime || MAX_TIME;

    let feedbackResult: any = {};
    try {
      if (userResponse) {
        // Normal case: student answered
        feedbackResult = await getLanguageFeedback(prompt, userResponse);
      } else {
        // No response: zero score, ask Gemini for suggestion
        feedbackResult = await getLanguageFeedback(prompt, "");
        feedbackResult.feedback = feedbackResult.feedback || "No response given.";
        feedbackResult.corrected = feedbackResult.corrected || "";
        feedbackResult.explanation =
          "No response provided. Here is an example of how to answer this question.";
        feedbackResult.suggestedAnswer = feedbackResult.suggestedAnswer || "Here is an example answer: ...";
      }
    } catch (error) {
      feedbackResult.feedback = "Failed to get feedback.";
      feedbackResult.corrected = "";
      feedbackResult.explanation = "";
      feedbackResult.suggestedAnswer = "";
    }

    // Normalize feedback properties for SessionData
    const accuracy = userResponse ? (feedbackResult.accuracy ?? 80) : 0;
    const fluency = feedbackResult.fluencyScore ?? 0;
    const confidence = feedbackResult.confidenceScore ?? 0;
    const grammarErrors = feedbackResult.grammarErrors || [];
    const vocabularyScore = feedbackResult.vocabularyScore ?? 0;
    const pronunciationScore = feedbackResult.pronunciationScore ?? 0;
    const detailedFeedback = feedbackResult.feedback || '';

    setSessionResponses((prev) => [
      ...prev,
      {
        prompt,
        response: userResponse || "",
        responseTime: responseTimeInSeconds,
        accuracy,
        fluency,
        confidence,
        grammarErrors,
        vocabularyScore,
        pronunciationScore,
        detailedFeedback,
        corrected: feedbackResult.corrected || "",
        explanation: feedbackResult.explanation || "",
        suggestedAnswer: !userResponse ? (feedbackResult.suggestedAnswer || "") : undefined,
        grammarRulesBroken: feedbackResult.grammarRulesBroken || []
      }
    ]);
    setTotalSessionTime((prev) => prev + responseTimeInSeconds);

    resetTranscript();

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setResponseTime(0);
      setIsAnalyzing(false);
      setTimeout(() => handleStartRecording(), 300); // auto start next
    } else {
      // SESSION DONE: Aggregate, call onSessionComplete
      setIsAnalyzing(false);
      finalizeSession();
    }
  };

  const finalizeSession = () => {
    // Calculate averages
    const responses = sessionResponses;
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    const getAvg = (metric: keyof typeof sessionResponses[0]) =>
      sessionResponses.length
        ? sum((sessionResponses as any).map((r: any) => Number(r[metric] || 0))) /
          sessionResponses.length
        : 0;

    const report = {
      totalTime: totalSessionTime,
      accuracy: getAvg("accuracy"),
      fluency: getAvg("fluency"),
      vocabulary: getAvg("vocabularyScore"),
      pronunciation: getAvg("pronunciationScore"),
      confidence: getAvg("confidence"),
      precision: getAvg("accuracy"),
      speed: getAvg("responseTime"),
      // ... add more as desired
    };

    // Compose final SessionData
    const sessionData: SessionData = {
      mode: challenge.title,
      responses: sessionResponses,
      totalTime: totalSessionTime,
      streak: 5,
      score: Math.round((report.accuracy + report.fluency + report.confidence) / 3),
      overallAnalysis: {
        strengths: ["Vocabulary", "Pronunciation"], // Placeholders
        weaknesses: ["Speed", "Fluency"],
        recommendations: ["Try responding faster", "Practice accuracy"],
        overallGrade: "B"
      }
    };
    onSessionComplete(sessionData);
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
                  Live Transcription:
                </label>
                <textarea
                  id="userResponse"
                  value={transcript}
                  readOnly
                  tabIndex={-1}
                  rows={4}
                  className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white select-none bg-gray-100 cursor-not-allowed"
                  placeholder="Live speech transcription will appear here..."
                  style={{pointerEvents: "none", userSelect: "none"}}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {isRecording ? (
                    <div className="text-red-500 font-semibold">
                      <Mic className="inline-block align-middle mr-1 animate-pulse" />
                      Recording... ({(MAX_TIME - timer).toFixed(0)}s)
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
                        <Button onClick={handleStartRecording} disabled={isAnalyzing || timer === 0}>
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

              {/* Progress bar and timer display */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary">Time Left</span>
                  <span className="text-xs font-mono">{timer}s</span>
                </div>
                <Progress value={(timer / MAX_TIME) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { ChallengeSession };
