import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Plus, CalendarCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { listItems } from '@/lib/listResponse';
import { formatPrice } from '@/lib/currency';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  receipt_generated: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'receipt_generated', label: 'Receipt generated' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState('AUD');

  const search = (searchParams.get('search') || '').toLowerCase();
  const statusFilter = searchParams.get('status') || 'all';
  const staffFilter = searchParams.get('staff_id') || 'all';
  const dateFilter = searchParams.get('date') || '';

  // Load staff list + tenant currency once
  useEffect(() => {
    api.get('/staff', { params: { limit: 200 } })
      .then(r => setStaffMembers(listItems(r.data)))
      .catch(() => {});
    api.get('/tenant/me')
      .then(r => setCurrency(r.data?.settings?.currency || 'AUD'))
      .catch(() => {});
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (staffFilter !== 'all') params.staff_id = staffFilter;
      if (dateFilter && dateFilter !== 'today') {
        params.date_from = dateFilter;
        params.date_to = dateFilter;
      } else if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.date_from = today;
        params.date_to = today;
      }
      const res = await api.get('/g/appointments', { params });
      setAppointments(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setAppointments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, staffFilter, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '') next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
    setPage(1);
  };

  const filtered = search
    ? appointments.filter(a => {
        const hay = `${a.pet?.name || ''} ${a.client?.full_name || a.client?.full_name || ''} ${a.service?.name || ''} ${a.staff?.full_name || ''}`.toLowerCase();
        return hay.includes(search);
      })
    : appointments;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div data-testid="appointments-page" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track grooming appointments</p>
        </div>
        <Button
          data-testid="new-appointment-btn"
          onClick={() => navigate('/dashboard/appointments/new')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-xl border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search pet, client, service..."
                className="pl-9"
                value={search}
                onChange={e => updateParam('search', e.target.value)}
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => updateParam('status', v)}>
              <SelectTrigger data-testid="status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={v => updateParam('staff_id', v)}>
              <SelectTrigger data-testid="staff-filter"><SelectValue placeholder="All staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff</SelectItem>
                {staffMembers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter === 'today' ? new Date().toISOString().split('T')[0] : dateFilter}
              onChange={e => updateParam('date', e.target.value)}
              data-testid="date-filter"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-xl border-slate-200/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarCheck className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No appointments found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/dashboard/appointments/new')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Create one
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => {
                  const owner = a.client?.full_name || a.client?.full_name || '-';
                  const dt = a.start_time ? parseISO(a.start_time) : null;
                  return (
                    <TableRow
                      key={a.id}
                      data-testid={`appt-row-${a.id}`}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/dashboard/appointments/${a.id}/detail`)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {a.pet?.name || '-'}
                        {a.pet?.species && (
                          <span className="ml-1 text-xs text-slate-400">({a.pet.species})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{owner}</TableCell>
                      <TableCell className="text-slate-600">{a.staff?.full_name || '-'}</TableCell>
                      <TableCell className="text-slate-600">{a.service?.name || '-'}</TableCell>
                      <TableCell className="text-slate-600">
                        {dt ? format(dt, 'MMM d, h:mm a') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full text-xs ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-700'}`}>
                          {a.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {/*
                          Prefer the actual `receipt_total` (when a receipt
                          has been generated) over the booking-time
                          `payment_amount` estimate. The list endpoint always
                          eager-loads the receipt now, so `receipt_total` is
                          present whenever the appointment has been billed.
                          Label so the user knows which is which.
                        */}
                        {(() => {
                          if (a.receipt_total != null) {
                            return (
                              <div>
                                <div>{formatPrice(a.receipt_total, currency)}</div>
                                <div className="text-[9px] uppercase tracking-wide text-green-600 font-semibold">
                                  Paid
                                </div>
                              </div>
                            );
                          }
                          if (a.payment_amount != null) {
                            return (
                              <div>
                                <div>{formatPrice(a.payment_amount, currency)}</div>
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                  Est
                                </div>
                              </div>
                            );
                          }
                          return '-';
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Per page:</span>
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} / {totalPages}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
