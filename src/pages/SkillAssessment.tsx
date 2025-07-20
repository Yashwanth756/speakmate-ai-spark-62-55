import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Target, BookOpen, MessageCircle, Mic, Puzzle, Headphones, ClipboardList, FileText } from "lucide-react";
import { getLanguageFeedback } from "@/lib/gemini-api";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  itemsToSolve: number;
  route: string;
  completed: boolean;
}

const SkillAssessment = () => {
  const [skillInput, setSkillInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const availableModules = [
    { id: 'speaking', title: 'Speaking Practice', icon: Mic, route: '/speaking' },
    { id: 'conversation', title: 'Conversational AI', icon: MessageCircle, route: '/conversation' },
    { id: 'word-puzzle', title: 'Word Puzzles', icon: Puzzle, route: '/word-puzzle' },
    { id: 'pronunciation', title: 'Pronunciation Mirror', icon: Headphones, route: '/pronunciation' },
    { id: 'story', title: 'Story Builder', icon: BookOpen, route: '/story' },
    { id: 'vocabulary', title: 'Vocabulary Trainer', icon: Target, route: '/vocabulary' },
    { id: 'grammar', title: 'Grammar Clinic', icon: ClipboardList, route: '/grammar' },
    { id: 'progress', title: 'Progress Tracking', icon: FileText, route: '/progress' }
  ];

  const analyzeSkills = async () => {
    if (!skillInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what you want to improve in English.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const prompt = `
        Analyze this student's English learning goals and create a personalized roadmap:
        
        Student Input: "${skillInput}"
        
        Based on their input, create a roadmap with the following modules (select 4-6 most relevant):
        - Speaking Practice (speaking fluency, confidence)
        - Conversational AI (interactive conversations)
        - Word Puzzles (vocabulary games)
        - Pronunciation Mirror (pronunciation improvement)
        - Story Builder (reading comprehension, writing)
        - Vocabulary Trainer (word learning)
        - Grammar Clinic (grammar rules and exercises)
        - Progress Tracking (monitoring improvement)

        For each selected module, provide:
        1. Difficulty level (beginner/intermediate/advanced) based on their current level
        2. Number of items/exercises to complete (5-20 based on difficulty)
        3. Brief reason why this module is important for their goals

        Respond in this exact JSON format:
        {
          "roadmap": [
            {
              "moduleId": "speaking",
              "difficulty": "beginner",
              "itemsToSolve": 10,
              "reason": "explanation"
            }
          ],
          "overallLevel": "beginner"
        }
      `;

      const response = await getLanguageFeedback(prompt);
      
      // Parse the response to extract JSON
      let analysisData;
      try {
        const jsonMatch = response.feedback.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        // Fallback roadmap if parsing fails
        analysisData = {
          roadmap: [
            { moduleId: "vocabulary", difficulty: "beginner", itemsToSolve: 10, reason: "Build foundation words" },
            { moduleId: "pronunciation", difficulty: "beginner", itemsToSolve: 8, reason: "Improve speech clarity" },
            { moduleId: "conversation", difficulty: "intermediate", itemsToSolve: 5, reason: "Practice real conversations" },
            { moduleId: "grammar", difficulty: "beginner", itemsToSolve: 12, reason: "Learn basic grammar rules" }
          ],
          overallLevel: "beginner"
        };
      }

      // Create roadmap items
      const roadmapItems: RoadmapItem[] = analysisData.roadmap.map((item: any) => {
        const module = availableModules.find(m => m.id === item.moduleId);
        return {
          id: item.moduleId,
          title: module?.title || item.moduleId,
          description: item.reason,
          icon: module?.icon || Target,
          difficulty: item.difficulty,
          itemsToSolve: item.itemsToSolve,
          route: module?.route || '/',
          completed: false
        };
      });

      setRoadmap(roadmapItems);
      setShowRoadmap(true);

      // Store roadmap in localStorage
      localStorage.setItem('userRoadmap', JSON.stringify(roadmapItems));
      localStorage.setItem('skillAssessmentCompleted', 'true');

      toast({
        title: "Roadmap Created!",
        description: "Your personalized learning roadmap is ready.",
      });

    } catch (error) {
      console.error('Error analyzing skills:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze your input. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModuleClick = (item: RoadmapItem) => {
    // Store current module info for tracking
    localStorage.setItem('currentModule', JSON.stringify({
      id: item.id,
      title: item.title,
      itemsToSolve: item.itemsToSolve,
      difficulty: item.difficulty
    }));
    
    navigate(item.route);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'intermediate': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'advanced': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (showRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Learning Roadmap
            </h1>
            <p className="text-lg text-muted-foreground">
              Follow this personalized path to achieve your English learning goals
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roadmap.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card 
                  key={item.id} 
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => handleModuleClick(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                              {item.difficulty}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.itemsToSolve} items
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setShowRoadmap(false);
                setSkillInput("");
                setRoadmap([]);
              }}
              className="mr-4"
            >
              Create New Roadmap
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Start Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Let's Create Your Learning Path
          </CardTitle>
          <p className="text-muted-foreground">
            Tell us about your English learning goals and we'll create a personalized roadmap for you
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="skills" className="text-base font-medium">
              What would you like to improve in English?
            </Label>
            <Textarea
              id="skills"
              placeholder="For example: I want to improve my speaking confidence for job interviews, learn more vocabulary for business conversations, or practice pronunciation to sound more natural..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="min-h-32 border-2 focus:border-primary transition-colors resize-none"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your goals - the more details you provide, the better we can personalize your learning experience.
            </p>
          </div>

          <Button
            onClick={analyzeSkills}
            disabled={isAnalyzing || !skillInput.trim()}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing your goals...
              </div>
            ) : (
              "Create My Roadmap"
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillAssessment;