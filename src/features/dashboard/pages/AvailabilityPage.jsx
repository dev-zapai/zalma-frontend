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

// Salon calendar envelope - DEFAULTS only. Admins can override per-tenant in
// Settings → Calendar Hours (stored as settings.calendar_hour_start/_end).
const DEFAULT_HOUR_START = 6;   // 6 AM
const DEFAULT_HOUR_END = 23;    // 11 PM (exclusive)
const ROW_HEIGHT = 48;

const DAYS_OF_WEEK = [
  { idx: 0, label: 'Mon' },
  { idx: 1, label: 'Tue' },
  { idx: 2, label: 'Wed' },
  { idx: 3, label: 'Thu' },
  { idx: 4, label: 'Fri' },
  { idx: 5, label: 'Sat' },
  { idx: 6, label: 'Sun' },
];

// Status colour system. Design intent: open time reads as open space
// (soft emerald), bookings are the strongest ink on the page (blue),
// breaks are warm amber, and OFF time recedes into a quiet hatched slate
// texture instead of an alarming red wall - red is not a schedule state.
const STATUS_STYLES = {
  available:   { bg: 'bg-emerald-50/80', accent: '#10B981', text: 'text-emerald-900', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Available' },
  booked:      { bg: 'bg-blue-50',       accent: '#3B82F6', text: 'text-blue-900',    dot: 'bg-blue-500',    chip: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'Booked' },
  break:       { bg: 'bg-amber-50',      accent: '#F59E0B', text: 'text-amber-900',   dot: 'bg-amber-400',   chip: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Break' },
  unavailable: { bg: 'bg-slate-50',      accent: '#94A3B8', text: 'text-slate-500',   dot: 'bg-slate-400',   chip: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Off' },
  override:    { bg: 'bg-violet-50',     accent: '#8B5CF6', text: 'text-violet-900',  dot: 'bg-violet-500',  chip: 'bg-violet-50 text-violet-700 border-violet-200',    label: 'Override' },
};

// Diagonal hatch used for whole-day OFF columns - texture, not alarm.
const OFF_HATCH = 'repeating-linear-gradient(135deg, rgba(148,163,184,0.12) 0px, rgba(148,163,184,0.12) 5px, transparent 5px, transparent 13px)';

// Convert "HH:MM" → minutes since the calendar's start hour
function hmToOffset(hm, hourStart) {
  if (!hm) return 0;
  const [h, m] = hm.split(':').map(Number);
  return Math.max(0, (h - hourStart) * 60 + m);
}

function clampOffset(min, totalMinutes) {
  return Math.max(0, Math.min(min, totalMinutes));
}

// "14:30" → "2:30pm", "09:00" → "9am" - friendlier labels inside blocks
function fmtHM(hm) {
  if (!hm) return '';
  const [h, m] = hm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const hh = ((h + 11) % 12) + 1;
  return m ? `${hh}:${String(m).padStart(2, '0')}${ap}` : `${hh}${ap}`;
}

// Per-staff week summary - hours of free (bookable) vs booked time.
// `available` blocks from the API are the FREE remainder after breaks and
// appointments are carved out, so summing them is honest "free" time.
function weekSummary(staff, hourStart, totalMinutes) {
  let free = 0, booked = 0;
  (staff.days || []).forEach(d => {
    if (d.is_off) return;
    (d.blocks || []).forEach(b => {
      const mins = clampOffset(hmToOffset(b.end, hourStart), totalMinutes)
        - clampOffset(hmToOffset(b.start, hourStart), totalMinutes);
      if (mins <= 0) return;
      if (b.status === 'available' || b.status === 'override') free += mins;
      else if (b.status === 'booked') booked += mins;
    });
  });
  const fmt = (mins) => {
    const h = mins / 60;
    return h >= 10 ? `${Math.round(h)}h` : `${Math.round(h * 10) / 10}h`;
  };
  return { free: fmt(free), booked: fmt(booked), hasAny: free + booked > 0 };
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
  // Gates the first fetch until the profile-based default is resolved, so we
  // never fire an "all staff" request that can land after - and overwrite -
  // the correct single-staff one.
  const [defaultReady, setDefaultReady] = useState(false);

  // Default the staff filter to the logged-in user's OWN availability when
  // they work as staff (owner/admin who also has a staff record). Anyone
  // without a staff record falls back to "All staff". Runs once, so a manual
  // dropdown change afterwards is never overridden.
  const didSetDefaultStaff = useRef(false);
  const reqIdRef = useRef(0);
  useEffect(() => {
    if (didSetDefaultStaff.current || !profile) return;
    setSelectedStaff(profile.staff_id || 'all');
    didSetDefaultStaff.current = true;
    setDefaultReady(true);
  }, [profile]);

  // Tenant-configurable calendar envelope (Settings → Calendar Hours).
  // Falls back to 6am–11pm when unset or invalid.
  const [calHours, setCalHours] = useState({ start: DEFAULT_HOUR_START, end: DEFAULT_HOUR_END });
  const hourStart = calHours.start;
  const hourEnd = calHours.end;
  const totalMinutes = (hourEnd - hourStart) * 60;
  const hoursList = useMemo(
    () => Array.from({ length: hourEnd - hourStart }, (_, i) => hourStart + i),
    [hourStart, hourEnd]
  );

  // ─── Data loading ───────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/staff', { params: { limit: 200 } })
      .then(res => setStaffList(listItems(res.data)))
      .catch(() => {});
    api.get('/tenant/me')
      .then(res => {
        const s = res.data?.settings || {};
        const start = parseInt(s.calendar_hour_start, 10);
        const end = parseInt(s.calendar_hour_end, 10);
        if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 24 && start < end) {
          setCalHours({ start, end });
        }
      })
      .catch(() => {});
  }, []);

  const fetchWeek = useCallback(async () => {
    // Hold off until the profile-based default selection is resolved.
    if (!defaultReady) return;
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const params = { start_date: format(weekStart, 'yyyy-MM-dd') };
      if (selectedStaff !== 'all') params.staff_id = selectedStaff;
      const res = await api.get('/availability/week', { params });
      if (reqId !== reqIdRef.current) return;  // a newer request superseded this one
      setWeekData(res.data);
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      console.error(e);
      toast.error('Failed to load availability');
      setWeekData(null);
    }
    if (reqId === reqIdRef.current) setLoading(false);
  }, [selectedStaff, weekStart, defaultReady]);

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
    const isToday = isSameDay(parseISO(day.date), new Date());

    // Quiet hour grid painted as part of the column background:
    //   * hour mark  → 1px slate-200 line at each row top
    //   * :30 mark   → 1px slate-100 whisper at mid-row
    const gridBackground = {
      backgroundImage: [
        'linear-gradient(to bottom, rgb(226 232 240) 1px, transparent 1px)',
        'linear-gradient(to bottom, transparent calc(50% - 1px), rgb(241 245 249) calc(50% - 1px), rgb(241 245 249) 50%, transparent 50%)',
      ].join(', '),
      backgroundSize: `100% ${ROW_HEIGHT}px, 100% ${ROW_HEIGHT}px`,
      backgroundRepeat: 'repeat-y',
    };

    // Whole-day off → hatched texture + a small quiet pill; no red wall.
    const offBlock = isOff
      ? blocks.find(b => b.start === '00:00' && b.end === '23:59')
      : null;

    return (
      <div
        className={`relative group transition-colors ${isOff ? 'cursor-default' : 'cursor-pointer hover:bg-primary/[0.03]'} ${isToday && !isOff ? 'bg-primary/[0.02]' : ''}`}
        style={{
          height: `${(hourEnd - hourStart) * ROW_HEIGHT}px`,
          borderLeft: '1px solid rgb(226 232 240)', // slate-200 - quiet column separator
          ...(isOff
            ? { backgroundImage: OFF_HATCH, backgroundColor: 'rgba(248,250,252,0.7)' }
            : gridBackground),
        }}
        onClick={() => {
          if (isOff) return;
          navigate(`/dashboard/appointments/new?date=${day.date}&staff_id=${staff.id}`);
        }}
        title={isOff ? `${staff.full_name} is off this day` : 'Click to book on this day'}
      >
        {/* Whole-day off pill */}
        {isOff && (
          <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium max-w-full ${offBlock && offBlock.status === 'override' ? STATUS_STYLES.override.chip : STATUS_STYLES.unavailable.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${offBlock && offBlock.status === 'override' ? STATUS_STYLES.override.dot : STATUS_STYLES.unavailable.dot}`} />
              <span className="truncate">{(offBlock && offBlock.label) || 'Off'}</span>
            </span>
          </div>
        )}

        {/* Hover affordance: quiet "+ Book" chip at the top of bookable days */}
        {!isOff && (
          <div className="absolute top-1.5 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow-sm">
              <Plus className="h-2.5 w-2.5" /> Book
            </span>
          </div>
        )}

        {/* Timed blocks */}
        {!isOff && blocks.map((b, i) => {
          const startMin = clampOffset(hmToOffset(b.start, hourStart), totalMinutes);
          const endMin = clampOffset(hmToOffset(b.end, hourStart), totalMinutes);
          const top = (startMin / 60) * ROW_HEIGHT;
          const height = Math.max(3, ((endMin - startMin) / 60) * ROW_HEIGHT - 2);
          const style = STATUS_STYLES[b.status] || STATUS_STYLES.available;
          const showText = height >= 26;
          return (
            <div
              key={i}
              className={`absolute left-1 right-1.5 rounded-md ${style.bg} ${style.text} text-[10px] overflow-hidden ${b.status === 'booked' ? 'shadow-sm' : ''}`}
              style={{
                top: `${top + 1}px`,
                height: `${height}px`,
                borderLeft: `3px solid ${style.accent}`,
              }}
              title={`${style.label} · ${fmtHM(b.start)}–${fmtHM(b.end)}`}
            >
              {showText && (
                <div className="px-1.5 py-1 leading-tight">
                  <p className="font-semibold truncate">{style.label}</p>
                  <p className="opacity-70 truncate tabular-nums">{fmtHM(b.start)}–{fmtHM(b.end)}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Now indicator - brand-coloured line with a pulsing dot and time chip */}
        {isToday && (() => {
          const now = new Date();
          const minSinceStart = (now.getHours() - hourStart) * 60 + now.getMinutes();
          if (minSinceStart < 0 || minSinceStart > totalMinutes) return null;
          const top = (minSinceStart / 60) * ROW_HEIGHT;
          return (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
              <div className="border-t-2 border-primary relative">
                <span className="absolute -left-1 -top-[5px] w-2 h-2 rounded-full bg-primary motion-safe:animate-pulse" />
                <span className="absolute right-1 -top-2 px-1 py-px rounded bg-primary text-primary-foreground text-[8px] font-semibold tabular-nums leading-none pt-0.5">
                  {format(now, 'h:mm')}
                </span>
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

      {/* Legend - soft status pills matching the block styling */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${s.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-slate-400 hidden md:inline">
          Click a day to book · working hours are edited on the staff profile
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
            <div className="space-y-8 p-4">
              {weekData.staff.map(staff => {
                const summary = weekSummary(staff, hourStart, totalMinutes);
                return (
                <div key={staff.id}>
                  {/* Staff header - avatar, name, and an honest week summary */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: staff.color }}
                    >
                      {staff.full_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{staff.full_name}</p>
                    {summary.hasAny && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_STYLES.available.chip}`}>
                          {summary.free} free
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_STYLES.booked.chip}`}>
                          {summary.booked} booked
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Day grid for this staff */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px] rounded-lg border border-slate-200/80 overflow-hidden">
                      {/* Day header row */}
                      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/60">
                        <div />
                        {weekDays.map((d, i) => {
                          const today = isSameDay(d, new Date());
                          return (
                            <div key={i} className="py-2 text-center border-l border-slate-200/60">
                              <p className={`text-[10px] uppercase tracking-widest ${today ? 'text-primary font-semibold' : 'text-slate-400'}`}>
                                {format(d, 'EEE')}
                              </p>
                              <p className="mt-0.5">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${today ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-900'}`}>
                                  {format(d, 'd')}
                                </span>
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Hours + columns */}
                      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative bg-white">
                        {/* Hour labels */}
                        <div className="relative bg-slate-50/40" style={{ height: `${(hourEnd - hourStart) * ROW_HEIGHT}px` }}>
                          {hoursList.map((h, i) => {
                            const label = h === 12 ? '12pm'
                              : h < 12 ? `${h}am`
                              : `${h - 12}pm`;
                            return (
                              <div
                                key={h}
                                className="absolute right-2 text-[10px] text-slate-400 tabular-nums -translate-y-1/2 select-none"
                                style={{ top: `${i * ROW_HEIGHT}px` }}
                              >
                                {i > 0 && label}
                              </div>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
