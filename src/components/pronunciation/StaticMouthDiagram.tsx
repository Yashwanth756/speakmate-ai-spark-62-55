
import React, { useEffect, useState } from "react";

interface StaticMouthDiagramProps {
  word: string;
  isAnimating: boolean;
  phoneme?: string;
}

// Mouth position data for different phonemes
const MOUTH_POSITIONS = {
  "A": {
    jawOpen: 35,
    tongueX: 50,
    tongueY: 80,
    lipWidth: 60,
    lipRounding: 0.2,
    description: "Wide open mouth, tongue low and flat",
    label: "Open vowel /a/"
  },
  "E": {
    jawOpen: 20,
    tongueX: 45,
    tongueY: 65,
    lipWidth: 50,
    lipRounding: 0.1,
    description: "Medium opening, tongue mid-high",
    label: "Mid vowel /e/"
  },
  "I": {
    jawOpen: 12,
    tongueX: 40,
    tongueY: 55,
    lipWidth: 40,
    lipRounding: 0.1,
    description: "Small opening, tongue high front",
    label: "High vowel /i/"
  },
  "O": {
    jawOpen: 25,
    tongueX: 60,
    tongueY: 75,
    lipWidth: 35,
    lipRounding: 0.8,
    description: "Rounded lips, tongue back",
    label: "Mid vowel /o/"
  },
  "U": {
    jawOpen: 18,
    tongueX: 65,
    tongueY: 60,
    lipWidth: 30,
    lipRounding: 1.0,
    description: "Highly rounded lips, tongue high back",
    label: "High vowel /u/"
  },
  "F": {
    jawOpen: 8,
    tongueX: 50,
    tongueY: 75,
    lipWidth: 45,
    lipRounding: 0.1,
    description: "Lower lip touches upper teeth",
    label: "Fricative /f/"
  },
  "V": {
    jawOpen: 8,
    tongueX: 50,
    tongueY: 75,
    lipWidth: 45,
    lipRounding: 0.1,
    description: "Lower lip touches upper teeth (voiced)",
    label: "Fricative /v/"
  },
  "P": {
    jawOpen: 0,
    tongueX: 50,
    tongueY: 70,
    lipWidth: 0,
    lipRounding: 0.5,
    description: "Lips completely closed",
    label: "Plosive /p/"
  },
  "B": {
    jawOpen: 0,
    tongueX: 50,
    tongueY: 70,
    lipWidth: 0,
    lipRounding: 0.5,
    description: "Lips closed (voiced)",
    label: "Plosive /b/"
  },
  "M": {
    jawOpen: 0,
    tongueX: 50,
    tongueY: 70,
    lipWidth: 0,
    lipRounding: 0.5,
    description: "Lips closed, nasal sound",
    label: "Nasal /m/"
  },
  "TH": {
    jawOpen: 15,
    tongueX: 35,
    tongueY: 45,
    lipWidth: 48,
    lipRounding: 0.1,
    description: "Tongue tip between teeth",
    label: "Fricative /θ/"
  },
  "L": {
    jawOpen: 18,
    tongueX: 35,
    tongueY: 35,
    lipWidth: 42,
    lipRounding: 0.1,
    description: "Tongue tip touches alveolar ridge",
    label: "Lateral /l/"
  },
  "S": {
    jawOpen: 10,
    tongueX: 40,
    tongueY: 50,
    lipWidth: 38,
    lipRounding: 0.1,
    description: "Narrow channel for air",
    label: "Fricative /s/"
  },
  "R": {
    jawOpen: 15,
    tongueX: 45,
    tongueY: 60,
    lipWidth: 40,
    lipRounding: 0.3,
    description: "Tongue curved, not touching roof",
    label: "Approximant /r/"
  },
  "default": {
    jawOpen: 12,
    tongueX: 50,
    tongueY: 70,
    lipWidth: 40,
    lipRounding: 0.3,
    description: "Relaxed mouth position",
    label: "Neutral position"
  }
};

const MouthDiagram: React.FC<{
  position: any;
  isActive: boolean;
}> = ({ position, isActive }) => {
  const faceWidth = 200;
  const faceHeight = 150;
  const centerX = faceWidth / 2;
  const centerY = faceHeight / 2;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width={faceWidth}
        height={faceHeight}
        viewBox={`0 0 ${faceWidth} ${faceHeight}`}
        className="max-w-full max-h-full"
      >
        {/* Face outline */}
        <ellipse
          cx={centerX}
          cy={centerY}
          rx="85"
          ry="65"
          fill="#ffe5d1"
          stroke="#d4a574"
          strokeWidth="2"
        />
        
        {/* Mouth cavity */}
        <ellipse
          cx={centerX}
          cy={centerY + 20 + position.jawOpen * 0.3}
          rx={position.lipWidth * 0.6}
          ry={position.jawOpen + 5}
          fill="#8b1538"
        />
        
        {/* Upper teeth */}
        {position.jawOpen > 5 && (
          <rect
            x={centerX - position.lipWidth * 0.5}
            y={centerY + 15}
            width={position.lipWidth}
            height="6"
            fill="#f8f8f8"
            rx="3"
          />
        )}
        
        {/* Lower teeth */}
        {position.jawOpen > 5 && (
          <rect
            x={centerX - position.lipWidth * 0.5}
            y={centerY + 25 + position.jawOpen}
            width={position.lipWidth}
            height="6"
            fill="#f0f0f0"
            rx="3"
          />
        )}
        
        {/* Tongue */}
        <ellipse
          cx={centerX + (position.tongueX - 50) * 0.8}
          cy={centerY + position.tongueY * 0.4}
          rx="30"
          ry="12"
          fill="#ff9999"
          stroke="#e67777"
          strokeWidth="1.5"
        />
        
        {/* Tongue tip (for specific sounds) */}
        {(position.label.includes('/l/') || position.label.includes('/θ/')) && (
          <ellipse
            cx={centerX + (position.tongueX - 50) * 1.2}
            cy={centerY + position.tongueY * 0.3}
            rx="8"
            ry="6"
            fill="#ff7777"
            stroke="#cc5555"
            strokeWidth="1"
          />
        )}
        
        {/* Upper lip */}
        <ellipse
          cx={centerX}
          cy={centerY + 15}
          rx={position.lipWidth}
          ry="8"
          fill="#d4888a"
          transform={`scale(${1 + position.lipRounding * 0.2}, 1)`}
        />
        
        {/* Lower lip */}
        <ellipse
          cx={centerX}
          cy={centerY + 25 + position.jawOpen}
          rx={position.lipWidth}
          ry="10"
          fill="#cc7779"
          transform={`scale(${1 + position.lipRounding * 0.2}, 1)`}
        />
        
        {/* Airflow indicators for fricatives */}
        {position.label.includes('Fricative') && (
          <g opacity="0.6">
            <circle cx={centerX + 40} cy={centerY + 20} r="2" fill="#87ceeb" />
            <circle cx={centerX + 50} cy={centerY + 25} r="1.5" fill="#87ceeb" />
            <circle cx={centerX + 45} cy={centerY + 15} r="1" fill="#87ceeb" />
          </g>
        )}
        
        {/* Nasal indicator */}
        {position.label.includes('Nasal') && (
          <path
            d={`M ${centerX - 5} ${centerY - 20} Q ${centerX} ${centerY - 30} ${centerX + 5} ${centerY - 20}`}
            stroke="#4ade80"
            strokeWidth="3"
            fill="none"
            opacity="0.8"
          />
        )}
      </svg>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export const StaticMouthDiagram: React.FC<StaticMouthDiagramProps> = ({
  word,
  isAnimating,
  phoneme
}) => {
  const [currentPhoneme, setCurrentPhoneme] = useState("default");
  const [currentPosition, setCurrentPosition] = useState(MOUTH_POSITIONS["default"]);

  // Extract phonemes from word
  const getWordPhonemes = (word: string): string[] => {
    return word.toUpperCase().split("").map(char => {
      if ("AEIOU".includes(char)) return char;
      if ("BCDFGHJKLMNPQRSTVWXYZ".includes(char)) return char;
      return "";
    }).filter(p => p !== "");
  };

  // Handle direct phoneme selection
  useEffect(() => {
    if (phoneme && !isAnimating) {
      setCurrentPhoneme(phoneme);
      const position = MOUTH_POSITIONS[phoneme as keyof typeof MOUTH_POSITIONS] ||
                     MOUTH_POSITIONS["default"];
      setCurrentPosition(position);
    }
  }, [phoneme, isAnimating]);

  // Handle word animation (cycle through phonemes)
  useEffect(() => {
    if (!isAnimating || !word) {
      setCurrentPhoneme("default");
      setCurrentPosition(MOUTH_POSITIONS["default"]);
      return;
    }

    const phonemes = getWordPhonemes(word);
    if (phonemes.length === 0) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      const phoneme = phonemes[currentIndex];
      setCurrentPhoneme(phoneme);
      
      const position = MOUTH_POSITIONS[phoneme as keyof typeof MOUTH_POSITIONS] ||
                      MOUTH_POSITIONS["default"];
      setCurrentPosition(position);
      
      currentIndex = (currentIndex + 1) % phonemes.length;
    }, 1000);

    // Start with first phoneme
    setCurrentPhoneme(phonemes[0]);
    setCurrentPosition(MOUTH_POSITIONS[phonemes[0] as keyof typeof MOUTH_POSITIONS] || MOUTH_POSITIONS["default"]);

    return () => clearInterval(interval);
  }, [isAnimating, word]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
      {/* Phoneme indicator */}
      <div className="absolute top-3 left-3 right-3 z-10">
        <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-mono text-center backdrop-blur-sm">
          {currentPosition.label}
        </div>
      </div>

      {/* Main diagram area */}
      <div className="absolute inset-0 pt-12 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-xs bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm shadow-lg">
          <MouthDiagram 
            position={currentPosition} 
            isActive={isAnimating || phoneme !== undefined}
          />
        </div>
      </div>

      {/* Description */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/80 text-white text-xs p-2 rounded-lg backdrop-blur-sm">
        <div className="text-center">
          <div className="font-semibold">{currentPosition.description}</div>
          {currentPhoneme !== "default" && (
            <div className="text-gray-300 mt-1">Sound: /{currentPhoneme}/</div>
          )}
        </div>
      </div>

      {/* Educational indicators */}
      <div className="absolute top-3 right-3 flex gap-1">
        <div className="bg-green-500/90 text-white px-2 py-1 rounded text-xs">
          Static
        </div>
        <div className="bg-blue-500/90 text-white px-2 py-1 rounded text-xs">
          Educational
        </div>
      </div>
    </div>
  );
};