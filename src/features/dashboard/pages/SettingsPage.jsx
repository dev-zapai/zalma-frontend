import React, { useState, useEffect } from 'react';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Building2, Save, Check, Palette, Receipt, DollarSign, Clock, CreditCard, MessageSquare, ShieldCheck, AlertTriangle, Users, Plus, Trash2, Landmark, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { THEME_PRESETS, applyThemeColor } from '@/shared/lib/theme';
import { CURRENCIES } from '@/shared/lib/currency';
import AddressMapPicker from '@/shared/components/maps/AddressMapPicker';
import AuAddressForm from '@/shared/components/AuAddressForm';
import { composeStreetLine, isValidPostcode, formatFullAddress } from '@/shared/lib/auAddress';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];
const DEFAULT_HOURS = DAYS.reduce((acc, d) => {
  acc[d.key] = { open: '09:00', close: '17:00', closed: d.key === 'sun' };
  return acc;
}, {});

export default function SettingsPage() {
  const { profile } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'pet_grooming', email: '', phone: '', theme_color: '#2563EB' });

  // Salon location & address - structured AU components + map pin.
  // The composed street line is written to tenant.address; the raw parts are
  // kept in settings.address_parts so re-editing shows the split fields.
  const [salonAddr, setSalonAddr] = useState({
    unit: '', address: '', suburb: '', state: '', postcode: '',
    latitude: null, longitude: null,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  // The full address editor (map + fields) opens as a window from the
  // Business Details address field. It edits a draft; saving commits.
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [addrDraft, setAddrDraft] = useState(null);
  const [receiptConfig, setReceiptConfig] = useState({
    tagline: '', show_logo: true, tax_rate: 0, footer_text: '', terms: '', social_handles: '', next_visit_message: '',
  });
  const [currency, setCurrency] = useState('AUD');
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [gstRegistered, setGstRegistered] = useState(false);
  const [abnError, setAbnError] = useState(false);
  const [gstRate, setGstRate] = useState(10);
  const [savingGst, setSavingGst] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  // Staff roles
  const [roles, setRoles] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', color: '#6366F1' });

  // Payment terminals (EFTPOS)
  const [terminals, setTerminals] = useState([]);
  const [savingTerminals, setSavingTerminals] = useState(false);

  // Calendar hours - the visible envelope of the Availability calendar grid
  const [calHourStart, setCalHourStart] = useState(6);
  const [calHourEnd, setCalHourEnd] = useState(23);

  // Conflict check for closing a day
  const [conflictDialog, setConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [pendingDayKey, setPendingDayKey] = useState(null);

  const isAdmin = profile?.is_admin || profile?.role === 'admin';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/tenant/me');
        setTenant(res.data);
        setForm({ name: res.data.name, type: res.data.type || 'pet_grooming', email: res.data.email || '', phone: res.data.phone || '', theme_color: res.data.theme_color || '#2563EB' });
        // Hydrate the salon address - prefer the structured parts saved by
        // this card; fall back to the flat tenant columns for older data.
        const parts = res.data.settings?.address_parts;
        setSalonAddr({
          unit: parts?.unit || '',
          address: parts?.street ?? res.data.address ?? '',
          suburb: parts?.suburb ?? res.data.city ?? '',
          state: parts?.state ?? res.data.state ?? '',
          postcode: parts?.postcode ?? res.data.postal_code ?? '',
          latitude: res.data.latitude ?? null,
          longitude: res.data.longitude ?? null,
        });
        const rc = res.data.settings?.receipt_config || {};
        setReceiptConfig({
          tagline: rc.tagline || '',
          show_logo: rc.show_logo !== false,
          tax_rate: rc.tax_rate ?? 0,
          footer_text: rc.footer_text || '',
          terms: rc.terms || '',
          social_handles: rc.social_handles || '',
          next_visit_message: rc.next_visit_message || '',
          // ABN lives in receipt_config too. Omitting it here made the field
          // look empty after every reload AND let the Receipt Template save
          // (which writes this whole state back) silently wipe the stored ABN.
          abn: rc.abn || '',
        });
        setCurrency(res.data.settings?.currency || 'AUD');
        setGstRegistered(res.data.settings?.gst_registered || false);
        setGstRate(res.data.settings?.gst_rate ?? 10);
        // Staff roles - seed defaults if none configured
        const savedRoles = res.data.settings?.roles;
        setRoles(savedRoles && savedRoles.length > 0 ? savedRoles : [
          { name: 'Groomer', color: '#6366F1' },
          { name: 'Senior Groomer', color: '#7C3AED' },
          { name: 'Bather', color: '#06B6D4' },
          { name: 'Manager', color: '#F59E0B' },
        ]);
        // Hydrate payment terminals
        setTerminals(res.data.settings?.payment_terminals || []);
        // Hydrate calendar hours (Availability grid envelope)
        const chs = parseInt(res.data.settings?.calendar_hour_start, 10);
        const che = parseInt(res.data.settings?.calendar_hour_end, 10);
        if (Number.isInteger(chs)) setCalHourStart(chs);
        if (Number.isInteger(che)) setCalHourEnd(che);
        // Hydrate salon working hours
        const bh = res.data.business_hours || {};
        const merged = {};
        DAYS.forEach(d => {
          const v = bh[d.key] || {};
          merged[d.key] = {
            open: v.open || DEFAULT_HOURS[d.key].open,
            close: v.close || DEFAULT_HOURS[d.key].close,
            closed: v.closed != null ? v.closed : DEFAULT_HOURS[d.key].closed,
          };
        });
        setHours(merged);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = { ...(tenant?.settings || {}), currency };
      const res = await api.put('/tenant/me', { ...form, settings });
      setTenant(res.data);
      if (res.data.theme_color) applyThemeColor(res.data.theme_color);
      toast.success('Settings saved');
    } catch (e) { toast.error('Failed to save'); }
    setSaving(false);
  };

  // Inverted hours (close at or before open) silently kill every booking
  // slot for that day, so block them client-side too. "00:00" as close is
  // allowed - it means midnight at the end of the day.
  const dayHoursInvalid = (row) => {
    if (!row || row.closed || !row.open || !row.close) return false;
    if (row.close === '00:00') return false;
    return row.close <= row.open;
  };

  return (
    <div data-testid="settings-page" className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your business configuration</p>
      </div>

      {/* Two-column grid - left: business + GST, right: salon working hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="flex flex-col">

          {/* Business Details */}
          {isAdmin && (
            <Card className="rounded-xl border-slate-200/60 flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Business Details</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Salon Name</Label>
                  <Input data-testid="settings-salon-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1.5" /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
                </div>
                <div>
                  <Label>Address</Label>
                  <button
                    type="button"
                    data-testid="settings-address"
                    onClick={() => { setAddrDraft({ ...salonAddr }); setAddrDialogOpen(true); }}
                    className="mt-1.5 w-full text-left text-sm border border-slate-200 rounded-md px-3 py-2 bg-white hover:border-primary/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                    title="Set your salon address on the map"
                  >
                    <span className={`truncate ${formatFullAddress(salonAddr) ? 'text-slate-700' : 'text-slate-400'}`}>
                      {formatFullAddress(salonAddr) || 'Click to set your salon address'}
                    </span>
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                  </button>
                </div>

                {/* Currency */}
                <div>
                  <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 mt-1">Used for displaying prices throughout the app and on receipts</p>
                </div>

                {/* Theme Color */}
                <div>
                  <Label className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Theme Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setForm({ ...form, theme_color: preset.hex })}
                        className="relative w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: preset.hex,
                          borderColor: form.theme_color === preset.hex ? preset.hex : 'transparent',
                          boxShadow: form.theme_color === preset.hex ? `0 0 0 2px white, 0 0 0 4px ${preset.hex}` : 'none',
                        }}
                        title={preset.name}
                      >
                        {form.theme_color === preset.hex && (
                          <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {/* ABN - always visible + required. Printed on every receipt/payslip
                    for AU tax compliance, regardless of whether the salon is GST
                    registered. */}
                <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                  <div>
                    <Label>ABN <span className="text-red-500">*</span></Label>
                    <Input
                      value={receiptConfig.abn || ''}
                      onChange={e => { setReceiptConfig(c => ({ ...c, abn: e.target.value })); setAbnError(false); }}
                      placeholder="51 824 753 556"
                      className={`mt-1.5 ${abnError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {abnError ? (
                      <p className="text-xs text-red-600 mt-1 font-medium">Enter your ABN before saving - the grey text above is only an example.</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">Australian Business Number - required for tax-compliant receipts and payslips.</p>
                    )}
                  </div>

                  {/* GST toggle - controls only the tax rate, ABN stands alone */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> GST Registered</Label>
                      <p className="text-xs text-slate-400 mt-0.5">Auto-fills tax rate on new receipts when enabled</p>
                    </div>
                    <Switch checked={gstRegistered} onCheckedChange={setGstRegistered} />
                  </div>
                  {gstRegistered && (
                    <div>
                      <Label>GST Rate (%)</Label>
                      <Input
                        type="number" step="0.1" min="0" max="100"
                        value={gstRate}
                        onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                        placeholder="10"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-slate-400 mt-1">Standard Australian GST is 10%</p>
                    </div>
                  )}
                </div>

                <Button
                  data-testid="settings-save-btn"
                  onClick={async () => {
                    // Enforce ABN required - tax compliance is not optional
                    const abn = (receiptConfig.abn || '').trim();
                    if (!abn) {
                      setAbnError(true);
                      toast.error('ABN is required. Enter your Australian Business Number to continue.');
                      return;
                    }
                    setSaving(true);
                    try {
                      const settings = { ...(tenant?.settings || {}), currency, gst_registered: gstRegistered, gst_rate: gstRate };
                      // Persist ABN + tax rate into receipt_config so they appear on receipts
                      settings.receipt_config = { ...(settings.receipt_config || {}), abn };
                      if (gstRegistered && gstRate > 0) {
                        settings.receipt_config.tax_rate = gstRate;
                      }
                      const res = await api.put('/tenant/me', { ...form, settings });
                      setTenant(res.data);
                      if (res.data.theme_color) applyThemeColor(res.data.theme_color);
                      if (gstRegistered && gstRate > 0) {
                        setReceiptConfig(c => ({ ...c, tax_rate: gstRate }));
                      }
                      toast.success('Settings saved');
                    } catch (e) { toast.error('Failed to save'); }
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT COLUMN: Salon Working Hours ──────────────── */}
        <div className="flex flex-col">
          {isAdmin && tenant && (
            <Card className="rounded-xl border-slate-200/60 flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Salon Working Hours
                </CardTitle>
                <CardDescription>
                  The days and hours your salon is open. Used by the booking website and as the default envelope for staff schedules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DAYS.map(d => {
                  const row = hours[d.key] || DEFAULT_HOURS[d.key];
                  return (
                    <div
                      key={d.key}
                      className={`grid grid-cols-[110px_90px_1fr_1fr] gap-3 items-center p-2.5 rounded-lg border ${row.closed ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200 bg-white'}`}
                    >
                      <span className="text-sm font-medium text-slate-700">{d.label}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!row.closed}
                          onCheckedChange={async (v) => {
                            if (!v) {
                              // Closing a day - check for conflicts first
                              try {
                                const res = await api.get('/tenant/check-day-conflicts', { params: { day_key: d.key } });
                                if (res.data.conflict_count > 0) {
                                  setConflictData(res.data);
                                  setPendingDayKey(d.key);
                                  setConflictDialog(true);
                                  return;
                                }
                              } catch { /* proceed if check fails */ }
                            }
                            setHours(h => ({ ...h, [d.key]: { ...h[d.key], closed: !v } }));
                          }}
                        />
                        <span className="text-xs text-slate-500">{row.closed ? 'Closed' : 'Open'}</span>
                      </div>
                      <Input
                        type="time"
                        value={row.open}
                        disabled={row.closed}
                        onChange={(e) => setHours(h => ({ ...h, [d.key]: { ...h[d.key], open: e.target.value } }))}
                        className="h-9 text-xs"
                      />
                      <Input
                        type="time"
                        value={row.close}
                        disabled={row.closed}
                        onChange={(e) => setHours(h => ({ ...h, [d.key]: { ...h[d.key], close: e.target.value } }))}
                        className={`h-9 text-xs ${dayHoursInvalid(row) ? 'border-red-400' : ''}`}
                      />
                      {dayHoursInvalid(row) && (
                        <p className="col-span-4 text-[11px] text-red-600 -mt-1">
                          {d.label}: closing time must be after opening time
                        </p>
                      )}
                    </div>
                  );
                })}
                {/* Calendar display window - the visible hour range of the
                    Availability calendar grid. Saved together with the
                    working hours by the button below. */}
                <div className="pt-3 mt-1 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700">Calendar display window</p>
                  <p className="text-xs text-slate-400 mt-0.5 mb-2">
                    The hours shown on the Availability calendar grid. Match them to your real operating window so the calendar isn't padded with empty early-morning or late-night rows.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    <div>
                      <Label className="text-xs">Day starts at</Label>
                      <Select value={String(calHourStart)} onValueChange={v => setCalHourStart(parseInt(v, 10))}>
                        <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, h) => (
                            <SelectItem key={h} value={String(h)}>
                              {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Day ends at</Label>
                      <Select value={String(calHourEnd)} onValueChange={v => setCalHourEnd(parseInt(v, 10))}>
                        <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                            <SelectItem key={h} value={String(h)}>
                              {h === 24 ? '12am (midnight)' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {calHourStart >= calHourEnd && (
                    <p className="text-xs text-red-600 mt-1.5">The day must end after it starts.</p>
                  )}
                </div>
                <div className="pt-2">
                  <Button
                    onClick={async () => {
                      if (calHourStart >= calHourEnd) {
                        toast.error('The calendar day must end after it starts');
                        return;
                      }
                      const badDay = DAYS.find(d => dayHoursInvalid(hours[d.key]));
                      if (badDay) {
                        toast.error(`${badDay.label}: closing time must be after opening time`);
                        return;
                      }
                      setSavingHours(true);
                      try {
                        const settings = {
                          ...(tenant?.settings || {}),
                          calendar_hour_start: calHourStart,
                          calendar_hour_end: calHourEnd,
                        };
                        const res = await api.put('/tenant/me', { business_hours: hours, settings });
                        setTenant(res.data);
                        toast.success('Working hours saved');
                      } catch { toast.error('Failed to save working hours'); }
                      setSavingHours(false);
                    }}
                    disabled={savingHours}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                  >
                    <Save className="h-4 w-4 mr-1.5" /> {savingHours ? 'Saving...' : 'Save Working Hours'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Salon Location & Address window - opened from the Business
             Details address field. Edits a draft; saving commits to the
             tenant. ── */}
      <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Salon Location &amp; Address
            </DialogTitle>
          </DialogHeader>
          {addrDraft && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-500">
                Search for your salon, use your current location, or drop the pin on the exact building. Then confirm the full street address below. Clients see this on your website and use the pin to find you.
              </p>
              <AddressMapPicker
                value={{
                  address: addrDraft.address,
                  city: addrDraft.suburb,
                  state: addrDraft.state,
                  postal_code: addrDraft.postcode,
                  latitude: addrDraft.latitude,
                  longitude: addrDraft.longitude,
                }}
                onChange={(p) => setAddrDraft(prev => ({
                  ...prev,                        // keeps unit - the map can't know it
                  address: p.address || prev.address,
                  suburb: p.suburb || prev.suburb,
                  state: p.state || prev.state,
                  postcode: p.postcode || prev.postcode,
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
              />
              <AuAddressForm
                value={addrDraft}
                onChange={(patch) => setAddrDraft(prev => ({ ...prev, ...patch }))}
                withSearch={false}
                showUnit
                unitLabel="Shop / unit / building name (optional)"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddrDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!addrDraft.address || !addrDraft.suburb || !addrDraft.state) {
                  toast.error('Street address, suburb and state are required');
                  return;
                }
                if (!isValidPostcode(addrDraft.postcode)) {
                  toast.error('Enter the 4-digit postcode');
                  return;
                }
                setSavingAddress(true);
                try {
                  const settings = {
                    ...(tenant.settings || {}),
                    address_parts: {
                      unit: addrDraft.unit || '',
                      street: addrDraft.address,
                      suburb: addrDraft.suburb,
                      state: addrDraft.state,
                      postcode: addrDraft.postcode,
                    },
                  };
                  const payload = {
                    address: composeStreetLine(addrDraft.unit, addrDraft.address),
                    city: addrDraft.suburb,
                    state: addrDraft.state,
                    postal_code: addrDraft.postcode,
                    country: 'Australia',
                    settings,
                  };
                  if (addrDraft.latitude != null && addrDraft.longitude != null) {
                    payload.latitude = addrDraft.latitude;
                    payload.longitude = addrDraft.longitude;
                  }
                  const res = await api.put('/tenant/me', payload);
                  setTenant(res.data);
                  setSalonAddr({ ...addrDraft });
                  setAddrDialogOpen(false);
                  toast.success('Salon address saved');
                } catch {
                  toast.error('Failed to save address');
                }
                setSavingAddress(false);
              }}
              disabled={savingAddress}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-1.5" /> {savingAddress ? 'Saving...' : 'Save Salon Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FULL WIDTH: Receipt Template ──────────────────────── */}
      {profile?.role === 'admin' && tenant && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Receipt Template</CardTitle>
            <CardDescription>Configure what appears on your service receipts. All fields are saved to your tenant settings and auto-applied when generating new receipts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Header info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Salon Tagline</Label>
                <Input
                  value={receiptConfig.tagline}
                  onChange={e => setReceiptConfig(c => ({ ...c, tagline: e.target.value }))}
                  placeholder="Where every pet leaves looking their best"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">Shown under salon name on receipt header</p>
              </div>
              <div>
                <Label>ABN / Business Number</Label>
                <Input
                  value={receiptConfig.abn || ''}
                  onChange={e => setReceiptConfig(c => ({ ...c, abn: e.target.value }))}
                  placeholder="51 824 753 556"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">Printed on every receipt for tax compliance</p>
              </div>
              <div>
                <Label>Receipt Number Prefix</Label>
                <Input
                  value={receiptConfig.receipt_prefix || ''}
                  onChange={e => setReceiptConfig(c => ({ ...c, receipt_prefix: e.target.value }))}
                  placeholder="ZLM-"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">e.g. ZLM-0001, ZLM-0002</p>
              </div>
            </div>

            {/* Row 2: Tax + Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Default Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={receiptConfig.tax_rate}
                  onChange={e => setReceiptConfig(c => ({ ...c, tax_rate: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">Adjustable per receipt. Set 0 for tax-free.</p>
              </div>
              <div>
                <Label>Accepted Payment Methods</Label>
                <Input
                  value={receiptConfig.payment_methods || ''}
                  onChange={e => setReceiptConfig(c => ({ ...c, payment_methods: e.target.value }))}
                  placeholder="Cash, Card, Bank Transfer, PayID"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">Comma-separated list shown on receipt</p>
              </div>
              <div>
                <Label>Bank Details (for transfer)</Label>
                <Input
                  value={receiptConfig.bank_details || ''}
                  onChange={e => setReceiptConfig(c => ({ ...c, bank_details: e.target.value }))}
                  placeholder="BSB: 062-000 | Acc: 1234 5678"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">For clients who pay via bank transfer</p>
              </div>
            </div>

            {/* Row 3: Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-sm">Show Logo</Label>
                  <p className="text-xs text-slate-400">Display salon logo in receipt header</p>
                </div>
                <Switch
                  checked={receiptConfig.show_logo}
                  onCheckedChange={v => setReceiptConfig(c => ({ ...c, show_logo: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-sm">Show Groomer Name</Label>
                  <p className="text-xs text-slate-400">Print which staff did the grooming</p>
                </div>
                <Switch
                  checked={receiptConfig.show_groomer !== false}
                  onCheckedChange={v => setReceiptConfig(c => ({ ...c, show_groomer: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-sm">Show Services Breakdown</Label>
                  <p className="text-xs text-slate-400">Itemized list vs single total</p>
                </div>
                <Switch
                  checked={receiptConfig.show_breakdown !== false}
                  onCheckedChange={v => setReceiptConfig(c => ({ ...c, show_breakdown: v }))}
                />
              </div>
            </div>

            {/* Row 4: Text fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Footer Text</Label>
                <Input
                  value={receiptConfig.footer_text}
                  onChange={e => setReceiptConfig(c => ({ ...c, footer_text: e.target.value }))}
                  placeholder="Thank you for choosing us! See you next time."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Next Visit Message</Label>
                <Input
                  value={receiptConfig.next_visit_message}
                  onChange={e => setReceiptConfig(c => ({ ...c, next_visit_message: e.target.value }))}
                  placeholder="Book within 30 days for 10% off!"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Social Media Handles</Label>
                <Input
                  value={receiptConfig.social_handles}
                  onChange={e => setReceiptConfig(c => ({ ...c, social_handles: e.target.value }))}
                  placeholder="@yoursalon | fb.com/yoursalon"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Cancellation / Refund Policy</Label>
                <Input
                  value={receiptConfig.cancellation_policy || ''}
                  onChange={e => setReceiptConfig(c => ({ ...c, cancellation_policy: e.target.value }))}
                  placeholder="No refunds after 24 hours"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={receiptConfig.terms}
                onChange={e => setReceiptConfig(c => ({ ...c, terms: e.target.value }))}
                placeholder="e.g. All services are non-refundable. Pets must be up-to-date on vaccinations."
                className="mt-1.5 text-sm"
                rows={3}
              />
            </div>
            <Button
              onClick={async () => {
                setSavingReceipt(true);
                try {
                  const settings = { ...(tenant.settings || {}), receipt_config: receiptConfig };
                  await api.put('/tenant/me', { settings });
                  setTenant(prev => ({ ...prev, settings }));
                  toast.success('Receipt template saved');
                } catch { toast.error('Failed to save'); }
                setSavingReceipt(false);
              }}
              disabled={savingReceipt}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              <Save className="h-4 w-4 mr-1.5" /> {savingReceipt ? 'Saving...' : 'Save Receipt Template'}
            </Button>
          </CardContent>
        </Card>
      )}
      {/* ── Staff Roles ── */}
      {isAdmin && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Staff Roles</CardTitle>
            <CardDescription>Define the employment roles available in your salon. These appear in staff profile dropdowns and carry a default hourly rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing roles */}
            <div className="space-y-2">
              {roles.map((role, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white">
                  <input
                    type="color"
                    value={role.color}
                    onChange={e => setRoles(prev => prev.map((r, i) => i === idx ? { ...r, color: e.target.value } : r))}
                    className="w-8 h-8 rounded-full border-0 cursor-pointer p-0"
                    title="Role color"
                  />
                  <Input
                    value={role.name}
                    onChange={e => setRoles(prev => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))}
                    className="h-8 text-sm flex-1"
                    placeholder="Role name"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 shrink-0"
                    onClick={() => setRoles(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add new role inline */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
              <input
                type="color"
                value={newRole.color}
                onChange={e => setNewRole(prev => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded-full border-0 cursor-pointer p-0"
              />
              <Input
                value={newRole.name}
                onChange={e => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                className="h-8 text-sm flex-1"
                placeholder="New role name..."
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                disabled={!newRole.name.trim()}
                onClick={() => {
                  if (!newRole.name.trim()) return;
                  setRoles(prev => [...prev, { ...newRole, name: newRole.name.trim() }]);
                  setNewRole({ name: '', color: '#6366F1' });
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            <Button
              onClick={async () => {
                setSavingRoles(true);
                try {
                  const settings = { ...(tenant.settings || {}), roles: roles.filter(r => r.name.trim()) };
                  await api.put('/tenant/me', { settings });
                  setTenant(prev => ({ ...prev, settings }));
                  toast.success('Staff roles saved');
                } catch { toast.error('Failed to save roles'); }
                setSavingRoles(false);
              }}
              disabled={savingRoles}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              <Save className="h-4 w-4 mr-1.5" /> {savingRoles ? 'Saving...' : 'Save Roles'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Payment Terminals (EFTPOS) ── */}
      {isAdmin && tenant && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Payment Terminals (EFTPOS)</CardTitle>
            <CardDescription>
              Configure the physical card terminals available at your salon. These appear when staff choose "Terminal" as the payment method on a receipt.
              Supported banks: <strong>CommBank, ANZ, NAB, Westpac</strong>. Actual live integration with the bank's network requires the bank's merchant SDK
              (e.g. CommBank Smart, ANZ Worldline, NAB Easy Tap, Westpac PresentsPay) - this configuration records terminal identity for receipts and audit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {terminals.length === 0 && (
                <div className="text-xs text-slate-400 italic p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                  No terminals configured yet. Add one below.
                </div>
              )}
              {terminals.map((t, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_150px_1fr_1fr_110px_auto] gap-3 items-end p-3 rounded-lg border border-slate-200 bg-white">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={t.label || ''}
                      onChange={e => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      placeholder="Front Desk Terminal"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bank</Label>
                    <Select
                      value={t.bank || 'commbank'}
                      onValueChange={v => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, bank: v } : x))}
                    >
                      <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commbank">CommBank</SelectItem>
                        <SelectItem value="anz">ANZ</SelectItem>
                        <SelectItem value="nab">NAB</SelectItem>
                        <SelectItem value="westpac">Westpac</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Terminal ID / Serial</Label>
                    <Input
                      value={t.terminal_id || ''}
                      onChange={e => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, terminal_id: e.target.value } : x))}
                      placeholder="TID-12345678"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Merchant ID (MID)</Label>
                    <Input
                      value={t.merchant_id || ''}
                      onChange={e => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, merchant_id: e.target.value } : x))}
                      placeholder="MID-9876"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Switch
                      checked={t.active !== false}
                      onCheckedChange={v => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, active: v } : x))}
                    />
                    <span className="text-xs text-slate-500">{t.active !== false ? 'Active' : 'Disabled'}</span>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-9 w-9 text-red-500"
                    onClick={() => setTerminals(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {/* Second row: location + optional api endpoint */}
                  <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label className="text-xs">Location / Description</Label>
                      <Input
                        value={t.location || ''}
                        onChange={e => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, location: e.target.value } : x))}
                        placeholder="Reception desk"
                        className="h-9 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">API Endpoint (optional - for cloud-integrated terminals)</Label>
                      <Input
                        value={t.api_endpoint || ''}
                        onChange={e => setTerminals(prev => prev.map((x, i) => i === idx ? { ...x, api_endpoint: e.target.value } : x))}
                        placeholder="https://api.bank-provider.example/terminals/…"
                        className="h-9 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminals(prev => [...prev, { label: '', bank: 'commbank', terminal_id: '', merchant_id: '', location: '', api_endpoint: '', active: true }])}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Terminal
            </Button>

            <div>
              <Button
                onClick={async () => {
                  setSavingTerminals(true);
                  try {
                    const cleaned = terminals.filter(t => (t.label || '').trim() && (t.terminal_id || '').trim());
                    const settings = { ...(tenant.settings || {}), payment_terminals: cleaned };
                    await api.put('/tenant/me', { settings });
                    setTenant(prev => ({ ...prev, settings }));
                    setTerminals(cleaned);
                    toast.success('Payment terminals saved');
                  } catch { toast.error('Failed to save terminals'); }
                  setSavingTerminals(false);
                }}
                disabled={savingTerminals}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                <Save className="h-4 w-4 mr-1.5" /> {savingTerminals ? 'Saving...' : 'Save Terminals'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Integrations (Coming Soon) ── */}
      {isAdmin && (
        <Card className="rounded-xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
            <CardDescription>Connect third-party services to your salon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Stripe Payments', desc: 'Accept card payments and manage subscriptions', icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
                { name: 'SMS Reminders', desc: 'Send automated appointment reminders via SMS', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
                { name: 'Card on File', desc: 'Securely store client card details for future charges', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
              ].map(item => (
                <div key={item.name} className="border border-slate-200 rounded-xl p-4 relative">
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] uppercase font-semibold tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Coming Soon
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color} mb-3`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Conflict warning dialog ── */}
      <Dialog open={conflictDialog} onOpenChange={setConflictDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Appointment Conflicts
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-slate-700 mb-3">
              Closing this day affects <strong>{conflictData?.conflict_count || 0}</strong> upcoming appointment{conflictData?.conflict_count !== 1 ? 's' : ''}. These will <strong>not</strong> be auto-cancelled. Please contact the affected clients to reschedule.
            </p>
            {conflictData?.conflicts?.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-lg p-2">
                {conflictData.conflicts.map(c => (
                  <div key={c.id} className="text-xs text-slate-600 flex justify-between">
                    <span>{c.client_name} {c.pet_name ? `· ${c.pet_name}` : ''}</span>
                    <span className="text-slate-400">{c.start_time ? new Date(c.start_time).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConflictDialog(false); setPendingDayKey(null); }}>
              Keep Open
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                if (pendingDayKey) {
                  setHours(h => ({ ...h, [pendingDayKey]: { ...h[pendingDayKey], closed: true } }));
                }
                setConflictDialog(false);
                setPendingDayKey(null);
              }}
            >
              Mark as Closed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
