
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Mic, Volume2, Webcam, Star, ArrowRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useSpeechAudio } from "@/hooks/use-speech-audio";
import { toast } from "sonner";
import { TalkingFaceDiagram } from "./TalkingFaceDiagram";
import { sendMessageToGemini } from "@/lib/gemini-api";
import { handleDailyData } from "@/data/progressData";
const COLORS = ["#00c853", "#ffd600", "#ff5252"];

const levels = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

interface WordData {
  word: string;
  syllables: {
    part: string;
    tip: string;
  }[];
}

export function PronunciationMirror() {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const [level, setLevel] = useState("beginner");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [score, setScore] = useState(0);
  const [pie, setPie] = useState<{name: string, value: number}[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [stars, setStars] = useState(0);
  const [currentPhoneme, setCurrentPhoneme] = useState("");
  const [isModelAnimating, setIsModelAnimating] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);
  
  const { 
    isListening, 
    transcript, 
    setTranscript,
    handleStartRecording, 
    handleStopRecording,
    speakText
  } = useSpeechAudio();

  // Initialize with first word on component mount
  useEffect(() => {
    handleNewWord();
  }, [level]);

  // Try to attach webcam
  useEffect(() => {
    if (webcamRef.current && !webcamRef.current.srcObject) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
            webcamRef.current.play();
          }
        })
        .catch(() => {
          toast.error("Camera access denied. Please enable your camera to use this feature.");
        });
    }
    
    // Cleanup webcam on unmount
    return () => {
      if (webcamRef.current && webcamRef.current.srcObject) {
        (webcamRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // Generate new word using Gemini
  const handleNewWord = async () => {
    setLoadingWord(true);
    setScore(0);
    setStars(0);
    setPie([]);
    setFeedback("");
    
    try {
      const prompt = `Generate a ${level} level English word for pronunciation practice. Provide the response in this exact JSON format only, no other text:

{
  "word": "example",
  "syllables": [
    {
      "part": "ex",
      "tip": "Short 'e' sound, tongue relaxed"
    },
    {
      "part": "am",
      "tip": "Open mouth wide, short 'a' sound"
    },
    {
      "part": "ple",
      "tip": "Soft 'p', tongue touches roof for 'l'"
    }
  ]
}

Make sure the word is appropriate for ${level} level learners and provide 2-4 syllables with specific pronunciation tips for each syllable part.`;

      const response = await sendMessageToGemini(prompt, "pronunciation-practice");
      
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          setWordData(parsedData);
          setPie(parsedData.syllables.map((s: any) => ({ name: s.part, value: 0 })));
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        // Fallback word data
        setWordData({
          word: "Hello",
          syllables: [
            { part: "He", tip: "Open mouth slightly, h from throat" },
            { part: "llo", tip: "Tongue behind teeth, round lips" }
          ]
        });
        setPie([{ name: "He", value: 0 }, { name: "llo", value: 0 }]);
        toast.error("Using fallback word. Please check your Gemini API key in Settings.");
      }
    } catch (error) {
      console.error("Error generating word:", error);
      // Fallback word data
      setWordData({
        word: "Practice",
        syllables: [
          { part: "Prac", tip: "Press lips together, then release" },
          { part: "tice", tip: "Tongue tip touches roof of mouth" }
        ]
      });
      setPie([{ name: "Prac", value: 0 }, { name: "tice", value: 0 }]);
      toast.error("Failed to generate new word. Using fallback.");
    } finally {
      setLoadingWord(false);
    }
  };

  // Pronounce the current word
  const handlePronounce = () => {
    if (wordData) {
      speakText(wordData.word);
      setIsModelAnimating(true);
      
      // Stop model animation after word is spoken (approx. 3s)
      setTimeout(() => setIsModelAnimating(false), 3000);
    }
  };

  // Handle recording
  const handleRecord = () => {
    if (!isListening) {
      setTranscript('')
      console.log("Starting recording...", transcript);
      handleStartRecording();
    } else {
      handleStopRecording();
    }
  };

  // Simulated "Analyze" button
  const handleAnalyze = () => {
    if (!transcript) {
      toast.error("Please record your pronunciation first");
      return;
    }
    
    if (!wordData) {
      toast.error("No word data available");
      return;
    }
    
    setAnalyzing(true);
    
    // Simulate analysis with random scores for demonstration
    setTimeout(() => {
      // Generate phoneme accuracy
      const phonemeScores = wordData.syllables.map(syl => {
        // Generate random score between 60-95 for demo
        return {
          name: syl.part,
          value: Math.floor(Math.random() * 35) + 60
        };
      });
      
      // Calculate overall score based on phoneme scores
      const overallScore = Math.floor(
        phonemeScores.reduce((sum, item) => sum + item.value, 0) / phonemeScores.length
      );
      const currDay = {
                    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                    day: new Date().toLocaleDateString("en-US", { weekday: "short" }),
                    fullDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
                    speaking: 0,
                    pronunciation:  overallScore,
                    vocabulary:0,
                    grammar: 0,
                    story: 0,
                    reflex: 0,
                    totalTime: 0,
                    sessionsCompleted: 0
                  };
                  // console.log('starting update', dailyData())
      handleDailyData(currDay);
      
      setScore(overallScore);
      setPie(phonemeScores);
      
      // Set stars based on score
      let starCount = 0;
      if (overallScore >= 90) starCount = 3;
      else if (overallScore >= 75) starCount = 2;
      else if (overallScore >= 60) starCount = 1;
      setStars(starCount);
      
      // Generate feedback based on lowest scoring phoneme
      const lowestScore = phonemeScores.reduce(
        (min, p) => p.value < min.value ? p : min,
        { name: "", value: 100 }
      );
      
      const syllableTip = wordData.syllables.find(s => s.part === lowestScore.name)?.tip || "";
      
      setFeedback(
        overallScore >= 90
          ? "Excellent pronunciation! You're sounding like a native speaker."
          : `Good effort! Focus on the '${lowestScore.name}' sound. ${syllableTip}`
      );
      
      setAnalyzing(false);
    }, 1700);
  };

  // Handle specific phoneme demonstration
  const demonstratePhoneme = (phoneme: string) => {
    setCurrentPhoneme(phoneme);
    // Play a specific sound for this phoneme
    speakText(phoneme);
  };

  return (
    <Card className="p-1 overflow-visible animate-fade-in shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-playfair gradient-text">
          <Webcam className="w-7 h-7" />
          Pronunciation Mirror
          <span
            className="ml-4 text-sm rounded px-2 py-1 bg-primary text-white font-normal tracking-wide"
            style={{ letterSpacing: ".08em" }}
          >
            AI-Powered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column - Controls & Pronunciation Details */}
          <div className="space-y-6">
            {/* Level Selection */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm">
              <label className="block text-sm font-semibold mb-2">Select Difficulty</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem value={l.value} key={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="mt-4">
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={handleNewWord}
                  disabled={loadingWord}
                >
                  {loadingWord ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate New Word"
                  )}
                </Button>
              </div>
            </div>
            
            {/* Word Display & Syllables */}
            {wordData && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-primary mb-2">{wordData.word}</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handlePronounce}
                    className="mb-4"
                  >
                    <Volume2 className="w-4 h-4 mr-2" /> Listen
                  </Button>
                </div>
                
                <div className="mt-2">
                  <div className="font-semibold text-xs uppercase mb-2 text-muted-foreground">
                    Syllable Breakdown
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {wordData.syllables.map((syl, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-primary/10 px-3 py-2 flex flex-col items-center shadow-sm text-sm hover:bg-primary/20 cursor-pointer transition-colors"
                        onClick={() => demonstratePhoneme(syl.part)}
                      >
                        <span className="font-bold">{syl.part}</span>
                        <span className="text-[11px] text-muted-foreground text-center">{syl.tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Practice Controls */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={handleRecord}
                  variant={isListening ? "secondary" : "default"}
                  className="flex gap-1 items-center"
                  disabled={analyzing}
                >
                  <Mic className="w-5 h-5 mr-1" />
                  {isListening ? "Recording..." : "Practice"}
                </Button>
                
                <Button
                  onClick={handleStopRecording}
                  variant="outline"
                  className="flex gap-1 items-center"
                  disabled={!isListening}
                >
                  <Volume2 className="w-5 h-5 mr-1" />
                  Stop
                </Button>
                
                <Button
                  onClick={handleAnalyze}
                  variant="default"
                  className="flex gap-1 items-center"
                  disabled={analyzing || !transcript}
                >
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
              
              {/* Transcription display */}
              {transcript && (
                <div className="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md w-full">
                  <div className="text-xs text-muted-foreground mb-1">Your pronunciation:</div>
                  <div className="text-sm">{transcript}</div>
                </div>
              )}
            </div>
            
            {/* Feedback */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm shadow-sm"
              >
                <div className="font-semibold mb-1">Feedback:</div>
                {feedback}
              </motion.div>
            )}
          </div>
          
          {/* Right column - Visual Aids */}
          <div className="flex flex-col gap-6">
            {/* Talking Face Diagram */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <div className="text-sm font-semibold mb-2 text-center flex items-center justify-center gap-2">
                <span>😊</span>
                Talking Face
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">AI-Powered</span>
              </div>
              <div className="h-64 relative rounded-lg overflow-hidden">
                <TalkingFaceDiagram 
                  word={wordData?.word || ""} 
                  isAnimating={isModelAnimating} 
                  phoneme={currentPhoneme}
                />
              </div>
              <div className="text-xs text-center mt-2 text-muted-foreground">
                Interactive face • Click syllables to see movement • Powered by Gemini AI
              </div>
            </div>
            
            {/* Webcam Mirror */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
              <div className="text-sm font-semibold mb-2 text-center">Your Mouth Position</div>
              <div className="relative h-48 rounded-lg shadow-inner overflow-hidden bg-black border border-primary">
                <video
                  ref={webcamRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute w-full h-full object-cover"
                />
                {/* Overlay with mouth position guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{
                      borderColor: ["#e53935", "#00c853", "#e53935"],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 1.7, repeat: Infinity }}
                    className="w-20 h-7 rounded-full border-2 border-primary/70 bg-transparent"
                    style={{
                      borderRadius: "55% 45% 60% 40% / 50% 60% 40% 50%",
                    }}
                  ></motion.div>
                </div>
              </div>
              <div className="text-xs text-center mt-2 text-muted-foreground">
                Try to match your mouth position with the model
              </div>
            </div>
            
            {/* Scoring */}
            {score > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3].map((n) => (
                      <Star
                        key={n}
                        className={`h-6 w-6 ${
                          n <= stars ? "text-yellow-400" : "text-gray-300"
                        }`}
                        fill={n <= stars ? "#ffd600" : "none"}
                      />
                    ))}
                  </div>
                  
                  <div className="font-bold text-lg text-primary mb-2">
                    Your Score: {score}%
                  </div>
                  
                  <Progress 
                    value={score} 
                    max={100} 
                    className="h-3 w-full rounded-full bg-primary/5" 
                  />
                  
                  <div className="mt-4 flex justify-center">
                    <PieChart width={140} height={100}>
                      <Pie
                        data={pie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={24}
                        outerRadius={40}
                        startAngle={180}
                        endAngle={0}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {pie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Syllable accuracy breakdown
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Next Word Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleNewWord}
            variant="outline"
            className="flex gap-1 items-center"
            disabled={loadingWord}
          >
            {loadingWord ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Next Word <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}