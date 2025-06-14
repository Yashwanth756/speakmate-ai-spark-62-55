import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, ArrowLeft, Play, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { getLanguageFeedback, sendMessageToGemini } from "@/lib/gemini-api";
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

const QUESTION_TIME_LIMIT = 30; // seconds

const ChallengeSession: React.FC<ChallengeSessionProps> = ({
  challenge,
  onSessionComplete,
  onBack
}) => {
  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions] || [];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionResponses, setSessionResponses] = useState<SessionData["responses"]>([]);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timerIds, setTimerIds] = useState<{ intervalId: ReturnType<typeof setInterval> | null, timeoutId: ReturnType<typeof setTimeout> | null }>({ intervalId: null, timeoutId: null });
  const { transcript, isListening, supported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Start live transcription when recording starts
  useEffect(() => {
    if (isRecording) {
      resetTranscript();
      startListening();
      setStartTime(Date.now());
      setElapsedTime(0);

      // Start timer for updating elapsedTime
      const intervalId = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100);

      // Start 30 second timeout for the question
      const timeoutId = setTimeout(() => {
        handleAutoSubmit();
      }, QUESTION_TIME_LIMIT * 1000);

      // Save intervalId and timeoutId in state
      setTimerIds({ intervalId, timeoutId });
    } else {
      stopListening();
      // Clear both timers
      if (timerIds.intervalId) clearInterval(timerIds.intervalId);
      if (timerIds.timeoutId) clearTimeout(timerIds.timeoutId);
      setTimerIds({ intervalId: null, timeoutId: null });
    }
    // Cleanup
    return () => {
      stopListening();
      if (timerIds.intervalId) clearInterval(timerIds.intervalId);
      if (timerIds.timeoutId) clearTimeout(timerIds.timeoutId);
      setTimerIds({ intervalId: null, timeoutId: null });
    };
    // eslint-disable-next-line
  }, [isRecording]);

  // Sync userResponse with transcript
  useEffect(() => {
    setUserResponse(transcript);
  }, [transcript]);

  // Prevent manual changes to transcript field: only from speech recognition.
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // do nothing (makes textarea read-only)
  };

  // Start recording (begin question)
  const handleStartRecording = useCallback(() => {
    setElapsedTime(0);
    setIsRecording(true);
    resetTranscript();
  }, [resetTranscript]);

  // Core: Used for both auto and manual stop
  const finishRecordingAndSave = useCallback(
    async (autoSubmit = false) => {
      setIsRecording(false);
      // Clear both timers
      if (timerIds.intervalId) clearInterval(timerIds.intervalId);
      if (timerIds.timeoutId) clearTimeout(timerIds.timeoutId);
      setTimerIds({ intervalId: null, timeoutId: null });
      setIsAnalyzing(true);

      const prompt = questions[questionIndex];

      let responseText = userResponse.trim();
      let feedback: any;
      let answerSuggestion: string | undefined = undefined;
      let grammarScore = 0,
        vocabularyScore = 0,
        fluencyScore = 0;

      // If no response – fetch suggestion from Gemini
      if (!responseText) {
        // Assign 0 for the scores, and get a sample answer from AI
        try {
          answerSuggestion = await sendMessageToGemini(
            `Please provide a sample answer in good English for the following prompt as a student's answer only: "${prompt}"`,
            "reflex-challenge"
          );
        } catch (err) {
          answerSuggestion = "Sorry, no suggestion available right now.";
        }
      }

      // Always get feedback for consistency (if no answer, feedback will be for the suggestion)
      try {
        // Use user response if present, otherwise the suggestion for feedback
        const analyzedText = responseText || answerSuggestion || "";
        feedback = await getLanguageFeedback(analyzedText);

        grammarScore = feedback.grammarScore ?? 0;
        vocabularyScore = feedback.vocabularyScore ?? 0;
        fluencyScore = feedback.fluencyScore ?? 0;
      } catch (error) {
        feedback = {
          feedback: "Could not analyze your response.",
          grammarScore: 0,
          vocabularyScore: 0,
          fluencyScore: 0
        };
      }

      // "Accuracy" is just an average of the 3 scores for now.
      const accuracy =
        responseText ? Math.round((grammarScore + vocabularyScore + fluencyScore) / 3) : 0;

      // Save this response
      setSessionResponses(prev => [
        ...prev,
        {
          prompt,
          response: responseText || "(No response provided)",
          responseTime: elapsedTime,
          accuracy: accuracy,
          fluency: fluencyScore,
          confidence: fluencyScore, // placeholder, for future improvement
          grammarErrors: [], // placeholder, no info from Gemini
          vocabularyScore: vocabularyScore,
          pronunciationScore: fluencyScore, // placeholder, no real pronunciation eval
          detailedFeedback: feedback.feedback,
          aiSuggestedAnswer: !responseText && answerSuggestion ? answerSuggestion : undefined
        }
      ]);
      setTotalSessionTime(prev => prev + elapsedTime);

      resetTranscript();
      setUserResponse("");

      setTimeout(() => {
        setIsAnalyzing(false);
        // Next question or finish
        if (questionIndex < questions.length - 1) {
          setQuestionIndex(prev => prev + 1);
          setElapsedTime(0);
          setIsRecording(false);
        } else {
          // Calculate overall stats and finish
          const responses = [
            ...sessionResponses,
            {
              prompt,
              response: responseText || "(No response provided)",
              responseTime: elapsedTime,
              accuracy: accuracy,
              fluency: fluencyScore,
              confidence: fluencyScore,
              grammarErrors: [],
              vocabularyScore: vocabularyScore,
              pronunciationScore: fluencyScore,
              detailedFeedback: feedback.feedback,
              aiSuggestedAnswer: !responseText && answerSuggestion ? answerSuggestion : undefined
            }
          ];

          const accuracySum = responses.reduce((acc, res) => acc + (res.accuracy || 0), 0);
          const fluencySum = responses.reduce((acc, res) => acc + (res.fluency || 0), 0);
          const confidenceSum = responses.reduce((acc, res) => acc + (res.confidence || 0), 0);
          const averageAccuracy = accuracySum / responses.length;
          const averageFluency = fluencySum / responses.length;
          const averageConfidence = confidenceSum / responses.length;

          const sessionData: SessionData = {
            mode: challenge.title,
            responses: responses,
            totalTime: totalSessionTime + elapsedTime,
            streak: 5,
            score: Math.round((averageAccuracy + averageFluency + averageConfidence) / 3),
            overallAnalysis: {
              strengths: ["Good vocabulary", "Clear pronunciation"],
              weaknesses: ["Grammar errors", "Hesitations"],
              recommendations: ["Practice verb tenses", "Speak slower"],
              overallGrade: "B+"
            }
          };
          onSessionComplete(sessionData);
        }
      }, 600); // feedback transition
    },
    // eslint-disable-next-line
    [elapsedTime, questionIndex, userResponse, questions, challenge.title, sessionResponses, totalSessionTime, timerIds]
  );

  // Manual stop recording
  const handleStopRecording = () => {
    finishRecordingAndSave(false);
  };

  // Called automatically after 30 sec if not submitted early
  const handleAutoSubmit = () => {
    setIsRecording(false);
    finishRecordingAndSave(true);
  };

  const currentQuestion = questions && questions[questionIndex] ? questions[questionIndex] : "No question available.";
  const secondsLeft = Math.max(0, QUESTION_TIME_LIMIT - Math.round(elapsedTime));

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
                  Your Response: <span className="ml-3 text-red-500">{secondsLeft}s</span>
                </label>
                <textarea
                  id="userResponse"
                  value={userResponse}
                  onChange={handleTextareaChange}
                  rows={4}
                  readOnly
                  className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Speak to answer. Live transcription will appear here..."
                  disabled
                  aria-readonly
                  tabIndex={-1}
                  style={{ userSelect: "none", pointerEvents: "none", backgroundColor: "#f3f4f6" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {isRecording ? (
                    <div className="text-red-500 font-semibold">
                      <Mic className="inline-block align-middle mr-1 animate-pulse" />
                      Recording... ({elapsedTime.toFixed(1)}s)
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

// src/components/reflex/ChallengeSession.tsx is now quite long. Consider refactoring into smaller components for readability and maintainability.
