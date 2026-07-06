import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/assets';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu';
import {
  Edit, Trash2, UserPlus, Mail, Phone, Shield, Search, Users, CalendarCheck, DollarSign, Activity,
  ArrowUpDown, MoreVertical, RotateCcw, PowerOff, Power, AlertTriangle, Crown, Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';
import { formatPrice } from '@/shared/lib/currency';

/* ── KPI strip ──────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, icon: Icon, color = 'text-primary' }) {
  return (
    <Card className="rounded-xl border-slate-200/60">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-slate-50 ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Staff table ────────────────────────────────────────────────────────────── */

function StaffTable({ isAdmin, canGrantAdmin, refreshKey, search, roleFilter, activeFilter, sortBy, sortDir, onSort, tenantRoles = [], ownerUserId, currentUserId, onChange }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '' });

  // ── Two-step delete confirmation ──
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const params = { limit: 200 };
      if (search) params.search = search;
      if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
      if (activeFilter !== null && activeFilter !== 'all') params.is_active = activeFilter === 'active';
      if (sortBy) { params.sort_by = sortBy; params.sort_dir = sortDir; }
      const res = await api.get('/staff', { params });
      setItems(listItems(res.data));
    } catch (e) {
      console.error(e);
    }
  }, [search, roleFilter, activeFilter, sortBy, sortDir]);

  useEffect(() => { fetchStaff(); }, [fetchStaff, refreshKey]);

  const openEdit = async (item, e) => {
    e?.stopPropagation();
    setEditId(item.id);
    setEditUserId(item.user_id || null);
    setForm({
      full_name: item.full_name,
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || '',
    });
    if (item.user_id) {
      try {
        const res = await api.get(`/members/${item.user_id}`);
        setEditIsAdmin(res.data.is_admin || false);
      } catch { setEditIsAdmin(false); }
    } else {
      setEditIsAdmin(false);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.put(`/staff/${editId}`, form);
      if (editUserId) {
        await api.put(`/members/${editUserId}/role`, { is_admin: editIsAdmin });
      }
      setDialogOpen(false);
      fetchStaff();
      toast.success('Updated successfully');
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  const isOwner = (staff) => staff?.user_id && ownerUserId && staff.user_id === ownerUserId;
  const isSelf = (staff) => staff?.user_id && currentUserId && staff.user_id === currentUserId;

  const openDeleteDialog = (item, e) => {
    e?.stopPropagation();
    if (isOwner(item)) {
      toast.error('Cannot delete the salon owner. Transfer ownership first.');
      return;
    }
    setDeleteDialog({ open: true, item });
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    const item = deleteDialog.item;
    if (!item || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await api.delete(`/staff/${item.id}`);
      const days = res.data?.days_to_restore || 30;
      toast.success(`Moved to trash. Restorable for ${days} days.`);
      setDeleteDialog({ open: false, item: null });
      setDeleteConfirmText('');
      fetchStaff();
      if (onChange) onChange();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
    setDeleting(false);
  };

  const handleToggleActive = async (item, e) => {
    e?.stopPropagation();
    if (isOwner(item)) {
      toast.error('Cannot deactivate the salon owner');
      return;
    }
    const action = item.is_active ? 'deactivate' : 'activate';
    try {
      await api.put(`/staff/${item.id}/${action}`);
      toast.success(item.is_active ? 'Member deactivated — they cannot log in' : 'Member reactivated');
      fetchStaff();
      if (onChange) onChange();
    } catch (e) {
      toast.error(e.response?.data?.detail || `Failed to ${action}`);
    }
  };

  const SortHeader = ({ field, children }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-slate-900"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === field && (
          <ArrowUpDown className="h-3 w-3 text-primary" />
        )}
      </span>
    </TableHead>
  );

  return (
    <>
      <Card className="rounded-xl border-slate-200/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-white">
                <SortHeader field="full_name">Name</SortHeader>
                <SortHeader field="role">Role</SortHeader>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">No staff found</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow
                  key={item.id}
                  data-testid={`staff-row-${item.id}`}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => navigate(`/dashboard/staff/member/${item.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.photo_url ? (
                        <img src={assetUrl(item.photo_url)} alt={item.full_name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ backgroundColor: item.color || '#6366F1' }}
                        >
                          {item.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.full_name}</p>
                        {item.employment_type && (
                          <p className="text-[11px] text-slate-400 capitalize">{item.employment_type.replace('_', ' ')}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.role ? (
                      <Badge variant="outline" className="rounded-full text-xs">{item.role}</Badge>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-0.5">
                      {item.email && <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</p>}
                      {item.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</p>}
                      {!item.email && !item.phone && <span className="text-xs text-slate-400">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className={`rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {isOwner(item) && (
                              <DropdownMenuItem disabled className="text-amber-600 text-xs">
                                <Crown className="h-3.5 w-3.5 mr-2" /> Salon Owner
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/staff/member/${item.id}`)}>
                              <Edit className="h-3.5 w-3.5 mr-2" /> View / Edit
                            </DropdownMenuItem>
                            {!isOwner(item) && (
                              <>
                                <DropdownMenuSeparator />
                                {item.is_active ? (
                                  <DropdownMenuItem onClick={(e) => handleToggleActive(item, e)} className="text-amber-700">
                                    <PowerOff className="h-3.5 w-3.5 mr-2" /> Deactivate
                                    <span className="ml-auto text-[10px] text-slate-400">No login</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={(e) => handleToggleActive(item, e)} className="text-emerald-700">
                                    <Power className="h-3.5 w-3.5 mr-2" /> Reactivate
                                  </DropdownMenuItem>
                                )}
                                {!isSelf(item) && (
                                  <DropdownMenuItem onClick={(e) => openDeleteDialog(item, e)} className="text-red-600">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Move to Trash
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" /></div>
            <div>
              <Label>Role / Title</Label>
              <Select value={form.role || ''} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {tenantRoles.map(r => (
                    <SelectItem key={r.name} value={r.name}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenantRoles.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">No roles configured. Add roles in Settings → Staff Roles.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="mt-1.5" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
            </div>
            {/* Only the OWNER can grant/revoke admin. Non-owner admins don't
                see an editable admin switch. */}
            {editUserId && canGrantAdmin && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Admin Access</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Grant admin privileges</p>
                </div>
                <Switch checked={editIsAdmin} onCheckedChange={setEditIsAdmin} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.full_name} className="bg-primary hover:bg-primary/90 text-primary-foreground">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 2-step delete confirmation ── */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(o) => { if (!o) { setDeleteDialog({ open: false, item: null }); setDeleteConfirmText(''); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Move to Trash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-slate-700">
              <strong>{deleteDialog.item?.full_name}</strong> will be moved to trash.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 bg-slate-50 rounded-lg p-3">
              <li>• They will <strong>not</strong> be able to log in</li>
              <li>• Restorable from Trash for <strong>30 days</strong></li>
              <li>• After 30 days the record is archived for audit (not restorable)</li>
              <li>• Permanently purged after <strong>1 year</strong></li>
            </ul>
            <div>
              <Label className="text-xs">
                To confirm, type <span className="font-mono font-bold text-red-600">DELETE</span> below:
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5 font-mono"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialog({ open: false, item: null }); setDeleteConfirmText(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Moving...' : 'Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Trash dialog ───────────────────────────────────────────────────────────── */

function TrashDialog({ open, onOpenChange, ownerUserId, onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff', { params: { include_deleted: true, limit: 200 } });
      setItems(listItems(res.data));
    } catch (e) {
      toast.error('Failed to load trash');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchTrash();
  }, [open, fetchTrash]);

  const handleRestore = async (item) => {
    setRestoring(item.id);
    try {
      await api.post(`/staff/${item.id}/restore`);
      toast.success(`${item.full_name} restored`);
      fetchTrash();
      if (onChange) onChange();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Restore failed');
    }
    setRestoring(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-slate-500" /> Trash
            <span className="text-xs font-normal text-slate-400">
              · 30 days to restore · 1 year audit retention
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Archive className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Trash is empty</p>
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="divide-y divide-slate-100">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 opacity-60"
                    style={{ backgroundColor: item.color || '#6366F1' }}
                  >
                    {item.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 line-through">{item.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {item.role || '—'}
                      {item.deleted_at && (
                        <> · Deleted {new Date(item.deleted_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  {item.restorable ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-amber-600 font-medium">
                        {Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deleted_at).getTime()) / 86400000))}d to restore
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(item)}
                        disabled={restoring === item.id}
                        className="h-7 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {restoring === item.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge className="bg-slate-100 text-slate-500 text-[10px] rounded-full">Archived</Badge>
                      <span className="text-[10px] text-slate-400">{item.days_until_purge}d till purge</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

export default function StaffPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin || profile?.role === 'admin';
  const isOwner = !!profile?.is_owner;  // only the owner can grant/revoke admin
  const [refreshKey, setRefreshKey] = useState(0);

  // KPIs + tenant roles
  const [kpis, setKpis] = useState(null);
  const [currency, setCurrency] = useState('AUD');
  const [tenantRoles, setTenantRoles] = useState([]);
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    api.get('/staff/kpis').then(r => setKpis(r.data)).catch(() => {});
    api.get('/tenant/me').then(r => {
      setCurrency(r.data?.settings?.currency || 'AUD');
      setTenantRoles(r.data?.settings?.roles || []);
    }).catch(() => {});
    // Find the owner via /members?is_owner=true (or fall back to checking users)
    api.get('/members').then(r => {
      const members = listItems(r.data);
      const owner = members.find(m => m.is_owner);
      setOwnerUserId(owner?.id || null);
    }).catch(() => {});
    // Trash count badge
    api.get('/staff', { params: { include_deleted: true, limit: 1 } })
      .then(r => setTrashCount(r.data?.total || 0))
      .catch(() => setTrashCount(0));
  }, [refreshKey]);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [grantAdmin, setGrantAdmin] = useState(false);
  const [memberForm, setMemberForm] = useState({
    full_name: '', email: '', role: 'staff', temp_password: '',
    specialization: '', phone: '', color: '#6366F1',
  });
  const [creating, setCreating] = useState(false);

  const resetMemberForm = () => {
    setMemberForm({
      full_name: '', email: '', role: 'staff', temp_password: '',
      specialization: '', phone: '', color: '#6366F1',
    });
    setGrantAdmin(false);
  };

  const handleAddMember = async () => {
    if (memberForm.temp_password.length < 6) {
      toast.error('Temporary password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/members', memberForm);
      if (grantAdmin && res.data.user_id) {
        await api.put(`/members/${res.data.user_id}/role`, { is_admin: true });
      }
      setAddMemberOpen(false);
      resetMemberForm();
      setRefreshKey(k => k + 1);
      toast.success('Member created successfully. They can now log in with the temporary password.');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create member');
    }
    setCreating(false);
  };

  return (
    <div data-testid="staff-page" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your grooming staff</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTrashOpen(true)}
              className="rounded-lg relative"
            >
              <Archive className="h-4 w-4 mr-1.5" /> Trash
              {trashCount > 0 && (
                <span className="ml-1.5 bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                  {trashCount}
                </span>
              )}
            </Button>
            <Button onClick={() => { resetMemberForm(); setAddMemberOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Member
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Total Staff" value={kpis.total_staff} icon={Users} />
          <KpiCard label="Working Today" value={kpis.working_today} icon={CalendarCheck} color="text-emerald-600" />
          <KpiCard label="Avg Appts / Staff" value={kpis.avg_appointments_per_staff} icon={Activity} color="text-blue-600" />
          <KpiCard label="Revenue / Staff" value={formatPrice(kpis.revenue_per_staff, currency)} icon={DollarSign} color="text-violet-600" />
          <KpiCard label="Utilisation" value={`${kpis.utilisation_percent}%`} icon={Activity} color="text-amber-600" />
        </div>
      )}

      {/* Filters */}
      <Card className="rounded-xl border-slate-200/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {tenantRoles.map(r => (
                  <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                ))}
                {tenantRoles.length === 0 && (
                  <>
                    <SelectItem value="Groomer">Groomer</SelectItem>
                    <SelectItem value="Bather">Bather</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <StaffTable
        isAdmin={isAdmin}
        canGrantAdmin={isOwner}
        refreshKey={refreshKey}
        search={debouncedSearch}
        roleFilter={roleFilter}
        activeFilter={activeFilter}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        tenantRoles={tenantRoles}
        ownerUserId={ownerUserId}
        currentUserId={profile?.id}
        onChange={() => setRefreshKey(k => k + 1)}
      />

      <TrashDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        ownerUserId={ownerUserId}
        onChange={() => setRefreshKey(k => k + 1)}
      />

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Full Name *</Label><Input value={memberForm.full_name} onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Email *</Label><Input type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} className="mt-1.5" /></div>
            <div>
              <Label>Temporary Password *</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={memberForm.temp_password}
                onChange={e => setMemberForm({ ...memberForm, temp_password: e.target.value })}
                placeholder="Min 6 characters"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Member will be asked to change this on first login</p>
            </div>
            <div>
              <Label>Role / Title</Label>
              <Select value={memberForm.specialization || ''} onValueChange={v => setMemberForm({ ...memberForm, specialization: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {tenantRoles.map(r => (
                    <SelectItem key={r.name} value={r.name}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenantRoles.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">No roles configured. Add roles in Settings → Staff Roles.</p>
              )}
            </div>
            <div><Label>Phone</Label><Input value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} className="mt-1.5" /></div>
            {/* Only the owner can grant admin. Non-owner admins can add staff
                but not create other admins (backend enforces this too). */}
            {isOwner && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Also grant Admin access</Label>
                <p className="text-xs text-slate-400 mt-0.5">Settings, team management, analytics</p>
              </div>
              <Switch checked={grantAdmin} onCheckedChange={setGrantAdmin} />
            </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={!memberForm.full_name || !memberForm.email || !memberForm.temp_password || creating} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {creating ? 'Creating...' : 'Create Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
