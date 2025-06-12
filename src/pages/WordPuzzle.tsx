import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WordScrambleGame from "@/components/word-puzzle/WordScrambleGame";
import VocabularyArcade from "@/components/word-puzzle/VocabularyArcade";
import AlphabetSudoku from "@/components/word-puzzle/AlphabetSudoku";
import { WordSearchGame, DifficultyLevel } from "@/components/word-puzzle/WordSearchGame";
import { WordSearchLevelSelector } from "@/components/word-puzzle/WordSearchLevelSelector";
import { WordSearchCompletion } from "@/components/word-puzzle/WordSearchCompletion";
import confetti from 'canvas-confetti';

// Game options with their details
const gameOptions = [
  {
    id: "word-scramble",
    name: "Word Scramble",
    description: "Unscramble letters to form a valid English word",
    icon: "🔤",
    comingSoon: false,
  },
  {
    id: "vocabulary-arcade",
    name: "Vocabulary Arcade",
    description: "Match words with their correct definitions",
    icon: "📚",
    comingSoon: false,
  },
  {
    id: "alphabet-sudoku",
    name: "Alphabet Sudoku",
    description: "Logic puzzle using letters instead of numbers",
    icon: "🧩",
    comingSoon: false,
  },
  {
    id: "word-search",
    name: "Word Search",
    description: "Find hidden words in letter grids with educational hints",
    icon: "🔍",
    comingSoon: false,
  },
];

type GameState = 'menu' | 'playing' | 'level-selector' | 'completed';

const WordPuzzle = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('beginner');
  const [completionData, setCompletionData] = useState<{
    score: number;
    timeElapsed: number;
    wordsFound: number;
    totalWords: number;
  } | null>(null);

  useEffect(() => {
    // Play sound when component mounts
  }, []);

  const selectGame = (gameId: string) => {
    if (gameOptions.find(game => game.id === gameId)?.comingSoon) {
      return; // Don't select games marked as coming soon
    }
    
    if (gameId === 'word-search') {
      setSelectedGame(gameId);
      setGameState('level-selector');
    } else {
      setSelectedGame(gameId);
      setGameState('playing');
    }
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 }
    });
  };

  const handleBack = () => {
    setSelectedGame(null);
    setGameState('menu');
    setCompletionData(null);
  };

  const handleLevelSelect = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    setGameState('playing');
  };

  const handleLevelComplete = (score: number, timeElapsed: number = 0, wordsFound: number = 10, totalWords: number = 10) => {
    setCompletionData({ score, timeElapsed, wordsFound, totalWords });
    setGameState('completed');
  };

  const handleNextLevel = () => {
    const nextLevel: Record<DifficultyLevel, DifficultyLevel | null> = {
      'beginner': 'intermediate',
      'intermediate': 'advanced',
      'advanced': null
    };
    
    const next = nextLevel[selectedDifficulty];
    if (next) {
      setSelectedDifficulty(next);
      setGameState('playing');
      setCompletionData(null);
    }
  };

  const handlePlayAgain = () => {
    setGameState('playing');
    setCompletionData(null);
  };

  const handleBackToLevelSelector = () => {
    setGameState('level-selector');
    setCompletionData(null);
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 mx-auto">
        {gameState === 'menu' && (
          <>
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Word Puzzles</h1>
                <p className="text-muted-foreground mt-2">
                  Fun and challenging word games to improve your English
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {}}
                title={"Enable sound"}
                className="h-10 w-10 rounded-full hover:bg-primary/10 hover:scale-110 transition-all duration-300"
              >
                {true ? 
                  <VolumeX className="h-5 w-5 text-primary" /> : 
                  <Volume2 className="h-5 w-5 text-primary" />
                }
              </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameOptions.map((game) => (
                <Card 
                  key={game.id}
                  onClick={() => selectGame(game.id)}
                  onMouseEnter={() => {
                    setHoveredGame(game.id);
                  }}
                  onMouseLeave={() => setHoveredGame(null)}
                  className={`cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-primary/10 ${
                    game.comingSoon ? 'opacity-70' : 'hover:border-primary/30'
                  } animate-fade-in ${hoveredGame === game.id ? 'shadow-lg border-primary' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <span className={`text-2xl ${hoveredGame === game.id ? 'animate-pulse' : ''}`}>{game.icon}</span>
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{game.name}</span>
                      {game.comingSoon && (
                        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{game.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {gameState === 'level-selector' && selectedGame === 'word-search' && (
          <WordSearchLevelSelector 
            onLevelSelect={handleLevelSelect}
            onBack={handleBack}
          />
        )}

        {gameState === 'playing' && (
          <div className="mt-4 animate-fade-in">
            {selectedGame === "word-scramble" && <WordScrambleGame />}
            {selectedGame === "vocabulary-arcade" && <VocabularyArcade />}
            {selectedGame === "alphabet-sudoku" && <AlphabetSudoku />}
            {selectedGame === "word-search" && (
              <WordSearchGame 
                difficulty={selectedDifficulty}
                onLevelComplete={(score) => handleLevelComplete(score, 0, 10, 10)}
                onBackToMenu={handleBackToLevelSelector}
              />
            )}
            
            {selectedGame !== "alphabet-sudoku" && selectedGame !== "word-search" && (
              <Button 
                onClick={handleBack} 
                variant="outline"
                className="mt-6 hover:bg-primary/10 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back to Game Selection
              </Button>
            )}
          </div>
        )}

        {gameState === 'completed' && selectedGame === 'word-search' && completionData && (
          <WordSearchCompletion
            difficulty={selectedDifficulty}
            score={completionData.score}
            timeElapsed={completionData.timeElapsed}
            wordsFound={completionData.wordsFound}
            totalWords={completionData.totalWords}
            onNextLevel={handleNextLevel}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBack}
            isLastLevel={selectedDifficulty === 'advanced'}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default WordPuzzle;
