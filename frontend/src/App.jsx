import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import Nav from '@/components/Nav';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import Login     from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Tracker   from '@/pages/Tracker';
import Habits    from '@/pages/Habits';
import Goals     from '@/pages/Goals';
import Analytics from '@/pages/Analytics';
import Admin     from '@/pages/Admin';

function Protected({ children, adminOnly = false }) {
  return <ProtectedRoute adminOnly={adminOnly}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div
            className="min-h-dvh"
            style={{ background: 'var(--canvas)', color: 'var(--ink)' }}
          >
            <Nav />

            <Routes>
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Public auth page */}
              <Route path="/login" element={<Login />} />

              {/* Protected app pages */}
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/tracker"   element={<Protected><Tracker /></Protected>} />
              <Route path="/habits"    element={<Protected><Habits /></Protected>} />
              <Route path="/goals"     element={<Protected><Goals /></Protected>} />
              <Route path="/analytics" element={<Protected><Analytics /></Protected>} />

              {/* Admin-only */}
              <Route path="/admin" element={<Protected adminOnly><Admin /></Protected>} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
