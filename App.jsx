import React, { useState, useMemo, useRef, Suspense, createContext, useContext, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  Environment, 
  ContactShadows, 
  PresentationControls,
  Html,
  MeshDistortMaterial,
  Sparkles
} from '@react-three/drei';
import * as THREE from 'three';
import { Music, Music2, Sparkles as SparkleIcon, MailOpen, X, Music4 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// --- Context for interaction ---
const InteractionContext = createContext(null);

// --- Constants ---
const REJECTION_MESSAGES = [
  "Are you sure? 🥲", "Pwease? 👉👈", "💔", "Unlimited hugs! 🧸", "🥺", "Error! 😉", "✨"
];

const WHOLESOME_REASONS = [
  "You make every day brighter ☀️", "Your smile is my favorite view 😊",
  "You're the 'sweet' in my life 🍬", "I feel lucky just knowing you 🍀",
  "You're a literal masterpiece 🎨"
];

const GARDEN_COLORS = [
  "#ffb3c1", "#ffc8dd", "#cdb4db", "#fcf6bd", "#ff99c8", 
  "#ffafcc", "#ffc8dd", "#bde0fe", "#a2d2ff", "#e2e2e2",
  "#d8f3dc", "#95d5b2", "#ffccd5"
];

const HEART_COLORS = ["#8338ec", "#3a86ff", "#ff006e", "#fb5607", "#ffbe0b"];

// --- 3D Components ---

function Butterfly({ index, position, color, speed = 1, range = 2, delay = 0 }) {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const { butterflyPositions } = useContext(InteractionContext);

  useFrame((state) => {
    if (!groupRef.current || !leftWingRef.current || !rightWingRef.current) return;
    const t = state.clock.elapsedTime * speed + delay;
    const x = position[0] + Math.sin(t * 0.5) * range;
    const y = position[1] + Math.cos(t * 0.8) * (range * 0.5);
    const z = position[2] + Math.sin(t * 0.3) * range;
    groupRef.current.position.set(x, y, z);
    butterflyPositions.current[index].set(x, y, z);
    groupRef.current.rotation.y = Math.atan2(Math.cos(t * 0.5), Math.sin(t * 0.3));
    const flap = Math.sin(t * 15) * 0.8;
    leftWingRef.current.rotation.z = flap;
    rightWingRef.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef}>
      <mesh><capsuleGeometry args={[0.02, 0.1, 4, 8]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh ref={leftWingRef} position={[-0.05, 0, 0]}><planeGeometry args={[0.2, 0.2]} /><meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
      <mesh ref={rightWingRef} position={[0.05, 0, 0]}><planeGeometry args={[0.2, 0.2]} /><meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
    </group>
  );
}

function Butterflies() {
  const data = useMemo(() => [
    { color: "#ffd700", position: [-5, 2, -2], speed: 1.2, range: 3, delay: 0 },
    { color: "#87ceeb", position: [4, 3, -1], speed: 0.8, range: 4, delay: 2 },
    { color: "#ff69b4", position: [0, 4, -4], speed: 1.0, range: 2.5, delay: 5 },
    { color: "#dda0dd", position: [-3, -1, -3], speed: 0.9, range: 3.5, delay: 10 },
  ], []);
  return <group>{data.map((b, i) => <Butterfly key={i} index={i} {...b} />)}</group>;
}

function Flower({ position, color, petalCount = 5, scale = 1, delay = 0 }) {
  const groupRef = useRef();
  const petalsRef = useRef();
  const petals = useMemo(() => Array.from({ length: petalCount }), [petalCount]);
  const { butterflyPositions } = useContext(InteractionContext);
  const [isBlooming, setIsBlooming] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + delay;
    let nearButterfly = false;
    const worldPos = new THREE.Vector3(...position);
    for (const bPos of butterflyPositions.current) {
      if (worldPos.distanceTo(bPos) < 2.0) { nearButterfly = true; break; }
    }
    if (nearButterfly !== isBlooming) setIsBlooming(nearButterfly);
    const targetScale = isBlooming ? scale * 1.5 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    if (petalsRef.current) petalsRef.current.rotation.z += isBlooming ? 0.06 : 0.008;
  });

  return (
    <group position={position} scale={scale} ref={groupRef}>
      <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.015, 0.035, 1.5]} /><meshPhysicalMaterial color="#556b2f" /></mesh>
      <mesh position={[0, 0.25, 0.05]}><sphereGeometry args={[0.08, 16, 16]} /><meshPhysicalMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={0.2} /></mesh>
      <group ref={petalsRef} position={[0, 0.25, 0]}>
        {petals.map((_, i) => (
          <group key={i} rotation={[0, 0, (i / petalCount) * Math.PI * 2]}>
            <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.13, 16, 8]} /><meshPhysicalMaterial color={color} roughness={0.2} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function GardenHeart({ position, color, scale = 1, delay = 0 }) {
  const groupRef = useRef();
  const { butterflyPositions } = useContext(InteractionContext);
  const [isBlooming, setIsBlooming] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + delay;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.1;
    let nearButterfly = false;
    const worldPos = new THREE.Vector3(...position);
    for (const bPos of butterflyPositions.current) {
      if (worldPos.distanceTo(bPos) < 2.0) { nearButterfly = true; break; }
    }
    if (nearButterfly !== isBlooming) setIsBlooming(nearButterfly);
    const targetScale = isBlooming ? scale * 1.6 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group position={position} scale={scale} ref={groupRef}>
      <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.01, 0.02, 1]} /><meshPhysicalMaterial color="#556b2f" /></mesh>
      <group position={[0, 0.2, 0]}>
        <HeartShape color={color} scale={0.25} />
      </group>
    </group>
  );
}

function Garden() {
  const data = useMemo(() => {
    // Increased length from 150 to 400 for a fuller garden
    return Array.from({ length: 400 }).map((_, i) => {
      const isHeart = Math.random() > 0.8; // 20% hearts, 80% flowers
      return {
        id: i,
        type: isHeart ? 'heart' : 'flower',
        // Positioned across a wider field
        position: [
          (Math.random() - 0.5) * 35, 
          -4.8 + Math.random() * 3, 
          -1 - Math.random() * 15
        ],
        color: isHeart 
          ? HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)] 
          : GARDEN_COLORS[Math.floor(Math.random() * GARDEN_COLORS.length)],
        scale: 0.15 + Math.random() * 0.45, // Random sizes for variety
        delay: Math.random() * 10
      };
    });
  }, []);

  return (
    <group>
      {data.map((item) => 
        item.type === 'flower' ? (
          <Flower key={item.id} {...item} />
        ) : (
          <GardenHeart key={item.id} {...item} />
        )
      )}
    </group>
  );
}
function HeartShape({ color = "#ff4d6d", ...props }) {
  const heartShape = useMemo(() => {
    const s = 0.5;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(s * 2, s * 5, s * 9, s * 2, 0, s * -4);
    shape.bezierCurveTo(s * -9, s * 2, s * -2, s * 5, 0, 0);
    return shape;
  }, []);
  // FIXED: Changed rotation to [0,0,Math.PI] to keep heart upright
  return (
    <mesh {...props} rotation={[3, 0, Math.PI]}>
      <extrudeGeometry args={[heartShape, { depth: 0.7, bevelEnabled: true, bevelSize: 0.45, bevelThickness: 0.45 }]} />
      <meshPhysicalMaterial color={color} roughness={0.05} metalness={0.1} clearcoat={1} />
    </mesh>
  );
}



function MainHeart({ scale = 0.75, status = 'asking' }) {
  const meshRef = useRef();
  const { mouse, viewport } = useThree();
  useFrame((state) => {
    if (meshRef.current) {
      const dx = (mouse.x * viewport.width) / 2 - meshRef.current.position.x;
      const dy = (mouse.y * viewport.height) / 2 - meshRef.current.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const proximity = Math.max(0, 1 - dist / 5);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (1 + proximity * 1.5)) * (0.04 + proximity * 0.06);
      meshRef.current.rotation.y += 0.005;
      meshRef.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <HeartShape color={status === 'accepted' ? "#ff1a4a" : "#ff4d6d"} />
      </mesh>
    </Float>
  );
}

export default function App() {
  const [status, setStatus] = useState('asking');
  const [rejectionCount, setRejectionCount] = useState(0);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const audioRef = useRef(null);
  const butterflyPositions = useRef([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNo = () => {
    // FIXED: Bounds for floating behavior
    const bounds = isMobile ? 80 : 150;
    setNoButtonPos({ 
        x: (Math.random() - 0.5) * bounds, 
        y: (Math.random() - 0.5) * (bounds * 0.5) 
    });
    setRejectionCount(prev => (prev + 1) % REJECTION_MESSAGES.length);
    setYesScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleYes = () => {
    setStatus('accepted');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setShowLetter(true), 1000);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#fff1f2] relative overflow-hidden flex flex-col items-center justify-center">
      <audio ref={audioRef} loop src="https://www.youtube.com/shorts/7D5wPtQHebY" />
      
      <div className="absolute top-4 right-4 z-[100]">
        <button onClick={toggleMusic} className="p-4 bg-white/70 backdrop-blur-md rounded-full shadow-lg">
          {isPlaying ? <Music className="text-pink-600 animate-pulse" /> : <Music2 className="text-gray-400" />}
        </button>
      </div>

      <InteractionContext.Provider value={{ butterflyPositions }}>
        <Canvas camera={{ position: [0, 0, isMobile ? 12 : 8], fov: 45 }}>
          <ambientLight intensity={1.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <Suspense fallback={null}>
            <PresentationControls global snap>
              <MainHeart status={status} scale={status === 'accepted' ? 1.2 : 0.75} />
              <Garden />
              <Butterflies />
              <Sparkles count={50} scale={10} size={2} speed={0.4} color="#ffb3c1" />
            </PresentationControls>

            {/* FIXED: Responsive Title */}
            <Html center position={[0, isMobile ? 4.5 : 3.8, 0]}>
              <div className="text-center w-[90vw] pointer-events-none select-none">
                <h1 className="text-4xl md:text-7xl font-cursive text-pink-600 drop-shadow-lg leading-tight">
                  {status === 'asking' ? "Will You Be My Valentine?" : "It's a Yes! ❤️"}
                </h1>
              </div>
            </Html>

            {/* FIXED: Floating Buttons */}
            {status === 'asking' && (
              <Html center position={[0, -3.5, 0]}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <motion.button 
                    style={{ scale: yesScale }} 
                    onClick={handleYes}
                    className="bg-pink-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-xl z-50"
                  >Yes 💖</motion.button>
                  <motion.button 
                    animate={{ x: noButtonPos.x, y: noButtonPos.y }}
                    onMouseEnter={!isMobile ? handleNo : undefined}
                    onClick={handleNo}
                    className="bg-white text-gray-400 px-6 py-3 rounded-full shadow-md border whitespace-nowrap"
                  >{rejectionCount === 0 ? "No" : REJECTION_MESSAGES[rejectionCount]}</motion.button>
                </div>
              </Html>
            )}
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </InteractionContext.Provider>

      {/* FIXED: Letter Popup */}
      <AnimatePresence>
  {showLetter && (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#fffcf5] w-full max-w-lg rounded-[2rem] shadow-2xl border-b-8 border-pink-200 overflow-hidden relative"
      >
        {/* Close Button */}
        <button 
          onClick={() => setShowLetter(false)}
          className="absolute top-6 right-6 text-pink-300 hover:text-pink-500 transition-colors"
        >
          <X size={28} />
        </button>

        <div className="p-8 md:p-12 flex flex-col items-center">
          {/* Top Icon Area */}
          <div className="w-20 h-15 md:w-20 md:h-18 bg-pink-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-pink-50/50">
            <MailOpen className="text-pink-400 w-10 h-10 md:w-12 md:h-12" />
          </div>

          {/* Letter Content */}
          <h2 className="text-3xl md:text-5xl font-cursive text-pink-600 mb-6 text-center">
            To My Dear Valentine...
          </h2>
          
          <div className="space-y-4 text-center">
            <p className="text-pink-400 text-base md:text-xl font-medium">
              You’ve just made me the luckiest person in the world! 🌍
            </p>
            <p className="text-pink-300 text-sm md:text-lg px-4 leading-relaxed">
              In this garden of life, you're the most beautiful flower. Here's why you're so special:
            </p>
            
            {/* Wholesome Reasons Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {WHOLESOME_REASONS.map((reason, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="bg-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-sm border border-pink-100 flex items-center gap-2"
                >
                  <span className="text-xs md:text-sm font-semibold text-pink-400 whitespace-nowrap">
                    ✨ {reason}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-pink-50 w-full text-center">
            <p className="italic text-pink-400 text-sm md:text-lg font-medium">
              "Forever yours, with all my heart. 💌"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
    </div>
  );
}