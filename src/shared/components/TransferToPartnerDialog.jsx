import React, { useEffect, useState } from 'react';
import api from '@/shared/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';

/**
 * Transfer an appointment to an accepted partner salon.
 *
 * Only partners with `partnerships.status='accepted'` show up - the backend
 * double-enforces this, but we also pre-filter client-side so admins don't
 * see an empty dropdown and wonder why a pending partner isn't listed.
 */
export default function TransferToPartnerDialog({ open, onOpenChange, appointment, onTransferred }) {
  const [partners, setPartners] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTargetId('');
    setNote('');
    (async () => {
      try {
        const res = await api.get('/partners', { params: { status: 'accepted' } });
        const items = listItems(res.data);
        // Each partnership has partner_tenant_id + partner_name fields in the
        // existing partner_routes list shape. Fall back to `receiver_name` if
        // the payload uses a different name.
        setPartners(items);
      } catch {
        toast.error('Failed to load partner list');
      }
    })();
  }, [open]);

  const submit = async () => {
    if (!appointment || !targetId) return;
    setSubmitting(true);
    try {
      await api.post('/g/transfers', {
        appointment_id: appointment.id,
        target_tenant_id: targetId,
        note: note || null,
      });
      toast.success('Transfer request sent to partner');
      onOpenChange(false);
      if (onTransferred) onTransferred();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Transfer failed');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Transfer to Partner
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <p className="text-slate-500">
            Only accepted partner salons are eligible. The partner sees a snapshot of the client, pet, and services -
            they choose Accept / Decline / Propose New Time.
          </p>
          <div>
            <Label>Partner Salon</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick a partner" /></SelectTrigger>
              <SelectContent>
                {partners.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    No accepted partners yet. Add some under Partners first.
                  </div>
                )}
                {partners.map(p => (
                  <SelectItem key={p.partner_tenant_id || p.id} value={p.partner_tenant_id || p.id}>
                    {p.partner_name || p.name || 'Partner salon'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note for Partner (optional)</Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Over-booked today - can you take this?"
                      className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!targetId || submitting} onClick={submit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending…</> : 'Send Transfer Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
