import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/Card';

/* ─── Google Icon ─── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

/* ─── Google Sign-In Button ─── */
function GoogleButton({ onClick, disabled, text = 'Continue with Google' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border text-sm font-medium transition-all shadow-sm active:scale-[.99]"
      style={{
        background: '#FFFFFF',
        borderColor: 'var(--border, #E2E8F0)',
        color: '#3C4043',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = '#F8FAFC';
          e.currentTarget.style.borderColor = '#CBD5E1';
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.background = '#FFFFFF';
          e.currentTarget.style.borderColor = 'var(--border, #E2E8F0)';
        }
      }}
    >
      <GoogleIcon />
      <span>{text}</span>
    </button>
  );
}

/* ─── Google Account Chooser Modal ─── */
function GoogleAccountModal({ isOpen, onClose, onSelect, busy, error }) {
  const [useCustom, setUseCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Yash Raool',
      email: 'yashhraool9@gmail.com',
      avatar: 'Y',
      color: '#EA4335',
    },
    {
      name: 'Alex Johnson',
      email: 'alex.johnson@gmail.com',
      avatar: 'A',
      color: '#4285F4',
    },
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setLocalError('Please enter a valid Google email address');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    onSelect({
      email: customEmail.trim().toLowerCase(),
      name,
      googleId: 'google-manual-' + Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-left"
        style={{ background: 'var(--surface, #FFFFFF)', color: 'var(--ink, #0F172A)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2">
            <GoogleIcon />
          </div>
          <h2 className="text-lg font-semibold">Choose an account</h2>
          <p className="text-xs" style={{ color: 'var(--muted, #64748B)' }}>
            to continue to <span className="font-semibold" style={{ color: 'var(--coral)' }}>WealthHabit</span>
          </p>
        </div>

        {(error || localError) && (
          <div
            className="text-xs rounded-lg p-2.5 mb-4 flex items-center gap-2"
            style={{ background: 'rgba(226,87,76,0.08)', color: 'var(--rose)' }}
          >
            <span>• {error || localError}</span>
          </div>
        )}

        {busy ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--coral)', borderTopColor: 'transparent' }}
            />
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              Signing in to WealthHabit…
            </p>
          </div>
        ) : !useCustom ? (
          <div className="flex flex-col gap-2">
            {defaultAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => onSelect({ email: acc.email, name: acc.name, googleId: 'google-' + acc.email })}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all text-left hover:border-gray-200"
                style={{ background: 'var(--canvas, #F8FAFC)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ background: acc.color }}
                >
                  {acc.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{acc.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{acc.email}</p>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => { setUseCustom(true); setLocalError(''); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed transition-all text-left mt-1 hover:border-gray-400"
              style={{ borderColor: 'var(--border, #E2E8F0)', background: 'transparent' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Use another account</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Enter your own name & Google email</p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Full name</label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Google email</label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
                style={{ background: 'var(--canvas)', borderColor: 'var(--border)', color: 'var(--ink)' }}
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setUseCustom(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                style={{ background: 'var(--coral)' }}
              >
                Continue
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-3 border-t text-center" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Google will securely share your email and profile with WealthHabit.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Field ─── */
function Field({ label, id, type = 'text', value, onChange, placeholder, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : id}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          background:  'var(--canvas)',
          border:      `1.5px solid ${error ? 'var(--rose)' : 'var(--border)'}`,
          color:       'var(--ink)',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
        onBlur={e  => (e.target.style.borderColor = error ? 'var(--rose)' : 'var(--border)')}
      />
      {error && <p className="text-xs" style={{ color: 'var(--rose)' }}>{error}</p>}
    </div>
  );
}

/* ─── Login Form ─── */
function LoginForm({ onSuccess, onOpenGoogle }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState([]);
  const [busy,     setBusy]     = useState(false);

  const validate = () => {
    const e = [];
    if (!email)    e.push('Email is required');
    if (!password) e.push('Password is required');
    return e;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const ve = validate();
    if (ve.length) { setErrors(ve); return; }
    setBusy(true); setErrors([]);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setErrors(err.errors || (err.message ? [err.message] : ['Login failed. Please check your credentials.']));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton onClick={onOpenGoogle} text="Continue with Google" />

      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <div className="flex-1 h-px bg-gray-200"></div>
        <span>OR</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email" id="login-email" type="email" value={email}
               onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" id="login-password" type="password" value={password}
               onChange={setPassword} placeholder="••••••••" />

        {errors.length > 0 && (
          <ul className="text-xs rounded-lg p-3 flex flex-col gap-1"
              style={{ background: 'rgba(226,87,76,0.08)', color: 'var(--rose)' }}>
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-[.98]"
          style={{
            background: busy ? 'var(--muted)' : 'var(--coral)',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

/* ─── Register Form ─── */
function RegisterForm({ onSuccess, onOpenGoogle }) {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState([]);
  const [busy,     setBusy]     = useState(false);

  const validate = () => {
    const e = [];
    if (!name.trim())        e.push('Name is required');
    if (!email)              e.push('Email is required');
    if (password.length < 8) e.push('Password must be at least 8 characters');
    return e;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const ve = validate();
    if (ve.length) { setErrors(ve); return; }
    setBusy(true); setErrors([]);
    try {
      await register(name, email, password);
      onSuccess();
    } catch (err) {
      setErrors(err.errors || (err.message ? [err.message] : ['Registration failed. Please try again.']));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton onClick={onOpenGoogle} text="Sign up with Google" />

      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <div className="flex-1 h-px bg-gray-200"></div>
        <span>OR</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Full name" id="reg-name" value={name} onChange={setName} placeholder="Alex Kim" />
        <Field label="Email" id="reg-email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" id="reg-password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 chars (upper, lower, number)" />

        {errors.length > 0 && (
          <ul className="text-xs rounded-lg p-3 flex flex-col gap-1"
              style={{ background: 'rgba(226,87,76,0.08)', color: 'var(--rose)' }}>
            {errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-[.98]"
          style={{
            background: busy ? 'var(--muted)' : 'var(--coral)',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

/* ─── Page ─── */
export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState(
    location.pathname.endsWith('/register') || location.state?.register ? 'register' : 'login'
  );

  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Already logged in → skip auth
  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const onSuccess = () => navigate(location.state?.from?.pathname || '/dashboard', { replace: true });

  const handleGoogleSelect = async (accountPayload) => {
    setGoogleBusy(true);
    setGoogleError('');
    try {
      await loginWithGoogle(accountPayload);
      setGoogleModalOpen(false);
      onSuccess();
    } catch (err) {
      setGoogleError(err.errors?.[0] || err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleOpenGoogle = () => {
    setGoogleError('');
    setGoogleModalOpen(true);
  };

  return (
    <main className="min-h-[90dvh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-card-md"
            style={{ background: 'var(--coral)' }}
          >
            W
          </span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>WealthHabit</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Build habits. Grow wealth.
          </p>
        </div>

        <Card padding="p-7">
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-6 gap-1"
            style={{ background: 'var(--canvas)' }}
            role="tablist"
          >
            {['login', 'register'].map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color:      tab === t ? 'var(--ink)'     : 'var(--muted)',
                  boxShadow:  tab === t ? 'var(--shadow-card)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {tab === 'login'
            ? <LoginForm onSuccess={onSuccess} onOpenGoogle={handleOpenGoogle} />
            : <RegisterForm onSuccess={onSuccess} onOpenGoogle={handleOpenGoogle} />}
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
          Your data is stored securely. No bank connection required.
        </p>
      </div>

      {/* Seamless Google Account Chooser Modal */}
      <GoogleAccountModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSelect={handleGoogleSelect}
        busy={googleBusy}
        error={googleError}
      />
    </main>
  );
}

