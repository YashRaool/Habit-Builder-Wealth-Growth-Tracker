import Card from '@/components/Card';

export default function PlaceholderPage({ title, emoji, desc }) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      <Card className="flex flex-col items-center text-center gap-3 py-20">
        <span className="text-5xl">{emoji}</span>
        <h1 className="text-stat font-bold" style={{ color: 'var(--ink)' }}>
          {title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: 360 }}>
          {desc}
        </p>
        <span className="badge-mint mt-2">Coming in the next task</span>
      </Card>
    </main>
  );
}
