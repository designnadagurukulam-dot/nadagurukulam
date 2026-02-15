const SectionDivider = () => (
  <div className="flex items-center justify-center py-6">
    <div className="h-px w-20 bg-gradient-to-r from-transparent to-secondary/50" />
    <div className="mx-3 relative">
      <svg width="40" height="40" viewBox="0 0 40 40" className="text-secondary animate-float" fill="none">
        <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <path d="M20 6 L22 18 L20 14 L18 18 Z" fill="currentColor" opacity="0.6" />
        <path d="M20 34 L18 22 L20 26 L22 22 Z" fill="currentColor" opacity="0.6" />
        <path d="M6 20 L18 18 L14 20 L18 22 Z" fill="currentColor" opacity="0.6" />
        <path d="M34 20 L22 22 L26 20 L22 18 Z" fill="currentColor" opacity="0.6" />
        <circle cx="20" cy="20" r="2.5" fill="currentColor" opacity="0.8" />
      </svg>
    </div>
    <div className="h-px w-20 bg-gradient-to-l from-transparent to-secondary/50" />
  </div>
);

export default SectionDivider;
