
import { useState, useCallback } from 'react';
import { sendMessageToGemini } from '@/lib/gemini-api';

export const useStory = () => {
  const [story, setStory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const generateStory = useCallback(async (difficulty: string) => {
    setLoading(true);
    setError(false);
    
    try {
      // Create a prompt for story generation based on difficulty level
      const prompt = `Generate an engaging English story for ${difficulty} level learners. 

Requirements:
- ${difficulty === 'beginner' ? '50-80 words with simple vocabulary and short sentences' : 
      difficulty === 'intermediate' ? '100-150 words with moderate vocabulary and varied sentence structures' : 
      '200-300 words with advanced vocabulary and complex sentence structures'}
- Make it interesting and educational
- Include dialogue if appropriate for the level
- Ensure proper grammar and punctuation
- The story should be suitable for pronunciation practice

Please provide only the story text, no additional formatting or explanations.`;

      const generatedStory = await sendMessageToGemini(prompt, "story-generation");
      
      // Clean up the response to ensure it's just the story
      const cleanStory = generatedStory.trim();
      
      if (cleanStory && cleanStory.length > 10) {
        setStory(cleanStory);
      } else {
        throw new Error("Generated story is too short or empty");
      }
    } catch (err) {
      console.error('Error generating story:', err);
      setError(true);
      
      // Fallback stories if Gemini fails
      const fallbackStories = {
        beginner: "Once upon a time, there was a little cat named Whiskers. The cat liked to play in the garden. It jumped and ran all day. Whiskers made friends with a butterfly. They played together in the sunny garden. The cat was very happy.",
        intermediate: "Sarah woke up early to catch the morning train. She had an important meeting at work and couldn't afford to be late. As she hurried down the stairs, she noticed that it was raining heavily outside. Unfortunately, she had forgotten her umbrella at the office the day before. She decided to run to the station anyway.",
        advanced: "The ancient manuscript contained peculiar symbols that had confounded scholars for decades. Professor Harrington believed he was finally on the verge of deciphering the mysterious text, which purportedly revealed the location of a long-lost civilization. His colleagues remained skeptical, citing insufficient evidence for his extraordinary claims about the document's authenticity and origins."
      };
      
      setStory(fallbackStories[difficulty as keyof typeof fallbackStories] || fallbackStories.beginner);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    story,
    loading,
    error,
    generateStory
  };
};