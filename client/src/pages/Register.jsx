import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Coins, Sparkles, TrendingUp } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const CURRENCIES = [
  { code: 'USD', label: 'USD - US Dollar ($)' },
  { code: 'EUR', label: 'EUR - Euro (€)' },
  { code: 'GBP', label: 'GBP - British Pound (£)' },
  { code: 'INR', label: 'INR - Indian Rupee (₹)' },
  { code: 'CAD', label: 'CAD - Canadian Dollar ($)' },
  { code: 'AUD', label: 'AUD - Australian Dollar ($)' },
  { code: 'JPY', label: 'JPY - Japanese Yen (¥)' },
  { code: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
];

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function Register() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'USD',
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Real-time client-side validator
  const validateField = (field, value, allValues = form) => {
    let err = '';
    if (field === 'name') {
      const trimmed = value.trim();
      if (!trimmed) {
        err = 'Full name is required.';
      } else if (trimmed.length < 2) {
        err = 'Name must be at least 2 characters.';
      } else if (trimmed.length > 60) {
        err = 'Name cannot exceed 60 characters.';
      }
    } else if (field === 'email') {
      const trimmed = value.trim();
      if (!trimmed) {
        err = 'Email address is required.';
      } else if (!EMAIL_REGEX.test(trimmed)) {
        err = 'Please enter a valid email address.';
      }
    } else if (field === 'password') {
      if (!value) {
        err = 'Password is required.';
      } else if (value.length < 8) {
        err = 'Password must be at least 8 characters.';
      } else if (!PASSWORD_REGEX.test(value)) {
        err = 'Must include uppercase, lowercase, and a number.';
      }
    } else if (field === 'confirmPassword') {
      if (!value) {
        err = 'Please confirm your password.';
      } else if (value !== allValues.password) {
        err = 'Passwords do not match.';
      }
    }
    return err;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    setApiError(null);

    // Live validation if touched
    if (touched[field]) {
      const err = validateField(field, value, updatedForm);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }

    // If password changed, update confirmPassword error if confirm was touched
    if (field === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', form.confirmPassword, updatedForm);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field], form);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAll = () => {
    const nameErr = validateField('name', form.name, form);
    const emailErr = validateField('email', form.email, form);
    const passErr = validateField('password', form.password, form);
    const confirmErr = validateField('confirmPassword', form.confirmPassword, form);

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors = {
      name: nameErr,
      email: emailErr,
      password: passErr,
      confirmPassword: confirmErr,
    };
    setErrors(newErrors);

    return !nameErr && !emailErr && !passErr && !confirmErr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        currency: form.currency,
      });

      const { token, user: userData } = res.data.data;
      login(token, userData);
      setApiSuccess(`Account created for ${userData.name}! Initializing your dashboard...`);
      toast.success(`Welcome to FinHabit, ${userData.name}!`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.userMessage ||
        'Registration failed. Please check your details and try again.';
      setApiError(msg);
      toast.error(msg);

      if (msg.toLowerCase().includes('already exists') || err.response?.status === 409) {
        setErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength visual indicator
  const passLength = form.password.length;
  const hasMinLen = passLength >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasLower = /[a-z]/.test(form.password);
  const hasDigit = /\d/.test(form.password);
  const score = [hasMinLen, hasUpper, hasLower, hasDigit].filter(Boolean).length;

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/20">
      {/* Background ambient accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-64 bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-64 bg-teal-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold tracking-wide mb-3 shadow-xs">
            <TrendingUp size={14} className="text-emerald-600" />
            FinHabit Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start tracking your habits, wealth growth, and financial goals</p>
        </div>

        {/* Card Container */}
        <Card className="border-slate-200/90 shadow-card bg-white p-6 sm:p-8">
          {apiError && (
            <Alert
              variant="error"
              title="Registration Error"
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
            {/* Full Name */}
            <Input
              id="register-name"
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Alex Johnson"
              value={form.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name ? errors.name : undefined}
              disabled={isSubmitting}
              autoComplete="name"
              autoFocus
            />

            {/* Email Address */}
            <Input
              id="register-email"
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="alex@finance.app"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              disabled={isSubmitting}
              autoComplete="email"
            />

            {/* Password */}
            <div className="space-y-1.5">
              <Input
                id="register-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
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

              {/* Password strength meter */}
              {form.password && (
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                          score >= step ? strengthColors[score - 1] : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-2xs font-medium text-slate-500 ml-1">
                      {strengthLabels[Math.max(0, score - 1)]}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400">
                    Use 8+ characters with uppercase, lowercase, and numbers
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              id="register-confirm"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Re-type your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              disabled={isSubmitting}
              autoComplete="new-password"
              rightElement={
                form.confirmPassword && form.password === form.confirmPassword ? (
                  <CheckCircle2 size={17} className="text-emerald-600" />
                ) : null
              }
            />

            {/* Currency Preference */}
            <Select
              id="register-currency"
              label="Default Base Currency"
              icon={Coins}
              value={form.currency}
              onChange={handleChange('currency')}
              disabled={isSubmitting}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full mt-2 font-semibold shadow-xs"
              id="register-submit-button"
            >
              {isSubmitting ? 'Creating FinHabit Account...' : 'Complete Registration'}
            </Button>
          </form>

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-2xs text-slate-400 text-center">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>Bank-grade 256-bit encryption & tokenized session security</span>
          </div>
        </Card>

        {/* Footer Navigation */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already registered?{' '}
          <Link
            to="/login"
            className="text-emerald-600 hover:text-emerald-700 font-semibold underline-offset-2 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-sm"
          >
            Sign in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
}
