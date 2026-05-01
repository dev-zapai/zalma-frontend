import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Zap, MessageSquare, Mail, Megaphone, History, RefreshCw, Send,
  CheckCircle2, XCircle, Users, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';


/**
 * Automations page. Three tabs:
 *
 *   Automations - enable/disable each automation per channel (SMS, Email)
 *                 and edit the message templates the clients receive.
 *   Campaigns   - one-off bulk SMS or Email blasts with per-campaign metrics.
 *   Logs        - unified history of every SMS and Email sent by any
 *                 automation or campaign.
 *
 * Template variables use double-brace syntax: {{owner_name}}, {{pet_name}}
 * etc. The backend renders at send time.
 */


const AUTOMATION_GROUPS = [
  {
    label: 'Booking lifecycle',
    keys: ['booking_confirmation', 'reminder_24h', 'pet_ready', 'followup'],
  },
  {
    label: 'Feedback and rebooking',
    keys: ['review_request', 'rebook_reminder'],
  },
  {
    label: 'Waitlist and partner transfers',
    keys: ['waitlist_confirmation'],
  },
  {
    label: 'Retention',
    keys: ['birthday', 'we_miss_you'],
  },
];


function VariableChips({ vars, onInsert }) {
  if (!vars?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {vars.map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onInsert(`{{${v}}}`)}
          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
        >
          {`{{${v}}}`}
        </button>
      ))}
    </div>
  );
}


function TemplateEditor({ autoKey, channel, cfg, meta, onSave, saving }) {
  const [enabled, setEnabled] = useState(!!cfg.enabled);
  const [subject, setSubject] = useState(cfg.subject || '');
  const [body, setBody] = useState(cfg.body || '');

  useEffect(() => {
    setEnabled(!!cfg.enabled);
    setSubject(cfg.subject || '');
    setBody(cfg.body || '');
  }, [cfg.enabled, cfg.subject, cfg.body]);

  const insertVar = (chip) => {
    setBody((b) => (b || '') + chip);
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{meta.blurb}</p>
          <p className="text-[11px] text-slate-400 mt-1">Trigger: {meta.trigger}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">{enabled ? 'On' : 'Off'}</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {channel === 'email' && (
        <div>
          <Label className="text-xs">Email subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 h-9 text-sm"
            placeholder="Subject line your clients see"
          />
        </div>
      )}

      <div>
        <Label className="text-xs">{channel === 'sms' ? 'SMS text' : 'Email body'}</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={channel === 'sms' ? 3 : 6}
          className="mt-1 text-sm"
          placeholder={channel === 'sms'
            ? 'Short SMS text. Keep under 160 characters.'
            : 'Full email body.'}
        />
      </div>

      <div>
        <p className="text-[11px] text-slate-400 mb-1">Click to insert:</p>
        <VariableChips vars={meta.variables || []} onInsert={insertVar} />
      </div>

      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          disabled={saving}
          onClick={() => {
            const patch = { enabled, body };
            if (channel === 'email') patch.subject = subject;
            onSave(autoKey, channel, patch);
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}


export default function AutomationsPage() {
  const [tab, setTab] = useState('automations');

  // Automation config
  const [cfg, setCfg] = useState(null);
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [savingKey, setSavingKey] = useState(null);  // key:channel

  // Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [campaignChannel, setCampaignChannel] = useState('sms');
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignSegment, setCampaignSegment] = useState('all');
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logChannel, setLogChannel] = useState('all');
  const [logKind, setLogKind] = useState('all');
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ── Fetch automation config
  const fetchConfig = async () => {
    setLoadingCfg(true);
    try {
      const res = await api.get('/g/automations/config');
      setCfg(res.data || {});
    } catch { toast.error('Failed to load automation config'); }
    setLoadingCfg(false);
  };

  const saveTemplate = async (key, channel, patch) => {
    const flag = `${key}:${channel}`;
    setSavingKey(flag);
    try {
      await api.put('/g/automations/config', { key, channel, config: patch });
      toast.success('Saved');
      fetchConfig();
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
    setSavingKey(null);
  };

  // ── Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/g/campaigns', { params: { limit: 50 } });
      setCampaigns(res.data?.items || []);
    } catch { toast.error('Failed to load campaigns'); }
  };

  const sendCampaign = async () => {
    if (!campaignBody.trim()) {
      toast.error('Please write the message body.');
      return;
    }
    if (campaignChannel === 'email' && !campaignSubject.trim()) {
      toast.error('Please enter a subject for the email campaign.');
      return;
    }
    setSendingCampaign(true);
    try {
      const res = await api.post('/g/campaigns', {
        channel: campaignChannel,
        name: campaignName || null,
        subject: campaignSubject || null,
        body: campaignBody,
        segment: campaignSegment,
      });
      const c = res.data;
      toast.success(`Campaign sent to ${c.sent_count} of ${c.total_recipients} clients (${c.failed_count} failed)`);
      setCampaignName('');
      setCampaignSubject('');
      setCampaignBody('');
      fetchCampaigns();
    } catch (e) { toast.error(e.response?.data?.detail || 'Campaign failed'); }
    setSendingCampaign(false);
  };

  // ── Fetch logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = {};
      if (logChannel !== 'all') params.channel = logChannel;
      if (logKind !== 'all') params.kind = logKind;
      const res = await api.get('/g/automations/logs', { params });
      setLogs(res.data?.items || []);
    } catch { toast.error('Failed to load logs'); }
    setLoadingLogs(false);
  };

  useEffect(() => {
    if (tab === 'automations') fetchConfig();
    else if (tab === 'campaigns') fetchCampaigns();
    else if (tab === 'logs') fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, logChannel, logKind]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" /> Automations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure automatic client communications, send one-off campaigns, and see everything sent in one place.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="automations" className="gap-1.5">
            <Zap className="h-4 w-4" /> Automations
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Megaphone className="h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <History className="h-4 w-4" /> Logs
          </TabsTrigger>
        </TabsList>

        {/* ════ Automations tab ════════════════════════════════════════════ */}
        <TabsContent value="automations" className="space-y-6">
          {loadingCfg || !cfg ? (
            <p className="text-sm text-slate-400 text-center py-10">Loading...</p>
          ) : (
            <Tabs defaultValue="sms" className="space-y-4">
              <TabsList>
                <TabsTrigger value="sms" className="gap-1.5">
                  <MessageSquare className="h-4 w-4" /> SMS
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5">
                  <Mail className="h-4 w-4" /> Email
                </TabsTrigger>
              </TabsList>

              {['sms', 'email'].map((channel) => (
                <TabsContent key={channel} value={channel} className="space-y-6">
                  {AUTOMATION_GROUPS.map(group => (
                    <Card key={group.label} className="rounded-xl border-slate-200/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{group.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {group.keys.map(k => {
                          const row = cfg[k];
                          if (!row) return null;
                          return (
                            <TemplateEditor
                              key={k}
                              autoKey={k}
                              channel={channel}
                              cfg={row[channel] || {}}
                              meta={row}
                              saving={savingKey === `${k}:${channel}`}
                              onSave={saveTemplate}
                            />
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        {/* ════ Campaigns tab ══════════════════════════════════════════════ */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> New Campaign
              </CardTitle>
              <CardDescription>
                Send a one-off SMS or Email blast to a segment of your clients. Only clients who opted in to marketing receive it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Channel</Label>
                  <Select value={campaignChannel} onValueChange={setCampaignChannel}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Who to send to</Label>
                  <Select value={campaignSegment} onValueChange={setCampaignSegment}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All opted-in clients</SelectItem>
                      <SelectItem value="new">New clients</SelectItem>
                      <SelectItem value="returning">Returning clients</SelectItem>
                      <SelectItem value="vip">VIPs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Internal name (optional)</Label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Spring Sale 2026"
                    className="mt-1"
                  />
                </div>
              </div>

              {campaignChannel === 'email' && (
                <div>
                  <Label className="text-xs">Email subject</Label>
                  <Input
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="Subject your clients see"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">
                  {campaignChannel === 'sms' ? 'SMS text' : 'Email body (HTML allowed)'}
                </Label>
                <Textarea
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  rows={campaignChannel === 'sms' ? 3 : 8}
                  className="mt-1"
                  placeholder={campaignChannel === 'sms'
                    ? 'Short SMS text. Keep under 160 characters.'
                    : 'Write your full email content. Plain text or HTML both work.'}
                />
                {campaignChannel === 'sms' && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {(campaignBody || '').length} characters
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  disabled={sendingCampaign}
                  onClick={sendCampaign}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sendingCampaign ? 'Sending...' : 'Send campaign'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Past campaigns
                  </CardTitle>
                  <CardDescription>
                    Delivery metrics for every campaign you have sent.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchCampaigns}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {campaigns.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">
                  No campaigns yet. Use the form above to send your first one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Sent</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right pr-6">Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map(c => {
                      const deliveryRate = c.total_recipients > 0
                        ? Math.round((c.sent_count / c.total_recipients) * 100)
                        : 0;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="pl-6 text-xs whitespace-nowrap text-slate-500">
                            {c.sent_at ? format(new Date(c.sent_at), 'dd MMM HH:mm') : '-'}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {c.name || c.subject || c.body?.slice(0, 60)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${
                              c.channel === 'sms' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'
                            }`}>
                              {c.channel?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize">{c.segment}</TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="flex items-center justify-end gap-1">
                              <Users className="h-3 w-3 text-slate-400" />
                              {c.total_recipients}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <span className="text-emerald-700 font-medium">{c.sent_count}</span>
                            <span className="text-slate-400 ml-1">({deliveryRate}%)</span>
                          </TableCell>
                          <TableCell className="text-right text-xs pr-6">
                            {c.failed_count > 0
                              ? <span className="text-rose-700 font-medium">{c.failed_count}</span>
                              : <span className="text-slate-400">0</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════ Logs tab ══════════════════════════════════════════════════ */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Communication history
              </CardTitle>
              <CardDescription>
                Every SMS and Email sent by your automations and campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-4 flex-wrap">
                <div>
                  <Label className="text-xs">Channel</Label>
                  <Select value={logChannel} onValueChange={setLogChannel}>
                    <SelectTrigger className="mt-1 h-9 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All channels</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Automation</Label>
                  <Select value={logKind} onValueChange={setLogKind}>
                    <SelectTrigger className="mt-1 h-9 w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="reminder_24h">24-hour Reminder</SelectItem>
                      <SelectItem value="pet_ready">Pet Ready</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="review_request">Review Request</SelectItem>
                      <SelectItem value="rebook_reminder">Rebooking Reminder</SelectItem>
                      <SelectItem value="waitlist_confirmation">Waitlist Confirmation</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="we_miss_you">We-miss-you</SelectItem>
                      <SelectItem value="marketing">Campaign</SelectItem>
                      <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} className="h-9">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                </Button>
              </div>

              {loadingLogs ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">
                  No communications yet.
                </p>
              ) : (
                <div className="rounded-lg border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">When</TableHead>
                        <TableHead className="text-xs">Channel</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Recipient</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap text-slate-500">
                            {log.sent_at ? format(new Date(log.sent_at), 'dd MMM HH:mm') : ''}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${
                              log.channel === 'sms' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'
                            }`}>
                              {log.channel?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {KIND_LABELS[log.kind] || log.subject || 'Other'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{log.recipient}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-md truncate">
                            {log.body}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


const KIND_LABELS = {
  booking_confirmation: 'Booking Confirmation',
  reminder_24h: '24-hour Reminder',
  appt_reminder: 'Appointment Reminder',
  pet_ready: 'Pet Ready',
  followup: 'Follow-up',
  review_request: 'Review Request',
  rebook_reminder: 'Rebooking Reminder',
  waitlist_confirmation: 'Waitlist Confirmation',
  marketing: 'Campaign',
  birthday: 'Birthday',
  we_miss_you: 'We-miss-you',
  tax_invoice: 'Tax Invoice',
};
