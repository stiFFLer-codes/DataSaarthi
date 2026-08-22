interface SaarthiLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

/**
 * SaarthiLogo — The Charioteer's Compass & Wheel.
 * 
 * Minimalist geometric mark evoking the chariot wheel (movement & progress)
 * and the navigational compass (direction & data intelligence).
 */
export function SaarthiLogo({ className = "", size = 28, animated = false }: SaarthiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${animated ? "animate-spin" : ""} ${className}`}
      style={{ animationDuration: animated ? "3s" : undefined }}
    >
      {/* Outer subtle guide orbit */}
      <circle
        cx="16"
        cy="16"
        r="13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 3"
        className="opacity-40"
      />
      {/* Inner solid wheel rim */}
      <circle
        cx="16"
        cy="16"
        r="10"
        stroke="currentColor"
        strokeWidth="1.75"
        className="opacity-90"
      />
      {/* 4 Cardinal Chariot / Compass Spokes */}
      <line x1="16" y1="2.5" x2="16" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="25.5" x2="16" y2="29.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2.5" y1="16" x2="6.5" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="25.5" y1="16" x2="29.5" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* 4 Diagonal Spokes */}
      <line x1="6.5" y1="6.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
      <line x1="22.5" y1="22.5" x2="25.5" y2="25.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
      <line x1="6.5" y1="25.5" x2="9.5" y2="22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
      <line x1="22.5" y1="9.5" x2="25.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />

      {/* Central Locus / Hub */}
      <circle cx="16" cy="16" r="3.25" fill="currentColor" />
      <circle cx="16" cy="16" r="1.25" fill="white" className="dark:fill-slate-900" />
    </svg>
  );
}

/**
 * SaarthiLoader — Effortless, minimalist loading indicator
 * combining the wheel orbit with a soft breathing guide glow.
 */
export function SaarthiLoader({
  size = 40,
  label = "Guiding your data...",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient halo glow */}
        <div
          className="absolute rounded-full bg-[hsl(var(--accent))] opacity-20 blur-md animate-pulse"
          style={{ width: size * 1.4, height: size * 1.4 }}
        />
        {/* Rotating Chariot Wheel */}
        <div className="relative text-[hsl(var(--accent))]">
          <SaarthiLogo size={size} animated />
        </div>
      </div>
      {label && (
        <span className="text-xs font-mono tracking-wider uppercase text-[hsl(var(--text-tertiary))] animate-fade-up">
          {label}
        </span>
      )}
    </div>
  );
}
