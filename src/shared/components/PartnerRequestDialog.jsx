import React, { useState } from 'react';
import api from '@/shared/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerRequestDialog({ open, onOpenChange, targetTenantId, targetName, targetLogo, targetColor, onSuccess }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post('/partners/request', {
        target_tenant_id: targetTenantId,
        message: message.trim() || null,
      });
      toast.success('Partner request sent!');
      setMessage('');
      if (onSuccess) onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send request');
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Send Partner Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            {targetLogo ? (
              <img src={targetLogo} alt={targetName} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: targetColor || '#6366F1' }}>
                {targetName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <p className="text-sm font-medium text-slate-900">{targetName}</p>
          </div>
          <div>
            <Label className="text-sm">Message (optional)</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hi! We'd love to partner with you for referrals..."
              rows={3}
              maxLength={500}
              className="mt-1.5"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{message.length}/500</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {sending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
