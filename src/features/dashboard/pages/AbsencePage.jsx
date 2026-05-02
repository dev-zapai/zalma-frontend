import React, { useState, useEffect, useCallback } from 'react';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import {
  Plane, Plus, Check as CheckIcon, X, Trash2,
  AlertCircle, ChevronLeft, ChevronRight, Upload, FileText, ExternalLink,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { toast } from 'sonner';

const LEAVE_TYPES = [
  { value: 'sick',           label: 'Sick Leave' },
  { value: 'casual',         label: 'Casual Leave' },
  { value: 'paid',           label: 'Paid Leave' },
  { value: 'unpaid',         label: 'Unpaid Leave' },
  { value: 'public_holiday', label: 'Public Holiday' },
  { value: 'other',          label: 'Other' },
];

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-800 border border-amber-200',
  approved:  'bg-green-100 text-green-800 border border-green-200',
  rejected:  'bg-red-100 text-red-800 border border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const LEAVE_COLORS = {
  sick: 'bg-red-400', casual: 'bg-orange-400', paid: 'bg-blue-400',
  unpaid: 'bg-slate-400', public_holiday: 'bg-purple-400', other: 'bg-pink-400',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AbsencePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin || profile?.role === 'admin';
  const myStaffId = profile?.staff_id || null;

  const [allLeaves, setAllLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date());
  const [schedule, setSchedule] = useState([]);

  // Apply dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'sick', start_date: '', end_date: '', half_day: false, reason: '',
  });
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const myRes = await api.get('/leaves');
      if (isAdmin) {
        setAllLeaves(myRes.data || []);
        setMyLeaves((myRes.data || []).filter(l => l.staff_id === myStaffId));
      } else {
        setMyLeaves(myRes.data || []);
        setAllLeaves([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [isAdmin, myStaffId]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  useEffect(() => {
    if (!myStaffId) return;
    api.get(`/availability/staff/${myStaffId}/schedule`)
      .then(r => setSchedule(r.data || []))
      .catch(() => {});
  }, [myStaffId]);

  // ── Apply ──────────────────────────────────────────────────────────
  const openDialog = () => {
    setForm({ leave_type: 'sick', start_date: '', end_date: '', half_day: false, reason: '' });
    setDocFile(null);
    setDialogOpen(true);
  };

  const handleApply = async () => {
    if (!myStaffId) {
      toast.error('Your user account is not linked to a staff record.');
      return;
    }
    if (!form.start_date || !form.end_date) {
      toast.error('Pick a date range');
      return;
    }
    setSubmitting(true);
    try {
      let document_url = null;
      // Upload document first if attached
      if (docFile) {
        const fd = new FormData();
        fd.append('file', docFile);
        const uploadRes = await api.post('/leaves/upload-document', fd);
        document_url = uploadRes.data.document_url;
      }
      await api.post('/leaves', {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        half_day: form.half_day,
        reason: form.reason || null,
        document_url,
      });
      toast.success('Leave request submitted');
      setDialogOpen(false);
      fetchLeaves();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to submit leave');
    }
    setSubmitting(false);
  };

  // ── Admin actions ─────────────────────────────────────────────────
  const handleDecide = async (leaveId, decision) => {
    try {
      await api.post(`/leaves/${leaveId}/decision`, { decision });
      toast.success(`Leave ${decision}`);
      fetchLeaves();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update leave');
    }
  };

  const handleCancel = async (leaveId) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await api.delete(`/leaves/${leaveId}`);
      toast.success('Leave cancelled');
      fetchLeaves();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to cancel');
    }
  };

  const pendingRequests = (allLeaves || [])
    .filter(l => l.status === 'pending')
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  const teamHistory = (allLeaves || [])
    .filter(l => l.status !== 'pending')
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  // ── Calendar data ─────────────────────────────────────────────────
  const workingDays = new Set(schedule.map(s => s.day_of_week));
  const leavesForCal = myLeaves.filter(l => l.status === 'approved' || l.status === 'pending');

  const getLeaveForDate = (date) => {
    const ds = format(date, 'yyyy-MM-dd');
    return leavesForCal.find(l => l.start_date <= ds && l.end_date >= ds);
  };

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = (getDay(monthStart) + 6) % 7; // 0=Mon

  // ── Calendar drag-to-select ─────────────────────────────────────
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const isDragging = dragStart !== null;

  const isInDragRange = (day) => {
    if (!dragStart) return false;
    const end = dragEnd || dragStart;
    const from = dragStart <= end ? dragStart : end;
    const to = dragStart <= end ? end : dragStart;
    const ds = format(day, 'yyyy-MM-dd');
    return ds >= from && ds <= to;
  };

  const handleDayMouseDown = (day) => {
    const leave = getLeaveForDate(day);
    if (leave) {
      setSelectedLeave(leave);
      return;
    }
    const ds = format(day, 'yyyy-MM-dd');
    setDragStart(ds);
    setDragEnd(ds);
  };

  const handleDayMouseEnter = (day) => {
    if (!isDragging) return;
    setDragEnd(format(day, 'yyyy-MM-dd'));
  };

  const handleDayMouseUp = () => {
    if (!dragStart) return;
    const end = dragEnd || dragStart;
    const from = dragStart <= end ? dragStart : end;
    const to = dragStart <= end ? end : dragStart;
    setDragStart(null);
    setDragEnd(null);
    // Open apply dialog pre-filled with the selected range
    setForm(f => ({ ...f, start_date: from, end_date: to, leave_type: 'sick', half_day: false, reason: '' }));
    setDocFile(null);
    setDialogOpen(true);
  };

  // Which leaves to show in the left list
  const [listFilter, setListFilter] = useState('mine');
  const displayLeaves = listFilter === 'pending' ? pendingRequests
    : listFilter === 'team' ? teamHistory
    : myLeaves;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" /> Absence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin ? 'Manage leave requests for your team.' : 'Apply for leave and track your requests.'}
          </p>
        </div>
        <Button onClick={openDialog} disabled={!myStaffId} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
          <Plus className="h-4 w-4 mr-1.5" /> Apply for Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* ═══ LEFT: Leave List ═══ */}
        <div className="space-y-3">
          {/* Admin filter chips - staff sees no chips, just their list */}
          {isAdmin && (
            <div className="flex gap-1.5">
              {[
                { key: 'mine', label: 'My Leaves', count: myLeaves.length },
                { key: 'pending', label: 'Pending', count: pendingRequests.length },
                { key: 'team', label: 'Team', count: 0 },
              ].map(f => (
                <button key={f.key} onClick={() => setListFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${listFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {f.label} {f.count > 0 && `(${f.count})`}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : displayLeaves.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <Plane className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No leaves to show
              </div>
            ) : displayLeaves.map(l => (
              <div
                key={l.id}
                onClick={() => setSelectedLeave(selectedLeave?.id === l.id ? null : l)}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${
                  selectedLeave?.id === l.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`rounded-full text-[10px] capitalize ${STATUS_STYLES[l.status] || ''}`}>{l.status}</Badge>
                  <span className="text-sm font-semibold text-slate-800 capitalize">{(l.leave_type || '').replace('_', ' ')}</span>
                  {(listFilter !== 'mine' && l.staff_name) && (
                    <Badge variant="outline" className="rounded-full text-[10px] ml-auto">{l.staff_name}</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {l.start_date && format(parseISO(l.start_date), 'MMM d')}
                  {l.start_date !== l.end_date && <> - {l.end_date && format(parseISO(l.end_date), 'MMM d')}</>}
                  <span className="text-slate-400 ml-1">· {l.days}d{l.half_day ? ' (half)' : ''}</span>
                </p>

                {selectedLeave?.id === l.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {l.reason && <p className="text-xs text-slate-600 italic">"{l.reason}"</p>}
                    {l.document_url && (
                      <a href={l.document_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <FileText className="h-3 w-3" /> View document <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {l.decision_note && <p className="text-[11px] text-slate-500">Note: {l.decision_note}</p>}
                    <div className="flex gap-1.5 pt-1">
                      {l.status === 'pending' && (listFilter === 'mine' || !isAdmin) && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-red-600" onClick={(e) => { e.stopPropagation(); handleCancel(l.id); }}>
                          <Trash2 className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      )}
                      {l.status === 'pending' && isAdmin && listFilter === 'pending' && (
                        <>
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={(e) => { e.stopPropagation(); handleDecide(l.id, 'approved'); }}>
                            <CheckIcon className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs text-red-600" onClick={(e) => { e.stopPropagation(); handleDecide(l.id, 'rejected'); }}>
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {isAdmin && l.status !== 'cancelled' && listFilter === 'team' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-red-600" onClick={(e) => { e.stopPropagation(); handleCancel(l.id); }}>
                          <Trash2 className="h-3 w-3 mr-1" /> Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT: Calendar ═══ */}
        <Card className="rounded-xl border-slate-200/60" onMouseLeave={() => { if (isDragging) handleDayMouseUp(); }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalMonth(m => subMonths(m, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold text-slate-900 min-w-[160px] text-center">
                  {format(calMonth, 'MMMM yyyy')}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalMonth(m => addMonths(m, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" /> Working</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pending</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="select-none">
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
              {DAY_NAMES.map(d => (
                <div key={d} className="bg-slate-50 text-center py-2 text-xs font-semibold text-slate-500">{d}</div>
              ))}
              {Array.from({ length: startDow }).map((_, i) => (
                <div key={`e-${i}`} className="bg-white min-h-[76px]" />
              ))}
              {daysInMonth.map(day => {
                const dow = (getDay(day) + 6) % 7;
                const isWorking = workingDays.has(dow);
                const leave = getLeaveForDate(day);
                const isToday = isSameDay(day, new Date());
                const inRange = isInDragRange(day);

                return (
                  <div
                    key={day.toISOString()}
                    onMouseDown={() => handleDayMouseDown(day)}
                    onMouseEnter={() => handleDayMouseEnter(day)}
                    onMouseUp={handleDayMouseUp}
                    className={`min-h-[76px] p-1.5 relative cursor-pointer transition-colors ${
                      inRange ? 'bg-primary/10'
                      : isWorking ? 'bg-emerald-50/60 hover:bg-emerald-50'
                      : 'bg-white hover:bg-slate-50'
                    } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'bg-primary text-white rounded-full w-5 h-5 inline-flex items-center justify-center' : 'text-slate-600'}`}>
                      {format(day, 'd')}
                    </span>
                    {leave && (
                      <div className={`mt-1 rounded px-1 py-0.5 text-[10px] text-white font-medium truncate ${
                        leave.status === 'pending' ? 'bg-amber-400' : LEAVE_COLORS[leave.leave_type] || 'bg-red-400'
                      }`}>
                        {leave.leave_type.replace('_', ' ')}
                        {leave.half_day ? ' (½)' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-3 text-center">Click a day or drag across days to apply for leave</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Apply dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" /> Apply for Leave
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Leave Type *</Label>
              <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value, end_date: !f.end_date || f.end_date < e.target.value ? e.target.value : f.end_date }))}
                  className="mt-1.5" />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" value={form.end_date} min={form.start_date || format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="mt-1.5" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Half day only</Label>
              <Switch checked={form.half_day} onCheckedChange={v => setForm(f => ({ ...f, half_day: v }))} />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Family function, medical appointment..." rows={2} className="mt-1.5" />
            </div>
            <div>
              <Label>Supporting Document (optional)</Label>
              <div className="mt-1.5 flex items-center gap-3">
                {docFile ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 p-2 rounded-lg border border-slate-200 bg-slate-50">
                    <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-700 truncate">{docFile.name}</span>
                    <button onClick={() => setDocFile(null)} className="ml-auto text-slate-400 hover:text-red-500 shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors flex-1">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500">Upload medical cert, letter, etc.</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setDocFile(e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={submitting || !form.start_date || !form.end_date}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

