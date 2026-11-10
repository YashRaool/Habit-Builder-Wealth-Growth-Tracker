import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, Sparkles, Mail,
  Loader2, ArrowRight
} from 'lucide-react';
import MockDashboardPreview from './MockDashboardPreview';
import { authAPI } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AuthSpotlight({ initialMode = 'login', initialExpanded = false }) {
  const { user, login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    currency: 'USD',
  });
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated and not currently transitioning
  if (user && !isUnlocking) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const e = {};
    if (mode === 'register') {
      if (!form.name.trim()) e.name = 'Name is required';
      else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    }
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doLogin = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data.data;
    login(token, userData);
    setIsUnlocking(true);
    toast.success(`Welcome back, ${userData.name}!`);
    setTimeout(() => {
      navigate('/dashboard');
    }, 250);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        await doLogin(form.email, form.password);
      } else {
        const res = await authAPI.register({
          name: form.name.trim(),
          email: form.email,
          password: form.password,
          currency: form.currency,
        });
        const { token, user: userData } = res.data.data;
        login(token, userData);
        setIsUnlocking(true);
        toast.success(`Account created! Welcome, ${userData.name}!`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 250);
      }
    } catch (err) {
      setIsUnlocking(false);
      const msg = err.response?.data?.message || (mode === 'login' ? 'Login failed' : 'Registration failed');
      toast.error(msg);
      if (err.response?.status === 401) {
        setErrors({ email: ' ', password: msg });
      } else if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '887933218734-2su6ainaurpgeh1jilr4lt4fplnlrpse.apps.googleusercontent.com';

    if (!clientId) {
      toast.error('Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in client/.env');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error('Google Identity Services script is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse?.error) {
            setLoading(false);
            if (tokenResponse.error !== 'access_denied') {
              toast.error(`Google Sign-In error: ${tokenResponse.error}`);
            }
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              setIsUnlocking(true);
              const userData = await loginWithGoogle({ token: tokenResponse.access_token });
              toast.success(`Signed in as ${userData.name} via Google`);
              setTimeout(() => {
                navigate('/dashboard');
              }, 250);
            } catch (err) {
              setIsUnlocking(false);
              toast.error(err.response?.data?.message || 'Failed to authenticate with Google.');
            } finally {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        },
        error_callback: (err) => {
          setLoading(false);
          console.error('Google OAuth popup error:', err);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setLoading(false);
      console.error('Google initialization error:', err);
      toast.error('Failed to open Google Sign-In popup.');
    }
  };

  const handleFillDemo = async () => {
    setIsExpanded(true);
    setMode('login');
    const demoEmail = 'alex@finance.app';
    const demoPassword = 'Password123!';
    setForm((prev) => ({ ...prev, email: demoEmail, password: demoPassword }));
    setErrors({});
    setLoading(true);
    try {
      await doLogin(demoEmail, demoPassword);
    } catch (err) {
      setIsUnlocking(false);
      toast.error(err.response?.data?.message || 'Demo login failed. Please verify the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ── 1. Live Blurred Dashboard Background Preview ── */}
      <MockDashboardPreview />

      {/* ── 2. Frosted Glass Lock Layer Overlay ── */}
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto transition-all duration-500 ease-out ${
          isUnlocking
            ? 'bg-transparent backdrop-blur-none pointer-events-none'
            : 'bg-slate-900/25 backdrop-blur-md'
        }`}
      >
        {/* ── 3. Compact Google-First Spotlight Auth Card ── */}
        <div
          className={`max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 p-6 sm:p-8 relative z-50 my-auto transition-all duration-350 ease-out ${
            isUnlocking
              ? 'opacity-0 scale-95 pointer-events-none'
              : 'animate-in fade-in zoom-in-95 duration-300 opacity-100 scale-100'
          }`}
        >
          {/* Top Live Preview Pill */}
          <div className="flex justify-center mb-5">
            <div className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs text-center">
              <Lock size={12} className="shrink-0 text-indigo-600" />
              <span>Interactive Preview — Sign in to unlock your workspace</span>
            </div>
          </div>

          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center bg-indigo-600 text-white rounded-2xl w-12 h-12 font-bold text-xl shadow-md mb-3 transition-transform hover:scale-105">
              W
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              WealthHabit
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Build daily financial habits. Compound your net worth.
            </p>
          </div>

          {/* ── PRIMARY HERO ACTION — Upgraded Google Login ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 font-semibold text-slate-800 cursor-pointer group"
          >
            <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── PROGRESSIVE DISCLOSURE — Expandable Email/Password Form ── */}
          {!isExpanded ? (
            <div>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail size={16} className="text-slate-500" />
                <span>Continue with Email &amp; Password</span>
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrors({}); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrors({}); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* 1-Click Demo Helper Chip strictly inside expanded section */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-slate-400 font-medium">Quick Evaluator Access:</span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition-colors cursor-pointer"
                  title="Auto-login with Alex Johnson demo account"
                >
                  <Sparkles size={12} className="text-indigo-600" />
                  <span>Try Demo Account (Alex Johnson)</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Chen"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: null });
                      }}
                      className={`w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 rounded-xl px-3.5 py-2 text-sm transition-all shadow-2xs ${
                        errors.name ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
                      }`}
                    />
                    {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    className={`w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 rounded-xl px-3.5 py-2 text-sm transition-all shadow-2xs ${
                      errors.email ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
                    }`}
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
                      className={`w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 rounded-xl px-3.5 py-2 text-sm pr-10 transition-all shadow-2xs ${
                        errors.password ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl py-2.5 px-4 font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
