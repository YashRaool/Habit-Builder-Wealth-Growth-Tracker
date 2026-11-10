import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Flame, Lock, LogOut, Loader2,
  Check, Shield, Sparkles, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../api/auth';

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: '$ USD' },
  { code: 'INR', symbol: '₹', label: '₹ INR' },
  { code: 'EUR', symbol: '€', label: '€ EUR' },
];

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    bio: '',
    currency: 'USD',
    monthlySavingsTarget: 20,
  });

  // Sync state whenever drawer opens or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || user.picture || '',
        bio: user.bio || user.tagline || 'Building wealth through daily discipline',
        currency: user.currency || 'USD',
        monthlySavingsTarget: user.monthlySavingsTarget || user.savingsRate || 20,
      });
    }
  }, [user, isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    setSaving(true);
    const updates = {
      name: formData.name.trim(),
      currency: formData.currency,
      bio: formData.bio.trim(),
      monthlySavingsTarget: Number(formData.monthlySavingsTarget),
    };

    try {
      const res = await authAPI.updateProfile(updates);
      const serverUser = res?.data?.data?.user;
      if (serverUser) {
        updateUser(serverUser);
      } else {
        updateUser(updates);
      }
      toast.success('Profile updated successfully');
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    onClose?.();
    logout();
    navigate('/login');
  };

  const isGoogleUser = Boolean(user?.googleId);

  return (
    <>
      {/* ── 1. Backdrop Overlay ── */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── 2. Luxury Slide-Over Panel ── */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-drawer-title"
      >
        {/* ── Top Gradient Header Banner ── */}
        <div className="h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 relative shrink-0 p-4 flex items-start justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Overlapping Avatar & Verification Pill ── */}
        <div className="-mt-10 px-6 flex items-end justify-between shrink-0">
          <div className="relative">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt={formData.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-md object-cover bg-white shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-md bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shrink-0">
                {getInitials(formData.name)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs">
              <Sparkles size={12} className="text-indigo-600 fill-indigo-100" />
            </div>
          </div>

          {/* Verification Pill */}
          <div className="mb-1">
            {isGoogleUser ? (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                <Check size={13} className="text-emerald-600 stroke-[2.5]" />
                <span>✓ Google Verified</span>
              </div>
            ) : (
              <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                <Lock size={12} className="text-indigo-600" />
                <span>🔒 JWT Account</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Interactive Editable Sections ── */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
          </div>

          {/* Financial Motto / Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Financial Motto / Bio
            </label>
            <input
              type="text"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              maxLength={90}
              placeholder="e.g. Building wealth through daily discipline"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
          </div>

          {/* Connected Email (Read-only badge with lock icon) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Connected Email
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Lock size={11} /> Read-only
              </span>
            </div>
            <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-600 flex items-center justify-between shadow-2xs select-none">
              <span className="truncate">{formData.email}</span>
              <Lock size={14} className="text-slate-400 shrink-0 ml-2" />
            </div>
          </div>

          {/* Preferred Currency Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Preferred Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCY_OPTIONS.map((c) => {
                const selected = formData.currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: c.code })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {selected && <Check size={13} className="shrink-0" />}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Savings Rate Target (%) Slider (10% to 70%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Monthly Savings Rate Target (%)
              </label>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                {formData.monthlySavingsTarget}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="1"
              value={formData.monthlySavingsTarget}
              onChange={(e) => setFormData({ ...formData, monthlySavingsTarget: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>10% Conservative</span>
              <span>25% Recommended</span>
              <span>70% Ambitious</span>
            </div>
          </div>

          {/* 3-Column Mini Telemetry Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Active Streak
              </p>
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-800">
                <Flame size={13} className="text-amber-500 fill-amber-500" />
                <span>7 Days</span>
              </div>
            </div>

            <div className="space-y-0.5 border-x border-slate-200/80">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Account Role
              </p>
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-800">
                <Shield size={13} className={isAdmin ? 'text-rose-600' : 'text-indigo-600'} />
                <span>{isAdmin ? 'Admin' : 'Member'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Status
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </form>

        {/* ── Footer Actions ── */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold rounded-xl py-2.5 flex-1 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-sm shrink-0"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
