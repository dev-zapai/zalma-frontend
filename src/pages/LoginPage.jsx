import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertCircle, Mail, CheckCircle } from 'lucide-react';
import ZalmaLogo from '@/components/ZalmaLogo';


export default function LoginPage() {
  // Step 1 = email, Step 2 = password, Step 3 = forgot-password, Step 4 = reset-sent
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [noProfile, setNoProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleEmailNext = (e) => {
    e.preventDefault();
    setError('');
    setStep(2);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setNoProfile(false);
    setShowForgot(false);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      if (err.code === 'no_profile') {
        setNoProfile(true);
      } else {
        setError(err.message || 'Invalid credentials');
        setShowForgot(true);
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/zalma/change-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to send reset email');
    } else {
      setStep(4);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #818cf8 50%, #a5b4fc 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 px-16 text-white max-w-lg">
          <div className="mb-10">
            <span className="brightness-0 invert"><ZalmaLogo height={32} /></span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            {step === 3 || step === 4 ? <>No worries,<br /><span className="text-white/80">we've got you.</span></> : <>Your salon,<br /><span className="text-white/80">beautifully managed.</span></>}
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            {step === 3 || step === 4
              ? "Enter your email and we'll send you a link to reset your password. You'll be back in your salon dashboard in no time."
              : 'Scheduling, clients, pets, payments, and analytics all in one place. Join hundreds of grooming salons running on Zalma.'}
          </p>
          <div className="mt-10 flex items-center gap-3 text-white/50 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="tracking-[0.15em] uppercase font-bold">Protocol by Zap AI</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center text-slate-900">
              <ZalmaLogo height={32} />
            </Link>
          </div>

          {/* ── Step 1: Email only ── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  Welcome back
                </h1>
                <p className="text-gray-500 text-sm mt-2">Enter your email to sign in</p>
              </div>
              <form onSubmit={handleEmailNext} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="you@salon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold">
                  Continue
                </Button>
              </form>
              <p className="mt-8 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-500 font-semibold hover:text-indigo-600 hover:underline">Create one</Link>
              </p>
            </>
          )}

          {/* ── Step 2: Password ── */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  Enter your password
                </h1>
                <button onClick={() => { setStep(1); setError(''); setShowForgot(false); setPassword(''); }} className="text-sm text-indigo-500 hover:text-indigo-600 mt-2 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {email} <span className="text-gray-400 text-xs">(change)</span>
                </button>
              </div>
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                    className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>

                {error && (
                  <p data-testid="login-error" className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
                )}

                {noProfile && (
                  <div data-testid="login-no-profile" className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-900">No Zalma account found</p>
                        <p className="text-xs text-indigo-700 mt-1">
                          We don't have a salon registered for <strong>{email}</strong>.
                        </p>
                        <Link to="/register" className="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                          Register your salon →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {showForgot && !noProfile && (
                  <button
                    type="button"
                    onClick={() => { setStep(3); setError(''); }}
                    className="text-sm text-indigo-500 hover:text-indigo-600 font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                )}

                <Button
                  data-testid="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </>
          )}

          {/* ── Step 3: Forgot password - enter email ── */}
          {step === 3 && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                  <Mail className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  Reset password
                </h1>
                <p className="text-gray-500 text-sm mt-2">We'll send a reset link to your email</p>
              </div>
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@salon.com"
                    required
                    disabled={loading}
                    className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => { setStep(2); setError(''); }} className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </div>
            </>
          )}

          {/* ── Step 4: Reset link sent ── */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Check your email
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                We've sent a password reset link to <strong className="text-gray-700">{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Didn't receive it? Check spam or{' '}
                <button onClick={() => setStep(3)} className="text-indigo-500 hover:underline font-medium">try again</button>.
              </p>
              <button onClick={() => { setStep(1); setPassword(''); setError(''); setShowForgot(false); }} className="inline-flex items-center gap-1.5 mt-8 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {(step === 1 || step === 2) && (
            <div className="mt-8 text-center">
              <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
