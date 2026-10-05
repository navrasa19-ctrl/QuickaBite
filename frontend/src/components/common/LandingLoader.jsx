import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import QuikaBiteLogo from "./QuikaBiteLogo";

export default function LandingLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);

  // Smooth progress increment
  useEffect(() => {
    let startTimestamp = null;
    const duration = 2000; // 2.0 seconds loading duration

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(currentProgress);

      if (elapsed < duration) {
        window.requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          onComplete();
        }, 200);
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden select-none"
      id="landing-loader-overlay"
    >
      {/* Subtle radial glow background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-50/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Center Branding Content */}
      <div className="flex flex-col items-center z-10 text-center px-4">
        {/* Scale up and float logo container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: [0, -6, 0],
          }}
          transition={{
            scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.6 },
            y: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            },
          }}
          className="flex justify-center"
        >
          <QuikaBiteLogo size="xl" showText={true} className="filter drop-shadow-[0_10px_25px_rgba(0,113,45,0.06)]" />
        </motion.div>

        {/* Loading text status indicator */}
        <div className="mt-10 flex items-center justify-center">
          <p className="text-[#FF6B35] font-display font-black text-xs sm:text-sm tracking-[0.25em] uppercase animate-pulse">
            Loading...
          </p>
        </div>

        {/* Minimalist Loader Bar */}
        <div className="w-56 sm:w-64 h-1 bg-neutral-100 border border-neutral-200/50 rounded-full overflow-hidden mt-4 relative">
          {/* Fill indicator */}
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF6B35] via-emerald-600 to-[#FF6B35] rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Subtle light shimmer sweep across progress bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>

        {/* Progress Percentage Display */}
        <span className="text-[11px] font-mono font-bold text-neutral-400 mt-2.5 tracking-wider">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-neutral-400 font-bold">
          © 2026 Quickaa Bite • Quick, tasty and always fresh
        </p>
      </div>
    </motion.div>
  );
}

