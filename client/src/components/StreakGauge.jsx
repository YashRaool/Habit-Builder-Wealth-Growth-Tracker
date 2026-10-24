/**
 * StreakGauge — coral SVG circular gauge (signature element)
 * Props:
 *   streak   – current streak count
 *   max      – value at which ring is full (default 30)
 *   label    – text below gauge
 *   size     – outer px size (default 80)
 *   showText – show center number (default true)
 *   strokeWidth – ring thickness (default auto-scaled)
 */
export default function StreakGauge({
  streak = 0,
  max = 30,
  label = 'Streak',
  size = 80,
  showText = true,
  strokeWidth,
}) {
  const sw     = strokeWidth ?? Math.max(3, size * 0.07);
  const r      = (size / 2) - sw;
  const circ   = 2 * Math.PI * r;
  const pct    = Math.min(Math.max(streak / max, 0), 1);
  const offset = circ * (1 - pct);

  // Color shifts coral→mint when >80%
  const fillColor = pct >= 0.8 ? 'var(--mint)' : 'var(--coral)';

  return (
    <div className="flex flex-col items-center gap-1" title={`${label}: ${streak}${max ? ` / ${max}` : ''}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size} height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label}: ${streak} of ${max}`}
        >
          {/* Track ring */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          {/* Fill ring */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={fillColor}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1), stroke 0.4s ease' }}
          />
        </svg>

        {showText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold leading-none" style={{ fontSize: size * 0.28, color: fillColor }}>
              {streak}
            </span>
            {size >= 64 && (
              <span className="leading-none mt-0.5" style={{ fontSize: size * 0.12, color: 'var(--muted)' }}>
                days
              </span>
            )}
          </div>
        )}
      </div>

      {label && (
        <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.06em',
                       textTransform: 'uppercase', color: 'var(--muted)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
