
import React, { useEffect, useState, useRef } from "react";

interface LipSyncMouthProps {
  word: string;
  isAnimating: boolean;
  phoneme?: string;
}

// Enhanced phoneme shapes with detailed mouth positions
const PHONEME_SHAPES = {
  // Vowels - mouth opening and tongue positions
  "A": { 
    mouthWidth: 45, mouthHeight: 35, 
    tongueY: 25, tongueWidth: 30, 
    upperLipY: 15, lowerLipY: 50,
    jawY: 45, teethGap: 25,
    description: "Wide open mouth, tongue low and flat"
  },
  "E": { 
    mouthWidth: 35, mouthHeight: 20, 
    tongueY: 20, tongueWidth: 28, 
    upperLipY: 20, lowerLipY: 40,
    jawY: 35, teethGap: 15,
    description: "Medium opening, tongue slightly raised"
  },
  "I": { 
    mouthWidth: 25, mouthHeight: 12, 
    tongueY: 15, tongueWidth: 25, 
    upperLipY: 24, lowerLipY: 36,
    jawY: 32, teethGap: 8,
    description: "Small opening, tongue high and forward"
  },
  "O": { 
    mouthWidth: 20, mouthHeight: 25, 
    tongueY: 30, tongueWidth: 20, 
    upperLipY: 18, lowerLipY: 43,
    jawY: 40, teethGap: 20,
    description: "Round lips, tongue low and back"
  },
  "U": { 
    mouthWidth: 15, mouthHeight: 20, 
    tongueY: 28, tongueWidth: 18, 
    upperLipY: 20, lowerLipY: 40,
    jawY: 38, teethGap: 15,
    description: "Pursed lips, tongue relaxed back"
  },
  
  // Consonants with specific mouth positions
  "F": { 
    mouthWidth: 30, mouthHeight: 8, 
    tongueY: 35, tongueWidth: 25, 
    upperLipY: 26, lowerLipY: 34,
    jawY: 32, teethGap: 3,
    description: "Lower lip touches upper teeth"
  },
  "V": { 
    mouthWidth: 30, mouthHeight: 8, 
    tongueY: 35, tongueWidth: 25, 
    upperLipY: 26, lowerLipY: 34,
    jawY: 32, teethGap: 3,
    description: "Lower lip touches upper teeth, voice on"
  },
  "P": { 
    mouthWidth: 0, mouthHeight: 0, 
    tongueY: 30, tongueWidth: 25, 
    upperLipY: 30, lowerLipY: 30,
    jawY: 30, teethGap: 0,
    description: "Lips completely closed, then pop open"
  },
  "B": { 
    mouthWidth: 0, mouthHeight: 0, 
    tongueY: 30, tongueWidth: 25, 
    upperLipY: 30, lowerLipY: 30,
    jawY: 30, teethGap: 0,
    description: "Lips closed, voice while opening"
  },
  "M": { 
    mouthWidth: 0, mouthHeight: 0, 
    tongueY: 30, tongueWidth: 25, 
    upperLipY: 30, lowerLipY: 30,
    jawY: 30, teethGap: 0,
    description: "Lips closed, sound through nose"
  },
  "TH": { 
    mouthWidth: 35, mouthHeight: 15, 
    tongueY: 22, tongueWidth: 30, 
    upperLipY: 22, lowerLipY: 37,
    jawY: 35, teethGap: 10,
    description: "Tongue tip between teeth"
  },
  "L": { 
    mouthWidth: 30, mouthHeight: 18, 
    tongueY: 18, tongueWidth: 25, 
    upperLipY: 21, lowerLipY: 39,
    jawY: 36, teethGap: 12,
    description: "Tongue tip touches roof behind teeth"
  },
  "S": { 
    mouthWidth: 25, mouthHeight: 8, 
    tongueY: 25, tongueWidth: 28, 
    upperLipY: 26, lowerLipY: 34,
    jawY: 32, teethGap: 4,
    description: "Teeth close, air hisses through"
  },
  "R": { 
    mouthWidth: 28, mouthHeight: 15, 
    tongueY: 20, tongueWidth: 22, 
    upperLipY: 22, lowerLipY: 37,
    jawY: 35, teethGap: 10,
    description: "Tongue curved back, not touching roof"
  },
  "default": { 
    mouthWidth: 25, mouthHeight: 10, 
    tongueY: 30, tongueWidth: 25, 
    upperLipY: 25, lowerLipY: 35,
    jawY: 32, teethGap: 5,
    description: "Relaxed mouth position"
  }
};

// SVG Mouth Component with smooth animations
const AnimatedMouth: React.FC<{
  shape: any;
  isAnimating: boolean;
}> = ({ shape, isAnimating }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30 rounded-2xl border border-pink-200 dark:border-pink-800">
      <svg
        width="200"
        height="150"
        viewBox="0 0 200 150"
        className="max-w-full max-h-full"
      >
        {/* Face outline */}
        <ellipse
          cx="100"
          cy="75"
          rx="85"
          ry="65"
          fill="#ffe0d0"
          stroke="#e0b8a0"
          strokeWidth="2"
          className="transition-all duration-500"
        />
        
        {/* Mouth cavity (dark inside) */}
        <ellipse
          cx="100"
          cy={70 + shape.jawY * 0.2}
          rx={shape.mouthWidth * 0.8}
          ry={shape.mouthHeight * 0.6}
          fill="#8b2635"
          className="transition-all duration-700 ease-out"
        />
        
        {/* Upper teeth */}
        <rect
          x={100 - shape.mouthWidth * 0.7}
          y={shape.upperLipY + 50}
          width={shape.mouthWidth * 1.4}
          height="6"
          fill="#f8f8f8"
          rx="3"
          className="transition-all duration-500"
          style={{
            opacity: shape.teethGap > 5 ? 1 : 0
          }}
        />
        
        {/* Lower teeth */}
        <rect
          x={100 - shape.mouthWidth * 0.7}
          y={shape.lowerLipY + 50}
          width={shape.mouthWidth * 1.4}
          height="6"
          fill="#f0f0f0"
          rx="3"
          className="transition-all duration-500"
          style={{
            opacity: shape.teethGap > 5 ? 1 : 0
          }}
        />
        
        {/* Tongue */}
        <ellipse
          cx="100"
          cy={shape.tongueY + 55}
          rx={shape.tongueWidth * 0.8}
          ry="12"
          fill="#ff9999"
          stroke="#e67777"
          strokeWidth="1"
          className="transition-all duration-600 ease-out"
          style={{
            opacity: shape.tongueY < 25 ? 1 : 0.3
          }}
        />
        
        {/* Upper lip */}
        <ellipse
          cx="100"
          cy={shape.upperLipY + 50}
          rx={shape.mouthWidth}
          ry="8"
          fill="#d4888a"
          className="transition-all duration-700 ease-out"
        />
        
        {/* Lower lip */}
        <ellipse
          cx="100"
          cy={shape.lowerLipY + 50}
          rx={shape.mouthWidth}
          ry="10"
          fill="#cc7779"
          className="transition-all duration-700 ease-out"
        />
        
        {/* Animation indicators */}
        {isAnimating && (
          <>
            {/* Breath indicator for sounds like 'F', 'S' */}
            {(shape.description.includes("air") || shape.description.includes("hiss")) && (
              <g>
                <circle cx="130" cy="70" r="2" fill="#87ceeb" opacity="0.7">
                  <animate attributeName="r" values="2;8;2" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle cx="140" cy="75" r="1.5" fill="#87ceeb" opacity="0.5">
                  <animate attributeName="r" values="1.5;6;1.5" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="1.2s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
            
            {/* Vibration indicator for voiced sounds */}
            {shape.description.includes("voice") && (
              <g>
                <rect x="95" y="40" width="10" height="3" fill="#4ade80" opacity="0.8">
                  <animate attributeName="height" values="3;8;3" dur="0.3s" repeatCount="indefinite" />
                </rect>
                <rect x="105" y="42" width="8" height="2" fill="#22c55e" opacity="0.6">
                  <animate attributeName="height" values="2;6;2" dur="0.4s" repeatCount="indefinite" />
                </rect>
              </g>
            )}
          </>
        )}
      </svg>
      
      {/* Educational overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg backdrop-blur-sm">
        <div className="text-center font-medium">
          {shape.description}
        </div>
      </div>
    </div>
  );
};

export const LipSyncMouth: React.FC<LipSyncMouthProps> = ({ 
  word, 
  isAnimating, 
  phoneme 
}) => {
  const [currentShape, setCurrentShape] = useState(PHONEME_SHAPES["default"]);
  const [currentPhoneme, setCurrentPhoneme] = useState("");
  const animationRef = useRef<number | null>(null);
  const phonemeIndexRef = useRef(0);
  
  // Extract phonemes from word
  const getWordPhonemes = (word: string): string[] => {
    return word.toUpperCase().split("").map(char => {
      if ("AEIOU".includes(char)) return char;
      if ("BCDFGHJKLMNPQRSTVWXYZ".includes(char)) return char;
      return "";
    }).filter(p => p !== "");
  };

  // Animate through phonemes when word is being spoken
  useEffect(() => {
    if (!isAnimating || !word) {
      setCurrentShape(PHONEME_SHAPES["default"]);
      return;
    }
    
    const phonemes = getWordPhonemes(word);
    if (phonemes.length === 0) return;
    
    let startTime = Date.now();
    const phonemeDuration = 800; // Slightly longer for better learning
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed > phonemeDuration) {
        phonemeIndexRef.current = (phonemeIndexRef.current + 1) % phonemes.length;
        startTime = now;
        
        const nextPhoneme = phonemes[phonemeIndexRef.current];
        setCurrentPhoneme(nextPhoneme);
        
        const shape = PHONEME_SHAPES[nextPhoneme as keyof typeof PHONEME_SHAPES] || 
                      PHONEME_SHAPES["default"];
        setCurrentShape(shape);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Reset to first phoneme
    phonemeIndexRef.current = 0;
    const firstPhoneme = phonemes[0];
    setCurrentPhoneme(firstPhoneme);
    setCurrentShape(PHONEME_SHAPES[firstPhoneme as keyof typeof PHONEME_SHAPES] || PHONEME_SHAPES["default"]);
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, word]);
  
  // Handle direct phoneme selection
  useEffect(() => {
    if (phoneme && !isAnimating) {
      setCurrentPhoneme(phoneme);
      const shape = PHONEME_SHAPES[phoneme as keyof typeof PHONEME_SHAPES] || 
                    PHONEME_SHAPES["default"];
      setCurrentShape(shape);
    }
  }, [phoneme, isAnimating]);

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden shadow-lg">
      {/* Phoneme indicator */}
      <div className="absolute top-2 left-2 right-2 z-10">
        <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-mono text-center backdrop-blur-sm">
          {currentPhoneme ? `Sound: ${currentPhoneme}` : "Ready to practice"}
        </div>
      </div>
      
      <AnimatedMouth 
        shape={currentShape} 
        isAnimating={isAnimating}
      />
    </div>
  );
};