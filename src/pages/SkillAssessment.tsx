import React, { useState, useEffect } from "react";
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

  // Check for existing roadmap on component mount
  useEffect(() => {
    const existingRoadmap = localStorage.getItem('userRoadmap');
    const assessmentCompleted = localStorage.getItem('skillAssessmentCompleted');
    
    if (existingRoadmap && assessmentCompleted === 'true') {
      try {
        const parsedRoadmap = JSON.parse(existingRoadmap);
        setRoadmap(parsedRoadmap);
        setShowRoadmap(true);
      } catch (error) {
        console.error('Error parsing existing roadmap:', error);
      }
    }
  }, []);

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
    
    // Store flag to show back button in modules
    localStorage.setItem('showRoadmapBackButton', 'true');
    
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
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Learning Journey
            </h1>
            <p className="text-lg text-muted-foreground">
              Follow this personalized sequence to achieve your English learning goals
            </p>
          </div>

          {/* Sequential Roadmap */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 md:left-1/2 top-24 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-muted-foreground/30 md:transform md:-translate-x-1/2 z-0"></div>
            
            <div className="space-y-8">
              {roadmap.map((item, index) => {
                const IconComponent = item.icon;
                const isLeft = index % 2 === 0;
                
                return (
                  <div key={item.id} className={`flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} relative z-10`}>
                    {/* Step Number Circle */}
                    <div className="absolute left-4 md:left-1/2 md:transform md:-translate-x-1/2 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-20">
                      {index + 1}
                    </div>
                    
                    {/* Card */}
                    <Card 
                      className={`ml-24 md:ml-0 ${isLeft ? 'md:mr-32' : 'md:ml-32'} w-full md:w-80 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 hover:scale-105`}
                      onClick={() => handleModuleClick(item)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                                {item.difficulty}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {item.itemsToSolve} exercises
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-primary font-medium">Click to start →</span>
                          <div className="w-8 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center pt-8">
            <Button
              variant="outline"
              onClick={() => {
                setShowRoadmap(false);
                setSkillInput("");
                setRoadmap([]);
                localStorage.removeItem('userRoadmap');
                localStorage.removeItem('skillAssessmentCompleted');
              }}
              className="mr-4"
            >
              Create New Roadmap
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Go to Dashboard
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