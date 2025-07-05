
import React, { useEffect, useState, useRef } from "react";

interface EnhancedMouthDiagramProps {
  word: string;
  isAnimating: boolean;
  phoneme?: string;
}

// Enhanced phoneme shapes with detailed anatomical positions
const PHONEME_ANATOMY = {
  "A": {
    lips: { upper: 25, lower: 55, width: 50, roundness: 0.2 },
    tongue: { tipX: 100, tipY: 85, bodyX: 100, bodyY: 90, height: 15 },
    jaw: { opening: 35, position: 45 },
    teeth: { gap: 25, visibility: 0.9 },
    description: "Wide mouth, tongue flat and low",
    articulationPoint: "Low central vowel"
  },
  "E": {
    lips: { upper: 30, lower: 45, width: 40, roundness: 0.1 },
    tongue: { tipX: 85, tipY: 75, bodyX: 95, bodyY: 80, height: 18 },
    jaw: { opening: 20, position: 40 },
    teeth: { gap: 15, visibility: 0.8 },
    description: "Slightly spread lips, tongue mid-high",
    articulationPoint: "Mid-front vowel"
  },
  "I": {
    lips: { upper: 32, lower: 42, width: 30, roundness: 0.1 },
    tongue: { tipX: 80, tipY: 65, bodyX: 90, bodyY: 70, height: 22 },
    jaw: { opening: 12, position: 35 },
    teeth: { gap: 8, visibility: 0.7 },
    description: "Lips slightly spread, tongue high front",
    articulationPoint: "High front vowel"
  },
  "O": {
    lips: { upper: 28, lower: 48, width: 25, roundness: 0.9 },
    tongue: { tipX: 110, tipY: 85, bodyX: 120, bodyY: 90, height: 16 },
    jaw: { opening: 25, position: 42 },
    teeth: { gap: 20, visibility: 0.6 },
    description: "Rounded lips, tongue back and low",
    articulationPoint: "Mid-back rounded vowel"
  },
  "U": {
    lips: { upper: 30, lower: 46, width: 20, roundness: 1.0 },
    tongue: { tipX: 115, tipY: 80, bodyX: 125, bodyY: 85, height: 18 },
    jaw: { opening: 18, position: 38 },
    teeth: { gap: 15, visibility: 0.5 },
    description: "Highly rounded lips, tongue high back",
    articulationPoint: "High back rounded vowel"
  },
  "F": {
    lips: { upper: 35, lower: 38, width: 35, roundness: 0.1 },
    tongue: { tipX: 90, tipY: 85, bodyX: 100, bodyY: 88, height: 12 },
    jaw: { opening: 8, position: 36 },
    teeth: { gap: 3, visibility: 1.0 },
    description: "Lower lip touches upper teeth",
    articulationPoint: "Labiodental fricative"
  },
  "V": {
    lips: { upper: 35, lower: 38, width: 35, roundness: 0.1 },
    tongue: { tipX: 90, tipY: 85, bodyX: 100, bodyY: 88, height: 12 },
    jaw: { opening: 8, position: 36 },
    teeth: { gap: 3, visibility: 1.0 },
    description: "Lower lip touches upper teeth (voiced)",
    articulationPoint: "Voiced labiodental fricative"
  },
  "P": {
    lips: { upper: 37, lower: 37, width: 0, roundness: 0.5 },
    tongue: { tipX: 95, tipY: 80, bodyX: 105, bodyY: 85, height: 15 },
    jaw: { opening: 0, position: 37 },
    teeth: { gap: 0, visibility: 0.3 },
    description: "Lips completely closed, then release",
    articulationPoint: "Bilabial plosive"
  },
  "B": {
    lips: { upper: 37, lower: 37, width: 0, roundness: 0.5 },
    tongue: { tipX: 95, tipY: 80, bodyX: 105, bodyY: 85, height: 15 },
    jaw: { opening: 0, position: 37 },
    teeth: { gap: 0, visibility: 0.3 },
    description: "Lips closed (voiced), then release",
    articulationPoint: "Voiced bilabial plosive"
  },
  "TH": {
    lips: { upper: 32, lower: 45, width: 38, roundness: 0.1 },
    tongue: { tipX: 70, tipY: 45, bodyX: 85, bodyY: 75, height: 8 },
    jaw: { opening: 15, position: 38 },
    teeth: { gap: 10, visibility: 1.0 },
    description: "Tongue tip between teeth",
    articulationPoint: "Interdental fricative"
  },
  "L": {
    lips: { upper: 33, lower: 42, width: 32, roundness: 0.1 },
    tongue: { tipX: 75, tipY: 35, bodyX: 95, bodyY: 75, height: 20 },
    jaw: { opening: 18, position: 37 },
    teeth: { gap: 12, visibility: 0.8 },
    description: "Tongue tip touches alveolar ridge",
    articulationPoint: "Alveolar lateral approximant"
  },
  "S": {
    lips: { upper: 34, lower: 41, width: 28, roundness: 0.1 },
    tongue: { tipX: 80, tipY: 50, bodyX: 90, bodyY: 70, height: 12 },
    jaw: { opening: 10, position: 37 },
    teeth: { gap: 5, visibility: 1.0 },
    description: "Tongue creates narrow channel",
    articulationPoint: "Alveolar fricative"
  },
  "R": {
    lips: { upper: 32, lower: 43, width: 30, roundness: 0.3 },
    tongue: { tipX: 85, tipY: 60, bodyX: 100, bodyY: 75, height: 18 },
    jaw: { opening: 15, position: 37 },
    teeth: { gap: 10, visibility: 0.7 },
    description: "Tongue curved, not touching roof",
    articulationPoint: "Alveolar approximant"
  },
  "default": {
    lips: { upper: 33, lower: 42, width: 30, roundness: 0.3 },
    tongue: { tipX: 90, tipY: 75, bodyX: 105, bodyY: 85, height: 15 },
    jaw: { opening: 12, position: 37 },
    teeth: { gap: 8, visibility: 0.6 },
    description: "Relaxed mouth position",
    articulationPoint: "Neutral position"
  }
};

const AnatomicalMouthDiagram: React.FC<{
  anatomy: any;
  isAnimating: boolean;
  hoveredPart: string | null;
  onPartHover: (part: string | null) => void;
}> = ({ anatomy, isAnimating, hoveredPart, onPartHover }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800">
      <svg
        width="300"
        height="220"
        viewBox="0 0 300 220"
        className="max-w-full max-h-full"
      >
        {/* Face outline */}
        <ellipse
          cx="150"
          cy="110"
          rx="120"
          ry="90"
          fill="#ffe5d1"
          stroke="#d4a574"
          strokeWidth="2"
          className="transition-all duration-700"
        />
        
        {/* Nasal cavity */}
        <ellipse
          cx="150"
          cy="60"
          rx="25"
          ry="15"
          fill="#ffb3ba"
          stroke="#e67e7e"
          strokeWidth="1"
          opacity="0.6"
        />
        
        {/* Palate (roof of mouth) */}
        <path
          d={`M ${150 - anatomy.lips.width} 80 Q 150 65 ${150 + anatomy.lips.width} 80`}
          fill="none"
          stroke="#d4a574"
          strokeWidth="3"
          className={`transition-all duration-500 ${hoveredPart === 'palate' ? 'stroke-blue-500 stroke-[4px]' : ''}`}
          onMouseEnter={() => onPartHover('palate')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Oral cavity */}
        <ellipse
          cx="150"
          cy={anatomy.jaw.position + 80}
          rx={anatomy.lips.width + 10}
          ry={anatomy.jaw.opening + 5}
          fill="#8b1538"
          className="transition-all duration-700 ease-out"
        />
        
        {/* Upper teeth */}
        <rect
          x={150 - anatomy.lips.width + 5}
          y={anatomy.lips.upper + 80}
          width={(anatomy.lips.width - 5) * 2}
          height="8"
          fill="#f8f8f8"
          stroke="#e0e0e0"
          strokeWidth="1"
          rx="4"
          className={`transition-all duration-500 ${hoveredPart === 'teeth' ? 'fill-blue-100' : ''}`}
          style={{ opacity: anatomy.teeth.visibility }}
          onMouseEnter={() => onPartHover('teeth')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Lower teeth */}
        <rect
          x={150 - anatomy.lips.width + 5}
          y={anatomy.lips.lower + 80}
          width={(anatomy.lips.width - 5) * 2}
          height="8"
          fill="#f0f0f0"
          stroke="#d0d0d0"
          strokeWidth="1"
          rx="4"
          className={`transition-all duration-500 ${hoveredPart === 'teeth' ? 'fill-blue-100' : ''}`}
          style={{ opacity: anatomy.teeth.visibility }}
          onMouseEnter={() => onPartHover('teeth')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Tongue body */}
        <ellipse
          cx={anatomy.tongue.bodyX}
          cy={anatomy.tongue.bodyY + 80}
          rx="35"
          ry={anatomy.tongue.height}
          fill="#ff9999"
          stroke="#e67777"
          strokeWidth="2"
          className={`transition-all duration-700 ease-out ${hoveredPart === 'tongue' ? 'fill-red-300' : ''}`}
          onMouseEnter={() => onPartHover('tongue')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Tongue tip */}
        <ellipse
          cx={anatomy.tongue.tipX}
          cy={anatomy.tongue.tipY + 80}
          rx="12"
          ry="8"
          fill="#ff7777"
          stroke="#cc5555"
          strokeWidth="1.5"
          className={`transition-all duration-700 ease-out ${hoveredPart === 'tongue' ? 'fill-red-400' : ''}`}
          onMouseEnter={() => onPartHover('tongue')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Upper lip */}
        <ellipse
          cx="150"
          cy={anatomy.lips.upper + 80}
          rx={anatomy.lips.width}
          ry="10"
          fill="#d4888a"
          className={`transition-all duration-700 ease-out ${hoveredPart === 'lips' ? 'fill-pink-400' : ''}`}
          style={{
            transform: `scaleX(${1 + anatomy.lips.roundness * 0.3})`
          }}
          onMouseEnter={() => onPartHover('lips')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Lower lip */}
        <ellipse
          cx="150"
          cy={anatomy.lips.lower + 80}
          rx={anatomy.lips.width}
          ry="12"
          fill="#cc7779"
          className={`transition-all duration-700 ease-out ${hoveredPart === 'lips' ? 'fill-pink-500' : ''}`}
          style={{
            transform: `scaleX(${1 + anatomy.lips.roundness * 0.3})`
          }}
          onMouseEnter={() => onPartHover('lips')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Jaw line */}
        <path
          d={`M 50 ${anatomy.jaw.position + 80} Q 150 ${anatomy.jaw.position + 90} 250 ${anatomy.jaw.position + 80}`}
          fill="none"
          stroke="#d4a574"
          strokeWidth="3"
          className={`transition-all duration-500 ${hoveredPart === 'jaw' ? 'stroke-yellow-500 stroke-[4px]' : ''}`}
          onMouseEnter={() => onPartHover('jaw')}
          onMouseLeave={() => onPartHover(null)}
        />
        
        {/* Animation indicators for airflow */}
        {isAnimating && anatomy.description.includes("air") && (
          <g opacity="0.8">
            <circle cx="200" cy="120" r="3" fill="#87ceeb">
              <animate attributeName="r" values="3;12;3" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="210" cy="125" r="2" fill="#87ceeb">
              <animate attributeName="r" values="2;8;2" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
        
        {/* Vibration indicators for voiced sounds */}
        {isAnimating && anatomy.description.includes("voiced") && (
          <g>
            <rect x="145" y="50" width="10" height="4" fill="#4ade80" opacity="0.9">
              <animate attributeName="height" values="4;12;4" dur="0.4s" repeatCount="indefinite" />
            </rect>
            <rect x="155" y="52" width="8" height="3" fill="#22c55e" opacity="0.7">
              <animate attributeName="height" values="3;9;3" dur="0.5s" repeatCount="indefinite" />
            </rect>
          </g>
        )}
        
        {/* Labels */}
        <g className="text-xs font-medium fill-gray-600 dark:fill-gray-300">
          <text x="50" y="95" textAnchor="middle">Palate</text>
          <text x="250" y="140" textAnchor="middle">Jaw</text>
          <text x="200" y="170" textAnchor="middle">Tongue</text>
          <text x="50" y="140" textAnchor="middle">Lips</text>
        </g>
      </svg>
      
      {/* Tooltip for hovered part */}
      {hoveredPart && (
        <div className="absolute top-2 left-2 right-2 bg-black/90 text-white text-xs p-2 rounded-lg backdrop-blur-sm z-10">
          <div className="font-semibold capitalize">{hoveredPart}</div>
          <div className="text-gray-300">
            {hoveredPart === 'lips' && 'Controls mouth opening and rounding'}
            {hoveredPart === 'tongue' && 'Primary articulator for most sounds'}
            {hoveredPart === 'teeth' && 'Contact point for dental sounds'}
            {hoveredPart === 'jaw' && 'Controls mouth opening height'}
            {hoveredPart === 'palate' && 'Roof of mouth, contact point for some sounds'}
          </div>
        </div>
      )}
      
      {/* Articulation description */}
      <div className="absolute bottom-2 left-2 right-2 bg-primary/90 text-primary-foreground text-xs p-2 rounded-lg backdrop-blur-sm">
        <div className="font-semibold">{anatomy.articulationPoint}</div>
        <div className="text-primary-foreground/90">{anatomy.description}</div>
      </div>
    </div>
  );
};

export const EnhancedMouthDiagram: React.FC<EnhancedMouthDiagramProps> = ({
  word,
  isAnimating,
  phoneme
}) => {
  const [currentAnatomy, setCurrentAnatomy] = useState(PHONEME_ANATOMY["default"]);
  const [currentPhoneme, setCurrentPhoneme] = useState("");
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
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
      setCurrentAnatomy(PHONEME_ANATOMY["default"]);
      return;
    }

    const phonemes = getWordPhonemes(word);
    if (phonemes.length === 0) return;

    let startTime = Date.now();
    const phonemeDuration = 900; // Slightly longer for better observation

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed > phonemeDuration) {
        phonemeIndexRef.current = (phonemeIndexRef.current + 1) % phonemes.length;
        startTime = now;

        const nextPhoneme = phonemes[phonemeIndexRef.current];
        setCurrentPhoneme(nextPhoneme);

        const anatomy = PHONEME_ANATOMY[nextPhoneme as keyof typeof PHONEME_ANATOMY] ||
                       PHONEME_ANATOMY["default"];
        setCurrentAnatomy(anatomy);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Reset to first phoneme
    phonemeIndexRef.current = 0;
    const firstPhoneme = phonemes[0];
    setCurrentPhoneme(firstPhoneme);
    setCurrentAnatomy(PHONEME_ANATOMY[firstPhoneme as keyof typeof PHONEME_ANATOMY] || PHONEME_ANATOMY["default"]);

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
      const anatomy = PHONEME_ANATOMY[phoneme as keyof typeof PHONEME_ANATOMY] ||
                     PHONEME_ANATOMY["default"];
      setCurrentAnatomy(anatomy);
    }
  }, [phoneme, isAnimating]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden shadow-lg">
      {/* Phoneme indicator */}
      <div className="absolute top-2 left-2 right-2 z-20">
        <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-mono text-center backdrop-blur-sm">
          {currentPhoneme ? `Sound: /${currentPhoneme}/` : "Ready for practice"}
        </div>
      </div>

      <AnatomicalMouthDiagram
        anatomy={currentAnatomy}
        isAnimating={isAnimating}
        hoveredPart={hoveredPart}
        onPartHover={setHoveredPart}
      />
    </div>
  );
};