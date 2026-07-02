import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { KeyRound, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import ZalmaLogo from '@/shared/components/ZalmaLogo';

// Temp-password flow — a logged-in user (e.g. a member created with a
// temporary password) sets a new one. Calls `/members/change-password`
// (backend rotates the Cognito password via admin_set_user_password).
//
// The forgot/reset-by-email flow now lives entirely on the LoginPage
// (Cognito emails a code, not a recovery link), so this page no longer
// handles URL-hash recovery tokens.
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { profile, fetchProfile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [linkError] = useState('');

  const isTempPassword = !!profile;  // a logged-in user changing their password
  const isResetFlow = false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      if (!profile) {
        throw new Error('Please sign in first, or use "Forgot password" on the sign-in page.');
      }
      await api.post('/members/change-password', { new_password: password });
      await fetchProfile();
      navigate('/dashboard');
      return;
    } catch (err) {
      setError(err.message || err.response?.data?.detail || 'Failed to change password');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #818cf8 50%, #a5b4fc 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 px-16 text-white max-w-lg">
          <div className="mb-10">
            <span className="brightness-0 invert"><ZalmaLogo height={32} /></span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            {isTempPassword
              ? <>Secure your<br /><span className="text-white/80">account.</span></>
              : <>Set your new<br /><span className="text-white/80">password.</span></>}
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            {isTempPassword
              ? 'Your admin created your account with a temporary password. Set your own to get started.'
              : 'Choose a strong password to keep your salon account safe.'}
          </p>
          <div className="mt-10 flex items-center gap-3 text-white/50 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="tracking-[0.15em] uppercase font-bold">Protocol by Zap AI</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden text-center mb-10">
            <ZalmaLogo height={32} />
          </div>

          {linkError ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Link expired
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {linkError}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Please request a new password reset link from the sign in page.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-500 hover:text-indigo-600">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>

          ) : done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Password updated
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Your password has been changed successfully.
              </p>
              <Link to="/login">
                <Button className="rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold px-8">
                  Sign In
                </Button>
              </Link>
            </div>

          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                  <KeyRound className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  {isTempPassword ? 'Set your password' : 'Reset your password'}
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  {isTempPassword
                    ? 'Your account was created with a temporary password. Please set a new one to continue.'
                    : 'Enter a new password for your account.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700">New Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
                <Button type="submit" disabled={submitting} className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold">
                  {submitting ? 'Saving...' : isTempPassword ? 'Set Password & Continue' : 'Reset Password'}
                </Button>
              </form>

              {isResetFlow && (
                <div className="mt-8 text-center">
                  <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5 transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
