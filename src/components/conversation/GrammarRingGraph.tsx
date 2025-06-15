
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GrammarRingGraphProps {
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  userSentence?: string;
  correctedSentence?: string;
}

const GrammarRingGraph: React.FC<GrammarRingGraphProps> = ({
  fluencyScore,
  vocabularyScore,
  grammarScore
}) => {
  // Round scores to whole numbers
  const roundedFluency = Math.round(fluencyScore);
  const roundedVocabulary = Math.round(vocabularyScore);
  const roundedGrammar = Math.round(grammarScore);
  
  // Calculate the average score (rounded to a whole number)
  const averageScore = Math.round((roundedFluency + roundedVocabulary + roundedGrammar) / 3);
  
  // Calculate the circle stroke properties based on score
  const radius = 70;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * averageScore) / 100;
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const scoreColorClass = getScoreColor(averageScore);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative flex flex-col items-center">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted"
              />
              
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                className={scoreColorClass}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${scoreColorClass}`}>{averageScore}%</span>
              <span className="text-sm text-muted-foreground">Overall Score</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8 w-full max-w-md">
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium">Fluency</span>
              <span className={`text-xl font-bold ${getScoreColor(roundedFluency)}`}>
                {roundedFluency}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium">Vocabulary</span>
              <span className={`text-xl font-bold ${getScoreColor(roundedVocabulary)}`}>
                {roundedVocabulary}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium">Grammar</span>
              <span className={`text-xl font-bold ${getScoreColor(roundedGrammar)}`}>
                {roundedGrammar}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrammarRingGraph;
