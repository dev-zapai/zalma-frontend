import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { CreditCard, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
};

/**
 * AddCardModal - Stripe Elements card form.
 *
 * Usage:
 *   <AddCardModal open={true} onOpenChange={setOpen} onSuccess={() => ...} />
 *
 * Or inline (no dialog wrapper):
 *   <AddCardForm onSuccess={() => ...} />
 */

function CardForm({ onSuccess, buttonText = 'Save Card', fullWidth = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setSaving(true);

    try {
      // 1. Get a SetupIntent from our backend (creates Stripe Customer if needed)
      const { data } = await api.post('/billing/create-setup-intent');
      const clientSecret = data.client_secret;

      // 2. Confirm the SetupIntent with the card details (Stripe handles PCI)
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }

      // 3. Set this card as the default payment method
      await api.post('/billing/set-default-payment-method', {
        payment_method_id: result.setupIntent.payment_method,
      });

      setDone(true);
      toast.success('Credit card saved successfully');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save card');
    }
    setSaving(false);
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-sm font-medium text-slate-900">Card saved successfully</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border border-slate-200 rounded-lg p-4 bg-white">
        <CardElement options={CARD_STYLE} />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
      )}
      <p className="text-xs text-slate-400">
        Your card is securely processed by Stripe. We never see or store your full card number.
      </p>
      <Button
        type="submit"
        disabled={!stripe || saving}
        className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11 ${fullWidth ? 'w-full' : ''}`}
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
        ) : (
          <><CreditCard className="h-4 w-4 mr-2" /> {buttonText}</>
        )}
      </Button>
    </form>
  );
}

// Wrapped with Stripe Elements provider
export function AddCardForm({ onSuccess, buttonText, fullWidth }) {
  return (
    <Elements stripe={stripePromise}>
      <CardForm onSuccess={onSuccess} buttonText={buttonText} fullWidth={fullWidth} />
    </Elements>
  );
}

// Dialog wrapper
export default function AddCardModal({ open, onOpenChange, onSuccess }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Add Credit Card
          </DialogTitle>
        </DialogHeader>
        <AddCardForm
          onSuccess={() => {
            if (onSuccess) onSuccess();
            if (onOpenChange) setTimeout(() => onOpenChange(false), 1500);
          }}
          buttonText="Save Card"
        />
      </DialogContent>
    </Dialog>
  );
}
