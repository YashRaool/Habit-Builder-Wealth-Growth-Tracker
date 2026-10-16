import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-emerald-500/20">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold tracking-wide mb-6 shadow-xs">
          <TrendingUp size={14} className="text-emerald-600" />
          FinHabit Wealth Platform
        </div>

        <Card className="p-8 shadow-card text-center border-slate-200/90">
          <p className="text-6xl font-black text-slate-300 tracking-tight tabular-nums">404</p>
          <h1 className="text-xl font-bold text-slate-900 mt-3">Ledger Route Not Found</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The requested financial portal endpoint or account view does not exist or may have been relocated.
          </p>

          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
            <Link to="/dashboard">
              <Button size="md" className="gap-2">
                <ArrowLeft size={15} /> Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
