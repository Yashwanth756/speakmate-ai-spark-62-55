
export interface SessionData {
  mode: string;
  responses: ResponseData[];
  totalTime: number;
  streak: number;
  score: number;
  overallAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallGrade: string;
  };
}

export interface ResponseData {
  prompt: string;
  response: string;
  responseTime: number;
  accuracy: number;
  fluency: number;
  confidence: number;
  grammarErrors: GrammarError[];
  vocabularyScore: number;
  pronunciationScore: number;
  detailedFeedback: string;
}

export interface GrammarError {
  error: string;
  correction: string;
  explanation: string;
}
