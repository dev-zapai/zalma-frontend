import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { CreditCard, Shield, Zap } from 'lucide-react';
import { AddCardForm } from '@/features/billing/components/AddCardModal';
import ZalmaLogo from '@/shared/components/ZalmaLogo';

/**
 * AddPaymentPage - standalone page (not inside dashboard layout).
 *
 * Shown when:
 * 1. New tenant completes registration but hasn't added a card yet
 * 2. Existing tenant signs in but has no card on file
 *
 * Cannot be skipped. Must add a valid card to access the platform.
 */
export default function AddPaymentPage() {
  const navigate = useNavigate();

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
            One last step,<br /><span className="text-white/80">add your card.</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            A credit card is required to use Zalma. You'll only be charged based on usage at the end of each month. No upfront fees, no contracts.
          </p>
          <div className="mt-10 space-y-3 text-white/60 text-sm">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4" />
              <span>PCI-compliant card processing via Stripe</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4" />
              <span>Pay only for what you use. Cancel anytime.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4" />
              <span>Starting at A$0.70 per booking on the Basic plan</span>
            </div>
          </div>
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
            <ZalmaLogo height={32} />
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
              <CreditCard className="h-6 w-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
              Add payment method
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Add a credit or debit card to activate your account. You won't be charged until the end of your first billing period.
            </p>
          </div>

          <AddCardForm
            onSuccess={() => {
              // Small delay for the success animation, then redirect to dashboard
              setTimeout(() => navigate('/dashboard'), 1500);
            }}
            buttonText="Activate Account"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
