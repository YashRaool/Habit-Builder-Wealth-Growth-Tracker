import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { DollarSign, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const DEMO_ACCOUNTS = [
  { label: 'Demo User', email: 'alex@finance.app', password: 'Password123!', icon: User, color: 'emerald' },
  { label: 'Demo Admin', email: 'admin@finance.app', password: 'Password123!', icon: ShieldCheck, color: 'violet' },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // index of demo account loading
  const [showPass, setShowPass] = useState(false);

  // Redirect if already authenticated
  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e = {};
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
    toast.success(`Welcome back, ${userData.name}!`);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await doLogin(form.email, form.password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      // Show inline error for auth failures
      if (err.response?.status === 401) {
        setErrors({ email: ' ', password: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (idx) => {
    const demo = DEMO_ACCOUNTS[idx];
    setDemoLoading(idx);
    setErrors({});
    try {
      await doLogin(demo.email, demo.password);
    } catch (err) {
      toast.error(err.response?.data?.message || `Demo login failed. Is the server and database running?`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/15 rounded-2xl mb-4 border border-emerald-500/20">
            <DollarSign size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your FinHabit account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({}); }}
            error={errors.email}
            autoComplete="email"
            id="login-email"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({}); }}
                className={`input-field pr-10 ${errors.password ? 'border-red-500/60' : ''}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && errors.password !== ' ' && (
              <p className="text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2" id="login-submit">
            Sign In
          </Button>

          {/* Demo login buttons */}
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center mb-3">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo, idx) => {
                const Icon = demo.icon;
                const isLoading = demoLoading === idx;
                const colorClasses = demo.color === 'emerald'
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                  : 'border-violet-500/20 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30';
                return (
                  <button
                    key={demo.email}
                    type="button"
                    disabled={demoLoading !== null || loading}
                    onClick={() => handleDemoLogin(idx)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 active:scale-95 disabled:opacity-50 ${colorClasses}`}
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon size={15} />
                    )}
                    {demo.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-600 text-center mt-2">
              Password: Password123!
            </p>
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
