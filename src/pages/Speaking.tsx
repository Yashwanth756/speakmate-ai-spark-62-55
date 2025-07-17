import React, { useRef, useState, useEffect } from "react";
import { Mic, CircleStop, ChartBar, LineChart, ArrowLeft, Settings, AlertTriangle, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, RadarChart as RChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { AlertCircle } from "lucide-react";
import { handleDailyData } from "@/data/progressData";
// Sample topics for the speaking practice select dropdown
const sampleTopics = [
  "Daily Life",
  "Travel",
  "Work and Career",
  "Food & Cooking",
  "Education",
  "Relationships",
  "Technology",
];

export default function Speaking() {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const apiKeys = [
  'AIzaSyBERkzxfo0L9qg8uWPt5YScDqmmIcvIkF4',
  "AIzaSyCc0ZYxEuoocwAZ5jKM8fWQEd0wz6sh4uI",
  'AIzaSyCRk2Yipn_lreY__-KFoCI0Uvi8XAQlVyM'
];

const [apiKeyIndex, setApiKeyIndex] = useState(0);

  
  // Use the enhanced speech recognition hook
  const {
    transcript: recognizedText,
    resetTranscript,
    startListening,
    stopListening,
    isListening,
    supported,
    lastError
  } = useSpeechRecognition();

  // Sync the recognized text with our component state - but maintain existing transcript
  useEffect(() => {
    if (recognizedText) {
      setTranscript(recognizedText);
    }
  }, [recognizedText]);

  // Display error messages from speech recognition
  useEffect(() => {
    if (lastError) {
      toast.error(`Speech recognition error: ${lastError}`, {
        duration: 3000,
      });
    }
  }, [lastError]);

  // Load the API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (!savedApiKey || savedApiKey.trim() === '') {
      toast.warning(
        "No API key found. Please set your Gemini API key in Settings",
        {
          action: {
            label: "Go to Settings",
            onClick: () => navigate('/settings')
          },
          duration: 10000,
        }
      );
    } else {
      setApiKey(savedApiKey);
    }
  }, [navigate]);

  // Start recording (audio + live transcript)
  const handleStart = async () => {
    // Don't reset transcript here - allow continuation
    if (!transcript) {
      setFeedback(null);
      setAudioUrl(null);
    }
    setRecording(true);

    // Start SpeechRecognition (will continue from existing transcript)
    if (supported) {
      startListening();
    } else {
      toast.error("Speech recognition not supported. Live transcription isn't available in your browser.");
    }

    // Start audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (err) {
      toast.error("Could not access microphone. Please allow microphone permission.");
      setRecording(false);
    }
  };

  // Stop recording (audio + live transcript)
  const handleStop = () => {
    setRecording(false);
    
    // Stop SpeechRecognition
    stopListening();
    
    // Stop audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Clear transcript function for manual reset
  const handleClearTranscript = () => {
    resetTranscript();
    setTranscript("");
  };

 const handleAnalyze = async () => {
  if (!transcript.trim()) {
    toast.error("No transcript available. Please record some speech first.");
    return;
  }

  if (!apiKeys.length) {
    toast.error("No Gemini API keys provided. Please add them in settings.", {
      action: {
        label: "Settings",
        onClick: () => navigate('/settings')
      }
    });
    return;
  }

  setLoading(true);

  let attempts = 0;
  let success = false;
  let lastErrorMessage = '';

  while (attempts < apiKeys.length && !success) {
    const currentKey = apiKeys[(apiKeyIndex + attempts) % apiKeys.length];

    try {
      const speechText = transcript;
      const prompt = [
  {
    parts: [{
      text: `
You are an expert English language coach with years of experience in teaching and providing detailed feedback. I am building a website to help users improve their English speaking skills using AI.

I will provide you with a transcript of what the user has spoken. Based on that transcript, give a detailed, structured, and VERY ACCURATE feedback report with these sections:

1. **Corrected Version**: Rewrite the user's speech with proper grammar, vocabulary, and sentence structure. Be meticulous about accuracy.

2. **Highlight Mistakes**: List each mistake, the correction, and explain the grammar/vocabulary rule behind it in simple but precise terms.

3. **Grammar, Vocabulary, Pronunciation, and Fluency Scores**:
   - Provide scores out of 100 for each category.
   - Categorize the score: 0-60 = Needs Improvement, 61-80 = Average, 81-100 = Good.
   - Explain why the score was given and what to improve with specific examples.

4. **Pronunciation Analysis**:
   - Identify any difficult or mispronounced words with high precision.
   - Give detailed phonetic tips and mouth movement advice.
   - Provide 2-3 similar words to practice with the same phonetic pattern.

5. **Fluency Feedback**:
   - Count exact number of filler words used ("um", "like", "uh").
   - Identify specific unnatural pauses or abrupt stops.
   - Suggest concrete techniques for smoother speech flow.

6. **Vocabulary Enhancement**:
   - Identify basic or overused words in the transcript.
   - Suggest 2-3 better alternatives with sample sentences showing proper usage.

7. **Communication Tips**:
   - Give 3 personalized tips to help the user improve based on their specific speech pattern.
   - Make these tips actionable and specific to their current level.

8. **Final Summary**:
   - Provide an overall score and label (Beginner, Intermediate, Advanced).
   - Give clear next steps and suggest if the user should retry or move to the next level.

Please make the feedback positive, constructive, educational, and HIGHLY ACCURATE. Format everything clearly so it can be easily displayed in a dashboard.

Transcript:
"${speechText}"

Respond as clean JSON ONLY, using keys:
{
  "corrected_version": "string",
  "mistakes": [{"mistake": "string", "correction": "string", "explanation": "string"}],
  "scores": {
    "grammar": {"score": number, "label": "string", "explanation": "string"},
    "vocabulary": {"score": number, "label": "string", "explanation": "string"},
    "pronunciation": {"score": number, "label": "string", "explanation": "string"},
    "fluency": {"score": number, "label": "string", "explanation": "string"}
  },
  "pronunciation_feedback": { "difficult_words": ["string"], "tips": "string", "example_words": ["string"] },
  "fluency_feedback": { "filler_words_count": number, "unnatural_pauses": "string", "suggestions": "string" },
  "vocabulary_enhancement": { "basic_words": ["string"], "alternatives": [{"word": "string", "alternatives": ["string"], "samples": ["string"]}] },
  "communication_tips": ["string"],
  "overall_summary": { "score": number, "level": "string", "recommendation": "string" }
}
      `
    }]
  }
];


      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: prompt }),
        }
      );

      if (apiRes.status === 429) {
        // Rate limit -> rotate to next key
        toast.warning(`API key ${attempts + 1} is rate-limited. Rotating...`);
        attempts++;
        continue;
      }

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        throw new Error(`API error (${apiRes.status}): ${errorText}`);
      }

      // Success
      const json = await apiRes.json();
      const text = (json?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();

      let feedbackObj = null;
      try {
        let cleanText = text;
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          feedbackObj = JSON.parse(jsonMatch[0]);
        } else {
          feedbackObj = JSON.parse(cleanText);
        }

        if (!feedbackObj.corrected_version || !feedbackObj.scores) {
          throw new Error("Invalid response format");
        }

      } catch (e) {
        toast.error("Could not parse the AI response. Please try again.");
        feedbackObj = { raw: text, parsing_error: true };
      }

      const currDay = {
        date: new Date().toISOString().split('T')[0],
        day: new Date().toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        speaking: feedbackObj.scores?.fluency?.score || 0,
        pronunciation: feedbackObj.scores?.pronunciation?.score || 0,
        vocabulary: feedbackObj.scores?.vocabulary?.score || 0,
        grammar: feedbackObj.scores?.grammar?.score || 0,
        story: 0,
        reflex: 0,
        totalTime: 0,
        sessionsCompleted: 0
      };

      await handleDailyData(currDay);

      setFeedback(feedbackObj);

      // Update index so we use this key next time
      setApiKeyIndex((apiKeyIndex + attempts) % apiKeys.length);
      success = true;

    } catch (err: any) {
      lastErrorMessage = err.message;
      console.error("Error:", err);
      attempts++;
    }
  }

  if (!success) {
    toast.error(`All API keys failed. Last error: ${lastErrorMessage}`);
  }

  setLoading(false);
};

  // Highlight errors in transcript: error words displayed with a tooltip
  function highlightErrors(original: string, highlighted_errors?: any[]) {
    if (!highlighted_errors?.length) return original;
    let highlighted = original;
    highlighted_errors.forEach((err) => {
      if (err.mistake) {
        // More precise replacement with word boundary check
        const regex = new RegExp(`\\b${err.mistake.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
        highlighted = highlighted.replace(
          regex,
          `<span class="text-red-600 font-semibold underline decoration-wavy decoration-red-500 cursor-pointer" title="${err.explanation || ""}">${err.mistake}</span>`
        );
      }
    });
    return highlighted;
  }

  // Helper: Render grammar explanations safely
  function renderGrammarExplanation(exp: any, i: number) {
    if (typeof exp === "string") {
      return <li key={i}>{exp}</li>;
    }
    if (typeof exp === "object" && exp !== null && ("rule" in exp || "explanation" in exp)) {
      // Render rule and explanation if present
      return (
        <li key={i}>
          {exp.rule && <span className="font-semibold">{exp.rule}: </span>}
          {exp.explanation || JSON.stringify(exp)}
        </li>
      );
    }
    // fallback
    return <li key={i}>{JSON.stringify(exp)}</li>;
  }

  // Helper: Render structured score with categorization
  function renderScoreSection(title: string, data?: any) {
    if (!data) return null;
    return (
      <div className="mb-2">
        <div className="font-semibold">{title}:</div>
        <div className="flex gap-2 items-center">
          <span className={
            data.score >= 81
              ? "text-green-600 font-bold"
              : data.score >= 61
              ? "text-yellow-700 font-bold"
              : "text-red-600 font-bold"
          }>
            {data.score ?? "-"} / 100 ("{data.label ?? ""}")
          </span>
        </div>
        {data.explanation && (
          <div className="text-sm text-muted-foreground mt-1">{data.explanation}</div>
        )}
      </div>
    );
  }

  // Helper: Safe list mapping
  function safeList(arr: undefined | null | any[], f: (x:any,i:number)=>React.ReactNode) {
    if (!Array.isArray(arr)) return null;
    return arr.map(f);
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl py-8 sm:py-12 w-full px-2">
        <Card className="mb-6 shadow-xl animate-fade-in rounded-2xl">
          <CardHeader>
            <h2 className="text-xl font-bold font-playfair text-primary">Speaking Practice</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Topic Select */}
            <div>
              <label className="font-semibold">Choose a topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select topic..." />
                </SelectTrigger>
                <SelectContent>
                  {sampleTopics.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Browser Support Warning */}
            {!supported && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">
                  Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for best experience.
                </span>
              </div>
            )}

            {/* Recorder */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleStart}
                disabled={recording || !supported}
                variant="default"
                className="flex gap-2"
                aria-label="Start Speaking"
              >
                <Mic className="w-5 h-5" />
                {recording ? "Recording..." : (supported ? "Continue Speaking" : "Not Supported")}
              </Button>
              <Button
                onClick={handleStop}
                disabled={!recording}
                variant="secondary"
                className="flex gap-2"
                aria-label="Stop Recording"
              >
                <CircleStop className="w-5 h-5" />
                Stop
              </Button>
              <Button
                onClick={handleClearTranscript}
                disabled={!transcript || recording}
                variant="outline"
                className="flex gap-2"
                aria-label="Clear Transcript"
              >
                <VolumeX className="w-5 h-5" />
                Clear
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!transcript || loading || !apiKey}
                variant="outline"
                className={`flex gap-2 ${loading ? "animate-pulse" : ""}`}
                aria-label="Analyze"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="ml-auto"
                title="Settings"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Recording Status Indicator */}
            {recording && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                <span>Recording... Speak clearly. Speech will continue even during pauses. (Auto-stops after 2min silence)</span>
              </div>
            )}

            {/* Transcript Display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Speech Transcript (Continuous)</label>
                {isListening && (
                  <span className="text-xs text-primary animate-pulse">Listening...</span>
                )}
              </div>
              <Textarea
                className="text-base min-h-[120px]"
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Transcript will build continuously as you speak, including during pauses..."
              />
              {transcript && (
                <div className="text-xs text-gray-500 mt-1">
                  Word count: {transcript.trim().split(/\s+/).length} words
                </div>
              )}
            </div>

            {/* Audio playback */}
            {audioUrl && (
              <div>
                <label className="text-sm font-medium block mb-1">Recorded Audio</label>
                <audio controls className="w-full">
                  <source src={audioUrl} />
                  Your browser does not support audio.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse text-primary flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-ping"></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-ping" style={{ animationDelay: "0.2s" }}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-ping" style={{ animationDelay: "0.4s" }}></div>
              <span className="ml-2">Analyzing your speech...</span>
            </div>
          </div>
        )}
        {feedback && (
          <div className="space-y-6">
            {/* Parsing error message */}
            {feedback.parsing_error && (
              <Card className="rounded-xl border border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Analysis Error</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-2">
                    There was an error processing the AI response. Please try again with a different speech sample.
                  </p>
                  <div className="text-xs text-red-500 overflow-auto max-h-[200px] p-2 bg-red-100 rounded">
                    <pre>{feedback.raw}</pre>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={handleAnalyze} className="text-red-600 border-red-200">
                    Try Again
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* 1. Corrected Version */}
            {feedback.corrected_version && (
              <Card className="rounded-xl border-0 bg-green-50 shadow">
                <CardHeader>
                  <span className="font-bold text-green-700">Corrected Version</span>
                </CardHeader>
                <CardContent>
                  <div className="font-mono">{feedback.corrected_version}</div>
                </CardContent>
              </Card>
            )}

            {/* 2. Highlight Mistakes */}
            {feedback.mistakes && feedback.mistakes.length > 0 && (
              <Card className="rounded-xl bg-amber-50 border border-amber-200 shadow">
                <CardHeader>
                  <span className="font-semibold text-amber-900">Highlight Mistakes</span>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc ml-4 space-y-2 text-sm">
                    {feedback.mistakes.map((m: any, idx: number) => (
                      <li key={idx}>
                        <b>Mistake:</b> <span className="text-red-600">{m.mistake}</span>
                        <br />
                        <b>Correction:</b> <span className="text-green-700">{m.correction}</span>
                        <br />
                        <b>Explanation:</b> <span>{m.explanation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 3. Scores */}
            {(feedback.scores?.grammar || feedback.scores?.vocabulary || feedback.scores?.pronunciation || feedback.scores?.fluency) && (
              <Card className="shadow rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary font-playfair">Score Breakdown</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderScoreSection("Grammar", feedback.scores.grammar)}
                    {renderScoreSection("Vocabulary", feedback.scores.vocabulary)}
                    {renderScoreSection("Pronunciation", feedback.scores.pronunciation)}
                    {renderScoreSection("Fluency", feedback.scores.fluency)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. Pronunciation Analysis */}
            {feedback.pronunciation_feedback && (
              <Card className="rounded-xl border-0 bg-blue-50">
                <CardHeader>
                  <span className="font-bold text-blue-700">Pronunciation Analysis</span>
                </CardHeader>
                <CardContent>
                  <div className="mb-1">
                    <b>Difficult or mispronounced words: </b>
                    <span>
                      {Array.isArray(feedback.pronunciation_feedback.difficult_words) ? (
                        feedback.pronunciation_feedback.difficult_words.map((w: string, i: number) => (
                          <span key={i} className="mr-2">{w}</span>
                        ))
                      ) : (
                        "None"
                      )}
                    </span>
                  </div>
                  <div className="mb-1">
                    <b>Phonetic tips & mouth advice:</b>{" "}
                    <span>{typeof feedback.pronunciation_feedback.tips === 'string' ? feedback.pronunciation_feedback.tips : ''}</span>
                  </div>
                  <div>
                    <b>Try practicing: </b>
                    <span>
                      {Array.isArray(feedback.pronunciation_feedback.example_words) ? (
                        feedback.pronunciation_feedback.example_words.map((w: string, i: number) => (
                          <span key={i} className="mr-2">{w}</span>
                        ))
                      ) : null}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. Fluency Feedback */}
            {feedback.fluency_feedback && (
              <Card className="rounded-xl bg-purple-50 border-0">
                <CardHeader>
                  <span className="font-bold text-purple-700">Fluency Feedback</span>
                </CardHeader>
                <CardContent>
                  <div>
                    <b>Filler words used:</b> {typeof feedback.fluency_feedback.filler_words_count === 'number' ? feedback.fluency_feedback.filler_words_count : 0}
                  </div>
                  <div>
                    <b>Unnatural pauses:</b> {typeof feedback.fluency_feedback.unnatural_pauses === 'string' ? feedback.fluency_feedback.unnatural_pauses : "None"}
                  </div>
                  <div>
                    <b>Suggestions for smoother speech:</b> {typeof feedback.fluency_feedback.suggestions === 'string' ? feedback.fluency_feedback.suggestions : ''}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 6. Vocabulary Enhancement */}
            {feedback.vocabulary_enhancement && (
              <Card className="rounded-xl bg-yellow-50 border-0">
                <CardHeader>
                  <span className="font-bold text-yellow-700">Vocabulary Enhancement</span>
                </CardHeader>
                <CardContent>
                  <div>
                    <b>Basic/overused words:</b> {Array.isArray(feedback.vocabulary_enhancement.basic_words) ? (
                      feedback.vocabulary_enhancement.basic_words.map((w: string, i: number) => (
                        <span key={i} className="mr-2">{w}</span>
                      ))
                    ) : null}
                  </div>
                  {Array.isArray(feedback.vocabulary_enhancement.alternatives) && feedback.vocabulary_enhancement.alternatives.length > 0 ? (
                    <div className="mt-2">
                      <b>Better alternatives & samples:</b>
                      <ul className="list-disc ml-4">
                        {feedback.vocabulary_enhancement.alternatives.map((alt: any, i: number) => (
                          <li key={i}>
                            <b>{alt.word}:</b> {Array.isArray(alt.alternatives) ? alt.alternatives.join(", ") : ''}
                            {Array.isArray(alt.samples) && (
                              <>
                                <br /><span className="text-xs text-muted-foreground">{alt.samples.join(" – ")}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* 7. Communication Tips */}
            {feedback.communication_tips && (
              <Card className="rounded-xl bg-primary/10 border-0">
                <CardHeader>
                  <span className="font-semibold text-primary">Communication Tips</span>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc ml-6 text-gray-700">
                    {Array.isArray(feedback.communication_tips) ? (
                      feedback.communication_tips.map((s: string, i: number) => <li key={i}>{s}</li>)
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 8. Final Summary */}
            {feedback.overall_summary && (
              <Card className="rounded-xl bg-green-50 border-0">
                <CardHeader>
                  <span className="font-bold text-green-700">Final Summary</span>
                </CardHeader>
                <CardContent>
                  <div>
                    <b>Overall Score:</b> <span className="text-green-700 font-bold">
                      {typeof feedback.overall_summary.score === 'number' ? feedback.overall_summary.score : ''} 
                      {typeof feedback.overall_summary.level === 'string' ? `(${feedback.overall_summary.level})` : ''}
                    </span>
                  </div>
                  <div>
                    <b>Recommendation:</b> {typeof feedback.overall_summary.recommendation === 'string' ? feedback.overall_summary.recommendation : ''}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback Raw response (in case JSON failed) */}
            {feedback.raw && !feedback.parsing_error && (
              <Card className="rounded-xl">
                <CardHeader>Gemini Response</CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap">{feedback.raw}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* No API key warning */}
      {!apiKey && (
        <Card className="mt-4 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="text-yellow-800">
              Please add your Gemini API key in the Settings page to use the analysis feature.
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/settings')} 
              className="mt-2 border-yellow-500 text-yellow-700 hover:bg-yellow-100"
            >
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
