
import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { sendMessageToGemini } from "@/lib/gemini-api";
import { toast } from "sonner";
import { Timer } from "lucide-react";

// Quiz Levels & Timer Durations
const LEVELS = [
  { label: "Beginner", value: "beginner", time: 120 },
  { label: "Intermediate", value: "intermediate", time: 180 },
  { label: "Advanced", value: "advanced", time: 300 },
];

type Level = "beginner" | "intermediate" | "advanced";

type QuizItem = {
  question: string;
  type: string;
};

type AnswerFeedback = {
  marks: number;
  maxMarks: number;
  mistakes: string[];
  grammaticalErrors: string[];
  improvementAreas: string[];
  focusSuggestions: string[];
  examples: string[];
  summary: string;
  feedback: string;
};

const skillDescriptions: Record<string, string> = {
  voice: "Active/Passive Voice",
  parts_of_speech: "Parts of Speech",
  tense_identification: "Identify Tense",
  tense_change: "Tense Change",
  paragraph: "Paragraph Analysis",
  letter: "Letter Writing",
  essay: "Essay Writing",
  creative: "Creative Grammar",
};

const instructionPrompt = (level: Level) => `
Generate a creative English grammar quiz for advanced ESL learners at the "${level}" level. Include 4 diverse, grammar-focused questions — DO NOT include spelling.
Possible question types (mix and match, do not repeat): 
- Active/passive voice transformation
- Identify sentence tense
- Convert a sentence to a requested tense
- Identify or highlight parts of speech (e.g.: adverb, conjunction, pronoun)
- Paragraph-based comprehension (ask a grammar question about a given paragraph)
- Letter or essay writing (give a prompt for a short letter or essay; topic can relate to school or daily life)
- Any innovative grammar-based question (no spelling!)

Format as a JSON array with each item having a "question" and a "type" field (example types: 'voice', 'parts_of_speech', 'tense_identification', 'tense_change', 'paragraph', 'letter', 'essay', 'creative'). DO NOT include answers.
[
  { "question": "...", "type": "..." },
  ...
]
`;

const feedbackPrompt = (quiz: QuizItem[], userAnswers: string[]) => `
Evaluate this student's English grammar quiz. Provide detailed marks and feedback as a JSON array. For each question include:
- "marks" (number): score for that answer out of maximum
- "maxMarks" (number): maximum score for this question
- "mistakes": array of specific mistakes (if any, else empty)
- "grammaticalErrors": array of grammar issues found (if any)
- "improvementAreas": what to improve for this skill
- "focusSuggestions": practice/focus advice (short)
- "examples": up to 2 sample correct answers (for open-ended Qs)
- "summary": 1-sentence review for this answer
- "feedback": short, encouraging comment

Below are the quiz questions and student answers:
${quiz.map((q, i) => `[Q${i + 1}] Type: ${q.type} | Q: ${q.question} | Student: "${userAnswers[i] || ""}"`).join('\n')}

Respond only with the JSON array [
  {...feedback for Q1...},
  {...feedback for Q2...},
  ...
]
`;

export default function QuickQuiz() {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [level, setLevel] = useState<Level | "">("");
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeUp, setTimeUp] = useState(false);

  // Start timer on quiz load
  useEffect(() => {
    if (quiz.length > 0 && level) {
      const selected = LEVELS.find(l => l.value === level);
      const duration = selected?.time ?? 120;
      setTimer(duration);
      setTimeLeft(duration);
      setTimeUp(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [quiz, level]);

  // Prevent user from changing answers after time is up
  const isFormDisabled = submitted || timeUp || loading;

  const generateQuiz = async () => {
    if (!level) {
      toast.error("Please select a level first.");
      return;
    }
    setLoading(true);
    setFeedback([]);
    setAnswers([]);
    setQuiz([]);
    setSubmitted(false);
    setTimeUp(false);
    try {
      toast("Generating your Quick Quiz...");
      const raw = await sendMessageToGemini(instructionPrompt(level as Level), "quiz");
      // Extract JSON from response, ignoring markdown code fences if present
      const json = JSON.parse(raw.match(/\[.*\]/s)?.[0] ?? "[]");
      // Remove any 'spelling' type (legacy, for safety)
      const filtered = json.filter((q: QuizItem) => q.type !== "spelling");
      setQuiz(filtered.slice(0, 4));
      setAnswers(Array(filtered.length).fill(""));
    } catch (e) {
      toast.error("Could not generate quiz. Try again.");
      setQuiz([]);
    }
    setLoading(false);
  };

  const submitQuiz = async () => {
    if (isFormDisabled) return;
    setLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      toast("Evaluating your answers in detail...");
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

  // Level selection screen
  if (!level) {
    return (
      <AppLayout>
        <div className="py-12 max-w-lg mx-auto text-center min-h-screen">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary mb-2">Quick Quiz: Grammar Challenge</CardTitle>
              <div className="text-muted-foreground">First, select your level to get questions tailored for you.</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 mt-4">
                {LEVELS.map(lv => (
                  <Button
                    key={lv.value}
                    onClick={() => setLevel(lv.value as Level)}
                    className="w-full"
                  >
                    {lv.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-8 max-w-2xl mx-auto min-h-screen">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Quick Quiz: {LEVELS.find(l => l.value === level)?.label}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Grammar challenge questions, tailored for your level.
            </div>
          </CardHeader>
          <CardContent>
            <Button disabled={loading} onClick={generateQuiz} className="mb-2">
              {loading ? "Loading Quiz..." : quiz.length > 0 ? "Try Another Quiz" : "Start Quiz"}
            </Button>
            <Button variant="ghost" className="ml-2" onClick={() => { setLevel(""); setQuiz([]); setAnswers([]); setFeedback([]); setSubmitted(false); }}>
              Change Level
            </Button>
          </CardContent>
        </Card>
        {/* Timer */}
        {(quiz.length > 0 && timer > 0) && (
          <div className="flex items-center justify-center mb-2 text-center">
            <Timer className="mr-1 text-primary" />
            <span className={`font-semibold ${timeLeft <= 10 ? "text-destructive" : "text-primary"} text-lg`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
            <span className="ml-2 text-muted-foreground text-xs">
              {timeUp ? "Time is up!" : "Time left"}
            </span>
          </div>
        )}
        {/* Quiz itself */}
        {quiz.length > 0 && (
          <form onSubmit={e => { e.preventDefault(); submitQuiz(); }}>
            {quiz.map((item, idx) => (
              <Card key={idx} className="mb-6">
                <CardHeader>
                  <CardTitle>
                    Q{idx + 1}.{" "}
                    <span className="text-primary">
                      {skillDescriptions[item.type] || item.type}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 font-medium">{item.question}</div>
                  <textarea
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary resize-y min-h-[48px]"
                    disabled={isFormDisabled}
                    value={answers[idx]}
                    onChange={e => {
                      const copy = [...answers];
                      copy[idx] = e.target.value;
                      setAnswers(copy);
                    }}
                    required
                  />
                  {/* After submit: show feedback */}
                  {submitted && feedback[idx] && (
                    <div className="mt-2 text-sm border-t pt-2 space-y-2">
                      <div>
                        <span className="font-bold text-xl text-primary">
                          {feedback[idx].marks}/{feedback[idx].maxMarks}
                        </span>
                        <span className="ml-2 font-medium text-muted-foreground">Score</span>
                      </div>
                      <div className="font-semibold text-green-700 dark:text-green-300">
                        Feedback: {feedback[idx].feedback}
                      </div>
                      {feedback[idx].mistakes?.length > 0 &&
                        <div className="text-red-600 dark:text-red-400">
                          Mistakes: {feedback[idx].mistakes.join(", ")}
                        </div>
                      }
                      {feedback[idx].grammaticalErrors?.length > 0 &&
                        <div className="text-orange-600 dark:text-orange-400">
                          Grammatical Errors: {feedback[idx].grammaticalErrors.join(", ")}
                        </div>
                      }
                      {feedback[idx].improvementAreas?.length > 0 &&
                        <div className="text-yellow-700 dark:text-yellow-300">
                          Areas to Improve: {feedback[idx].improvementAreas.join(", ")}
                        </div>
                      }
                      {feedback[idx].focusSuggestions?.length > 0 &&
                        <div className="text-blue-600 dark:text-blue-400">
                          Suggestions: {feedback[idx].focusSuggestions.join(", ")}
                        </div>
                      }
                      {feedback[idx].examples?.length > 0 &&
                        <div className="text-slate-600 dark:text-slate-400">
                          Model Answers: {feedback[idx].examples.join("; ")}
                        </div>
                      }
                      <div className="italic text-sm text-muted-foreground">Summary: {feedback[idx].summary}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {/* Buttons */}
            {!submitted && (
              <Button type="submit" className="w-full" disabled={loading || timeUp}>
                {timeUp ? "Time's Up!" : "Submit Answers"}
              </Button>
            )}
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
