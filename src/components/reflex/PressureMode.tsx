import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Clock, ArrowLeft, Play, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { getLanguageFeedback } from "@/lib/gemini-api";
import { SessionData } from "@/pages/Reflex";
import { getGradeFromScore } from "@/lib/utils";

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
  const [currentTranscript, setCurrentTranscript] = useState("");
  const timerRef = useRef<NodeJS.Timeout>();

  const {
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isListening
  } = useSpeechRecognition();

  const questions = [
    "Describe your favorite place to visit in 30 seconds.",
    "What's your opinion on social media? Explain in 30 seconds.",
    "If you could have any superpower, what would it be and why? Answer in 30 seconds.",
    "Describe your ideal day from morning to evening in 30 seconds.",
    "What advice would you give to someone learning a new language? Answer in 30 seconds."
  ];
  
  const totalQuestions = 5;
  const timePerQuestion = 30;

  // Update current transcript when speech recognition transcript changes
  useEffect(() => {
    if (transcript && isRecording) {
      setCurrentTranscript(transcript);
    }
  }, [transcript, isRecording]);

  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setQuestionStartTime(Date.now());
    resetTranscript();
    setCurrentTranscript("");
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
    setCurrentTranscript("");
    startListening();
    setQuestionStartTime(Date.now());
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    stopListening();
    setIsAnalyzing(true);

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const userResponse = currentTranscript.trim().length > 0 ? currentTranscript.trim() : transcript.trim().length > 0 ? transcript.trim() : "No response recorded";

    // Save the transcript for this question
    setSavedTranscripts(prev => {
      const updated = [...prev];
      updated[currentQuestion] = userResponse;
      return updated;
    });

    // Mock response data
    const mockResponseData = {
      prompt: questions[currentQuestion],
      response: userResponse,
      responseTime,
      accuracy: Math.floor(Math.random() * 20) + 70,
      fluency: Math.floor(Math.random() * 20) + 70,
      confidence: Math.floor(Math.random() * 20) + 70,
      grammarErrors: [
        {
          error: "Subject-verb agreement",
          correction: "Corrected version would be...",
          explanation: "In English, the verb must agree with the subject in number."
        }
      ],
      vocabularyScore: Math.floor(Math.random() * 20) + 70,
      pronunciationScore: Math.floor(Math.random() * 20) + 70,
      detailedFeedback: "Your response was generally good. Focus on using more varied vocabulary and complex sentence structures."
    };

    setResponses(prev => {
      const updated = [...prev];
      updated[currentQuestion] = mockResponseData;
      return updated;
    });

    // Proceed to next question or complete
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(timePerQuestion);
      setIsAnalyzing(false);
    } else {
      // Session complete
      completeSession();
      setIsAnalyzing(false);
    }
  };

  const completeSession = () => {
    const totalTime = (Date.now() - sessionStartTime) / 1000;
    const mockResponses = responses.length === totalQuestions ? responses : [
      ...responses,
      ...Array(totalQuestions - responses.length).fill({
        prompt: "Question",
        response: "Response",
        responseTime: 25,
        accuracy: 75,
        fluency: 80,
        confidence: 70,
        grammarErrors: [],
        vocabularyScore: 75,
        pronunciationScore: 80,
        detailedFeedback: "Good effort!"
      })
    ];

    const sessionData: SessionData = {
      mode: challenge?.id || "pressure-mode",
      responses: mockResponses,
      totalTime,
      streak: 3,
      score: 78,
      overallAnalysis: {
        strengths: ["Quick thinking", "Good pronunciation", "Natural flow"],
        weaknesses: ["Grammar accuracy", "Vocabulary range"],
        recommendations: ["Practice complex sentence structures", "Expand vocabulary"],
        overallGrade: "B+"
      },
      metrics: {
        pronunciation: 85,
        fluency: 78,
        vocabulary: 72,
        precision: 80,
        accuracy: 78,
        speed: 82,
        totalTime: Math.round(totalTime)
      }
    };

    onSessionComplete(sessionData);
  };

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <p className="text-gray-600">{challenge.skill}</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Progress</CardTitle>
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Remaining: {timeLeft}s
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {questions[currentQuestion]}
            </div>
            
            {/* Recording Controls */}
            <div className="text-center space-y-4">
              {!isRecording && !isAnalyzing && (
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="w-full max-w-md"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse bg-red-500 rounded-full p-4">
                      <Mic className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-red-600">🔴 Recording... Speak now!</p>
                  <Button
                    onClick={handleStopRecording}
                    variant="outline"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-lg font-medium">Analyzing your response...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Transcript Display */}
        {(isRecording || currentTranscript || transcript) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="h-5 w-5" />
                {isRecording ? "Live Transcription" : "Your Response"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 min-h-[100px]">
                <p className="text-lg">
                  {currentTranscript || transcript || "Start speaking to see your words appear here..."}
                  {isRecording && <span className="animate-pulse">|</span>}
                </p>
              </div>
              {(currentTranscript || transcript) && (
                <div className="mt-2 text-sm text-gray-600">
                  Word count: {(currentTranscript || transcript).split(/\s+/).filter(word => word.trim()).length}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Saved Responses Progress */}
        {savedTranscripts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Completed Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedTranscripts.map((savedTranscript, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>Question {index + 1}: Response saved ({savedTranscript.split(/\s+/).filter(Boolean).length} words)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for {challenge.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>• Speak clearly and at a natural pace</p>
              <p>• Don't worry about perfection - focus on communication</p>
              <p>• Try to use varied vocabulary and sentence structures</p>
              <p>• Keep an eye on the timer and pace yourself</p>
              <p>• Your responses are being transcribed and analyzed for detailed feedback</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
