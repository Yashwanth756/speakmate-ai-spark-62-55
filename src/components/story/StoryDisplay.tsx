
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface StoryDisplayProps {
  assignmentPrompt?: string;
  onComplete?: () => void;
  isAssignment?: boolean;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({
  assignmentPrompt = "Write a creative story",
  onComplete,
  isAssignment = false
}) => {
  const [story, setStory] = useState('');

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Story Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Your Prompt:</h3>
            <p>{assignmentPrompt}</p>
          </div>
          
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Start writing your story here..."
            className="w-full h-64 p-4 border rounded-lg resize-none"
          />
          
          {isAssignment && (
            <Button 
              onClick={handleComplete}
              disabled={story.trim().length < 50}
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
