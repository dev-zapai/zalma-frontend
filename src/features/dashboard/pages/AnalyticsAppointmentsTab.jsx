import React, { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am-7pm

function heatCellClass(count) {
  if (count >= 8) return 'bg-blue-500 text-white';
  if (count >= 4) return 'bg-blue-300';
  if (count >= 1) return 'bg-blue-100';
  return 'bg-slate-50';
}

export default function AnalyticsAppointmentsTab({ currency, days, customRange }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const params = customRange
      ? { from_date: customRange.from, to_date: customRange.to }
      : { days };
    api.get('/g/analytics/appointments-ops', { params })
      .then(r => {
        const d = r.data;
        // Convert flat heatmap array [{day,hour,count}] to nested {dayIdx: {hour: count}}
        if (Array.isArray(d.heatmap)) {
          const map = {};
          d.heatmap.forEach(({ day, hour, count }) => {
            if (!map[day]) map[day] = {};
            map[day][hour] = count;
          });
          d.heatmap = map;
        }
        setData(d);
      })
      .catch(e => console.error(e));
  }, [days, customRange]);

  return (
    <div className="space-y-6">
      {/* Rate cards */}
      {data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4 text-green-500" /> Completion Rate
              </div>
              <p className="text-3xl font-bold text-green-600 mt-1">{data.completion_rate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <XCircle className="h-4 w-4 text-red-500" /> Cancellation Rate
              </div>
              <p className="text-3xl font-bold text-red-600 mt-1">{data.cancellation_rate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> No-Show Rate
              </div>
              <p className="text-3xl font-bold text-amber-600 mt-1">{data.no_show_rate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4 text-blue-500" /> Avg Duration
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-1">{data.avg_duration_minutes} min</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      )}

      {/* Busiest Times Heatmap */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Busiest Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data || !data.heatmap ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No heatmap data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Column headers: days */}
              <div className="grid gap-1" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
                <div />
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
                ))}

                {/* Rows: hours */}
                {HOURS.map(hour => (
                  <React.Fragment key={hour}>
                    <div className="text-xs text-slate-500 text-right pr-2 py-1.5">
                      {hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                    </div>
                    {DAYS.map((day, dayIdx) => {
                      const count = data.heatmap?.[dayIdx]?.[hour] ?? 0;
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`rounded text-center text-[10px] font-medium py-1.5 ${heatCellClass(count)}`}
                          title={`${day} ${hour}:00 - ${count} appointments`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-200" /> 0</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100" /> 1-3</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300" /> 4-7</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> 8+</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
