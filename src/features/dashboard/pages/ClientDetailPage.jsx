import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/assets';
import AuAddressForm from '@/shared/components/AuAddressForm';
import { formatFullAddress } from '@/shared/lib/auAddress';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import {
  ArrowLeft, User, Calendar, PawPrint,
  Phone, Mail, MapPin, Plus, TrendingUp, Clock, Receipt, Edit2, DollarSign, Star, CalendarClock,
  MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatPrice } from '@/shared/lib/currency';
import { listItems } from '@/shared/lib/listResponse';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Hamster', 'Other'];

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [currency, setCurrency] = useState('AUD');
  const [loading, setLoading] = useState(true);
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const [petForm, setPetForm] = useState({ name: '', species: '', breed: '', gender: '', date_of_birth: '', weight: '', color: '', special_notes: '' });
  const [financials, setFinancials] = useState(null);
  const [financialsLoading, setFinancialsLoading] = useState(false);

  // Communications
  const [communications, setCommunications] = useState([]);
  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [commForm, setCommForm] = useState({ channel: 'sms', recipient: '', subject: '', body: '' });
  const [savingComm, setSavingComm] = useState(false);

  // Edit client dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingClient, setSavingClient] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [clientRes, petsRes, apptsRes, tenantRes, commsRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/clients/${clientId}/pets`, { params: { limit: 200 } }),
        api.get(`/clients/${clientId}/appointments`, { params: { limit: 200 } }),
        api.get('/tenant/me'),
        api.get('/communications', { params: { client_id: clientId, limit: 50 } }).catch(() => ({ data: [] })),
      ]);
      setClient(clientRes.data);
      setPets(listItems(petsRes.data));
      setAppointments(listItems(apptsRes.data));
      setCurrency(tenantRes.data.settings?.currency || 'AUD');
      setCommunications(Array.isArray(commsRes.data) ? commsRes.data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [clientId]);

  const fetchFinancials = useCallback(async () => {
    setFinancialsLoading(true);
    try {
      const res = await api.get(`/clients/${clientId}/financials`);
      setFinancials(res.data);
    } catch (e) { console.error(e); }
    setFinancialsLoading(false);
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Eagerly load financials for accurate Outstanding Balance KPI
  useEffect(() => { fetchFinancials(); }, [fetchFinancials]);

  const handleAddPet = async () => {
    if (!petForm.name) {
      toast.error('Pet name is required');
      return;
    }
    try {
      // Drop empty fields - the API rejects '' for typed fields like
      // weight (float) and date_of_birth (date). The schema field for
      // notes is `notes`, not `special_notes`.
      const payload = { owner_id: clientId };
      Object.entries(petForm).forEach(([k, v]) => {
        if (v === '' || v == null) return;
        payload[k === 'special_notes' ? 'notes' : k] = v;
      });
      if (payload.weight) payload.weight = parseFloat(payload.weight);
      await api.post('/pets', payload);
      toast.success(`${petForm.name} added`);
      setPetDialogOpen(false);
      setPetForm({ name: '', species: '', breed: '', gender: '', date_of_birth: '', weight: '', color: '', special_notes: '' });
      fetchData();
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to add pet');
    }
  };

  const handleLogCommunication = async () => {
    setSavingComm(true);
    try {
      await api.post('/communications', {
        client_id: clientId,
        channel: commForm.channel,
        recipient: commForm.recipient || null,
        subject: commForm.subject || null,
        body: commForm.body || null,
      });
      setCommDialogOpen(false);
      setCommForm({ channel: 'sms', recipient: '', subject: '', body: '' });
      fetchData();
    } catch (e) { console.error(e); }
    setSavingComm(false);
  };

  const openEditClient = async () => {
    try {
      const res = await api.get(`/clients/${clientId}`);
      const c = res.data;
      setEditForm({
        full_name: c.full_name || '',
        email: c.email || '',
        phone: c.phone || '',
        alternative_phone: c.alternative_phone || '',
        unit: c.unit || '',
        address: c.address || '',
        postcode: c.postcode || '',
        suburb: c.suburb || '',
        state: c.state || '',
        preferred_contact: c.preferred_contact || '',
        value_flag: c.value_flag || '',
        reliability_flag: c.reliability_flag ?? false,
        is_new_client: c.is_new_client ?? false,
        marketing_opt_in: c.marketing_opt_in ?? false,
        rebooking_due_date: c.rebooking_due_date || '',
        notes: c.notes || '',
        internal_notes: c.internal_notes || '',
      });
      setEditDialogOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleSaveClient = async () => {
    setSavingClient(true);
    try {
      const cleanValueFlag = (!editForm.value_flag || editForm.value_flag === 'none') ? null : editForm.value_flag;
      const cleanPreferredContact = (!editForm.preferred_contact || editForm.preferred_contact === 'none') ? null : editForm.preferred_contact;
      await api.put(`/clients/${clientId}`, {
        full_name: editForm.full_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        alternative_phone: editForm.alternative_phone || null,
        unit: editForm.unit || null,
        address: editForm.address || null,
        postcode: editForm.postcode || null,
        suburb: editForm.suburb || null,
        state: editForm.state || null,
        preferred_contact: cleanPreferredContact,
        value_flag: cleanValueFlag,
        reliability_flag: editForm.reliability_flag,
        is_new_client: editForm.is_new_client,
        marketing_opt_in: editForm.marketing_opt_in,
        rebooking_due_date: editForm.rebooking_due_date || null,
        notes: editForm.notes || null,
        internal_notes: editForm.internal_notes || null,
      });
      setEditDialogOpen(false);
      fetchData();
    } catch (e) { console.error(e); }
    setSavingClient(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Client not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/clients')} className="mt-4">Back to Clients</Button>
      </div>
    );
  }

  const statusColor = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    checked_in: 'bg-teal-100 text-teal-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-yellow-100 text-yellow-700',
    receipt_generated: 'bg-violet-100 text-violet-700',
  };

  // ── Business metrics ──────────────────────────────────────────────────────
  // GROUND TRUTH: amounts come from ServiceReceipt (actual invoiced) via the
  // /financials endpoint, NOT from appointment.payment_amount (booking estimate).
  // The payment_amount is only used as a fallback label when no receipt exists.
  const completedAppts = appointments.filter(a => ['completed', 'receipt_generated'].includes(a.status));
  const lastVisit = completedAppts.length > 0
    ? completedAppts.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))[0]
    : null;

  // Total Spend = sum of actual receipt totals (from financials endpoint)
  const totalSpend = financials ? financials.total_spend : 0;

  // Outstanding = receipts marked pending + completed appointments without a receipt yet
  const receiptOutstanding = financials ? financials.outstanding_balance : 0;
  const unreceipted = appointments
    .filter(a => a.status === 'completed' && !a.receipt_total && a.receipt_total !== 0)
    .reduce((sum, a) => sum + (parseFloat(a.payment_amount) || 0), 0);
  const outstandingBalance = receiptOutstanding + unreceipted;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-700">
                {client.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{client.full_name}</h1>
                  {client.value_flag === 'vip' && (
                    <Badge className="rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                      <Star className="h-3 w-3 mr-1" />VIP
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-0.5">
                  {client.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {client.phone}</span>}
                  {client.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {client.email}</span>}
                  {(client.address || client.suburb) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {formatFullAddress(client)}
                    </span>
                  )}
                  {client.preferred_contact && (
                    <Badge variant="outline" className="rounded-full text-xs">Prefers {client.preferred_contact}</Badge>
                  )}
                </div>
                {client.rebooking_due_date && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" /> Rebooking due: {format(parseISO(client.rebooking_due_date), 'MMM d, yyyy')}
                  </p>
                )}
                {client.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic">{client.notes}</p>
                )}
              </div>
            </div>
            <div className="sm:ml-auto flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate(`/dashboard/appointments/new?client_id=${clientId}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                <Calendar className="h-4 w-4 mr-1.5" /> Book Appointment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPetDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Pet
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openEditClient}
              >
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <PawPrint className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600">{pets.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pets</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{appointments.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Appointments</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <Receipt className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{formatPrice(totalSpend, currency)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Spend</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-violet-500" />
            <p className="text-sm font-bold text-violet-600">
              {lastVisit ? format(parseISO(lastVisit.start_time), 'MMM d') : '-'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Last Visit</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{formatPrice(outstandingBalance, currency)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Outstanding Balance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pets">
        <TabsList>
          <TabsTrigger value="pets" className="gap-1.5"><PawPrint className="h-4 w-4" /> Pets ({pets.length})</TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5"><Calendar className="h-4 w-4" /> Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5" onClick={() => { if (!financials) fetchFinancials(); }}><DollarSign className="h-4 w-4" /> Financial</TabsTrigger>
          <TabsTrigger value="communications" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Communications ({communications.length})</TabsTrigger>
        </TabsList>

        {/* Pets Tab */}
        <TabsContent value="pets">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.length === 0 ? (
              <Card className="rounded-xl border-slate-200/60 col-span-full">
                <CardContent className="py-12 text-center text-slate-400">
                  <PawPrint className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No pets registered for this client</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setPetDialogOpen(true)}>Add First Pet</Button>
                </CardContent>
              </Card>
            ) : pets.map(pet => (
              <Card
                key={pet.id}
                className="rounded-xl border-slate-200/60 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/dashboard/pets/${pet.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {pet.photo_url ? (
                      <img src={assetUrl(pet.photo_url)} alt={pet.name} className="w-12 h-12 rounded-full object-cover border" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <PawPrint className="h-5 w-5 text-amber-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{pet.name}</h4>
                      <p className="text-xs text-slate-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    {pet.gender && <p><span className="text-slate-400">Gender:</span> <span className="capitalize">{pet.gender}</span></p>}
                    {pet.weight && <p><span className="text-slate-400">Weight:</span> {pet.weight} kg</p>}
                    {pet.color && <p><span className="text-slate-400">Color:</span> {pet.color}</p>}
                    {(pet.special_notes || pet.notes) && <p className="text-slate-400 italic mt-2">{pet.special_notes || pet.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden md:table-cell">Groomer</TableHead>
                    <TableHead className="hidden lg:table-cell">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No appointments found</TableCell></TableRow>
                  ) : appointments
                      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
                      .map(a => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => navigate(`/dashboard/appointments/${a.id}/detail`)}
                    >
                      <TableCell className="text-sm">{format(parseISO(a.start_time), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell className="text-sm">{a.pet?.name || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{a.service?.name || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{a.staff?.full_name || a.doctor?.full_name || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {a.receipt_total != null ? (
                          <span className="text-green-700 font-medium">{formatPrice(a.receipt_total, currency)}</span>
                        ) : a.payment_amount ? (
                          <span className="text-slate-500">{formatPrice(a.payment_amount, currency)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full text-xs ${statusColor[a.status] || 'bg-slate-100 text-slate-600'}`}>
                          {a.status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          {financialsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : financials ? (
            <div className="space-y-4">
              {/* Invoice History Table - tiles removed (redundant with KPI strip above) */}
              <Card className="rounded-xl border-slate-200/60">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Invoice History ({financials.invoice_count})</CardTitle>
                  {financials.last_payment && (
                    <p className="text-xs text-slate-500">
                      Last paid: {formatPrice(financials.last_payment.amount, currency)}
                      {financials.last_payment.date ? ` on ${format(parseISO(financials.last_payment.date), 'MMM d, yyyy')}` : ''}
                      {financials.last_payment.method ? ` via ${financials.last_payment.method}` : ''}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Appointment Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Tax</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Discount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Method</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financials.invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-400">No invoices found</TableCell>
                        </TableRow>
                      ) : financials.invoices.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="text-sm font-medium">{inv.receipt_number}</TableCell>
                          <TableCell className="text-sm">{inv.appointment_date ? format(parseISO(inv.appointment_date), 'MMM d, yyyy') : '--'}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{formatPrice(inv.total, currency)}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-right">{formatPrice(inv.tax_amount, currency)}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-right">{formatPrice(inv.discount_amount, currency)}</TableCell>
                          <TableCell>
                            <Badge className={`rounded-full text-xs ${inv.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {inv.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm capitalize">{inv.payment_method || '--'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {inv.appointment_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={() => navigate(`/dashboard/appointments/${inv.appointment_id}/receipt`)}
                                >
                                  View Receipt
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="py-12 text-center text-slate-400">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Click the Financial tab to load invoice data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Communication History</CardTitle>
              <Button size="sm" onClick={() => setCommDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Log Communication
              </Button>
            </CardHeader>
            <CardContent>
              {communications.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No communication history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communications.map(comm => {
                    const ChannelIcon = comm.channel === 'call' ? Phone : comm.channel === 'email' ? Mail : MessageSquare;
                    const channelColor = comm.channel === 'call' ? 'text-green-600 bg-green-50' : comm.channel === 'email' ? 'text-blue-600 bg-blue-50' : 'text-violet-600 bg-violet-50';
                    const statusColor = comm.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : comm.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
                    return (
                      <div key={comm.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${channelColor}`}>
                          <ChannelIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-900 capitalize">{comm.channel}</span>
                            <Badge className={`rounded-full text-xs ${statusColor}`}>{comm.status}</Badge>
                            {comm.direction && (
                              <span className="text-xs text-slate-400 capitalize">{comm.direction}</span>
                            )}
                          </div>
                          {comm.subject && (
                            <p className="text-sm font-medium text-slate-700 mt-1">{comm.subject}</p>
                          )}
                          {comm.body && (
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{comm.body}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            {comm.sent_at && <span>{format(parseISO(comm.sent_at), 'MMM d, yyyy h:mm a')}</span>}
                            {comm.staff_name && <span>by {comm.staff_name}</span>}
                            {comm.recipient && <span>to {comm.recipient}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Communication Dialog */}
      <Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Channel</Label>
              <Select value={commForm.channel} onValueChange={v => setCommForm({ ...commForm, channel: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipient</Label>
              <Input value={commForm.recipient} onChange={e => setCommForm({ ...commForm, recipient: e.target.value })} placeholder="Phone number or email" className="mt-1.5" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={commForm.subject} onChange={e => setCommForm({ ...commForm, subject: e.target.value })} placeholder="Subject line" className="mt-1.5" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={commForm.body} onChange={e => setCommForm({ ...commForm, body: e.target.value })} placeholder="Message content or call notes..." rows={4} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogCommunication} disabled={savingComm || !commForm.channel} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {savingComm ? 'Saving...' : 'Log Communication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pet Dialog */}
      <Dialog open={petDialogOpen} onOpenChange={setPetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pet for {client.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Pet Name *</Label>
              <Input value={petForm.name} onChange={e => setPetForm({ ...petForm, name: e.target.value })} placeholder="Buddy" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Species</Label>
                <Select value={petForm.species} onValueChange={v => setPetForm({ ...petForm, species: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed</Label>
                <Input value={petForm.breed} onChange={e => setPetForm({ ...petForm, breed: e.target.value })} placeholder="Golden Retriever" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender</Label>
                <Select value={petForm.gender} onValueChange={v => setPetForm({ ...petForm, gender: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="desexed">Desexed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={petForm.date_of_birth} onChange={e => setPetForm({ ...petForm, date_of_birth: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={petForm.weight} onChange={e => setPetForm({ ...petForm, weight: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={petForm.color} onChange={e => setPetForm({ ...petForm, color: e.target.value })} placeholder="Golden" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Special Notes</Label>
              <Input value={petForm.special_notes} onChange={e => setPetForm({ ...petForm, special_notes: e.target.value })} placeholder="Sensitive skin, anxious around strangers, etc." className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPet} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Add Pet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Info</h3>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Alternative Phone</Label>
                    <Input value={editForm.alternative_phone || ''} onChange={e => setEditForm({ ...editForm, alternative_phone: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Preferred Contact</Label>
                    <Select value={editForm.preferred_contact || ''} onValueChange={v => setEditForm({ ...editForm, preferred_contact: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Australian structured address, inline with the rest of the form */}
                <AuAddressForm
                  value={editForm}
                  onChange={({ latitude, longitude, ...patch }) => setEditForm(f => ({ ...f, ...patch }))}
                  showUnit
                  unitLabel="Unit / flat / building (optional)"
                />
              </div>
            </div>

            {/* Flags */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Flags</h3>
              <div className="space-y-4">
                <div>
                  <Label>Value Flag</Label>
                  <Select value={editForm.value_flag || ''} onValueChange={v => setEditForm({ ...editForm, value_flag: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Reliable Client</Label>
                  <Switch checked={editForm.reliability_flag ?? false} onCheckedChange={v => setEditForm({ ...editForm, reliability_flag: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>New Client</Label>
                  <Switch checked={editForm.is_new_client ?? false} onCheckedChange={v => setEditForm({ ...editForm, is_new_client: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Marketing Opt-in</Label>
                  <Switch checked={editForm.marketing_opt_in ?? false} onCheckedChange={v => setEditForm({ ...editForm, marketing_opt_in: v })} />
                </div>
              </div>
            </div>

            {/* Rebooking */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Rebooking</h3>
              <div>
                <Label>Rebooking Due Date</Label>
                <Input type="date" value={editForm.rebooking_due_date || ''} onChange={e => setEditForm({ ...editForm, rebooking_due_date: e.target.value })} className="mt-1.5" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Notes</h3>
              <div className="space-y-4">
                <div>
                  <Label>Client Notes</Label>
                  <Textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Client notes" rows={3} className="mt-1.5" />
                </div>
                <div>
                  <Label>Staff-only Internal Notes</Label>
                  <Textarea value={editForm.internal_notes || ''} onChange={e => setEditForm({ ...editForm, internal_notes: e.target.value })} placeholder="Staff-only internal notes" rows={3} className="mt-1.5" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveClient} disabled={savingClient} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {savingClient ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
