import React, { useState, useEffect } from 'react';
import publicApi from '@/lib/publicApi';
import {
  X, Phone, User, PawPrint, Search, Check, ChevronLeft, ChevronRight,
  Clock, Calendar, Loader2, CheckCircle2, Plus, AlertCircle
} from 'lucide-react';

const STEPS = ['Your Details', 'Select Pet', 'Choose Service', 'Pick Time'];

export default function BookingModal({ slug, site, preselectedServiceId, onClose, embedded = false }) {
  const themeColor = site.website_theme_color || '#2563EB';
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Client details
  const [phone, setPhone] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  const [clientFound, setClientFound] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState(null);
  const [clientEmail, setClientEmail] = useState('');
  const [existingPets, setExistingPets] = useState([]);
  // New client fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Step 2: Pet
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [addingNewPet, setAddingNewPet] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('Dog');
  const [newPetBreed, setNewPetBreed] = useState('');

  // Step 3: Services
  const [selectedServiceIds, setSelectedServiceIds] = useState(
    preselectedServiceId ? [preselectedServiceId] : []
  );

  // Step 4: Date & Time
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState('');

  // Booking result
  const [bookingResult, setBookingResult] = useState(null);

  const services = site.services || [];
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  // Phone lookup
  const handlePhoneLookup = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.post(`/site/${slug}/lookup`, { phone: phone.trim() });
      setLookupDone(true);
      if (res.data.found) {
        setClientFound(true);
        setClientName(res.data.client_name);
        setClientId(res.data.client_id);
        setExistingPets(res.data.pets || []);
      } else {
        setClientFound(false);
      }
    } catch (e) {
      setError('Failed to look up phone number. Please try again.');
    }
    setLoading(false);
  };

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || step !== 3) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const duration = totalDuration || 30;
        const res = await publicApi.get(`/site/${slug}/slots?date=${selectedDate}&duration=${duration}`);
        setSlots(res.data || []);
      } catch (e) {
        setSlots([]);
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedDate, step, slug, totalDuration]);

  // Generate calendar dates (next 30 days)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        value: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return dates;
  };

  const dates = generateDates();

  // Submit booking
  const handleBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const bookingData = {
        service_ids: selectedServiceIds,
        date: selectedDate,
        start_time: selectedSlot.start_time,
        notes: notes || null,
      };

      if (clientFound && clientId) {
        bookingData.client_id = clientId;
        bookingData.client_phone = phone;
        if (selectedPetId) {
          bookingData.pet_id = selectedPetId;
        } else if (newPetName) {
          bookingData.pet_name = newPetName;
          bookingData.pet_species = newPetSpecies;
          bookingData.pet_breed = newPetBreed || null;
        }
      } else {
        bookingData.client_name = newClientName;
        bookingData.client_phone = phone;
        bookingData.client_email = newClientEmail || null;
        bookingData.pet_name = newPetName;
        bookingData.pet_species = newPetSpecies;
        bookingData.pet_breed = newPetBreed || null;
      }

      const res = await publicApi.post(`/site/${slug}/book`, bookingData);
      setBookingResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to book appointment. Please try again.');
    }
    setLoading(false);
  };

  const canProceedStep0 = lookupDone && (clientFound || (newClientName.trim() && phone.trim()));
  const canProceedStep1 = selectedPetId || (newPetName.trim());
  const canProceedStep2 = selectedServiceIds.length > 0;
  const canProceedStep3 = selectedDate && selectedSlot;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleBook();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Success screen
  if (bookingResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: themeColor }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-6">{bookingResult.message}</p>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-medium text-slate-900">{bookingResult.start_time}</span>
            </div>
            {bookingResult.staff_name && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stylist</span>
                <span className="font-medium text-slate-900">{bookingResult.staff_name}</span>
              </div>
            )}
            {bookingResult.services?.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Services</span>
                <span className="font-medium text-slate-900 text-right">{bookingResult.services.join(', ')}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: themeColor }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"} onClick={embedded ? undefined : onClose}>
      <div className={`bg-white ${embedded ? 'rounded-2xl shadow-xl border border-slate-100' : 'rounded-2xl max-w-lg w-full max-h-[90vh]'} overflow-hidden flex flex-col animate-fade-in`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
          {!embedded && onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 px-6 py-3 bg-slate-50/80">
          {STEPS.map((label, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className="flex items-center gap-1.5 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    idx < step ? 'text-white' : idx === step ? 'text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                  style={idx <= step ? { backgroundColor: themeColor } : {}}
                >
                  {idx < step ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span className={`text-xs hidden sm:block ${idx === step ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded ${idx < step ? '' : 'bg-slate-200'}`}
                  style={idx < step ? { backgroundColor: themeColor } : {}}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 0: Phone Lookup */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setLookupDone(false); setClientFound(false); }}
                    placeholder="Enter your phone number"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': themeColor }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneLookup()}
                  />
                  <button
                    onClick={handlePhoneLookup}
                    disabled={!phone.trim() || loading}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: themeColor }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {lookupDone && clientFound && (
                <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Welcome back, {clientName}!</p>
                    <p className="text-xs text-green-600">We found your account.</p>
                  </div>
                </div>
              )}

              {lookupDone && !clientFound && (
                <div className="space-y-3">
                  <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">New here? Let's get you set up.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (optional)</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Select Pet */}
          {step === 1 && (
            <div className="space-y-3">
              {existingPets.length > 0 && !addingNewPet && (
                <>
                  <p className="text-sm text-slate-500 mb-2">Select your pet</p>
                  {existingPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => { setSelectedPetId(pet.id); setAddingNewPet(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                        selectedPetId === pet.id ? 'border-current' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={selectedPetId === pet.id ? { borderColor: themeColor } : {}}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                        <PawPrint className="h-5 w-5" style={{ color: themeColor }} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{pet.name}</p>
                        <p className="text-xs text-slate-400">{[pet.species, pet.breed].filter(Boolean).join(' · ')}</p>
                      </div>
                      {selectedPetId === pet.id && (
                        <Check className="h-5 w-5 ml-auto" style={{ color: themeColor }} />
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => { setAddingNewPet(true); setSelectedPetId(null); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-500">Add a new pet</span>
                  </button>
                </>
              )}

              {(existingPets.length === 0 || addingNewPet) && (
                <div className="space-y-3">
                  {addingNewPet && (
                    <button onClick={() => setAddingNewPet(false)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                      <ChevronLeft className="h-3 w-3" /> Back to your pets
                    </button>
                  )}
                  <p className="text-sm text-slate-500">Tell us about your pet</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pet Name *</label>
                    <input
                      type="text"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="Your pet's name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Species</label>
                    <div className="flex gap-2">
                      {['Dog', 'Cat', 'Bird', 'Other'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setNewPetSpecies(s)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                            newPetSpecies === s ? 'text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                          style={newPetSpecies === s ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Breed (optional)</label>
                    <input
                      type="text"
                      value={newPetBreed}
                      onChange={(e) => setNewPetBreed(e.target.value)}
                      placeholder="e.g. Golden Retriever"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose Services */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">Select the services you need</p>
              {services.map((svc) => {
                const selected = selectedServiceIds.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedServiceIds(prev =>
                        selected ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                      );
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                      selected ? '' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={selected ? { borderColor: themeColor, backgroundColor: themeColor + '08' } : {}}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'text-white' : 'border-slate-300'
                      }`}
                      style={selected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{svc.name}</p>
                      {svc.description && <p className="text-xs text-slate-400 line-clamp-1">{svc.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {site.show_prices && svc.price > 0 && (
                        <p className="font-bold text-sm" style={{ color: themeColor }}>${svc.price}</p>
                      )}
                      <p className="text-xs text-slate-400">{svc.duration_minutes} min</p>
                    </div>
                  </button>
                );
              })}

              {selectedServiceIds.length > 0 && (
                <div className="mt-4 bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''} · {totalDuration} min
                  </span>
                  {site.show_prices && totalPrice > 0 && (
                    <span className="font-bold" style={{ color: themeColor }}>${totalPrice}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {dates.slice(0, 14).map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`flex-shrink-0 w-16 py-2 rounded-xl border-2 text-center transition-colors ${
                        selectedDate === d.value ? 'text-white' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={selectedDate === d.value ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                    >
                      <div className={`text-[10px] ${selectedDate === d.value ? 'text-white/80' : 'text-slate-400'}`}>
                        {d.day}
                      </div>
                      <div className="text-lg font-bold">{d.date}</div>
                      <div className={`text-[10px] ${selectedDate === d.value ? 'text-white/80' : 'text-slate-400'}`}>
                        {d.month}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Available Times</label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: themeColor }} />
                    </div>
                  ) : slots.filter(s => s.available).length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No available slots for this date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.filter(s => s.available).map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                            selectedSlot?.start_time === slot.start_time
                              ? 'text-white'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                          style={selectedSlot?.start_time === slot.start_time ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                        >
                          {slot.start_time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
                  />
                  {selectedSlot.staff_name && (
                    <p className="text-xs text-slate-400 mt-2">
                      You'll be served by <span className="font-medium text-slate-600">{selectedSlot.staff_name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={
              loading ||
              (step === 0 && !canProceedStep0) ||
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2) ||
              (step === 3 && !canProceedStep3)
            }
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
            style={{ backgroundColor: themeColor }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === 3 ? (
              <>Confirm Booking <CheckCircle2 className="h-4 w-4" /></>
            ) : (
              <>Next <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
