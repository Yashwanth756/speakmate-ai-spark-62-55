import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Book, Mic, MicOff, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis
} from "recharts";
import PartsOfSpeechAnalysis from "@/components/grammar/PartsOfSpeechAnalysis";
import GrammarFeedback from "@/components/grammar/GrammarFeedback";
import DailyGrammarChallenge from "@/components/grammar/DailyGrammarChallenge";
import { analyzeGrammar, grammarData, dailyChallenges, GrammarAnalysisResult } from "@/services/grammarService";

const Grammar = () => {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<GrammarAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState(dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)]);
  const { toast } = useToast();
  const { transcript, startListening, stopListening, isListening, resetTranscript, supported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulating API call delay
    setTimeout(() => {
      const result = analyzeGrammar(text);
      setAnalysis(result);
      setIsAnalyzing(false);

      toast({
        title: "Analysis complete",
        description: `Your grammar score: ${result.score}/100`,
      });
    }, 1500);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
      toast({
        title: "Listening...",
        description: "Speak now. Your speech will be converted to text."
      });
    }
  };

  const handleNewChallenge = () => {
    const newChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    setDailyChallenge(newChallenge);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold font-playfair text-primary mb-2">Grammar Clinic</h1>
              <p className="text-gray-600">Your personal AI grammar coach</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Book className="mr-2 text-primary" />
                    Grammar Input
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Textarea 
                      placeholder="Type or paste your text here..."
                      className="min-h-[150px]"
                      value={text}
                      onChange={handleTextChange}
                    />
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                        {isAnalyzing ? "Analyzing..." : "Analyze Grammar"}
                      </Button>
                      {supported && (
                        <Button
                          variant="outline"
                          onClick={handleMicClick}
                          className={isListening ? "bg-red-100 hover:bg-red-200" : ""}
                        >
                          {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                          {isListening ? "Stop" : "Speak"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 text-primary" />
                    Skills Radar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={70} data={grammarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar 
                          name="Score" 
                          dataKey="score" 
                          stroke="#9b87f5" 
                          fill="#9b87f5" 
                          fillOpacity={0.5} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {analysis && (
              <>
                <GrammarFeedback 
                  text={text} 
                  score={analysis.score} 
                  errors={analysis.errors} 
                  suggestion={analysis.suggestion} 
                />
                
                <PartsOfSpeechAnalysis 
                  posData={analysis.posData} 
                  posChartData={analysis.posChartData} 
                />
              </>
            )}

            <DailyGrammarChallenge 
              challenge={dailyChallenge} 
              onNewChallenge={handleNewChallenge} 
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Grammar;
