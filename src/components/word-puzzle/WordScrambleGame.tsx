import React, { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getDifficultyWordList, getRandomWordByDifficulty, scrambleWord, getHintsForWord,updateScore, updateHintsUsed, countCompletedWords,markWordAsSolved,updateHints } from "@/lib/word-utils";
import { HelpCircle, RotateCcw, Check, Star, Trophy, Volume2, VolumeX, MoveHorizontal } from "lucide-react";
import { LetterTile } from "./LetterTile";
import Sortable from 'sortablejs';
import { LetterPot } from "./LetterPot";
import { DifficultySelector } from "./DifficultySelector";
import { GameOverScreen } from "./GameOverScreen";

// Define difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';

const MAX_HINTS = {
  easy: 3,
  medium: 2,
  hard: 0
};

const WordScrambleGame = () => {
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [originalWord, setOriginalWord] = useState<string>("");
  const [scrambledWord, setScrambledWord] = useState<string>("");
  const [currentArrangement, setCurrentArrangement] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [hintedIndexes, setHintedIndexes] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showInvalidAnimation, setShowInvalidAnimation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(0);
  const [potArrangement, setPotArrangement] = useState<(string | null)[]>([]);
  const [showHelpAnimation, setShowHelpAnimation] = useState<boolean>(true);
  
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  const potsContainerRef = useRef<HTMLDivElement>(null);
  const tilesSortableRef = useRef<Sortable | null>(null);
  
  // Initialize a new game when difficulty changes
  useEffect(() => {
    if (difficulty) {
      startNewGame();
    }
  }, [difficulty]);

  // Setup sortable for tiles when they're rendered
  useEffect(() => {
    if (tilesContainerRef.current && currentArrangement.length > 0) {
      // Clean up previous instance if it exists
      if (tilesSortableRef.current) {
        tilesSortableRef.current.destroy();
      }
      
      // Create new sortable instance for tiles with simpler configuration
      tilesSortableRef.current = Sortable.create(tilesContainerRef.current, {
        animation: 250,
        ghostClass: "bg-primary/20",
        dragClass: "dragging-tile",
        delay: 50, // Small delay helps on mobile
        delayOnTouchOnly: true,
        onStart: () => {
          setShowHelpAnimation(false); // Hide help animation once user starts dragging
        },
        onEnd: (evt) => {
          const letterTile = evt.item;
          const letter = letterTile.getAttribute('data-letter') || '';
          
          // Fix: Cast evt to any to access originalEvent safely
          const targetPot = (evt as any).originalEvent?.target as HTMLElement;
          const potElement = targetPot?.closest('[data-pot-index]');
          
          if (potElement) {
            const potIndex = parseInt(potElement.getAttribute('data-pot-index') || '0', 10);
            
            // Add the letter to the pot
            addLetterToPot(letter, potIndex);
            
            // Remove the letter from the tiles
            const letterIndex = currentArrangement.indexOf(letter);
            if (letterIndex !== -1) {
              const newArrangement = [...currentArrangement];
              newArrangement.splice(letterIndex, 1);
              setCurrentArrangement(newArrangement);
            }
          }
        }
      });
    }
    
    return () => {
      if (tilesSortableRef.current) {
        tilesSortableRef.current.destroy();
        tilesSortableRef.current = null;
      }
    };
  }, [currentArrangement, tilesContainerRef.current]);
  
  // Simple function to handle direct clicking on tiles
  const handleTileClick = (letter: string, index: number) => {
    // Find the first empty pot
    const emptyPotIndex = potArrangement.findIndex(pot => pot === null);
    
    if (emptyPotIndex !== -1) {
      // Add letter to the first empty pot
      addLetterToPot(letter, emptyPotIndex);
      
      // Remove letter from tiles
      const newArrangement = [...currentArrangement];
      newArrangement.splice(index, 1);
      setCurrentArrangement(newArrangement);
    } else {
      // No empty pots
      toast({
        title: "No empty pots",
        description: "Remove a letter from a pot first.",
        variant: "destructive",
      });
    }
  };

  // Helper function to add a letter to a pot
  const addLetterToPot = (letter: string, potIndex: number) => {
    // Check if the pot already has a letter
    if (potArrangement[potIndex] !== null) {
      // Return the old letter to the tiles
      const newArrangement = [...currentArrangement];
      newArrangement.push(potArrangement[potIndex]!);
      setCurrentArrangement(newArrangement);
    }
    
    // Update the pot arrangement
    const newPotArrangement = [...potArrangement];
    newPotArrangement[potIndex] = letter;
    setPotArrangement(newPotArrangement);
  };

  const startNewGame = () => {
    if (!difficulty) return;
    
    setIsLoading(true);
    
    // Get a random word based on difficulty
    const newWord = getRandomWordByDifficulty(difficulty);
    setOriginalWord(newWord);
    
    // Scramble it and ensure it's different from the original
    let scrambled = scrambleWord(newWord, difficulty);
    while (scrambled === newWord) {
      scrambled = scrambleWord(newWord, difficulty);
    }
    
    setScrambledWord(scrambled);
    setCurrentArrangement(scrambled.split(''));
    setPotArrangement(Array(newWord.length).fill(null));
    setHintsUsed(getHintsForWord(difficulty, newWord));
    setPuzzlesSolved(countCompletedWords(difficulty))
    setHintedIndexes([]);
    setIsCorrect(null);
    setShowInvalidAnimation(false);
    setShowHelpAnimation(true);
    
    setIsLoading(false);
  };

  const resetDifficulty = () => {
    setDifficulty(null);
    setPuzzlesSolved(0);
  }

  const useHint = () => {
    if (!difficulty) return;
    
    const maxHints = MAX_HINTS[difficulty];
    if (hintsUsed >= maxHints) {
      toast({
        title: "No hints left",
        description: `You've used all your ${maxHints} hints for this puzzle.`,
        variant: "destructive",
      });
      return;
    }
    
    // Find an index that hasn't been hinted yet
    const nonHintedIndexes = originalWord.split('').map((_, i) => i)
      .filter(i => !hintedIndexes.includes(i) && !potArrangement[i]);
      
    if (!nonHintedIndexes.length) {
      toast({
        title: "No more hints needed",
        description: "Try filling in the remaining spots yourself!",
      });
      return;
    }
    
    // Choose a random non-hinted position
    const hintIndex = nonHintedIndexes[Math.floor(Math.random() * nonHintedIndexes.length)];
    
    // Get the correct letter for this position
    const correctLetter = originalWord[hintIndex];
    
    // Find this letter in the current arrangement and remove it
    const letterIndex = currentArrangement.findIndex(letter => letter === correctLetter);
    
    if (letterIndex !== -1) {
      // Remove the letter from tiles
      const newArrangement = [...currentArrangement];
      newArrangement.splice(letterIndex, 1);
      setCurrentArrangement(newArrangement);
      
      // Place it in the correct pot
      const newPotArrangement = [...potArrangement];
      newPotArrangement[hintIndex] = correctLetter;
      setPotArrangement(newPotArrangement);
      
      // Update hint tracking
      setHintsUsed(prev => prev + 1);
      updateHints(difficulty, originalWord)
      updateHintsUsed(difficulty, originalWord)
      setHintedIndexes(prev => [...prev, hintIndex]);
      
      toast({
        title: "Hint used",
        description: `A letter has been placed in its correct position. ${maxHints - hintsUsed - 1} hints left.`
      });
    }
  };

  const checkAnswer = () => {
    // Join the pot arrangement to form the current guess
    const currentGuess = potArrangement.join('');
    
    // Check if all pots are filled
    if (potArrangement.includes(null)) {
      toast({
        title: "Incomplete word",
        description: "Fill all the letter pots before checking your answer.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentGuess === originalWord) {
      setIsCorrect(true);
      setPuzzlesSolved(prev => prev + 1);
      // markWordAsSolved(difficulty, originalWord)
      updateScore(difficulty, originalWord)
  
      toast({
        title: "Correct!",
        description: "You've unscrambled the word successfully!"
      });
    } else {
      setIsCorrect(false);
      setShowInvalidAnimation(true);
      
      // Reset animation state after animation completes
      setTimeout(() => setShowInvalidAnimation(false), 800);
      
      toast({
        title: "Not quite right",
        description: "Keep trying to unscramble the word.",
        variant: "destructive",
      });
    }
  };

  const resetFromPot = (index: number) => {
    if (potArrangement[index] !== null) {
      // Return the letter to the tiles
      const newArrangement = [...currentArrangement];
      newArrangement.push(potArrangement[index]!);
      setCurrentArrangement(newArrangement);
      
      // Clear the pot
      const newPotArrangement = [...potArrangement];
      newPotArrangement[index] = null;
      setPotArrangement(newPotArrangement);
    }
  };

  // If no difficulty is selected, show difficulty selector
  if (difficulty === null) {
    return (
      <DifficultySelector onSelectDifficulty={setDifficulty} />
    );
  }

  // If game is completed, show game over screen
  if (isCorrect) {
    return (
      <GameOverScreen 
        hasWon={true}
        targetWord={originalWord}
        difficulty={difficulty}
        puzzlesSolved={puzzlesSolved}
        onPlayAgain={startNewGame}
        onChangeDifficulty={resetDifficulty}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Word Scramble</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
            
            <span className="text-sm text-muted-foreground">
              Puzzles solved: {puzzlesSolved}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Mute sound"
            onClick={() => {}}
            className="h-10 w-10 rounded-full hover:bg-primary/10"
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            title="New Puzzle"
            onClick={startNewGame}
            className="flex items-center gap-1"
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">New Puzzle</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDifficulty}
            className="flex items-center gap-1"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Change Level</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 md:p-6 bg-white mb-4">
        <div className="mb-4 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            {showHelpAnimation && (
              <span className="animate-pulse bg-primary/20 px-2 py-1 rounded-full flex items-center gap-1 text-sm">
                <MoveHorizontal className="h-4 w-4" /> Drag or tap tiles to fill the pots
              </span>
            )}
            {!showHelpAnimation && "Drag or tap the letters into the pots to form a word."}
          </p>
        </div>
          
        {/* Letter Pots (Destination) */}
        <div 
          className={`flex justify-center flex-wrap my-8 ${showInvalidAnimation ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          ref={potsContainerRef}
        >
          {potArrangement.map((letter, index) => (
            <LetterPot 
              key={`pot-${index}`}
              letter={letter}
              isHinted={hintedIndexes.includes(index)}
              isCorrect={isCorrect}
              index={index}
              onLetterRemove={() => resetFromPot(index)}
            />
          ))}
        </div>

        {/* Letter Tiles (Source) */}
        <div 
          className="flex justify-center flex-wrap my-6 relative"
          ref={tilesContainerRef}
        >
          {currentArrangement.map((letter, index) => (
            <div 
              key={`tile-${index}-${letter}`}
              onClick={() => handleTileClick(letter, index)}
            >
              <LetterTile 
                letter={letter}
                isHinted={false}
                isCorrect={!!isCorrect}
                index={index}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Button
            onClick={checkAnswer}
            className="px-8 py-2 flex items-center gap-2"
            disabled={isCorrect === true}
          >
            <Check className="h-5 w-5" />
            Check Answer
          </Button>
          
          {MAX_HINTS[difficulty] > 0 && (
            <Button
              onClick={useHint}
              variant="outline"
              className="px-8 py-2 flex items-center gap-1"
              disabled={hintsUsed >= MAX_HINTS[difficulty] || isCorrect === true}
            >
              <HelpCircle className="h-5 w-5" />
              Hint ({MAX_HINTS[difficulty] - hintsUsed} left)
            </Button>
          )}
        </div>
        
        {/* Progress stars */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(puzzlesSolved, 5) }).map((_, i) => (
              <Star 
                key={i} 
                className="h-6 w-6 text-yellow-400 fill-yellow-400 animate-[scale-in_0.3s_ease-out]" 
              />
            ))}
            {puzzlesSolved > 5 && (
              <span className="text-sm font-medium text-yellow-600">+{puzzlesSolved - 5}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Fix: Update style tag to use correct React syntax */}
      <style>{`
        .dragging-tile {
          transform: scale(1.1);
          opacity: 0.8;
          z-index: 100;
          cursor: grabbing !important;
        }
        
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(139, 92, 246, 0.3); }
          50% { border-color: rgba(139, 92, 246, 0.8); }
        }
        
        [data-pot-index] {
          transition: all 0.2s ease-out;
        }
        
        [data-pot-index]:empty {
          animation: pulse-border 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default WordScrambleGame;
