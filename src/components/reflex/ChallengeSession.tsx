import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Clock, ArrowLeft, Play, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { getLanguageFeedback } from "@/lib/gemini-api";
import { SessionData } from "@/pages/Reflex";
import { getGradeFromScore } from "@/lib/utils";
import { TranscriptDisplay } from "./TranscriptDisplay";

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
    "Every morning, Lisa woke up to find a different flower on her doorstep. Today's flower was unlike any she'd seen... What unfolds?",
    "The old bookstore owner handed me a book that wasn't there moments before. 'This one chooses its reader,' he said... Continue the tale."
  ],
  "shadow-mode": [
    "The weather is absolutely beautiful today, perfect for outdoor activities.",
    "Technology has fundamentally transformed how we communicate and work together.",
    "Education plays a crucial role in personal development and societal progress.",
    "Traveling broadens perspectives and creates lasting memories for everyone involved.",
    "Effective leadership requires vision, empathy, and strong communication skills."
  ]
};

export const ChallengeSession: React.FC<ChallengeSessionProps> = ({
  challenge,
  onSessionComplete,
  onBack
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [savedTranscripts, setSavedTranscripts] = useState<string[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();
  const {
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isListening,
    interimTranscript,
  } = useSpeechRecognition();

  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions] || [];
  const totalQuestions = 5;
  const timePerQuestion = challenge.id === "quick-fire" ? 5 : 30;

  // Compose the live transcript from finalized + interim for UI
  const liveTranscript = transcript + (interimTranscript || '');

  // Update the current transcript from the speech recognition transcript
  useEffect(() => {
    if (isRecording && transcript) {
    }
  }, [transcript, isRecording]);

  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setQuestionStartTime(Date.now());
    resetTranscript();
  }, [currentQuestion, timePerQuestion, resetTranscript]);

  useEffect(() => {
    if (timeLeft > 0 && isRecording) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      handleStopRecording();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    resetTranscript();
    startListening();
    setQuestionStartTime(Date.now());
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    stopListening();
    setIsAnalyzing(true);

    const responseTime = (Date.now() - questionStartTime) / 1000;

    // Always use *latest* composite (final + interim) transcript, trimmed
    let userResponse = (transcript + (interimTranscript || "")).trim();

    // Do not use fallback text; just save the transcript as is (if empty, "")
    setSavedTranscripts(prev => {
      const updated = [...prev];
      updated[currentQuestion] = userResponse;
      return updated;
    });

    const responseData = {
      question: questions[currentQuestion],
      original: userResponse,
      corrected: "",
      explanation: "",
      grammarErrors: [],
      accuracy: 0,
      fluency: 0,
      confidence: 0,
      vocabularyScore: 0,
      pronunciationScore: Math.floor(Math.random() * 20) + 75,
      speed: 0,
      detailedFeedback: ""
    };

    setResponses(prev => {
      const updated = [...prev];
      updated[currentQuestion] = responseData;
      return updated;
    });

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(timePerQuestion);
      setIsAnalyzing(false);
    } else {
      await completeSessionWithDetailedAnalysis(
        [...responses.slice(0, totalQuestions - 1), responseData],
        [...savedTranscripts.slice(0, totalQuestions - 1), userResponse]
      );
      setIsAnalyzing(false);
    }
  };

  async function completeSessionWithDetailedAnalysis(allResponses: any[], allTranscripts: string[]) {
    const totalTime = (Date.now() - sessionStartTime) / 1000;

    try {
      // Batched prompt for Gemini analysis
      const bulkPrompt = `
        Analyze these 5 English responses for grammar, fluency, and accuracy.
        Return a JSON array with detailed feedback for each response.

        Questions and Responses:
        ${questions.map((q, i) => `Q${i+1}: "${q}"\nA${i+1}: "${allTranscripts[i] || "No response"}"`).join('\n')}

        For each response, provide:
        {
          "question": "the question",
          "original": "student's answer verbatim",
          "corrected": "improved version",
          "explanation": "brief explanation of mistakes",
          "broken_rules": ["grammar rules broken"],
          "accuracy": 0-100,
          "fluency": 0-100,
          "pronunciation": 0-100,
          "vocabulary": 0-100,
          "precision": 0-100,
          "speed": 0-100
        }
      `;

      const { feedback } = await getLanguageFeedback(bulkPrompt);

      // Try to parse the JSON response
      const arrayMatch = feedback.match(/\[(.|\s|\n)*\]/m);
      let resultsArr = [];
      
      if (arrayMatch) {
        try {
          resultsArr = JSON.parse(arrayMatch[0]);
        } catch {
          resultsArr = [];
        }
      }

      // Fallback if parsing fails
      if (!Array.isArray(resultsArr) || resultsArr.length === 0) {
        resultsArr = allResponses.map((resp, i) => ({
          question: questions[i],
          original: allTranscripts[i] || "",
          corrected: "",
          explanation: "",
          broken_rules: [],
          accuracy: 60,
          fluency: 60,
          pronunciation: 80,
          vocabulary: 60,
          precision: 60,
          speed: 60
        }));
      }

      // Calculate metrics and create session data
      let sumPronunciation = 0, sumFluency = 0, sumVocabulary = 0;
      let sumPrecision = 0, sumAccuracy = 0, sumSpeed = 0;

      const responsesWithAnalysis = resultsArr.map((gemini, i) => {
        sumPronunciation += gemini.pronunciation ?? 0;
        sumFluency += gemini.fluency ?? 0;
        sumVocabulary += gemini.vocabulary ?? 0;
        sumPrecision += gemini.precision ?? 0;
        sumAccuracy += gemini.accuracy ?? 0;
        sumSpeed += gemini.speed ?? 0;

        return {
          question: gemini.question,
          original: gemini.original,
          corrected: gemini.corrected,
          explanation: gemini.explanation,
          grammarErrors: (gemini.broken_rules || []).map((rule: string) => ({
            error: rule,
            correction: gemini.corrected,
            explanation: gemini.explanation
          })),
          accuracy: gemini.accuracy ?? 60,
          fluency: gemini.fluency ?? 60,
          confidence: Math.round((gemini.fluency + gemini.vocabulary + gemini.precision) / 3) || 65,
          vocabularyScore: gemini.vocabulary ?? 60,
          pronunciationScore: gemini.pronunciation ?? 75,
          speed: gemini.speed ?? 60,
          detailedFeedback: gemini.explanation || ""
        };
      });

      const n = resultsArr.length || 1;
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: responsesWithAnalysis,
        totalTime,
        streak: responsesWithAnalysis.reduce((streak, r) => (r.accuracy >= 70 ? streak + 1 : streak), 0),
        score: Math.round(sumAccuracy / n),
        overallAnalysis: {
          strengths: ["Completed all challenges", "Active participation"],
          weaknesses: ["See individual question feedback"],
          recommendations: ["Practice identified grammar rules", "Review corrected answers"],
          overallGrade: getGradeFromScore(sumAccuracy / n)
        },
        metrics: {
          pronunciation: Math.round(sumPronunciation / n),
          fluency: Math.round(sumFluency / n),
          vocabulary: Math.round(sumVocabulary / n),
          precision: Math.round(sumPrecision / n),
          accuracy: Math.round(sumAccuracy / n),
          speed: Math.round(sumSpeed / n),
          totalTime: Math.round(totalTime)
        }
      };

      onSessionComplete(sessionData);

    } catch (error) {
      console.error("Error with Gemini analysis:", error);
      
      // Fallback session data
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: allResponses.map((resp, i) => ({
          question: questions[i],
          original: allTranscripts[i] || "",
          corrected: "",
          explanation: "Analysis unavailable",
          grammarErrors: [],
          accuracy: 60,
          fluency: 60,
          confidence: 60,
          vocabularyScore: 60,
          pronunciationScore: 75,
          speed: 60,
          detailedFeedback: "Please try again for detailed feedback"
        })),
        totalTime: (Date.now() - sessionStartTime) / 1000,
        streak: 3,
        score: 60,
        overallAnalysis: {
          strengths: ["Completed all challenges"],
          weaknesses: ["Analysis unavailable"],
          recommendations: ["Try again for detailed feedback"],
          overallGrade: "C"
        },
        metrics: {
          pronunciation: 75,
          fluency: 60,
          vocabulary: 60,
          precision: 60,
          accuracy: 60,
          speed: 60,
          totalTime: Math.round((Date.now() - sessionStartTime) / 1000)
        }
      };
      onSessionComplete(sessionData);
    }
  }

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{challenge.title}</h1>
            <p className="text-gray-600 dark:text-gray-300">{challenge.skill}</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Progress</CardTitle>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Remaining: {timeLeft}s
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-blue-700">
              {questions[currentQuestion]}
            </div>
            
            {/* Recording Controls */}
            <div className="text-center space-y-4">
              {!isRecording && !isAnalyzing && (
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 text-lg shadow-lg"
                >
                  <Play className="h-6 w-6 mr-3" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse bg-red-500 rounded-full p-6 shadow-lg">
                      <Mic className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <p className="text-xl font-medium text-red-600 dark:text-red-400">🔴 Recording... Speak now!</p>
                  <Button
                    onClick={handleStopRecording}
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-4">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Analyzing your response...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Live Transcript Display */}
      {(isRecording || transcript || interimTranscript) && (
        <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-5 w-5" />
              {isRecording ? "Live Transcription" : "Your Response"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TranscriptDisplay
              transcript={liveTranscript}
              isRecording={isRecording}
            />
          </CardContent>
        </Card>
      )}
      {/* Saved Responses Progress */}
      {savedTranscripts.length > 0 && (
        <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Completed Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedTranscripts.map((saved, index) => {
                const wordCount = saved.trim().split(/\s+/).filter(Boolean).length;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      ✓
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold">Question {index + 1}:</span> Response saved ({wordCount} {wordCount === 1 ? "word" : "words"})
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

        {/* Tips */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for {challenge.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
              {challenge.id === "ai-debate" && (
                <div className="space-y-1">
                  <p>• Present clear arguments with supporting reasons</p>
                  <p>• Use logical connectors (however, therefore, because)</p>
                  <p>• Acknowledge counterpoints before refuting them</p>
                </div>
              )}
              {challenge.id === "precision-word" && (
                <div className="space-y-1">
                  <p>• Use ALL the target words naturally in your response</p>
                  <p>• Don't force them - make them fit the context</p>
                  <p>• Show you understand their meanings</p>
                </div>
              )}
              {challenge.id === "memory-loop" && (
                <div className="space-y-1">
                  <p>• Listen carefully to every word</p>
                  <p>• Repeat with the same tone and pace</p>
                  <p>• Focus on exact word order</p>
                </div>
              )}
              <p>• Speak clearly and at a natural pace</p>
              <p>• Don't worry about perfection - focus on communication</p>
              <p>• Your responses are being transcribed and analyzed for detailed feedback</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
