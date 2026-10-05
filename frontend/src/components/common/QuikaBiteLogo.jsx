/**
 * Quickaa Bite logo — compact symbol + wordmark (Brand Guidelines §2).
 *  - Symbol: a "Q" ring with a bite taken out of it and speed lines on the left.
 *  - Flat colours only: no shadows, no gradients.
 *  - `showText={false}` renders the symbol alone (favicon / compact placements).
 */
export function QuickaaSymbol({ className = "" }) {
  return (
    <svg
      viewBox="0 0 56 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Quickaa Bite"
    >
      <defs>
        <mask id="qb-bite" maskUnits="userSpaceOnUse" x="0" y="0" width="56" height="48">
          <rect width="56" height="48" fill="#fff" />
          <circle cx="42.5" cy="9.5" r="7.5" fill="#000" />
        </mask>
      </defs>
      {/* speed lines */}
      <path d="M3 18h9M1 26h11M5 34h7" stroke="#182033" strokeWidth="3.5" strokeLinecap="round" />
      {/* Q ring with a bite */}
      <circle cx="32" cy="23" r="14" stroke="#FF6B35" strokeWidth="7" mask="url(#qb-bite)" />
      {/* Q tail */}
      <path d="M38 31l8 9" stroke="#182033" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function QuikaBiteLogo({
  className = "",
  showText = true,
  size = "md",
  showTagline,
}) {
  const dims = {
    sm: { box: "h-8 w-9", text: "text-base", sub: "hidden" },
    md: { box: "h-9 w-11", text: "text-[1.05rem] sm:text-xl", sub: "hidden" },
    lg: { box: "h-16 w-[4.5rem]", text: "text-3xl", sub: "text-xs" },
    xl: { box: "h-28 w-32", text: "text-5xl", sub: "text-sm" },
  }[size] || { box: "h-9 w-11", text: "text-xl", sub: "hidden" };

  const tagline = showTagline ?? (size === "lg" || size === "xl");

  return (
    <div
      className={`flex items-center gap-2.5 select-none ${className}`}
      id="Quikabite-logo-component"
    >
      <QuickaaSymbol className={`${dims.box} shrink-0`} />

      {showText && (
        <div className="flex flex-col text-left min-w-0" id="Quikabite-brand-text">
          <span
            className={`font-extrabold leading-none tracking-tight whitespace-nowrap ${dims.text}`}
          >
            <span className="text-brand-dark">QUICKAA</span>{" "}
            <span className="text-brand-orange">BITE</span>
          </span>
          {tagline && (
            <span className={`mt-1.5 font-semibold text-gray-500 ${dims.sub}`}>
              Quick, tasty and always fresh
            </span>
          )}
        </div>
      )}
    </div>
  );
}
