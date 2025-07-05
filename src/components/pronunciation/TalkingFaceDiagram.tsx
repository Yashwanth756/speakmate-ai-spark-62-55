
import React, { useEffect, useState, useRef } from "react";
import { Volume2, Play, Pause, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TalkingFaceDiagramProps {
  word: string;
  isAnimating: boolean;
  phoneme?: string;
}

// Enhanced phoneme to mouth shape mapping with more accurate representations
const PHONEME_MOUTH_SHAPES = {
  // Vowels
  "A": { width: 70, height: 45, lipRound: 0.2, tonguePos: "low", teethShow: true },
  "E": { width: 50, height: 25, lipRound: 0.1, tonguePos: "mid", teethShow: true },
  "I": { width: 30, height: 15, lipRound: 0.1, tonguePos: "high", teethShow: true },
  "O": { width: 35, height: 40, lipRound: 0.9, tonguePos: "mid", teethShow: false },
  "U": { width: 25, height: 30, lipRound: 0.8, tonguePos: "high", teethShow: false },
  
  // Consonants - Stops
  "P": { width: 0, height: 0, lipRound: 0.3, tonguePos: "neutral", teethShow: false },
  "B": { width: 5, height: 5, lipRound: 0.3, tonguePos: "neutral", teethShow: false },
  "T": { width: 20, height: 8, lipRound: 0.1, tonguePos: "tip", teethShow: true },
  "D": { width: 25, height: 10, lipRound: 0.1, tonguePos: "tip", teethShow: true },
  "K": { width: 35, height: 20, lipRound: 0.2, tonguePos: "back", teethShow: false },
  "G": { width: 40, height: 25, lipRound: 0.2, tonguePos: "back", teethShow: false },
  
  // Fricatives
  "F": { width: 45, height: 12, lipRound: 0.1, tonguePos: "neutral", teethShow: true },
  "V": { width: 45, height: 15, lipRound: 0.1, tonguePos: "neutral", teethShow: true },
  "S": { width: 30, height: 8, lipRound: 0.1, tonguePos: "tip", teethShow: true },
  "Z": { width: 30, height: 10, lipRound: 0.1, tonguePos: "tip", teethShow: true },
  "TH": { width: 40, height: 15, lipRound: 0.1, tonguePos: "between", teethShow: true },
  
  // Nasals
  "M": { width: 0, height: 0, lipRound: 0.5, tonguePos: "neutral", teethShow: false },
  "N": { width: 25, height: 8, lipRound: 0.1, tonguePos: "tip", teethShow: false },
  
  // Liquids
  "L": { width: 35, height: 20, lipRound: 0.1, tonguePos: "tip", teethShow: false },
  "R": { width: 40, height: 25, lipRound: 0.3, tonguePos: "curl", teethShow: false },
  
  // Default
  "default": { width: 35, height: 20, lipRound: 0.3, tonguePos: "neutral", teethShow: false }
};

// Word to phoneme breakdown (simplified but more accurate)
const getWordPhonemes = (word: string): string[] => {
  const phonemeMap: Record<string, string[]> = {
    "hello": ["H", "E", "L", "O"],
    "elephant": ["E", "L", "E", "F", "A", "N", "T"],
    "beautiful": ["B", "U", "T", "I", "F", "U", "L"],
    "together": ["T", "O", "G", "E", "TH", "E", "R"],
    "congratulations": ["K", "O", "N", "G", "R", "A", "T", "U", "L", "A", "TH", "O", "N", "S"],
    "particularly": ["P", "A", "R", "T", "I", "K", "U", "L", "A", "R", "L", "I"]
  };
  
  return phonemeMap[word.toLowerCase()] || word.toUpperCase().split("");
};

export const TalkingFaceDiagram: React.FC<TalkingFaceDiagramProps> = ({
  word,
  isAnimating,
  phoneme
}) => {
  const [currentMouthShape, setCurrentMouthShape] = useState(PHONEME_MOUTH_SHAPES["default"]);
  const [currentPhoneme, setCurrentPhoneme] = useState("");
  const [animationSpeed, setAnimationSpeed] = useState(400);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [showTongue, setShowTongue] = useState(true);
  const [eyeExpression, setEyeExpression] = useState("normal");
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const wordPhonemes = getWordPhonemes(word);

  // Enhanced animation for word pronunciation
  useEffect(() => {
    if (!isAnimating || !word || wordPhonemes.length === 0) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    let phonemeIndex = 0;
    
    const animatePhonemes = () => {
      if (phonemeIndex >= wordPhonemes.length) {
        phonemeIndex = 0;
        setEyeExpression("blink");
        setTimeout(() => setEyeExpression("normal"), 150);
      }
      
      const currentP = wordPhonemes[phonemeIndex];
      setCurrentPhoneme(currentP);
      setCurrentPhonemeIndex(phonemeIndex);
      
      const shape = PHONEME_MOUTH_SHAPES[currentP as keyof typeof PHONEME_MOUTH_SHAPES] || 
                    PHONEME_MOUTH_SHAPES["default"];
      setCurrentMouthShape(shape);
      
      phonemeIndex++;
    };

    // Start animation
    animatePhonemes();
    animationRef.current = setInterval(animatePhonemes, animationSpeed);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      setIsPlaying(false);
    };
  }, [isAnimating, word, animationSpeed]);

  // Handle direct phoneme selection
  useEffect(() => {
    if (phoneme && !isAnimating) {
      setCurrentPhoneme(phoneme);
      const shape = PHONEME_MOUTH_SHAPES[phoneme as keyof typeof PHONEME_MOUTH_SHAPES] || 
                    PHONEME_MOUTH_SHAPES["default"];
      setCurrentMouthShape(shape);
      setEyeExpression("focused");
      setTimeout(() => setEyeExpression("normal"), 1000);
    }
  }, [phoneme, isAnimating]);

  // Get tongue position based on phoneme
  const getTonguePosition = () => {
    switch (currentMouthShape.tonguePos) {
      case "high": return { x: 100, y: 135, rotation: -10 };
      case "mid": return { x: 100, y: 140, rotation: 0 };
      case "low": return { x: 100, y: 150, rotation: 5 };
      case "tip": return { x: 95, y: 130, rotation: -15 };
      case "back": return { x: 105, y: 145, rotation: 10 };
      case "curl": return { x: 100, y: 135, rotation: -20 };
      case "between": return { x: 90, y: 125, rotation: -5 };
      default: return { x: 100, y: 142, rotation: 0 };
    }
  };

  const tonguePos = getTonguePosition();

  // Reset animation
  const resetAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    setCurrentPhonemeIndex(0);
    setCurrentPhoneme("");
    setCurrentMouthShape(PHONEME_MOUTH_SHAPES["default"]);
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
      
      {/* Enhanced Controls Header */}
      <div className="absolute top-3 left-3 right-3 z-10 space-y-2">
        <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-mono text-center backdrop-blur-sm flex items-center justify-between">
          <span>/{currentPhoneme || "ready"}/ - {currentMouthShape.tonguePos} tongue</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTongue(!showTongue)}
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-white/20"
            >
              {showTongue ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetAnimation}
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-white/20"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Animation Speed Control */}
        <div className="bg-white/90 dark:bg-gray-800/90 px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <span>Speed:</span>
            <Slider
              value={[600 - animationSpeed]}
              onValueChange={(value) => setAnimationSpeed(600 - value[0])}
              max={400}
              min={100}
              step={50}
              className="flex-1"
            />
            <span className="text-primary font-mono">{((600 - animationSpeed) / 100).toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Enhanced Face Area - Now takes full available space */}
      <div className="absolute inset-0 pt-20 pb-16 px-4 flex items-center justify-center">
        <div className={`w-full max-w-lg transition-all duration-300 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
          
          {/* Face Container with breathing effect - Made larger */}
          <div className={`bg-white/95 dark:bg-gray-800/95 rounded-full p-8 backdrop-blur-sm shadow-2xl border-4 border-primary/20 ${isPlaying ? 'animate-pulse' : ''}`}>
            
            {/* Enhanced Face SVG - Made larger */}
            <svg
              width="320"
              height="320"
              viewBox="0 0 200 200"
              className="w-full h-full"
            >
              {/* Face outline with subtle animation */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="#ffe0cc"
                stroke="#e0a580"
                strokeWidth="3"
                className={isPlaying ? "animate-pulse" : ""}
              />
              
              {/* Enhanced Eyes with expressions */}
              <g>
                {/* Left Eye */}
                <ellipse 
                  cx="70" 
                  cy="80" 
                  rx={eyeExpression === "blink" ? "12" : "12"} 
                  ry={eyeExpression === "blink" ? "2" : eyeExpression === "focused" ? "18" : "15"} 
                  fill="#333"
                  className="transition-all duration-150"
                />
                {/* Right Eye */}
                <ellipse 
                  cx="130" 
                  cy="80" 
                  rx={eyeExpression === "blink" ? "12" : "12"} 
                  ry={eyeExpression === "blink" ? "2" : eyeExpression === "focused" ? "18" : "15"} 
                  fill="#333"
                  className="transition-all duration-150"
                />
                
                {/* Eye highlights */}
                {eyeExpression !== "blink" && (
                  <>
                    <ellipse cx="75" cy="75" rx="4" ry="5" fill="#fff" />
                    <ellipse cx="135" cy="75" rx="4" ry="5" fill="#fff" />
                  </>
                )}
              </g>
              
              {/* Enhanced Eyebrows with emotion */}
              <g className={eyeExpression === "focused" ? "translate-y-1" : ""}>
                <path
                  d="M 55 65 Q 70 55 85 65"
                  stroke="#8b4513"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 115 65 Q 130 55 145 65"
                  stroke="#8b4513"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
              
              {/* Enhanced Nose */}
              <path
                d="M 100 90 L 95 110 L 100 115 L 105 110 Z"
                fill="#d4a574"
                stroke="#c09660"
                strokeWidth="1"
              />
              
              {/* Enhanced Dynamic Mouth */}
              <g>
                {/* Mouth shape based on current phoneme */}
                <ellipse
                  cx="100"
                  cy="140"
                  rx={currentMouthShape.width / 4}
                  ry={currentMouthShape.height / 2}
                  fill="#8b1538"
                  stroke="#d4888a"
                  strokeWidth="2"
                  className="transition-all duration-200"
                  transform={`rotate(${currentMouthShape.lipRound * 5} 100 140)`}
                />
                
                {/* Teeth - shown based on phoneme */}
                {currentMouthShape.teethShow && currentMouthShape.height > 15 && (
                  <rect 
                    x={100 - currentMouthShape.width / 8} 
                    y="132" 
                    width={currentMouthShape.width / 4} 
                    height="6" 
                    fill="#f8f8f8" 
                    rx="3"
                    className="transition-all duration-200"
                  />
                )}
                
                {/* Enhanced Tongue with realistic positioning */}
                {showTongue && currentMouthShape.height > 8 && (
                  <ellipse
                    cx={tonguePos.x}
                    cy={tonguePos.y}
                    rx={Math.max(8, currentMouthShape.width / 6)}
                    ry={Math.max(4, currentMouthShape.height / 4)}
                    fill="#ff9999"
                    className="transition-all duration-200"
                    transform={`rotate(${tonguePos.rotation} ${tonguePos.x} ${tonguePos.y})`}
                  />
                )}
                
                {/* Lip rounding effect */}
                {currentMouthShape.lipRound > 0.5 && (
                  <ellipse
                    cx="100"
                    cy="140"
                    rx={currentMouthShape.width / 3}
                    ry={currentMouthShape.height / 1.5}
                    fill="none"
                    stroke="#d4888a"
                    strokeWidth="3"
                    className="transition-all duration-200"
                  />
                )}
              </g>
              
              {/* Enhanced Cheeks with dynamic coloring */}
              <circle 
                cx="50" 
                cy="120" 
                r="15" 
                fill="#ffb3ba" 
                opacity={isPlaying ? "0.5" : "0.3"}
                className="transition-opacity duration-300"
              />
              <circle 
                cx="150" 
                cy="120" 
                r="15" 
                fill="#ffb3ba" 
                opacity={isPlaying ? "0.5" : "0.3"}
                className="transition-opacity duration-300"
              />
              
              {/* Sound waves when speaking */}
              {isPlaying && (
                <g>
                  <circle cx="160" cy="60" r="3" fill="#87ceeb" opacity="0.7">
                    <animate attributeName="r" values="3;12;3" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.1;0.7" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="175" cy="45" r="2" fill="#87ceeb" opacity="0.5">
                    <animate attributeName="r" values="2;8;2" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="185" cy="35" r="1" fill="#87ceeb" opacity="0.3">
                    <animate attributeName="r" values="1;6;1" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Status */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/80 text-white text-xs p-2 rounded-lg backdrop-blur-sm">
        <div className="text-center flex items-center justify-center">
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <>🗣️ <span className="font-semibold">Speaking {word}...</span></>
            ) : (
              <>💭 <span>Ready to practice</span></>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Status indicators */}
      <div className="absolute top-3 right-3 flex gap-1">
        <div className="bg-green-500/90 text-white px-2 py-1 rounded text-xs font-semibold">
          Enhanced
        </div>
        <div className="bg-purple-500/90 text-white px-2 py-1 rounded text-xs">
          AI Powered
        </div>
      </div>
    </div>
  );
};