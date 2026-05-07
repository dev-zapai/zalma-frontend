import React, { useEffect, useMemo, useState } from 'react';
import api from '@/shared/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Share2, Loader2, Search, Check, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';

/**
 * Transfer an appointment to an accepted partner salon.
 *
 * Only partners with `partnerships.status='accepted'` show up - the backend
 * double-enforces this, but we also pre-filter client-side so admins don't
 * see an empty dropdown and wonder why a pending partner isn't listed.
 *
 * UI: Instagram-style searchable list with logo + name + location.
 */
export default function TransferToPartnerDialog({ open, onOpenChange, appointment, onTransferred }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get('/partners', { params: { status: 'accepted' } });
      setPartners(listItems(res.data));
    } catch (e) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;
      let msg;
      if (status === 401) {
        msg = 'Session expired. Please log out and back in.';
      } else if (status === 403) {
        msg = 'Only admins can view partner list.';
      } else if (typeof detail === 'string') {
        msg = detail;
      } else if (e?.message) {
        msg = e.message;
      } else {
        msg = 'Failed to load partner list';
      }
      setLoadError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    setTargetId('');
    setSearch('');
    setNote('');
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Backend response shape: { id (partnership_id), partner: { id, name, logo_url, city, state, slug }, status, ... }
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(p => {
      const name = p.partner?.name || '';
      const city = p.partner?.city || '';
      const state = p.partner?.state || '';
      const slug = p.partner?.slug || '';
      return [name, city, state, slug].some(s => s.toLowerCase().includes(q));
    });
  }, [partners, search]);

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

  const selected = partners.find(p => p.partner?.id === targetId);

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
            Only accepted partner salons are eligible. The partner sees a snapshot of the client, pet, and services –
            they choose Accept / Decline / Propose New Time.
          </p>

          <div>
            <Label>Partner Salon</Label>

            {/* Search box */}
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by salon name, city, or state..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Scrollable partner list */}
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {loading && (
                <div className="px-4 py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading partners...
                </div>
              )}

              {!loading && loadError && (
                <div className="px-4 py-5 text-center text-xs">
                  <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 font-medium mb-2">{loadError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={fetchPartners}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {!loading && !loadError && partners.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-400 text-xs">
                  No accepted partners yet. Add some under <span className="font-medium">Partners</span> first.
                </div>
              )}

              {!loading && !loadError && partners.length > 0 && filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-400 text-xs">
                  No partners match "{search}"
                </div>
              )}

              {!loadError && filtered.map(p => {
                const partner = p.partner || {};
                const isSelected = partner.id === targetId;
                const initial = (partner.name || '?').charAt(0).toUpperCase();
                const location = [partner.city, partner.state].filter(Boolean).join(', ');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTargetId(partner.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-slate-50'
                    }`}
                  >
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {partner.name || 'Unnamed Salon'}
                      </p>
                      {location && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {location}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selected && (
              <p className="mt-2 text-xs text-slate-500">
                Selected: <span className="font-medium text-slate-700">{selected.partner?.name}</span>
              </p>
            )}
          </div>

          <div>
            <Label>Note for Partner (optional)</Label>
            <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Over-booked today – can you take this?"
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
