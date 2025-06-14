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
    isListening
  } = useSpeechRecognition();

  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions] || [];
  const totalQuestions = 5;
  const timePerQuestion = challenge.id === "quick-fire" ? 10 : 30;

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
    const userResponse = transcript.trim().length > 0 ? transcript.trim() : "No response recorded";

    // Save the transcript for this question immediately (replace, not append full history)
    setSavedTranscripts(prev => {
      const updated = [...prev];
      updated[currentQuestion] = userResponse; // ensure only one transcript per question
      return updated;
    });

    // For metrics, save immediately (including word count!)
    const responseData = {
      prompt: questions[currentQuestion],
      response: userResponse,
      responseTime,
      wordCount: userResponse.trim().split(/\s+/).filter(Boolean).length,
      // Placeholders for scores/analysis, will update after batch feedback
      accuracy: 0,
      fluency: 0,
      confidence: 0,
      grammarErrors: [],
      vocabularyScore: 0,
      pronunciationScore: Math.floor(Math.random() * 20) + 75,
      detailedFeedback: ""
    };

    setResponses(prev => {
      const updated = [...prev];
      updated[currentQuestion] = responseData;
      return updated;
    });

    // Proceed to next question or complete
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(timePerQuestion);
      setIsAnalyzing(false);
    } else {
      // Session complete: do Gemini bulk analysis!
      await completeSessionWithDetailedAnalysis([
        ...responses.slice(0, totalQuestions - 1),
        responseData  // include last one
      ], [
        ...savedTranscripts.slice(0, totalQuestions - 1),
        userResponse
      ]);
      setIsAnalyzing(false);
    }
  };

  async function completeSessionWithDetailedAnalysis(allResponses: any[], allTranscripts: string[]) {
    const totalTime = (Date.now() - sessionStartTime) / 1000;

    try {
      // Batched prompt: instruct Gemini to deeply analyze all at once
      const bulkPrompt = `
        For an English Reflex Challenge, you are given 5 questions AND the corresponding student responses for each. 
        For each pair, provide a JSON array where each element has these fields:
        {
          "question": "",
          "original": "",                   // student's answer verbatim
          "corrected": "",                  // provide a corrected/natural version
          "explanation": "",                // briefly explain any mistakes
          "broken_rules": [],               // which grammar/vocab rules were broken
          "accuracy": 0,                    // 0-100, quality of answer
          "fluency": 0,
          "pronunciation": 0,
          "vocabulary": 0,
          "precision": 0,
          "speed": 0                        // 0-100 estimate of how quickly and fluently expressed
        }

        Questions and Responses:
        ${questions.map((q, i) => `Q${i+1}: "${q}"\nA${i+1}: "${allTranscripts[i] || "No response"}"`).join('\n')}
      `;

      // Use Gemini API
      const { feedback } = await getLanguageFeedback(bulkPrompt);

      // Try to extract array from feedback
      const arrayMatch = feedback.match(/\[(.|\s|\n)*\]/m);
      let resultsArr = [];
      if (arrayMatch) {
        try {
          resultsArr = JSON.parse(arrayMatch[0]);
        } catch {
          // fallback: try to fix JSON with loose parsing or default reporting
          resultsArr = [];
        }
      }

      // Fallback: try to parse as JSON directly
      if (!resultsArr.length) {
        try {
          resultsArr = JSON.parse(feedback);
        } catch {
          // fallback: dummy default
          resultsArr = [];
        }
      }

      // If still failed, fallback to put empty analysis and user transcript per response
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

      // Update responses with metrics from Gemini and assemble summary metrics:
      let sumPronunciation = 0, sumFluency = 0, sumVocabulary = 0;
      let sumPrecision = 0, sumAccuracy = 0, sumSpeed = 0;
      let answerReport = [];

      const responsesWithAnalysis = resultsArr.map((gemini, i) => {
        sumPronunciation += gemini.pronunciation ?? 0;
        sumFluency += gemini.fluency ?? 0;
        sumVocabulary += gemini.vocabulary ?? 0;
        sumPrecision += gemini.precision ?? 0;
        sumAccuracy += gemini.accuracy ?? 0;
        sumSpeed += gemini.speed ?? 0;
        answerReport.push({
          question: gemini.question,
          response: gemini.original,
          corrected: gemini.corrected,
          explanation: gemini.explanation,
          grammarErrors: (gemini.broken_rules || []).map(rule => ({
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
        });
        return answerReport[i];
      });

      // Calculate overall metrics
      const n = resultsArr.length || 1;
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: responsesWithAnalysis,
        totalTime,
        streak: responsesWithAnalysis.reduce((streak, r) => (r.accuracy >= 70 ? streak + 1 : streak), 0),
        score: Math.round(sumAccuracy / n),
        overallAnalysis: {
          strengths: ["Prompt completion", "Participation", "Effort"],
          weaknesses: ["See question explanations for mistakes"],
          recommendations: ["Practice grammar rules highlighted in feedback", "Review corrected answers for improvement"],
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
      console.error("Error with batch Gemini feedback:", error);
      // Fallback summary with what we have
      const n = allResponses.length;

      const sum = (key: string) => allResponses.reduce((tot, r) => tot + (r[key] || 60), 0);
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: allResponses,
        totalTime,
        streak: allResponses.reduce((streak, r) => (r.accuracy >= 70 ? streak + 1 : streak), 0),
        score: Math.round(sum("accuracy") / n),
        overallAnalysis: {
          strengths: ["Completed all challenges", "Consistent effort"],
          weaknesses: ["Gemini feedback unavailable"],
          recommendations: ["Try again later for detailed feedback"],
          overallGrade: getGradeFromScore(sum("accuracy") / n)
        },
        metrics: {
          pronunciation: Math.round(sum("pronunciationScore") / n),
          fluency: Math.round(sum("fluency") / n),
          vocabulary: Math.round(sum("vocabularyScore") / n),
          precision: Math.round(sum("confidence") / n),
          accuracy: Math.round(sum("accuracy") / n),
          speed: Math.round(sum("speed") / n),
          totalTime: Math.round(totalTime)
        }
      };
      onSessionComplete(sessionData);
    }
  }

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
        {(isRecording || transcript) && (
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
                  {transcript || "Start speaking to see your words appear here..."}
                  {isRecording && <span className="animate-pulse">|</span>}
                </p>
              </div>
              {transcript && (
                <div className="mt-2 text-sm text-gray-600">
                  Word count: {transcript.split(' ').filter(word => word.trim()).length}
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
                    <span>Question {index + 1}: Response saved ({savedTranscript.split(' ').length} words)</span>
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
              {challenge.id === "ai-debate" && (
                <div>
                  <p>• Present clear arguments with supporting reasons</p>
                  <p>• Use logical connectors (however, therefore, because)</p>
                  <p>• Acknowledge counterpoints before refuting them</p>
                </div>
              )}
              {challenge.id === "precision-word" && (
                <div>
                  <p>• Use ALL the target words naturally in your response</p>
                  <p>• Don't force them - make them fit the context</p>
                  <p>• Show you understand their meanings</p>
                </div>
              )}
              {challenge.id === "memory-loop" && (
                <div>
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
