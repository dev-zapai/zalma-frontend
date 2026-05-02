import React, { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PawPrint, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AnalyticsPetsTab({ currency }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/g/analytics/pets-insights')
      .then(r => setData(r.data))
      .catch(e => console.error(e));
  }, []);

  if (!data) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading pet insights...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <PawPrint className="h-4 w-4 text-violet-500" /> Total Pets
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.total_pets}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BarChart3 className="h-4 w-4 text-teal-500" /> Avg Visits per Pet
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.avg_visits_per_pet}</p>
          </CardContent>
        </Card>
      </div>

      {/* Species pie chart */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" /> Species Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.species_breakdown || data.species_breakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No species data yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.species_breakdown}
                    dataKey="count"
                    nameKey="species"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ species }) => species}
                  >
                    {data.species_breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {data.species_breakdown.map((s, i) => (
                  <div key={s.species} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{s.species}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top breeds bar chart */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Top Breeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.top_breeds || data.top_breeds.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No breed data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.top_breeds}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="breed" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Pets">
                  {data.top_breeds.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
