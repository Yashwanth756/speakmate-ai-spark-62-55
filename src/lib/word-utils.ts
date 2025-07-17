
import { commonFiveLetterWords } from './word-lists/common-words';
import { validFiveLetterWords } from './word-lists/valid-words';
import { Difficulty } from '@/components/word-puzzle/WordScrambleGame';
import { wordscrambleData } from '@/data/progressData';
const backend_url = import.meta.env.VITE_backend_url
// List of easy words (4-5 letters)

let wordscramble = wordscrambleData() 
const easyWords = wordscramble.easy.map(entry => entry[0]);
const mediumWords = wordscramble.medium.map(entry => entry[0]);
const hardWords = wordscramble.hard.map(entry => entry[0]);
// console.log(wordscramble)

export const  getHintsForWord=(level, word)=> {
  if (!wordscramble[level]) return null;

  const entry = wordscramble[level].find(([w]) => w === word);
  return entry ? entry[1] : null; // returns hint count or null if not found
}

export const updateHints = async(difficulty: string, word: string) =>{
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  const email = userSession.email || "a@gmail.com";
  const response = await fetch(backend_url + "updatehints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, difficulty, word })
  });

  const result = await response.json();
  console.log("Update result:", result);
}

export const updateHintsUsed=(difficulty, word)=> {
  const levelWords = wordscramble[difficulty];

  if (!levelWords) {
    console.error("Invalid difficulty level");
    return;
  }

  const entry = levelWords.find(w => w[0] === word);

  if (entry) {
    entry[1] += 1; // Increment hintsUsed
  } else {
    console.warn(`Word "${word}" not found in ${difficulty} level`);
  }
}

export const countCompletedWords=(difficulty)=> {
  const levelWords = wordscramble[difficulty];

  if (!levelWords) {
    console.error("Invalid difficulty level");
    return 0;
  }

  return levelWords.filter(entry => entry[2] === true).length;
}

export const markWordAsSolved=(difficulty, word)=> {
  const levelWords = wordscramble[difficulty];

  if (!levelWords) {
    console.error("Invalid difficulty level");
    return;
  }

  const entry = levelWords.find(entry => entry[0] === word);

  if (entry) {
    entry[2] = true;
  } else {
    console.warn(`Word "${word}" not found in ${difficulty} level`);
  }
}

export const updateScore=async(difficulty, word)=>{
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  const email = userSession.email || "a@gmail.com";

  const levelWords = wordscramble[difficulty];
  const entry = levelWords.find(([w]) => w === word);
  if (!entry) {
    console.warn(`Word "${word}" not found in ${difficulty}`);
    return;
  }

  const isSolved = entry[2];
  entry[2] = true
  console.log(wordscramble)

  if (isSolved) {
    console.log(`Word "${word}" is already solved.`);
    return;
  }

  // Send request to Flask to increment score
  try {
    const response = await fetch(backend_url + "increment-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        difficulty,
        word
      })
    });

    const result = await response.json();
    console.log("Server response:", result);
  } catch (error) {
    console.error("Failed to update score:", error);
  }
}

export const getRandomWord = (): string => {
  const index = Math.floor(Math.random() * commonFiveLetterWords.length);
  return commonFiveLetterWords[index];
};

// Check if a word is valid (in our list of valid words)
export const isValidWord = (word: string): boolean => {
  return validFiveLetterWords.includes(word.toLowerCase());
};

// Get a word list based on difficulty
export const getDifficultyWordList = (difficulty: Difficulty): string[] => {
  switch (difficulty) {
    case 'easy':
      return easyWords;
    case 'medium':
      return mediumWords;
    case 'hard':
      return midLengthWords.filter(word => word.length >= 8);
    default:
      return mediumWords;
  }
}

// Get a random word based on difficulty level  updating current word index
export const getRandomWordByDifficulty = (difficulty: Difficulty): string => {
  const wordList = getDifficultyWordList(difficulty);
  let index = wordscramble[difficulty+"score"].currWordIndex;
  if (index >= wordscramble[difficulty].length){
    index = 0;
    wordscramble[difficulty+"score"].currWordIndex = 0;
  }
  wordscramble[difficulty+"score"].currWordIndex++;
  return wordList[index];
}

// Check letter status in a word
type LetterStatus = 'correct' | 'present' | 'absent';

export const checkWordGuess = (guess: string, targetWord: string): LetterStatus[] => {
  // Convert both words to lowercase
  const normalizedGuess = guess.toLowerCase();
  const normalizedTarget = targetWord.toLowerCase();
  
  // Track letters in the target word
  const targetLetters: Record<string, number> = {};
  for (const letter of normalizedTarget) {
    targetLetters[letter] = (targetLetters[letter] || 0) + 1;
  }
  
  // First pass: mark correct letters
  const result: LetterStatus[] = Array(normalizedGuess.length).fill('absent');
  const usedIndices = new Set<number>();
  
  // Mark correct positions first
  for (let i = 0; i < normalizedGuess.length; i++) {
    const guessLetter = normalizedGuess[i];
    if (guessLetter === normalizedTarget[i]) {
      result[i] = 'correct';
      targetLetters[guessLetter] -= 1;
      usedIndices.add(i);
    }
  }
  
  // Mark present letters next, but only if we have occurrences left
  for (let i = 0; i < normalizedGuess.length; i++) {
    if (usedIndices.has(i)) continue;
    
    const guessLetter = normalizedGuess[i];
    if (targetLetters[guessLetter] > 0) {
      result[i] = 'present';
      targetLetters[guessLetter] -= 1;
    }
  }
  
  return result;
};

// Generate a keyboard map based on guesses
export const generateKeyboardStatus = (
  guesses: string[], 
  statuses: LetterStatus[][]
): Record<string, LetterStatus> => {
  const keyboardStatus: Record<string, LetterStatus> = {};
  
  // Flatten all guesses and their statuses
  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i].toLowerCase();
    const status = statuses[i];
    
    for (let j = 0; j < guess.length; j++) {
      const letter = guess[j];
      const currentStatus = status[j];
      
      // Only update if the new status is better than the existing one
      // correct > present > absent
      if (currentStatus === 'correct') {
        keyboardStatus[letter] = 'correct';
      } else if (currentStatus === 'present' && keyboardStatus[letter] !== 'correct') {
        keyboardStatus[letter] = 'present';
      } else if (!keyboardStatus[letter]) {
        keyboardStatus[letter] = currentStatus;
      }
    }
  }
  
  return keyboardStatus;
};

// List of common mid-length (6-9 letter) words for scramble game
export const midLengthWords = [
  "balance", "channel", "complex", "dynamic", "element", "factory", "gateway",
  "harmony", "intense", "journey", "kitchen", "liberty", "machine", "network",
  "observe", "pattern", "quality", "reality", "station", "theater", "upgrade",
  "variety", "welcome", "xylophone", "younger", "zealous", "absolute", "beneath",
  "capture", "decline", "emotion", "furnish", "genuine", "horizon", "imagine",
  "justice", "kingdom", "lasting", "mixture", "notable", "obvious", "proceed",
  "quantum", "respond", "supreme", "triumph", "unusual", "venture", "whisper",
  "amazing", "because", "creative", "delicate", "eventual", "frequent", "gratitude",
  "heritage", "internal", "junction", "keyboard", "language", "magazine", "numerous",
  "opposite", "pleasant", "question", "reliable", "sequence", "together", "ultimate",
  "valuable", "wildlife", "yearning", "abstract", "boundary", "category", "decisive",
  "economic", "familiar", "graceful", "humanity", "identity", "judgment", "knowledge",
  "learning", "movement", "navigate", "organize", "possible", "quantity", "resource",
  "sensible", "transfer", "universe", "validate", "workshop", "alliance", "building",
  "capacity", "division", "emphasis", "feelings", "generate", "hospital", "industry",
  "junction", "knowing", "location", "maintain", "neighbor", "optimize", "priority",
  "question", "reaction", "scenario", "training", "universe", "vicinity", "warranty",
  "yielding", "approach", "business", "council", "distance", "exchange", "festival",
  "graphics", "historic", "isolated", "judgment", "kilogram", "literacy", "material",
  "normally", "overhead", "progress", "quotient", "recovery", "specific", "thousand",
  "universe", "vertical", "workshop"
];

// Get a random mid-length word for the word scramble game
export const getRandomMidLengthWord = (): string => {
  const index = Math.floor(Math.random() * midLengthWords.length);
  return midLengthWords[index];
};

// Scramble a word using Fisher-Yates shuffle with difficulty factor
export const scrambleWord = (word: string, difficulty: Difficulty = 'medium'): string => {
  const letters = word.split('');
  
  // Apply more aggressive shuffle for harder difficulties
  const shuffleIterations = difficulty === 'hard' ? 3 : 1;
  
  for (let iter = 0; iter < shuffleIterations; iter++) {
    // Fisher-Yates shuffle algorithm
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]]; // Swap elements
    }
  }
  
  return letters.join('');
};
