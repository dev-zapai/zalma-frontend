import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import ZalmaLogo from '@/shared/components/ZalmaLogo';


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await forgotPassword(email);
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to send reset email');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #818cf8 50%, #a5b4fc 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 px-16 text-white max-w-lg">
          <div className="mb-10">
            <span className="brightness-0 invert"><ZalmaLogo height={32} /></span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            No worries,<br />
            <span className="text-white/80">we've got you.</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Enter your email and we'll send you a link to reset your password. You'll be back in your salon dashboard in no time.
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

          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                Check your email
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                We've emailed a 6-digit code to <strong className="text-gray-700">{email}</strong>. Go back to the sign-in page and click "Forgot password" to enter it.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-indigo-500 hover:underline font-medium">try again</button>.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                  <Mail className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
                  Forgot password?
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  Enter the email associated with your account and we'll email a 6-digit reset code.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@salon.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
