
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Trophy, Lightbulb, RotateCcw, Star, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { wordsearchData } from '@/data/progressData';
const backend_url = import.meta.env.VITE_backend_url
let wordsearch = wordsearchData()

function getSolvedWords(level: 'beginner' | 'intermediate' | 'advanced'): Set<string> {
  const solvedWords = new Set<string>();

  if (wordsearch[level] && Array.isArray(wordsearch[level].words)) {
    for (const wordObj of wordsearch[level].words) {
      if (wordObj.solved) {
        solvedWords.add(wordObj.word);
      }
    }
  }

  return solvedWords;
}
function markWordAsSolved(
  level: 'beginner' | 'intermediate' | 'advanced',
  word: string
): void {
  const levelData = wordsearch[level];
  if (!levelData || !Array.isArray(levelData.words)) return;

  const targetWord = levelData.words.find(
    (w: any) => w.word.toUpperCase() === word.toUpperCase()
  );

  if (targetWord && !targetWord.solved) {
    targetWord.solved = true;
    levelData.noOfWordsSolved = (levelData.noOfWordsSolved || 0) + 1;
  }
}

async function updateScoreOnServer(level: 'beginner' | 'intermediate' | 'advanced', score: number, word) {
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  const email = userSession.email || "a@gmail.com";
  const response = await fetch(backend_url+'updateWordsearchScore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, level, score, word })
  });

  const result = await response.json();
  console.log(result.message); // "Score updated successfully" or error
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface WordData {
  word: string;
  hint: string;
  found: boolean;
  cells: Array<{ row: number; col: number }>;
}

interface GameConfig {
  gridSize: number;
  words: Array<{ word: string; hint: string }>;
}

const GAME_CONFIGS: Record<DifficultyLevel, GameConfig> = {
  beginner: {
    gridSize: 8,
    words: [
      { word: "HEART", hint: "This organ pumps blood through your body" },
      { word: "BRAIN", hint: "The control center of your nervous system" },
      { word: "PLANT", hint: "Living organisms that make their own food" },
      { word: "WATER", hint: "Essential liquid for all life on Earth" },
      { word: "EARTH", hint: "The planet we live on" },
      { word: "SOUND", hint: "Vibrations that travel through air to your ears" },
      { word: "LIGHT", hint: "Energy that allows us to see" },
      { word: "FORCE", hint: "A push or pull that can change motion" },
      { word: "ENERGY", hint: "The ability to do work or cause change" },
      { word: "MATTER", hint: "Anything that has mass and takes up space" }
    ]
  },
  intermediate: {
    gridSize: 10,
    words: [
      { word: "PHOTOSYNTHESIS", hint: "The process by which plants make their food using sunlight" },
      { word: "ECOSYSTEM", hint: "A community of living and non-living things interacting" },
      { word: "RESPIRATION", hint: "The process of breathing and exchanging gases" },
      { word: "BIODIVERSITY", hint: "The variety of life in an ecosystem" },
      { word: "ADAPTATION", hint: "How organisms change to survive in their environment" },
      { word: "EVOLUTION", hint: "The gradual change of species over time" },
      { word: "GENETICS", hint: "The study of heredity and variation in organisms" },
      { word: "MOLECULE", hint: "The smallest unit of a chemical compound" },
      { word: "ORGANISM", hint: "Any individual living thing" },
      { word: "HABITAT", hint: "The natural home of an organism" }
    ]
  },
  advanced: {
    gridSize: 12,
    words: [
      { word: "MITOCHONDRIA", hint: "The powerhouse of the cell that produces energy" },
      { word: "CHROMOSOME", hint: "Structure containing DNA and genetic information" },
      { word: "BIOCHEMISTRY", hint: "The study of chemical processes in living organisms" },
      { word: "THERMODYNAMICS", hint: "The study of heat, energy, and their transformations" },
      { word: "ELECTROMAGNETIC", hint: "Relating to electric and magnetic fields" },
      { word: "NANOTECHNOLOGY", hint: "Technology dealing with structures smaller than 100 nanometers" },
      { word: "QUANTUM", hint: "Related to the smallest discrete units of energy" },
      { word: "CRYSTALLINE", hint: "Having a regular, repeating atomic structure" },
      { word: "CATALYSIS", hint: "The acceleration of a chemical reaction by a catalyst" },
      { word: "POLYMER", hint: "Large molecules made of repeating subunits" }
    ]
  }
};

interface WordSearchGameProps {
  difficulty: DifficultyLevel;
  onLevelComplete: (score: number) => void;
  onBackToMenu: () => void;
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
  difficulty,
  onLevelComplete,
  onBackToMenu
}) => {
  const { toast } = useToast();
  const config = GAME_CONFIGS[difficulty];
  
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<WordData[]>([]);
  const [selectedCells, setSelectedCells] = useState<Array<{ row: number; col: number }>>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!gameCompleted) {
      const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [gameCompleted]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const generateGrid = (): { grid: string[][], wordPlacements: WordData[] } => {
    const size = config.gridSize;
    const newGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    const wordPlacements: WordData[] = [];

    // Place words in grid
    for (const wordData of config.words) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const direction = Math.floor(Math.random() * 8); // 8 directions
        const word = wordData.word;
        const wordLength = word.length;
        
        let startRow = Math.floor(Math.random() * size);
        let startCol = Math.floor(Math.random() * size);
        
        const directions = [
          [-1, -1], [-1, 0], [-1, 1], // Up-left, Up, Up-right
          [0, -1],           [0, 1],  // Left, Right
          [1, -1],  [1, 0],  [1, 1]   // Down-left, Down, Down-right
        ];
        
        const [deltaRow, deltaCol] = directions[direction];
        
        // Check if word fits
        let fits = true;
        const cells: Array<{ row: number; col: number }> = [];
        
        for (let i = 0; i < wordLength; i++) {
          const row = startRow + i * deltaRow;
          const col = startCol + i * deltaCol;
          
          if (row < 0 || row >= size || col < 0 || col >= size) {
            fits = false;
            break;
          }
          
          if (newGrid[row][col] !== '' && newGrid[row][col] !== word[i]) {
            fits = false;
            break;
          }
          
          cells.push({ row, col });
        }
        
        if (fits) {
          // Place the word
          for (let i = 0; i < wordLength; i++) {
            const row = startRow + i * deltaRow;
            const col = startCol + i * deltaCol;
            newGrid[row][col] = word[i];
          }
          
          wordPlacements.push({
            word: wordData.word,
            hint: wordData.hint,
            found: false,
            cells
          });
          
          placed = true;
        }
        
        attempts++;
      }
    }

    // Fill empty cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    return { grid: newGrid, wordPlacements };
  };

  const initializeGame = () => {
    const { grid: newGrid, wordPlacements } = generateGrid();
    setGrid(newGrid);
    setWords(wordPlacements);
    setFoundWords(getSolvedWords(difficulty));
    setScore(wordsearch[difficulty]['score']);
    setTimer(0);
    setGameCompleted(false);
    setSelectedCells([]);
    setIsSelecting(false);
  };

  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting && selectedCells.length > 0) {
      const start = selectedCells[0];
      const newSelection = getLinePath(start.row, start.col, row, col);
      setSelectedCells(newSelection);
    }
  };

  const handleCellMouseUp = () => {
    if (selectedCells.length > 1) {
      checkSelectedWord();
    }
    setIsSelecting(false);
    setSelectedCells([]);
  };

  const getLinePath = (startRow: number, startCol: number, endRow: number, endCol: number) => {
    const path: Array<{ row: number; col: number }> = [];
    
    const deltaRow = endRow - startRow;
    const deltaCol = endCol - startCol;
    
    // Check if it's a straight line (horizontal, vertical, or diagonal)
    if (deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol)) {
      const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
      const stepRow = steps === 0 ? 0 : deltaRow / steps;
      const stepCol = steps === 0 ? 0 : deltaCol / steps;
      
      for (let i = 0; i <= steps; i++) {
        path.push({
          row: startRow + Math.round(i * stepRow),
          col: startCol + Math.round(i * stepCol)
        });
      }
    }
    
    return path;
  };

  const checkSelectedWord = () => {
    const selectedWord = selectedCells.map(({ row, col }) => grid[row][col]).join('');
    const selectedWordReverse = selectedWord.split('').reverse().join('');
    
    const foundWord = words.find(wordData => {
      if (foundWords.has(wordData.word)) return false;
      
      return (selectedWord === wordData.word || selectedWordReverse === wordData.word) &&
             arraysEqual(selectedCells, wordData.cells) || 
             arraysEqual(selectedCells, wordData.cells.slice().reverse());
    });

    if (foundWord) {
      const newFoundWords = new Set(foundWords);
      newFoundWords.add(foundWord.word);
      setFoundWords(newFoundWords);
      markWordAsSolved(difficulty, selectedWord)
      // console.log(wordsearch['beginner'])
      // console.log(foundWord.word)
      
      const points = difficulty === 'beginner' ? 10 : difficulty === 'intermediate' ? 15 : 20;
      setScore(prev => prev + points);
      updateScoreOnServer(difficulty, score, selectedWord)
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      
      toast({
        title: "Word Found! 🎉",
        description: `${foundWord.word} - ${foundWord.hint}`,
      });
      
      // Check if all words are found
      if (newFoundWords.size === words.length) {
        setGameCompleted(true);
        const finalScore = score + points + Math.max(0, 300 - timer); // Time bonus
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast({
          title: "Level Complete! 🏆",
          description: `You found all words! Final score: ${finalScore}`,
        });
        
        setTimeout(() => onLevelComplete(finalScore), 2000);
      }
    }
  };

  const arraysEqual = (a: Array<{ row: number; col: number }>, b: Array<{ row: number; col: number }>) => {
    if (a.length !== b.length) return false;
    return a.every((cell, index) => cell.row === b[index].row && cell.col === b[index].col);
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };

  const isCellInFoundWord = (row: number, col: number) => {
    return words.some(wordData => 
      foundWords.has(wordData.word) && 
      wordData.cells.some(cell => cell.row === row && cell.col === col)
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyIcon = () => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBackToMenu} variant="outline">
              ← Back to Menu
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>{getDifficultyIcon()}</span>
                Word Search - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </h1>
              <p className="text-muted-foreground">Find all {words.length} hidden words in the grid</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {formatTime(timer)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4" />
              Score: {score}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              {foundWords.size}/{words.length}
            </div>
            <Button onClick={initializeGame} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              New Game
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div 
                  className="grid gap-1 mx-auto w-fit select-none"
                  style={{ 
                    gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${config.gridSize}, 1fr)` 
                  }}
                  onMouseLeave={() => {
                    setIsSelecting(false);
                    setSelectedCells([]);
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((letter, colIndex) => {
                      const isSelected = isCellSelected(rowIndex, colIndex);
                      const isInFoundWord = isCellInFoundWord(rowIndex, colIndex);
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            w-8 h-8 border border-gray-300 flex items-center justify-center cursor-pointer
                            font-bold text-sm transition-all duration-200 hover:bg-blue-100
                            ${isSelected ? 'bg-blue-200 border-blue-500 scale-110' : ''}
                            ${isInFoundWord ? 'bg-green-100 border-green-400 text-green-800' : ''}
                          `}
                          onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                          onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                          onMouseUp={handleCellMouseUp}
                        >
                          {letter}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Words & Hints */}
          <div className="space-y-4">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Words Found</span>
                    <span className="font-bold">{foundWords.size}/{words.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(foundWords.size / words.length) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Word List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Word Hints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {words.map((wordData, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        foundWords.has(wordData.word)
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          variant={foundWords.has(wordData.word) ? "default" : "outline"}
                          className={foundWords.has(wordData.word) ? "bg-green-500" : ""}
                        >
                          {foundWords.has(wordData.word) ? wordData.word : `${wordData.word.length} letters`}
                        </Badge>
                        {foundWords.has(wordData.word) && (
                          <span className="text-green-600 text-sm">✓ Found</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{wordData.hint}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
