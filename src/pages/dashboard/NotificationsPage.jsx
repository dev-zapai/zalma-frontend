import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, Check, CheckCheck, Clock, AlertTriangle, XCircle, Timer,
  FileText, DollarSign, UserCog, Mail, Shield, Cpu, UserPlus,
  Sparkles, Heart, AlertCircle, Ban, Phone, ChevronRight,
  MessageSquare, Send, Zap, RefreshCw, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { listItems } from '@/lib/listResponse';
import { toast } from 'sonner';

/* ── Constants ────────────────────────────────────────────────────────────── */

const CATEGORY_ICONS = {
  unconfirmed_appointment: Clock,
  arriving_soon: Bell,
  late_arrival: AlertTriangle,
  no_show: XCircle,
  repeat_no_show: Ban,
  groom_overdue: Timer,
  completed_not_billed: FileText,
  pending_payment: DollarSign,
  unassigned_staff: UserCog,
  missing_email: Mail,
  missing_vaccination: Shield,
  missing_microchip: Cpu,
  pending_client: UserPlus,
  allergy_alert: Heart,
  special_flag_alert: AlertCircle,
  new_client_arriving: Sparkles,
};

const PRIORITY_STYLES = {
  high: 'border-l-4 border-l-red-500 bg-red-50/40',
  medium: 'border-l-4 border-l-amber-500 bg-amber-50/40',
  low: 'border-l-4 border-l-blue-400 bg-blue-50/30',
};

const PRIORITY_BADGE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-600',
};

const STORED_TYPE_STYLES = {
  // Appointment lifecycle
  appointment_booked: 'bg-blue-100 text-blue-600',
  appointment_confirmed: 'bg-emerald-100 text-emerald-600',
  pet_checked_in: 'bg-teal-100 text-teal-600',
  groom_started: 'bg-orange-100 text-orange-600',
  groom_complete: 'bg-green-100 text-green-600',
  receipt_generated: 'bg-violet-100 text-violet-600',
  appointment_no_show: 'bg-yellow-100 text-yellow-600',
  appointment_cancelled: 'bg-red-100 text-red-600',
  // Leave
  leave_applied: 'bg-amber-100 text-amber-600',
  leave_approved: 'bg-green-100 text-green-600',
  leave_rejected: 'bg-red-100 text-red-600',
  // Staff
  staff_invited: 'bg-indigo-100 text-indigo-600',
  staff_joined: 'bg-emerald-100 text-emerald-600',
  // Partners
  partner_request_received: 'bg-blue-100 text-blue-600',
  partner_request_accepted: 'bg-green-100 text-green-600',
  partner_request_declined: 'bg-slate-100 text-slate-600',
  partner_message_received: 'bg-blue-100 text-blue-600',
  // Billing
  plan_changed: 'bg-violet-100 text-violet-600',
  // System
  system_welcome: 'bg-primary/10 text-primary',
};

const TEMPLATE_VARIABLES = ['{{owner_name}}', '{{pet_name}}', '{{date}}', '{{time}}', '{{service_name}}', '{{staff_name}}'];

const TEMPLATE_LABELS = {
  booking_confirmation: { name: 'Booking Confirmation', desc: 'Sent immediately after a booking is created' },
  reminder_24h: { name: '24h Reminder', desc: 'Sent 24 hours before the appointment' },
  pet_ready: { name: 'Pet Ready for Pickup', desc: 'Sent when the groom is marked complete' },
  follow_up: { name: 'Follow-up Message', desc: 'Sent 2 days after the appointment' },
};

/* ── Tab A: All Notifications ─────────────────────────────────────────────── */

function AllNotificationsTab() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [seeded, setSeeded] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const res = await api.get('/notifications', { params });
      const items = listItems(res.data);

      // Auto-seed on first load if empty (generates notifications from existing data)
      if (items.length === 0 && !seeded && categoryFilter === 'all' && priorityFilter === 'all') {
        setSeeded(true);
        try {
          await api.post('/notifications/seed');
          const res2 = await api.get('/notifications', { params: { limit: 100 } });
          setNotifications(listItems(res2.data));
        } catch { setNotifications([]); }
      } else {
        setNotifications(items);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [categoryFilter, priorityFilter, seeded]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); fetchNotifs(); } catch { }
  };
  const markAllRead = async () => {
    try { await api.put('/notifications/mark-all-read'); fetchNotifs(); } catch { }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleClick = (n) => {
    if (n.entity_type === 'appointment' && n.entity_id) {
      navigate(`/dashboard/appointments/${n.entity_id}/detail`);
    } else if (n.entity_type === 'client' && n.entity_id) {
      navigate(`/dashboard/clients/${n.entity_id}`);
    } else if (n.entity_type === 'pet' && n.entity_id) {
      navigate(`/dashboard/pets/${n.entity_id}`);
    } else if (n.entity_type === 'leave') {
      navigate('/dashboard/absence');
    } else if (n.entity_type === 'partnership') {
      navigate('/dashboard/partners');
    } else if (n.entity_type === 'staff' && n.entity_id) {
      navigate(`/dashboard/staff/member/${n.entity_id}`);
    } else if (n.entity_type === 'invitation') {
      navigate('/dashboard/staff');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Category: All</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Priority: All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
        )}
      </div>

      <Card className="rounded-xl border-slate-200/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''} ${n.priority ? PRIORITY_STYLES[n.priority]?.replace('bg-', 'hover:bg-') : ''}`}
                  style={{ borderLeftWidth: n.priority ? 4 : 0, borderLeftColor: n.priority === 'high' ? '#ef4444' : n.priority === 'medium' ? '#f59e0b' : '#60a5fa' }}
                  onClick={() => handleClick(n)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${STORED_TYPE_STYLES[n.type] || 'bg-slate-100 text-slate-600'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      {n.priority && <Badge className={`text-[10px] rounded-full ${PRIORITY_BADGE[n.priority] || ''}`}>{n.priority}</Badge>}
                    </div>
                    {n.message && <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400">{n.created_at ? format(new Date(n.created_at), 'MMM d, h:mm a') : ''}</p>
                      {n.category && <Badge variant="outline" className="text-[10px] rounded-full capitalize">{n.category}</Badge>}
                    </div>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markRead(n.id); }} className="shrink-0">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tab B: Action Required ───────────────────────────────────────────────── */

function ActionRequiredTab() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/g/notifications/action-items');
      setItems(res.data.items || []);
      setSummary(res.data.summary || { total: 0, high: 0, medium: 0, low: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 60000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const handleAction = async (item, action) => {
    try {
      if (action === 'confirm') {
        await api.put(`/g/appointments/${item.entity_id}`, { status: 'confirmed' });
        toast.success('Appointment confirmed');
      } else if (action === 'cancel') {
        await api.put(`/g/appointments/${item.entity_id}`, { status: 'cancelled' });
        toast.success('Appointment cancelled');
      } else if (action === 'check_in') {
        await api.put(`/g/appointments/${item.entity_id}`, { status: 'checked_in' });
        toast.success('Pet checked in');
      } else if (action === 'mark_no_show') {
        await api.put(`/g/appointments/${item.entity_id}`, { status: 'no_show' });
        toast.success('Marked as no-show');
      } else if (action === 'call') {
        if (item.context?.phone) window.open(`tel:${item.context.phone}`);
        return;
      } else if (action === 'generate_receipt' || action === 'check_status' || action === 'assign_staff') {
        navigate(`/dashboard/appointments/${item.entity_id}/detail`);
        return;
      } else if (action === 'add_email' || action === 'complete_profile' || action === 'review_profile' || action === 'flag_client') {
        navigate(`/dashboard/clients/${item.context?.client_id || item.entity_id}`);
        return;
      } else if (action === 'update_record') {
        navigate(`/dashboard/pets/${item.context?.pet_id || item.entity_id}`);
        return;
      } else if (action === 'acknowledge') {
        setDismissed(prev => new Set([...prev, item.id]));
        return;
      } else if (action === 'reschedule') {
        navigate(`/dashboard/appointments/${item.entity_id}/detail`);
        return;
      }
      fetchItems();
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const ACTION_LABELS = {
    confirm: { label: 'Confirm', variant: 'default', className: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    call: { label: 'Call', variant: 'outline', className: '' },
    cancel: { label: 'Cancel', variant: 'outline', className: 'text-red-600 border-red-200 hover:bg-red-50' },
    check_in: { label: 'Check In', variant: 'default', className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    mark_no_show: { label: 'No-Show', variant: 'outline', className: 'text-red-600 border-red-200 hover:bg-red-50' },
    check_status: { label: 'Check Status', variant: 'outline', className: '' },
    generate_receipt: { label: 'Generate Receipt', variant: 'outline', className: '' },
    assign_staff: { label: 'Assign Staff', variant: 'outline', className: '' },
    add_email: { label: 'Add Email', variant: 'outline', className: '' },
    update_record: { label: 'Update', variant: 'outline', className: '' },
    complete_profile: { label: 'Complete Profile', variant: 'outline', className: '' },
    review_profile: { label: 'Review', variant: 'outline', className: '' },
    acknowledge: { label: 'Dismiss', variant: 'ghost', className: 'text-slate-500' },
    flag_client: { label: 'Flag Client', variant: 'outline', className: 'text-red-600 border-red-200 hover:bg-red-50' },
    reschedule: { label: 'Reschedule', variant: 'outline', className: '' },
    send_reminder: { label: 'Send Reminder', variant: 'outline', className: '' },
  };

  const visibleItems = items.filter(i => !dismissed.has(i.id));
  const highItems = visibleItems.filter(i => i.priority === 'high');
  const mediumItems = visibleItems.filter(i => i.priority === 'medium');
  const lowItems = visibleItems.filter(i => i.priority === 'low');

  const renderItem = (item) => {
    const Icon = CATEGORY_ICONS[item.category] || Bell;
    const ctx = item.context || {};
    return (
      <div key={item.id} className={`rounded-xl p-4 ${PRIORITY_STYLES[item.priority] || ''} transition-all`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            item.priority === 'high' ? 'bg-red-100 text-red-600' :
            item.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {[ctx.species, ctx.breed].filter(Boolean).join(' · ')}
              {ctx.owner_name ? ` · ${ctx.owner_name}` : ''}
              {ctx.phone ? ` · ${ctx.phone}` : ''}
              {ctx.staff_name ? ` · Staff: ${ctx.staff_name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(item.actions || []).map(action => {
              const cfg = ACTION_LABELS[action] || { label: action, variant: 'outline', className: '' };
              return (
                <Button
                  key={action}
                  variant={cfg.variant}
                  size="sm"
                  className={`h-7 text-xs px-2.5 ${cfg.className}`}
                  onClick={() => handleAction(item, action)}
                >
                  {action === 'call' && <Phone className="h-3 w-3 mr-1" />}
                  {cfg.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="py-16 text-center text-slate-400 text-sm">Loading action items...</div>;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-slate-100 text-slate-700 text-sm px-3 py-1">{summary.total} items</Badge>
        {summary.high > 0 && <Badge className="bg-red-100 text-red-700 text-sm px-3 py-1">{summary.high} High</Badge>}
        {summary.medium > 0 && <Badge className="bg-amber-100 text-amber-700 text-sm px-3 py-1">{summary.medium} Medium</Badge>}
        {summary.low > 0 && <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">{summary.low} Low</Badge>}
        <Button variant="ghost" size="sm" onClick={fetchItems} className="ml-auto h-8 text-xs text-slate-500">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {visibleItems.length === 0 ? (
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="py-16 text-center text-slate-400">
            <Check className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">All clear! No action items right now.</p>
            <p className="text-xs mt-1">Items will appear here as appointments come in today.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {highItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> High Priority
              </h3>
              <div className="space-y-2">{highItems.map(renderItem)}</div>
            </div>
          )}
          {mediumItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Medium Priority</h3>
              <div className="space-y-2">{mediumItems.map(renderItem)}</div>
            </div>
          )}
          {lowItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Low Priority</h3>
              <div className="space-y-2">{lowItems.map(renderItem)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Tab C: Automations ───────────────────────────────────────────────────── */

function AutomationsTab() {
  const [automations, setAutomations] = useState(null);
  const [saving, setSaving] = useState(false);
  const [commLog, setCommLog] = useState([]);
  const [logStatus, setLogStatus] = useState('sent');
  const [loadingLog, setLoadingLog] = useState(false);

  useEffect(() => {
    api.get('/g/notifications/automations')
      .then(r => setAutomations(r.data.automations || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingLog(true);
    api.get('/g/notifications/communication-log', { params: { status: logStatus, limit: 50 } })
      .then(r => setCommLog(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoadingLog(false));
  }, [logStatus]);

  const updateTemplate = (key, field, value) => {
    setAutomations(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/g/notifications/automations', { automations });
      toast.success('Automation settings saved');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  if (!automations) return <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Automation Templates */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">Automation Templates</h2>
        <p className="text-xs text-slate-500 mb-4">Configure automated messages sent to clients. Integration with SMS/Email providers coming soon.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(automations).map(([key, config]) => {
            const meta = TEMPLATE_LABELS[key] || { name: key, desc: '' };
            return (
              <Card key={key} className="rounded-xl border-slate-200/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{meta.name}</h3>
                      <p className="text-[11px] text-slate-400">{meta.desc}</p>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={v => updateTemplate(key, 'enabled', v)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-slate-500">Channel</Label>
                      <Select value={config.channel || 'sms'} onValueChange={v => updateTemplate(key, 'channel', v)}>
                        <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500">Timing</Label>
                      <p className="text-xs text-slate-700 mt-1.5 h-8 flex items-center">{config.timing_label || config.timing}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">Template</Label>
                    <Textarea
                      value={config.template || ''}
                      onChange={e => updateTemplate(key, 'template', e.target.value)}
                      className="mt-0.5 text-xs min-h-[60px]"
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {TEMPLATE_VARIABLES.map(v => (
                        <Badge key={v} variant="outline" className="text-[10px] cursor-pointer hover:bg-slate-100"
                          onClick={() => updateTemplate(key, 'template', (config.template || '') + ' ' + v)}>
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {saving ? 'Saving...' : 'Save Automation Settings'}
          </Button>
        </div>
      </div>

      {/* Message Log */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">Message Log</h2>
        <p className="text-xs text-slate-500 mb-4">History of automated messages sent to clients.</p>

        <div className="flex items-center gap-2 mb-4">
          {['sent', 'scheduled', 'failed'].map(s => (
            <Button
              key={s}
              variant={logStatus === s ? 'default' : 'outline'}
              size="sm"
              className={`text-xs capitalize ${logStatus === s ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setLogStatus(s)}
            >
              {s === 'sent' && <Send className="h-3 w-3 mr-1" />}
              {s === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
              {s === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
              {s}
            </Button>
          ))}
        </div>

        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-0">
            {loadingLog ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
            ) : commLog.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {logStatus} messages</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {commLog.map(msg => (
                  <div key={msg.id} className="flex items-center gap-4 p-3 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{msg.owner_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{msg.subject || msg.body?.slice(0, 80) || '-'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{msg.channel}</Badge>
                    <Badge className={`text-[10px] rounded-full shrink-0 ${
                      msg.status === 'sent' ? 'bg-green-100 text-green-700' :
                      msg.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{msg.status}</Badge>
                    <span className="text-xs text-slate-400 shrink-0 w-28 text-right">
                      {msg.sent_at ? format(new Date(msg.sent_at), 'MMM d, h:mm a') : ''}
                    </span>
                    {msg.status === 'failed' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">
                        <RefreshCw className="h-3 w-3 mr-1" /> Resend
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    api.get('/g/notifications/action-items')
      .then(r => setActionCount(r.data?.summary?.total || 0))
      .catch(() => {});
  }, []);

  return (
    <div data-testid="notifications-page" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Alerts, reminders and messages</p>
      </div>

      <Tabs defaultValue="action-required">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="action-required" className="flex items-center gap-1.5">
            Action Required
            {actionCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] rounded-full h-5 min-w-[20px] flex items-center justify-center">
                {actionCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* This page is intentionally limited to system + action-required
            notifications for the salon team. All client-facing comms
            (SMS, Email, campaigns) live on the Automations page. */}
        <TabsContent value="all"><AllNotificationsTab /></TabsContent>
        <TabsContent value="action-required"><ActionRequiredTab /></TabsContent>
      </Tabs>
    </div>
  );
}
