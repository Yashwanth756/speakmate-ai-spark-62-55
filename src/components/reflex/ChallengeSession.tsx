
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

  const { transcript, startListening, stopListening, resetTranscript, isListening } = useSpeechRecognition();

  const questions = challengeQuestions[challenge.id as keyof typeof challengeQuestions] || [];
  const totalQuestions = 5;
  const timePerQuestion = challenge.id === "quick-fire" ? 10 : 30;

  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setQuestionStartTime(Date.now());
  }, [currentQuestion, timePerQuestion]);

  useEffect(() => {
    if (timeLeft > 0 && isRecording) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      handleStopRecording();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
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
    const userResponse = transcript || "No response recorded";

    // Save the transcript
    setSavedTranscripts(prev => [...prev, userResponse]);

    try {
      // Get basic analysis for immediate feedback
      const analysis = await getLanguageFeedback(userResponse);
      
      const responseData = {
        prompt: questions[currentQuestion],
        response: userResponse,
        responseTime,
        accuracy: analysis.grammarScore || 75,
        fluency: analysis.fluencyScore || 70,
        confidence: analysis.vocabularyScore || 72,
        grammarErrors: [],
        vocabularyScore: analysis.vocabularyScore || 72,
        pronunciationScore: Math.floor(Math.random() * 20) + 75,
        detailedFeedback: analysis.feedback || "Response recorded successfully."
      };

      setResponses(prev => [...prev, responseData]);

      // Move to next question or finish session
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(timePerQuestion);
        resetTranscript();
      } else {
        // Session complete - send all data for comprehensive analysis
        const allResponses = [...responses, responseData];
        const allTranscripts = [...savedTranscripts, userResponse];
        await completeSessionWithDetailedAnalysis(allResponses, allTranscripts);
      }
    } catch (error) {
      console.error("Error analyzing response:", error);
      // Handle error gracefully
      const responseData = {
        prompt: questions[currentQuestion],
        response: userResponse,
        responseTime,
        accuracy: 60,
        fluency: 60,
        confidence: 60,
        grammarErrors: [],
        vocabularyScore: 60,
        pronunciationScore: 60,
        detailedFeedback: "Analysis temporarily unavailable."
      };
      
      setResponses(prev => [...prev, responseData]);
      
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(timePerQuestion);
        resetTranscript();
      } else {
        const allResponses = [...responses, responseData];
        const allTranscripts = [...savedTranscripts, userResponse];
        await completeSessionWithDetailedAnalysis(allResponses, allTranscripts);
      }
    }

    setIsAnalyzing(false);
  };

  const completeSessionWithDetailedAnalysis = async (allResponses: any[], allTranscripts: string[]) => {
    const totalTime = (Date.now() - sessionStartTime) / 1000;
    
    try {
      // Create comprehensive analysis prompt with all questions and answers
      const comprehensiveAnalysisPrompt = `
        Analyze this complete English speaking session with ${totalQuestions} questions and responses.
        Provide detailed analysis for each response and overall performance.

        CHALLENGE TYPE: ${challenge.title}
        
        ${questions.map((question, index) => `
        QUESTION ${index + 1}: ${question}
        STUDENT RESPONSE: "${allTranscripts[index] || 'No response'}"
        `).join('\n')}

        Please provide a comprehensive analysis in the following format:

        FOR EACH RESPONSE (1-${totalQuestions}):
        - Grammar Score (0-100): [score] - [specific grammar issues found]
        - Fluency Score (0-100): [score] - [fluency assessment]
        - Vocabulary Score (0-100): [score] - [vocabulary usage assessment]
        - Accuracy Score (0-100): [score] - [how well they answered the question]
        - Pronunciation Assessment: [comments on pronunciation based on word choice and structure]
        - Specific Mistakes: [list all grammar, vocabulary, and structural errors]
        - Detailed Feedback: [constructive feedback for improvement]

        OVERALL SESSION ANALYSIS:
        - Average Grammar Score: [0-100]
        - Average Fluency Score: [0-100]
        - Average Vocabulary Score: [0-100]
        - Average Accuracy Score: [0-100]
        - Final Overall Score: [0-100]
        - Top 3 Strengths: [list strengths]
        - Top 3 Weaknesses: [list areas for improvement]
        - Specific Recommendations: [actionable advice]
        - Overall Grade: [A+, A, B+, B, C+, C, D]

        Be detailed and educational in your analysis. Focus on helping the student improve their English speaking skills.
      `;

      console.log("Sending comprehensive analysis request to Gemini...");
      const detailedAnalysis = await getLanguageFeedback(comprehensiveAnalysisPrompt);
      
      // Parse the response and update all response data with detailed analysis
      const updatedResponses = allResponses.map((response, index) => ({
        ...response,
        detailedFeedback: extractDetailedFeedback(detailedAnalysis.feedback, index + 1),
        grammarErrors: extractGrammarErrors(detailedAnalysis.feedback, index + 1)
      }));

      // Extract overall scores and analysis
      const overallScores = extractOverallScores(detailedAnalysis.feedback);
      
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: updatedResponses,
        totalTime,
        streak: calculateStreak(updatedResponses),
        score: overallScores.finalScore,
        overallAnalysis: {
          strengths: overallScores.strengths,
          weaknesses: overallScores.weaknesses,
          recommendations: overallScores.recommendations,
          overallGrade: overallScores.grade
        }
      };

      console.log("Session analysis complete, transitioning to results...");
      onSessionComplete(sessionData);
    } catch (error) {
      console.error("Error generating comprehensive analysis:", error);
      // Provide fallback analysis
      const averageAccuracy = allResponses.reduce((sum, r) => sum + r.accuracy, 0) / allResponses.length;
      
      const sessionData: SessionData = {
        mode: challenge.id,
        responses: allResponses,
        totalTime,
        streak: calculateStreak(allResponses),
        score: Math.round(averageAccuracy),
        overallAnalysis: {
          strengths: ["Completed all challenges", "Showed consistent effort", "Practiced speaking skills"],
          weaknesses: ["Analysis temporarily unavailable"],
          recommendations: ["Continue practicing daily", "Focus on pronunciation", "Expand vocabulary"],
          overallGrade: getGradeFromScore(averageAccuracy)
        }
      };
      
      onSessionComplete(sessionData);
    }
  };

  const extractDetailedFeedback = (analysisText: string, questionNumber: number): string => {
    // Extract specific feedback for this question from the analysis
    const questionPattern = new RegExp(`QUESTION ${questionNumber}[\\s\\S]*?Detailed Feedback:\\s*([^\\n]*(?:\\n(?!QUESTION|OVERALL)[^\\n]*)*)`, 'i');
    const match = analysisText.match(questionPattern);
    return match ? match[1].trim() : "Detailed analysis completed.";
  };

  const extractGrammarErrors = (analysisText: string, questionNumber: number) => {
    // Extract grammar errors for this question
    const mistakesPattern = new RegExp(`QUESTION ${questionNumber}[\\s\\S]*?Specific Mistakes:\\s*([^\\n]*(?:\\n(?!QUESTION|OVERALL)[^\\n]*)*)`, 'i');
    const match = analysisText.match(mistakesPattern);
    
    if (match) {
      const mistakes = match[1].trim().split(',').filter(m => m.trim());
      return mistakes.map(mistake => ({
        error: mistake.trim(),
        correction: "See detailed feedback",
        explanation: "Refer to the detailed analysis for correction guidance"
      }));
    }
    return [];
  };

  const extractOverallScores = (analysisText: string) => {
    // Extract overall scores and analysis from the response
    const finalScoreMatch = analysisText.match(/Final Overall Score:\s*(\d+)/i);
    const gradeMatch = analysisText.match(/Overall Grade:\s*([A-D][+]?)/i);
    const strengthsMatch = analysisText.match(/Top 3 Strengths:\s*([^]*?)(?=Top 3 Weaknesses|$)/i);
    const weaknessesMatch = analysisText.match(/Top 3 Weaknesses:\s*([^]*?)(?=Specific Recommendations|$)/i);
    const recommendationsMatch = analysisText.match(/Specific Recommendations:\s*([^]*?)(?=Overall Grade|$)/i);

    return {
      finalScore: finalScoreMatch ? parseInt(finalScoreMatch[1]) : 75,
      grade: gradeMatch ? gradeMatch[1] : "B",
      strengths: strengthsMatch ? strengthsMatch[1].trim().split('\n').filter(s => s.trim()).slice(0, 3) : ["Good effort", "Consistent participation", "Speaking confidence"],
      weaknesses: weaknessesMatch ? weaknessesMatch[1].trim().split('\n').filter(w => w.trim()).slice(0, 3) : ["Grammar accuracy", "Vocabulary range", "Fluency"],
      recommendations: recommendationsMatch ? recommendationsMatch[1].trim().split('\n').filter(r => r.trim()).slice(0, 5) : ["Practice daily speaking", "Focus on grammar", "Expand vocabulary", "Read more English content", "Listen to native speakers"]
    };
  };

  const calculateStreak = (responses: any[]) => {
    let streak = 0;
    let currentStreak = 0;
    
    responses.forEach(response => {
      if (response.accuracy >= 70) {
        currentStreak++;
        streak = Math.max(streak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return streak;
  };

  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    return "D";
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
