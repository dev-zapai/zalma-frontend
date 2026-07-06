import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ArrowLeft, Upload, Check, Mail, ShieldCheck } from 'lucide-react';
import { THEME_PRESETS } from '@/shared/lib/theme';
import ZalmaLogo from '@/shared/components/ZalmaLogo';
import TimezoneSelect from '@/shared/components/TimezoneSelect';


export default function RegisterPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'basic'; // from landing page pricing

  // Step 1 = credentials, Step 2 = OTP verify, Step 3 = salon details
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [salonForm, setSalonForm] = useState({
    salon_name: '', salon_type: 'pet_grooming', description: '',
    email: '', phone: '', address: '', city: '', state: '', country: '', postal_code: '',
    website_url: '', timezone: '', logo_url: '', theme_color: '#818cf8',
    // Owner opts in to also being a working staff member. Default OFF — the
    // owner is admin-only unless they check this.
    owner_is_staff: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signUp, verifyOtp, resendOtp, setupSalon } = useAuth();
  const navigate = useNavigate();

  // If we already have a profile (returning visitor / refreshed page mid-setup),
  // bounce to dashboard immediately.
  useEffect(() => {
    if (profile) navigate('/dashboard');
  }, [profile, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1: Create account (sends OTP email) ──
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    setError('');
    setLoading(true);
    const { data, error: err } = await signUp(email, password, fullName);
    setLoading(false);
    if (err) {
      setError(err.message || 'Signup failed');
      return;
    }
    // Backend tells us whether OTP is required (depends on Supabase email-confirm setting)
    if (data?.requires_otp === false) {
      setStep(3);
    } else {
      setStep(2);
      setResendCooldown(60);
    }
  };

  // ── Step 2: Verify OTP ──
  const handleOtpChange = (idx, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    // Auto-focus next input
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await verifyOtp(email, token, password);
    setLoading(false);
    if (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } else {
      setStep(3);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    await resendOtp(email);
    setLoading(false);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  // ── Step 3: Salon setup ──
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Don't set Content-Type manually — axios auto-detects FormData and
      // emits `multipart/form-data; boundary=...` with the correct boundary.
      const res = await api.post('/auth/upload-logo', formData);
      setSalonForm(f => ({ ...f, logo_url: res.data.url }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleSetupSalon = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await setupSalon(salonForm);
    if (err) {
      setLoading(false);
      setError(typeof err === 'string' ? err : 'Salon setup failed');
      return;
    }
    // If user selected a non-basic plan from the landing page, set it now
    if (selectedPlan && selectedPlan !== 'basic') {
      try {
        await api.post('/billing/upgrade', { plan: selectedPlan });
      } catch (e) {
        console.error('Plan set failed, defaulting to basic:', e);
      }
    }
    setLoading(false);
    navigate('/dashboard');
  };

  const updateSalon = (field, value) => setSalonForm(f => ({ ...f, [field]: value }));
  const totalSteps = 3;

  const stepMeta = {
    1: { title: 'Create your account', desc: 'Get started with Zalma in under 2 minutes' },
    2: { title: 'Verify your email', desc: `Enter the 6-digit code sent to ${email}` },
    3: { title: 'Set up your salon', desc: 'Tell us about your business' },
  };

  const leftPanelText = {
    1: { heading: <>Start managing<br /><span className="text-white/80">your salon today.</span></>, body: 'Set up your grooming salon in under 2 minutes. Scheduling, client management, and payments all ready to go from day one.' },
    2: { heading: <>Almost there,<br /><span className="text-white/80">verify your email.</span></>, body: 'We sent a 6-digit code to your email. Enter it to verify your account and keep it secure.' },
    3: { heading: <>Let's get your<br /><span className="text-white/80">salon set up.</span></>, body: 'Add your salon details so your team and clients can find you. You can always change these later.' },
  };

  const lp = leftPanelText[step];

  return (
    <div data-testid="register-page" className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #818cf8 50%, #a5b4fc 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 px-16 text-white max-w-lg">
          <div className="mb-10">
            <span className="brightness-0 invert"><ZalmaLogo height={32} /></span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            {lp.heading}
          </h2>
          <p className="text-white/70 text-base leading-relaxed">{lp.body}</p>
          {step === 1 && (
            <div className="mt-10 space-y-3 text-white/60 text-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>
                Pay per booking, no monthly fees
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>
                Upgrade or downgrade anytime
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>
                No lock-in contracts
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[480px]">
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center text-slate-900">
              <ZalmaLogo height={32} />
            </Link>
          </div>

          <div className="mb-8">
            {step === 2 && (
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
              {stepMeta[step].title}
            </h1>
            <p className="text-gray-500 text-sm mt-2">{stepMeta[step].desc}</p>
            {/* Step indicator */}
            <div className="flex gap-2 mt-5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i + 1 ? 'bg-indigo-400' : 'bg-gray-100'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Step {step} of {totalSteps}</p>
          </div>

          {/* ── Step 1: Account credentials ── */}
          {step === 1 && (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input data-testid="register-name-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" required disabled={loading} className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@salon.com" required disabled={loading} className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Password</Label>
                <Input data-testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} disabled={loading} className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
              </div>
              <label className="flex items-start gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  data-testid="register-terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400/20 cursor-pointer"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="text-indigo-500 font-medium hover:underline">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/terms#privacy" target="_blank" className="text-indigo-500 font-medium hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {error && <p data-testid="register-error" className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
              <Button data-testid="register-submit-btn" type="submit" disabled={loading || !termsAccepted} className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-500 font-semibold hover:text-indigo-600 hover:underline">Sign in</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP Verification ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Code sent to</p>
                <p className="text-sm font-semibold text-gray-900">{email}</p>
              </div>

              {/* 6-digit OTP inputs */}
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-colors text-gray-900"
                  />
                ))}
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 text-center">{error}</p>}

              <Button type="submit" disabled={loading || otp.join('').length !== 6} className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold">
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <div className="text-center border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-400 mb-3">Didn't receive the code? Check spam or</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </Button>
              </div>
            </form>
          )}

          {/* ── Step 3: Salon details ── */}
          {step === 3 && (
            <form onSubmit={handleSetupSalon} className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700">Salon Name *</Label>
                <Input data-testid="register-salon-name-input" value={salonForm.salon_name} onChange={e => updateSalon('salon_name', e.target.value)} placeholder="Pawfect Grooming Salon" required className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <Input value={salonForm.description} onChange={e => updateSalon('description', e.target.value)} placeholder="A brief tagline for your salon" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Salon Email</Label>
                  <Input value={salonForm.email} onChange={e => updateSalon('email', e.target.value)} type="email" placeholder="hello@salon.com" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <Input value={salonForm.phone} onChange={e => updateSalon('phone', e.target.value)} placeholder="+61 4XX XXX XXX" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Address</Label>
                <Input value={salonForm.address} onChange={e => updateSalon('address', e.target.value)} placeholder="123 Main Street" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">City</Label>
                  <Input value={salonForm.city} onChange={e => updateSalon('city', e.target.value)} placeholder="Sydney" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">State</Label>
                  <Input value={salonForm.state} onChange={e => updateSalon('state', e.target.value)} placeholder="NSW" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Postal Code</Label>
                  <Input value={salonForm.postal_code} onChange={e => updateSalon('postal_code', e.target.value)} placeholder="2000" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Country</Label>
                  <Input value={salonForm.country} onChange={e => updateSalon('country', e.target.value)} placeholder="Australia" className="mt-1.5 h-11 rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Timezone</Label>
                  <div className="mt-1.5">
                    <TimezoneSelect
                      value={salonForm.timezone}
                      onChange={val => updateSalon('timezone', val)}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Detected from your browser. All appointment times will use this timezone (DST handled automatically).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Salon Logo</Label>
                  <div className="mt-1.5 flex items-center gap-3">
                    {salonForm.logo_url ? (
                      <img src={salonForm.logo_url} alt="Logo" className="h-11 w-11 rounded-lg object-cover border" />
                    ) : (
                      <div className="h-11 w-11 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                        <Upload className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="text-sm text-indigo-500 font-medium hover:text-indigo-600 hover:underline">{uploading ? 'Uploading...' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Theme Color</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => updateSalon('theme_color', preset.hex)}
                        className="relative w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: preset.hex,
                          borderColor: salonForm.theme_color === preset.hex ? preset.hex : 'transparent',
                          boxShadow: salonForm.theme_color === preset.hex ? `0 0 0 2px white, 0 0 0 4px ${preset.hex}` : 'none',
                        }}
                        title={preset.name}
                      >
                        {salonForm.theme_color === preset.hex && (
                          <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Owner opts in to also being a working staff member (groomer).
                  Default OFF — the owner is admin-only unless they check this. */}
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3.5 cursor-pointer hover:border-indigo-300 transition-colors">
                <input
                  type="checkbox"
                  checked={salonForm.owner_is_staff}
                  onChange={e => updateSalon('owner_is_staff', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                />
                <span className="text-sm text-gray-700">
                  I also work as a staff member
                  <span className="block text-xs text-gray-400 mt-0.5">
                    Adds you to the team roster, scheduling and payroll. You can set your designation and change this later in Team Management.
                  </span>
                </span>
              </label>

              {error && <p data-testid="register-error" className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
              <Button data-testid="register-salon-submit-btn" type="submit" disabled={loading} className="w-full rounded-lg h-11 bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold">
                {loading ? 'Setting up...' : 'Launch My Salon'}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
