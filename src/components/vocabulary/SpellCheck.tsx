import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Book } from "lucide-react";

interface SpellCheckProps {
  word: {
    word: string;
    meaning: string;
    partOfSpeech: string;
    example: string;
  };
  onCorrect: () => void;
  onNext: () => void;
}

export const SpellCheck: React.FC<SpellCheckProps> = ({ word, onCorrect, onNext }) => {
  const [userInput, setUserInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  useEffect(() => {
    // Reset state when word changes
    setUserInput('');
    setAttempts(0);
    setFeedback('');
    setShowHint(false);
    setIsCorrect(false);
  }, [word]);
  
  const checkSpelling = () => {
    if (userInput.toLowerCase().trim() === word.word.toLowerCase()) {
      setFeedback('Correct! Well done.');
      setIsCorrect(true);
      setTimeout(() => {
        onCorrect();
      }, 1500);
    } else {
      setAttempts(attempts + 1);
      
      // Check how close the spelling is using a simple algorithm
      // In a real app, we'd use Levenshtein distance or similar
      const similarity = getSimilarity(userInput.toLowerCase(), word.word.toLowerCase());
      
      if (similarity > 0.7) {
        setFeedback('Close! Try again.');
      } else {
        setFeedback('Not quite right. Try again.');
      }
      
      if (attempts >= 2 && !showHint) {
        setShowHint(true);
      }
    }
  };
  
  // Simple similarity function - in a real app, use a proper algorithm
  const getSimilarity = (a: string, b: string): number => {
    let matches = 0;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) {
        matches++;
      }
    }
    
    return matches / longer.length;
  };
  
  // Generate a hint that reveals some letters of the word
  const generateHint = (): string => {
    return word.word.split('').map((letter, index) => {
      // Show first letter, every third letter, and last letter
      if (index === 0 || index % 3 === 0 || index === word.word.length - 1) {
        return letter;
      }
      return '_ ';
    }).join('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCorrect) {
      checkSpelling();
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center">
          <Book className="mr-2 text-primary" />
          <h2 className="text-xl font-semibold">Spelling Challenge</h2>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Definition:</h3>
            <p className="bg-gray-50 p-3 rounded-md">{word.meaning}</p>
            
            <div className="mt-2">
              <span className="text-sm text-gray-500">Part of Speech: </span>
              <span className="text-sm font-medium">{word.partOfSpeech}</span>
            </div>
          </div>
          
          {showHint && (
            <div className="bg-badge/30 p-3 rounded-md">
              <p className="text-sm font-medium text-primary mb-1">Hint:</p>
              <p className="font-mono text-lg tracking-wider">{generateHint()}</p>
            </div>
          )}
          
          <div className="pt-2">
            <label className="block text-sm font-medium mb-1">
              Spell the word:
            </label>
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type the word here"
                disabled={isCorrect}
                className="flex-1"
              />
              <Button 
                onClick={checkSpelling} 
                disabled={!userInput || isCorrect}
              >
                Check
              </Button>
            </div>
            
            {feedback && (
              <div className={`mt-2 p-2 rounded-md ${
                isCorrect 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {feedback}
              </div>
            )}
            
            {attempts >= 2 && !showHint && (
              <Button 
                variant="ghost" 
                className="text-xs mt-2" 
                onClick={() => setShowHint(true)}
              >
                Show Hint
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gray-50 border-t">
        <Button variant="outline" onClick={onNext}>
          Skip to Next Word
        </Button>
        
        {attempts >= 3 && !isCorrect && (
          <Button 
            variant="outline" 
            className="text-red-500" 
            onClick={() => {
              setFeedback(`The correct spelling is "${word.word}"`);
              setIsCorrect(true);
              setTimeout(() => {
                onNext();
              }, 2000);
            }}
          >
            Reveal Answer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
