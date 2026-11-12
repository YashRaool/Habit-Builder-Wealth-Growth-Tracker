import {
  LayoutDashboard, ArrowLeftRight, Flame, Target, TrendingUp,
  PanelLeftClose, UserCog, LogOut, Plus
} from 'lucide-react';
import logoMark from '../../assets/logo-mark.png';

export default function MockDashboardPreview() {
  return (
    <div
      className="fixed inset-0 overflow-hidden flex bg-slate-50 pointer-events-none select-none filter contrast-105"
      aria-hidden="true"
    >
      {/* ── Mock Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-200/80 hidden md:flex flex-col shrink-0 h-screen">
        {/* Logo */}
        <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img src={logoMark} alt="WealthHabit" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <span className="text-slate-900 font-bold text-base tracking-tight block leading-tight">
                Wealth<span className="text-[#4F46E5]">Habit</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Growth Loop
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-xl text-slate-400">
            <PanelLeftClose size={18} />
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 p-3 space-y-1.5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-600">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600">
            <ArrowLeftRight size={19} className="text-slate-400" />
            <span>Tracker</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600">
            <Flame size={19} className="text-slate-400" />
            <span>Habits</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600">
            <Target size={19} className="text-slate-400" />
            <span>Goals</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600">
            <TrendingUp size={19} className="text-slate-400" />
            <span>Analytics</span>
          </div>
        </div>

        {/* Bottom User Profile */}
        <div className="p-3 border-t border-slate-200/80 space-y-2 bg-slate-50/40">
          <div className="bg-amber-50 text-amber-800 border border-amber-200/70 px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500 fill-amber-500 shrink-0" />
              <span>Habit Streak</span>
            </div>
            <span className="bg-amber-100/90 text-amber-900 px-1.5 py-0.5 rounded-md font-bold text-[11px]">7d</span>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              AC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Alex Chen</p>
              <p className="text-[11px] text-slate-400 truncate">alex@finance.app</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mock Content Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Slim Top Header */}
        <header className="h-16 bg-white/85 border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 text-slate-400">
              <PanelLeftClose size={20} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium hidden sm:inline">Overview</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-bold text-slate-800 tracking-tight text-base sm:text-lg">
                Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Flame size={13} className="text-amber-500 fill-amber-500" />
              <span>7d Streak</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                AC
              </div>
              <span className="text-xs font-semibold text-slate-700">Alex Chen</span>
              <UserCog size={14} className="text-slate-400" />
            </div>
            <div className="p-2 text-slate-400">
              <LogOut size={18} />
            </div>
          </div>
        </header>

        {/* Dashboard Canvas Preview */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-hidden">
          {/* Greeting & Action CTAs */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back, Alex 👋
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Financial Overview</p>
            </div>
            <div className="flex gap-2">
              <div className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 shadow-xs">
                <Plus size={16} /> Add Expense
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700">
                Add Income
              </div>
            </div>
          </div>

          {/* 4 Bento KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Worth</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">$44,700</p>
              <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                <TrendingUp size={13} /> +12.4% this month
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Cashflow</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">+$3,450</p>
              <p className="text-xs text-slate-500 mt-2">In: $6,200 · Out: $2,750</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Savings Rate</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">55.6%</p>
              <p className="text-xs text-slate-500 mt-2">Target: 20%</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Streaks</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">7 Days</p>
              <p className="text-xs text-slate-500 mt-2">3 routines on track</p>
            </div>
          </div>

          {/* 2-Column Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active Habit Streaks */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Flame size={18} className="text-amber-500 fill-amber-500" />
                  Active Habit Streaks
                </h3>
                <span className="text-xs font-semibold text-indigo-600">View All</span>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">No dining out on weekdays</p>
                    <p className="text-xs text-slate-500">Daily routine · Saved $140/wk</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold">14d 🔥</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Invest $50 daily index fund</p>
                    <p className="text-xs text-slate-500">Daily routine · Automated</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold">21d 🔥</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Log all transactions</p>
                    <p className="text-xs text-slate-500">Daily discipline</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold">7d 🔥</span>
                </div>
              </div>
            </div>

            {/* Right: Savings Goals Progress */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-indigo-600" />
                  Savings Goals Progress
                </h3>
                <span className="text-xs font-semibold text-indigo-600">3 Active</span>
              </div>
              <div className="space-y-3">
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">Emergency Fund</span>
                    <span className="font-bold text-indigo-600">$8,500 / $10,000 (85%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[85%] rounded-full" />
                  </div>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">House Down Payment</span>
                    <span className="font-bold text-emerald-600">$24,000 / $50,000 (48%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[48%] rounded-full" />
                  </div>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">Tech ETF Portfolio</span>
                    <span className="font-bold text-indigo-600">$12,200 / $15,000 (81%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[81%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

