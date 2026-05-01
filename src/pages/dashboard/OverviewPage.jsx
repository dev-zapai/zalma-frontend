import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Users, Clock, Check, XCircle, AlertTriangle, Scissors, PawPrint,
  DollarSign, TrendingUp, Bell, AlertCircle, FileText, UserPlus, Heart,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/auth';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  receipt_generated: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
};

const SEVERITY_STYLES = {
  danger: 'border-red-200 bg-red-50/60 text-red-800',
  warning: 'border-amber-200 bg-amber-50/60 text-amber-800',
  info: 'border-blue-200 bg-blue-50/60 text-blue-800',
};

const NOTIF_ICONS = {
  alert: AlertTriangle,
  allergy: Heart,
  flag: AlertCircle,
  invoice: FileText,
  no_show: XCircle,
  user: UserPlus,
};

const ACTION_ICONS = {
  pending_client: UserPlus,
  unconfirmed: Clock,
  late: AlertTriangle,
  special_flag: AlertCircle,
  awaiting_pickup: PawPrint,
};

const ACTION_COLORS = {
  pending_client: 'text-blue-600 bg-blue-50',
  unconfirmed: 'text-amber-600 bg-amber-50',
  late: 'text-red-600 bg-red-50',
  special_flag: 'text-violet-600 bg-violet-50',
  awaiting_pickup: 'text-teal-600 bg-teal-50',
};

export default function OverviewPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Staff utilisation strip — TODAY only on the dashboard. The full
  // period picker + KPI tiles + charts live on the Analytics page; the
  // dashboard intentionally keeps just the per-staff breakdown for the
  // current day so the page stays scannable.
  // The backend automatically scopes the result to the current user's
  // own staff record when the user isn't an admin, so a staff member
  // only sees their own row here.
  const [utilisation, setUtilisation] = useState(null);
  // Tenant currency comes from /api/tenant/me — `profile` is /auth/me and
  // doesn't carry the tenant's settings, so reading `profile?.tenant?...`
  // always fell back to USD. Default fallback is now AUD per user request.
  const [currency, setCurrency] = useState('AUD');

  useEffect(() => {
    api.get('/g/analytics/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error('dashboard fetch failed', err))
      .finally(() => setLoading(false));
    api.get('/tenant/me')
      .then(res => setCurrency(res.data?.settings?.currency || 'AUD'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Ask the backend for "just today" — but let it compute today using
    // the TENANT timezone, not the browser's UTC date. The previous version
    // sent `from_date=new Date().toISOString().slice(0,10)` which is the
    // browser's UTC date and could disagree with the tenant's local date by
    // a day, causing the staff utilisation table to show 0/0 even when the
    // dashboard's KPI tile (which uses tenant-local today server-side) was
    // counting today's appointments correctly. `days=1` collapses the
    // window to today_local(tenant_tz)..today_local(tenant_tz).
    api.get('/g/analytics/staff-utilisation', { params: { days: 1 } })
      .then(r => setUtilisation(r.data))
      .catch(e => { console.error(e); setUtilisation(null); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-slate-400">Failed to load dashboard.</div>;
  }

  // staff_utilization layer from this endpoint is unused now — the new
  // section below uses /g/analytics/staff-utilisation instead which has
  // richer per-staff metrics + period selection.
  const { layer1, layer2, notifications } = data;
  const sb = layer1?.status_breakdown || {};

  const layer1Cards = [
    {
      label: "Today's Appointments",
      value: layer1.todays_appointments,
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: '/dashboard/appointments?date=today',
    },
    {
      label: "Today's Clients",
      value: layer1.todays_clients,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/80',
      link: '/dashboard/clients',
    },
    {
      label: "Today's Pets",
      value: layer1.todays_pets,
      icon: PawPrint,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      link: '/dashboard/pets',
    },
    {
      label: 'Projected Revenue',
      // Use formatPrice so the tile honours the tenant's configured
      // currency (defaults to AUD) instead of the previous hard-coded `$`.
      value: formatPrice(layer1.projected_revenue || 0, currency),
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      link: '/dashboard/analytics',
      sub: layer1.completed_revenue > 0
        ? `${formatPrice(layer1.completed_revenue, currency)} earned`
        : null,
    },
  ];

  // Funnel tiles — every status the backend returns in `status_breakdown`
  // must have a tile here, otherwise appointments in that status appear as
  // "0" in every visible bucket and the funnel disagrees with the headline
  // KPI. Previously `receipt_generated` was missing — every paid appointment
  // looked like it had vanished from the funnel.
  const statusCards = [
    { key: 'scheduled', label: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'checked_in', label: 'Checked In', color: 'text-teal-600', bg: 'bg-teal-50' },
    { key: 'in_progress', label: 'In Progress', color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'completed', label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
    { key: 'receipt_generated', label: 'Receipt', color: 'text-violet-700', bg: 'bg-violet-50' },
    { key: 'no_show', label: 'No Show', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { key: 'cancelled', label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div data-testid="overview-page" className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mission Control</h1>
      </div>

      {/* Notifications - operational risks for the day */}
      {notifications && notifications.length > 0 && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Notifications
              <span className="text-xs text-slate-400 font-normal">({notifications.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.map((n, i) => {
              const Icon = NOTIF_ICONS[n.icon] || Bell;
              return (
                <button
                  key={i}
                  onClick={() => n.link && navigate(n.link)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium text-left hover:opacity-90 transition-opacity ${SEVERITY_STYLES[n.severity] || SEVERITY_STYLES.info}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{n.message}</span>
                  {n.link && <ArrowRight className="h-4 w-4 opacity-60" />}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ───────── Layer 1 - Live Operational KPIs ───────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Live Operational KPIs</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {layer1Cards.map((s, i) => (
            <Card
              key={i}
              data-testid={`stat-card-${i}`}
              className="rounded-xl border-slate-200/60 hover:shadow-md cursor-pointer transition-shadow"
              onClick={() => navigate(s.link)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
                    {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
                  </div>
                  <div className={`w-11 h-11 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status breakdown - booking funnel for today */}
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700">Today's Appointment Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {statusCards.map(s => (
                <button
                  key={s.key}
                  onClick={() => navigate(`/dashboard/appointments?status=${s.key}&date=today`)}
                  className={`p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left ${s.bg}`}
                >
                  <p className={`text-2xl font-bold ${s.color}`}>{sb[s.key] || 0}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ───────── Layer 2 - Attention Widgets ───────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-violet-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Attention Widgets</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Next Up */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Next Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {layer2?.next_up ? (
                <div
                  className="space-y-3 cursor-pointer hover:bg-slate-50 -m-2 p-3 rounded-lg transition-colors"
                  onClick={() => navigate(`/dashboard/appointments/${layer2.next_up.id}/detail`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {layer2.next_up.pet?.name || layer2.next_up.client?.full_name || 'Appointment'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Owner: {layer2.next_up.client?.full_name || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {layer2.next_up.start_time && format(parseISO(layer2.next_up.start_time), 'h:mm a')}
                      </p>
                      <Badge className={`mt-1 text-xs rounded-full ${STATUS_COLORS[layer2.next_up.status] || 'bg-slate-100 text-slate-700'}`}>
                        {layer2.next_up.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400">Service:</span>{' '}
                      <span className="text-slate-700 font-medium">{layer2.next_up.service?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Groomer:</span>{' '}
                      <span className="text-slate-700 font-medium">{layer2.next_up.staff?.full_name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {layer2.next_up.is_new_client && (
                      <Badge className="rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <TrendingUp className="h-3 w-3 mr-1" /> New Client
                      </Badge>
                    )}
                    {layer2.next_up.pet?.special_flag && (
                      <Badge className="rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-200">
                        {layer2.next_up.pet.special_flag}
                      </Badge>
                    )}
                    {layer2.next_up.pet?.allergy && (
                      <Badge className="rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                        Allergy: {layer2.next_up.pet.allergy}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No more appointments today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Needed */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Action Needed
                {layer2?.action_needed?.length > 0 && (
                  <span className="text-xs text-slate-400 font-normal">({layer2.action_needed.length})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!layer2?.action_needed || layer2.action_needed.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All clear, nothing needs attention</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {layer2.action_needed.map((item, i) => {
                    const Icon = ACTION_ICONS[item.type] || AlertCircle;
                    const colorClass = ACTION_COLORS[item.type] || 'text-slate-600 bg-slate-50';
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 cursor-pointer transition-colors"
                        onClick={() => navigate(`/dashboard/appointments/${item.appointment.id}/detail`)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {item.appointment.pet?.name || item.appointment.client?.full_name || '-'}
                            {item.appointment.start_time && ` · ${format(parseISO(item.appointment.start_time), 'h:mm a')}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ───────── Layer 3 - Today's Staff Utilisation ─────────
          Just the per-staff breakdown for today. No KPI tiles, no period
          selector - those live on the Analytics page so the dashboard
          stays scannable. The backend auto-scopes the response to the
          current user's own staff record when the user isn't an admin,
          so a staff member only sees their own row here. */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Today's Staff Utilisation</h2>
        </div>

        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-0">
            {!utilisation ? (
              <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                Loading utilisation...
              </div>
            ) : utilisation.staff.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                <Scissors className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No staff to report on</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50/60">
                      <th className="text-left py-2.5 px-5 font-medium">Staff</th>
                      <th className="text-right py-2.5 px-3 font-medium">Utilisation</th>
                      <th className="text-right py-2.5 px-3 font-medium">Booked</th>
                      <th className="text-right py-2.5 px-3 font-medium">Available</th>
                      <th className="text-right py-2.5 px-3 font-medium">Idle</th>
                      <th className="text-right py-2.5 px-3 font-medium">Appts</th>
                      <th className="text-right py-2.5 px-3 font-medium">Done</th>
                      <th className="text-right py-2.5 px-5 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilisation.staff.map(s => (
                      <tr
                        key={s.staff_id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => navigate(`/dashboard/staff/member/${s.staff_id}`)}
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                              style={{ backgroundColor: s.color }}
                            >
                              {s.staff_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-900">{s.staff_name}</span>
                            {/* Over-booked warning dot - surfaced from the
                                backend's `over_booked_minutes` field. The
                                slot finder used to silently cap at 100% so
                                double-bookings looked healthy. */}
                            {s.over_booked_minutes > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 text-red-700 border border-red-200"
                                title={`Over-booked by ${(s.over_booked_minutes / 60).toFixed(1)}h, schedule conflict`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Over-booked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-3">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${Math.min(100, s.utilisation_percent)}%`,
                                  backgroundColor: utilBarColor(s.utilisation_percent),
                                }}
                              />
                            </div>
                            <span
                              className="font-semibold tabular-nums w-12 text-right"
                              style={{ color: utilBarColor(s.utilisation_percent) }}
                            >
                              {s.utilisation_percent}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-3 text-slate-700 tabular-nums">
                          {(s.booked_minutes / 60).toFixed(1)}h
                        </td>
                        <td className="text-right py-3 px-3 text-slate-500 tabular-nums">
                          {(s.available_minutes / 60).toFixed(1)}h
                        </td>
                        <td className="text-right py-3 px-3 text-slate-400 tabular-nums">
                          {(s.idle_minutes / 60).toFixed(1)}h
                        </td>
                        <td className="text-right py-3 px-3 text-slate-700 tabular-nums">{s.appointments}</td>
                        <td className="text-right py-3 px-3 text-green-600 tabular-nums">{s.completed}</td>
                        <td className="text-right py-3 px-5 font-semibold text-slate-900 tabular-nums">
                          {formatPrice(s.revenue, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Utilisation helper (mirrors AnalyticsPage thresholds) ────────────
function utilBarColor(pct) {
  if (pct >= 85) return '#2563EB';      // near capacity - blue
  if (pct >= 60) return '#10B981';      // healthy - green
  if (pct >= 40) return '#F59E0B';      // low - amber
  return '#EF4444';                     // under-utilised - red
}
