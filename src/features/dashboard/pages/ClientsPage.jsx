import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Plus, Search, User, Mail, Phone, Edit, Trash2, Users, TrendingUp, UserPlus, Calendar, DollarSign, Star, ArrowUp, ArrowDown, MessageSquare, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';
import { format, parseISO, differenceInDays } from 'date-fns';
import { formatPrice } from '@/shared/lib/currency';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);

  // Filters
  const [vipFilter, setVipFilter] = useState(searchParams.get('vip') || 'all');
  const [newClientFilter, setNewClientFilter] = useState(searchParams.get('new_client') || 'all');
  const [rebookingFilter, setRebookingFilter] = useState(searchParams.get('rebooking_due') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  // Sort
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'name');
  const [sortDir, setSortDir] = useState(searchParams.get('sort_dir') || 'asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkSmsOpen, setBulkSmsOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkSmsBody, setBulkSmsBody] = useState('');
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailBody, setBulkEmailBody] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await api.get('/clients/kpis');
      setKpis(res.data);
    } catch (e) { console.error('Failed to fetch client KPIs', e); }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const params = { page, sort_by: sortBy, sort_dir: sortDir };
      if (search) params.search = search;
      if (vipFilter === 'vip') params.vip = true;
      if (vipFilter === 'regular') params.vip = false;
      if (newClientFilter === 'new') params.new_client = true;
      if (rebookingFilter === 'due') params.rebooking_due = true;
      if (statusFilter === 'active') params.active = true;
      if (statusFilter === 'inactive') params.active = false;
      if (statusFilter === 'archived') params.archived = true;
      const res = await api.get('/clients', { params });
      setClients(listItems(res.data));
      if (res.data?.total_pages) setTotalPages(res.data.total_pages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search, vipFilter, newClientFilter, rebookingFilter, statusFilter, sortBy, sortDir, page]);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Sync filters to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (vipFilter !== 'all') p.set('vip', vipFilter);
    if (newClientFilter !== 'all') p.set('new_client', newClientFilter);
    if (rebookingFilter !== 'all') p.set('rebooking_due', rebookingFilter);
    if (statusFilter !== 'all') p.set('status', statusFilter);
    if (sortBy !== 'name') p.set('sort_by', sortBy);
    if (sortDir !== 'asc') p.set('sort_dir', sortDir);
    setSearchParams(p, { replace: true });
  }, [search, vipFilter, newClientFilter, rebookingFilter, statusFilter, sortBy, sortDir, setSearchParams]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const SortArrow = ({ col }) => {
    if (sortBy !== col) return null;
    return sortDir === 'asc'
      ? <ArrowUp className="inline h-3 w-3 ml-1" />
      : <ArrowDown className="inline h-3 w-3 ml-1" />;
  };

  const openNew = () => {
    setEditId(null);
    setForm({ full_name: '', email: '', phone: '', address: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (c, e) => {
    e?.stopPropagation();
    setEditId(c.id);
    setForm({ full_name: c.full_name, email: c.email || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`/clients/${editId}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client added');
      }
      setDialogOpen(false);
      fetchClients();
      fetchKpis();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save client');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this client? Their pets and appointment history will also be removed.')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      fetchClients();
      fetchKpis();
    } catch (e) { console.error(e); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedIds.size} client(s)?`)) return;
    setBulkLoading(true);
    try {
      await api.post('/clients/bulk-action', { action: 'archive', client_ids: [...selectedIds] });
      toast.success(`${selectedIds.size} client(s) archived`);
      setSelectedIds(new Set());
      fetchClients();
      fetchKpis();
    } catch (e) { console.error(e); toast.error('Bulk archive failed'); }
    setBulkLoading(false);
  };

  const handleBulkSms = async () => {
    setBulkLoading(true);
    try {
      await api.post('/clients/bulk-action', { action: 'log_sms', client_ids: [...selectedIds], body: bulkSmsBody });
      toast.success(`SMS logged for ${selectedIds.size} client(s)`);
      setBulkSmsOpen(false);
      setBulkSmsBody('');
      setSelectedIds(new Set());
    } catch (e) { console.error(e); toast.error('Bulk SMS failed'); }
    setBulkLoading(false);
  };

  const handleBulkEmail = async () => {
    setBulkLoading(true);
    try {
      await api.post('/clients/bulk-action', { action: 'log_email', client_ids: [...selectedIds], subject: bulkEmailSubject, body: bulkEmailBody });
      toast.success(`Email logged for ${selectedIds.size} client(s)`);
      setBulkEmailOpen(false);
      setBulkEmailSubject('');
      setBulkEmailBody('');
      setSelectedIds(new Set());
    } catch (e) { console.error(e); toast.error('Bulk email failed'); }
    setBulkLoading(false);
  };

  // KPI card definitions
  const kpiCards = kpis ? [
    { label: 'Total Clients', value: kpis.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active (last 120d)', value: kpis.active_120d, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'New This Month', value: kpis.new_this_month, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
    {
      label: 'Due to Rebook',
      value: kpis.due_to_rebook,
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onClick: () => setRebookingFilter('due'),
    },
    { label: 'Outstanding Balance', value: formatPrice(kpis.outstanding_balance || 0), icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
    {
      label: 'VIP Clients',
      value: kpis.vip_count,
      icon: Star,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      onClick: () => setVipFilter('vip'),
    },
  ] : [];

  const isRebookingSoon = (dateStr) => {
    if (!dateStr) return false;
    try {
      return differenceInDays(parseISO(dateStr), new Date()) <= 7;
    } catch { return false; }
  };

  return (
    <div data-testid="clients-page" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">Manage pet owners and their contact details</p>
        </div>
        <Button data-testid="add-client-btn" onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
          <Plus className="h-4 w-4 mr-1.5" /> Add Client
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiCards.map((k, i) => (
            <Card
              key={i}
              className={`rounded-xl border-slate-200/60 hover:shadow-md transition-shadow ${k.onClick ? 'cursor-pointer' : ''}`}
              onClick={k.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{k.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{k.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`h-5 w-5 ${k.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search + Filter Bar */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                data-testid="client-search-input"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={vipFilter} onValueChange={setVipFilter}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="VIP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VIP</SelectItem>
                  <SelectItem value="vip">VIP Only</SelectItem>
                  <SelectItem value="regular">Regular Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newClientFilter} onValueChange={setNewClientFilter}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="New Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="new">New Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rebookingFilter} onValueChange={setRebookingFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Rebooking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rebooking</SelectItem>
                  <SelectItem value="due">Due This Week</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>
                  <TableHead className="w-[40px]" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={clients.length > 0 && selectedIds.size === clients.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    Name <SortArrow col="name" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('phone')}>
                    Phone <SortArrow col="phone" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('email')}>
                    Email <SortArrow col="email" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('suburb')}>
                    Suburb <SortArrow col="suburb" />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">VIP</TableHead>
                  <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('rebooking_due_date')}>
                    Rebook Due <SortArrow col="rebooking_due_date" />
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      {loading ? 'Loading...' : 'No clients found. Add your first client.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map(c => (
                    <TableRow
                      key={c.id}
                      data-testid={`client-row-${c.id}`}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => navigate(`/dashboard/clients/${c.id}`)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-amber-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.full_name}</p>
                            <p className="text-xs text-slate-500 md:hidden">{c.phone || c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-slate-600 truncate max-w-[150px] block">{c.phone || '-'}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-slate-600 truncate max-w-[200px] block">{c.email || '-'}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{c.suburb || '-'}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {c.value_flag === 'vip' && (
                          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                            <Star className="h-3 w-3 mr-1" /> VIP
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {c.rebooking_due_date ? (
                          <span className={`text-sm ${isRebookingSoon(c.rebooking_due_date) ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                            {format(parseISO(c.rebooking_due_date), 'dd MMM yyyy')}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={(e) => openEdit(c, e)} className="h-8 w-8">
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => handleDelete(c.id, e)} className="h-8 w-8 text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Client' : 'New Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name *</Label>
              <Input data-testid="client-name-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Smith" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="john@email.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0123" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City" className="mt-1.5" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Preferences, allergies, etc." className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              data-testid="client-save-btn"
              onClick={handleSave}
              disabled={!form.full_name}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editId ? 'Update' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 animate-fade-in">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-slate-600" />
          <Button size="sm" variant="ghost" className="text-white hover:bg-slate-700" onClick={handleBulkArchive} disabled={bulkLoading}>
            <Archive className="h-4 w-4 mr-1.5" /> Archive
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-slate-700" onClick={() => setBulkSmsOpen(true)} disabled={bulkLoading}>
            <MessageSquare className="h-4 w-4 mr-1.5" /> Send SMS
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-slate-700" onClick={() => setBulkEmailOpen(true)} disabled={bulkLoading}>
            <Mail className="h-4 w-4 mr-1.5" /> Send Email
          </Button>
        </div>
      )}

      {/* Bulk SMS Dialog */}
      <Dialog open={bulkSmsOpen} onOpenChange={setBulkSmsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send SMS to {selectedIds.size} Client(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Message Body</Label>
              <Textarea value={bulkSmsBody} onChange={e => setBulkSmsBody(e.target.value)} placeholder="Type your SMS message..." rows={4} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkSmsOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkSms} disabled={bulkLoading || !bulkSmsBody} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {bulkLoading ? 'Sending...' : 'Log SMS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedIds.size} Client(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Subject</Label>
              <Input value={bulkEmailSubject} onChange={e => setBulkEmailSubject(e.target.value)} placeholder="Email subject" className="mt-1.5" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={bulkEmailBody} onChange={e => setBulkEmailBody(e.target.value)} placeholder="Type your email message..." rows={4} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkEmail} disabled={bulkLoading || !bulkEmailBody} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {bulkLoading ? 'Sending...' : 'Log Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
