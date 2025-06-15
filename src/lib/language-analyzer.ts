
// Advanced language analysis utility using available libraries
export interface LanguageAnalysis {
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  overallScore: number;
  feedback: string;
  detailedAnalysis: {
    wordCount: number;
    sentenceComplexity: number;
    vocabularyLevel: string;
    grammarErrors: string[];
    fluencyMarkers: string[];
  };
}

// Basic text analysis functions
export const analyzeTextComplexity = (text: string) => {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordsPerSentence,
    complexityScore: Math.min(100, avgWordsPerSentence * 10)
  };
};

export const analyzeVocabularyLevel = (text: string) => {
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const uniqueWords = new Set(words);
  const vocabularyDiversity = uniqueWords.size / Math.max(words.length, 1);
  
  // Advanced vocabulary indicators
  const advancedWords = words.filter(word => word.length > 6);
  const advancedWordRatio = advancedWords.length / Math.max(words.length, 1);
  
  // Common words that indicate lower proficiency
  const basicWords = ['good', 'bad', 'nice', 'big', 'small', 'very', 'really'];
  const basicWordCount = words.filter(word => basicWords.includes(word)).length;
  const basicWordRatio = basicWordCount / Math.max(words.length, 1);
  
  const vocabularyScore = Math.min(100, 
    (vocabularyDiversity * 50) + 
    (advancedWordRatio * 30) + 
    (Math.max(0, 1 - basicWordRatio) * 20)
  );
  
  return {
    vocabularyDiversity,
    advancedWordRatio,
    basicWordRatio,
    vocabularyScore: Math.round(vocabularyScore * 100)
  };
};

export const analyzeGrammarPatterns = (text: string) => {
  const errors: string[] = [];
  let grammarScore = 100;
  
  // Basic grammar checks
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    
    // Check capitalization
    if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase()) {
      errors.push("Sentence should start with capital letter");
      grammarScore -= 5;
    }
    
    // Check for common errors
    if (trimmed.toLowerCase().includes(' i ') && !trimmed.includes(' I ')) {
      errors.push("'I' should be capitalized");
      grammarScore -= 3;
    }
    
    // Check for double spaces
    if (trimmed.includes('  ')) {
      errors.push("Multiple spaces found");
      grammarScore -= 2;
    }
    
    // Check for basic subject-verb agreement patterns
    const words = trimmed.toLowerCase().split(/\s+/);
    if (words.includes('he') || words.includes('she') || words.includes('it')) {
      const verbIndex = words.findIndex(w => ['go', 'have', 'do', 'say'].includes(w));
      if (verbIndex > -1) {
        errors.push("Possible subject-verb agreement error");
        grammarScore -= 8;
      }
    }
  });
  
  return {
    errors,
    grammarScore: Math.max(0, Math.min(100, grammarScore))
  };
};

export const analyzeFluency = (text: string) => {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Fluency indicators
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const hasConnectors = /\b(and|but|however|therefore|moreover|furthermore|additionally)\b/i.test(text);
  const hasVariedVocabulary = new Set(words.map(w => w.toLowerCase())).size / Math.max(words.length, 1) > 0.7;
  
  // Penalize very short responses
  const lengthPenalty = words.length < 5 ? 20 : 0;
  
  let fluencyScore = 70; // Base score
  
  // Adjust based on sentence structure
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 15) fluencyScore += 15;
  if (hasConnectors) fluencyScore += 10;
  if (hasVariedVocabulary) fluencyScore += 10;
  
  fluencyScore -= lengthPenalty;
  
  return {
    avgWordsPerSentence,
    hasConnectors,
    hasVariedVocabulary,
    fluencyScore: Math.max(0, Math.min(100, fluencyScore))
  };
};

export const generateComprehensiveAnalysis = (text: string): LanguageAnalysis => {
  if (!text || text.trim().length === 0) {
    return {
      fluencyScore: 0,
      vocabularyScore: 0,
      grammarScore: 0,
      overallScore: 0,
      feedback: "No text to analyze",
      detailedAnalysis: {
        wordCount: 0,
        sentenceComplexity: 0,
        vocabularyLevel: "Unknown",
        grammarErrors: [],
        fluencyMarkers: []
      }
    };
  }
  
  const complexity = analyzeTextComplexity(text);
  const vocabulary = analyzeVocabularyLevel(text);
  const grammar = analyzeGrammarPatterns(text);
  const fluency = analyzeFluency(text);
  
  const fluencyScore = fluency.fluencyScore;
  const vocabularyScore = vocabulary.vocabularyScore;
  const grammarScore = grammar.grammarScore;
  const overallScore = Math.round((fluencyScore + vocabularyScore + grammarScore) / 3);
  
  // Determine vocabulary level
  let vocabularyLevel = "Beginner";
  if (vocabularyScore >= 80) vocabularyLevel = "Advanced";
  else if (vocabularyScore >= 60) vocabularyLevel = "Intermediate";
  
  // Generate fluency markers
  const fluencyMarkers = [];
  if (fluency.hasConnectors) fluencyMarkers.push("Good use of connectors");
  if (fluency.hasVariedVocabulary) fluencyMarkers.push("Varied vocabulary");
  if (fluency.avgWordsPerSentence >= 8) fluencyMarkers.push("Well-structured sentences");
  
  return {
    fluencyScore,
    vocabularyScore,
    grammarScore,
    overallScore,
    feedback: generateContextualFeedback(overallScore),
    detailedAnalysis: {
      wordCount: complexity.wordCount,
      sentenceComplexity: complexity.complexityScore,
      vocabularyLevel,
      grammarErrors: grammar.errors,
      fluencyMarkers
    }
  };
};

const generateContextualFeedback = (overallScore: number): string => {
  if (overallScore >= 90) return "Excellent! Your English is very natural and fluent.";
  if (overallScore >= 80) return "Great job! Your English is clear and well-structured.";
  if (overallScore >= 70) return "Good work! Keep practicing to improve further.";
  if (overallScore >= 60) return "Nice effort! Focus on expanding your vocabulary.";
  if (overallScore >= 50) return "Keep practicing! Pay attention to grammar and sentence structure.";
  return "Don't give up! Regular practice will help you improve significantly.";
};
