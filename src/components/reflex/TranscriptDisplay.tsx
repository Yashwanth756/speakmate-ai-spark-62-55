
import React from "react";

interface TranscriptDisplayProps {
  transcript: string;
  isRecording: boolean;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  isRecording
}) => {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-6 min-h-[120px] border border-blue-200 dark:border-blue-700">
      <p className="text-lg leading-relaxed">
        {transcript || "Start speaking to see your words appear here..."}
        {isRecording && <span className="animate-pulse text-blue-500">|</span>}
      </p>
      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span>Word count: {words.length}</span>
        <span>Characters: {transcript.length}</span>
      </div>
    </div>
  );
};
