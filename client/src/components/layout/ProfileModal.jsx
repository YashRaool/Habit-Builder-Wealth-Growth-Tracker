import { useState } from 'react';
import {
  User, Shield, KeyRound, DollarSign, Check, AlertCircle, Lock,
  Mail, Calendar, Sparkles
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../api/auth';

const CURRENCIES = [
  { code: 'USD', label: 'USD ($) — US Dollar' },
  { code: 'EUR', label: 'EUR (€) — Euro' },
  { code: 'GBP', label: 'GBP (£) — British Pound' },
  { code: 'INR', label: 'INR (₹) — Indian Rupee' },
  { code: 'CAD', label: 'CAD ($) — Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) — Australian Dollar' },
  { code: 'JPY', label: 'JPY (¥) — Japanese Yen' },
  { code: 'CHF', label: 'CHF (Fr) — Swiss Franc' },
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!name.trim() || name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({
        name: name.trim(),
        currency: currency.toUpperCase(),
      });
      updateUser(res.data.data.user);
      toast.success('Account profile updated successfully.');
      onClose();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[a-z])(?=.*\d)/i.test(newPassword)) {
      setPasswordError('New password must contain both letters and at least one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Security credential updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Password update failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings & Security" size="md">
      <div className="space-y-5">
        {/* User Card Header */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm truncate">{user?.name}</h3>
              <Badge color={user?.role === 'admin' ? 'violet' : 'emerald'} size="sm">
                {user?.role || 'User'}
              </Badge>
            </div>
            <p className="text-2xs text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={14} /> Profile & Currency
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound size={14} /> Password Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 animate-fade-in">
            {profileError && (
              <Alert variant="danger" title="Validation Error">
                {profileError}
              </Alert>
            )}

            <Input
              label="Full Name"
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={savingProfile}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed select-none pl-9"
                />
                <Lock size={13} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-2xs text-slate-400 mt-1">Managed via corporate single-sign-on credentials.</p>
            </div>

            <Select
              label="Default Base Currency"
              id="profile-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={savingProfile}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={savingProfile}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={savingProfile} disabled={savingProfile}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4 animate-fade-in">
            {passwordError && (
              <Alert variant="danger" title="Security Alert">
                {passwordError}
              </Alert>
            )}

            <Input
              label="Current Password"
              id="current-password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={savingPassword}
              required
            />

            <Input
              label="New Secure Password"
              id="new-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={savingPassword}
              required
            />

            <Input
              label="Confirm New Password"
              id="confirm-password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={savingPassword}
              required
            />

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-2xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li>At least 8 characters long</li>
                <li>At least one letter and one numeric character</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={savingPassword}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={savingPassword} disabled={savingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
