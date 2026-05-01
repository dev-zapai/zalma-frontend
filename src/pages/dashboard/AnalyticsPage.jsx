import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, Users, Scissors, Clock, Activity, PawPrint, CalendarCheck, XCircle, UserX } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, ComposedChart, Cell, Area,
} from 'recharts';
import { formatPrice } from '@/lib/currency';

import AnalyticsRevenueTab from './AnalyticsRevenueTab';
import AnalyticsAppointmentsTab from './AnalyticsAppointmentsTab';
import AnalyticsClientsTab from './AnalyticsClientsTab';
import AnalyticsPetsTab from './AnalyticsPetsTab';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AnalyticsPage() {
  const { tenantPlan } = useOutletContext() || {};
  const hasFullAnalytics = tenantPlan === 'growth' || tenantPlan === 'advanced';
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Staff utilisation — preset window in days OR explicit custom range.
  const [utilDays, setUtilDays] = useState(30);
  const [customRange, setCustomRange] = useState(null);
  const [utilisation, setUtilisation] = useState(null);
  const [currency, setCurrency] = useState('AUD');

  // Fetch currency once
  useEffect(() => {
    api.get('/tenant/me')
      .then(r => setCurrency(r.data?.settings?.currency || 'AUD'))
      .catch(() => {});
  }, []);

  const selectPreset = (p) => {
    setPeriod(p);
    setDateFrom('');
    setDateTo('');
  };

  const applyCustomRange = (from, to) => {
    if (from && to) {
      setDateFrom(from);
      setDateTo(to);
      setPeriod('custom');
    }
  };

  // Overview + trends both respect the period / custom range
  useEffect(() => {
    let overviewParams, trendsParams;
    if (period === 'custom' && dateFrom && dateTo) {
      overviewParams = { period: 'custom', from_date: dateFrom, to_date: dateTo };
      trendsParams = { from_date: dateFrom, to_date: dateTo };
    } else {
      const days = period === 'week' ? 7 : period === 'year' ? 90 : 30;
      overviewParams = { period };
      trendsParams = { days };
    }
    Promise.all([
      api.get('/g/analytics/overview', { params: overviewParams }),
      api.get('/g/analytics/trends', { params: trendsParams }),
    ])
      .then(([o, t]) => { setOverview(o.data); setTrends(t.data); })
      .catch(e => console.error(e));
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    const params = customRange
      ? { from_date: customRange.from, to_date: customRange.to }
      : { days: utilDays };
    api.get('/g/analytics/staff-utilisation', { params })
      .then(r => setUtilisation(r.data))
      .catch(e => { console.error(e); setUtilisation(null); });
  }, [utilDays, customRange]);

  return (
    <div data-testid="analytics-page" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Performance, trends, and revenue insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => selectPreset(p)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => applyCustomRange(e.target.value, dateTo || e.target.value)}
            className={`h-8 px-2 text-xs rounded-lg border transition-colors ${period === 'custom' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'} text-slate-700 focus:outline-none focus:border-primary`}
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => applyCustomRange(dateFrom || e.target.value, e.target.value)}
            className={`h-8 px-2 text-xs rounded-lg border transition-colors ${period === 'custom' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'} text-slate-700 focus:outline-none focus:border-primary`}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
          {hasFullAnalytics && <TabsTrigger value="revenue" className="text-sm">Revenue</TabsTrigger>}
          {hasFullAnalytics && <TabsTrigger value="appointments" className="text-sm">Appointments</TabsTrigger>}
          {hasFullAnalytics && <TabsTrigger value="clients" className="text-sm">Clients</TabsTrigger>}
          {hasFullAnalytics && <TabsTrigger value="pets" className="text-sm">Pets</TabsTrigger>}
          {hasFullAnalytics && <TabsTrigger value="staff" className="text-sm">Staff</TabsTrigger>}
        </TabsList>

        {/* ═══════ Tab 1: Overview ═══════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue - top */}
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <DollarSign className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-slate-500">Revenue</p>
              </div>
              <p className="text-4xl font-bold text-slate-900">
                {overview ? formatPrice(overview.revenue, currency) : '...'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Earned revenue (paid receipts){overview?.start_date && overview?.end_date
                  ? ` - ${overview.start_date} to ${overview.end_date}`
                  : ` - last ${period}`}
              </p>
            </CardContent>
          </Card>

          {/* KPI Cards - all period-filtered */}
          {overview && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="rounded-xl border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarCheck className="h-4 w-4 text-blue-500" />
                    <p className="text-xs text-slate-500">Appointments</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{overview.total_appointments}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-slate-500">Completed</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{overview.completed}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <p className="text-xs text-slate-500">Clients Served</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{overview.clients_served}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <PawPrint className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-slate-500">Pets Groomed</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{overview.pets_groomed}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-slate-200/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-slate-500">Cancelled / No-show</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{overview.cancelled + overview.no_shows}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appointment Trends */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Appointment Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                  No data yet. Appointments will appear here once booked.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                    <Bar dataKey="cancelled" stackId="a" fill="#EF4444" name="Cancelled" />
                    <Bar dataKey="no_show" stackId="a" fill="#F59E0B" name="No Show" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ Tab 2: Revenue (Growth+) ═══════ */}
        {hasFullAnalytics && <TabsContent value="revenue">
          <AnalyticsRevenueTab currency={currency} />
        </TabsContent>}

        {/* ═══════ Tab 3: Appointments (Growth+) ═══════ */}
        {hasFullAnalytics && <TabsContent value="appointments">
          <AnalyticsAppointmentsTab currency={currency} />
        </TabsContent>}

        {/* ═══════ Tab 4: Clients (Growth+) ═══════ */}
        {hasFullAnalytics && <TabsContent value="clients">
          <AnalyticsClientsTab currency={currency} />
        </TabsContent>}

        {/* ═══════ Tab 5: Pets (Growth+) ═══════ */}
        {hasFullAnalytics && <TabsContent value="pets">
          <AnalyticsPetsTab currency={currency} />
        </TabsContent>}

        {/* ═══════ Tab 6: Staff (Growth+) ═══════ */}
        {hasFullAnalytics && <TabsContent value="staff" className="space-y-6">
          {/* ════════ Staff Utilisation ════════
              Booked hours / Available hours per staff member, computed from
              their schedule (minus breaks + leaves) vs actual appointments.
              Standard salon-industry KPI: utilisation % = booked / available x 100
          */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Staff Utilisation
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Booked time as a % of working hours (after breaks &amp; leaves). The standard salon KPI for capacity planning.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1">
                  {[7, 30, 60, 90, 365].map(d => (
                    <button
                      key={d}
                      onClick={() => { setUtilDays(d); setCustomRange(null); }}
                      className={`px-3 py-1 text-xs rounded-md ${
                        !customRange && utilDays === d
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d === 365 ? '1y' : `${d}d`}
                    </button>
                  ))}
                </div>
                {/* Custom date range - overrides the chips when both inputs
                    are filled. Either input alone is treated as a single-day
                    window (server fills in the missing side). */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Custom</span>
                  <input
                    type="date"
                    value={customRange?.from || ''}
                    onChange={(e) => {
                      const from = e.target.value;
                      if (!from) { setCustomRange(null); return; }
                      setCustomRange(prev => ({ from, to: prev?.to || from }));
                    }}
                    className="h-7 text-xs px-2 border border-slate-200 rounded-md"
                  />
                  <span className="text-xs text-slate-400">{'\u2192'}</span>
                  <input
                    type="date"
                    value={customRange?.to || ''}
                    onChange={(e) => {
                      const to = e.target.value;
                      if (!to) { setCustomRange(null); return; }
                      setCustomRange(prev => ({ from: prev?.from || to, to }));
                    }}
                    className="h-7 text-xs px-2 border border-slate-200 rounded-md"
                  />
                  {customRange && (
                    <button
                      onClick={() => setCustomRange(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
                    >
                      clear
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!utilisation ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  Loading utilisation data...
                </div>
              ) : utilisation.staff.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  No active staff to report on.
                </div>
              ) : (
                <>
                  {/* Over-booking warning banner - surfaced from the backend's
                      per-staff `over_booked_minutes` field. The cap-at-100% in
                      the math used to silently hide schedule conflicts. */}
                  {utilisation.summary.over_booked_staff > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium">
                          {utilisation.summary.over_booked_staff} staff
                          {utilisation.summary.over_booked_staff === 1 ? '' : 's'} over-booked in this period
                        </p>
                        <p className="text-[11px] mt-0.5 opacity-80">
                          Their booked hours exceed their working hours, likely a schedule conflict.
                          See the per-staff table below for the breakdown.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── KPI strip ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiTile
                      icon={<Activity className="h-4 w-4" />}
                      label="Overall Utilisation"
                      value={`${utilisation.summary.utilisation_percent}%`}
                      hint={`${(utilisation.summary.booked_minutes / 60).toFixed(0)}h booked / ${(utilisation.summary.available_minutes / 60).toFixed(0)}h available (aggregate)`}
                      color={utilTileColor(utilisation.summary.utilisation_percent)}
                    />
                    <KpiTile
                      icon={<Users className="h-4 w-4" />}
                      label="Active Staff"
                      value={utilisation.summary.active_staff}
                      hint="With a working schedule"
                      color="bg-blue-50 text-blue-700"
                    />
                    <KpiTile
                      icon={<Scissors className="h-4 w-4" />}
                      label="Appointments"
                      value={utilisation.summary.total_appointments}
                      hint="Booked in the period"
                      color="bg-violet-50 text-violet-700"
                    />
                    <KpiTile
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Revenue"
                      value={formatPrice(utilisation.summary.total_revenue, currency)}
                      hint="From completed receipts"
                      color="bg-emerald-50 text-emerald-700"
                    />
                  </div>

                  {/* ── Per-staff utilisation horizontal bars ── */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Utilisation by Staff Member</h3>
                    <ResponsiveContainer width="100%" height={Math.max(180, utilisation.staff.length * 48)}>
                      <BarChart
                        data={utilisation.staff.map(s => ({
                          name: s.staff_name,
                          utilisation: s.utilisation_percent,
                          booked: Math.round(s.booked_minutes / 60),
                          idle: Math.round(s.idle_minutes / 60),
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 40, left: 70, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                        <Tooltip
                          formatter={(val, name) => {
                            if (name === 'utilisation') return [`${val}%`, 'Utilisation'];
                            return [`${val}h`, name === 'booked' ? 'Booked' : 'Idle'];
                          }}
                        />
                        <Bar dataKey="utilisation" radius={[0, 4, 4, 0]}>
                          {utilisation.staff.map((s, i) => (
                            <Cell key={i} fill={utilBarColor(s.utilisation_percent)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500" /> &lt;40% under-utilised</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500" /> 40-60% low</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> 60-85% healthy</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-600" /> &gt;85% near capacity</span>
                    </div>
                  </div>

                  {/* ── Daily trend: stacked hours + overlay utilisation line ── */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Daily Trend</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <ComposedChart data={utilisation.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis yAxisId="hours" tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                        <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val, name) => {
                            if (name === 'Utilisation') return [`${val}%`, name];
                            return [`${val}h`, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar yAxisId="hours" dataKey="available_hours" fill="#E2E8F0" name="Available" />
                        <Bar yAxisId="hours" dataKey="booked_hours" fill="#2563EB" name="Booked" />
                        <Line
                          yAxisId="pct"
                          type="monotone"
                          dataKey="utilisation"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Utilisation"
                          dot={{ r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ── Per-staff breakdown table ── */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Per-Staff Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 border-b border-slate-200">
                            <th className="text-left py-2 px-3 font-medium">Staff</th>
                            <th className="text-right py-2 px-3 font-medium">Utilisation</th>
                            <th className="text-right py-2 px-3 font-medium">Booked</th>
                            <th className="text-right py-2 px-3 font-medium">Available</th>
                            <th className="text-right py-2 px-3 font-medium">Idle</th>
                            <th className="text-right py-2 px-3 font-medium">Appts</th>
                            <th className="text-right py-2 px-3 font-medium">Done</th>
                            <th className="text-right py-2 px-3 font-medium">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {utilisation.staff.map(s => (
                            <tr key={s.staff_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                    style={{ backgroundColor: s.color }}
                                  >
                                    {s.staff_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-900">{s.staff_name}</span>
                                  {s.over_booked_minutes > 0 && (
                                    <span
                                      className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 text-red-700 border border-red-200"
                                      title={`Over-booked by ${(s.over_booked_minutes / 60).toFixed(1)}h`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                      Over-booked
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="text-right py-2.5 px-3">
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
                                  <span className="font-semibold tabular-nums w-12 text-right" style={{ color: utilBarColor(s.utilisation_percent) }}>
                                    {s.utilisation_percent}%
                                  </span>
                                </div>
                              </td>
                              <td className="text-right py-2.5 px-3 text-slate-700 tabular-nums">
                                {(s.booked_minutes / 60).toFixed(1)}h
                              </td>
                              <td className="text-right py-2.5 px-3 text-slate-500 tabular-nums">
                                {(s.available_minutes / 60).toFixed(1)}h
                              </td>
                              <td className="text-right py-2.5 px-3 text-slate-400 tabular-nums">
                                {(s.idle_minutes / 60).toFixed(1)}h
                              </td>
                              <td className="text-right py-2.5 px-3 text-slate-700 tabular-nums">{s.appointments}</td>
                              <td className="text-right py-2.5 px-3 text-green-600 tabular-nums">{s.completed}</td>
                              <td className="text-right py-2.5 px-3 font-semibold text-slate-900 tabular-nums">
                                {formatPrice(s.revenue, currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>}
      </Tabs>
    </div>
  );
}

// ─── Helpers for the Staff Utilisation section ────────────────────────────

function utilBarColor(pct) {
  if (pct >= 85) return '#2563EB';      // near capacity - blue
  if (pct >= 60) return '#10B981';      // healthy - green
  if (pct >= 40) return '#F59E0B';      // low - amber
  return '#EF4444';                     // under-utilised - red
}

function utilTileColor(pct) {
  if (pct >= 85) return 'bg-blue-50 text-blue-700';
  if (pct >= 60) return 'bg-emerald-50 text-emerald-700';
  if (pct >= 40) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

function KpiTile({ icon, label, value, hint, color }) {
  return (
    <div className={`rounded-xl border border-slate-200/60 p-4 ${color}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-medium opacity-70">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-[10px] mt-0.5 opacity-60">{hint}</p>}
    </div>
  );
}
