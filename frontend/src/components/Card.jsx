/**
 * Card — base surface component.
 *
 * Props:
 *   className  – extra Tailwind classes
 *   as         – element tag (default: 'div')
 *   hover      – show lift on hover (default: true)
 *   padding    – override inner padding (default: 'p-5')
 *   children
 */
export default function Card({
  children,
  className = '',
  as: Tag = 'div',
  hover = true,
  padding = 'p-5',
}) {
  return (
    <Tag
      className={`card ${padding} ${hover ? 'hover:shadow-card-md' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ─── Compound sub-components ─── */

/** Label above a stat */
Card.Label = function CardLabel({ children, className = '' }) {
  return (
    <p className={`text-label mb-1 ${className}`}>
      {children}
    </p>
  );
};

/** Hero number inside a stat card */
Card.Stat = function CardStat({ children, className = '' }) {
  return (
    <p className={`text-stat font-bold ${className}`} style={{ color: 'var(--ink)' }}>
      {children}
    </p>
  );
};

/**
 * Colored delta badge
 * direction: 'up' | 'down' | 'neutral'
 */
Card.Delta = function CardDelta({ children, direction = 'neutral' }) {
  const cls =
    direction === 'up'   ? 'badge-mint' :
    direction === 'down' ? 'badge-rose' :
                           'badge-muted';
  const arrow =
    direction === 'up'   ? '↑ ' :
    direction === 'down' ? '↓ ' : '';

  return <span className={cls}>{arrow}{children}</span>;
};
