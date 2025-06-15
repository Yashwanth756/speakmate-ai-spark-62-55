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

// Mock dictionary API - in a real app, this would use an actual API
const mockDictionary = [
  {
    word: "ephemeral",
    meaning: "Lasting for a very short time; transitory; momentary",
    partOfSpeech: "adjective",
    phonetic: "/ɪˈfɛm(ə)rəl/",
    example: "The ephemeral beauty of a sunset",
    synonyms: ["fleeting", "transient", "momentary", "short-lived"],
    antonyms: ["permanent", "enduring", "everlasting"],
    memoryTip: "Think of a butterfly's lifespan - beautiful but brief"
  },
  {
    word: "ubiquitous",
    meaning: "Present, appearing, or found everywhere",
    partOfSpeech: "adjective",
    phonetic: "/juːˈbɪkwɪtəs/",
    example: "Mobile phones are now ubiquitous in modern society",
    synonyms: ["omnipresent", "ever-present", "pervasive", "universal"],
    antonyms: ["rare", "scarce", "uncommon"],
    memoryTip: "Think of 'ubi' (where in Latin) + 'quitous' - it's everywhere you look!"
  },
  {
    word: "serendipity",
    meaning: "The occurrence of events by chance in a happy or beneficial way",
    partOfSpeech: "noun",
    phonetic: "/ˌsɛr(ə)nˈdɪpɪti/",
    example: "The serendipity of meeting an old friend in a foreign country",
    synonyms: ["chance", "fortune", "luck", "providence"],
    antonyms: ["misfortune", "design", "plan"],
    memoryTip: "Think of it as a 'serene dip' into good luck!"
  },
  {
    word: "eloquent",
    meaning: "Fluent or persuasive in speaking or writing",
    partOfSpeech: "adjective",
    phonetic: "/ˈɛləkwənt/",
    example: "Her eloquent speech moved the entire audience",
    synonyms: ["articulate", "fluent", "persuasive", "expressive"],
    antonyms: ["inarticulate", "hesitant", "awkward"],
    memoryTip: "Think 'elo' + 'quent' - someone who speaks with elegant quality"
  },
  {
    word: "pragmatic",
    meaning: "Dealing with things sensibly and realistically",
    partOfSpeech: "adjective",
    phonetic: "/præɡˈmætɪk/",
    example: "We need a pragmatic approach to solving this problem",
    synonyms: ["practical", "realistic", "sensible", "rational"],
    antonyms: ["idealistic", "impractical", "unrealistic"],
    memoryTip: "Think of a 'program' that works - it's practical and gets things done!"
  }
];

const vocabularyLevels = {
  beginner: ["simple", "happy", "quick", "small", "large"],
  intermediate: ["eloquent", "pragmatic", "serendipity"],
  advanced: ["ephemeral", "ubiquitous"]
};

const VocabularyTrainer: React.FC = () => {
  const { toast } = useToast();
  const [currentLevel, setCurrentLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [currentWord, setCurrentWord] = useState(mockDictionary[0]);
  const [dailyProgress, setDailyProgress] = useState(2);

  // FIX: Re-add isSpellMode state management
  const [isSpellMode, setIsSpellMode] = useState(false);

  const { transcript, resetTranscript, startListening, stopListening, isListening, supported } = useSpeechRecognition();
  
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
  
  useEffect(() => {
    if (transcript && !isListening) {
      checkPronunciation(transcript);
    }
  }, [transcript, isListening]);
  
  const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * mockDictionary.length);
    setCurrentWord(mockDictionary[randomIndex]);
  };
  
  const handleLevelChange = (level: "beginner" | "intermediate" | "advanced") => {
    setCurrentLevel(level);
    toast({
      title: "Level Changed",
      description: `Vocabulary level set to ${level}`,
    });
  };
  
  const checkPronunciation = (spoken: string) => {
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
      getRandomWord();
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

  // NEW: Handler to show interesting usage of the word in various tenses/voice
  const handleKnowMore = () => {
    const { word, partOfSpeech } = currentWord;

    // Only basic logic for English; could use AI in real apps
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
              <p className="text-gray-600">Learn, practice, and master new words</p>
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

                {/* Only two modes: WordCard and SpellCheck */}
                {!isSpellMode && (
                  <WordCard 
                    word={currentWord}
                    onNextWord={getRandomWord}
                    onPractice={handlePracticeClick}
                    isListening={isListening}
                  />
                )}

                {isSpellMode && (
                  <SpellCheck 
                    word={currentWord} 
                    onCorrect={markWordAsLearned}
                    onNext={getRandomWord}
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
                  
                  {/* Modified "Know More" button */}
                  <Button
                    onClick={handleKnowMore}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    Know More
                  </Button>
                  
                  {/* To keep 3 columns, retain a placeholder or leave blank */}
                  <div />
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
