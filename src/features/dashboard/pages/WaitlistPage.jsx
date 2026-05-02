import React, { useEffect, useState } from 'react';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Hourglass, Check, X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';

const STATUS_COLORS = {
  waiting: 'bg-slate-100 text-slate-700',
  offered: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-slate-100 text-slate-500',
  declined: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-400',
  transferred: 'bg-violet-100 text-violet-700',
};

const WINDOW_LABELS = {
  any: 'Anytime',
  morning: 'Morning (before 12)',
  afternoon: 'Afternoon (12–5)',
  evening: 'Evening (after 5)',
};

export default function WaitlistPage() {
  const [tab, setTab] = useState('waiting');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerDialog, setOfferDialog] = useState(null);
  const [offerStart, setOfferStart] = useState('');
  const [offerEnd, setOfferEnd] = useState('');

  const fetchEntries = async (status) => {
    setLoading(true);
    try {
      const res = await api.get('/g/waitlist', { params: { status } });
      setEntries(listItems(res.data));
    } catch { toast.error('Failed to load waitlist'); }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(tab); }, [tab]);

  const handleAccept = async (entryId) => {
    try {
      await api.post(`/g/waitlist/${entryId}/accept`);
      toast.success('Appointment created for client');
      fetchEntries(tab);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Accept failed');
    }
  };

  const handleDecline = async (entryId) => {
    if (!window.confirm('Decline this offer and cascade to next waitlist entry?')) return;
    try {
      await api.post(`/g/waitlist/${entryId}/decline`);
      toast.success('Offer declined - next entry notified');
      fetchEntries(tab);
    } catch (e) { toast.error(e.response?.data?.detail || 'Decline failed'); }
  };

  const handleCancel = async (entryId) => {
    if (!window.confirm('Remove this entry from the waitlist?')) return;
    try {
      await api.delete(`/g/waitlist/${entryId}`);
      toast.success('Entry cancelled');
      fetchEntries(tab);
    } catch { toast.error('Cancel failed'); }
  };

  const handleExpireStale = async () => {
    try {
      const res = await api.post('/g/waitlist/expire-stale');
      toast.success(`${res.data.expired} stale offers reverted`);
      fetchEntries(tab);
    } catch { toast.error('Sweep failed'); }
  };

  const openOfferDialog = (entry) => {
    const base = entry.preferred_date || new Date().toISOString().slice(0, 10);
    setOfferStart(`${base}T10:00`);
    setOfferEnd(`${base}T11:00`);
    setOfferDialog(entry);
  };

  const submitManualOffer = async () => {
    try {
      await api.post(`/g/waitlist/${offerDialog.id}/offer`, {
        slot_start: new Date(offerStart).toISOString(),
        slot_end: new Date(offerEnd).toISOString(),
      });
      toast.success('Offer sent');
      setOfferDialog(null);
      fetchEntries(tab);
    } catch (e) { toast.error(e.response?.data?.detail || 'Offer failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-primary" /> Waitlist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clients waiting for a slot. When an appointment cancels, the top matching entry is offered automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExpireStale}>
          Sweep Stale Offers
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
          <TabsTrigger value="offered">Offered</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <div className="text-sm text-slate-400 py-10 text-center">Loading…</div>
          ) : entries.length === 0 ? (
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="py-10 text-center text-slate-400 text-sm">
                No entries in <strong>{tab}</strong>.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {entries.map(e => (
                <Card key={e.id} className="rounded-xl border-slate-200/60">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {e.client_name || 'Client'}
                        </h3>
                        {e.pet_name && (
                          <span className="text-xs text-slate-500">· {e.pet_name}</span>
                        )}
                        <Badge className={`text-[10px] ${STATUS_COLORS[e.status] || ''}`}>
                          {e.status}
                        </Badge>
                        {e.priority > 0 && (
                          <Badge variant="outline" className="text-[10px]">P{e.priority}</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {e.preferred_date}
                        </span>
                        <span>{WINDOW_LABELS[e.preferred_window] || e.preferred_window}</span>
                        {e.flexibility_days > 0 && (
                          <span>± {e.flexibility_days}d</span>
                        )}
                        {e.status === 'offered' && e.offer_expires_at && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Offer expires {new Date(e.offer_expires_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {e.notes && (
                        <p className="mt-1.5 text-xs text-slate-600 italic">"{e.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {e.status === 'offered' && (
                        <>
                          <Button size="sm" onClick={() => handleAccept(e.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Check className="h-3.5 w-3.5 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDecline(e.id)}>
                            <X className="h-3.5 w-3.5 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {e.status === 'waiting' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openOfferDialog(e)}>
                            Offer Slot
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-600"
                                  onClick={() => handleCancel(e.id)}>
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!offerDialog} onOpenChange={(o) => !o && setOfferDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manually Offer Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">
              Offer a specific slot to <strong>{offerDialog?.client_name}</strong>. They have 30 minutes to accept before it auto-expires.
            </p>
            <div>
              <Label>Slot Start</Label>
              <Input type="datetime-local" value={offerStart}
                     onChange={e => setOfferStart(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Slot End</Label>
              <Input type="datetime-local" value={offerEnd}
                     onChange={e => setOfferEnd(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferDialog(null)}>Cancel</Button>
            <Button onClick={submitManualOffer}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
