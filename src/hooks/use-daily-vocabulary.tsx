import { useState, useEffect, useCallback } from 'react';
import { sendMessageToGemini } from '@/lib/gemini-api';

interface VocabularyWord {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  memoryTip: string;
  isSolved?: boolean;
}

interface DailyVocabularyData {
  date: string;
  words: VocabularyWord[];
  level: string;
}

export const useDailyVocabulary = () => {
  const [vocabularyData, setVocabularyData] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);

  // Get today's date as string
  const getTodayKey = () => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Get stored vocabulary data for today
  const getTodaysData = (level: string): DailyVocabularyData | null => {
    const todayKey = getTodayKey();
    const storageKey = `daily-vocabulary-${todayKey}-${level}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Store vocabulary data for today
  const storeTodaysData = (level: string, words: VocabularyWord[]) => {
    const todayKey = getTodayKey();
    const storageKey = `daily-vocabulary-${todayKey}-${level}`;
    const data: DailyVocabularyData = {
      date: todayKey,
      words,
      level
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Clean up old vocabulary data (keep only last 7 days)
  const cleanupOldData = () => {
    const keys = Object.keys(localStorage);
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    keys.forEach(key => {
      if (key.startsWith('daily-vocabulary-')) {
        const dateMatch = key.match(/daily-vocabulary-(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const date = new Date(dateStr);
          if (date < sevenDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    });
  };

  // Fetch vocabulary words from Gemini
  const fetchVocabularyFromGemini = async (level: string): Promise<VocabularyWord[]> => {
    const prompt = `Generate 5 vocabulary words for ${level} level English learners. Provide the response as a JSON array with this exact structure:

[
  {
    "word": "example",
    "meaning": "a thing characteristic of its kind or illustrating a general rule",
    "partOfSpeech": "noun",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "example": "This painting is a perfect example of the artist's later work.",
    "synonyms": ["instance", "case", "illustration", "sample"],
    "antonyms": ["exception", "anomaly"],
    "memoryTip": "Think of 'exam' + 'ple' - something you examine as a sample"
  }
]

Requirements:
- ${level === 'beginner' ? 'Simple, common words (3-8 letters)' : 
      level === 'intermediate' ? 'Moderately challenging words (5-12 letters)' : 
      'Advanced vocabulary, academic or professional words (6-15 letters)'}
- Provide accurate phonetic pronunciation
- Include 2-4 synonyms and 1-3 antonyms
- Create memorable tips for each word
- Ensure proper grammar and accurate definitions

Return only the JSON array, no additional text.`;

    try {
      const response = await sendMessageToGemini(prompt, "vocabulary-generation");
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedWords = JSON.parse(jsonMatch[0]);
        return parsedWords;
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      throw new Error("Failed to generate vocabulary words");
    }
  };

  // Load vocabulary for a specific level
  const loadVocabulary = useCallback(async (level: string) => {
    setLoading(true);
    setError(false);
    setCurrentWordIndex(0);

    try {
      // Check if we have today's data
      const todaysData = getTodaysData(level);
      
      if (todaysData && todaysData.words.length > 0) {
        // Use cached data for today
        setVocabularyData(todaysData.words);
      } else {
        // Fetch fresh data from Gemini
        const newWords = await fetchVocabularyFromGemini(level);
        
        if (newWords && newWords.length > 0) {
          setVocabularyData(newWords);
          storeTodaysData(level, newWords);
          cleanupOldData(); // Clean up old data
        } else {
          throw new Error("No words generated");
        }
      }
    } catch (err) {
      console.error('Error loading vocabulary:', err);
      setError(true);
      
      // Fallback vocabulary data
      const fallbackWords: VocabularyWord[] = [
        {
          word: "example",
          meaning: "a thing characteristic of its kind or illustrating a general rule",
          partOfSpeech: "noun",
          phonetic: "/ɪɡˈzɑːmpl/",
          example: "This painting is a perfect example of the artist's later work.",
          synonyms: ["instance", "case", "illustration", "sample"],
          antonyms: ["exception", "anomaly"],
          memoryTip: "Think of 'exam' + 'ple' - something you examine as a sample"
        }
      ];
      
      setVocabularyData(fallbackWords);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current word
  const getCurrentWord = () => {
    return vocabularyData[currentWordIndex] || null;
  };

  // Move to next word
  const nextWord = () => {
    if (currentWordIndex < vocabularyData.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setCurrentWordIndex(0); // Loop back to first word
    }
  };

  // Get random word
  const getRandomWord = () => {
    if (vocabularyData.length > 0) {
      const randomIndex = Math.floor(Math.random() * vocabularyData.length);
      setCurrentWordIndex(randomIndex);
    }
  };

  return {
    vocabularyData,
    loading,
    error,
    currentWord: getCurrentWord(),
    currentWordIndex,
    totalWords: vocabularyData.length,
    loadVocabulary,
    nextWord,
    getRandomWord
  };
};