import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, Sparkles, TrendingUp } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';

const DEMO_CREDENTIALS = [
  {
    role: 'Evaluator User',
    name: 'Alex Johnson',
    email: 'alex@finance.app',
    password: 'Password123!',
    badge: 'Standard Portfolio',
    badgeColor: 'emerald',
    icon: UserCheck,
  },
  {
    role: 'Evaluator Admin',
    name: 'Admin User',
    email: 'admin@finance.app',
    password: 'Password123!',
    badge: 'System Admin',
    badgeColor: 'violet',
    icon: ShieldCheck,
  },
];

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Client-side inline validation rule
  const validateField = (field, value) => {
    let err = '';
    if (field === 'email') {
      const trimmed = value.trim();
      if (!trimmed) {
        err = 'Email address is required.';
      } else if (!EMAIL_REGEX.test(trimmed)) {
        err = 'Please enter a valid email address (e.g. name@domain.com).';
      }
    } else if (field === 'password') {
      if (!value) {
        err = 'Password is required.';
      } else if (value.length < 8) {
        err = 'Password must be at least 8 characters.';
      }
    }
    return err;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setApiError(null);

    // Live validation if the user has already interacted with the field
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAll = () => {
    const emailErr = validateField('email', form.email);
    const passErr = validateField('password', form.password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });
    return !emailErr && !passErr;
  };

  const executeAuth = async (emailToSubmit, passwordToSubmit) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await authAPI.login({
        email: emailToSubmit.trim().toLowerCase(),
        password: passwordToSubmit,
      });

      const { token, user: userData } = res.data.data;
      login(token, userData);
      setApiSuccess(`Authenticated as ${userData.name}. Redirecting...`);
      toast.success(`Welcome back, ${userData.name}!`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.userMessage ||
        'Unable to sign in. Please verify your credentials.';
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateAll()) {
      return;
    }

    await executeAuth(form.email, form.password);
  };

  const handleFillDemo = (demo) => {
    setForm({ email: demo.email, password: demo.password });
    setTouched({ email: true, password: true });
    setErrors({});
    setApiError(null);
    toast.info(`Filled credentials for ${demo.name}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20">
      {/* Institutional background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-64 bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-64 bg-teal-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold tracking-wide mb-3 shadow-xs">
            <TrendingUp size={14} className="text-emerald-600" />
            FinHabit Enterprise Wealth
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Sign in to your portal</h1>
          <p className="text-slate-500 text-sm mt-1">Access your habit metrics, portfolios, and net worth tracker</p>
        </div>

        {/* Main Authentication Card */}
        <Card className="border-slate-200/90 shadow-card bg-white p-6 sm:p-8">
          {/* Semantic Alert Banners */}
          {apiError && (
            <Alert
              variant="error"
              title="Authentication Failed"
              message={apiError}
              onClose={() => setApiError(null)}
              className="mb-5"
            />
          )}

          {apiSuccess && (
            <Alert
              variant="success"
              title="Success"
              message={apiSuccess}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field with Icon */}
            <Input
              id="login-email"
              label="Work or Personal Email"
              type="email"
              icon={Mail}
              placeholder="alex@finance.app"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              disabled={isSubmitting}
              autoComplete="email"
              autoFocus
            />

            {/* Password Field with Icon & Interactive Toggle */}
            <Input
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="••••••••••••"
              value={form.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={touched.password ? errors.password : undefined}
              disabled={isSubmitting}
              autoComplete="current-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Submit Button with Strict Locking */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full mt-2 font-semibold shadow-xs"
              id="login-submit-button"
            >
              {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
            </Button>
          </form>

          {/* Institutional Evaluator Access Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-600" />
                Demo Evaluator Access
              </span>
              <span className="text-2xs text-slate-400">1-click test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((demo) => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.email}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFillDemo(demo)}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300 transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Icon size={14} className="text-emerald-600" />
                        {demo.role}
                      </div>
                      <Badge color={demo.badgeColor} size="sm">
                        {demo.badge}
                      </Badge>
                    </div>
                    <span className="text-2xs text-slate-500 font-mono truncate w-full">{demo.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Footer Navigation */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-emerald-600 hover:text-emerald-700 font-semibold underline-offset-2 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-sm"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
