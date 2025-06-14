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
    "Close your eyes for a moment and visualize this imaginary scene: You walk into a bustling city market filled with colors, sounds, and fragrances. Describe in vivid detail what you imagine seeing, hearing, and feeling.",
    "Picture this in your mind: a peaceful mountain landscape at sunrise, mist rolling off the peaks, the sky painted with soft colors. Visualize this illusion and speak about what you experience.",
    "Imagine stepping into a modern office full of people collaborating, technology everywhere, a sense of energy in the air. Before you answer, take a moment to create this illusion in your mind. What do you see happening?",
    "Visualize a heartwarming family gathering during a holiday; there's laughter, conversation, and favorite foods. Create this illusion in your mind’s eye and describe what you experience.",
    "Imagine you're in a high-tech scientific laboratory with researchers buzzing about, experiments in progress. Pause, build this imaginary scene mentally, and then describe the details you notice."
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

  // NEW: Local state to hold up-to-date cumulative transcript for the live display
  const [userTranscript, setUserTranscript] = useState("");

  // At the start of each question, reset transcript and userTranscript
  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setQuestionStartTime(Date.now());
    resetTranscript();
    setUserTranscript(""); // Clear display transcript at new question
  }, [currentQuestion, timePerQuestion, resetTranscript]);

  // Append transcript as new finalized speech comes in. Also, show interim phrase live. 
  useEffect(() => {
    // Always join finalized and interim for best live feedback
    setUserTranscript((transcript + (interimTranscript || "")).trim());
  }, [transcript, interimTranscript]);

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
    // Accumulate both final + interim for the freshest version, trimmed
    let userResponse = (transcript + (interimTranscript || "")).trim();

    // Save only if there is any speech (empty OK, no default fallback)
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
      // Prepare questions + responses section with placeholders for missing answers
      const questionsForBatch = questions.map((q, i) => ({
        question: q,
        answer: allTranscripts[i]?.trim() && allTranscripts[i] !== "No response"
          ? allTranscripts[i]
          : "No response"
      }));

      // Batched prompt for Gemini analysis (now more explicit per your request)
      const bulkPrompt = `
        Analyze the following 5 English answers. For EACH QUESTION/RESPONSE PAIR, provide:
        - The user's original response as "original"
        - A fully corrected, improved version as "corrected" (if no response, suggest a strong answer)
        - An explanation of the key mistakes, as "explanation"
        - An array "broken_rules" listing grammar rules that were broken (use grammatical terms)
        - Numeric scores out of 100 for: "accuracy", "fluency", "pronunciation", "vocabulary", "precision", "speed", "confidence"
        If user response is missing ("No response"), all scores should be 0 and provide a model answer as "corrected".
        Return a JSON array using this structure:
        [
          {
            "question": (the question),
            "original": (verbatim student answer or "No response"),
            "corrected": (fully corrected/model answer),
            "explanation": (explanation string, or "No response provided"),
            "broken_rules": [list of broken grammar rules],
            "accuracy": 0-100,
            "fluency": 0-100,
            "pronunciation": 0-100,
            "vocabulary": 0-100,
            "precision": 0-100,
            "speed": 0-100,
            "confidence": 0-100
          },
          ...
        ]
        
        QA PAIRS:
        ${questionsForBatch.map((pair, i) =>
          `Q${i+1}: "${pair.question}"\nA${i+1}: "${pair.answer}"`
        ).join('\n')}
      `.trim();

      // Use Gemini API for analysis
      const { feedback } = await getLanguageFeedback(bulkPrompt);

      // Extract the JSON array from the feedback string robustly
      const arrayMatch = feedback.match(/\[[\s\S]*\]/m);
      let resultsArr = [];
      if (arrayMatch) {
        try {
          resultsArr = JSON.parse(arrayMatch[0]);
        } catch {
          resultsArr = [];
        }
      }

      // Fallback: if Gemini did not return an array, synthesize from old responses
      if (!Array.isArray(resultsArr) || resultsArr.length !== questions.length) {
        resultsArr = questionsForBatch.map((pair, i) => ({
          question: pair.question,
          original: pair.answer,
          corrected: pair.answer === "No response" ? "(No answer provided. Sample: ...)" : pair.answer,
          explanation: pair.answer === "No response" ? "No response provided" : "",
          broken_rules: [],
          accuracy: pair.answer === "No response" ? 0 : 60,
          fluency: pair.answer === "No response" ? 0 : 60,
          pronunciation: pair.answer === "No response" ? 0 : 75,
          vocabulary: pair.answer === "No response" ? 0 : 60,
          precision: pair.answer === "No response" ? 0 : 60,
          speed: pair.answer === "No response" ? 0 : 60,
          confidence: pair.answer === "No response" ? 0 : 60
        }));
      }

      // Compute averages, detailed analysis, and report
      let sumPronunciation = 0, sumFluency = 0, sumVocabulary = 0, sumPrecision = 0;
      let sumAccuracy = 0, sumSpeed = 0, sumConfidence = 0;

      const responsesWithAnalysis = resultsArr.map((result: any) => {
        sumPronunciation += result.pronunciation ?? 0;
        sumFluency += result.fluency ?? 0;
        sumVocabulary += result.vocabulary ?? 0;
        sumPrecision += result.precision ?? 0;
        sumAccuracy += result.accuracy ?? 0;
        sumSpeed += result.speed ?? 0;
        sumConfidence += result.confidence ?? 0;

        return {
          question: result.question,
          original: result.original,
          corrected: result.corrected,
          explanation: result.explanation,
          grammarErrors: (result.broken_rules || []).map((rule: string) => ({
            error: rule,
            correction: result.corrected,
            explanation: result.explanation
          })),
          accuracy: result.accuracy ?? 0,
          fluency: result.fluency ?? 0,
          confidence: result.confidence ?? 0,
          vocabularyScore: result.vocabulary ?? 0,
          pronunciationScore: result.pronunciation ?? 0,
          speed: result.speed ?? 0,
          detailedFeedback: result.explanation || ""
        };
      });

      const n = questions.length || 1;
      const validAnswers = responsesWithAnalysis.filter(r => r.original !== "No response").length;
      function average(val: number) {
        return Math.round(val / n);
      }
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: responsesWithAnalysis,
        totalTime,
        streak: responsesWithAnalysis.reduce((streak, r) => (r.accuracy >= 70 ? streak + 1 : streak), 0),
        score: average(sumAccuracy),
        overallAnalysis: {
          strengths: [
            validAnswers === n ? "Completed all challenges" : `Answered ${validAnswers} of 5`,
            "Active participation"
          ],
          weaknesses: [
            ...(validAnswers < n ? ["Missed one or more responses"] : []),
            "See individual feedback"
          ],
          recommendations: [
            ...(validAnswers < n ? ["Aim to answer every question, even small attempts help!"] : []),
            "Practice identified grammar rules",
            "Review corrected answers"
          ],
          overallGrade: getGradeFromScore(sumAccuracy / n)
        },
        metrics: {
          pronunciation: average(sumPronunciation),
          fluency: average(sumFluency),
          vocabulary: average(sumVocabulary),
          precision: average(sumPrecision),
          accuracy: average(sumAccuracy),
          speed: average(sumSpeed),
          totalTime: Math.round(totalTime)
        }
      };

      onSessionComplete(sessionData);

    } catch (error) {
      console.error("Error with Gemini detailed analysis:", error);
      // Robust fallback (missing API, rate limit, etc)
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: questions.map((q, i) => ({
          question: q,
          original: allTranscripts[i]?.trim() || "",
          corrected: "",
          explanation: "Analysis unavailable",
          grammarErrors: [],
          accuracy: allTranscripts[i] ? 60 : 0,
          fluency: allTranscripts[i] ? 60 : 0,
          confidence: allTranscripts[i] ? 60 : 0,
          vocabularyScore: allTranscripts[i] ? 60 : 0,
          pronunciationScore: allTranscripts[i] ? 75 : 0,
          speed: allTranscripts[i] ? 60 : 0,
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
      {(isRecording || userTranscript) && (
        <Card className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-5 w-5" />
              {isRecording ? "Live Transcription" : "Your Response"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TranscriptDisplay
              transcript={userTranscript}
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
