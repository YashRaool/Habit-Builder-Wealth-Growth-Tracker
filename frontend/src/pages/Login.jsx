import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/Card';

/* ─── Reusable field ─── */
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

/* ─── Login form ─── */
function LoginForm({ onSuccess }) {
  const { login, loginWithGoogle } = useAuth();
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
      setErrors(err.errors || ['Login failed']);
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setBusy(true); setErrors([]);
    try {
      await loginWithGoogle(credentialResponse.credential);
      onSuccess();
    } catch (err) {
      setErrors(err.errors || ['Google Login failed']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErrors(['Google Login failed'])}
        />
      </div>
      
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

/* ─── Register form ─── */
function RegisterForm({ onSuccess }) {
  const { register, loginWithGoogle } = useAuth();
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
      setErrors(err.errors || ['Registration failed']);
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setBusy(true); setErrors([]);
    try {
      await loginWithGoogle(credentialResponse.credential);
      onSuccess();
    } catch (err) {
      setErrors(err.errors || ['Google Login failed']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErrors(['Google Login failed'])}
        />
      </div>
      
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <div className="flex-1 h-px bg-gray-200"></div>
        <span>OR</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Full name"  id="reg-name"     value={name}     onChange={setName}     placeholder="Alex Kim" />
        <Field label="Email"      id="reg-email"     type="email"  value={email}    onChange={setEmail}    placeholder="you@example.com" />
        <Field label="Password"   id="reg-password"  type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />

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
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [tab, setTab] = useState(location.state?.register ? 'register' : 'login');

  // Already logged in → skip auth
  if (user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const onSuccess = () => navigate(location.state?.from?.pathname || '/dashboard', { replace: true });

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
            ? <LoginForm    onSuccess={onSuccess} />
            : <RegisterForm onSuccess={onSuccess} />}
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
          Your data is stored securely. No bank connection required.
        </p>
      </div>
    </main>
  );
}
