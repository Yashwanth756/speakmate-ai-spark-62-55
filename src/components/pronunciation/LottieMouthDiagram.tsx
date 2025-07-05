
import React, { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";

interface LottieMouthDiagramProps {
  word: string;
  isAnimating: boolean;
  phoneme?: string;
}

// Mock Lottie animation data - In production, these would be actual .json files from After Effects
const createMockLottieData = (phoneme: string) => {
  const baseAnimation = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 400,
    h: 300,
    nm: `mouth_${phoneme}`,
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Mouth Shape",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [200, 150, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "el",
                p: { a: 0, k: [0, 0] },
                s: { 
                  a: 1, 
                  k: [
                    { t: 0, s: [40, 20] },
                    { t: 30, s: getPhonemeShape(phoneme) },
                    { t: 60, s: [40, 20] }
                  ]
                }
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.8, 0.2, 0.2, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  };
  
  return baseAnimation;
};

// Get mouth shape parameters for different phonemes
const getPhonemeShape = (phoneme: string): [number, number] => {
  const shapes: Record<string, [number, number]> = {
    "A": [80, 60],    // Wide open
    "E": [60, 30],    // Medium opening
    "I": [40, 15],    // Small opening
    "O": [35, 45],    // Round shape
    "U": [25, 35],    // Pursed lips
    "F": [50, 8],     // Narrow for fricative
    "V": [50, 8],     // Same as F but voiced
    "P": [0, 0],      // Closed lips
    "B": [5, 5],      // Slightly open after closure
    "M": [0, 0],      // Closed for nasal
    "TH": [55, 20],   // Tongue between teeth
    "L": [45, 25],    // Tongue to roof
    "S": [35, 10],    // Narrow stream
    "R": [40, 30],    // Rounded for approximant
    "default": [40, 20]
  };
  
  return shapes[phoneme] || shapes["default"];
};

// Phoneme descriptions for educational purposes
const PHONEME_DESCRIPTIONS = {
  "A": "Open mouth wide, tongue low and flat",
  "E": "Medium mouth opening, tongue slightly raised",
  "I": "Small mouth opening, tongue high and forward", 
  "O": "Round lips, tongue back and low",
  "U": "Pursed lips, tongue high and back",
  "F": "Lower lip touches upper teeth, breathe out",
  "V": "Same as F but add voice",
  "P": "Close lips completely, then release with puff",
  "B": "Close lips, add voice when releasing",
  "M": "Close lips, sound comes through nose",
  "TH": "Put tongue tip between teeth",
  "L": "Touch tongue tip to roof behind teeth",
  "S": "Teeth almost closed, air streams through",
  "R": "Curl tongue back, don't touch roof",
  "default": "Relaxed mouth position"
};

export const LottieMouthDiagram: React.FC<LottieMouthDiagramProps> = ({
  word,
  isAnimating,
  phoneme
}) => {
  const [currentPhoneme, setCurrentPhoneme] = useState("default");
  const [animationData, setAnimationData] = useState(createMockLottieData("default"));
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const animationRef = useRef<any>(null);
  const phonemeIndexRef = useRef(0);

  // Extract phonemes from word
  const getWordPhonemes = (word: string): string[] => {
    return word.toUpperCase().split("").map(char => {
      if ("AEIOU".includes(char)) return char;
      if ("BCDFGHJKLMNPQRSTVWXYZ".includes(char)) return char;
      return "";
    }).filter(p => p !== "");
  };

  // Handle word animation sequence
  useEffect(() => {
    if (!isAnimating || !word) {
      setCurrentPhoneme("default");
      setAnimationData(createMockLottieData("default"));
      return;
    }

    const phonemes = getWordPhonemes(word);
    if (phonemes.length === 0) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      const phoneme = phonemes[currentIndex];
      setCurrentPhoneme(phoneme);
      setAnimationData(createMockLottieData(phoneme));
      
      currentIndex = (currentIndex + 1) % phonemes.length;
    }, 900);

    // Start with first phoneme
    setCurrentPhoneme(phonemes[0]);
    setAnimationData(createMockLottieData(phonemes[0]));

    return () => clearInterval(interval);
  }, [isAnimating, word]);

  // Handle direct phoneme selection
  useEffect(() => {
    if (phoneme && !isAnimating) {
      setCurrentPhoneme(phoneme);
      setAnimationData(createMockLottieData(phoneme));
    }
  }, [phoneme, isAnimating]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30">
      {/* Phoneme indicator */}
      <div className="absolute top-3 left-3 right-3 z-20">
        <div className="bg-primary/95 text-primary-foreground px-4 py-2 rounded-full text-sm font-mono text-center backdrop-blur-sm shadow-md">
          Sound: /{currentPhoneme}/ - {PHONEME_DESCRIPTIONS[currentPhoneme as keyof typeof PHONEME_DESCRIPTIONS]}
        </div>
      </div>

      {/* Main Lottie Animation Area */}
      <div className="absolute inset-0 flex items-center justify-center pt-16 pb-12">
        <div className="relative w-80 h-60 bg-white/20 dark:bg-black/20 rounded-xl backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-inner">
          <Lottie
            lottieRef={animationRef}
            animationData={animationData}
            loop={isAnimating}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
            className="rounded-xl"
          />
          
          {/* Interactive overlay with mouth parts */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Lips indicator */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-6 border-2 border-pink-400/60 rounded-full pointer-events-auto cursor-pointer transition-all duration-300 hover:border-pink-500 hover:bg-pink-400/10"
              onMouseEnter={() => setHoveredElement('lips')}
              onMouseLeave={() => setHoveredElement(null)}
            />
            
            {/* Tongue indicator */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-16 h-4 border-2 border-red-400/60 rounded-full pointer-events-auto cursor-pointer transition-all duration-300 hover:border-red-500 hover:bg-red-400/10"
              onMouseEnter={() => setHoveredElement('tongue')}
              onMouseLeave={() => setHoveredElement(null)}
            />
            
            {/* Teeth indicator */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-3/4 w-20 h-3 border-2 border-gray-400/60 rounded-sm pointer-events-auto cursor-pointer transition-all duration-300 hover:border-gray-500 hover:bg-gray-400/10"
              onMouseEnter={() => setHoveredElement('teeth')}
              onMouseLeave={() => setHoveredElement(null)}
            />
          </div>
        </div>
      </div>

      {/* Educational tooltip */}
      {hoveredElement && (
        <div className="absolute top-20 left-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg backdrop-blur-sm z-30 transition-all duration-200">
          <div className="font-semibold capitalize">{hoveredElement}</div>
          <div className="text-gray-300 mt-1">
            {hoveredElement === 'lips' && 'Control mouth opening and lip rounding for vowels'}
            {hoveredElement === 'tongue' && 'Primary articulator - position changes for each sound'}
            {hoveredElement === 'teeth' && 'Contact point for sounds like F, V, TH'}
          </div>
        </div>
      )}

      {/* Animation controls */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2">
        <div className="bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full text-xs backdrop-blur-sm">
          {isAnimating ? "🎬 Animating" : "⏸️ Static"}
        </div>
        {currentPhoneme !== "default" && (
          <div className="bg-green-500/90 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
            ✨ Lottie Enhanced
          </div>
        )}
      </div>

      {/* Performance indicator */}
      <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
        High Quality
      </div>
    </div>
  );
};