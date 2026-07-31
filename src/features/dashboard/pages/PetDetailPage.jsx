import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  ArrowLeft, PawPrint, User, Calendar, ClipboardList, Edit2, AlertCircle, Heart, Shield, Syringe, Star,
  FileText, Upload, Plus, Trash2, ExternalLink, Save, X,
} from 'lucide-react';
import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns';
import { toast } from 'sonner';
import DatePicker from '@/shared/components/DatePicker';
import { listItems } from '@/shared/lib/listResponse';

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

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Guinea Pig', 'Hamster', 'Other'];

function computeAge(dob) {
  if (!dob) return null;
  try {
    const date = parseISO(dob);
    const now = new Date();
    const years = differenceInYears(now, date);
    const totalMonths = differenceInMonths(now, date);
    const months = totalMonths % 12;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}m`;
    return 'Under 1m';
  } catch {
    return null;
  }
}

export default function PetDetailPage() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Pet edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState('details'); // 'details' | 'health'
  const [editForm, setEditForm] = useState({});
  // Grooming note add/edit
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({});
  const [savingNote, setSavingNote] = useState(false);
  const [savingPet, setSavingPet] = useState(false);

  // Vaccination & Registration records
  const [vaccinations, setVaccinations] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [vaccForm, setVaccForm] = useState(null);      // null = closed, {} = adding/editing
  const [regForm, setRegForm] = useState(null);
  const [savingVacc, setSavingVacc] = useState(false);
  const [savingReg, setSavingReg] = useState(false);
  const [uploadingVaccDoc, setUploadingVaccDoc] = useState(null); // vacc id being uploaded to
  const [uploadingRegDoc, setUploadingRegDoc] = useState(null);

  const fetchVaccinations = useCallback(async () => {
    try {
      const res = await api.get(`/pets/${petId}/vaccinations`);
      setVaccinations(res.data || []);
    } catch { }
  }, [petId]);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await api.get(`/pets/${petId}/registrations`);
      setRegistrations(res.data || []);
    } catch { }
  }, [petId]);

  const fetchPet = useCallback(async () => {
    try {
      const [petRes, apptsRes, notesRes] = await Promise.all([
        api.get(`/pets/${petId}`),
        api.get(`/pets/${petId}/appointments`).catch(() => ({ data: [] })),
        api.get('/grooming-notes', { params: { pet_id: petId, limit: 200 } }),
      ]);
      setPet(petRes.data);
      setAppointments(listItems(apptsRes.data));
      setNotes(listItems(notesRes.data));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load pet details');
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchPet(); fetchVaccinations(); fetchRegistrations(); }, [fetchPet, fetchVaccinations, fetchRegistrations]);

  const openEditSection = (section) => {
    setEditSection(section);
    setEditForm({
      name: pet?.name || '',
      species: pet?.species || '',
      breed: pet?.breed || '',
      gender: pet?.gender || '',
      weight: pet?.weight || '',
      color: pet?.color || '',
      date_of_birth: pet?.date_of_birth || '',
      microchip_id: pet?.microchip_id || '',
      allergy: pet?.allergy || '',
      medical_conditions: pet?.medical_conditions || '',
      desexed_status: pet?.desexed_status ?? false,
      special_flag: pet?.special_flag || '',
      is_new_pet: pet?.is_new_pet ?? true,
      vaccination_status: pet?.vaccination_status || '',
      vaccination_type: pet?.vaccination_type || '',
      vaccination_expiry: pet?.vaccination_expiry || '',
      vaccination_proof_url: pet?.vaccination_proof_url || '',
      council_name: pet?.council_name || '',
      council_reg_number: pet?.council_reg_number || '',
      reg_expiry: pet?.reg_expiry || '',
      tag_number: pet?.tag_number || '',
      notes: pet?.notes || '',
      // Insurance / vet-claim grade fields
      distinctive_markings: pet?.distinctive_markings || '',
      desexed_date: pet?.desexed_date || '',
      vet_clinic_name: pet?.vet_clinic_name || '',
      vet_phone: pet?.vet_phone || '',
      medications: pet?.medications || '',
      dietary_requirements: pet?.dietary_requirements || '',
      behavioural_notes: pet?.behavioural_notes || '',
      insurance_provider: pet?.insurance_provider || '',
      insurance_policy_number: pet?.insurance_policy_number || '',
    });
    setEditDialogOpen(true);
  };

  const openAddNote = () => {
    setNoteForm({ id: null, coat_condition: '', groomer_notes: '', next_recommended_date: '' });
    setNoteDialogOpen(true);
  };
  const openEditNote = (note) => {
    setNoteForm({
      id: note.id,
      coat_condition: note.coat_condition || '',
      groomer_notes: note.groomer_notes || '',
      next_recommended_date: note.next_recommended_date || '',
    });
    setNoteDialogOpen(true);
  };
  const handleSaveNote = async () => {
    if (!noteForm.groomer_notes && !noteForm.coat_condition) {
      toast.error('Add a note before saving');
      return;
    }
    setSavingNote(true);
    try {
      const payload = {
        coat_condition: noteForm.coat_condition || null,
        groomer_notes: noteForm.groomer_notes || null,
        next_recommended_date: noteForm.next_recommended_date || null,
      };
      if (noteForm.id) {
        await api.put(`/grooming-notes/${noteForm.id}`, payload);
        toast.success('Note updated');
      } else {
        await api.post('/grooming-notes', { pet_id: petId, ...payload });
        toast.success('Note added');
      }
      setNoteDialogOpen(false);
      // refetch notes
      const res = await api.get('/grooming-notes', { params: { pet_id: petId, limit: 200 } });
      setNotes(listItems(res.data));
    } catch {
      toast.error('Failed to save note');
    }
    setSavingNote(false);
  };

  const handleSavePet = async () => {
    setSavingPet(true);
    try {
      await api.put(`/pets/${petId}`, {
        name: editForm.name || null,
        species: editForm.species || null,
        breed: editForm.breed || null,
        gender: editForm.gender || null,
        weight: editForm.weight || null,
        color: editForm.color || null,
        date_of_birth: editForm.date_of_birth || null,
        microchip_id: editForm.microchip_id || null,
        allergy: editForm.allergy || null,
        medical_conditions: editForm.medical_conditions || null,
        desexed_status: editForm.desexed_status,
        special_flag: editForm.special_flag || null,
        is_new_pet: editForm.is_new_pet,
        notes: editForm.notes || null,
        distinctive_markings: editForm.distinctive_markings || null,
        desexed_date: editForm.desexed_date || null,
        vet_clinic_name: editForm.vet_clinic_name || null,
        vet_phone: editForm.vet_phone || null,
        medications: editForm.medications || null,
        dietary_requirements: editForm.dietary_requirements || null,
        behavioural_notes: editForm.behavioural_notes || null,
        insurance_provider: editForm.insurance_provider || null,
        insurance_policy_number: editForm.insurance_policy_number || null,
      });
      toast.success('Pet updated');
      setEditDialogOpen(false);
      fetchPet();
    } catch (e) {
      toast.error('Failed to update pet');
    }
    setSavingPet(false);
  };

  const handleToggleFavourite = async (note) => {
    try {
      await api.put(`/grooming-notes/${note.id}`, { is_favourite: !note.is_favourite });
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_favourite: !n.is_favourite } : n));
      toast.success(note.is_favourite ? 'Removed from favourites' : 'Marked as favourite');
    } catch (e) {
      toast.error('Failed to update favourite');
    }
  };

  // ── Form doc upload helper ──────────────────────────────────────────
  const [uploadingFormDoc, setUploadingFormDoc] = useState(false);

  const uploadDocToForm = async (file, formSetter, currentForm) => {
    setUploadingFormDoc(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post(`/pets/${petId}/upload?file_type=document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) {
        const docs = [...(currentForm.documents || []), { url: res.data.url, filename: file.name }];
        formSetter({ ...currentForm, documents: docs });
        toast.success('Document attached');
      }
    } catch { toast.error('Upload failed'); }
    setUploadingFormDoc(false);
  };

  const removeDocFromForm = (formSetter, currentForm, idx) => {
    const docs = (currentForm.documents || []).filter((_, i) => i !== idx);
    formSetter({ ...currentForm, documents: docs });
  };

  // ── Vaccination CRUD ──────────────────────────────────────────────────
  const openVaccForm = (existing = null) => {
    setVaccForm(existing ? { ...existing } : { vaccination_type: '', vaccination_date: '', expiry_date: '', vet_name: '', notes: '', documents: [] });
  };

  const handleSaveVacc = async () => {
    setSavingVacc(true);
    try {
      if (vaccForm.id) {
        await api.put(`/pets/${petId}/vaccinations/${vaccForm.id}`, vaccForm);
      } else {
        await api.post(`/pets/${petId}/vaccinations`, vaccForm);
      }
      toast.success(vaccForm.id ? 'Vaccination updated' : 'Vaccination added');
      setVaccForm(null);
      fetchVaccinations();
    } catch { toast.error('Failed to save vaccination'); }
    setSavingVacc(false);
  };

  const handleDeleteVacc = async (id) => {
    if (!window.confirm('Delete this vaccination record?')) return;
    try {
      await api.delete(`/pets/${petId}/vaccinations/${id}`);
      toast.success('Vaccination deleted');
      fetchVaccinations();
    } catch { toast.error('Failed to delete'); }
  };

  const handleUploadVaccDoc = async (vaccId, file) => {
    setUploadingVaccDoc(vaccId);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post(`/pets/${petId}/upload?file_type=document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) {
        const vacc = vaccinations.find(v => v.id === vaccId);
        const docs = [...(vacc?.documents || []), { url: res.data.url, filename: file.name }];
        await api.put(`/pets/${petId}/vaccinations/${vaccId}`, { documents: docs });
        toast.success('Document uploaded');
        fetchVaccinations();
      }
    } catch { toast.error('Upload failed'); }
    setUploadingVaccDoc(null);
  };

  const handleDeleteVaccDoc = async (vaccId, docIdx) => {
    const vacc = vaccinations.find(v => v.id === vaccId);
    if (!vacc) return;
    const docs = vacc.documents.filter((_, i) => i !== docIdx);
    try {
      await api.put(`/pets/${petId}/vaccinations/${vaccId}`, { documents: docs });
      toast.success('Document removed');
      fetchVaccinations();
    } catch { toast.error('Failed to remove document'); }
  };

  // ── Registration CRUD ──────────────────────────────────────────────────
  const openRegForm = (existing = null) => {
    setRegForm(existing ? { ...existing } : { council_name: '', registration_number: '', expiry_date: '', tag_number: '', notes: '', documents: [] });
  };

  const handleSaveReg = async () => {
    setSavingReg(true);
    try {
      if (regForm.id) {
        await api.put(`/pets/${petId}/registrations/${regForm.id}`, regForm);
      } else {
        await api.post(`/pets/${petId}/registrations`, regForm);
      }
      toast.success(regForm.id ? 'Registration updated' : 'Registration added');
      setRegForm(null);
      fetchRegistrations();
    } catch { toast.error('Failed to save registration'); }
    setSavingReg(false);
  };

  const handleDeleteReg = async (id) => {
    if (!window.confirm('Delete this registration record?')) return;
    try {
      await api.delete(`/pets/${petId}/registrations/${id}`);
      toast.success('Registration deleted');
      fetchRegistrations();
    } catch { toast.error('Failed to delete'); }
  };

  const handleUploadRegDoc = async (regId, file) => {
    setUploadingRegDoc(regId);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post(`/pets/${petId}/upload?file_type=document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) {
        const reg = registrations.find(r => r.id === regId);
        const docs = [...(reg?.documents || []), { url: res.data.url, filename: file.name }];
        await api.put(`/pets/${petId}/registrations/${regId}`, { documents: docs });
        toast.success('Document uploaded');
        fetchRegistrations();
      }
    } catch { toast.error('Upload failed'); }
    setUploadingRegDoc(null);
  };

  const handleDeleteRegDoc = async (regId, docIdx) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;
    const docs = reg.documents.filter((_, i) => i !== docIdx);
    try {
      await api.put(`/pets/${petId}/registrations/${regId}`, { documents: docs });
      toast.success('Document removed');
      fetchRegistrations();
    } catch { toast.error('Failed to remove document'); }
  };

  // ── Vaccination overall status ─────────────────────────────────────────
  const vaccOverallStatus = (() => {
    if (vaccinations.length === 0) return 'none';
    const today = new Date();
    const hasExpired = vaccinations.some(v => v.expiry_date && new Date(v.expiry_date) < today);
    const allValid = vaccinations.every(v => !v.expiry_date || new Date(v.expiry_date) >= today);
    if (hasExpired) return 'expired';
    if (allValid) return 'valid';
    return 'partial';
  })();

  const regOverallStatus = (() => {
    if (registrations.length === 0) return 'none';
    const today = new Date();
    const hasExpired = registrations.some(r => r.expiry_date && new Date(r.expiry_date) < today);
    if (hasExpired) return 'expired';
    return 'valid';
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Pet not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/pets')} className="mt-4">Back to Pets</Button>
      </div>
    );
  }

  const age = computeAge(pet.date_of_birth);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - full width, similar to Client Detail */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/pets')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {pet.photo_url ? (
            <img src={assetUrl(pet.photo_url)} alt={pet.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <PawPrint className="h-7 w-7 text-amber-700" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{pet.name}</h1>
              {age && <span className="text-base text-slate-500">· {age}</span>}
              {pet.special_flag && (
                <Badge className="rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-200">
                  {pet.special_flag}
                </Badge>
              )}
              {pet.allergy && (
                <Badge className="rounded-full text-xs bg-red-50 text-red-700 border border-red-200">Allergy</Badge>
              )}
              {vaccOverallStatus === 'expired' && (
                <Badge className="rounded-full text-xs bg-red-50 text-red-700 border border-red-200">Vacc expired</Badge>
              )}
              {pet.is_new_pet && (
                <Badge className="rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">New</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {[pet.species, pet.breed, pet.gender].filter(Boolean).join(' · ')}
              {pet.owner && <> · Owner: <button onClick={() => navigate(`/dashboard/clients/${pet.owner.id}`)} className="text-primary hover:underline">{pet.owner.full_name}</button></>}
            </p>
          </div>

        </div>
      </div>

      {/* KPI Summary Cards - full width, like client detail */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{pet.weight ? `${pet.weight}kg` : '-'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Weight</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Appointments</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${vaccOverallStatus === 'expired' ? 'text-red-600' : vaccOverallStatus === 'valid' ? 'text-green-600' : 'text-slate-400'}`}>
              {vaccOverallStatus === 'expired' ? 'Expired' : vaccOverallStatus === 'valid' ? 'Valid' : '-'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Vaccination</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${pet.desexed_status === true ? 'text-green-600' : pet.desexed_status === false ? 'text-amber-600' : 'text-slate-400'}`}>
              {pet.desexed_status === true ? 'Yes' : pet.desexed_status === false ? 'No' : '-'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Desexed</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{notes.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Grooming Notes</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{age || '-'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Age</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Overview (details + notes + history) | Vaccination (docs) | Registration (docs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><PawPrint className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="vaccination" className="gap-1.5"><Syringe className="h-4 w-4" /> Vaccination Documents</TabsTrigger>
          <TabsTrigger value="registration" className="gap-1.5"><Shield className="h-4 w-4" /> Registration Documents</TabsTrigger>
        </TabsList>

        {/* ═══ Overview Tab - everything at a glance ═══ */}
        <TabsContent value="overview" className="space-y-6">

          {/* Three equal-height cards in one row - bottoms align cleanly.
              The vaccination/registration summaries live in their own tabs. */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Pet Details */}
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-primary" /> Pet Details
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditSection('details')}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Name" value={pet.name} />
                <InfoRow label="Species" value={pet.species} />
                <InfoRow label="Breed" value={pet.breed} />
                <InfoRow label="Gender" value={pet.gender} />
                <InfoRow label="Weight" value={pet.weight ? `${pet.weight} kg` : null} />
                <InfoRow label="Color" value={pet.color} />
                <InfoRow label="Date of Birth" value={pet.date_of_birth} />
                <InfoRow label="Microchip ID" value={pet.microchip_id} />
                <InfoRow label="Tag / Collar ID" value={pet.tag_number} />
                <InfoRow label="Special Flag" value={pet.special_flag} />
              </CardContent>
            </Card>

            {/* Owner (read-only, from the client record) */}
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {pet.owner ? (
                  <>
                    <button onClick={() => navigate(`/dashboard/clients/${pet.owner.id}`)} className="text-sm font-semibold text-primary hover:underline mb-2 block text-left">
                      {pet.owner.full_name}
                    </button>
                    <InfoRow label="Phone" value={pet.owner.phone} />
                    <InfoRow label="Email" value={pet.owner.email} />
                    <InfoRow label="Address" value={pet.owner.address} />
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No owner linked</p>
                )}
              </CardContent>
            </Card>

            {/* Health & Medical */}
            <Card className="rounded-xl border-slate-200/60">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" /> Health & Medical
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditSection('health')}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Desexed" value={pet.desexed_status === true ? <span className="text-green-600 font-medium">Yes{pet.desexed_date ? ` (${pet.desexed_date})` : ''}</span> : pet.desexed_status === false ? <span className="text-amber-600 font-medium">No</span> : null} />
                <InfoRow label="Medical conditions" value={pet.medical_conditions} />
                <InfoRow label="Medications" value={pet.medications} />
                <InfoRow label="Dietary needs" value={pet.dietary_requirements} />
                <InfoRow label="Distinctive markings" value={pet.distinctive_markings} />
                <InfoRow label="Behaviour / handling" value={pet.behavioural_notes} />
                <InfoRow label="Regular vet" value={pet.vet_clinic_name} />
                <InfoRow label="Vet phone" value={pet.vet_phone} />
                <InfoRow label="Insurer" value={pet.insurance_provider} />
                <InfoRow label="Policy number" value={pet.insurance_policy_number} />
                {pet.allergy && (
                  <div className="py-2.5 border-b border-slate-50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-medium text-red-600">Allergy Alert</span>
                    </div>
                    <p className="text-sm text-slate-700 pl-4">{pet.allergy}</p>
                  </div>
                )}
                {pet.notes && (
                  <div className="py-2.5 border-t border-slate-50 mt-1">
                    <p className="text-xs text-slate-500 mb-1">Special Notes</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{pet.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Row 2: Grooming Notes */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Grooming Notes
                <span className="text-xs text-slate-400 font-normal">({notes.length})</span>
              </CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={openAddNote}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No grooming notes yet</p>
                  <p className="text-xs mt-1">Add one here, or they're captured from each appointment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...notes].sort((a, b) => (b.is_favourite ? 1 : 0) - (a.is_favourite ? 1 : 0)).map(note => (
                    <div key={note.id} className={`p-4 rounded-lg border transition-colors ${note.is_favourite ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => handleToggleFavourite(note)} className="mt-0.5 focus:outline-none shrink-0" title={note.is_favourite ? 'Unfavourite' : 'Favourite'}>
                          <Star className={`h-4 w-4 transition-colors ${note.is_favourite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-xs text-slate-500">{note.created_at && format(parseISO(note.created_at), 'MMM d, yyyy')}</p>
                            {note.staff?.full_name && <Badge variant="outline" className="text-xs">{note.staff.full_name}</Badge>}
                            <button onClick={() => openEditNote(note)} className="ml-auto text-xs text-primary hover:underline shrink-0">Edit</button>
                          </div>
                          {note.coat_condition && <p className="text-sm text-slate-900 mb-1"><span className="font-medium">Coat:</span> {note.coat_condition}</p>}
                          {note.services_performed?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {note.services_performed.map((s, i) => <Badge key={i} className="bg-amber-50 text-amber-700 text-xs rounded-full">{s}</Badge>)}
                            </div>
                          )}
                          {note.groomer_notes && <p className="text-sm text-slate-700 leading-relaxed">{note.groomer_notes}</p>}
                          {note.next_recommended_date && <p className="text-xs text-slate-500 mt-1.5"><Calendar className="h-3 w-3 inline mr-1" />Next visit: {note.next_recommended_date}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Row 3: Appointment History */}
          <Card className="rounded-xl border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Appointment History
                <span className="text-xs text-slate-400 font-normal">({appointments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No appointments yet</div>
              ) : (
                <div className="space-y-2">
                  {appointments.map(a => {
                    const start = a.start_time ? parseISO(a.start_time) : null;
                    return (
                      <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => navigate(`/dashboard/appointments/${a.id}/detail`)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{start ? format(start, 'MMM d, yyyy · h:mm a') : '\u2014'}</p>
                          <p className="text-xs text-slate-500">{a.staff?.full_name || 'Unassigned'}{a.service?.name && ` · ${a.service.name}`}</p>
                        </div>
                        <Badge className={`rounded-full text-xs ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-700'}`}>{a.status?.replace('_', ' ')}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Vaccination Documents Tab ═══ */}
        <TabsContent value="vaccination" className="space-y-4">
          {/* Overall Status Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            vaccOverallStatus === 'expired' ? 'bg-red-50 border-red-200' :
            vaccOverallStatus === 'valid' ? 'bg-green-50 border-green-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <Syringe className={`h-5 w-5 ${vaccOverallStatus === 'expired' ? 'text-red-500' : vaccOverallStatus === 'valid' ? 'text-green-500' : 'text-slate-400'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Vaccination Status</p>
                <p className={`text-xs ${vaccOverallStatus === 'expired' ? 'text-red-600' : vaccOverallStatus === 'valid' ? 'text-green-600' : 'text-slate-500'}`}>
                  {vaccOverallStatus === 'expired' ? 'One or more vaccinations expired' : vaccOverallStatus === 'valid' ? 'All vaccinations up to date' : 'No vaccination records'}
                </p>
              </div>
            </div>
            <Badge className={`${vaccOverallStatus === 'expired' ? 'bg-red-100 text-red-700 border-red-200' : vaccOverallStatus === 'valid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'} border`}>
              {vaccOverallStatus === 'expired' ? 'Action Required' : vaccOverallStatus === 'valid' ? 'Up to Date' : 'No Records'}
            </Badge>
          </div>

          {/* Vaccination Records */}
          {vaccinations.map(v => {
            const isExpired = v.expiry_date && new Date(v.expiry_date) < new Date();
            return (
              <Card key={v.id} className={`rounded-xl ${isExpired ? 'border-red-200' : 'border-slate-200/60'}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Syringe className={`h-5 w-5 ${isExpired ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{v.vaccination_type || 'Untitled'}</p>
                        {isExpired && <p className="text-xs text-red-600 font-medium">Expired</p>}
                        {!isExpired && v.expiry_date && <p className="text-xs text-green-600 font-medium">Valid</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openVaccForm(v)} className="h-8 px-2">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteVacc(v.id)} className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="text-sm font-medium text-slate-800">{v.vaccination_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Date Given</p>
                      <p className="text-sm font-medium text-slate-800">{v.vaccination_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expiry</p>
                      <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>{v.expiry_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Vet</p>
                      <p className="text-sm font-medium text-slate-800">{v.vet_name || '-'}</p>
                    </div>
                  </div>
                  {v.notes && <p className="text-sm text-slate-600 mb-4 bg-slate-50 rounded-lg p-3">{v.notes}</p>}
                  {/* Documents */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents ({(v.documents || []).length})</p>
                    <div className="space-y-2">
                      {(v.documents || []).map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{doc.filename || 'Document'}</span>
                          <a href={assetUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0">
                            <ExternalLink className="h-3 w-3" /> View
                          </a>
                          <button onClick={() => handleDeleteVaccDoc(v.id, idx)} className="text-red-400 hover:text-red-600 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors w-fit">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">
                        {uploadingVaccDoc === v.id ? 'Uploading...' : 'Upload document'}
                      </span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadVaccDoc(v.id, file);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add / Edit Vaccination Form */}
          {vaccForm && (
            <Card className="rounded-xl border-primary/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-blue-500" /> {vaccForm.id ? 'Edit Vaccination' : 'Add Vaccination'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vaccination Type</Label>
                    <Input value={vaccForm.vaccination_type || ''} onChange={e => setVaccForm({ ...vaccForm, vaccination_type: e.target.value })} placeholder="e.g. C5, F3, Rabies" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Vet Name</Label>
                    <Input value={vaccForm.vet_name || ''} onChange={e => setVaccForm({ ...vaccForm, vet_name: e.target.value })} placeholder="Administering vet" className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date Given</Label>
                    <DatePicker value={vaccForm.vaccination_date || ''} onChange={v => setVaccForm({ ...vaccForm, vaccination_date: v })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <DatePicker value={vaccForm.expiry_date || ''} onChange={v => setVaccForm({ ...vaccForm, expiry_date: v })} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={vaccForm.notes || ''} onChange={e => setVaccForm({ ...vaccForm, notes: e.target.value })} placeholder="Optional notes" className="mt-1.5" />
                </div>
                {/* Documents in form */}
                <div>
                  <Label>Documents</Label>
                  <div className="mt-1.5 space-y-2">
                    {(vaccForm.documents || []).map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{doc.filename || 'Document'}</span>
                        <a href={assetUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                        <button type="button" onClick={() => removeDocFromForm(setVaccForm, vaccForm, idx)} className="text-red-400 hover:text-red-600 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors w-full">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {uploadingFormDoc ? 'Uploading...' : 'Upload vaccination document (PDF, JPG, PNG)'}
                      </span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploadingFormDoc} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadDocToForm(file, setVaccForm, vaccForm);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setVaccForm(null)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                  <Button size="sm" onClick={handleSaveVacc} disabled={savingVacc || uploadingFormDoc} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Save className="h-3.5 w-3.5 mr-1" /> {savingVacc ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add button */}
          {!vaccForm && (
            <Button variant="outline" onClick={() => openVaccForm()} className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add Vaccination Record
            </Button>
          )}
        </TabsContent>

        {/* ═══ Registration Documents Tab ═══ */}
        <TabsContent value="registration" className="space-y-4">
          {/* Overall Status Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            regOverallStatus === 'expired' ? 'bg-red-50 border-red-200' :
            regOverallStatus === 'valid' ? 'bg-green-50 border-green-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <Shield className={`h-5 w-5 ${regOverallStatus === 'expired' ? 'text-red-500' : regOverallStatus === 'valid' ? 'text-green-500' : 'text-slate-400'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Registration Status</p>
                <p className={`text-xs ${regOverallStatus === 'expired' ? 'text-red-600' : regOverallStatus === 'valid' ? 'text-green-600' : 'text-slate-500'}`}>
                  {regOverallStatus === 'expired' ? 'One or more registrations expired' : regOverallStatus === 'valid' ? 'All registrations current' : 'No registration records'}
                </p>
              </div>
            </div>
            <Badge className={`${regOverallStatus === 'expired' ? 'bg-red-100 text-red-700 border-red-200' : regOverallStatus === 'valid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'} border`}>
              {regOverallStatus === 'expired' ? 'Action Required' : regOverallStatus === 'valid' ? 'Current' : 'No Records'}
            </Badge>
          </div>

          {/* Registration Records */}
          {registrations.map(r => {
            const isExpired = r.expiry_date && new Date(r.expiry_date) < new Date();
            return (
              <Card key={r.id} className={`rounded-xl ${isExpired ? 'border-red-200' : 'border-slate-200/60'}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-indigo-100'}`}>
                        <Shield className={`h-5 w-5 ${isExpired ? 'text-red-600' : 'text-indigo-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{r.council_name || 'Untitled'}</p>
                        {isExpired && <p className="text-xs text-red-600 font-medium">Expired</p>}
                        {!isExpired && r.expiry_date && <p className="text-xs text-green-600 font-medium">Current</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openRegForm(r)} className="h-8 px-2">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteReg(r.id)} className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Council</p>
                      <p className="text-sm font-medium text-slate-800">{r.council_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Reg. Number</p>
                      <p className="text-sm font-medium text-slate-800">{r.registration_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expiry</p>
                      <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>{r.expiry_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tag / Collar ID</p>
                      <p className="text-sm font-medium text-slate-800">{r.tag_number || '-'}</p>
                    </div>
                  </div>
                  {r.notes && <p className="text-sm text-slate-600 mb-4 bg-slate-50 rounded-lg p-3">{r.notes}</p>}
                  {/* Documents */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents ({(r.documents || []).length})</p>
                    <div className="space-y-2">
                      {(r.documents || []).map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{doc.filename || 'Document'}</span>
                          <a href={assetUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0">
                            <ExternalLink className="h-3 w-3" /> View
                          </a>
                          <button onClick={() => handleDeleteRegDoc(r.id, idx)} className="text-red-400 hover:text-red-600 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors w-fit">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">
                        {uploadingRegDoc === r.id ? 'Uploading...' : 'Upload document'}
                      </span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadRegDoc(r.id, file);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add / Edit Registration Form */}
          {regForm && (
            <Card className="rounded-xl border-primary/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-500" /> {regForm.id ? 'Edit Registration' : 'Add Registration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Council Name</Label>
                    <Input value={regForm.council_name || ''} onChange={e => setRegForm({ ...regForm, council_name: e.target.value })} placeholder="e.g. City of Melbourne" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <Input value={regForm.registration_number || ''} onChange={e => setRegForm({ ...regForm, registration_number: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expiry Date</Label>
                    <DatePicker value={regForm.expiry_date || ''} onChange={v => setRegForm({ ...regForm, expiry_date: v })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Tag / Collar ID</Label>
                    <Input value={regForm.tag_number || ''} onChange={e => setRegForm({ ...regForm, tag_number: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={regForm.notes || ''} onChange={e => setRegForm({ ...regForm, notes: e.target.value })} placeholder="Optional notes" className="mt-1.5" />
                </div>
                {/* Documents in form */}
                <div>
                  <Label>Documents</Label>
                  <div className="mt-1.5 space-y-2">
                    {(regForm.documents || []).map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                        <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{doc.filename || 'Document'}</span>
                        <a href={assetUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                        <button type="button" onClick={() => removeDocFromForm(setRegForm, regForm, idx)} className="text-red-400 hover:text-red-600 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors w-full">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {uploadingFormDoc ? 'Uploading...' : 'Upload registration document (PDF, JPG, PNG)'}
                      </span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploadingFormDoc} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadDocToForm(file, setRegForm, regForm);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setRegForm(null)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                  <Button size="sm" onClick={handleSaveReg} disabled={savingReg || uploadingFormDoc} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Save className="h-3.5 w-3.5 mr-1" /> {savingReg ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add button */}
          {!regForm && (
            <Button variant="outline" onClick={() => openRegForm()} className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add Registration Record
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog - scoped to the section whose pencil was clicked */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editSection === 'health' ? 'Edit Health & Medical' : 'Edit Pet Details'}</DialogTitle>
          </DialogHeader>

          {editSection === 'details' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Species</Label>
                  <Select value={editForm.species || ''} onValueChange={v => setEditForm({ ...editForm, species: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Breed</Label>
                  <Input value={editForm.breed || ''} onChange={e => setEditForm({ ...editForm, breed: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={editForm.gender || ''} onValueChange={v => setEditForm({ ...editForm, gender: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="desexed">Desexed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.1" value={editForm.weight || ''} onChange={e => setEditForm({ ...editForm, weight: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input value={editForm.color || ''} onChange={e => setEditForm({ ...editForm, color: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <DatePicker value={editForm.date_of_birth || ''} onChange={v => setEditForm({ ...editForm, date_of_birth: v })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Microchip ID</Label>
                  <Input value={editForm.microchip_id || ''} onChange={e => setEditForm({ ...editForm, microchip_id: e.target.value })} placeholder="15-digit chip number" className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tag / Collar ID</Label>
                  <Input value={editForm.tag_number || ''} onChange={e => setEditForm({ ...editForm, tag_number: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Special Flag</Label>
                  <Select value={editForm.special_flag || ''} onValueChange={v => setEditForm({ ...editForm, special_flag: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                      <SelectItem value="senior">Senior Pet</SelectItem>
                      <SelectItem value="first_visit">First Visit</SelectItem>
                      <SelectItem value="matting">Matting</SelectItem>
                      <SelectItem value="anxious">Anxious</SelectItem>
                      <SelectItem value="medical">Medical Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Special Notes</Label>
                <Textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Handling tips, things to remember..." rows={2} className="mt-1.5" />
              </div>
            </div>
          )}

          {editSection === 'health' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div><Label>Desexed</Label></div>
                <Switch checked={editForm.desexed_status ?? false} onCheckedChange={v => setEditForm({ ...editForm, desexed_status: v })} />
              </div>
              {editForm.desexed_status && (
                <div>
                  <Label>Desexed date</Label>
                  <DatePicker value={editForm.desexed_date || ''} onChange={v => setEditForm({ ...editForm, desexed_date: v })} className="mt-1.5" />
                </div>
              )}
              <div>
                <Label>Allergies</Label>
                <Input value={editForm.allergy || ''} onChange={e => setEditForm({ ...editForm, allergy: e.target.value })} placeholder="e.g. Chicken, fragrances, certain shampoos" className="mt-1.5" />
                <p className="text-xs text-slate-400 mt-1">Drives allergy alerts on the dashboard</p>
              </div>
              <div>
                <Label>Medical conditions</Label>
                <Textarea value={editForm.medical_conditions || ''} onChange={e => setEditForm({ ...editForm, medical_conditions: e.target.value })} placeholder="Chronic or pre-existing: heart condition, arthritis, epilepsy..." rows={2} className="mt-1.5" />
              </div>
              <div>
                <Label>Current medications</Label>
                <Textarea value={editForm.medications || ''} onChange={e => setEditForm({ ...editForm, medications: e.target.value })} placeholder="Name, dose, frequency" rows={2} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dietary requirements</Label>
                  <Input value={editForm.dietary_requirements || ''} onChange={e => setEditForm({ ...editForm, dietary_requirements: e.target.value })} placeholder="Prescription diet, allergies" className="mt-1.5" />
                </div>
                <div>
                  <Label>Distinctive markings</Label>
                  <Input value={editForm.distinctive_markings || ''} onChange={e => setEditForm({ ...editForm, distinctive_markings: e.target.value })} placeholder="Identification for claims" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Behaviour / handling notes</Label>
                <Textarea value={editForm.behavioural_notes || ''} onChange={e => setEditForm({ ...editForm, behavioural_notes: e.target.value })} placeholder="Bite risk, anxiety, muzzle required, sedation history..." rows={2} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Regular vet clinic</Label>
                  <Input value={editForm.vet_clinic_name || ''} onChange={e => setEditForm({ ...editForm, vet_clinic_name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Vet phone</Label>
                  <Input value={editForm.vet_phone || ''} onChange={e => setEditForm({ ...editForm, vet_phone: e.target.value })} className="mt-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Insurance provider</Label>
                  <Input value={editForm.insurance_provider || ''} onChange={e => setEditForm({ ...editForm, insurance_provider: e.target.value })} placeholder="e.g. Bow Wow Meow, RSPCA" className="mt-1.5" />
                </div>
                <div>
                  <Label>Policy number</Label>
                  <Input value={editForm.insurance_policy_number || ''} onChange={e => setEditForm({ ...editForm, insurance_policy_number: e.target.value })} className="mt-1.5" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePet} disabled={savingPet} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {savingPet ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grooming note add / edit */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{noteForm.id ? 'Edit Grooming Note' : 'Add Grooming Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Coat condition</Label>
              <Input value={noteForm.coat_condition || ''} onChange={e => setNoteForm({ ...noteForm, coat_condition: e.target.value })} placeholder="e.g. Matted behind ears, healthy" className="mt-1.5" />
            </div>
            <div>
              <Label>Note</Label>
              <Textarea value={noteForm.groomer_notes || ''} onChange={e => setNoteForm({ ...noteForm, groomer_notes: e.target.value })} placeholder="Observations, handling notes, products used..." rows={4} className="mt-1.5" />
            </div>
            <div>
              <Label>Next recommended visit</Label>
              <DatePicker value={noteForm.next_recommended_date || ''} onChange={v => setNoteForm({ ...noteForm, next_recommended_date: v })} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={savingNote} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || <span className="text-slate-300">{'\u2014'}</span>}</span>
    </div>
  );
}
