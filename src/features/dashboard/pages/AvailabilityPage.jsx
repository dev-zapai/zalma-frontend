import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import {
  ChevronLeft, ChevronRight, Clock, Plus, Trash2, Coffee, AlertTriangle,
  Calendar as CalendarIcon, Check,
} from 'lucide-react';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';

// Salon operating envelope — staff never work outside these hours
const HOUR_START = 6;   // 6 AM
const HOUR_END = 23;    // 11 PM (exclusive)
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const ROW_HEIGHT = 48;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;

const DAYS_OF_WEEK = [
  { idx: 0, label: 'Mon' },
  { idx: 1, label: 'Tue' },
  { idx: 2, label: 'Wed' },
  { idx: 3, label: 'Thu' },
  { idx: 4, label: 'Fri' },
  { idx: 5, label: 'Sat' },
  { idx: 6, label: 'Sun' },
];

// Status colour system — 🟢🔵🟡🔴🟣
const STATUS_STYLES = {
  available:   { bg: 'bg-green-100/80',  border: 'border-green-300',  text: 'text-green-800',  dot: 'bg-green-500',  label: 'Available' },
  booked:      { bg: 'bg-blue-100/80',   border: 'border-blue-300',   text: 'text-blue-800',   dot: 'bg-blue-500',   label: 'Booked' },
  break:       { bg: 'bg-yellow-100/80', border: 'border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Break' },
  unavailable: { bg: 'bg-red-100/70',    border: 'border-red-300',    text: 'text-red-800',    dot: 'bg-red-500',    label: 'Unavailable' },
  override:    { bg: 'bg-violet-100/80', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-500', label: 'Override' },
};

// Convert "HH:MM" → minutes since HOUR_START
function hmToOffset(hm) {
  if (!hm) return 0;
  const [h, m] = hm.split(':').map(Number);
  return Math.max(0, (h - HOUR_START) * 60 + m);
}

function clampOffset(min) {
  return Math.max(0, Math.min(min, TOTAL_MINUTES));
}

export default function AvailabilityPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin || profile?.role === 'admin';

  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Data loading ───────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/staff', { params: { limit: 200 } })
      .then(res => setStaffList(listItems(res.data)))
      .catch(() => {});
  }, []);

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    try {
      const params = { start_date: format(weekStart, 'yyyy-MM-dd') };
      if (selectedStaff !== 'all') params.staff_id = selectedStaff;
      const res = await api.get('/availability/week', { params });
      setWeekData(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load availability');
      setWeekData(null);
    }
    setLoading(false);
  }, [selectedStaff, weekStart]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // ─── Render helpers ─────────────────────────────────────────────────────
  const renderColumn = (staff, day) => {
    const blocks = day.blocks || [];
    // Click → jump to the New Appointment flow with this date pre-selected.
    // Editing working hours / overrides happens on the staff member's
    // detail page (not on the calendar) so the calendar stays focused on
    // booking.
    const isOff = day.is_off;
    return (
      <div
        className={`relative ${isOff ? 'bg-slate-50/30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50/40'} transition-colors`}
        style={{
          height: `${(HOUR_END - HOUR_START) * ROW_HEIGHT}px`,
          borderLeft: '1px solid rgb(203 213 225)', // slate-300 — visible column separator
        }}
        onClick={() => {
          if (isOff) return;
          navigate(`/dashboard/appointments/new?date=${day.date}&staff_id=${staff.id}`);
        }}
        title={isOff ? 'Staff is unavailable' : 'Click to book on this day'}
      >
        {/* Grid lines — solid at every hour, dashed at every :30.
            Use inline styles (not Tailwind classes) so the borders render
            even if any utility class is purged or overridden. */}
        {HOURS.map((h, i) => (
          <React.Fragment key={h}>
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${i * ROW_HEIGHT}px`,
                borderTop: '1px solid rgb(203 213 225)', // slate-300
              }}
            />
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${i * ROW_HEIGHT + ROW_HEIGHT / 2}px`,
                borderTop: '1px dashed rgb(203 213 225 / 0.7)', // slate-300 70%
              }}
            />
          </React.Fragment>
        ))}

        {/* Blocks */}
        {blocks.map((b, i) => {
          const startMin = clampOffset(hmToOffset(b.start));
          const endMin = clampOffset(hmToOffset(b.end));
          const top = (startMin / 60) * ROW_HEIGHT;
          const height = Math.max(2, ((endMin - startMin) / 60) * ROW_HEIGHT);
          const style = STATUS_STYLES[b.status] || STATUS_STYLES.available;
          // Don't render full-day "off"/"unavailable" blocks as overlays — they
          // exceed the grid; instead show a centered label.
          if (b.status === 'unavailable' || b.status === 'override') {
            if (b.start === '00:00' && b.end === '23:59') {
              return (
                <div
                  key={i}
                  className={`absolute inset-1 rounded-md border ${style.bg} ${style.border} ${style.text} text-xs flex items-center justify-center font-medium`}
                >
                  {style.label}
                  {b.label && b.label !== style.label && (
                    <span className="ml-1 opacity-70">· {b.label}</span>
                  )}
                </div>
              );
            }
          }
          return (
            <div
              key={i}
              className={`absolute left-1 right-1 rounded-md border ${style.bg} ${style.border} ${style.text} text-[10px] px-1.5 py-0.5 overflow-hidden`}
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <p className="font-semibold leading-tight truncate">{style.label}</p>
              <p className="opacity-75 truncate">{b.start}–{b.end}</p>
            </div>
          );
        })}

        {/* Today line */}
        {isSameDay(parseISO(day.date), new Date()) && (() => {
          const now = new Date();
          const minSinceStart = (now.getHours() - HOUR_START) * 60 + now.getMinutes();
          if (minSinceStart < 0 || minSinceStart > TOTAL_MINUTES) return null;
          const top = (minSinceStart / 60) * ROW_HEIGHT;
          return (
            <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${top}px` }}>
              <div className="border-t-2 border-red-500 relative">
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div data-testid="availability-page" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Availability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Base schedules, overrides, breaks and live bookings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              {staffList.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            <span className="text-slate-600">{s.label}</span>
          </span>
        ))}
        <span className="ml-auto text-slate-400 italic">
          Click any day column to book an appointment · edit working hours from the staff member's profile
        </span>
      </div>

      {/* Week navigator - chevrons + "Jump to date" picker so the user
          can land on any week directly without clicking next-next-next. */}
      <Card className="rounded-xl border-slate-200/60 overflow-hidden">
        <CardHeader className="pb-3 flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/*
              Native date input - opens the OS calendar picker. Selecting any
              date snaps the view to that date's Monday so we always render a
              full week aligned to the schedule grid.
            */}
            <div className="relative">
              <Input
                type="date"
                value={format(weekStart, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const picked = new Date(e.target.value + 'T00:00:00');
                  if (isNaN(picked.getTime())) return;
                  setWeekStart(startOfWeek(picked, { weekStartsOn: 1 }));
                }}
                className="h-9 text-xs w-[160px]"
                title="Jump to a week"
              />
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekStart(addDays(weekStart, -7))} title="Previous week">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                This week
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekStart(addDays(weekStart, 7))} title="Next week">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !weekData || weekData.staff.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No staff to display</p>
            </div>
          ) : (
            <div className="space-y-6 p-4">
              {weekData.staff.map(staff => (
                <div key={staff.id}>
                  {/* Staff header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: staff.color }}
                    >
                      {staff.full_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{staff.full_name}</p>
                  </div>

                  {/* Day grid for this staff */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                      {/* Day header row */}
                      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200">
                        <div />
                        {weekDays.map((d, i) => (
                          <div
                            key={i}
                            className={`py-2 text-center border-l border-slate-100 ${isSameDay(d, new Date()) ? 'bg-primary/5' : ''}`}
                          >
                            <p className="text-[10px] uppercase text-slate-500 tracking-wide">
                              {format(d, 'EEE')}
                            </p>
                            <p className={`text-sm font-semibold ${isSameDay(d, new Date()) ? 'text-primary' : 'text-slate-900'}`}>
                              {format(d, 'd')}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Hours + columns */}
                      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                        {/* Hour labels */}
                        <div className="relative" style={{ height: `${(HOUR_END - HOUR_START) * ROW_HEIGHT}px` }}>
                          {HOURS.map((h, i) => {
                            const label = h === 12 ? '12pm'
                              : h < 12 ? `${h}am`
                              : `${h - 12}pm`;
                            return (
                              <React.Fragment key={h}>
                                <div
                                  className="absolute right-2 text-[10px] text-slate-400 -translate-y-1/2"
                                  style={{ top: `${i * ROW_HEIGHT}px` }}
                                >
                                  {label}
                                </div>
                                {/* :30 tick — only render if it fits inside the visible range */}
                                {i < HOURS.length - 1 && (
                                  <div
                                    className="absolute right-2 text-[9px] text-slate-300 -translate-y-1/2"
                                    style={{ top: `${i * ROW_HEIGHT + ROW_HEIGHT / 2}px` }}
                                  >
                                    :30
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Day columns */}
                        {staff.days.map((day, i) => (
                          <React.Fragment key={i}>
                            {renderColumn(staff, day)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
