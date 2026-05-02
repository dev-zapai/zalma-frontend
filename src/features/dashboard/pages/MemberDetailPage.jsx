import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, User, MapPin,
  GraduationCap, FileText, Shield, Scissors, Check as CheckIcon,
  ChevronLeft, ChevronRight, Edit2, DollarSign, Briefcase, Upload,
  Trash2, ExternalLink, File, Wallet, Building2, AlertCircle,
} from 'lucide-react';
import { format, parseISO, subDays, subYears } from 'date-fns';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';
import { formatPrice } from '@/shared/lib/currency';

const DAYS_OF_WEEK = [
  { idx: 0, label: 'Mon' }, { idx: 1, label: 'Tue' }, { idx: 2, label: 'Wed' },
  { idx: 3, label: 'Thu' }, { idx: 4, label: 'Fri' }, { idx: 5, label: 'Sat' },
  { idx: 6, label: 'Sun' },
];

const STATUS_STYLES = {
  scheduled: 'bg-primary/15 text-primary',
  confirmed: 'bg-emerald-100 text-emerald-700',
  checked_in: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  receipt_generated: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
};

const KPI_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'all', label: 'All' },
];

export default function MemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { profile, fetchProfile } = useAuth();
  const currentIsAdmin = profile?.is_admin || profile?.role === 'admin';

  const [member, setMember] = useState(null);
  const [memberUser, setMemberUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [capabilityIds, setCapabilityIds] = useState([]);
  const [savedCapabilityIds, setSavedCapabilityIds] = useState([]);
  const [savingCapability, setSavingCapability] = useState(false);
  const [editingCapabilities, setEditingCapabilities] = useState(false);
  const [schedule, setSchedule] = useState({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({});
  const [savingContact, setSavingContact] = useState(false);
  const [editingEmployment, setEditingEmployment] = useState(false);
  const [empForm, setEmpForm] = useState({});
  const [editingQualification, setEditingQualification] = useState(false);
  const [qualForm, setQualForm] = useState('');
  const [tenantRoles, setTenantRoles] = useState([]);
  const [editingRoleTitle, setEditingRoleTitle] = useState(false);
  const [roleTitleForm, setRoleTitleForm] = useState('');
  const [savingEmployment, setSavingEmployment] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTag, setDocTag] = useState('');
  const [apptPage, setApptPage] = useState(0);
  const [kpiRange, setKpiRange] = useState('all');
  const [currency, setCurrency] = useState('AUD');

  // Payroll self-service
  const [payslips, setPayslips] = useState([]);
  const [bankForm, setBankForm] = useState({ bank_bsb: '', bank_account_number: '', bank_account_name: '' });
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Tax & Superannuation (admin-editable)
  const [editingTax, setEditingTax] = useState(false);
  const [savingTax, setSavingTax] = useState(false);
  const [taxForm, setTaxForm] = useState({
    tfn_masked: '',
    tax_free_threshold: true,
    residency_status: 'resident',
    medicare_exemption: 'none',
    super_fund_name: '',
    super_fund_number: '',
    superannuation_rate: 11.5,
  });
  const APPTS_PER_PAGE = 10;

  const isSelf = profile?.staff_id && profile.staff_id === memberId;
  const canManage = currentIsAdmin || isSelf;

  // ── Permission matrix ──────────────────────────────────────────────────
  const canEditPersonalInfo = canManage;        // contact info: admin or self
  const canEditWorkingHours = canManage;
  const canEditCapabilities = canManage;
  const canUploadDocuments = canManage;         // docs: admin or self
  const canDeleteDocuments = canManage;
  const canEditEmployment = currentIsAdmin;     // pay, type, finance: admin only
  const canEditRole = currentIsAdmin;           // role title + admin toggle: admin only
  const canEditQualification = canManage;       // qualification: admin or self

  // ── Fetch appointments (separate, for KPI range changes) ─────────────
  const fetchAppointments = useCallback(async (range) => {
    const params = { staff_id: memberId, limit: 100 };
    const r = KPI_RANGES.find(x => x.key === range);
    if (r?.days) {
      // Send as plain YYYY-MM-DD so the backend's tenant-timezone-aware
      // parser handles it correctly (ISO strings get treated as single instants).
      const from = subDays(new Date(), r.days);
      params.date_from = format(from, 'yyyy-MM-dd');
    }
    try {
      const res = await api.get('/g/appointments', { params });
      setAppointments(listItems(res.data));
      setApptPage(0);
    } catch (e) { console.error('Failed to fetch appointments:', e); }
  }, [memberId]);

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, tenantRes] = await Promise.all([
        api.get(`/staff/${memberId}`),
        api.get('/tenant/me'),
      ]);
      setMember(memberRes.data);
      setCurrency(tenantRes.data?.settings?.currency || 'AUD');
      setTenantRoles(tenantRes.data?.settings?.roles || [
        { name: 'Groomer', color: '#6366F1' },
        { name: 'Senior Groomer', color: '#7C3AED' },
        { name: 'Bather', color: '#06B6D4' },
        { name: 'Manager', color: '#F59E0B' },
      ]);

      if (memberRes.data.user_id) {
        try {
          const userRes = await api.get(`/members/${memberRes.data.user_id}`);
          setMemberUser(userRes.data);
        } catch { }
      }

      try {
        const docRes = await api.get(`/staff/${memberId}/documents`);
        setDocuments(docRes.data || []);
      } catch { }

      setEmpForm({
        employee_code: memberRes.data.employee_code || '',
        employment_type: memberRes.data.employment_type || '',
        pay_frequency: memberRes.data.pay_frequency || '',
        hourly_rate: memberRes.data.hourly_rate ?? '',
        salary_amount: memberRes.data.salary_amount ?? '',
        commission_rate: memberRes.data.commission_rate ?? '',
        start_date: memberRes.data.start_date || '',
        staff_abn: memberRes.data.staff_abn || '',
      });
      setTaxForm({
        tfn_masked: memberRes.data.tfn_masked || '',
        tax_free_threshold: memberRes.data.tax_free_threshold !== false,
        residency_status: memberRes.data.residency_status || 'resident',
        medicare_exemption: memberRes.data.medicare_exemption || 'none',
        super_fund_name: memberRes.data.super_fund_name || '',
        super_fund_number: memberRes.data.super_fund_number || '',
        superannuation_rate: memberRes.data.superannuation_rate ?? 11.5,
      });

      try {
        const [svcRes, capRes] = await Promise.all([
          api.get('/services', { params: { limit: 200 } }),
          api.get(`/availability/staff/${memberId}/services`),
        ]);
        setAllServices(listItems(svcRes.data));
        const ids = capRes.data.service_ids || [];
        setCapabilityIds(ids);
        setSavedCapabilityIds(ids);
      } catch { }

      try {
        const schedRes = await api.get(`/availability/staff/${memberId}/schedule`);
        const map = {};
        DAYS_OF_WEEK.forEach(d => {
          const row = (schedRes.data || []).find(r => r.day_of_week === d.idx);
          map[d.idx] = row
            ? { enabled: true, start: row.start_time || '09:00', end: row.end_time || '17:00', break_start: row.break_start || '', break_end: row.break_end || '' }
            : { enabled: false, start: '09:00', end: '17:00', break_start: '', break_end: '' };
        });
        setSchedule(map);
      } catch { }

      // Payslip history (self-service: staff sees paid slips only; admin sees all)
      try {
        const slipsRes = await api.get('/payroll/my-slips');
        setPayslips(slipsRes.data || []);
      } catch { }

      // Bank form init from member data
      setBankForm({
        bank_bsb: memberRes.data.bank_bsb || '',
        bank_account_number: memberRes.data.bank_account_number || '',
        bank_account_name: memberRes.data.bank_account_name || '',
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [memberId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAppointments(kpiRange); }, [fetchAppointments, kpiRange]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleCapability = (id) => setCapabilityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const entries = DAYS_OF_WEEK.filter(d => schedule[d.idx]?.enabled).map(d => {
        const row = schedule[d.idx];
        return { day_of_week: d.idx, start_time: row.start, end_time: row.end, break_start: row.break_start || null, break_end: row.break_end || null };
      });
      await api.put(`/availability/staff/${memberId}/schedule`, { entries });
      toast.success('Working hours updated');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save'); }
    setSavingSchedule(false);
  };

  const handleSaveCapability = async () => {
    setSavingCapability(true);
    try {
      await api.put(`/availability/staff/${memberId}/services`, { service_ids: capabilityIds });
      setSavedCapabilityIds(capabilityIds);
      setEditingCapabilities(false);
      toast.success('Service capabilities updated');
    } catch { toast.error('Failed to save capabilities'); }
    setSavingCapability(false);
  };

  const handleCancelCapability = () => { setCapabilityIds(savedCapabilityIds); setEditingCapabilities(false); };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await api.put(`/staff/${memberId}`, contactForm);
      setEditingContact(false);
      toast.success('Contact info updated');
      fetchData();
    } catch { toast.error('Failed to save'); }
    setSavingContact(false);
  };

  const handleSaveQualification = async () => {
    try {
      await api.put(`/staff/${memberId}`, { qualification: qualForm });
      setEditingQualification(false);
      toast.success('Qualification updated');
      fetchData();
    } catch { toast.error('Failed to save'); }
  };

  const handleSaveRoleTitle = async () => {
    if (!roleTitleForm) return;
    try {
      await api.put(`/staff/${memberId}`, { role: roleTitleForm });
      setEditingRoleTitle(false);
      toast.success('Role updated');
      fetchData();
    } catch { toast.error('Failed to save'); }
  };

  const handleSaveEmployment = async () => {
    setSavingEmployment(true);
    try {
      const payload = { ...empForm };
      ['commission_rate', 'start_date', 'hourly_rate', 'salary_amount'].forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });
      await api.put(`/staff/${memberId}`, payload);
      setEditingEmployment(false);
      toast.success('Employment details updated');
      fetchData();
    } catch { toast.error('Failed to save'); }
    setSavingEmployment(false);
  };

  const handleSaveTax = async () => {
    setSavingTax(true);
    try {
      const payload = { ...taxForm };
      if (payload.superannuation_rate === '') payload.superannuation_rate = null;
      await api.put(`/staff/${memberId}`, payload);
      setEditingTax(false);
      toast.success('Tax & superannuation updated');
      fetchData();
    } catch { toast.error('Failed to save'); }
    setSavingTax(false);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docTag || 'other');
      await api.post(`/staff/${memberId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      setDocTag('');
      const docRes = await api.get(`/staff/${memberId}/documents`);
      setDocuments(docRes.data || []);
    } catch { toast.error('Failed to upload'); }
    setUploadingDoc(false);
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/staff/${memberId}/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success('Document deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleAdmin = async (checked) => {
    if (!memberUser) return;
    setSavingRole(true);
    try {
      await api.put(`/members/${memberUser.id}/role`, { is_admin: checked });
      setMemberUser(prev => ({ ...prev, is_admin: checked }));
      toast.success(checked ? 'Admin access granted' : 'Admin access revoked');
    } catch { toast.error('Failed to update role'); }
    setSavingRole(false);
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      await api.put(`/staff/${memberId}/bank-details`, bankForm);
      toast.success('Bank details updated');
      setEditingBank(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update bank details');
    }
    setSavingBank(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!member) return <div className="text-center py-20"><p className="text-slate-400">Member not found</p><Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button></div>;

  // ── KPI computation ────────────────────────────────────────────────────
  const completedAppts = appointments.filter(a => a.status === 'completed' || a.status === 'receipt_generated');
  const scheduledAppts = appointments.filter(a => ['scheduled', 'confirmed', 'checked_in', 'in_progress'].includes(a.status));
  const cancelledAppts = appointments.filter(a => ['cancelled', 'no_show'].includes(a.status));

  const totalPages = Math.max(1, Math.ceil(appointments.length / APPTS_PER_PAGE));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ══ ROW 1: Header ══════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ backgroundColor: member.color || '#6366F1' }}>
                {member.full_name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            {canManage && (
              <label className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center cursor-pointer transition-colors">
                <Upload className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('photo', file);
                  try {
                    const res = await api.put(`/staff/${memberId}/photo`, formData);
                    setMember(m => ({ ...m, photo_url: res.data.photo_url }));
                    // If this staff record is linked to the logged-in user, refresh
                    // AuthContext profile so the sidebar avatar updates immediately.
                    if (memberUser?.id === profile?.id) {
                      await fetchProfile();
                    }
                    toast.success('Photo updated');
                  } catch (err) {
                    toast.error('Failed to upload photo');
                  }
                }} />
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{member.full_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {memberUser?.is_owner ? (
                <Badge className="rounded-full text-xs bg-amber-100 text-amber-800">Owner</Badge>
              ) : (
                <Badge className="rounded-full text-xs capitalize bg-violet-100 text-violet-700">{memberUser?.is_admin ? 'Admin' : 'Staff'}</Badge>
              )}
              {member.role && <Badge variant="outline" className="rounded-full text-xs">{member.role}</Badge>}
              <Badge className={`rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{member.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ROW 2: KPI Strip + Time Filter ═════════════════════════════════ */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Appointment Summary
            </CardTitle>
            <div className="flex gap-1">
              {KPI_RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setKpiRange(r.key)}
                  className={`px-3 py-1 text-xs rounded-md font-medium ${kpiRange === r.key ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Total" value={appointments.length} color="bg-primary/10 text-primary" />
            <StatBox label="Completed" value={completedAppts.length} color="bg-green-50 text-green-700" />
            <StatBox label="Scheduled" value={scheduledAppts.length} color="bg-blue-50 text-blue-700" />
            <StatBox label="Cancelled / No-Show" value={cancelledAppts.length} color="bg-red-50 text-red-700" />
          </div>
        </CardContent>
      </Card>

      {/* ══ ROW 3: Three-column info cards (equal height) ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        {/* ── Contact Information ── */}
        <Card className="rounded-xl border-slate-200/60 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Contact Information</CardTitle>
              {canEditPersonalInfo && !editingContact && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setContactForm({ full_name: member.full_name || '', email: member.email || '', phone: member.phone || '', address: member.address || '' }); setEditingContact(true); }}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {editingContact ? (
              <div className="space-y-3">
                <div><Label className="text-xs">Full Name</Label><Input className="mt-1 h-8 text-sm" value={contactForm.full_name} onChange={e => setContactForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div><Label className="text-xs">Email</Label><Input className="mt-1 h-8 text-sm" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label className="text-xs">Phone</Label><Input className="mt-1 h-8 text-sm" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><Label className="text-xs">Address</Label><Input className="mt-1 h-8 text-sm" value={contactForm.address} onChange={e => setContactForm(f => ({ ...f, address: e.target.value }))} /></div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingContact(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveContact} disabled={savingContact}>{savingContact ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow label="Full Name" value={member.full_name} />
                <InfoRow label="Email" value={member.email} icon={<Mail className="h-3.5 w-3.5 text-slate-400" />} />
                <InfoRow label="Phone" value={member.phone} icon={<Phone className="h-3.5 w-3.5 text-slate-400" />} />
                <InfoRow label="Address" value={member.address} icon={<MapPin className="h-3.5 w-3.5 text-slate-400" />} />
                <InfoRow label="Joined" value={member.created_at ? format(parseISO(member.created_at), 'MMM d, yyyy') : null} icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Employment & Compensation (admin-only edits) ── */}
        <Card className="rounded-xl border-slate-200/60 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Employment & Compensation</CardTitle>
              {canEditEmployment && !editingEmployment && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingEmployment(true)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {editingEmployment ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Employee Code</Label>
                    <Input className="mt-1 h-8 text-xs" value={empForm.employee_code} onChange={e => setEmpForm(f => ({ ...f, employee_code: e.target.value }))} placeholder="EMP-001" />
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" className="mt-1 h-8 text-xs" value={empForm.start_date} onChange={e => setEmpForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Employment Type</Label>
                  <Select value={empForm.employment_type || 'none'} onValueChange={v => setEmpForm(f => ({ ...f, employment_type: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Pay Frequency</Label>
                  <Select value={empForm.pay_frequency || 'none'} onValueChange={v => setEmpForm(f => ({ ...f, pay_frequency: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['hourly', 'casual'].includes(empForm.pay_frequency) && (
                    <div>
                      <Label className="text-xs">Hourly Rate ($)</Label>
                      <Input type="number" step="0.01" className="mt-1 h-8 text-xs" value={empForm.hourly_rate} onChange={e => setEmpForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                    </div>
                  )}
                  {empForm.pay_frequency === 'salary' && (
                    <div>
                      <Label className="text-xs">Annual Salary ($)</Label>
                      <Input type="number" step="0.01" className="mt-1 h-8 text-xs" value={empForm.salary_amount} onChange={e => setEmpForm(f => ({ ...f, salary_amount: e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Commission %</Label>
                    <Input type="number" step="0.01" className="mt-1 h-8 text-xs" value={empForm.commission_rate} onChange={e => setEmpForm(f => ({ ...f, commission_rate: e.target.value }))} placeholder="0" />
                  </div>
                </div>
                {empForm.employment_type === 'contract' && (
                  <div>
                    <Label className="text-xs">Contractor ABN</Label>
                    <Input className="mt-1 h-8 text-xs" value={empForm.staff_abn} onChange={e => setEmpForm(f => ({ ...f, staff_abn: e.target.value }))} placeholder="51 824 753 556" />
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingEmployment(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveEmployment} disabled={savingEmployment} className="bg-primary hover:bg-primary/90 text-primary-foreground">{savingEmployment ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow label="Employee Code" value={member.employee_code} />
                <InfoRow label="Type" value={member.employment_type?.replace('_', ' ')} />
                <InfoRow label="Pay Frequency" value={member.pay_frequency?.replace('_', ' ')} />
                {['hourly', 'casual'].includes(member.pay_frequency) && <InfoRow label="Hourly Rate" value={member.hourly_rate != null ? formatPrice(member.hourly_rate, currency) : null} />}
                {member.pay_frequency === 'salary' && <InfoRow label="Annual Salary" value={member.salary_amount != null ? formatPrice(member.salary_amount, currency) : null} />}
                <InfoRow label="Commission" value={member.commission_rate != null && member.commission_rate !== '' ? `${member.commission_rate}%` : null} />
                <InfoRow label="Start Date" value={member.start_date} />
                {member.employment_type === 'contract' && <InfoRow label="ABN" value={member.staff_abn} />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Role ── */}
        <Card className="rounded-xl border-slate-200/60 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Role</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-0">
              {editingRoleTitle ? (
                <div className="py-2">
                  <Label className="text-xs">Role / Title</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={roleTitleForm} onValueChange={setRoleTitleForm}>
                      <SelectTrigger className="h-8 text-sm flex-1"><SelectValue placeholder="Select a role" /></SelectTrigger>
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
                    <Button size="sm" className="h-8" onClick={handleSaveRoleTitle}>Save</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setEditingRoleTitle(false)}>Cancel</Button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Add or edit roles in Settings → Staff Roles</p>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Role / Title</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-900">{member.role || <span className="text-slate-300">-</span>}</span>
                    {canEditRole && (
                      <button onClick={() => { setRoleTitleForm(member.role || ''); setEditingRoleTitle(true); }} className="text-slate-400 hover:text-primary">
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {editingQualification ? (
                <div className="py-2">
                  <Label className="text-xs">Qualification</Label>
                  <div className="flex gap-2 mt-1">
                    <Input className="h-8 text-sm flex-1" value={qualForm} onChange={e => setQualForm(e.target.value)} placeholder="e.g. Pet Styling Certificate" />
                    <Button size="sm" className="h-8" onClick={handleSaveQualification}>Save</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setEditingQualification(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Qualification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-900">{member.qualification || <span className="text-slate-300">-</span>}</span>
                    {canEditQualification && (
                      <button onClick={() => { setQualForm(member.qualification || ''); setEditingQualification(true); }} className="text-slate-400 hover:text-primary">
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin toggle - admin only, disabled for owner */}
            {canEditRole && memberUser && !memberUser.is_owner && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <Label className="text-sm font-medium">Admin Access</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Settings, team management, analytics</p>
                </div>
                <Switch checked={memberUser.is_admin} onCheckedChange={handleToggleAdmin} disabled={savingRole} />
              </div>
            )}
            {memberUser?.is_owner && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <Label className="text-sm font-medium text-amber-800">Owner</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Full admin access. Cannot be revoked.</p>
                </div>
                <Shield className="h-4 w-4 text-amber-600" />
              </div>
            )}

            {/* Documents - self-service upload, admin+self can view */}
            {canManage && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <File className="h-3.5 w-3.5" /> Documents {documents.length > 0 && `(${documents.length})`}
                </p>
                {documents.length === 0 && <p className="text-xs text-slate-400 italic mb-2">No documents</p>}
                <div className="space-y-1.5 mb-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-1.5 rounded-md border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{doc.doc_type}</Badge>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">{doc.file_name}</a>
                      </div>
                      {canDeleteDocuments && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 shrink-0" onClick={() => handleDeleteDoc(doc.id)}><Trash2 className="h-3 w-3" /></Button>
                      )}
                    </div>
                  ))}
                </div>
                {canUploadDocuments && (
                  <div className="flex items-center gap-2">
                    <Input className="h-7 text-xs flex-1" placeholder="Tag (e.g. Certificate, ID)" value={docTag} onChange={e => setDocTag(e.target.value)} />
                    <label className="inline-flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline shrink-0">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingDoc ? 'Uploading...' : 'Upload'}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} disabled={uploadingDoc} />
                    </label>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══ ROW: Tax & Superannuation | Bank Details ═════════════════════ */}
      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Tax & Superannuation (admin-only edits; staff read-only) ── */}
          <Card className="rounded-xl border-slate-200/60 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Tax & Superannuation</CardTitle>
                {currentIsAdmin && !editingTax && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingTax(true)}>
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {editingTax && currentIsAdmin ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">TFN (stored masked)</Label>
                    <Input className="mt-1 h-8 text-xs" value={taxForm.tfn_masked} onChange={e => setTaxForm(f => ({ ...f, tfn_masked: e.target.value }))} placeholder="123 456 789" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Residency</Label>
                      <Select value={taxForm.residency_status} onValueChange={v => setTaxForm(f => ({ ...f, residency_status: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resident">Resident</SelectItem>
                          <SelectItem value="foreign">Foreign resident</SelectItem>
                          <SelectItem value="working_holiday">Working holiday maker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Medicare</Label>
                      <Select value={taxForm.medicare_exemption} onValueChange={v => setTaxForm(f => ({ ...f, medicare_exemption: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Full levy</SelectItem>
                          <SelectItem value="half">Half exemption</SelectItem>
                          <SelectItem value="full">Full exemption</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <Label className="text-xs">Tax-Free Threshold Claimed</Label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Only with one employer at a time</p>
                    </div>
                    <Switch checked={taxForm.tax_free_threshold} onCheckedChange={v => setTaxForm(f => ({ ...f, tax_free_threshold: v }))} />
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div>
                      <Label className="text-xs">Super Fund Name</Label>
                      <Input className="mt-1 h-8 text-xs" value={taxForm.super_fund_name} onChange={e => setTaxForm(f => ({ ...f, super_fund_name: e.target.value }))} placeholder="AustralianSuper" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Member / USI Number</Label>
                        <Input className="mt-1 h-8 text-xs" value={taxForm.super_fund_number} onChange={e => setTaxForm(f => ({ ...f, super_fund_number: e.target.value }))} placeholder="STA0100AU" />
                      </div>
                      <div>
                        <Label className="text-xs">SG Rate (%)</Label>
                        <Input type="number" step="0.1" className="mt-1 h-8 text-xs" value={taxForm.superannuation_rate} onChange={e => setTaxForm(f => ({ ...f, superannuation_rate: e.target.value }))} placeholder="11.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingTax(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveTax} disabled={savingTax} className="bg-primary hover:bg-primary/90 text-primary-foreground">{savingTax ? 'Saving...' : 'Save'}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  <InfoRow label="TFN" value={member.tfn_masked} />
                  <InfoRow label="Tax-Free Threshold" value={member.tax_free_threshold !== false ? 'Claimed' : 'Not claimed'} />
                  <InfoRow label="Residency" value={member.residency_status?.replace('_', ' ')} />
                  <InfoRow label="Medicare" value={member.medicare_exemption === 'none' ? 'Full levy' : member.medicare_exemption} />
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Superannuation</p>
                  </div>
                  <InfoRow label="Fund Name" value={member.super_fund_name} />
                  <InfoRow label="Member / USI" value={member.super_fund_number} />
                  <InfoRow label="SG Rate" value={member.superannuation_rate != null ? `${member.superannuation_rate}%` : '11.5%'} />
                  {!member.super_fund_name && currentIsAdmin && (
                    <p className="text-xs text-slate-400 mt-2 italic">Super fund not configured</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Bank Details (self or admin editable) ── */}
          <Card className="rounded-xl border-slate-200/60 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Bank Details</CardTitle>
                {canManage && !editingBank && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingBank(true)}>
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {editingBank ? (
                <div className="space-y-3">
                  <div><Label className="text-xs">BSB</Label><Input className="mt-1 h-8 text-sm" value={bankForm.bank_bsb} onChange={e => setBankForm(f => ({ ...f, bank_bsb: e.target.value }))} placeholder="062-000" /></div>
                  <div><Label className="text-xs">Account Number</Label><Input className="mt-1 h-8 text-sm" value={bankForm.bank_account_number} onChange={e => setBankForm(f => ({ ...f, bank_account_number: e.target.value }))} placeholder="1234 5678" /></div>
                  <div><Label className="text-xs">Account Name</Label><Input className="mt-1 h-8 text-sm" value={bankForm.bank_account_name} onChange={e => setBankForm(f => ({ ...f, bank_account_name: e.target.value }))} placeholder="Full name as on bank account" /></div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingBank(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveBank} disabled={savingBank}>{savingBank ? 'Saving...' : 'Save'}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  <InfoRow label="BSB" value={member.bank_bsb} />
                  <InfoRow label="Account" value={member.bank_account_number ? (isSelf ? member.bank_account_number : `****${member.bank_account_number.slice(-4)}`) : null} />
                  <InfoRow label="Account Name" value={member.bank_account_name} />
                  {!member.bank_bsb && isSelf && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Please add your bank details for payroll</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Payslip History (staff self-service) ── */}
      {isSelf && payslips.length > 0 && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> My Payslips
              <span className="text-xs text-slate-400 font-normal">({payslips.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Pay Period</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">PAYG</TableHead>
                  <TableHead className="text-right">Super</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 text-sm">{s.period_start} → {s.period_end}</TableCell>
                    <TableCell className="text-right text-sm">{formatPrice(s.gross_pay, currency)}</TableCell>
                    <TableCell className="text-right text-sm text-red-600">{formatPrice(s.payg_withholding || 0, currency)}</TableCell>
                    <TableCell className="text-right text-sm text-slate-600">{formatPrice(s.super_amount, currency)}</TableCell>
                    <TableCell className="text-right text-sm font-bold">{formatPrice(s.net_pay, currency)}</TableCell>
                    <TableCell className="pr-6">
                      <Badge className={`rounded-full text-xs ${s.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{s.payment_status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ══ ROW 4: Working Hours + Service Capabilities ════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Working Hours ── */}
        {canEditWorkingHours && (
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Working Hours
                {isSelf && !currentIsAdmin && <Badge className="rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">My Schedule</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-3">Default weekly schedule. Slots during your break are protected from bookings.</p>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map(d => {
                  const row = schedule[d.idx] || {};
                  return (
                    <div key={d.idx} className={`p-2 rounded-md border ${row.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="grid grid-cols-[44px_56px_1fr_1fr] gap-2 items-center">
                        <span className="text-xs font-medium text-slate-700">{d.label}</span>
                        <Button variant={row.enabled ? 'default' : 'outline'} size="sm" className={`h-7 text-[10px] px-1 ${row.enabled ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => setSchedule(s => ({ ...s, [d.idx]: { ...s[d.idx], enabled: !s[d.idx]?.enabled } }))}>
                          {row.enabled ? <CheckIcon className="h-3 w-3" /> : 'Off'}
                        </Button>
                        <Input type="time" value={row.start || ''} disabled={!row.enabled} onChange={e => setSchedule(s => ({ ...s, [d.idx]: { ...s[d.idx], start: e.target.value } }))} className="h-7 text-xs" />
                        <Input type="time" value={row.end || ''} disabled={!row.enabled} onChange={e => setSchedule(s => ({ ...s, [d.idx]: { ...s[d.idx], end: e.target.value } }))} className="h-7 text-xs" />
                      </div>
                      {row.enabled && (
                        <div className="grid grid-cols-[44px_56px_1fr_1fr] gap-2 items-center mt-1.5">
                          <span className="text-[10px] text-slate-400">Break</span><span />
                          <Input type="time" value={row.break_start || ''} onChange={e => setSchedule(s => ({ ...s, [d.idx]: { ...s[d.idx], break_start: e.target.value } }))} className="h-7 text-xs" />
                          <Input type="time" value={row.break_end || ''} onChange={e => setSchedule(s => ({ ...s, [d.idx]: { ...s[d.idx], break_end: e.target.value } }))} className="h-7 text-xs" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveSchedule} disabled={savingSchedule} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {savingSchedule ? 'Saving...' : 'Save Working Hours'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Service Capabilities ── */}
        <Card className="rounded-xl border-slate-200/60 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Scissors className="h-4 w-4 text-primary" /> Service Capabilities
                {savedCapabilityIds.length > 0 && <span className="text-xs text-slate-400 font-normal">({savedCapabilityIds.length}/{allServices.length})</span>}
              </CardTitle>
              {canEditCapabilities && allServices.length > 0 && !editingCapabilities && (
                <Button variant="outline" size="sm" onClick={() => setEditingCapabilities(true)} className="h-8"><Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-xs text-slate-500 mb-3">Services this groomer is qualified to perform. The booking engine only allocates to capable groomers.</p>
            {allServices.length === 0 ? (
              <p className="text-sm text-slate-400 italic flex-1 flex items-center justify-center">No services configured yet</p>
            ) : (
              <>
                <div className="grid gap-3 flex-1 content-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {allServices.map(s => {
                    const checked = capabilityIds.includes(s.id);
                    if (!editingCapabilities && !checked) return null;
                    const interactive = editingCapabilities;
                    return (
                      <button key={s.id} type="button" onClick={interactive ? () => toggleCapability(s.id) : undefined} disabled={!interactive}
                        className={`relative text-left rounded-xl border transition-all ${checked ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'} ${interactive ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}>
                        {checked && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"><CheckIcon className="h-3 w-3" /></div>}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-2.5 h-8 rounded-full shrink-0" style={{ backgroundColor: s.color || '#2563EB' }} />
                            <div className="min-w-0 flex-1 pr-6">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">{s.name}</h3>
                              {s.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration_minutes} min</span>
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{s.price}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!editingCapabilities && savedCapabilityIds.length === 0 && (
                  <p className="text-xs text-slate-400 italic mt-2 text-center">No capabilities assigned. Click <strong>Edit</strong> to set them.</p>
                )}
                {editingCapabilities && (
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelCapability} disabled={savingCapability}>Cancel</Button>
                    <Button onClick={handleSaveCapability} disabled={savingCapability} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">{savingCapability ? 'Saving...' : 'Save Capabilities'}</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══ ROW 5: Recent Appointments (full-width) ═══════════════════════ */}
      <Card className="rounded-xl border-slate-200/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Appointments
              {appointments.length > 0 && <span className="text-xs text-slate-400 font-normal">({appointments.length})</span>}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate(`/dashboard/appointments?staff_id=${memberId}`)}>
              View All <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">No appointments in this period</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date / Time</TableHead>
                    <TableHead>Pet / Client</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Amount</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.slice(apptPage * APPTS_PER_PAGE, (apptPage + 1) * APPTS_PER_PAGE).map(a => {
                    const start = a.start_time ? parseISO(a.start_time) : null;
                    const end = a.end_time ? parseISO(a.end_time) : null;
                    return (
                      <TableRow key={a.id} className="cursor-pointer hover:bg-slate-50/60" onClick={() => navigate(`/dashboard/appointments/${a.id}/detail`)}>
                        <TableCell className="pl-6">
                          {start && <p className="text-sm font-medium text-slate-900">{format(start, 'MMM d, yyyy')}</p>}
                          {start && end && <p className="text-xs text-slate-500">{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</p>}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{a.pet?.name || a.client?.full_name || a.client?.full_name || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-500">{a.service?.name || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-right">
                          {a.receipt_total != null ? (
                            <span className="text-green-700 font-medium">{formatPrice(a.receipt_total, currency)}</span>
                          ) : a.payment_amount ? (
                            <span className="text-slate-400">{formatPrice(a.payment_amount, currency)}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Badge className={`rounded-full text-xs capitalize ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-600'}`}>{a.status?.replace('_', ' ')}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing {apptPage * APPTS_PER_PAGE + 1}–{Math.min((apptPage + 1) * APPTS_PER_PAGE, appointments.length)} of {appointments.length}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setApptPage(p => Math.max(0, p - 1))} disabled={apptPage === 0}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="px-2 tabular-nums">{apptPage + 1} / {totalPages}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setApptPage(p => Math.min(totalPages - 1, p + 1))} disabled={apptPage >= totalPages - 1}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5 text-right max-w-[60%]">
        {icon}
        {value || <span className="text-slate-300">-</span>}
      </span>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className={`rounded-lg p-4 text-center ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1">{label}</p>
    </div>
  );
}
