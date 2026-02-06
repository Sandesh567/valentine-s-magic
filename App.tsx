
import React, { useState, useMemo, useRef, Suspense, createContext, useContext, useEffect } from 'react';
import { Canvas, useFrame, useThree,  } from '@react-three/fiber';
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
import { Heart, Music, Music2, Sparkles as SparkleIcon, MailOpen, X, Music4 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// --- Context for interaction ---
const InteractionContext = createContext<{
  butterflyPositions: React.MutableRefObject<THREE.Vector3[]>;
} | null>(null);

// --- Constants ---
const REJECTION_MESSAGES = [
  "Are you sure? 🥲",
  "Pwease? 👉👈",
  "My heart practiced for this! 💔",
  "I'll give you unlimited hugs! 🧸",
  "Pretty please? 🥺",
  "Error: 'No' is not an option! 😉",
  "We'd be the cutest pair! ✨"
];

const WHOLESOME_REASONS = [
  "You make every day brighter ☀️",
  "Your smile is my favorite view 😊",
  "You're the 'sweet' in my life 🍬",
  "I feel lucky just knowing you 🍀",
  "You're a literal masterpiece 🎨"
];

const GARDEN_COLORS = [
  "#ffb3c1", "#ffc8dd", "#cdb4db", "#fcf6bd", "#ff99c8", 
  "#ffafcc", "#ffc8dd", "#bde0fe", "#a2d2ff", "#e2e2e2",
  "#d8f3dc", "#95d5b2", "#ffccd5"
];

const HEART_COLORS = ["#8338ec", "#3a86ff", "#ff006e", "#fb5607", "#ffbe0b"];

// --- 3D Components ---

function Butterfly({ index, position, color, speed = 1, range = 2, delay = 0 }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const { butterflyPositions } = useContext(InteractionContext)!;

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
      <mesh>
        <capsuleGeometry args={[0.02, 0.1, 4, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={leftWingRef} position={[-0.05, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.05, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
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

  return (
    <group>
      {data.map((b, i) => (
        <Butterfly key={i} index={i} {...b} />
      ))}
    </group>
  );
}

function Flower({ position, color, petalCount = 5, scale = 1, delay = 0 }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const petalsRef = useRef<THREE.Group>(null);
  const petals = useMemo(() => Array.from({ length: petalCount }), [petalCount]);
  const { butterflyPositions } = useContext(InteractionContext)!;
  const [isBlooming, setIsBlooming] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + delay;
    
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.05;

    let nearButterfly = false;
    const worldPos = new THREE.Vector3(...position);
    for (const bPos of butterflyPositions.current) {
      if (worldPos.distanceTo(bPos) < 2.0) {
        nearButterfly = true;
        break;
      }
    }

    if (nearButterfly !== isBlooming) {
      setIsBlooming(nearButterfly);
    }

    const targetScale = isBlooming ? scale * 1.5 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    if (petalsRef.current) {
      petalsRef.current.rotation.z += isBlooming ? 0.06 : 0.008;
    }
  });

  return (
    <group position={position} scale={scale} ref={groupRef}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.035, 1.5]} />
        <meshPhysicalMaterial color="#556b2f" roughness={0.8} />
      </mesh>
      
      <mesh position={[0, 0.25, 0.05]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        {/* Fix typo: emmissive -> emissive */}
        <meshPhysicalMaterial color="#ffd700" roughness={0.5} emissive="#ffaa00" emissiveIntensity={0.2} />
      </mesh>

      <group ref={petalsRef} position={[0, 0.25, 0]}>
        {petals.map((_, i) => (
          <group key={i} rotation={[0, 0, (i / petalCount) * Math.PI * 2]}>
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.13, 16, 8]} />
              <meshPhysicalMaterial 
                color={color} 
                roughness={0.2} 
                clearcoat={0.5} 
                transmission={0.1}
                thickness={0.5}
              />
            </mesh>
          </group>
        ))}
      </group>

      {isBlooming && (
        <Sparkles 
          count={8} 
          scale={0.6} 
          size={2} 
          speed={0.6} 
          color="#ffffff" 
          position={[0, 0.35, 0]} 
        />
      )}
    </group>
  );
}

function GardenHeart({ position, color, scale = 1, delay = 0 }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const { butterflyPositions } = useContext(InteractionContext)!;
  const [isBlooming, setIsBlooming] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + delay;
    
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.1;
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.3;

    let nearButterfly = false;
    const worldPos = new THREE.Vector3(...position);
    for (const bPos of butterflyPositions.current) {
      if (worldPos.distanceTo(bPos) < 2.0) {
        nearButterfly = true;
        break;
      }
    }

    if (nearButterfly !== isBlooming) setIsBlooming(nearButterfly);

    const targetScale = isBlooming ? scale * 1.6 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group position={position} scale={scale} ref={groupRef}>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.02, 1]} />
        <meshPhysicalMaterial color="#556b2f" roughness={0.8} />
      </mesh>
      <group position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <HeartShape color={color} scale={0.25} />
      </group>
      {isBlooming && (
        <Sparkles count={5} scale={0.5} size={2} speed={1} color={color} position={[0, 0.2, 0]} />
      )}
    </group>
  );
}

function Garden() {
  const data = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => {
      const isHeart = Math.random() > 0.75;
      const posX = (Math.random() - 0.5) * 30;
      const posZ = -1 - Math.random() * 12;
      const posY = -4.8 + Math.random() * 2.5;
      
      return {
        id: i,
        type: isHeart ? 'heart' : 'flower',
        position: [posX, posY, posZ] as [number, number, number],
        color: isHeart ? HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)] : GARDEN_COLORS[Math.floor(Math.random() * GARDEN_COLORS.length)],
        scale: 0.2 + Math.random() * 0.5,
        petalCount: 5 + Math.floor(Math.random() * 4),
        delay: Math.random() * 10
      };
    });
  }, []);

  return (
    <group>
      {data.map((item) => (
        item.type === 'flower' ? 
          <Flower key={item.id} {...item} /> : 
          <GardenHeart key={item.id} {...item} />
      ))}
    </group>
  );
}

function HeartShape({ color = "#ff4d6d", ...props }: any) {
  const heartShape = useMemo(() => {
    const s = 0.5;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(s * 2, s * 5, s * 9, s * 2, 0, s * -4);
    shape.bezierCurveTo(s * -9, s * 2, s * -2, s * 5, 0, 0);
    return shape;
  }, []);

  const extrudeSettings = { 
    depth: 0.7, 
    bevelEnabled: true, 
    bevelSegments: 16, 
    steps: 2, 
    bevelSize: 0.45, 
    bevelThickness: 0.45 
  };

  return (
    <mesh {...props} rotation={[Math.PI, 0, 0]}>
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshPhysicalMaterial 
        color={color} 
        roughness={0.05} 
        metalness={0.1} 
        clearcoat={1} 
        reflectivity={1}
      />
    </mesh>
  );
}

function CursorHearts() {
  const { viewport, mouse } = useThree();
  const heartsCount = 10;
  const heartsRef = useRef<THREE.Group[]>([]);

  useFrame((state) => {
    const x = (mouse.x * viewport.width) / 2;
    const y = (mouse.y * viewport.height) / 2;

    heartsRef.current.forEach((ref, i) => {
      if (!ref) return;
      const t = state.clock.elapsedTime + i;
      ref.position.x = THREE.MathUtils.lerp(ref.position.x, x, 0.1 - i * 0.005);
      ref.position.y = THREE.MathUtils.lerp(ref.position.y, y, 0.1 - i * 0.005);
      ref.position.z = 1.5;
      ref.rotation.z = Math.sin(t * 3) * 0.5;
      ref.scale.setScalar(0.08 * (1 - i / heartsCount));
    });
  });

  return (
    <group>
      {Array.from({ length: heartsCount }).map((_, i) => (
        <group key={i} ref={(el) => (heartsRef.current[i] = el!)}>
          <HeartShape color={i % 2 === 0 ? "#ffb3c1" : "#ff85a1"} />
        </group>
      ))}
    </group>
  );
}

function MainHeart({ scale = 0.75, status = 'asking' }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();
  
  useFrame((state) => {
    if (meshRef.current) {
      const dx = (mouse.x * viewport.width) / 2 - meshRef.current.position.x;
      const dy = (mouse.y * viewport.height) / 2 - meshRef.current.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const proximity = Math.max(0, 1 - dist / 5);
      
      const speed = 1.0 + proximity * 1.5;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * speed) * (0.04 + proximity * 0.06);
      
      meshRef.current.rotation.y += 0.005;
      meshRef.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
    }
  });

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={meshRef} rotation={[Math.PI, 0, 0]}>
          <HeartShape color={status === 'accepted' ? "#ff1a4a" : "#ff4d6d"} />
          <MeshDistortMaterial
            color={status === 'accepted' ? "#ff0d35" : "#ff4d6d"}
            speed={1.0}
            distort={0.05}
            radius={1}
            roughness={0.02}
            metalness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            reflectivity={1.0}
            envMapIntensity={2.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

// --- Main App Component ---

export default function App() {
  const [status, setStatus] = useState<'asking' | 'accepted'>('asking');
  const [rejectionCount, setRejectionCount] = useState(0);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [yesScale, setYesScale] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const butterflyPositions = useRef<THREE.Vector3[]>([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNo = () => {
    // Restrict movement range on mobile to stay within visible center area
    const bounds = isMobile ? 80 : 250;
    const rx = (Math.random() - 0.5) * bounds;
    const ry = (Math.random() - 0.5) * (bounds * 0.6);
    setNoButtonPos({ x: rx, y: ry });
    setRejectionCount(prev => (prev + 1) % REJECTION_MESSAGES.length);
    setYesScale(prev => Math.min(prev + (isMobile ? 0.15 : 0.3), 3.5));
  };

  const handleYes = () => {
    setStatus('accepted');
    confetti({
      particleCount: isMobile ? 80 : 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff0000', '#ff69b4', '#ffffff', '#ffd700']
    });
    setTimeout(() => setShowLetter(true), 800);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#fffcf2] to-[#fff1f2] relative overflow-hidden selection:bg-pink-200">
      <audio ref={audioRef} loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
      
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-100 via-transparent to-transparent" />

      {/* Fixed UI controls - outside Canvas */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[100] flex flex-col items-center gap-2 md:gap-3">
        <button 
          onClick={toggleMusic}
          className="p-3 md:p-4 bg-white/70 backdrop-blur-xl rounded-full shadow-lg border border-white hover:bg-white/90 transition-all group relative"
        >
          {isPlaying ? 
            <Music className="text-pink-600 animate-pulse w-5 h-5 md:w-6 md:h-6" /> : 
            <Music2 className="text-gray-400 group-hover:text-pink-400 transition-colors w-5 h-5 md:w-6 md:h-6" />
          }
          {isPlaying && (
            <AnimatePresence>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -50, x: (i - 2) * 15 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  className="absolute top-0 left-1/2 text-pink-400 pointer-events-none"
                >
                  <Music4 size={14} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </button>
      </div>

      <InteractionContext.Provider value={{ butterflyPositions }}>
        <Canvas 
          camera={{ 
            position: [0, 0, isMobile ? 12 : 8], 
            fov: isMobile ? 45 : 45 
          }} 
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#ff85a1" />
          
          <Suspense fallback={null}>
            <PresentationControls
              global
              config={{ mass: 2, tension: 500 }}
              /* Fix: 'snap' might only accept a boolean in this environment's version of drei */
              snap
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 6, Math.PI / 6]}
              azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
              <MainHeart status={status} scale={status === 'accepted' ? (isMobile ? 1.6 : 1.4) : (isMobile ? 0.8 : 0.75)} />
              <CursorHearts />
              <Garden />
              <Butterflies />
              <Sparkles count={120} scale={20} size={4} speed={0.4} opacity={0.5} color="#ffb3c1" />
            </PresentationControls>

            {/* Title - Fixed relative to view, outside PresentationControls */}
            <Html center position={[0, status === 'asking' ? (isMobile ? 4.5 : 3.8) : (isMobile ? 5.5 : 4.8), 0]}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-screen px-6 pointer-events-none select-none z-10"
              >
                <h1 className="text-4xl md:text-8xl font-cursive text-pink-600 drop-shadow-[0_5px_15px_rgba(219,39,119,0.3)] leading-tight">
                  {status === 'asking' ? "Will You Be My Valentine?" : "It's a Yes! ❤️"}
                </h1>
                <p className="text-pink-400/80 text-xs md:text-xl font-bold mt-2 md:mt-4 tracking-widest uppercase">
                  {status === 'asking' ? "Welcome to our heart garden" : "My dream come true"}
                </p>
              </motion.div>
            </Html>

            {/* Buttons - Fixed relative to view, outside PresentationControls */}
            {status === 'asking' && (
              <Html center position={[0, isMobile ? -3.5 : -2.8, 0]}>
                <div className="flex flex-col items-center gap-6 md:gap-12 w-screen px-4">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                    <motion.button
                      style={{ scale: yesScale }}
                      onClick={handleYes}
                      whileHover={{ scale: yesScale * 1.05 }}
                      whileTap={{ scale: yesScale * 0.95 }}
                      className="bg-gradient-to-br from-pink-400 to-rose-500 text-white px-8 py-3 md:px-14 md:py-6 rounded-full text-xl md:text-3xl font-bold shadow-xl border-b-4 md:border-b-8 border-rose-700 active:border-b-0 active:translate-y-1 relative"
                    >
                      <span className="relative z-10">Yes 💖</span>
                    </motion.button>

                    <motion.button
                      animate={{ x: noButtonPos.x, y: noButtonPos.y }}
                      onMouseEnter={!isMobile ? handleNo : undefined}
                      onClick={handleNo}
                      className="bg-white/90 backdrop-blur-md text-gray-400 px-6 py-3 md:px-8 md:py-4 rounded-full text-lg md:text-xl font-bold shadow-lg border border-white hover:text-gray-600 transition-all whitespace-nowrap"
                    >
                      {rejectionCount === 0 ? "No 🙃" : REJECTION_MESSAGES[rejectionCount]}
                    </motion.button>
                  </div>
                </div>
              </Html>
            )}

            <Environment preset="sunset" />
            <ContactShadows position={[0, -4.5, 0]} opacity={0.3} scale={25} blur={3} far={5} />
          </Suspense>
        </Canvas>
      </InteractionContext.Provider>

      <AnimatePresence>
        {showLetter && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-pink-100/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-[#fff9f0] w-full max-w-lg rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border-[6px] md:border-[12px] border-white overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowLetter(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-pink-50 text-pink-300 transition-colors z-20"
              >
                <X size={24} />
              </button>

              <div className="p-6 pt-10 md:p-10 md:pt-16 text-center">
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="bg-pink-100 p-4 md:p-5 rounded-full ring-4 md:ring-8 ring-pink-50">
                    <MailOpen className="text-pink-500 w-10 h-10 md:w-12 md:h-12" />
                  </div>
                </div>

                <h2 className="text-2xl md:text-4xl font-cursive text-pink-700 mb-4 md:mb-6">To My Dear Valentine...</h2>
                
                <div className="space-y-3 md:space-y-4 text-pink-600/80 text-sm md:text-lg leading-relaxed font-medium">
                  <p>You’ve just made me the luckiest person in the world! 🌎</p>
                  <p>In this garden of life, you're the most beautiful flower. Here's why you're so special:</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {WHOLESOME_REASONS.map((reason, idx) => (
                      <motion.span 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + idx * 0.2 }}
                        className="bg-white px-2 py-1 md:px-4 md:py-2 rounded-xl text-[10px] md:text-sm shadow-sm border border-pink-50 text-pink-500"
                      >
                        ✨ {reason}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-pink-100 italic text-pink-400 text-xs md:text-base">
                  "Forever yours, with all my heart. 💌"
                </div>
              </div>
              
              <div className="h-2 md:h-3 bg-gradient-to-r from-pink-300 via-rose-400 to-pink-300" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .font-cursive {
          font-family: 'Pacifico', cursive;
        }
      ` }} />
    </div>
  );
}
