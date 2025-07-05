
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";

interface LipSyncRobotProps {
  word: string;
  isAnimating: boolean;
  phoneme?: string;
}

// Mapping of phonemes to mouth shapes
const PHONEME_MOUTH_SHAPES = {
  "A": { openness: 0.7, roundness: 0.3 },    // as in "cat"
  "E": { openness: 0.5, roundness: 0.1 },    // as in "bed"
  "I": { openness: 0.3, roundness: 0.2 },    // as in "fit"
  "O": { openness: 0.6, roundness: 0.9 },    // as in "hot"
  "U": { openness: 0.4, roundness: 0.8 },    // as in "put"
  "F": { openness: 0.2, roundness: 0.1 },    // as in "fish"
  "V": { openness: 0.2, roundness: 0.1 },    // as in "van"
  "P": { openness: 0.0, roundness: 0.3 },    // as in "map"
  "B": { openness: 0.1, roundness: 0.3 },    // as in "bat"
  "M": { openness: 0.0, roundness: 0.5 },    // as in "map"
  "TH": { openness: 0.3, roundness: 0.2 },   // as in "think"
  "L": { openness: 0.4, roundness: 0.1 },    // as in "lip"
  "default": { openness: 0.1, roundness: 0.3 }
};

// Robot Face & Mouth Component
const RobotFace = ({ openness = 0.1, roundness = 0.3 }) => {
  // Face geometry
  const faceRadius = 1;
  
  // Calculate mouth dimensions based on phoneme parameters
  const mouthWidth = 0.7 + (roundness * 0.3);
  const mouthHeight = 0.1 + (openness * 0.6);
  
  return (
    <group>
      {/* Robot Head (Sphere) */}
      <mesh>
        <sphereGeometry args={[faceRadius, 32, 32]} />
        <meshStandardMaterial color="#66ccff" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Eyes */}
      <group position={[0, 0.2, 0.8]}>
        {/* Left Eye */}
        <mesh position={[-0.35, 0, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
          
          {/* Eye Pupil */}
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </mesh>
        
        {/* Right Eye */}
        <mesh position={[0.35, 0, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
          
          {/* Eye Pupil */}
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </mesh>
      </group>
      
      {/* Mouth */}
      <group position={[0, -0.3, 0.8]}>
        <mesh>
          <boxGeometry args={[mouthWidth, mouthHeight, 0.1]} />
          <meshStandardMaterial color="#990000" />
        </mesh>
      </group>
      
      {/* Antenna */}
      <group position={[0, 1.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
          <meshStandardMaterial color="#999999" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
};

export const LipSyncRobot: React.FC<LipSyncRobotProps> = ({ word, isAnimating, phoneme }) => {
  const [mouthShape, setMouthShape] = useState(PHONEME_MOUTH_SHAPES["default"]);
  const [currentPhoneme, setCurrentPhoneme] = useState("");
  const animationRef = useRef<number | null>(null);
  const phonemeIndexRef = useRef(0);
  
  // Break down word into phonemes (simplified)
  const getWordPhonemes = (word: string): string[] => {
    // This is a very simplified phoneme extraction
    // A real implementation would use a phonetic dictionary or API
    return word.toUpperCase().split("").map(char => {
      if ("AEIOU".includes(char)) return char;
      if ("BCDFGHJKLMNPQRSTVWXYZ".includes(char)) return char;
      return "";
    }).filter(p => p !== "");
  };

  // Animation loop for phoneme sequence
  useEffect(() => {
    if (!isAnimating || !word) return;
    
    const phonemes = getWordPhonemes(word);
    let startTime = Date.now();
    const phonemeDuration = 300; // ms per phoneme
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed > phonemeDuration) {
        // Move to next phoneme
        phonemeIndexRef.current = (phonemeIndexRef.current + 1) % phonemes.length;
        startTime = now;
        
        const nextPhoneme = phonemes[phonemeIndexRef.current];
        setCurrentPhoneme(nextPhoneme);
        
        // Get mouth shape for this phoneme or use default
        const shape = PHONEME_MOUTH_SHAPES[nextPhoneme as keyof typeof PHONEME_MOUTH_SHAPES] || 
                      PHONEME_MOUTH_SHAPES["default"];
        setMouthShape(shape);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, word]);
  
  // Handle direct phoneme prop change
  useEffect(() => {
    if (phoneme) {
      setCurrentPhoneme(phoneme);
      const shape = PHONEME_MOUTH_SHAPES[phoneme as keyof typeof PHONEME_MOUTH_SHAPES] || 
                    PHONEME_MOUTH_SHAPES["default"];
      setMouthShape(shape);
    }
  }, [phoneme]);

  return (
    <div className="robot-container w-full h-full min-h-[128px] rounded-lg overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900">
      <div className="phoneme-indicator text-xs text-center text-gray-300 absolute top-1 left-0 right-0 z-10">
        {currentPhoneme && `Phoneme: ${currentPhoneme}`}
      </div>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <RobotFace openness={mouthShape.openness} roundness={mouthShape.roundness} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          rotateSpeed={0.5}
          minPolarAngle={Math.PI/2 - 0.5}
          maxPolarAngle={Math.PI/2 + 0.5}
        />
      </Canvas>
    </div>
  );
};