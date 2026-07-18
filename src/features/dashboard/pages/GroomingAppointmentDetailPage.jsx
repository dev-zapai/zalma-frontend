import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import {
  ArrowLeft, Phone, Mail, PawPrint, User, Scissors, Receipt, Image, Star, Plus,
  Trash2, Download, Printer, Check, Clock, AlertCircle, ClipboardList, Edit2, X,
  Share2 as Share2Icon,
} from 'lucide-react';
import TransferToPartnerDialog from '@/shared/components/TransferToPartnerDialog';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatPrice, getCurrencySymbol } from '@/shared/lib/currency';
import { formatInSalonTz, salonTime } from '@/shared/lib/salonTime';
import DownloadReceipt from '@/shared/components/DownloadReceipt';
import { listItems } from '@/shared/lib/listResponse';

// Status workflow configuration
const STATUS_FLOW = [
  { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'checked_in', label: 'Checked In', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'receipt_generated', label: 'Receipt Generated', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'transferred', label: 'Transferred', color: 'bg-violet-100 text-violet-700 border-violet-200' },
];

const STATUS_TRANSITIONS = {
  scheduled: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: ['receipt_generated'],
  receipt_generated: [],
  cancelled: [],
  no_show: [],
};

const BANK_LABELS = {
  commbank: 'CommBank',
  anz: 'ANZ',
  nab: 'NAB',
  westpac: 'Westpac',
};

const NEXT_ACTION = {
  scheduled: { label: 'Check In Client', next: 'checked_in' },
  checked_in: { label: 'Start Service', next: 'in_progress' },
  in_progress: { label: 'Complete Service', next: 'completed' },
  completed: { label: 'Generate Receipt', next: null, tab: 'receipt' },
};

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function GroomingAppointmentDetailPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt] = useState(null);
  const [services, setServices] = useState([]); // available services catalog
  const [staffList, setStaffList] = useState([]); // available staff for groomer change
  const [apptServices, setApptServices] = useState([]); // services added to this appointment
  const [photos, setPhotos] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comments: '' });
  const [notes, setNotes] = useState([]); // grooming notes for this appointment
  const [noteForm, setNoteForm] = useState({
    coat_condition: '', services_performed: '', groomer_notes: '', next_recommended_date: '',
  });
  const [noteEditId, setNoteEditId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [currency, setCurrency] = useState('AUD');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [changingGroomer, setChangingGroomer] = useState(false);
  const [newStaffId, setNewStaffId] = useState('');

  // Previous grooming context (last note + last feedback for this pet)
  const [prevGroomingNote, setPrevGroomingNote] = useState(null);
  const [prevFeedback, setPrevFeedback] = useState(null);
  const [prevContextLoading, setPrevContextLoading] = useState(false);

  // Registration check-in dialog
  const [showRegDialog, setShowRegDialog] = useState(false);
  const [regForm, setRegForm] = useState({ client: {}, pet: {} });
  const [regSaving, setRegSaving] = useState(false);

  // Rebooking prompt dialog
  const [showRebookingDialog, setShowRebookingDialog] = useState(false);
  const [rebookingDate, setRebookingDate] = useState('');
  const [savingRebooking, setSavingRebooking] = useState(false);

  // Reschedule dialog state - keyed off the appointment's existing services
  // so the slot finder uses the same multi-service plan.
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  // Receipt form state
  // discount_type: 'amount' (fixed dollar) | 'percent' (percentage of subtotal)
  // The actual dollar discount sent to the backend is computed from these:
  //   amount mode  → discount_amount as-is
  //   percent mode → subtotal * discount_percent / 100
  //
  // The form is rehydrated from the saved receipt by the useEffect below
  // when the receipt loads, so editing an existing receipt shows the saved
  // values instead of the hard-coded defaults.
  const [receiptForm, setReceiptForm] = useState({
    tax_rate: 0,
    discount_type: 'amount',
    discount_amount: 0,
    discount_percent: 0,
    payment_method: 'cash', payment_status: 'paid', notes: '',
  });

  // Terminal payment flow
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);
  const [terminalProcessing, setTerminalProcessing] = useState(null); // {terminal, status: 'waiting'|'approved'|'declined'}

  // Partner transfer dialog
  const [transferOpen, setTransferOpen] = useState(false);

  // Photo upload
  const photoInputRef = useRef(null);
  const [photoType, setPhotoType] = useState('before');
  const [photoUploading, setPhotoUploading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [apptRes, svcsRes, tenantRes, staffRes, notesRes] = await Promise.all([
        api.get(`/g/appointments/${appointmentId}`),
        api.get('/services', { params: { limit: 200 } }),
        api.get('/tenant/me'),
        api.get('/staff', { params: { limit: 200 } }),
        api.get('/grooming-notes', { params: { appointment_id: appointmentId } }).catch(() => ({ data: [] })),
      ]);
      setAppt(apptRes.data);
      setApptServices(apptRes.data.services_list || []);
      setPhotos(apptRes.data.photos || []);
      setReceipt(apptRes.data.receipt || null);
      if (apptRes.data.feedback) {
        setFeedback({ rating: apptRes.data.feedback.rating || 0, comments: apptRes.data.feedback.comments || '' });
      }
      setServices(listItems(svcsRes.data));
      setStaffList(listItems(staffRes.data));
      setTenant(tenantRes.data);
      setNotes(listItems(notesRes.data));
      const cur = tenantRes.data.settings?.currency || 'AUD';
      setCurrency(cur);
      const taxRate = tenantRes.data.settings?.receipt_config?.tax_rate ?? 0;
      setReceiptForm(f => ({ ...f, tax_rate: taxRate }));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [appointmentId]);

  // Rehydrate the receipt form from a saved receipt so the dialog shows
  // the actual stored values (instead of the hard-coded defaults) when an
  // existing receipt is loaded - including the discount mode, the saved
  // discount % / amount, the tax rate that was used at the time, etc.
  useEffect(() => {
    if (!receipt) return;
    setReceiptForm(f => ({
      ...f,
      tax_rate: receipt.tax_rate ?? f.tax_rate,
      discount_type: (receipt.discount_percent || 0) > 0 ? 'percent' : 'amount',
      discount_amount: receipt.discount_amount ?? 0,
      discount_percent: receipt.discount_percent ?? 0,
      payment_method: receipt.payment_method || f.payment_method,
      payment_status: receipt.payment_status || f.payment_status,
      notes: receipt.notes || '',
    }));
  }, [receipt]);

  const resetNoteForm = () => {
    setNoteEditId(null);
    setNoteForm({ coat_condition: '', services_performed: '', groomer_notes: '', next_recommended_date: '' });
  };

  const handleSaveNote = async () => {
    if (!appt?.pet_id) {
      toast.error('No pet linked to this appointment');
      return;
    }
    setSavingNote(true);
    try {
      const payload = {
        pet_id: appt.pet_id,
        appointment_id: appointmentId,
        staff_id: appt.staff_id || null,
        coat_condition: noteForm.coat_condition || null,
        groomer_notes: noteForm.groomer_notes || null,
        next_recommended_date: noteForm.next_recommended_date || null,
        services_performed: noteForm.services_performed
          ? noteForm.services_performed.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      if (noteEditId) {
        await api.put(`/grooming-notes/${noteEditId}`, payload);
        toast.success('Note updated');
      } else {
        await api.post('/grooming-notes', payload);
        toast.success('Note saved');
      }
      resetNoteForm();
      const notesRes = await api.get('/grooming-notes', { params: { appointment_id: appointmentId } });
      setNotes(listItems(notesRes.data));
    } catch (e) {
      toast.error('Failed to save note');
    }
    setSavingNote(false);
  };

  const handleEditNote = (note) => {
    setNoteEditId(note.id);
    setNoteForm({
      coat_condition: note.coat_condition || '',
      services_performed: (note.services_performed || []).join(', '),
      groomer_notes: note.groomer_notes || '',
      next_recommended_date: note.next_recommended_date || '',
    });
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this grooming note?')) return;
    try {
      await api.delete(`/grooming-notes/${noteId}`);
      toast.success('Note deleted');
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (noteEditId === noteId) resetNoteForm();
    } catch (e) {
      toast.error('Failed to delete note');
    }
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch previous grooming context for this pet - STRICTLY from the
  // immediately previous appointment only. No fallback to older ones.
  //
  // If the last appointment had no notes and no feedback, the context card
  // doesn't render at all - showing stale data from 2+ visits ago is
  // confusing and misleading.
  //
  // Also ignores orphan grooming notes (appointment_id = NULL) that were
  // created from the pet detail page before that capability was removed.
  useEffect(() => {
    if (!appt?.pet_id) return;
    setPrevContextLoading(true);
    setPrevGroomingNote(null);
    setPrevFeedback(null);

    api.get(`/pets/${appt.pet_id}/appointments`, { params: { limit: 10 } })
      .then(async (res) => {
        const items = listItems(res.data);
        // The immediately previous appointment - first one in desc list
        // that isn't the current appointment.
        const prev = items.find(a => a.id !== appointmentId);
        if (!prev) return; // First appointment for this pet - nothing to show.

        // Load the previous appointment's detail (includes feedback) + its
        // grooming notes in parallel.
        const [detailRes, notesRes] = await Promise.all([
          api.get(`/g/appointments/${prev.id}`).catch(() => null),
          api.get('/grooming-notes', {
            params: { appointment_id: prev.id, limit: 5 },
          }).catch(() => ({ data: [] })),
        ]);

        // Feedback - strictly from the previous appointment only
        if (detailRes?.data?.feedback) {
          setPrevFeedback(detailRes.data.feedback);
        }

        // Grooming note - strictly from the previous appointment only
        // (appointment_id must match prev.id, not just "any note for this pet")
        const prevNotes = listItems(notesRes.data);
        if (prevNotes.length > 0) {
          setPrevGroomingNote(prevNotes[0]);
        }
      })
      .catch(() => {})
      .finally(() => setPrevContextLoading(false));
  }, [appt?.pet_id, appointmentId]);

  // ─── Computed receipt totals ───────────────────────────────────────────────
  const subtotal = apptServices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const taxAmount = (subtotal * (parseFloat(receiptForm.tax_rate) || 0)) / 100;
  // Discount source-of-truth = computed dollar value. For percent mode we
  // derive it from `subtotal * percent / 100`; for amount mode we use the
  // fixed value entered. Both modes are sent to the backend together so
  // receipts can later be re-displayed with their original intent.
  const discountPercent = parseFloat(receiptForm.discount_percent) || 0;
  const discountAmount = receiptForm.discount_type === 'percent'
    ? Math.round((subtotal * discountPercent) / 100 * 100) / 100
    : parseFloat(receiptForm.discount_amount) || 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  // ─── Check if registration is pending ──────────────────────────────────────
  const clientPending = appt?.client?.registration_status === 'pending';
  const petPending = appt?.pet && !appt.pet.breed && !appt.pet.weight;

  const handleCheckIn = () => {
    if (clientPending || petPending) {
      // Pre-fill form with existing data
      setRegForm({
        client: {
          email: appt.client?.email || '',
          phone: appt.client?.phone || '',
          address: appt.client?.address || '',
          notes: appt.client?.notes || '',
        },
        pet: {
          breed: appt.pet?.breed || '',
          weight: appt.pet?.weight || '',
          gender: appt.pet?.gender || '',
          color: appt.pet?.color || '',
          notes: appt.pet?.notes || '',
        },
      });
      setShowRegDialog(true);
    } else {
      updateStatus('checked_in');
    }
  };

  const handleSaveRegistration = async () => {
    setRegSaving(true);
    try {
      // Update client if pending
      if (clientPending && appt.client?.id) {
        await api.put(`/clients/${appt.client.id}`, {
          ...regForm.client,
          registration_status: 'registered',
        });
      }
      // Update pet if pending
      if (petPending && appt.pet?.id) {
        await api.put(`/pets/${appt.pet.id}`, regForm.pet);
      }
      // Now check in
      const res = await api.put(`/g/appointments/${appointmentId}`, { status: 'checked_in' });
      setAppt(res.data);
      setShowRegDialog(false);
      toast.success('Registration completed & checked in');
      fetchAll(); // Re-fetch to get updated data
    } catch (e) {
      toast.error('Failed to save registration');
    }
    setRegSaving(false);
  };

  const handleSkipRegistration = async () => {
    setShowRegDialog(false);
    await updateStatus('checked_in');
  };

  // ─── Status update ─────────────────────────────────────────────────────────
  const updateStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.put(`/g/appointments/${appointmentId}`, { status: newStatus });
      setAppt(res.data);
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'completed') setActiveTab('receipt');
      // Show rebooking prompt if backend indicates it
      if (res.data.show_rebooking_prompt) {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        setRebookingDate(d.toISOString().slice(0, 10));
        setShowRebookingDialog(true);
      }
    } catch (e) { toast.error('Failed to update status'); }
    setStatusUpdating(false);
  };

  const handleSaveRebooking = async () => {
    if (!rebookingDate || !appt?.client_id) return;
    setSavingRebooking(true);
    try {
      await api.put(`/clients/${appt.client_id}`, { rebooking_due_date: rebookingDate });
      toast.success('Rebooking date saved');
      setShowRebookingDialog(false);
    } catch (e) {
      toast.error('Failed to save rebooking date');
    }
    setSavingRebooking(false);
  };

  // ─── Add service to appointment ───────────────────────────────────────────
  const [addServiceId, setAddServiceId] = useState('');
  const [addStaffId, setAddStaffId] = useState('');
  const [addQty, setAddQty] = useState(1);

  // Default addStaffId to the appointment's primary staff when loaded
  useEffect(() => {
    if (appt?.staff_id && !addStaffId) setAddStaffId(appt.staff_id);
  }, [appt?.staff_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddService = async () => {
    if (!addServiceId) return;
    const svc = services.find(s => s.id === addServiceId);
    if (!svc) return;
    try {
      const item = {
        service_id: svc.id,
        staff_id: addStaffId || appt?.staff_id || null,
        name: svc.name,
        duration_minutes: svc.duration_minutes,
        unit_price: parseFloat(svc.price),
        quantity: addQty,
        total: parseFloat(svc.price) * addQty,
      };
      const res = await api.post(`/g/appointments/${appointmentId}/services`, item);
      setApptServices(prev => [...prev, res.data]);
      setAddServiceId('');
      setAddQty(1);
      toast.success('Service added');
    } catch (e) { toast.error('Failed to add service'); }
  };

  const handleRemoveService = async (serviceItemId) => {
    try {
      await api.delete(`/g/appointments/${appointmentId}/services/${serviceItemId}`);
      setApptServices(prev => prev.filter(s => s.id !== serviceItemId));
      toast.success('Service removed');
    } catch (e) { toast.error('Failed to remove service'); }
  };

  // ─── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(
        `/g/appointments/${appointmentId}/photos?photo_type=${photoType}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPhotos(prev => [...prev, res.data]);
      toast.success('Photo uploaded');
    } catch (e) { toast.error('Failed to upload photo'); }
    setPhotoUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await api.delete(`/g/appointments/${appointmentId}/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Photo deleted');
    } catch (e) { toast.error('Failed to delete photo'); }
  };

  // ─── Generate receipt ──────────────────────────────────────────────────────
  // `terminal` (optional) - when payment was taken on an EFTPOS terminal, we
  // tag the receipt with the bank + terminal id so the audit trail is clear.
  const handleGenerateReceipt = async (terminal = null) => {
    try {
      const pmLabel = terminal
        ? `terminal:${terminal.bank}:${terminal.terminal_id}`
        : receiptForm.payment_method;
      const terminalNote = terminal
        ? `Paid via ${BANK_LABELS[terminal.bank] || terminal.bank} terminal "${terminal.label}" (TID ${terminal.terminal_id}${terminal.merchant_id ? `, MID ${terminal.merchant_id}` : ''}).`
        : '';
      const combinedNotes = [receiptForm.notes, terminalNote].filter(Boolean).join(' ');
      const payload = {
        subtotal,
        tax_rate: parseFloat(receiptForm.tax_rate) || 0,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        discount_percent: receiptForm.discount_type === 'percent' ? discountPercent : 0,
        total: grandTotal,
        currency,
        payment_method: pmLabel,
        payment_status: receiptForm.payment_status,
        notes: combinedNotes,
      };
      const res = await api.post(`/g/appointments/${appointmentId}/receipt`, payload);
      setReceipt(res.data);
      setAppt(prev => ({ ...prev, status: 'receipt_generated' }));
      toast.success(`Receipt ${res.data.receipt_number} generated!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate receipt');
    }
  };

  // Entry point from the "Generate Receipt" button. If staff chose Terminal,
  // open the terminal picker - otherwise go straight to receipt.
  const onClickGenerateReceipt = () => {
    if (receiptForm.payment_method === 'terminal') {
      const active = (tenant?.settings?.payment_terminals || []).filter(t => t.active !== false);
      if (active.length === 0) {
        toast.error('No active payment terminals configured. Ask an admin to add one in Settings.');
        return;
      }
      setShowTerminalPicker(true);
      return;
    }
    handleGenerateReceipt();
  };

  // ─── Reschedule ────────────────────────────────────────────────────────────
  // When the dialog opens (or the date changes) call /multi-auto-slots so
  // the user can pick a new time. Saving issues a single PUT to update the
  // appointment's start/end + per-service start/end stay proportional.
  useEffect(() => {
    if (!rescheduleOpen || !rescheduleDate || !apptServices.length) {
      setRescheduleSlots([]);
      return;
    }
    const ids = apptServices.map(s => s.service_id).filter(Boolean).join(',');
    if (!ids) return;
    setRescheduleLoading(true);
    setRescheduleSlot(null);
    api.get('/g/appointments/multi-auto-slots', {
      params: { date: rescheduleDate, service_ids: ids },
    }).then(res => setRescheduleSlots(res.data || []))
      .catch(() => setRescheduleSlots([]))
      .finally(() => setRescheduleLoading(false));
  }, [rescheduleOpen, rescheduleDate, apptServices]);

  const handleReschedule = async () => {
    if (!rescheduleSlot) return;
    setRescheduling(true);
    try {
      // Build the new date+time as an ISO datetime in the client's local TZ
      // (the backend stores tz-naive, so this matches how new bookings are
      // ingested by /multi-book).
      const start = new Date(`${rescheduleDate}T${rescheduleSlot.start_time}`);
      const end = new Date(`${rescheduleDate}T${rescheduleSlot.end_time}`);
      await api.put(`/g/appointments/${appointmentId}`, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        // Bump status back to scheduled in case the appointment was already
        // marked as a no-show / cancelled (rescheduling implies it's live again).
        status: 'scheduled',
      });
      // Re-fetch so the appointment header + service rows reflect the new time.
      await fetchAll();
      setRescheduleOpen(false);
      setRescheduleSlot(null);
      toast.success('Appointment rescheduled');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to reschedule');
    }
    setRescheduling(false);
  };

  // ─── Change groomer ────────────────────────────────────────────────────────
  const handleChangeGroomer = async () => {
    if (!newStaffId) return;
    try {
      const res = await api.put(`/g/appointments/${appointmentId}`, { staff_id: newStaffId });
      setAppt(res.data);
      setChangingGroomer(false);
      setNewStaffId('');
      toast.success('Groomer updated');
    } catch (e) { toast.error('Failed to update groomer'); }
  };

  // ─── Save feedback ─────────────────────────────────────────────────────────
  const handleSaveFeedback = async () => {
    try {
      await api.post(`/g/appointments/${appointmentId}/feedback`, {
        rating: feedback.rating,
        comments: feedback.comments,
      });
      toast.success('Feedback saved');
    } catch (e) { toast.error('Failed to save feedback'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Appointment not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/appointments')}>
          Back to Appointments
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_FLOW.find(s => s.key === appt.status);
  const nextAction = NEXT_ACTION[appt.status];
  const statusIdx = STATUS_FLOW.findIndex(s => s.key === appt.status);

  // ── Check-in time-lock ─────────────────────────────────────────────────
  // Real-world rule: a client can't be checked in earlier than 15 minutes
  // before their booked slot starts. Anything earlier than that, the staff
  // should reschedule the appointment instead of fudging the timeline.
  const apptStartMs = appt.start_time ? parseISO(appt.start_time).getTime() : 0;
  const minutesUntilStart = apptStartMs ? (apptStartMs - Date.now()) / 60000 : 0;
  const checkInUnlocked = minutesUntilStart <= 15;
  const isScheduled = appt.status === 'scheduled';
  const checkInBlocked = isScheduled && !checkInUnlocked && nextAction?.next === 'checked_in';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/appointments')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              Appointment #{appt.id?.slice(-6).toUpperCase()}
            </h1>
            {statusInfo && (
              <Badge className={`rounded-full text-xs border ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {appt.start_time ? formatInSalonTz(appt.start_time, tenant?.timezone, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
          </p>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {nextAction && nextAction.next && (
            <Button
              onClick={() => nextAction.next === 'checked_in' ? handleCheckIn() : updateStatus(nextAction.next)}
              disabled={statusUpdating || checkInBlocked}
              title={checkInBlocked ? 'Check-in opens 15 minutes before the booked slot' : ''}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
            >
              <Check className="h-4 w-4 mr-1.5" /> {nextAction.label}
            </Button>
          )}
          {nextAction && !nextAction.next && (
            <Button
              onClick={() => setActiveTab('receipt')}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <Receipt className="h-4 w-4 mr-1.5" /> {nextAction.label}
            </Button>
          )}
          {/* Reschedule - only meaningful while still scheduled */}
          {isScheduled && (
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(true)}
              disabled={statusUpdating}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Clock className="h-4 w-4 mr-1.5" /> Reschedule
            </Button>
          )}
          {/* Transfer to a partner salon - only for scheduled appointments */}
          {isScheduled && (
            <Button
              variant="outline"
              onClick={() => setTransferOpen(true)}
              disabled={statusUpdating}
              className="text-violet-600 border-violet-200 hover:bg-violet-50"
            >
              <Share2Icon className="h-4 w-4 mr-1.5" /> Transfer to Partner
            </Button>
          )}
          {appt.status === 'transferred' && (
            <Badge className="bg-violet-100 text-violet-700 px-2.5 py-1">
              Transferred to partner
            </Badge>
          )}
          {['scheduled', 'checked_in'].includes(appt.status) && (
            <>
              <Button
                variant="outline"
                onClick={() => updateStatus('no_show')}
                disabled={statusUpdating || (appt.status === 'scheduled' && checkInBlocked)}
                title={appt.status === 'scheduled' && checkInBlocked ? 'Available 15 minutes before the appointment' : ''}
                className="text-yellow-700 border-yellow-200 hover:bg-yellow-50 disabled:opacity-50"
              >
                Mark No-Show
              </Button>
              <Button
                variant="outline"
                onClick={() => updateStatus('cancelled')}
                disabled={statusUpdating}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Check-in lock notice - only shown when the user is staring at a
          scheduled appointment that's still too far away to check in. */}
      {checkInBlocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Check-in opens at {salonTime(new Date(new Date(appt.start_time).getTime() - 15 * 60 * 1000), tenant?.timezone)} (15 minutes before the slot)</p>
            <p className="text-xs mt-0.5">
              Check-in will unlock automatically 15 minutes before the appointment.
            </p>
          </div>
        </div>
      )}

      {/* Status Progress Bar */}
      <div className="hidden sm:flex items-center gap-0">
        {STATUS_FLOW.slice(0, 6).map((s, i) => {
          const isActive = s.key === appt.status;
          const isPast = i < statusIdx;
          return (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                isActive ? statusInfo?.color + ' border' :
                isPast ? 'bg-green-50 text-green-600' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isPast && <Check className="h-3 w-3" />}
                {isActive && <Clock className="h-3 w-3" />}
                {s.label}
              </div>
              {i < 4 && <div className={`h-px flex-1 ${isPast || isActive ? 'bg-green-300' : 'bg-slate-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Appointment Info */}
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5" /> Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p><span className="text-slate-400">Date:</span> {appt.start_time ? formatInSalonTz(appt.start_time, tenant?.timezone, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</p>
            <p><span className="text-slate-400">Time:</span> {appt.start_time ? salonTime(appt.start_time, tenant?.timezone) : '-'} - {appt.end_time ? salonTime(appt.end_time, tenant?.timezone) : ''}</p>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Groomer:</span>
              {changingGroomer ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Select value={newStaffId} onValueChange={setNewStaffId}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="Select groomer" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={handleChangeGroomer} className="text-xs text-primary hover:underline">Save</button>
                  <button onClick={() => { setChangingGroomer(false); setNewStaffId(''); }} className="text-xs text-slate-400 hover:underline">Cancel</button>
                </div>
              ) : (
                <>
                  <span>{appt.staff?.full_name || '-'}</span>
                  {!receipt && (
                    <button onClick={() => { setChangingGroomer(true); setNewStaffId(appt.staff_id || ''); }} className="text-xs text-primary hover:underline">Change</button>
                  )}
                </>
              )}
            </div>
            {appt.notes && <p className="text-slate-400 text-xs italic mt-2">{appt.notes}</p>}
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Client
              {clientPending && <Badge className="bg-amber-100 text-amber-700 border-amber-200 border rounded-full text-[10px] px-1.5 py-0">Pending</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-medium text-slate-900">{appt.client?.full_name || '-'}</p>
            {appt.client?.phone && (
              <p className="flex items-center gap-1.5 text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {appt.client.phone}
              </p>
            )}
            {appt.client?.email && (
              <p className="flex items-center gap-1.5 text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {appt.client.email}
              </p>
            )}
            {appt.client?.id && (
              <button
                className="text-xs text-primary hover:underline mt-1"
                onClick={() => navigate(`/dashboard/clients/${appt.client.id}`)}
              >
                View client profile →
              </button>
            )}
          </CardContent>
        </Card>

        {/* Pet Info */}
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <PawPrint className="h-3.5 w-3.5" /> Pet
              {petPending && <Badge className="bg-amber-100 text-amber-700 border-amber-200 border rounded-full text-[10px] px-1.5 py-0">Incomplete</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {appt.pet ? (
              <>
                <p className="font-medium text-slate-900">{appt.pet.name}</p>
                <p className="text-slate-600">{appt.pet.species}{appt.pet.breed ? ` · ${appt.pet.breed}` : ''}</p>
                {appt.pet.weight && <p className="text-slate-600">Weight: {appt.pet.weight} kg</p>}
                {(appt.pet.special_notes || appt.pet.notes) && (
                  <p className="text-xs text-slate-400 italic">{appt.pet.special_notes || appt.pet.notes}</p>
                )}
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => navigate(`/dashboard/pets/${appt.pet.id}`)}
                >
                  View pet profile →
                </button>
              </>
            ) : (
              <p className="text-slate-400">No pet linked</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Grooming Context - notes left, feedback right */}
      {appt.pet_id && (prevGroomingNote || prevFeedback) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left - last grooming notes */}
          {prevGroomingNote && (
            <Card className="rounded-xl border-amber-200/60 bg-amber-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Last Grooming Notes
                  {prevGroomingNote?.is_favourite && <span title="Favourite note">⭐</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1.5">
                {prevGroomingNote.coat_condition && (
                  <p><span className="text-slate-400">Coat condition:</span> <span className="font-medium text-slate-700">{prevGroomingNote.coat_condition}</span></p>
                )}
                {prevGroomingNote.groomer_notes && (
                  <p><span className="text-slate-400">Groomer notes:</span> <span className="text-slate-700">{prevGroomingNote.groomer_notes}</span></p>
                )}
                {prevGroomingNote.services_performed?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400">Services:</span>
                    {prevGroomingNote.services_performed.map((s, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-800 text-[10px] rounded-full">{s}</Badge>
                    ))}
                  </div>
                )}
                {prevGroomingNote.next_recommended_date && (
                  <p><span className="text-slate-400">Next recommended:</span> <span className="text-slate-700">{prevGroomingNote.next_recommended_date}</span></p>
                )}
                {prevGroomingNote.staff?.full_name && (
                  <p className="text-xs text-slate-400 pt-1">By {prevGroomingNote.staff.full_name}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Right - last feedback */}
          {prevFeedback ? (
            <Card className="rounded-xl border-amber-200/60 bg-amber-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" /> Last Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`h-5 w-5 ${n <= (prevFeedback.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-slate-700">{prevFeedback.rating}/5</span>
                </div>
                {prevFeedback.comments && (
                  <p className="text-slate-600 italic leading-relaxed">"{prevFeedback.comments}"</p>
                )}
                {!prevFeedback.comments && (
                  <p className="text-slate-400 italic text-xs">No written comments</p>
                )}
              </CardContent>
            </Card>
          ) : (
            // When there are notes but no feedback, show a placeholder so
            // the grid stays balanced and the groomer knows no feedback was
            // left last time.
            prevGroomingNote && (
              <Card className="rounded-xl border-slate-200/60 bg-slate-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" /> Last Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6 text-sm text-slate-400 italic">
                  No feedback was left for the previous visit
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="services" className="gap-1.5">
            <Scissors className="h-4 w-4" /> Services ({apptServices.length})
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-1.5">
            <Image className="h-4 w-4" /> Photos ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="receipt" className="gap-1.5">
            <Receipt className="h-4 w-4" /> Receipt {receipt && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <Star className="h-4 w-4" /> Feedback
          </TabsTrigger>
        </TabsList>

        {/* ── Services Tab ── */}
        <TabsContent value="services">
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apptServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        No services added yet. Add services below.
                      </TableCell>
                    </TableRow>
                  ) : apptServices.map(item => {
                    // Capability filter: only staff who can perform this service.
                    // The services list endpoint returns `staff_ids` per
                    // service (from migration 024) - fall back to the full
                    // staff list if a service has no capability mapping yet
                    // so the dropdown isn't unusable on legacy data.
                    const svcMeta = services.find(s => s.id === item.service_id);
                    const capable = svcMeta?.staff_ids;
                    const eligible = (capable && capable.length > 0)
                      ? staffList.filter(s => capable.includes(s.id) && s.is_active !== false)
                      : staffList.filter(s => s.is_active !== false);
                    return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {receipt ? (
                          <span className="text-sm text-slate-600">{item.staff_name || appt?.staff?.full_name || '-'}</span>
                        ) : (
                          <Select
                            value={item.staff_id || ''}
                            onValueChange={async (val) => {
                              try {
                                await api.put(`/g/appointments/${appointmentId}/services/${item.id}`, { staff_id: val });
                                setApptServices(prev => prev.map(s => s.id === item.id
                                  ? { ...s, staff_id: val, staff_name: staffList.find(st => st.id === val)?.full_name }
                                  : s
                                ));
                                toast.success('Staff updated');
                              } catch { toast.error('Failed to update staff'); }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-[160px]">
                              <SelectValue placeholder="Assign staff" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligible.length === 0 ? (
                                <div className="text-xs text-amber-600 px-3 py-2">
                                  No groomer can perform this service
                                </div>
                              ) : eligible.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-500">
                        {item.duration_minutes ? `${item.duration_minutes} min` : '-'}
                      </TableCell>
                      <TableCell>
                        {!receipt ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 w-20 text-xs"
                            defaultValue={item.unit_price}
                            onBlur={async (e) => {
                              const newPrice = parseFloat(e.target.value);
                              if (isNaN(newPrice) || newPrice === item.unit_price) return;
                              try {
                                await api.put(`/g/appointments/${appointment.id}/services/${item.id}`, { unit_price: newPrice });
                                fetchAll();
                              } catch { toast.error('Failed to update price'); }
                            }}
                          />
                        ) : (
                          formatPrice(item.unit_price, currency)
                        )}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(item.total, currency)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleRemoveService(item.id)}
                          className="h-7 w-7 text-red-400 hover:text-red-600"
                          disabled={!!receipt}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {apptServices.length > 0 && (
                    <TableRow className="bg-slate-50/60">
                      <TableCell colSpan={5} className="text-right font-semibold text-slate-700">Subtotal</TableCell>
                      <TableCell colSpan={2} className="font-bold text-slate-900">{formatPrice(subtotal, currency)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Service */}
          {!receipt && (
            <Card className="rounded-xl border-slate-200/60 mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-slate-500 mb-1">Service</Label>
                    <Select value={addServiceId} onValueChange={setAddServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} · {formatPrice(s.price, currency)} ({s.duration_minutes} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[160px]">
                    <Label className="text-xs text-slate-500 mb-1">Staff</Label>
                    <Select value={addStaffId} onValueChange={setAddStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.filter(s => s.is_active !== false).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Qty:</Label>
                    <Input
                      type="number" min={1} value={addQty}
                      onChange={e => setAddQty(parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                  </div>
                  <Button onClick={handleAddService} disabled={!addServiceId} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Photos Tab ── */}
        <TabsContent value="photos">
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-5 space-y-4">
              {/* Upload controls */}
              <div className="flex gap-3 items-center flex-wrap">
                <Select value={photoType} onValueChange={setPhotoType}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before</SelectItem>
                    <SelectItem value="during">During</SelectItem>
                    <SelectItem value="after">After</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  {photoUploading ? 'Uploading...' : `Upload ${photoType} photo`}
                </Button>
              </div>

              {/* Photo grid by type */}
              {['before', 'during', 'after'].map(type => {
                const typePhotos = photos.filter(p => p.photo_type === type);
                if (typePhotos.length === 0) return null;
                return (
                  <div key={type}>
                    <h4 className="text-sm font-semibold text-slate-700 capitalize mb-2">{type}</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {typePhotos.map(photo => (
                        <div key={photo.id} className="relative group aspect-square">
                          <img
                            src={assetUrl(photo.photo_url)}
                            alt={photo.caption || `${type} photo`}
                            className="w-full h-full object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {photos.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <Image className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No photos yet. Upload before, during, and after photos.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notes Tab ── */}
        <TabsContent value="notes">
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                {noteEditId ? 'Edit Grooming Note' : 'Add Grooming Note for This Visit'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Coat Condition</Label>
                <Input
                  value={noteForm.coat_condition}
                  onChange={e => setNoteForm({ ...noteForm, coat_condition: e.target.value })}
                  placeholder="e.g. Slightly matted on belly, shedding heavily"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Services Performed</Label>
                <Input
                  value={noteForm.services_performed}
                  onChange={e => setNoteForm({ ...noteForm, services_performed: e.target.value })}
                  placeholder="Comma-separated, e.g. full bath, nail trim, ear cleaning"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple services with commas</p>
              </div>
              <div>
                <Label>Groomer Notes</Label>
                <Textarea
                  value={noteForm.groomer_notes}
                  onChange={e => setNoteForm({ ...noteForm, groomer_notes: e.target.value })}
                  placeholder="Behaviour, allergies, what to remember next time..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Next Recommended Visit</Label>
                <Input
                  type="date"
                  value={noteForm.next_recommended_date}
                  onChange={e => setNoteForm({ ...noteForm, next_recommended_date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveNote}
                  disabled={savingNote || !appt?.pet_id}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {savingNote ? 'Saving...' : noteEditId ? 'Update Note' : 'Save Note'}
                </Button>
                {noteEditId && (
                  <Button variant="outline" onClick={resetNoteForm}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing notes for this appointment */}
          {notes.length > 0 && (
            <Card className="rounded-xl border-slate-200/60 mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes for this appointment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="p-4 rounded-lg border border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-2">
                            {note.created_at && format(parseISO(note.created_at), 'MMM d, yyyy · h:mm a')}
                          </p>
                          {note.coat_condition && (
                            <p className="text-sm text-slate-900 mb-1">
                              <span className="font-medium">Coat:</span> {note.coat_condition}
                            </p>
                          )}
                          {note.services_performed?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {note.services_performed.map((s, i) => (
                                <Badge key={i} className="bg-amber-50 text-amber-700 text-xs rounded-full">{s}</Badge>
                              ))}
                            </div>
                          )}
                          {note.groomer_notes && (
                            <p className="text-sm text-slate-700 mt-2 leading-relaxed">{note.groomer_notes}</p>
                          )}
                          {note.next_recommended_date && (
                            <p className="text-xs text-slate-500 mt-2">
                              Next visit: {note.next_recommended_date}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {appt?.pet_id && (
                  <div className="mt-4 pt-3 border-t">
                    <button
                      onClick={() => navigate(`/dashboard/pets/${appt.pet_id}`)}
                      className="text-xs text-primary hover:underline"
                    >
                      View all grooming history for this pet →
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Receipt Tab ── */}
        <TabsContent value="receipt">
          {receipt ? (
            /* Receipt exists - show summary + download.
               `displayCurrency` prefers the currency the receipt was issued
               in (so historical receipts keep their original symbol even if
               the tenant later changes default currency). */
            (() => {
              const displayCurrency = receipt.currency || currency;
              // If the live services sum doesn't match the saved subtotal,
              // surface a warning so admin knows the receipt is the source
              // of truth (services may have been edited after generation).
              const liveSubtotal = apptServices.reduce(
                (s, i) => s + parseFloat(i.total || 0), 0
              );
              const subtotalDrift = Math.abs(liveSubtotal - parseFloat(receipt.subtotal || 0)) > 0.01;
              return (
            <Card className="rounded-xl border-slate-200/60">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Receipt #{receipt.receipt_number}</h3>
                    <p className="text-sm text-slate-500">
                      {receipt.created_at ? format(parseISO(receipt.created_at), 'MMM d, yyyy · h:mm a') : ''}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 border rounded-full">
                    <Check className="h-3 w-3 mr-1" /> Generated
                  </Badge>
                </div>

                {subtotalDrift && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      The current services sum ({formatPrice(liveSubtotal, displayCurrency)}) differs from the
                      saved receipt subtotal ({formatPrice(receipt.subtotal, displayCurrency)}). The receipt
                      below is the source of truth.
                    </span>
                  </div>
                )}

                {/* Receipt summary */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  {apptServices.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="text-slate-600">{item.name} × {item.quantity}</span>
                        {item.staff_name && <span className="text-xs text-slate-400 ml-2">by {item.staff_name}</span>}
                      </div>
                      <span>{formatPrice(item.total, displayCurrency)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span>{formatPrice(receipt.subtotal, displayCurrency)}</span>
                    </div>
                    {receipt.tax_rate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tax ({receipt.tax_rate}%)</span>
                        <span>{formatPrice(receipt.tax_amount, displayCurrency)}</span>
                      </div>
                    )}
                    {receipt.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>
                          Discount
                          {(receipt.discount_percent || 0) > 0 && ` (${receipt.discount_percent}%)`}
                        </span>
                        <span>- {formatPrice(receipt.discount_amount, displayCurrency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(receipt.total, displayCurrency)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-500">Payment</span>
                    <span className="capitalize">{receipt.payment_method} · {receipt.payment_status}</span>
                  </div>
                </div>

                {/* Download / Print */}
                <div className="flex gap-3">
                  <DownloadReceipt
                    receipt={receipt}
                    appointment={appt}
                    apptServices={apptServices}
                    tenant={tenant}
                    currency={displayCurrency}
                  />
                </div>
              </CardContent>
            </Card>
              );
            })()
          ) : (
            /* Generate receipt form */
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-base">Generate Service Receipt</CardTitle>
                {apptServices.length === 0 && (
                  <p className="text-sm text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Add services first (in the Services tab) before generating a receipt.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Services summary */}
                {apptServices.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    {apptServices.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-slate-600">{item.name} × {item.quantity}</span>
                        <span>{formatPrice(item.total, currency)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 font-semibold flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number" step="0.1" min="0" max="100"
                      value={receiptForm.tax_rate}
                      onChange={e => setReceiptForm(f => ({ ...f, tax_rate: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Discount</Label>
                    <div className="mt-1.5 flex gap-1.5">
                      {/* Type toggle: fixed amount vs percentage */}
                      <div className="flex border rounded-md overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setReceiptForm(f => ({ ...f, discount_type: 'amount' }))}
                          className={`px-2 ${receiptForm.discount_type === 'amount' ? 'bg-primary text-primary-foreground' : 'bg-white text-slate-600'}`}
                          title="Fixed amount"
                        >
                          {getCurrencySymbol(currency)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReceiptForm(f => ({ ...f, discount_type: 'percent' }))}
                          className={`px-2 border-l ${receiptForm.discount_type === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-white text-slate-600'}`}
                          title="Percentage"
                        >
                          %
                        </button>
                      </div>
                      {receiptForm.discount_type === 'percent' ? (
                        <Input
                          type="number" step="0.1" min="0" max="100"
                          value={receiptForm.discount_percent}
                          onChange={e => setReceiptForm(f => ({ ...f, discount_percent: e.target.value }))}
                          placeholder="0"
                          className="flex-1"
                        />
                      ) : (
                        <Input
                          type="number" step="0.01" min="0"
                          value={receiptForm.discount_amount}
                          onChange={e => setReceiptForm(f => ({ ...f, discount_amount: e.target.value }))}
                          placeholder="0.00"
                          className="flex-1"
                        />
                      )}
                    </div>
                    {receiptForm.discount_type === 'percent' && discountPercent > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        = {formatPrice(discountAmount, currency)} off subtotal
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={receiptForm.payment_method} onValueChange={v => setReceiptForm(f => ({ ...f, payment_method: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="terminal">Terminal (EFTPOS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Status</Label>
                    <Select value={receiptForm.payment_status} onValueChange={v => setReceiptForm(f => ({ ...f, payment_status: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={receiptForm.notes}
                      onChange={e => setReceiptForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Loyalty discount, etc."
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Totals preview */}
                {apptServices.length > 0 && (
                  <div className="bg-primary/5 rounded-xl p-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tax ({receiptForm.tax_rate}%)</span>
                        <span>{formatPrice(taxAmount, currency)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Discount
                          {receiptForm.discount_type === 'percent' && discountPercent > 0
                            ? ` (${discountPercent}%)`
                            : ''}
                        </span>
                        <span>- {formatPrice(discountAmount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                      <span>Grand Total</span>
                      <span className="text-primary">{formatPrice(grandTotal, currency)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={onClickGenerateReceipt}
                  disabled={apptServices.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg w-full sm:w-auto"
                >
                  <Receipt className="h-4 w-4 mr-1.5" />
                  {receiptForm.payment_method === 'terminal' ? 'Charge Terminal & Generate Receipt' : 'Generate Receipt'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Feedback Tab ── */}
        <TabsContent value="feedback">
          <Card className="rounded-xl border-slate-200/60">
            <CardContent className="p-6 space-y-5">
              <div>
                <Label className="text-sm font-semibold">Client Satisfaction Rating</Label>
                <div className="mt-2">
                  <StarRating value={feedback.rating} onChange={v => setFeedback(f => ({ ...f, rating: v }))} />
                  {feedback.rating > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedback.rating]}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label>Comments</Label>
                <Textarea
                  value={feedback.comments}
                  onChange={e => setFeedback(f => ({ ...f, comments: e.target.value }))}
                  placeholder="Client feedback, notes about the session, or improvement suggestions..."
                  rows={4}
                  className="mt-1.5"
                />
              </div>
              <Button
                onClick={handleSaveFeedback}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                <Star className="h-4 w-4 mr-1.5" /> Save Feedback
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Reschedule Dialog ── */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>New Date *</Label>
              <Input
                type="date"
                value={rescheduleDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setRescheduleDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            {rescheduleDate && (
              <div>
                <Label className="text-xs text-slate-500">Available Slots</Label>
                {rescheduleLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : rescheduleSlots.filter(s => s.available).length === 0 ? (
                  <p className="text-sm text-slate-400 mt-2 text-center py-4">
                    No slots available on this date. Try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto">
                    {rescheduleSlots.filter(s => s.available).map((slot, i) => {
                      const distinctStaff = slot.staff || [];
                      const selected = rescheduleSlot?.start_time === slot.start_time;
                      return (
                        <button
                          key={i}
                          onClick={() => setRescheduleSlot(slot)}
                          className={`py-2 px-2 rounded-lg text-sm font-medium border-2 transition-all ${
                            selected
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          <div>{slot.start_time}</div>
                          {distinctStaff.length > 0 && (
                            <div className={`text-[10px] mt-0.5 truncate ${selected ? 'text-blue-50' : 'text-slate-400'}`}>
                              {distinctStaff.length === 1
                                ? distinctStaff[0][1]
                                : `${distinctStaff.length} groomers`}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleSlot || rescheduling}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Registration Check-In Dialog ── */}
      {showRegDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-lg mx-4 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Complete Registration Before Check-In
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {clientPending && petPending
                  ? 'Both client and pet have incomplete registration.'
                  : clientPending
                  ? 'Client registration is pending.'
                  : 'Pet details are incomplete.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Client registration fields */}
              {clientPending && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Client: {appt.client?.full_name}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={regForm.client.email}
                        onChange={e => setRegForm(f => ({ ...f, client: { ...f.client, email: e.target.value } }))}
                        placeholder="client@email.com"
                        className="mt-1"
                        type="email"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={regForm.client.phone}
                        onChange={e => setRegForm(f => ({ ...f, client: { ...f.client, phone: e.target.value } }))}
                        placeholder="+1 555-0123"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <Input
                      value={regForm.client.address}
                      onChange={e => setRegForm(f => ({ ...f, client: { ...f.client, address: e.target.value } }))}
                      placeholder="123 Main St, City"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input
                      value={regForm.client.notes}
                      onChange={e => setRegForm(f => ({ ...f, client: { ...f.client, notes: e.target.value } }))}
                      placeholder="Any special notes about this client"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Pet registration fields */}
              {petPending && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-1.5">
                    <PawPrint className="h-4 w-4" /> Pet: {appt.pet?.name} ({appt.pet?.species})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Breed</Label>
                      <Input
                        value={regForm.pet.breed}
                        onChange={e => setRegForm(f => ({ ...f, pet: { ...f.pet, breed: e.target.value } }))}
                        placeholder="e.g. Golden Retriever"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input
                        value={regForm.pet.weight}
                        onChange={e => setRegForm(f => ({ ...f, pet: { ...f.pet, weight: e.target.value } }))}
                        placeholder="e.g. 15"
                        type="number"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Gender</Label>
                      <Select
                        value={regForm.pet.gender}
                        onValueChange={v => setRegForm(f => ({ ...f, pet: { ...f.pet, gender: v } }))}
                      >
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="desexed">Desexed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        value={regForm.pet.color}
                        onChange={e => setRegForm(f => ({ ...f, pet: { ...f.pet, color: e.target.value } }))}
                        placeholder="e.g. Golden"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Input
                      value={regForm.pet.notes}
                      onChange={e => setRegForm(f => ({ ...f, pet: { ...f.pet, notes: e.target.value } }))}
                      placeholder="Temperament, allergies, special care"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleSkipRegistration}
                  className="flex-1 rounded-lg"
                >
                  Skip & Check In
                </Button>
                <Button
                  onClick={handleSaveRegistration}
                  disabled={regSaving}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  {regSaving ? 'Saving...' : 'Save & Check In'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rebooking prompt dialog */}
      <Dialog open={showRebookingDialog} onOpenChange={setShowRebookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Next Rebooking Date</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Set next rebooking date for <span className="font-semibold">{appt?.client?.full_name || 'this client'}</span>?
          </p>
          <div className="mt-3">
            <Label>Rebooking Date</Label>
            <Input
              type="date"
              value={rebookingDate}
              onChange={e => setRebookingDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowRebookingDialog(false)}>
              Skip
            </Button>
            <Button
              onClick={handleSaveRebooking}
              disabled={savingRebooking || !rebookingDate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingRebooking ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Terminal picker (middle-screen pop) ── */}
      <Dialog open={showTerminalPicker} onOpenChange={setShowTerminalPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Choose Payment Terminal
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-500 mb-3">
              Select which EFTPOS terminal to charge <strong>{formatPrice(grandTotal, currency)}</strong> on.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(tenant?.settings?.payment_terminals || [])
                .filter(t => t.active !== false)
                .map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowTerminalPicker(false);
                      setTerminalProcessing({ terminal: t, status: 'waiting' });
                    }}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {BANK_LABELS[t.bank] || t.bank} · TID {t.terminal_id}
                          {t.location ? ` · ${t.location}` : ''}
                        </div>
                      </div>
                      <div className="text-xs text-primary font-medium">Use →</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerminalPicker(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Terminal processing screen ── */}
      <Dialog
        open={!!terminalProcessing}
        onOpenChange={(open) => { if (!open) setTerminalProcessing(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Processing on Terminal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {terminalProcessing?.terminal && (
              <>
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Receipt className="h-7 w-7 text-primary animate-pulse" />
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {BANK_LABELS[terminalProcessing.terminal.bank] || terminalProcessing.terminal.bank} - {terminalProcessing.terminal.label}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  TID {terminalProcessing.terminal.terminal_id}
                  {terminalProcessing.terminal.merchant_id ? ` · MID ${terminalProcessing.terminal.merchant_id}` : ''}
                </div>
                <div className="mt-4 text-2xl font-bold text-primary">
                  {formatPrice(grandTotal, currency)}
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  Present the card on the terminal. Once the machine approves the payment, tap
                  <strong> "Payment Received"</strong> to auto-generate the receipt.
                </p>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTerminalProcessing(null);
                setShowTerminalPicker(true);
              }}
            >
              Change Terminal
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setTerminalProcessing(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={async () => {
                const t = terminalProcessing?.terminal;
                setTerminalProcessing(null);
                if (t) await handleGenerateReceipt(t);
              }}
            >
              <Check className="h-4 w-4 mr-1.5" /> Payment Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransferToPartnerDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        appointment={appt}
        onTransferred={() => {
          // Reload so the status badge + transferred flag appear
          fetchAll();
        }}
      />
    </div>
  );
}
