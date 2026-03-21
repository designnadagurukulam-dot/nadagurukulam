import { motion } from "framer-motion";

const SectionDivider = () => (
  <div className="flex items-center justify-center py-6 overflow-hidden">
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-px w-40 origin-right"
      style={{ background: "linear-gradient(90deg, transparent, hsl(33 62% 58% / 0.5), hsl(33 62% 58% / 0.7))" }}
    />
    <div className="mx-5 relative">
      <svg width="56" height="56" viewBox="0 0 56 56" className="text-secondary" fill="none">
        {/* Outer ring - rotates */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          style={{ transformOrigin: "28px 28px" }}
        >
          <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line key={angle} x1="28" y1="4" x2="28" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.25" transform={`rotate(${angle} 28 28)`} />
          ))}
        </motion.g>
        {/* Middle ring */}
        <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        {/* Inner ring */}
        <circle cx="28" cy="28" r="10" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
        {/* 4 main diamond petals */}
        <path d="M28 8 L30.5 26 L28 22 L25.5 26 Z" fill="currentColor" opacity="0.5" />
        <path d="M28 48 L25.5 30 L28 34 L30.5 30 Z" fill="currentColor" opacity="0.5" />
        <path d="M8 28 L26 25.5 L22 28 L26 30.5 Z" fill="currentColor" opacity="0.5" />
        <path d="M48 28 L30 30.5 L34 28 L30 25.5 Z" fill="currentColor" opacity="0.5" />
        {/* 4 diagonal petals */}
        <path d="M14.3 14.3 L25 27 L23 25 Z" fill="currentColor" opacity="0.25" />
        <path d="M41.7 14.3 L29 25 L31 27 Z" fill="currentColor" opacity="0.25" />
        <path d="M14.3 41.7 L25 29 L27 31 Z" fill="currentColor" opacity="0.25" />
        <path d="M41.7 41.7 L31 29 L29 31 Z" fill="currentColor" opacity="0.25" />
        {/* Center jewel with glow */}
        <circle cx="28" cy="28" r="4" fill="currentColor" opacity="0.75" />
        <motion.circle
          cx="28" cy="28" r="5"
          stroke="currentColor" strokeWidth="1" opacity="0.3"
          animate={{ r: [5, 7, 5], opacity: [0.3, 0.08, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
      </svg>
    </div>
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-px w-40 origin-left"
      style={{ background: "linear-gradient(90deg, hsl(33 62% 58% / 0.7), hsl(33 62% 58% / 0.5), transparent)" }}
    />
  </div>
);

export default SectionDivider;
