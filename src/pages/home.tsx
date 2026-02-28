import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture, Stars, Preload, useProgress } from "@react-three/drei";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, RotateCcw, Heart, Sparkles } from "lucide-react";
import { PremiumCake, Table } from "@/components/PremiumCake"; // Adjust path if needed

// Images
import mem1 from "@/assets/images/memory-1.jpg";
import mem2 from "@/assets/images/memory-2.jpg";
import mem3 from "@/assets/images/memory-3.jpg";
import mem4 from "@/assets/images/memory-4.jpg";
import mem5 from "@/assets/images/memory-5.jpg";
import mem6 from "@/assets/images/memory-6.jpg";

const memoryImages = [mem1, mem2, mem3, mem4, mem5, mem6];

// Preload images safely for Next.js/React
if (typeof window !== "undefined") {
  memoryImages.forEach((src) => useTexture.preload(src));
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, delay = 38, startDelay = 300) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, delay);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, delay, startDelay]);
  return { displayed, done };
}

// ── Floating hearts layer ─────────────────────────────────────────────────────
const HEARTS = ["💛", "🌸", "✨", "💖", "🎂", "⭐", "🌟", "💫"];
function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: HEARTS[i % HEARTS.length],
      left: `${Math.random() * 95}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 8}s`,
      size: `${0.9 + Math.random() * 1.2}rem`,
    }))
  ).current;

  return (
    <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-[-3rem] select-none"
          style={{
            left: p.left,
            fontSize: p.size,
            animation: `floatUp ${p.duration} ${p.delay} linear infinite`,
            opacity: 0,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

// ── Single photo lying flat on the table ────────────────────────────────────
function TablePhoto({
  url, x, z, rotY, active,
}: {
  url: string; x: number; z: number; rotY: number; active: boolean;
}) {
  const texture = useTexture(url);
  const opacity = active ? 1 : 0;
  const W = 2.0, H = 1.5;
  const BORDER = 0.07;
  const tableY = -0.49; // just above table surface

  return (
    <group position={[x, tableY, z]} rotation={[0, rotY, 0]}>
      {/* White polaroid border — flat on table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W + BORDER * 2, H + BORDER * 2]} />
        <meshStandardMaterial
          color="#fff8f0"
          roughness={0.55}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      {/* Photo image — polygon-offset above border to kill z-fighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          map={texture}
          toneMapped={false}
          transparent
          opacity={opacity}
          roughness={0.35}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

// ── Photos arranged on table around the cake ─────────────────────────────────
// r between cake base (2.6) and table rim (5.0) — use 3.5–4.3 sweet spot
const TABLE_PLACEMENTS: { r: number; aDeg: number; rotYDeg: number }[] = [
  { r: 3.7,  aDeg:   0, rotYDeg:  10 },
  { r: 3.9,  aDeg:  60, rotYDeg: -15 },
  { r: 3.6,  aDeg: 120, rotYDeg:   6 },
  { r: 3.8,  aDeg: 180, rotYDeg: -12 },
  { r: 3.7,  aDeg: 240, rotYDeg:  18 },
  { r: 3.9,  aDeg: 300, rotYDeg:  -8 },
];

// ── BG carousel: each image ×3, full 360°, large tiles, bob + tilt animation ──
// Each image appears 3 times around the full ring
const bgImagesFull = [...memoryImages, ...memoryImages, ...memoryImages];

// Stable per-card params (deterministic, no Math.random at render time)
const BG_CARD_DATA = Array.from({ length: bgImagesFull.length }, (_, i) => ({
  yBase: 0.6 + ((i * 7) % 11) * 0.22,          // 0.6 → 3.0, varied heights
  phase: (i * Math.PI * 2 * 0.618033988749895) % (Math.PI * 2), // golden-ratio phases
  rotVariance: (((i * 3 + 1) * 0.137) % 1 - 0.5) * 0.3,        // −0.15 … +0.15 rad tilt
}));

function BgCarousel({ active = false }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = bgImagesFull.length; // 18
  const R = 13;  // larger radius for bigger tiles
  const W = 5.0, H = 3.7;

  useFrame(() => {
    if (groupRef.current && active)
      groupRef.current.rotation.y += 0.0012;
  });

  return (
    <group ref={groupRef}>
      {bgImagesFull.map((src, i) => {
        const deg = (i / count) * 360;
        const baseRad = (deg * Math.PI) / 180;
        const x = Math.sin(baseRad) * R;
        const z = Math.cos(baseRad) * R;
        const rotY = baseRad + Math.PI;
        const { yBase, phase, rotVariance } = BG_CARD_DATA[i];
        return (
          <BgCard
            key={i}
            url={src}
            x={x} y={yBase} z={z}
            rotY={rotY}
            w={W} h={H}
            active={active}
            phase={phase}
            rotVariance={rotVariance}
          />
        );
      })}
    </group>
  );
}

// Reusable temp vector — allocated once, never recreated
const _worldPos = new THREE.Vector3();

function BgCard({ url, x, y, z, rotY, w, h, active, phase, rotVariance }: {
  url: string; x: number; y: number; z: number;
  rotY: number; w: number; h: number;
  active: boolean;
  phase: number;
  rotVariance: number;
}) {
  const texture = useTexture(url);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock, camera }) => {
    if (!matRef.current || !meshRef.current) return;

    // Up/down bob + random tilt animation
    const elapsed = clock.getElapsedTime();
    meshRef.current.position.y = y + Math.sin(elapsed * 0.65 + phase) * 0.45;
    meshRef.current.rotation.z = rotVariance + Math.sin(elapsed * 0.42 + phase * 1.3) * 0.07;

    if (!active) { matRef.current.opacity = 0; return; }

    // Card's actual world position (accounts for group auto-rotation AND camera orbit)
    meshRef.current.getWorldPosition(_worldPos);

    // Camera direction in XZ plane (from scene center toward camera)
    const cx = camera.position.x;
    const cz = camera.position.z;
    const camLen = Math.sqrt(cx * cx + cz * cz);
    if (camLen < 0.001) { matRef.current.opacity = 0; return; }

    // Card direction in XZ plane
    const wx = _worldPos.x;
    const wz = _worldPos.z;
    const cardLen = Math.sqrt(wx * wx + wz * wz);
    if (cardLen < 0.001) { matRef.current.opacity = 0; return; }

    // Dot product of the two unit vectors:
    // +1 = card is directly toward camera → hide
    // -1 = card is directly behind center from camera → show
    const dot = (wx / cardLen) * (cx / camLen) + (wz / cardLen) * (cz / camLen);

    if (dot > 0) {
      matRef.current.opacity = 0;
      return;
    }
    // Smooth ramp: fully visible at dot=-1, fades out as dot approaches 0
    const fade = THREE.MathUtils.clamp((-dot) / 0.45, 0, 1);
    matRef.current.opacity = 0.88 * fade;
  });

  return (
    <mesh ref={meshRef} position={[x, y, z]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        ref={matRef}
        map={texture}
        toneMapped={false}
        transparent
        opacity={0}
        roughness={0.7}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function PhotoGallery({ active = false }) {
  return (
    <group>
      {memoryImages.map((src, i) => {
        const p   = TABLE_PLACEMENTS[i % TABLE_PLACEMENTS.length];
        const rad = (p.aDeg * Math.PI) / 180;
        return (
          <TablePhoto
            key={i}
            url={src}
            x={Math.sin(rad) * p.r}
            z={Math.cos(rad) * p.r}
            rotY={(p.rotYDeg * Math.PI) / 180}
            active={active}
          />
        );
      })}
    </group>
  );
}

// ── Confetti burst sequence ───────────────────────────────────────────────────
function launchCelebration() {
  const colors = ["#DB3D68", "#D4AF37", "#ffffff", "#FF69B4", "#FFD700", "#FF85C2"];
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 }, colors });
  setTimeout(() => {
    confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
  }, 400);
  setTimeout(() => {
    confetti({ particleCount: 200, spread: 120, startVelocity: 30, origin: { y: 0.2 }, colors, gravity: 0.6 });
  }, 900);
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 }, shapes: ["circle"], colors: ["#DB3D68", "#FF69B4", "#FFB6C1"] });
  }, 1400);
}

// ── Step indicator dots ───────────────────────────────────────────────────────
const STEPS = ['landing', 'cake', 'message', 'final'] as const;
type Step = typeof STEPS[number];

function StepDots({ step }: { step: Step }) {
  if (step === 'landing') return null;
  const idx = STEPS.indexOf(step);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
      {STEPS.slice(1).map((s, i) => (
        <div
          key={s}
          className="rounded-full transition-all duration-500"
          style={{
            width: i === idx - 1 ? "1.5rem" : "0.5rem",
            height: "0.5rem",
            background: i <= idx - 1 ? "#DB3D68" : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState<Step>('landing');
  const [candleLit, setCandleLit] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { active: sceneLoading, progress: sceneProgress } = useProgress();
  const sceneReady = !sceneLoading && sceneProgress >= 100;

  // Check screen size for hybrid responsive approach
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnter = () => {
    // Force audio play on user interaction to bypass browser blocks
    if (audioRef.current) {
      audioRef.current.play().catch(() => console.log("Audio autoplay blocked by browser"));
      setIsPlaying(true);
    }
    setShowParticles(true);
    setStep('cake');
  };

  const handleBlowCandle = () => {
    setCandleLit(false);
    launchCelebration();
    setTimeout(() => setStep('message'), 2800);
  };

  const handleRestart = useCallback(() => {
    setCandleLit(true);
    setShowParticles(false);
    setStep('landing');
  }, []);

  // All message lines — shown one after another in a single card
  const allLines = [
    "Hey Sneha! 🌸",
    "",
    "Being your classmate has been",
    "one of the best parts of",
    "this journey. 💛",
    "",
    "Your smile, your energy &",
    "your kindness light up every",
    "room you walk into.",
    "",
    "You truly deserve all",
    "the happiness in the world! ✨",
    "",
    "On this special day, I wish",
    "you a year full of joy,",
    "success & everything you",
    "dream of. 🌟",
    "",
    "May every door open for you",
    "& every goal find its way.",
    "",
    "Keep shining, always.",
    "",
    "Happy Birthday, Sneha! 🎂🎉",
  ];

  return (
    <main className="fixed inset-0 w-full h-full bg-background overflow-hidden selection:bg-primary/30 font-sans">
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(0.8); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-110vh) scale(1.2) rotate(20deg); opacity: 0; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; text-shadow: 0 0 20px #DB3D68, 0 0 40px #D4AF37; }
          50%      { opacity: 1;   text-shadow: 0 0 40px #DB3D68, 0 0 80px #D4AF37, 0 0 120px #fff; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14%      { transform: scale(1.08); }
          28%      { transform: scale(1); }
          42%      { transform: scale(1.05); }
          70%      { transform: scale(1); }
        }
        .text-shimmer { animation: shimmer 3s ease-in-out infinite; }
        .heartbeat    { animation: heartbeat 2.2s ease-in-out infinite; }
        
        /* Custom scrollbar for mobile message view if it overflows */
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />

      {showParticles && <FloatingParticles />}
      <StepDots step={step} />

      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-10 h-10 md:w-12 md:h-12 bg-background/80 backdrop-blur-md border border-primary/30 rounded-full flex items-center justify-center text-primary shadow-xl"
        >
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </motion.button>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 60%, #1a0010 0%, #0a000d 55%, #000005 100%)" }} />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 40% at 50% 70%, rgba(180,20,80,0.18) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 30% at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 60%)" }} />

      <div className="absolute inset-0 z-[1]">
        <Canvas shadows camera={{ position: [0, 6, 13], fov: isMobile ? 50 : 40 }}>
          <Stars radius={80} depth={50} count={3000} factor={3} saturation={0.5} fade speed={0.6} />
          <ambientLight intensity={0.3} />
          <spotLight position={[6, 10, 8]} angle={0.2} penumbra={1} intensity={2.5} color="#ff8fa0" castShadow />
          <spotLight position={[-8, 6, -4]} angle={0.3} penumbra={1} intensity={1.2} color="#7090ff" />
          <pointLight position={[0, -3, 5]} color="#D4AF37" intensity={1.5} distance={12} />
          <Environment preset="night" resolution={256} />
          <Suspense fallback={null}>
            <Table />
            <PremiumCake candleLit={candleLit} />
            <PhotoGallery active={step !== 'landing'} />
            <BgCarousel active={step !== 'landing'} />
            <Preload all />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enableDamping={true}
            dampingFactor={0.05}
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
            autoRotate={false}
          />
        </Canvas>
      </div>

      <div className="relative z-10 w-full h-full pointer-events-none">
        <AnimatePresence mode="wait">

          {/* ── LANDING ── */}
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/65 backdrop-blur-md pointer-events-auto text-center px-4"
            >
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="flex flex-col items-center gap-6">
                <motion.div animate={{ rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }} className="text-5xl md:text-7xl">
                  👑
                </motion.div>
                <h1 className="text-4xl md:text-7xl font-serif text-shimmer text-primary leading-tight">
                  A Very Special<br /><span className="text-[#D4AF37]">Birthday</span>
                </h1>
                <p className="text-muted-foreground tracking-[0.25em] uppercase text-xs md:text-sm">— for Sneha  —</p>
                <div className="flex flex-col items-center gap-3 mt-4">
                  <motion.button
                    onClick={handleEnter}
                    disabled={!sceneReady}
                    whileHover={sceneReady ? { scale: 1.05, boxShadow: "0 0 60px rgba(219,61,104,0.7)" } : {}}
                    whileTap={sceneReady ? { scale: 0.97 } : {}}
                    className="px-10 py-4 md:px-14 md:py-5 bg-primary text-white rounded-full font-medium tracking-widest shadow-[0_0_30px_rgba(219,61,104,0.4)] transition-all text-sm md:text-base disabled:opacity-50 disabled:cursor-wait"
                  >
                    {sceneReady ? "✦ OPEN YOUR GIFT ✦" : "⏳ Preparing..."}
                  </motion.button>
                  {/* Loading progress bar */}
                  {!sceneReady && (
                    <div className="w-44 h-[3px] rounded-full overflow-hidden bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{ width: `${sceneProgress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  )}
                  {!sceneReady && (
                    <span className="text-[10px] tracking-widest text-white/30 uppercase">
                      {Math.round(sceneProgress)}% loaded
                    </span>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── CAKE ── */}
          {step === 'cake' && (
            <motion.div key="cake" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-16 pointer-events-none">
              <div className="pointer-events-auto text-center flex flex-col items-center gap-4 md:gap-5 px-4">
                <motion.h2 animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-xl md:text-4xl font-serif text-white" style={{ textShadow: "0 0 30px rgba(219,61,104,0.6)" }}>
                  Make your wish, Sneha ... 🕯️
                </motion.h2>
                <motion.button
                  onClick={handleBlowCandle}
                  whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(219,61,104,0.5)" }} whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 md:px-12 md:py-4 border border-primary/60 text-primary rounded-full hover:bg-primary/15 backdrop-blur-sm transition-all font-medium tracking-widest text-xs md:text-sm"
                >
                  💨 BLOW THE CANDLE
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── MESSAGE STEP — single centered card ── */}
          {step === 'message' && (
            <motion.div
              key="message"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center px-4 py-16"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}
                className="pointer-events-auto w-full max-w-[340px]"
                style={{
                  background: "rgba(12,0,20,0.90)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(219,61,104,0.35)", borderRadius: "1.4rem",
                  boxShadow: "0 0 50px rgba(219,61,104,0.18), 0 20px 60px rgba(0,0,0,0.65)",
                  padding: "1.6rem 1.8rem",
                }}
              >
                <div className="flex items-center gap-1.5 mb-4">
                  <Heart size={13} className="text-primary fill-primary" />
                  <span className="text-[9px] tracking-[0.25em] uppercase text-primary/60">A message for you</span>
                </div>
                <MessageCard lines={allLines} onDone={() => {}} startDelay={150} direction="left" />
                <motion.button
                  onClick={() => setStep('final')}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 7, duration: 0.5, ease: "backOut" }}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                  className="mt-6 w-full py-2.5 rounded-full bg-primary/20 border border-primary/50 text-primary text-sm font-medium tracking-widest hover:bg-primary/35 transition-all"
                  style={{ boxShadow: "0 0 24px rgba(219,61,104,0.25)" }}
                >
                  Continue →
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ── FINAL ── */}
          {step === 'final' && (
            <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-16 px-4">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.9 }} className="text-center">
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif heartbeat text-transparent bg-clip-text" style={{ background: "linear-gradient(135deg, #DB3D68 0%, #D4AF37 50%, #FF85C2 100%)", WebkitBackgroundClip: "text", filter: "drop-shadow(0 0 30px rgba(219,61,104,0.5))" }}>
                  Happy Birthday
                </h1>
                <div className="text-3xl md:text-6xl font-serif mt-1 text-transparent bg-clip-text" style={{ background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)", WebkitBackgroundClip: "text", filter: "drop-shadow(0 0 20px rgba(212,175,55,0.6))" }}>
                  Sneha  ✨
                </div>
              </motion.div>

              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.9 }} className="pointer-events-auto text-center flex flex-col items-center gap-4 pb-8 md:pb-0">
                <p className="text-sm md:text-lg text-white/70 italic max-w-sm leading-relaxed">
                  "Wishing you a day as beautiful<br />and wonderful as you are, Sneha! 🌸"
                </p>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  <motion.button onClick={() => launchCelebration()} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-primary/20 border border-primary/40 text-primary rounded-full text-xs md:text-sm font-medium tracking-wider hover:bg-primary/30 transition-all backdrop-blur-sm">
                    <Sparkles size={15} /> CELEBRATE AGAIN
                  </motion.button>
                  <motion.button onClick={handleRestart} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white/5 border border-white/20 text-white/60 rounded-full text-xs md:text-sm font-medium tracking-wider hover:bg-white/10 transition-all backdrop-blur-sm">
                    <RotateCcw size={14} /> RESTART
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

// ── Typewriter message card ───────────────────────────────────────────────────
function MessageCard({ lines, onDone, startDelay = 200, direction = 'left' }: { lines: string[]; onDone: () => void; startDelay?: number; direction?: 'left' | 'right' }) {
  const fullText = lines.join("\n");
  const { displayed, done } = useTypewriter(fullText, 36, startDelay);

  useEffect(() => { if (done) onDone(); }, [done, onDone]);

  const parts = displayed.split("\n");
  const xInit = direction === 'left' ? -30 : 30;

  return (
    <div className="font-mono text-[11px] md:text-sm text-primary-foreground/90 leading-relaxed min-h-[8rem]">
      {parts.map((line, i) => {
        if (line === "") return <div key={i} className="h-2" />;
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: xInit }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}
            className={
              i === 0 ? "text-primary font-semibold mb-1"
                : line.includes("UNLOCKED") || line.includes("Birthday") || line.includes("✨")
                  ? "text-[#D4AF37]" : "text-white/80"
            }
          >
            {line}
          </motion.p>
        );
      })}
      {!done && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse align-middle" />}
    </div>
  );
}