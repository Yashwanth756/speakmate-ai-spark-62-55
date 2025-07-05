
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Mic, Headphones, Award, BarChart, Play } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useToast } from "@/components/ui/use-toast";
import { WordCard } from "@/components/vocabulary/WordCard";
import { SpellCheck } from "@/components/vocabulary/SpellCheck";
import { VocabularyChart } from "@/components/vocabulary/VocabularyChart";
import { DailyChallenge } from "@/components/vocabulary/DailyChallenge";
import { LevelSelector } from "@/components/vocabulary/LevelSelector";
import { useDailyVocabulary } from "@/hooks/use-daily-vocabulary";

const VocabularyTrainer: React.FC = () => {
  const { toast } = useToast();
  const [currentLevel, setCurrentLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [dailyProgress, setDailyProgress] = useState(2);
  const [isSpellMode, setIsSpellMode] = useState(false);

  const { transcript, resetTranscript, startListening, stopListening, isListening, supported } = useSpeechRecognition();
  
  const {
    vocabularyData,
    loading,
    error,
    currentWord,
    currentWordIndex,
    totalWords,
    loadVocabulary,
    nextWord,
    getRandomWord
  } = useDailyVocabulary();
  
  const [learnedWords, setLearnedWords] = useState<{
    adjectives: number;
    nouns: number;
    verbs: number;
    adverbs: number;
    other: number;
  }>({
    adjectives: 12,
    nouns: 8,
    verbs: 5,
    adverbs: 3,
    other: 1
  });
  
  // Load vocabulary when component mounts or level changes
  useEffect(() => {
    loadVocabulary(currentLevel);
  }, [currentLevel, loadVocabulary]);
  
  useEffect(() => {
    if (transcript && !isListening) {
      checkPronunciation(transcript);
    }
  }, [transcript, isListening]);
  
  const handleLevelChange = (level: "beginner" | "intermediate" | "advanced") => {
    setCurrentLevel(level);
    toast({
      title: "Level Changed",
      description: `Vocabulary level set to ${level}. Loading new words...`,
    });
  };
  
  const checkPronunciation = (spoken: string) => {
    if (!currentWord) return;
    
    const spokenLower = spoken.toLowerCase().trim();
    const targetLower = currentWord.word.toLowerCase();
    
    if (spokenLower.includes(targetLower)) {
      toast({
        title: "Great pronunciation!",
        description: "You pronounced it correctly.",
        variant: "default",
      });
      markWordAsLearned();
    } else {
      toast({
        title: "Try again",
        description: `You said "${spoken}" instead of "${currentWord.word}"`,
        variant: "destructive",
      });
    }
  };
  
  const markWordAsLearned = () => {
    if (!currentWord) return;
    
    // Update daily progress
    if (dailyProgress < 5) {
      setDailyProgress(prev => prev + 1);
    }
    
    // Update learned words stats based on part of speech
    setLearnedWords(prev => {
      const newStats = { ...prev };
      if (currentWord.partOfSpeech === "adjective") {
        newStats.adjectives += 1;
      } else if (currentWord.partOfSpeech === "noun") {
        newStats.nouns += 1;
      } else if (currentWord.partOfSpeech === "verb") {
        newStats.verbs += 1;
      } else if (currentWord.partOfSpeech === "adverb") {
        newStats.adverbs += 1;
      } else {
        newStats.other += 1;
      }
      return newStats;
    });
    
    setTimeout(() => {
      nextWord();
    }, 1000);
  };
  
  const handlePracticeClick = () => {
    if (supported) {
      resetTranscript();
      startListening();
      toast({
        title: "Listening...",
        description: "Please say the word clearly.",
      });
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
    }
  };

  const toggleSpellMode = () => {
    setIsSpellMode(!isSpellMode);
  };

  const handleKnowMore = () => {
    if (!currentWord) return;
    
    const { word, partOfSpeech } = currentWord;

    let examples: string[] = [];

    if (partOfSpeech === "verb") {
      examples = [
        `Active (Present): I ${word} every day.`,
        `Active (Past): I ${word}ed yesterday.`,
        `Passive (Present): The book is ${word}ed by me.`,
        `Passive (Past): The book was ${word}ed by me.`
      ];
    } else if (partOfSpeech === "noun") {
      examples = [
        `Singular: I saw a ${word}.`,
        `Plural: There are many ${word}s in the park.`,
        `With Article: The ${word} is important.`,
      ];
    } else if (partOfSpeech === "adjective") {
      examples = [
        `Positive: She is very ${word}.`,
        `Comparative: She is more ${word} than her brother.`,
        `Superlative: She is the most ${word} person here.`,
      ];
    } else {
      examples = [
        `This word "${word}" can be used in various contexts.`,
        `Try searching for "${word}" in example sentences online!`
      ];
    }

    toast({
      title: `Example usage for "${word}"`,
      description: (
        <div className="space-y-1">
          {examples.map((ex, idx) => (
            <div key={idx}>{ex}</div>
          ))}
        </div>
      ),
      duration: 6000
    });
  };

  // Show loading state
  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold">Loading Today's Vocabulary...</h2>
              <p className="text-gray-600">Fetching fresh words for your learning journey</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Show error state
  if (error || !currentWord) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to load vocabulary</h2>
              <p className="text-gray-600 mb-4">Please check your connection and try again</p>
              <Button onClick={() => loadVocabulary(currentLevel)}>
                Retry Loading
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center p-4 md:p-8">
          <div className="w-full max-w-6xl animate-fade-in">
            <header className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-primary mb-2">
                Vocabulary Trainer
              </h1>
              <p className="text-gray-600">Learn, practice, and master new words daily</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Word Learning */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="text-lg font-medium">Daily Progress:</span>
                    <div className="ml-4 bg-gray-200 h-3 rounded-full w-36">
                      <div 
                        className="h-3 rounded-full bg-primary" 
                        style={{ width: `${(dailyProgress / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{dailyProgress}/5 words</span>
                  </div>
                  <LevelSelector 
                    currentLevel={currentLevel} 
                    onLevelChange={handleLevelChange} 
                  />
                </div>

                {/* Daily Words Indicator */}
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Today's Words</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {currentWordIndex + 1} of {totalWords} • Fresh daily content
                    </span>
                  </div>
                </div>

                {!isSpellMode && (
                  <WordCard 
                    word={currentWord}
                    onNextWord={nextWord}
                    onPractice={handlePracticeClick}
                    isListening={isListening}
                  />
                )}

                {isSpellMode && (
                  <SpellCheck 
                    word={currentWord} 
                    onCorrect={markWordAsLearned}
                    onNext={nextWord}
                  />
                )}

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Button 
                    onClick={toggleSpellMode}
                    variant={isSpellMode ? "default" : "outline"}
                    className="flex items-center justify-center"
                  >
                    <Book className="mr-2 h-4 w-4" />
                    Spelling Practice
                  </Button>
                  
                  <Button
                    onClick={handleKnowMore}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    Know More
                  </Button>
                  
                  <Button
                    onClick={getRandomWord}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Random
                  </Button>
                </div>
              </div>

              {/* Right Column - Stats & Challenges */}
              <div>
                <VocabularyChart stats={learnedWords} />
                <DailyChallenge />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VocabularyTrainer;