
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle } from "lucide-react";

interface VocabularyArcadeProps {
  targetWords?: string[];
  onComplete?: (score: number) => void;
  isAssignment?: boolean;
}

const VocabularyArcade: React.FC<VocabularyArcadeProps> = ({
  targetWords = ["example", "puzzle", "word", "game"],
  onComplete,
  isAssignment = false
}) => {
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  const handleComplete = () => {
    if (onComplete) {
      onComplete(score);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="h-5 w-5" />
          Word Puzzle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Target Words:</h3>
            <div className="flex flex-wrap gap-2">
              {targetWords.map((word, index) => (
                <span 
                  key={index}
                  className="bg-purple-200 dark:bg-purple-800 px-3 py-1 rounded-full text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-4">Score: {score}</p>
            <p className="text-sm text-gray-600 mb-4">
              Word {currentWord + 1} of {targetWords.length}
            </p>
          </div>
          
          {isAssignment && (
            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Complete Assignment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabularyArcade;
