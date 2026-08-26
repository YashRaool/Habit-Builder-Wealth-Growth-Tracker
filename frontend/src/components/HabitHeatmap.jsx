/**
 * HabitHeatmap — 12-week grid of daily completion dots
 * Props:
 *   logs   – array of { date: string, completed: boolean }
 *   weeks  – number of week columns to show (default 12)
 */
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getGrid(logs, weeks) {
  const logMap = {};
  for (const l of logs) {
    const key = l.date?.toString().slice(0, 10);
    if (key) logMap[key] = l.completed;
  }

  // Build a full weeks×7 grid ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Snap end to Saturday of current week
  const dayOfWeek = today.getDay(); // 0=Sun
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col = [];
    for (let d = 0; d <= 6; d++) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - w * 7 - (6 - d));
      const key = date.toISOString().slice(0, 10);
      const isFuture = date > today;
      col.push({ key, isFuture, completed: logMap[key] ?? null });
    }
    cells.push(col);
  }
  return cells;
}

export default function HabitHeatmap({ logs = [], weeks = 12 }) {
  const grid = getGrid(logs, weeks);
  const completedCount = logs.filter(l => l.completed).length;

  return (
    <div>
      <div className="flex gap-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((l, i) => (
            <span key={i} style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 600,
                                   height: 12, lineHeight: '12px', width: 10, textAlign: 'center' }}>
              {i % 2 === 1 ? l : ''}
            </span>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {grid.map((col, w) => (
            <div key={w} className="flex flex-col gap-1">
              {col.map(({ key, isFuture, completed }) => {
                const bg = isFuture
                  ? 'transparent'
                  : completed === true
                    ? 'var(--coral)'
                    : completed === false
                      ? 'var(--border)'
                      : 'var(--border)';
                const opacity = isFuture ? 0 : completed ? 1 : 0.4;
                return (
                  <div
                    key={key}
                    title={key}
                    style={{
                      width: 12, height: 12,
                      borderRadius: 3,
                      background: bg,
                      opacity,
                      transition: 'background 0.3s ease, opacity 0.3s ease',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
          {completedCount} completions in last {weeks} weeks
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--border)', opacity: 0.4 }} />
          <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Miss</span>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--coral)', marginLeft: 6 }} />
          <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Done</span>
        </div>
      </div>
    </div>
  );
}
