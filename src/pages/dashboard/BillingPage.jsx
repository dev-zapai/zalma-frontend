import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard, TrendingUp, BarChart3, Mail, MessageSquare, Phone,
  CalendarCheck, DollarSign, CheckCircle, AlertCircle, Zap, Star, Trash2, Plus,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { formatPrice } from '@/lib/currency';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import AddCardModal from '@/components/AddCardModal';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

const PLAN_COLORS = { growth: 'bg-slate-100 text-slate-700', premium: 'bg-blue-100 text-blue-700', ultimate: 'bg-violet-100 text-violet-700' };
const PLAN_ORDER = ['growth', 'premium', 'ultimate'];
// Post-migration-044, tenants.plan only ever holds growth / premium / ultimate.
// The legacy value 'basic' still gets translated (old lowest -> new lowest),
// 'advanced' also translated (old top -> new top), but we do NOT translate
// a bare 'growth' because it's now the canonical new lowest tier. Earlier
// versions of this mapper rewrote 'growth' -> 'premium' and caused tenants
// on the new lowest tier to display as middle tier.
const normalisePlan = (p) => {
  if (!p) return 'growth';
  if (p === 'growth' || p === 'premium' || p === 'ultimate') return p;
  if (p === 'basic') return 'growth';
  if (p === 'advanced') return 'ultimate';
  return 'growth';
};

// Last-resort fallback so the Plan & Cards tab always renders the three cards
// even if `/billing/plan` misbehaves, returns legacy keys, or the backend is
// mid-deploy. Matches docs/pricing-plans.md verbatim.
const PLAN_FALLBACK = {
  growth: {
    rate: 0.39, minimum: 0,
    description: 'For groomers who want a solid operating system',
    included: { sms: 0, email: 0, voice_minutes: 0 },
    features: [
      'Appointment calendar + KPI cards',
      'Staff availability + employment',
      'Client + pet profiles (compliance-ready)',
      'Pet medical history + before/after photos',
      'Automated tax invoices',
      'Google Maps booking link + free website',
      'Waitlist',
      'Unlimited users & appointments',
    ],
    phase2: [],
  },
  premium: {
    rate: 0.74, minimum: 49,
    description: 'Automate enquiries, rebookings, reminders, reviews',
    included: { sms: 400, email: 500, voice_minutes: 100 },
    features: [
      'Everything in Growth',
      'Leave / Absence management',
      'Advanced analytics',
      'Partnerships + Transfer bookings + Partner chat',
      'Appointment reminders (SMS + Email)',
      'Review-request automation',
      'Rebooking reminders',
      'Marketing campaigns (SMS + Email)',
      'Membership plans',
      'Automated tax invoice email',
    ],
    phase2: [
      '24x7 AI auto-reply on Instagram',
      'Missed-call SMS auto-reply',
      '24x7 AI receptionist (voice)',
      'Rev Growth Engine',
    ],
  },
  ultimate: {
    rate: 0.99, minimum: 99,
    description: 'Turn the salon into a Revenue Engine',
    included: { sms: 600, email: 2000, voice_minutes: 150 },
    features: [
      'Everything in Premium',
      'Explore map (salon discovery)',
      'Custom salon website builder',
      'Birthday greetings + We-miss-you reminders',
      'Client-specific discounts',
    ],
    phase2: [
      'Customer acquisition via salon partnering',
      'Matting complexity quote automation',
      'Ideal slot booking optimiser',
      'Last-minute availability notifier',
      'Stripe invoice payment integration',
      'Client tier classifier + profile flags',
      'Card on file + deposit automation',
      'Peak booking slot protection + deposits',
      'Client lifetime value maximiser',
      'Visit tracker + pet-type reminders',
      'Personalised discount recommendations',
      'Negative Google review alerts',
    ],
  },
};
const CHART_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6'];

export default function BillingPage() {
  const { profile } = useAuth();
  const { refreshTenantPlan } = useOutletContext() || {};
  const isAdmin = profile?.is_admin || profile?.role === 'admin';
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [revenue, setRevenue] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const usageParams = (dateFrom && dateTo)
        ? { from_date: dateFrom, to_date: dateTo }
        : { month: selectedMonth };
      const [planRes, usageRes, invRes, cardsRes, revRes] = await Promise.all([
        api.get('/billing/plan'),
        api.get('/billing/usage', { params: usageParams }),
        api.get('/billing/invoices'),
        api.get('/billing/payment-methods').catch(() => ({ data: [] })),
        api.get('/g/analytics/revenue', { params: { period: 'month' } }).catch(() => ({ data: { revenue: 0 } })),
      ]);
      setPlan(planRes.data);
      setUsage(usageRes.data);
      setInvoices(invRes.data || []);
      setCards(cardsRes.data || []);
      setRevenue(revRes.data?.revenue || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedMonth, dateFrom, dateTo]);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin, fetchAll]);

  const handleSetDefault = async (pmId) => {
    try {
      await api.post('/billing/set-default-payment-method', { payment_method_id: pmId });
      toast.success('Default card updated');
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleRemoveCard = async (pmId) => {
    if (!window.confirm('Remove this card?')) return;
    try {
      await api.delete(`/billing/payment-methods/${pmId}`);
      toast.success('Card removed');
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  // One-click retrofit for tenants whose appointments pre-date the billing
  // hooks — calls /billing/backfill-bookings and refreshes the dashboard.
  const [backfilling, setBackfilling] = useState(false);
  const handleBackfillBookings = async () => {
    setBackfilling(true);
    try {
      const res = await api.post('/billing/backfill-bookings');
      const n = res.data?.backfilled ?? 0;
      if (n > 0) toast.success(`Retrofit complete - ${n} historical bookings now tracked`);
      else toast.info('Nothing to retrofit - all bookings are tracked');
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Retrofit failed'); }
    setBackfilling(false);
  };

  // Compute next-month 1st locally for the confirmation dialog. The backend
  // is authoritative; this is just for the user message.
  const _firstOfNextMonth = () => {
    const d = new Date();
    const nm = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return nm.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleUpgrade = async (newPlan) => {
    const cur = normalisePlan(currentPlan);
    const isDowngrade = PLAN_ORDER.indexOf(newPlan) < PLAN_ORDER.indexOf(cur);
    const RATES = { growth: 0.39, premium: 0.74, ultimate: 0.99 };
    const MIN = { growth: 0, premium: 49, ultimate: 99 };

    const lostMap = {
      growth: 'Leave management, Advanced analytics, Partnerships, Transfers, SMS/Email automations, Marketing campaigns',
      premium: 'Explore map, Website builder, Birthday greetings, We-miss-you reminders, Client-specific discounts',
    };
    const gainMap = {
      premium: 'Leave management, Advanced analytics, Partnerships, Transfers, Appointment reminders (SMS/Email), Review requests, Rebooking reminders, Marketing campaigns, 400 SMS + 500 emails/month',
      ultimate: 'Explore map, Website builder, Birthday greetings + We-miss-you + client-specific discounts, 600 SMS + 2,000 emails + 150 AI mins/month',
    };

    let msg;
    if (isDowngrade) {
      msg = `Downgrade to ${newPlan[0].toUpperCase() + newPlan.slice(1)}?\n\nYou will lose access to:\n- ${(lostMap[newPlan] || '').split(', ').join('\n- ')}\n\n`
          + `Downgrades take effect on ${_firstOfNextMonth()} (the first day of your next billing month). You will keep your current plan until then so this month's bookings are billed correctly.`;
    } else {
      msg = `Upgrade to ${newPlan[0].toUpperCase() + newPlan.slice(1)}?\n\nYou will unlock:\n- ${(gainMap[newPlan] || '').split(', ').join('\n- ')}\n\nPer-booking rate: A$${RATES[newPlan].toFixed(2)}` +
            (MIN[newPlan] > 0 ? `\nMonthly minimum: A$${MIN[newPlan].toFixed(0)}` : '\nNo monthly minimum') +
            `\n\nThe upgrade takes effect immediately.`;
    }

    if (!window.confirm(msg)) return;
    try {
      const res = await api.post('/billing/upgrade', { plan: newPlan });
      if (res.data?.scheduled) {
        const effective = res.data.pending_plan_effective_at
          ? new Date(res.data.pending_plan_effective_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
          : 'next month';
        toast.success(`Downgrade to ${newPlan[0].toUpperCase() + newPlan.slice(1)} scheduled for ${effective}`);
      } else {
        toast.success(`Plan changed to ${newPlan[0].toUpperCase() + newPlan.slice(1)}`);
      }
      fetchAll();
      if (refreshTenantPlan) refreshTenantPlan();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleCancelPendingChange = async () => {
    try {
      await api.post('/billing/cancel-pending-change');
      toast.success('Scheduled change cancelled');
      fetchAll();
      if (refreshTenantPlan) refreshTenantPlan();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  if (!isAdmin) return <div className="text-center py-20 text-slate-400"><CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>Billing is accessible to admins only</p></div>;
  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const u = usage?.usage || {};
  const rates = plan?.rates || { booking: 0.39, sms: 0.05, email: 0.001, voice_minute: 0.10 };
  const currentPlan = normalisePlan(plan?.plan);
  const subtotal = usage?.subtotal || 0;
  const zalmaCostPerAppt = usage?.total_appointments > 0 ? subtotal / usage.total_appointments : 0;
  const revenueRatio = subtotal > 0 ? revenue / subtotal : 0;

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMM yyyy') };
  });

  const pieData = [
    { name: 'Bookings', value: u.bookings?.amount || 0 },
    { name: 'SMS', value: u.sms?.amount || 0 },
    { name: 'Email', value: u.email?.amount || 0 },
    { name: 'Voice', value: u.voice?.amount || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usage & Billing</h1>
        <p className="text-sm text-slate-500 mt-1">Track usage, view invoices, manage cards and subscription</p>
      </div>

      {/* Pending plan change (scheduled downgrade) banner */}
      {plan?.pending_plan && plan?.pending_plan_effective_at && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Scheduled downgrade to {plan.pending_plan[0].toUpperCase() + plan.pending_plan.slice(1)}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Takes effect on {new Date(plan.pending_plan_effective_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.
              Your current plan stays active until then so this month's bookings bill at the right rate.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleCancelPendingChange} className="shrink-0">
            Cancel change
          </Button>
        </div>
      )}

      {/* Upgrade prompts */}
      {currentPlan === 'growth' && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <Zap className="h-6 w-6 text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Unlock more with Premium</p>
            <p className="text-xs text-blue-700 mt-0.5">Leave management, advanced analytics, Partnerships + Transfers, SMS/Email automations, marketing campaigns.</p>
          </div>
          <Button size="sm" onClick={() => handleUpgrade('premium')} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">Upgrade to Premium</Button>
        </div>
      )}
      {currentPlan === 'premium' && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50 border border-violet-200">
          <Zap className="h-6 w-6 text-violet-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-900">Go further with Ultimate</p>
            <p className="text-xs text-violet-700 mt-0.5">Explore map, custom website builder, birthday greetings, we-miss-you reminders, client-specific discounts.</p>
          </div>
          <Button size="sm" onClick={() => handleUpgrade('ultimate')} className="bg-violet-600 hover:bg-violet-700 text-white shrink-0">Upgrade to Ultimate</Button>
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><TrendingUp className="h-4 w-4" /> Usage Details</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><DollarSign className="h-4 w-4" /> Invoices</TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5"><Zap className="h-4 w-4" /> Plan & Cards</TabsTrigger>
          </TabsList>

          {activeTab !== 'plan' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={dateFrom ? '__custom__' : selectedMonth} onValueChange={v => { setSelectedMonth(v); setDateFrom(''); setDateTo(''); }}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
              {activeTab !== 'invoices' && (
                <>
                  <div className="w-px h-5 bg-slate-200" />
                  <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); if (dateTo && e.target.value > dateTo) setDateTo(e.target.value); }}
                    className={`h-8 px-2 text-xs rounded-lg border ${dateFrom ? 'border-primary bg-primary/5' : 'border-slate-200'} text-slate-700 focus:outline-none focus:border-primary`} />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); if (dateFrom && e.target.value < dateFrom) setDateFrom(e.target.value); }}
                    className={`h-8 px-2 text-xs rounded-lg border ${dateTo ? 'border-primary bg-primary/5' : 'border-slate-200'} text-slate-700 focus:outline-none focus:border-primary`} />
                  {dateFrom && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>}
                </>
              )}
            </div>
          )}
        </div>

        {/* ══ Overview ═══════════════════════════════════════════════════ */}
        <TabsContent value="overview">
          {/* Retrofit banner - shown when this period has real appointments
              but zero billed bookings (i.e. record_usage hadn't been wired
              when those appts were created). One click runs the backfill. */}
          {usage?.total_appointments > 0 && (u.bookings?.count || 0) === 0 && (
            <Card className="rounded-xl border-amber-200 bg-amber-50/50 mb-4">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    {usage.total_appointments} appointment{usage.total_appointments === 1 ? '' : 's'} in this period aren't being tracked for billing
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Looks like these bookings pre-date the billing hooks. One click retrofits them into the tracking system.
                  </p>
                </div>
                <Button size="sm" onClick={handleBackfillBookings} disabled={backfilling}
                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                  {backfilling ? 'Retrofitting…' : 'Retrofit now'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Revenue vs Billing ROI */}
          {(revenue > 0 || subtotal > 0) && (
            <Card className="rounded-xl border-slate-200/60 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900">
                      {revenueRatio > 0
                        ? <>For every <span className="text-primary">A$1</span> you spend on Zalma, you earn <span className="text-emerald-600">A${revenueRatio.toFixed(0)}</span> in revenue</>
                        : 'Start booking appointments to see your Zalma ROI'
                      }
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      This month: {formatPrice(revenue, 'AUD')} revenue / {formatPrice(subtotal, 'AUD')} Zalma cost
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-4 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
                <Badge className={`rounded-full text-xs capitalize ${PLAN_COLORS[currentPlan]}`}>{currentPlan}</Badge>
                <p className="text-xs text-slate-500 mt-1">Plan</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-4 text-center">
                <CalendarCheck className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{u.bookings?.count || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">Bookings</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-2xl font-bold text-emerald-600">{u.sms?.count || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">SMS Sent</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-4 text-center">
                <Mail className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold text-amber-600">{u.email?.count || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">Emails Sent</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-4 text-center">
                <Phone className="h-5 w-5 mx-auto mb-1 text-violet-500" />
                <p className="text-2xl font-bold text-violet-600">{u.voice?.minutes || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">Voice Minutes</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-rose-500" />
                <p className="text-2xl font-bold text-rose-600">{formatPrice(subtotal, 'AUD')}</p>
                <p className="text-xs text-slate-500 mt-0.5">Est. Bill</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3"><CardTitle className="text-base">Daily Usage Trend</CardTitle></CardHeader>
              <CardContent>
                {(usage?.daily || []).length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No usage data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={usage.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `A$${Number(v).toFixed(2)}`} />
                      <Bar dataKey="bookings" name="Bookings" fill="#2563EB" stackId="a" />
                      <Bar dataKey="sms" name="SMS" fill="#10B981" stackId="a" />
                      <Bar dataKey="email" name="Email" fill="#F59E0B" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3"><CardTitle className="text-base">Cost Breakdown</CardTitle></CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No costs yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `A$${Number(v).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ Usage Details ═══════════════════════════════════════════════ */}
        <TabsContent value="usage">
          {/* Per-plan breakdown: shown whenever this period's usage
              includes events from a plan other than the tenant's current
              plan. Two scenarios where that's true:
                 1. Tenant upgraded mid-month (prior bookings at lower
                    rate, new bookings at higher rate — 2+ plans present).
                 2. Tenant was on a higher plan, bookings recorded at
                    that rate, then switched plans — even with only one
                    plan in the breakdown the rate differs from current,
                    so we still show it to avoid the confusing "Rate:
                    A$0.39, Amount: A$21.78" mismatch on the itemised
                    line. */}
          {usage?.plan_breakdown && usage.plan_breakdown.length > 0 &&
            (usage.plan_breakdown.length > 1 ||
             usage.plan_breakdown[0].plan !== currentPlan) && (
            <Card className="rounded-xl border-slate-200/60 mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Usage by plan</CardTitle>
                <CardDescription>
                  Each booking is billed at the rate of the plan that was active when it was made.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Plan</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">SMS</TableHead>
                      <TableHead className="text-right">Emails</TableHead>
                      <TableHead className="text-right pr-6">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.plan_breakdown.map(b => (
                      <TableRow key={b.plan}>
                        <TableCell className="pl-6">
                          <Badge className={`rounded-full text-xs capitalize ${PLAN_COLORS[b.plan] || ''}`}>
                            {b.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{b.bookings?.count || 0}</TableCell>
                        <TableCell className="text-right text-slate-500">A${(b.bookings?.rate ?? 0).toFixed(2)} / booking</TableCell>
                        <TableCell className="text-right">{b.sms?.count || 0}</TableCell>
                        <TableCell className="text-right">{b.email?.count || 0}</TableCell>
                        <TableCell className="text-right font-bold pr-6">
                          {formatPrice(b.total || 0, 'AUD')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Itemised Usage</CardTitle>
              <CardDescription>{usage?.period?.start} to {usage?.period?.end}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Category</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Free Included</TableHead>
                    <TableHead className="text-right">Billable</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // If usage spans multiple plans (or a plan other than
                    // the tenant's current one), we can't print a single
                    // rate on the bookings row without it being misleading.
                    // Show a "mixed" hint instead; the per-plan breakdown
                    // above already itemises the split.
                    const bookingPlans = new Set(
                      (usage?.plan_breakdown || [])
                        .filter(b => (b.bookings?.count || 0) > 0)
                        .map(b => b.plan)
                    );
                    const mixedBookingRate = bookingPlans.size > 1 ||
                      (bookingPlans.size === 1 && !bookingPlans.has(currentPlan));
                    return (
                      <TableRow>
                        <TableCell className="pl-6"><div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-blue-500" /> Bookings</div></TableCell>
                        <TableCell className="text-right">{u.bookings?.count || 0}</TableCell>
                        <TableCell className="text-right text-slate-400">0</TableCell>
                        <TableCell className="text-right font-medium">{u.bookings?.count || 0}</TableCell>
                        <TableCell className="text-right text-slate-500">
                          {mixedBookingRate
                            ? <span className="italic text-slate-400">see breakdown above</span>
                            : <>A${rates.booking} / booking</>}
                        </TableCell>
                        <TableCell className="text-right font-bold pr-6">{formatPrice(u.bookings?.amount || 0, 'AUD')}</TableCell>
                      </TableRow>
                    );
                  })()}
                  <TableRow>
                    <TableCell className="pl-6"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-emerald-500" /> SMS</div></TableCell>
                    <TableCell className="text-right">{u.sms?.count || 0}</TableCell>
                    <TableCell className="text-right text-green-600">{u.sms?.included || 0}</TableCell>
                    <TableCell className="text-right font-medium">{usage?.billable?.sms || 0}</TableCell>
                    <TableCell className="text-right text-slate-500">A${rates.sms} / SMS</TableCell>
                    <TableCell className="text-right font-bold pr-6">{formatPrice((usage?.billable?.sms || 0) * rates.sms, 'AUD')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-500" /> Email</div></TableCell>
                    <TableCell className="text-right">{u.email?.count || 0}</TableCell>
                    <TableCell className="text-right text-green-600">{u.email?.included || 0}</TableCell>
                    <TableCell className="text-right font-medium">{usage?.billable?.email || 0}</TableCell>
                    <TableCell className="text-right text-slate-500">A${rates.email} / email</TableCell>
                    <TableCell className="text-right font-bold pr-6">{formatPrice((usage?.billable?.email || 0) * rates.email, 'AUD')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6"><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-violet-500" /> Voice</div></TableCell>
                    <TableCell className="text-right">{u.voice?.minutes || 0} min</TableCell>
                    <TableCell className="text-right text-green-600">{u.voice?.included || 0} min</TableCell>
                    <TableCell className="text-right font-medium">{usage?.billable?.voice_minutes || 0} min</TableCell>
                    <TableCell className="text-right text-slate-500">A${rates.voice_minute} / min</TableCell>
                    <TableCell className="text-right font-bold pr-6">{formatPrice((usage?.billable?.voice_minutes || 0) * rates.voice_minute, 'AUD')}</TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell className="pl-6" colSpan={5}>Estimated Total</TableCell>
                    <TableCell className="text-right text-lg pr-6">{formatPrice(subtotal, 'AUD')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Invoices ════════════════════════════════════════════════════ */}
        <TabsContent value="invoices">
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Invoice History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(() => {
                const filtered = invoices.filter(inv => inv.period_start?.startsWith(selectedMonth));
                return filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400"><DollarSign className="h-10 w-10 mx-auto mb-2 opacity-40" /><p className="text-sm">No invoices for this month</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="pl-6">Period</TableHead><TableHead>Plan</TableHead>
                    <TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Messages</TableHead>
                    <TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 text-sm font-medium">{inv.period_start} to {inv.period_end}</TableCell>
                        <TableCell><Badge className={`rounded-full text-xs capitalize ${PLAN_COLORS[inv.plan]}`}>{inv.plan}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{inv.booking_count}</TableCell>
                        <TableCell className="text-right text-sm">{(inv.sms_count || 0) + (inv.email_count || 0)}</TableCell>
                        <TableCell className="text-right text-sm font-bold">{formatPrice(inv.total, 'AUD')}</TableCell>
                        <TableCell><Badge className={`rounded-full text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Plan & Cards ════════════════════════════════════════════════ */}
        <TabsContent value="plan">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Choose your plan</h2>
            <p className="text-sm text-slate-500">Pay per booking. No lock-in contracts. Upgrades take effect immediately. Downgrades apply from the 1st of your next billing month so this month's usage stays on its original rate.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {[
              { key: 'growth',   name: 'Growth',   tagline: 'For groomers who want a solid operating system', btnColor: '' },
              { key: 'premium',  name: 'Premium',  tagline: 'Automate enquiries, rebookings, reminders, reviews', popular: true, btnColor: 'bg-blue-600 hover:bg-blue-700 text-white' },
              { key: 'ultimate', name: 'Ultimate', tagline: 'Turn the salon into a Revenue Engine', btnColor: 'bg-violet-600 hover:bg-violet-700 text-white' },
            ].map(meta => {
              // Prefer the server-provided metadata; fall back to the
              // hardcoded copy if the /billing/plan response is missing
              // this key (stale backend, mid-deploy, etc.) so the tab
              // never silently shows zero cards.
              const p = plan?.all_plans?.[meta.key] || PLAN_FALLBACK[meta.key];
              if (!p) return null;
              const isCurrent = currentPlan === meta.key;
              const isUpgrade = PLAN_ORDER.indexOf(meta.key) > PLAN_ORDER.indexOf(currentPlan);
              const incl = p.included || {};
              const phase2 = p.phase2 || [];
              const minimum = p.minimum || 0;

              return (
                <div
                  key={meta.key}
                  className={`relative rounded-2xl border-2 p-6 bg-white flex flex-col ${
                    isCurrent ? 'border-primary shadow-lg shadow-primary/10'
                    : meta.popular ? 'border-blue-200'
                    : 'border-slate-200'
                  }`}
                >
                  {meta.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white rounded-full px-3 py-0.5 text-xs font-medium shadow-sm">Most Popular</Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-0.5 text-xs font-medium shadow-sm">Current Plan</Badge>
                    </div>
                  )}

                  <div className="mb-4 pt-1">
                    <h3 className="text-xl font-bold text-slate-900">{meta.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{meta.tagline}</p>
                  </div>

                  <div className="mb-1">
                    <span className="text-4xl font-bold text-slate-900">A${p.rate?.toFixed(2)}</span>
                    <span className="text-sm text-slate-500 ml-1">/ booking</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">
                    {minimum > 0
                      ? <>Monthly minimum <strong>A${minimum.toFixed(0)}</strong>
                          <a
                            href="/zalma/terms#billing"
                            target="_blank"
                            rel="noreferrer"
                            title="Terms & Conditions apply"
                            className="text-primary hover:underline ml-0.5"
                          >*</a>
                        </>
                      : 'No monthly minimum'}
                  </p>

                  {isCurrent ? (
                    <Button disabled className="w-full mb-6 h-11 bg-slate-100 text-slate-400 border-0 cursor-default">Current Plan</Button>
                  ) : isUpgrade ? (
                    <Button className={`w-full mb-6 h-11 ${meta.btnColor}`} onClick={() => handleUpgrade(meta.key)}>
                      Upgrade to {meta.name}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full mb-6 h-11" onClick={() => handleUpgrade(meta.key)}>
                      Downgrade to {meta.name}
                    </Button>
                  )}

                  {(incl.sms > 0 || incl.email > 0 || incl.voice_minutes > 0) && (
                    <div className="mb-5 p-3 rounded-lg bg-emerald-50/80 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-800 mb-1.5">Included monthly</p>
                      <div className="space-y-1 text-xs text-emerald-700">
                        {incl.sms > 0 && <p>{incl.sms.toLocaleString()} SMS (then A${rates.sms?.toFixed(2) || '0.05'}/SMS)</p>}
                        {incl.email > 0 && <p>{incl.email.toLocaleString()} Emails</p>}
                        {incl.voice_minutes > 0 && <p>{incl.voice_minutes} AI receptionist mins</p>}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-5 flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {meta.key === 'growth' ? 'Features' : meta.key === 'premium' ? 'Everything in Growth, plus' : 'Everything in Premium, plus'}
                    </p>
                    <ul className="space-y-2.5">
                      {(p.features || []).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {phase2.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mt-5 mb-2">
                          Coming soon
                        </p>
                        <ul className="space-y-2 border-t border-amber-100 pt-3">
                          {phase2.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 mt-0.5 border-amber-200 text-amber-600">soon</Badge>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-400 mb-2">No lock-in. Cancel anytime. Prices are exclusive of GST.</p>
          <p className="text-center text-xs text-slate-400 mb-8">
            *{' '}
            <a
              href="/zalma/terms#billing"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Terms &amp; Conditions apply
            </a>
            . See how your monthly bill is calculated, including SMS, email and AI usage.
          </p>

          {/* Payment methods */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payment Methods</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setAddCardOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Card
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <div className="flex items-center gap-3 py-4">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-amber-700">No payment method on file</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map(card => (
                    <div key={card.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200">
                      <div className="w-10 h-7 rounded border border-slate-200 flex items-center justify-center bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                        {card.brand}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">**** **** **** {card.last4}</p>
                        <p className="text-xs text-slate-500">Expires {card.exp_month}/{card.exp_year}</p>
                      </div>
                      {card.is_default && (
                        <Badge className="bg-primary/10 text-primary rounded-full text-xs"><Star className="h-3 w-3 mr-1" /> Primary</Badge>
                      )}
                      {!card.is_default && (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleSetDefault(card.id)}>
                          Set as Primary
                        </Button>
                      )}
                      {!card.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => handleRemoveCard(card.id)}
                          title="Remove card"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddCardModal open={addCardOpen} onOpenChange={setAddCardOpen} onSuccess={fetchAll} />
    </div>
  );
}
