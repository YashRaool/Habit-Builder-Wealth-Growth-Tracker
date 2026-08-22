import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { DollarSign, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Input';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function Register() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', currency: 'USD' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Redirect if already authenticated
  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!PASSWORD_RE.test(form.password)) e.password = 'Must include uppercase, lowercase, and a number';
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        currency: form.currency,
      });
      const { token, user: userData } = res.data.data;
      login(token, userData);
      toast.success(`Account created! Welcome, ${userData.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      // Show specific inline error for email-exists
      if (msg.toLowerCase().includes('email already exists')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  // Password strength indicator
  const passLen = form.password.length;
  const passStrength = passLen === 0 ? null : passLen < 8 ? 'weak' : !PASSWORD_RE.test(form.password) ? 'fair' : passLen >= 12 ? 'strong' : 'good';
  const strengthColors = { weak: 'bg-red-500', fair: 'bg-amber-500', good: 'bg-emerald-500', strong: 'bg-emerald-400' };
  const strengthWidths = { weak: 'w-1/4', fair: 'w-2/4', good: 'w-3/4', strong: 'w-full' };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/15 rounded-2xl mb-4 border border-emerald-500/20">
            <DollarSign size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">Start building better financial habits today</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <Input
            label="Full name"
            placeholder="Alex Johnson"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            autoComplete="name"
            id="register-name"
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            autoComplete="email"
            id="register-email"
          />

          {/* Password with strength indicator */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set('password')}
                className={`input-field pr-10 ${errors.password ? 'border-red-500/60' : ''}`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            {/* Strength bar */}
            {passStrength && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthColors[passStrength]} ${strengthWidths[passStrength]}`} />
                </div>
                <span className={`text-xs capitalize ${passStrength === 'weak' ? 'text-red-400' : passStrength === 'fair' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {passStrength}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-confirm" className="text-sm font-medium text-slate-300">Confirm password</label>
            <div className="relative">
              <input
                id="register-confirm"
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500/60' : ''}`}
                autoComplete="new-password"
              />
              {form.confirmPassword && form.password === form.confirmPassword && (
                <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>

          <Select label="Currency" value={form.currency} onChange={set('currency')} id="register-currency">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>

          <Button type="submit" loading={loading} className="w-full mt-2" id="register-submit">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
