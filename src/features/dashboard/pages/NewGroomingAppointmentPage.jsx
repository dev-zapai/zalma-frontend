import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  ArrowLeft, Phone, PawPrint, Scissors, Clock, CheckCircle2, Plus,
  Loader2, Search, CalendarCheck, UserPlus, Zap, Hourglass
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatPrice } from '@/shared/lib/currency';
import { salonTodayISO, salonNowTime } from '@/shared/lib/salonTime';

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'other', label: 'Other' },
];

export default function NewGroomingAppointmentPage() {
  const navigate = useNavigate();
  // Allow other pages (e.g. AvailabilityPage day-column click) to deep-link
  // into the booking flow with the date pre-selected.
  const [searchParams] = useSearchParams();

  // Step: 1 = Client lookup, 2 = Services, 3 = Date & Slot
  const [step, setStep] = useState(1);

  // Client state
  const [phoneLookup, setPhoneLookup] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [foundClient, setFoundClient] = useState(null);
  const [foundPets, setFoundPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('dog');

  // Services
  const [allServices, setAllServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [salonTz, setSalonTz] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [currency, setCurrency] = useState('AUD');

  // Date & Slot
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || '');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Notes & booking
  const [bookNotes, setBookNotes] = useState('');

  // Waitlist CTA state (when no slots available)
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistWindow, setWaitlistWindow] = useState('any');
  const [waitlistFlex, setWaitlistFlex] = useState(0);
  const [waitlistNotes, setWaitlistNotes] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Creating new pet for existing client
  const [addingNewPet, setAddingNewPet] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('dog');

  // Load services & tenant on mount, and auto-lookup client if client_id is provided
  useEffect(() => {
    const preselectedClientId = searchParams.get('client_id');
    Promise.all([
      api.get('/services', { params: { limit: 200 } }),
      api.get('/tenant/me'),
      api.get('/service-bundles').catch(() => ({ data: [] })),
      ...(preselectedClientId
        ? [
            api.get(`/clients/${preselectedClientId}`),
            api.get(`/clients/${preselectedClientId}/pets`, { params: { limit: 200 } }),
          ]
        : []),
    ]).then(([svcRes, tenantRes, bundleRes, clientRes, petsRes]) => {
      const svcData = svcRes.data;
      const items = Array.isArray(svcData) ? svcData : (svcData?.items || []);
      setAllServices(items);
      setCurrency(tenantRes.data?.settings?.currency || 'AUD');
      setSalonTz(tenantRes.data?.timezone || null);
      setBundles((bundleRes?.data || []).filter(b => b.is_active !== false));

      // If client was pre-selected via ?client_id=...
      if (clientRes?.data) {
        setFoundClient(clientRes.data);
        setPhoneLookup(clientRes.data.phone || '');
        const petsList = Array.isArray(petsRes?.data)
          ? petsRes.data
          : (petsRes?.data?.items || []);
        setFoundPets(petsList);
        if (petsList.length === 1) {
          // Single pet → auto-select and skip straight to Step 2 (Services)
          setSelectedPet(petsList[0]);
          setStep(2);
        }
        // Multiple pets → stay on Step 1 so the user can pick which pet
        // the appointment is for. The client is already loaded so the
        // phone-lookup section won't render; just the pet selection shows.
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phone Lookup ──
  const handlePhoneLookup = async () => {
    if (!phoneLookup || phoneLookup.length < 3) return;
    setLookingUp(true);
    try {
      const res = await api.get('/clients/lookup', { params: { phone: phoneLookup } });
      if (res.data.found) {
        setFoundClient(res.data.client);
        setFoundPets(res.data.pets || []);
        setIsNewClient(false);
        // If only one pet, auto-select
        if (res.data.pets?.length === 1) {
          setSelectedPet(res.data.pets[0]);
        }
      } else {
        setFoundClient(null);
        setFoundPets([]);
        setIsNewClient(true);
      }
    } catch {
      toast.error('Lookup failed');
    }
    setLookingUp(false);
  };

  // ── Total duration from selected services ──
  const totalDuration = selectedServices.reduce((sum, id) => {
    const s = allServices.find(sv => sv.id === id);
    return sum + (s?.duration_minutes || 30);
  }, 0) || 30;

  const totalPrice = selectedServices.reduce((sum, id) => {
    const s = allServices.find(sv => sv.id === id);
    return sum + (parseFloat(s?.price) || 0);
  }, 0);

  // ── Fetch multi-service slots when date changes ──
  // Each slot returned from /multi-auto-slots includes a per-service
  // allocation plan (staff_id + start/end per service) so different services
  // in the same booking can go to different groomers based on capability
  // and availability — see backend `_try_allocate_multi`.
  useEffect(() => {
    if (!selectedDate || selectedServices.length === 0) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedSlot(null);
    api.get('/g/appointments/multi-auto-slots', {
      params: {
        date: selectedDate,
        service_ids: selectedServices.join(','),
      }
    }).then(res => {
      setSlots(res.data || []);
    }).catch(err => {
      // A server error is NOT the same as a fully booked day - say so,
      // instead of silently showing "No slots available".
      console.error(err);
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not load available slots. Please try again.');
      setSlots([]);
    })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedServices]);

  // ── Add new pet for existing client ──
  const handleAddNewPet = async () => {
    if (!foundClient || !newPetName) return;
    setSaving(true);
    try {
      const res = await api.post('/pets', {
        owner_id: foundClient.id,
        name: newPetName,
        species: newPetSpecies,
      });
      setFoundPets(prev => [...prev, res.data]);
      setSelectedPet(res.data);
      setAddingNewPet(false);
      setNewPetName('');
      toast.success('Pet added');
    } catch {
      toast.error('Failed to add pet');
    }
    setSaving(false);
  };

  // ── Book appointment ──
  // Uses the /multi-book endpoint which atomically creates the appointment
  // + per-service rows with each service's auto-allocated groomer +
  // start/end, and re-verifies the slot server-side (409 if it was taken).
  // Brand-new clients are provisioned directly via /clients + /pets - the
  // old quick-book placeholder hack billed every new-client booking twice.
  const handleBook = async () => {
    if (selectedServices.length === 0 || !selectedSlot) return;
    if (!selectedSlot.allocations?.length) {
      toast.error('No staff allocation available for this slot');
      return;
    }
    setSaving(true);
    try {
      let clientId = foundClient?.id;
      let petId = selectedPet?.id;

      if (!clientId) {
        const clientRes = await api.post('/clients', {
          full_name: clientName,
          phone: phoneLookup || null,
        });
        clientId = clientRes.data.id;
        // Walk-in style booking: the client completes their profile at
        // check-in, so mark them pending like quick-book used to.
        await api.put(`/clients/${clientId}`, { registration_status: 'pending' }).catch(() => {});
        if (petName) {
          const petRes = await api.post('/pets', {
            owner_id: clientId,
            name: petName,
            species: petSpecies || 'Dog',
          });
          petId = petRes.data.id;
        }
      }

      const res = await api.post('/g/appointments/multi-book', {
        client_id: clientId,
        pet_id: petId || null,
        date: selectedDate,
        notes: bookNotes || null,
        allocations: selectedSlot.allocations.map(a => ({
          service_id: a.service_id,
          staff_id: a.staff_id,
          start_time: a.start_time,
          end_time: a.end_time,
          duration_minutes: a.duration_minutes,
          name: a.name,
          unit_price: a.unit_price,
        })),
      });

      toast.success(
        foundClient
          ? 'Appointment booked!'
          : 'Appointment booked (registration pending)'
      );
      // If we came from a client page, go back to it so the admin can see
      // the updated appointment list for that client. Otherwise open the
      // appointment detail as before.
      const cid = searchParams.get('client_id');
      navigate(cid ? `/dashboard/clients/${cid}` : `/dashboard/appointments/${res.data.id}/detail`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book appointment');
    }
    setSaving(false);
  };

  const canProceedToStep2 = foundClient
    ? !!selectedPet
    : (!!clientName && !!petName);

  const canProceedToStep3 = selectedServices.length > 0;

  const stepLabels = ['Client & Pet', 'Services', 'Date & Book'];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => {
          // Go back to the client page if we came from one, otherwise to
          // the appointments list. This way "Book Appointment" from a
          // client profile → back arrow → lands back on that client.
          const cid = searchParams.get('client_id');
          navigate(cid ? `/dashboard/clients/${cid}` : '/dashboard/appointments');
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Appointment</h1>
          <p className="text-sm text-slate-500">Book a grooming appointment</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s ? 'bg-green-500 text-white' : step === s ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <span className={`text-sm hidden sm:inline ${step === s ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {s < 3 && <div className={`h-px flex-1 ${step > s ? 'bg-green-300' : 'bg-slate-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ═══ Step 1: Client & Pet ═══ */}
      {step === 1 && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600" /> Find Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Phone lookup */}
            <div>
              <Label>Client Phone Number</Label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. 9876543210"
                    value={phoneLookup}
                    onChange={e => setPhoneLookup(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePhoneLookup()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handlePhoneLookup} disabled={lookingUp || phoneLookup.length < 3} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Search</>}
                </Button>
              </div>
            </div>

            {/* Client found */}
            {foundClient && !isNewClient && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Client Found</span>
                  </div>
                  <p className="text-sm font-medium text-green-700">{foundClient.full_name}</p>
                  <p className="text-xs text-green-600">{foundClient.phone}{foundClient.email ? ` · ${foundClient.email}` : ''}</p>
                </div>

                {/* Pet selection */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <PawPrint className="h-4 w-4 text-amber-600" /> Select Pet
                  </Label>
                  {foundPets.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {foundPets.map(pet => (
                        <button
                          key={pet.id}
                          onClick={() => setSelectedPet(pet)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            selectedPet?.id === pet.id
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <PawPrint className={`h-5 w-5 ${selectedPet?.id === pet.id ? 'text-amber-600' : 'text-slate-400'}`} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{pet.name}</p>
                              <p className="text-xs text-slate-500 capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {foundPets.length === 0 && !addingNewPet && (
                    <p className="text-sm text-slate-400 mt-2">No pets registered for this client.</p>
                  )}

                  {!addingNewPet ? (
                    <Button variant="outline" onClick={() => setAddingNewPet(true)} className="w-full mt-3 gap-1.5">
                      <Plus className="h-4 w-4" /> Add New Pet
                    </Button>
                  ) : (
                    <div className="mt-3 space-y-3 p-3 bg-slate-50 rounded-lg border">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Pet Name *</Label>
                          <Input value={newPetName} onChange={e => setNewPetName(e.target.value)} placeholder="e.g. Buddy" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Species *</Label>
                          <Select value={newPetSpecies} onValueChange={setNewPetSpecies}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SPECIES_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAddingNewPet(false)} className="flex-1">Cancel</Button>
                        <Button size="sm" onClick={handleAddNewPet} disabled={saving || !newPetName} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                          {saving ? 'Adding...' : 'Add Pet'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client NOT found - quick book entry */}
            {isNewClient && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">No client found for {phoneLookup}</p>
                    <p className="text-xs text-amber-600">Enter minimal info below. Full registration at check-in.</p>
                  </div>
                </div>
                <div>
                  <Label>Client Name *</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. John Smith" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pet Name *</Label>
                    <Input value={petName} onChange={e => setPetName(e.target.value)} placeholder="e.g. Buddy" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Pet Type *</Label>
                    <Select value={petSpecies} onValueChange={setPetSpecies}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPECIES_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Continue button */}
            {(foundClient || isNewClient) && (
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11"
              >
                Continue to Select Services
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Step 2: Services ═══ */}
      {step === 2 && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4 text-amber-600" /> Select Services
            </CardTitle>
            {/* Summary badge */}
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border rounded-full text-xs">
                {foundClient ? foundClient.full_name : clientName} · {selectedPet?.name || petName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Select one or more services for this appointment.</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(() => {
                const petSpecies = (selectedPet?.species || newPetSpecies || '').toLowerCase();
                const speciesList = (svc) => {
                  // compatible_species is a JSON array from the API; be
                  // defensive about a raw JSON string from older rows.
                  let list = svc.compatible_species;
                  if (typeof list === 'string') {
                    try { list = JSON.parse(list); } catch { list = null; }
                  }
                  return Array.isArray(list) ? list.map(s => String(s).toLowerCase()) : [];
                };
                const isCompatible = (svc) => {
                  const list = speciesList(svc);
                  return list.length === 0 || !petSpecies || list.includes(petSpecies);
                };

                const bundleBlocks = bundles.map(b => {
                  const itemIds = (b.items || []).map(i => i.service_id).filter(Boolean);
                  if (itemIds.length === 0) return null;
                  const memberSvcs = itemIds.map(id => allServices.find(s => s.id === id)).filter(Boolean);
                  const bundleCompatible = memberSvcs.every(isCompatible);
                  const allSelected = itemIds.every(id => selectedServices.includes(id));
                  return (
                    <label
                      key={`bundle-${b.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        !bundleCompatible
                          ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                          : allSelected
                            ? 'border-amber-500 bg-amber-50 cursor-pointer'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        disabled={!bundleCompatible}
                        onChange={() => {
                          setSelectedServices(prev => allSelected
                            ? prev.filter(id => !itemIds.includes(id))
                            : [...new Set([...prev, ...itemIds])]);
                          setSelectedSlot(null);
                        }}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          {b.name}
                          <Badge className="rounded-full text-[10px] bg-violet-100 text-violet-700 border-violet-200 border">Bundle</Badge>
                          {!bundleCompatible && (
                            <Badge className="rounded-full text-[10px] bg-slate-100 text-slate-500 border-slate-200 border capitalize">
                              Not for {petSpecies || 'this pet'}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(b.items || []).map(i => i.service_name).filter(Boolean).join(' + ')}
                          {b.total_duration ? ` · ${b.total_duration} min` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{formatPrice(b.bundle_price, currency)}</span>
                    </label>
                  );
                });

                const serviceBlocks = allServices.map(svc => {
                  const compatible = isCompatible(svc);
                  const checked = selectedServices.includes(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        !compatible
                          ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                          : checked
                            ? 'border-amber-500 bg-amber-50 cursor-pointer'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!compatible}
                        onChange={() => {
                          setSelectedServices(prev =>
                            checked ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                          );
                          setSelectedSlot(null);
                        }}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          {svc.name}
                          {!compatible && (
                            <Badge className="rounded-full text-[10px] bg-slate-100 text-slate-500 border-slate-200 border capitalize">
                              Not for {petSpecies || 'this pet'}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{svc.duration_minutes} min</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{formatPrice(svc.price, currency)}</span>
                    </label>
                  );
                });

                return [...bundleBlocks, ...serviceBlocks];
              })()}
              {allServices.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No services configured. Add services in Settings.</p>
              )}
            </div>

            {selectedServices.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-amber-800">
                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} · {totalDuration} min
                </span>
                <span className="text-sm font-bold text-amber-800">{formatPrice(totalPrice, currency)}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-11"
              >
                Continue to Select Slot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Step 3: Date & Slot & Book ═══ */}
      {step === 3 && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-amber-600" /> Choose Date & Time
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border rounded-full text-xs">
                {foundClient ? foundClient.full_name : clientName} · {selectedPet?.name || petName}
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 border rounded-full text-xs">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} · {totalDuration} min · {formatPrice(totalPrice, currency)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Select Date *</Label>
              <Input
                type="date"
                value={selectedDate}
                min={salonTodayISO(salonTz)}
                onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                className="mt-1.5"
              />
              {salonTz && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Salon local time: {salonNowTime(salonTz)} ({salonTz.split('/').pop().replace('_', ' ')})
                </p>
              )}
            </div>

            {/* Available slots */}
            {selectedDate && (
              <div>
                <Label className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5 text-amber-600" /> Available Slots
                </Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : slots.filter(s => s.available).length === 0 ? (
                  <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <Hourglass className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">No slots available on this date</p>
                      {selectedDate === salonTodayISO(salonTz) && (
                        <p className="text-xs text-amber-700 mt-1">
                          It's already {salonNowTime(salonTz)} at the salon - only times later
                          today can be offered. Try tomorrow for the full day.
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Join the waitlist - we'll offer the slot the moment someone cancels.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setWaitlistOpen(true)}
                      disabled={!foundClient || selectedServices.length === 0}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Hourglass className="h-3.5 w-3.5 mr-1.5" /> Join Waitlist
                    </Button>
                    {(!foundClient || selectedServices.length === 0) && (
                      <p className="text-[10px] text-slate-400">Pick client + services first.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                    {slots.filter(s => s.available).map((slot, i) => {
                      const distinctStaff = slot.staff || [];
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-2 rounded-lg text-sm font-medium text-center border-2 transition-all ${
                            selectedSlot?.start_time === slot.start_time
                              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50'
                          }`}
                        >
                          <div>{slot.start_time}</div>
                          {distinctStaff.length > 0 && (
                            <div className={`text-[10px] mt-0.5 truncate ${
                              selectedSlot?.start_time === slot.start_time
                                ? 'text-amber-50'
                                : 'text-slate-400'
                            }`}>
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

            {/* Per-service auto-allocation breakdown */}
            {selectedSlot && (selectedSlot.allocations?.length > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Staff auto-assigned per service
                </div>
                <div className="space-y-1.5">
                  {selectedSlot.allocations.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white rounded px-2.5 py-1.5 border border-green-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{a.name || 'Service'}</p>
                        <p className="text-slate-500">{a.start_time} – {a.end_time} · {a.duration_minutes} min</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 border rounded-full text-[10px] ml-2">
                        {a.staff_name}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-green-700 italic">
                  Continuity-preferred: same groomer used wherever they're capable and free, otherwise assigned to another capable groomer.
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedSlot && (
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={bookNotes}
                  onChange={e => setBookNotes(e.target.value)}
                  placeholder="Any special instructions or notes..."
                  rows={2}
                  className="mt-1.5"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleBook}
                disabled={saving || !selectedSlot}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-11"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Booking...</> : 'Book Appointment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join-waitlist dialog - shown when the picked date has no free slots. */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hourglass className="h-5 w-5 text-amber-600" /> Join Waitlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-slate-500">
              {foundClient?.full_name ? <strong>{foundClient.full_name}</strong> : 'Client'} for{' '}
              {selectedPet?.name && <strong>{selectedPet.name}</strong>} on{' '}
              <strong>{selectedDate}</strong>. When a slot frees up we'll auto-offer it - you have 30 minutes to accept.
            </p>
            <div>
              <Label>Preferred Time Window</Label>
              <Select value={waitlistWindow} onValueChange={setWaitlistWindow}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Anytime</SelectItem>
                  <SelectItem value="morning">Morning (before 12)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 – 5)</SelectItem>
                  <SelectItem value="evening">Evening (after 5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Flexibility (± days)</Label>
              <Input type="number" min="0" max="14" value={waitlistFlex}
                     onChange={e => setWaitlistFlex(parseInt(e.target.value || '0', 10))}
                     className="mt-1.5" />
              <p className="text-[10px] text-slate-400 mt-1">0 = strict, N = also consider N days before/after</p>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={waitlistNotes}
                        onChange={e => setWaitlistNotes(e.target.value)}
                        placeholder="Any constraints we should know about"
                        className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaitlistOpen(false)}>Cancel</Button>
            <Button
              disabled={waitlistSubmitting}
              onClick={async () => {
                if (!foundClient || selectedServices.length === 0 || !selectedDate) return;
                setWaitlistSubmitting(true);
                try {
                  await api.post('/g/waitlist', {
                    client_id: foundClient.id,
                    pet_id: selectedPet?.id || null,
                    service_ids: selectedServices,
                    preferred_date: selectedDate,
                    preferred_window: waitlistWindow,
                    flexibility_days: waitlistFlex,
                    notes: waitlistNotes || null,
                  });
                  toast.success('Added to waitlist');
                  setWaitlistOpen(false);
                  navigate('/dashboard/waitlist');
                } catch (e) {
                  toast.error(e.response?.data?.detail || 'Failed to join waitlist');
                }
                setWaitlistSubmitting(false);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {waitlistSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Joining…</> : 'Confirm Waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
