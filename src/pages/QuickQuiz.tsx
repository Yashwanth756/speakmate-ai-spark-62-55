
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { sendMessageToGemini } from "@/lib/gemini-api";
import { toast } from "sonner";

type QuizItem = {
  question: string;
  type: string; // "spelling" | "voice" | "parts_of_speech" | "tense_change"
};

type AnswerFeedback = {
  feedback: string;
  mistakes: string[];
  suggestions: string[];
};

const skillDescriptions = {
  spelling: "Spelling",
  voice: "Active/Passive Voice",
  parts_of_speech: "Parts of Speech",
  tense_change: "Tense Change"
};

const instructionPrompt = `
Generate a short, creative English quiz for advanced ESL learners with 4 questions, each of a unique type:
1. Spelling Challenge: Provide a hard word (NO definition or example!).
2. Voice Change: Give a sentence to convert between active/passive voice.
3. Parts of Speech: Give a sentence and ask the student to identify a specific word (e.g., which word is a conjunction, pronoun, etc.).
4. Tense Change: Give a sentence and a requested new tense (e.g., turn this into future perfect continuous).

Format your response as a JSON array like:
[
  { "question": "...", "type": "spelling" },
  { "question": "...", "type": "voice" },
  { "question": "...", "type": "parts_of_speech" },
  { "question": "...", "type": "tense_change" }
]
DO NOT include the answers.
`;

const feedbackPrompt = (quiz: QuizItem[], userAnswers: string[]) => `
You are an expert English teacher evaluating a student's quiz. Here are the quiz questions and their answers:
${quiz.map((q, idx) => `[Q${idx + 1}][${q.type}]: ${q.question} | [Student Answer]: "${userAnswers[idx]}"`).join('\n')}

For each answer:
- Point out specific mistakes (if any) in a helpful, non-judgmental tone.
- Give correct or model answer if the student's is wrong.
- Suggest what skill to focus on further ("Practice identifying prepositions", etc).

Give a JSON array:
[
  {
    "feedback": "Clear summary and encouragement for this answer.",
    "mistakes": ["..."],
    "suggestions": ["..."]
  },
  ...
]
`;

export default function QuickQuiz() {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [feedback, setFeedback] = useState<AnswerFeedback[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    setFeedback([]);
    setAnswers(["", "", "", ""]);
    setQuiz([]);
    setSubmitted(false);
    try {
      toast("Generating your Quick Quiz...");
      const raw = await sendMessageToGemini(instructionPrompt, "quiz");
      const json = JSON.parse(raw.match(/\[.*\]/s)?.[0] ?? "[]");
      setQuiz(json.slice(0, 4));
    } catch (e) {
      toast.error("Could not generate quiz. Try again.");
      setQuiz([]);
    }
    setLoading(false);
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      toast("Evaluating your answers...");
      const raw = await sendMessageToGemini(feedbackPrompt(quiz, answers), "quiz-feedback");
      const json = JSON.parse(raw.match(/\[.*\]/s)?.[0] ?? "[]");
      setFeedback(json);
      setSubmitted(true);
    } catch {
      toast.error("Could not evaluate answers.");
      setFeedback([]);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="py-8 max-w-2xl mx-auto min-h-screen">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Quick Quiz</CardTitle>
            <div className="text-sm text-muted-foreground">Challenge yourself with unique, AI-powered questions each time.</div>
          </CardHeader>
          <CardContent>
            <Button disabled={loading} onClick={generateQuiz} className="mb-2">
              {loading ? "Loading Quiz..." : "Start a New Quiz"}
            </Button>
          </CardContent>
        </Card>
        {quiz.length > 0 && (
          <form onSubmit={e => { e.preventDefault(); submitQuiz(); }}>
            {quiz.map((item, idx) => (
              <Card key={idx} className="mb-6">
                <CardHeader>
                  <CardTitle>
                    Q{idx + 1}. <span className="text-primary">{skillDescriptions[item.type as keyof typeof skillDescriptions] || item.type}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 font-medium">{item.question}</div>
                  <input
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary"
                    disabled={submitted}
                    value={answers[idx]}
                    onChange={e => {
                      const copy = [...answers];
                      copy[idx] = e.target.value;
                      setAnswers(copy);
                    }}
                    required
                  />
                  {submitted && feedback[idx] && (
                    <div className="mt-2 text-sm border-t pt-2 space-y-2">
                      <div className="text-green-700 dark:text-green-300 font-semibold">Feedback: {feedback[idx].feedback}</div>
                      {feedback[idx].mistakes?.length > 0 &&
                        <div className="text-red-600 dark:text-red-400">Mistakes: {feedback[idx].mistakes.join(", ")}</div>
                      }
                      <div className="text-blue-600 dark:text-blue-400">Suggestions: {feedback[idx].suggestions.join(", ")}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!submitted && <Button type="submit" className="w-full" disabled={loading}>Submit Answers</Button>}
            {submitted && (
              <div className="flex flex-col items-center mt-4 space-y-2">
                <div className="font-bold text-xl text-primary">Quiz Complete!</div>
                <Button onClick={generateQuiz}>Try Another Quiz</Button>
              </div>
            )}
          </form>
        )}
      </div>
    </AppLayout>
  );
}
