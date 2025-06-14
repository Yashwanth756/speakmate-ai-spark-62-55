import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, ArrowLeft, Play, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { getLanguageFeedback, sendMessageToGemini, getBulkLanguageFeedback } from "@/lib/gemini-api";
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
  // ... (challengeQuestions and 5-question batch logic)
  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions] || [];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [responses, setResponses] = useState<{ prompt: string; response: string; time: number }[]>([]);
  const [timerIds, setTimerIds] = useState<{ intervalId: ReturnType<typeof setInterval> | null, timeoutId: ReturnType<typeof setTimeout> | null }>({ intervalId: null, timeoutId: null });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [totalSessionTime, setTotalSessionTime] = useState(0);

  const { transcript, isListening, supported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    setUserResponse(transcript);
  }, [transcript]);

  // Start live transcription and timers when recording starts
  useEffect(() => {
    if (isRecording) {
      resetTranscript();
      startListening();
      setElapsedTime(0);
      const startTimestamp = Date.now();

      const intervalId = setInterval(() => {
        setElapsedTime((Date.now() - startTimestamp) / 1000);
      }, 100);

      const timeoutId = setTimeout(() => {
        handleStopRecording(true); // auto submit if time's up
      }, 30000);

      setTimerIds({ intervalId, timeoutId });
    } else {
      stopListening();
      if (timerIds.intervalId) clearInterval(timerIds.intervalId);
      if (timerIds.timeoutId) clearTimeout(timerIds.timeoutId);
      setTimerIds({ intervalId: null, timeoutId: null });
    }
    return () => {
      stopListening();
      if (timerIds.intervalId) clearInterval(timerIds.intervalId);
      if (timerIds.timeoutId) clearTimeout(timerIds.timeoutId);
      setTimerIds({ intervalId: null, timeoutId: null });
    };
    // eslint-disable-next-line
  }, [isRecording]);

  // Prevent editing of response textbox
  const handleTextareaChange = () => {};

  const handleStartRecording = () => {
    setIsRecording(true);
    resetTranscript();
  };

  // Stop recording & go to next or finish, collect all responses for batch analysis at end
  const handleStopRecording = async (auto = false) => {
    setIsRecording(false);
    if (timerIds.intervalId) clearInterval(timerIds.intervalId);
    if (timerIds.timeoutId) clearTimeout(timerIds.timeoutId);
    setTimerIds({ intervalId: null, timeoutId: null });

    const resp = (transcript || userResponse).trim();
    const timeTaken = Number(elapsedTime);

    setResponses(prev => [
      ...prev,
      {
        prompt: questions[questionIndex],
        response: resp,
        time: timeTaken
      }
    ]);
    setTotalSessionTime(prev => prev + timeTaken);

    resetTranscript();
    setUserResponse("");

    // Move to next question, or analyze after all 5
    if (questionIndex < 4) {
      setTimeout(() => {
        setElapsedTime(0);
        setQuestionIndex(q => q + 1);
        setIsRecording(false);
      }, 400);
    } else {
      setIsAnalyzing(true);
      try {
        const bulkAnalysis = await getBulkLanguageFeedback([
          ...responses,
          {
            prompt: questions[questionIndex],
            response: resp,
            time: timeTaken
          }
        ]);
        setAnalysis(bulkAnalysis);
        setShowFinalReport(true);
      } catch (err) {
        setAnalysis([]);
        setShowFinalReport(true);
      }
      setIsAnalyzing(false);
    }
  };

  // Always display transcription live while recording
  const currentQuestion = questions && questions[questionIndex] ? questions[questionIndex] : "No question available.";
  const secondsLeft = Math.max(0, 30 - Math.round(elapsedTime));

  if (showFinalReport) {
    // Calculate overall metrics from analysis
    const totalTime = responses.reduce((sum, r) => sum + (r.time || 0), 0);
    const averages = {
      pronunciation: 0,
      fluency: 0,
      vocabulary: 0,
      precision: 0,
      accuracy: 0,
      speed: 0
    };
    analysis.forEach((item: any) => {
      averages.pronunciation += item.pronunciationScore || 0;
      averages.fluency += item.fluencyScore || 0;
      averages.vocabulary += item.vocabularyScore || 0;
      averages.precision += item.precisionScore || 0;
      averages.speed += item.speedScore || 0;
      // Let's define "accuracy" as the mean of grammar, vocabulary, and precision
      averages.accuracy += Math.round((item.grammarScore + item.vocabularyScore + item.precisionScore) / 3);
    });
    const n = analysis.length || 1;
    Object.keys(averages).forEach(k => {
      averages[k as keyof typeof averages] = Math.round(averages[k as keyof typeof averages] / n);
    });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Reflex Challenge Report</CardTitle>
            <div className="mt-2 text-gray-600">
              <span>Total Time: {Math.round(totalTime)}s</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="font-semibold">Pronunciation</span>
                <div className="text-xl">{averages.pronunciation}%</div>
              </div>
              <div>
                <span className="font-semibold">Fluency</span>
                <div className="text-xl">{averages.fluency}%</div>
              </div>
              <div>
                <span className="font-semibold">Vocabulary</span>
                <div className="text-xl">{averages.vocabulary}%</div>
              </div>
              <div>
                <span className="font-semibold">Precision</span>
                <div className="text-xl">{averages.precision}%</div>
              </div>
              <div>
                <span className="font-semibold">Accuracy</span>
                <div className="text-xl">{averages.accuracy}%</div>
              </div>
              <div>
                <span className="font-semibold">Speed</span>
                <div className="text-xl">{averages.speed}%</div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Per-question Analysis:</h3>
              {analysis.map((item: any, idx: number) => (
                <div key={idx} className="mb-4 p-4 rounded bg-gray-50 dark:bg-gray-800">
                  <div className="font-semibold">Q{idx + 1}: {item.prompt}</div>
                  <div className="mb-1"><span className="font-semibold">Your Answer:</span> {item.response}</div>
                  <div className="mb-1"><span className="font-semibold">Corrected:</span> {item.corrected}</div>
                  <div className="mb-1"><span className="font-semibold">Explanation:</span> {item.explanation}</div>
                  <div className="mb-1"><span className="font-semibold">Rules Broken:</span> {Array.isArray(item.rulesBroken) ? item.rulesBroken.join("; ") : String(item.rulesBroken)}</div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span>Grammar: {item.grammarScore}%</span>
                    <span>Fluency: {item.fluencyScore}%</span>
                    <span>Vocabulary: {item.vocabularyScore}%</span>
                    <span>Pronunciation: {item.pronunciationScore}%</span>
                    <span>Precision: {item.precisionScore}%</span>
                    <span>Speed: {item.speedScore}%</span>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={onBack}>Back to Challenges</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <h3 className="text-xl font-semibold mb-2">Question {questionIndex + 1} of 5:</h3>
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
                  disabled
                  aria-readonly
                  className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Speak to answer. Live transcription will appear here..."
                  style={{ userSelect: "none", pointerEvents: "none", backgroundColor: "#f3f4f6" }}
                  tabIndex={-1}
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
                        <Button onClick={handleStartRecording} disabled={isAnalyzing || (questionIndex >= 5)}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button onClick={() => handleStopRecording(false)} disabled={isAnalyzing}>
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
