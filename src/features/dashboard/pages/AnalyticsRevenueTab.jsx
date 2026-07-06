import React, { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { DollarSign, Scissors } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatPrice } from '@/shared/lib/currency';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AnalyticsRevenueTab({ currency, days, customRange }) {
  const [data, setData] = useState(null);
  const [popularServices, setPopularServices] = useState([]);

  useEffect(() => {
    api.get('/g/analytics/popular-services')
      .then(r => setPopularServices(r.data))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    const params = customRange
      ? { from_date: customRange.from, to_date: customRange.to }
      : { days };
    api.get('/g/analytics/revenue-breakdown', { params })
      .then(r => setData(r.data))
      .catch(e => console.error(e));
  }, [days, customRange]);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Avg Transaction Value</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {data ? formatPrice(data.avg_transaction_value, currency) : '--'}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Outstanding Balance</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {data ? formatPrice(data.outstanding_balance, currency) : '--'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by service bar chart */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Revenue by Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data || !data.revenue_by_service || data.revenue_by_service.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No revenue data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenue_by_service}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="service_name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatPrice(v, currency)} />
                <Tooltip formatter={(val) => formatPrice(val, currency)} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.revenue_by_service.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Popular Services (moved from Overview) */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" /> Popular Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {popularServices.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No service data yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={popularServices}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name }) => name}
                  >
                    {popularServices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {popularServices.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
