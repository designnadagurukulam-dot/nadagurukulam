import { motion } from "framer-motion";

const SectionDivider = () => (
  <div className="flex items-center justify-center py-5 overflow-hidden">
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-px w-32 origin-right"
      style={{ background: "linear-gradient(90deg, transparent, hsl(43 72% 52% / 0.6))" }}
    />
    <div className="mx-4 relative">
      <svg width="52" height="52" viewBox="0 0 52 52" className="text-secondary" fill="none">
        {/* Outer ring - rotates */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          style={{ transformOrigin: "26px 26px" }}
        >
          <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 5" />
          {/* 8 outer petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="26"
              y1="4"
              x2="26"
              y2="8"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.2"
              transform={`rotate(${angle} 26 26)`}
            />
          ))}
        </motion.g>
        {/* Middle decorative ring */}
        <circle cx="26" cy="26" r="15" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        {/* Inner ring */}
        <circle cx="26" cy="26" r="9" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        {/* 4 main diamond petals */}
        <path d="M26 8 L28.5 24 L26 20 L23.5 24 Z" fill="currentColor" opacity="0.5" />
        <path d="M26 44 L23.5 28 L26 32 L28.5 28 Z" fill="currentColor" opacity="0.5" />
        <path d="M8 26 L24 23.5 L20 26 L24 28.5 Z" fill="currentColor" opacity="0.5" />
        <path d="M44 26 L28 28.5 L32 26 L28 23.5 Z" fill="currentColor" opacity="0.5" />
        {/* 4 diagonal petals */}
        <path d="M13.3 13.3 L23 25 L21 23 Z" fill="currentColor" opacity="0.25" />
        <path d="M38.7 13.3 L27 23 L29 25 Z" fill="currentColor" opacity="0.25" />
        <path d="M13.3 38.7 L23 27 L25 29 Z" fill="currentColor" opacity="0.25" />
        <path d="M38.7 38.7 L29 27 L27 29 Z" fill="currentColor" opacity="0.25" />
        {/* Center jewel with glow */}
        <circle cx="26" cy="26" r="3.5" fill="currentColor" opacity="0.7" />
        <motion.circle
          cx="26"
          cy="26"
          r="4.5"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
          animate={{ r: [4.5, 6, 4.5], opacity: [0.3, 0.1, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
      </svg>
    </div>
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-px w-32 origin-left"
      style={{ background: "linear-gradient(90deg, hsl(43 72% 52% / 0.6), transparent)" }}
    />
  </div>
);

export default SectionDivider;
