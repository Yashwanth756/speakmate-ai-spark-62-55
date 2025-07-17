import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Book, ArrowRight, Star, HelpCircle, Award } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { LevelSelector } from "@/components/vocabulary/LevelSelector";
import { vocabularyArchadeData } from "@/data/progressData";
const backend_url = import.meta.env.VITE_backend_url
let vocabularyArchade = vocabularyArchadeData();

const vocabularyData = {
  beginner: vocabularyArchade['beginner']['wordDetails'],
  intermediate: vocabularyArchade['intermediate']['wordDetails'],
  advanced: vocabularyArchade['advanced']['wordDetails']
};


async function updateScoreAndSolve(difficulty, word) {
  console.log(difficulty, word)
  
  const level = vocabularyArchade[difficulty];
  const wordObj = level.wordDetails.find(w => w.word === word);

  if (!wordObj) {
    console.warn(`Word "${word}" not found in ${difficulty} level.`);
    return vocabularyArchade;
  }

  if (!wordObj.isSolved) {
    wordObj.isSolved = true;
    level.score += 1;
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    const email = userSession.email || "a@gmail.com";
    try {
      await fetch(backend_url + "updateVocabularyArchadeScore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, difficulty, word })
      });
    } catch (error) {
      console.error("Failed to update score on server:", error);
    }
  }
}

async function updateBadge(badge, level) {
  console.log(badge, level, vocabularyArchade[level]['badge'])
  if(vocabularyArchade[level]['badge'] == ""){
    try {
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      const email = userSession.email || "a@gmail.com";
      const response = await fetch(backend_url + "updateVocabularyBadge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, badge, level })
      });

      const result = await response.json();
      if (result.success) {
        console.log("Badge updated successfully");
      } else {
        console.error("Badge update failed:", result.message);
      }
    } catch (error) {
      console.error("Error while updating badge:", error);
    }
  }
}


// Types for our vocabulary game
interface WordData {
  word: string;
  definition: string;
  incorrectDefinitions: string[];
  partOfSpeech: string;
  example: string;
  hint: string;
}

interface DefinitionOption {
  text: string;
  isCorrect: boolean;
}

const VocabularyArcade: React.FC = () => {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [options, setOptions] = useState<DefinitionOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWordInfo, setShowWordInfo] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [eliminatedOption, setEliminatedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [badge, setBadge] = useState("");
  
  // Animation refs
  const wordRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Start a new game
  const startGame = (selectedLevel: "beginner" | "intermediate" | "advanced") => {
    setLevel(selectedLevel);
    setGameStarted(true);
    setCurrentWordIndex(vocabularyArchade[level]['currentWordIndex']);
    setScore(vocabularyArchade[level]['score']);
    setRoundCompleted(false);
    setBadge("");
    loadWord(0, selectedLevel);
    
    toast({
      title: `${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Mode`,
      description: "Get ready to become a Word Master!"
    });
  };

  // Load a word based on the current index
  const loadWord = (index: number, currentLevel = level) => {
    const levelWords = vocabularyData[currentLevel];
    if (index >= levelWords.length) {
      // End of round
      handleRoundComplete();
      return;
    }

    const word = levelWords[index];
    setCurrentWord(word);
    setSelectedOption(null);
    setShowAnswer(false);
    setShowWordInfo(false);
    setUsedHint(false);
    setEliminatedOption(null);

    // Create shuffled options
    const allOptions = [
      { text: word.definition, isCorrect: true },
      ...word.incorrectDefinitions.map(def => ({ text: def, isCorrect: false }))
    ];
    
    // Shuffle the options
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    setOptions(shuffledOptions);
  };

  // Handle option selection
  const handleSelectOption = (index: number) => {
    if (showAnswer) return; // Prevent selection after answer is revealed
    
    setSelectedOption(index);
  };

  // Check the selected answer
  const checkAnswer = () => {
    if (selectedOption === null) {
      toast({
        title: "Select an answer",
        description: "Please select one of the definitions first.",
        variant: "destructive"
      });
      return;
    }

    setShowAnswer(true);
    
    if (options[selectedOption].isCorrect) {
      // Correct answer
      // setScore(prev => prev + 1);
      updateScoreAndSolve(level, currentWord.word)
      setScore(vocabularyArchade[level]['score'])
      
      toast({
        title: "Correct! 🎉",
        description: `Great job! "${currentWord?.word}" means "${currentWord?.definition}"`,
      });
      
      // Add confetti effect here
    } else {
      // Incorrect answer
      toast({
        title: "Not quite right",
        description: `The correct definition of "${currentWord?.word}" is "${currentWord?.definition}"`,
        variant: "destructive"
      });
    }
  };

  // Move to the next word
  const nextWord = () => {
    if (currentWordIndex + 1 >= vocabularyData[level].length) {
      handleRoundComplete();
    } else {
      loadWord(currentWordIndex + 1);
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  // Use a hint
  const useHint = () => {
    if (usedHint || showAnswer) return;
    
    setUsedHint(true);
    
    // Find an incorrect option to eliminate
    const incorrectIndices = options.map((opt, i) => !opt.isCorrect ? i : -1).filter(i => i !== -1);
    
    if (incorrectIndices.length) {
      const randomIndex = Math.floor(Math.random() * incorrectIndices.length);
      setEliminatedOption(incorrectIndices[randomIndex]);
      
      toast({
        title: "Hint Used",
        description: currentWord?.hint || "One incorrect answer has been eliminated",
      });
    }
  };

  // Handle round completion
  const handleRoundComplete = () => {
    setRoundCompleted(true);
    
    // Determine badge based on score
    const totalWords = vocabularyData[level].length;
    const scorePercentage = (score / totalWords) * 100;
    
    let newBadge = "";
    if (scorePercentage >= 90) {
      newBadge = "Vocab Master";
    } else if (scorePercentage >= 70) {
      newBadge = "Word Wizard";
    } else if (scorePercentage >= 50) {
      newBadge = "Word Sprout";
    }
    
    setBadge(newBadge);
    updateBadge(newBadge, level)

    
    toast({
      title: "Round Complete! 🎊",
      description: `You scored ${score}/${totalWords}! ${newBadge ? `Badge earned: ${newBadge}` : ''}`,
    });
  };

  // Toggle word info panel
  const toggleWordInfo = () => {
    setShowWordInfo(!showWordInfo);
  };

  return (
    <div className="animate-fade-in">
      {!gameStarted ? (
        // Main Menu 
        <motion.div 
          className="text-center" 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">Vocabulary Builder Arcade</h2>
            <p className="text-muted-foreground">Match words with their correct definitions and become a Word Master!</p>
          </div>
          
          <motion.div 
            className="max-w-md mx-auto mb-10 p-8 bg-primary/5 rounded-2xl border-2 border-primary/20"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img 
              src="/placeholder.svg" 
              alt="Vocabulary Game" 
              className="w-32 h-32 mx-auto mb-6 opacity-80" 
            />
            
            <h3 className="text-lg font-semibold mb-6">Select a Level to Begin</h3>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline"
                size="lg"
                className="flex items-center justify-center gap-4 py-6 border-2 hover:border-primary"
                onClick={() => startGame("beginner")}
              >
                <Book className="h-6 w-6 text-green-500" />
                <div className="text-left">
                  <div className="text-lg font-semibold">Beginner</div>
                  <div className="text-xs text-muted-foreground">Simple words with hints</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="flex items-center justify-center gap-4 py-6 border-2 hover:border-primary"
                onClick={() => startGame("intermediate")}
              >
                <Book className="h-6 w-6 text-amber-500" />
                <div className="text-left">
                  <div className="text-lg font-semibold">Intermediate</div>
                  <div className="text-xs text-muted-foreground">Common middle-grade words</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="flex items-center justify-center gap-4 py-6 border-2 hover:border-primary"
                onClick={() => startGame("advanced")}
              >
                <Book className="h-6 w-6 text-red-500" />
                <div className="text-left">
                  <div className="text-lg font-semibold">Advanced</div>
                  <div className="text-xs text-muted-foreground">SAT-level vocabulary</div>
                </div>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Game Screen
        <div className="pb-6">
          {roundCompleted ? (
            // Round summary screen
            <motion.div 
              className="text-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">Round Complete!</h2>
              
              <div className="bg-primary/10 rounded-2xl p-8 max-w-md mx-auto mb-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Your Score</h3>
                <div className="text-4xl font-bold text-primary mb-6">
                  {score}/{vocabularyData[level].length}
                </div>
                
                {badge && (
                  <motion.div 
                    className="mb-8"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  >
                    <div className="inline-block bg-primary/20 p-4 rounded-full">
                      <Award className="h-12 w-12 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold mt-2">Badge Earned!</h4>
                    <div className="text-lg font-bold mt-1">{badge}</div>
                  </motion.div>
                )}
                
                <div className="flex flex-col gap-3 mt-4">
                  <Button onClick={() => startGame(level)}>Play Again</Button>
                  <Button variant="outline" onClick={() => setGameStarted(false)}>
                    Change Level
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            // Active game screen
            <div>
              {/* Header with progress and level */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Vocabulary Builder</h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Level: {level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    <span className="mx-2">•</span>
                    <span>Word {currentWordIndex + 1} of {vocabularyData[level].length}</span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {Array(vocabularyData[level].length).fill(0).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i < currentWordIndex 
                          ? (i < score ? 'bg-green-500' : 'bg-red-300')
                          : i === currentWordIndex 
                            ? 'bg-primary animate-pulse' 
                            : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Word display */}
              <motion.div 
                ref={wordRef}
                className="bg-primary/10 rounded-2xl p-6 md:p-8 mb-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-sm font-medium text-primary/70 mb-2">WORD TO DEFINE:</h3>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {currentWord?.word}
                </div>
                
                {showWordInfo && (
                  <motion.div 
                    className="mt-4 pt-4 border-t border-primary/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm text-primary/70 mb-1">PART OF SPEECH:</div>
                    <div className="font-medium mb-2">{currentWord?.partOfSpeech}</div>
                    
                    <div className="text-sm text-primary/70 mb-1">EXAMPLE:</div>
                    <div className="italic mb-0">{currentWord?.example}</div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Definition options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-primary/70 mb-3">SELECT THE CORRECT DEFINITION:</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence>
                    {options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const isEliminated = eliminatedOption === index;
                      
                      let optionState = "default";
                      if (showAnswer) {
                        if (option.isCorrect) {
                          optionState = "correct";
                        } else if (isSelected) {
                          optionState = "incorrect";
                        }
                      } else if (isSelected) {
                        optionState = "selected";
                      } else if (isEliminated) {
                        optionState = "eliminated";
                      }
                      
                      const stateStyles = {
                        default: "bg-white border-gray-200 hover:border-primary/50",
                        selected: "bg-primary/20 border-primary",
                        correct: "bg-green-100 border-green-500",
                        incorrect: "bg-red-100 border-red-300",
                        eliminated: "opacity-50 bg-gray-100"
                      };
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: isEliminated ? 0.5 : 1, 
                            y: 0,
                            scale: isSelected ? 1.02 : 1
                          }}
                          transition={{ 
                            duration: 0.3,
                            delay: index * 0.1
                          }}
                          whileHover={!showAnswer && !isEliminated ? { scale: 1.02 } : {}}
                          className={`
                            relative p-4 rounded-xl border-2 cursor-pointer
                            ${stateStyles[optionState]}
                            ${isEliminated ? 'pointer-events-none' : ''}
                            transition-all duration-200
                          `}
                          onClick={() => !isEliminated && handleSelectOption(index)}
                        >
                          <div className="text-md md:text-lg">{option.text}</div>
                          
                          {showAnswer && option.isCorrect && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {!showAnswer ? (
                  <>
                    <Button 
                      variant="default"
                      className="flex-1"
                      onClick={checkAnswer}
                      disabled={selectedOption === null}
                    >
                      Check Answer
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={useHint}
                      disabled={usedHint}
                      className={`${usedHint ? 'opacity-50' : 'animate-pulse'}`}
                    >
                      <HelpCircle className="mr-1 h-4 w-4" />
                      Use Hint
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="default"
                    className="flex-1"
                    onClick={nextWord}
                  >
                    Next Word
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={toggleWordInfo}
                >
                  {showWordInfo ? 'Hide' : 'Show'} Word Info
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyArcade;
