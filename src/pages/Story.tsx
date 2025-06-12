
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoryDisplay } from "@/components/story/StoryDisplay";
import { useStory } from "@/hooks/use-story";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCcw, BookOpen, Sparkles } from "lucide-react";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const difficultyDescriptions = {
  beginner: "Simple vocabulary and short sentences perfect for new learners",
  intermediate: "Moderate complexity with varied sentence structures",
  advanced: "Complex vocabulary and sophisticated narrative elements"
};

const Story = () => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const { story, loading, error, generateStory } = useStory();
  const [progress, setProgress] = useState(0);

  // Generate a story when the component mounts or difficulty changes
  useEffect(() => {
    generateStory(difficulty);
  }, [difficulty, generateStory]);

  const handleGenerateNewStory = () => {
    generateStory(difficulty);
    toast.success("Generating a new story...");
    setProgress(0);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value as DifficultyLevel);
    setProgress(0);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 w-full">
        <AppSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Story Builder
                  </CardTitle>
                  <Sparkles className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Generate personalized stories to practice your reading and pronunciation
                </p>
              </CardHeader>
            </Card>

            {/* Controls Section */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  {/* Difficulty Selector */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="difficulty" className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      Choose Your Level
                    </Label>
                    <Select value={difficulty} onValueChange={handleDifficultyChange}>
                      <SelectTrigger id="difficulty" className="w-full sm:w-64 h-12 text-lg border-2 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner" className="text-lg py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Beginner
                          </div>
                        </SelectItem>
                        <SelectItem value="intermediate" className="text-lg py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Intermediate
                          </div>
                        </SelectItem>
                        <SelectItem value="advanced" className="text-lg py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Advanced
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {difficultyDescriptions[difficulty]}
                    </p>
                  </div>

                  {/* New Story Button */}
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      onClick={handleGenerateNewStory}
                      disabled={loading}
                      size="lg"
                      className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                          Creating Story...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          New Story
                        </>
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleGenerateNewStory}
                          disabled={loading}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <RefreshCcw className="h-4 w-4 mr-1" />
                          Regenerate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate another story at the same level</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Display Section */}
            <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 min-h-[400px]">
              <CardContent className="p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center space-y-6 py-16">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                        Crafting your story...
                      </div>
                      <div className="text-muted-foreground">
                        Our AI is creating a personalized {difficulty} level story just for you
                      </div>
                    </div>
                    <Progress value={45} className="w-80 h-2" />
                  </div>
                ) : error ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="text-xl text-destructive font-semibold">
                      Oops! Something went wrong
                    </div>
                    <p className="text-muted-foreground">
                      We couldn't generate your story. Please try again.
                    </p>
                    <Button onClick={handleGenerateNewStory} variant="outline" size="lg">
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <StoryDisplay 
                    story={story} 
                    onProgressUpdate={setProgress} 
                  />
                )}
              </CardContent>
            </Card>

            {/* Progress Section */}
            {!loading && !error && story && (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary"></div>
                        <div className="text-lg font-semibold">Reading Progress</div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {Math.round(progress)}% complete
                      </div>
                    </div>
                    <Progress value={progress} className="h-3 bg-white/50" />
                    {progress > 0 && progress < 100 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Keep reading! You're doing great! 🌟
                      </p>
                    )}
                    {progress === 100 && (
                      <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          🎉 Congratulations! You've completed the story!
                        </p>
                        <Button onClick={handleGenerateNewStory} variant="outline">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Try Another Story
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Story;
