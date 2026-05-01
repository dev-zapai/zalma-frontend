import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Clock, Scissors, MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PartnerRequestDialog from './PartnerRequestDialog';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

export default function SalonProfileDialog({ open, onOpenChange, tenantId, onPartnershipChange }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !tenantId) return;
    setLoading(true);
    api.get(`/partners/salon-profile/${tenantId}`)
      .then(r => setProfile(r.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [open, tenantId]);

  const handleRequestSent = () => {
    setRequestOpen(false);
    // Refresh profile to update partnership_status
    api.get(`/partners/salon-profile/${tenantId}`)
      .then(r => setProfile(r.data))
      .catch(() => {});
    if (onPartnershipChange) onPartnershipChange();
  };

  if (!open) return null;

  const p = profile;
  const hours = p?.business_hours || {};

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {loading || !p ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: p.theme_color || '#6366F1' }}>
                      {p.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-lg">{p.name}</DialogTitle>
                    <Badge variant="outline" className="mt-1 text-[10px] capitalize">{(p.type || '').replace('_', ' ')}</Badge>
                  </div>
                </div>
              </DialogHeader>

              {p.description && (
                <p className="text-sm text-slate-600 mt-2">{p.description}</p>
              )}

              {/* Contact */}
              <div className="space-y-2 mt-4">
                {p.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{[p.address, p.city, p.state, p.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {p.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{p.email}</span>
                  </div>
                )}
              </div>

              {/* Services */}
              {p.services?.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                    <Scissors className="h-4 w-4 text-primary" /> Services ({p.services.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {p.services.map((s, i) => (
                      <div key={i} className="rounded-lg border border-slate-100 p-2">
                        <p className="text-xs font-medium text-slate-800">{s.name}</p>
                        {s.duration_minutes && <p className="text-[10px] text-slate-400">{s.duration_minutes} min</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Hours */}
              {Object.keys(hours).length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                    <Clock className="h-4 w-4 text-primary" /> Business Hours
                  </h4>
                  <div className="space-y-1">
                    {DAY_ORDER.map(day => {
                      const h = hours[day];
                      return (
                        <div key={day} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 w-10">{DAY_SHORT[day]}</span>
                          <span className="text-slate-700">
                            {h?.open && h?.close ? `${h.open} - ${h.close}` : 'Closed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                {!p.partnership_status && (
                  <Button className="w-full" onClick={() => setRequestOpen(true)}>
                    <Send className="h-4 w-4 mr-2" /> Send Partner Request
                  </Button>
                )}
                {p.partnership_status === 'pending_sent' && (
                  <Button disabled className="w-full bg-amber-50 text-amber-700 border border-amber-200 cursor-default">
                    <Clock className="h-4 w-4 mr-2" /> Request Pending
                  </Button>
                )}
                {p.partnership_status === 'pending_received' && (
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                      try {
                        await api.put(`/partners/${p.partnership_id}/respond`, { action: 'accept' });
                        toast.success('Partnership accepted!');
                        handleRequestSent();
                      } catch (e) { toast.error('Failed'); }
                    }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-600" onClick={async () => {
                      try {
                        await api.put(`/partners/${p.partnership_id}/respond`, { action: 'reject' });
                        toast.success('Request rejected');
                        handleRequestSent();
                      } catch (e) { toast.error('Failed'); }
                    }}>Reject</Button>
                  </div>
                )}
                {p.partnership_status === 'accepted' && (
                  <Button className="w-full" onClick={() => { onOpenChange(false); navigate(`/dashboard/partners/${p.partnership_id}/chat`); }}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Open Chat
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PartnerRequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        targetTenantId={tenantId}
        targetName={p?.name}
        targetLogo={p?.logo_url}
        targetColor={p?.theme_color}
        onSuccess={handleRequestSent}
      />
    </>
  );
}
