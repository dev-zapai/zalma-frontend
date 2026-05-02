import React, { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, Heart, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/shared/lib/currency';

export default function AnalyticsClientsTab({ currency }) {
  const [period, setPeriod] = useState('year');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/g/analytics/clients-insights?period=${period}`)
      .then(r => setData(r.data))
      .catch(e => console.error(e));
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex justify-end">
        <div className="flex gap-1">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md ${period === p ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      {data ? (
        <div className="grid grid-cols-2 gap-5">
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Heart className="h-4 w-4 text-pink-500" /> Retention Rate
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-1">{data.retention_rate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4 text-blue-500" /> Avg Lifetime Value
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {formatPrice(data.avg_lifetime_value, currency)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      )}

      {/* Acquisition trend line chart */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Client Acquisition Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data || !data.acquisition_trend || data.acquisition_trend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No acquisition data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.acquisition_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="new_clients"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="New Clients"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top 10 Clients table */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Top 10 Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data || !data.top_clients || data.top_clients.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No client data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium">#</th>
                    <th className="text-left py-2 px-3 font-medium">Client</th>
                    <th className="text-right py-2 px-3 font-medium">Visits</th>
                    <th className="text-right py-2 px-3 font-medium">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_clients.map((c, i) => (
                    <tr key={c.client_id || i} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{c.name}</td>
                      <td className="text-right py-2.5 px-3 text-slate-700 tabular-nums">{c.appointment_count}</td>
                      <td className="text-right py-2.5 px-3 font-semibold text-slate-900 tabular-nums">
                        {formatPrice(c.total_spent, currency)}
                      </td>
                      <td className="text-right py-2.5 px-3 text-slate-500">{c.last_visit || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
