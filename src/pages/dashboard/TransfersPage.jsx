import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Share2, Check, X, Clock, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { listItems } from '@/lib/listResponse';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
  expired: 'bg-slate-100 text-slate-500',
};

export default function TransfersPage() {
  const [direction, setDirection] = useState('incoming');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/g/transfers/${direction}`);
      setItems(listItems(res.data));
    } catch { toast.error('Failed to load transfers'); }
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, [direction]);

  const handleAccept = async (t) => {
    if (!window.confirm(`Accept transfer for ${t.client_snapshot?.full_name || 'client'}?`)) return;
    try {
      await api.post(`/g/transfers/${t.id}/accept`, {});
      toast.success('Transfer accepted - new appointment created');
      fetchList();
    } catch (e) { toast.error(e.response?.data?.detail || 'Accept failed'); }
  };

  const handleDecline = async (t) => {
    const reason = window.prompt('Reason for declining (optional):', '');
    if (reason === null) return;
    try {
      await api.post(`/g/transfers/${t.id}/decline`, { reason });
      toast.success('Declined');
      fetchList();
    } catch (e) { toast.error(e.response?.data?.detail || 'Decline failed'); }
  };

  const handleCancel = async (t) => {
    if (!window.confirm('Withdraw this transfer request?')) return;
    try {
      await api.post(`/g/transfers/${t.id}/cancel`);
      toast.success('Transfer cancelled');
      fetchList();
    } catch { toast.error('Cancel failed'); }
  };

  const handleRegister = async (t) => {
    try {
      await api.post(`/g/transfers/${t.id}/register-client`);
      toast.success('Client registered to your CRM');
      fetchList();
    } catch (e) { toast.error(e.response?.data?.detail || 'Register failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" /> Partner Transfers
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Share overflow bookings with accepted partner salons. Source salon keeps the audit trail; partner handles the grooming.
        </p>
      </div>

      <Tabs value={direction} onValueChange={setDirection}>
        <TabsList>
          <TabsTrigger value="incoming">Incoming ({direction === 'incoming' ? items.length : '…'})</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing ({direction === 'outgoing' ? items.length : '…'})</TabsTrigger>
        </TabsList>

        <TabsContent value={direction}>
          {loading ? (
            <div className="text-sm text-slate-400 text-center py-10">Loading…</div>
          ) : items.length === 0 ? (
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="py-10 text-center text-slate-400 text-sm">
                No {direction} transfers yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {items.map(t => (
                <Card key={t.id} className="rounded-xl border-slate-200/60">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">
                            {t.client_snapshot?.full_name || 'Client'}
                          </h3>
                          {t.pet_snapshot?.name && (
                            <span className="text-xs text-slate-500">· {t.pet_snapshot.name}</span>
                          )}
                          <Badge className={`text-[10px] ${STATUS_COLORS[t.status] || ''}`}>
                            {t.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t.proposed_start ? format(new Date(t.proposed_start), 'dd MMM HH:mm') : '-'}
                          </span>
                          <span>
                            {direction === 'incoming'
                              ? <>From <strong>{t.source_tenant_name || 'partner'}</strong></>
                              : <>To <strong>{t.target_tenant_name || 'partner'}</strong></>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {direction === 'incoming' && t.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleAccept(t)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              <Check className="h-3.5 w-3.5 mr-1" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDecline(t)}>
                              <X className="h-3.5 w-3.5 mr-1" /> Decline
                            </Button>
                          </>
                        )}
                        {direction === 'outgoing' && t.status === 'pending' && (
                          <Button size="sm" variant="outline" className="text-rose-600"
                                  onClick={() => handleCancel(t)}>
                            Withdraw
                          </Button>
                        )}
                        {direction === 'incoming' && t.status === 'accepted' && (
                          <Button size="sm" variant="outline" onClick={() => handleRegister(t)}>
                            Register Client into CRM
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Snapshot body */}
                    <div className="grid sm:grid-cols-3 gap-3 text-xs bg-slate-50 rounded-lg p-3">
                      <div>
                        <div className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Client</div>
                        <div className="text-slate-700">
                          {t.client_snapshot?.full_name || '-'}
                        </div>
                        {t.client_snapshot?.phone && (
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {t.client_snapshot.phone}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Pet</div>
                        <div className="text-slate-700">
                          {t.pet_snapshot?.name || '-'}
                          {t.pet_snapshot?.breed && ` · ${t.pet_snapshot.breed}`}
                        </div>
                        {t.pet_snapshot?.species && (
                          <div className="text-slate-500 mt-0.5">{t.pet_snapshot.species}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Services</div>
                        <ul className="text-slate-700 space-y-0.5">
                          {(t.service_snapshot || []).map((s, i) => (
                            <li key={i}>
                              {s.name} <span className="text-slate-400">· {s.duration_minutes}m</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Partner location (for accepted outgoing / pending incoming) */}
                    {direction === 'outgoing' && t.target_tenant_address && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.target_tenant_address}
                      </div>
                    )}
                    {t.note_from_source && (
                      <p className="text-xs text-slate-600 italic">"{t.note_from_source}"</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
