import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/shared/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import {
  Plus, Edit, Trash2, Clock, DollarSign, Users, Package, Tag, Minus, PawPrint, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/shared/lib/listResponse';
import { formatPrice } from '@/shared/lib/currency';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [currency, setCurrency] = useState('AUD');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', duration_minutes: 30, price: 0, color: '#2563EB', staff_ids: [],
  });

  // ─── Bundles state ────────────────────────────────────────────────────
  const [bundles, setBundles] = useState([]);
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [bundleEditId, setBundleEditId] = useState(null);
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', color: '#7C3AED', bundle_price: 0,
    items: [],   // [{ service_id, quantity }]
  });
  const [savingBundle, setSavingBundle] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [svcRes, staffRes, tenantRes, bundleRes] = await Promise.all([
        api.get('/services'),
        api.get('/staff', { params: { limit: 200 } }),
        api.get('/tenant/me'),
        api.get('/service-bundles').catch(() => ({ data: [] })),
      ]);
      setServices(listItems(svcRes.data));
      setStaff(listItems(staffRes.data));
      setCurrency(tenantRes.data?.settings?.currency || 'AUD');
      setBundles(bundleRes.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', description: '', duration_minutes: 30, price: 0, color: '#2563EB', staff_ids: [], compatible_species: [], dynamic_pricing_enabled: false });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      description: s.description || '',
      duration_minutes: s.duration_minutes,
      price: s.price,
      color: s.color,
      staff_ids: s.staff_ids || [],
      compatible_species: s.compatible_species || [],
      dynamic_pricing_enabled: s.dynamic_pricing_enabled || false,
    });
    setDialogOpen(true);
  };

  const toggleStaff = (id) => {
    setForm(f => ({
      ...f,
      staff_ids: f.staff_ids.includes(id)
        ? f.staff_ids.filter(x => x !== id)
        : [...f.staff_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.staff_ids || form.staff_ids.length === 0) {
      toast.error('Select at least one groomer who can perform this service');
      return;
    }
    try {
      const payload = {
        name: form.name,
        description: form.description,
        duration_minutes: parseInt(form.duration_minutes),
        price: parseFloat(form.price),
        color: form.color,
        compatible_species: form.compatible_species?.length > 0 ? form.compatible_species : null,
        dynamic_pricing_enabled: form.dynamic_pricing_enabled || false,
      };
      let serviceId = editId;
      if (editId) {
        await api.put(`/services/${editId}`, payload);
      } else {
        const res = await api.post('/services', payload);
        serviceId = res.data.id;
      }
      // Persist capability mapping
      await api.put(`/availability/services/${serviceId}/staff`, { staff_ids: form.staff_ids });
      toast.success(editId ? 'Service updated' : 'Service created');
      setDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try { await api.delete(`/services/${id}`); fetchData(); } catch (e) { console.error(e); }
  };

  // ─── Bundle handlers ──────────────────────────────────────────────────
  const openNewBundle = () => {
    setBundleEditId(null);
    setBundleForm({
      name: '', description: '', color: '#7C3AED', bundle_price: 0, items: [],
    });
    setBundleDialogOpen(true);
  };

  const openEditBundle = (b) => {
    setBundleEditId(b.id);
    setBundleForm({
      name: b.name,
      description: b.description || '',
      color: b.color || '#7C3AED',
      bundle_price: b.bundle_price,
      items: (b.items || []).map(i => ({
        service_id: i.service_id,
        quantity: i.quantity,
      })),
    });
    setBundleDialogOpen(true);
  };

  const toggleBundleItem = (serviceId) => {
    setBundleForm(f => {
      const exists = f.items.find(i => i.service_id === serviceId);
      if (exists) {
        return { ...f, items: f.items.filter(i => i.service_id !== serviceId) };
      }
      return { ...f, items: [...f.items, { service_id: serviceId, quantity: 1 }] };
    });
  };

  const setBundleItemQty = (serviceId, qty) => {
    const n = Math.max(1, parseInt(qty) || 1);
    setBundleForm(f => ({
      ...f,
      items: f.items.map(i => i.service_id === serviceId ? { ...i, quantity: n } : i),
    }));
  };

  // Live preview math for the dialog
  const bundlePreview = useMemo(() => {
    let originalTotal = 0;
    let totalDuration = 0;
    bundleForm.items.forEach(i => {
      const svc = services.find(s => s.id === i.service_id);
      if (!svc) return;
      originalTotal += (parseFloat(svc.price) || 0) * i.quantity;
      totalDuration += (svc.duration_minutes || 0) * i.quantity;
    });
    const bundlePrice = parseFloat(bundleForm.bundle_price) || 0;
    const discountAmount = Math.max(0, originalTotal - bundlePrice);
    const discountPercent = originalTotal > 0
      ? Math.round((discountAmount / originalTotal) * 1000) / 10
      : 0;
    return { originalTotal, bundlePrice, discountAmount, discountPercent, totalDuration };
  }, [bundleForm.items, bundleForm.bundle_price, services]);

  const handleSaveBundle = async () => {
    if (!bundleForm.name) {
      toast.error('Bundle name is required');
      return;
    }
    if (bundleForm.items.length < 2) {
      toast.error('A bundle must contain at least two services');
      return;
    }
    if (bundlePreview.bundlePrice >= bundlePreview.originalTotal) {
      if (!window.confirm('Bundle price is not lower than the sum of services. Save anyway?')) return;
    }
    setSavingBundle(true);
    try {
      const payload = {
        name: bundleForm.name,
        description: bundleForm.description || null,
        color: bundleForm.color,
        bundle_price: parseFloat(bundleForm.bundle_price) || 0,
        items: bundleForm.items,
      };
      if (bundleEditId) {
        await api.put(`/service-bundles/${bundleEditId}`, payload);
      } else {
        await api.post('/service-bundles', payload);
      }
      toast.success(bundleEditId ? 'Bundle updated' : 'Bundle created');
      setBundleDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save bundle');
    }
    setSavingBundle(false);
  };

  const handleDeleteBundle = async (id) => {
    if (!window.confirm('Delete this bundle?')) return;
    try {
      await api.delete(`/service-bundles/${id}`);
      toast.success('Bundle deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete bundle');
    }
  };

  const staffNameById = React.useMemo(() => {
    const m = {};
    staff.forEach(s => { m[s.id] = s.full_name; });
    return m;
  }, [staff]);

  return (
    <div data-testid="services-page" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services</h1>
          <p className="text-sm text-slate-500 mt-1">Configure grooming services, durations, pricing and which groomers can perform them</p>
        </div>
        <Button data-testid="add-service-btn" onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
          <Plus className="h-4 w-4 mr-1.5" /> Add Service
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.length === 0 ? (
          <Card className="col-span-full rounded-xl border-slate-200/60"><CardContent className="py-12 text-center text-slate-400">No services configured yet</CardContent></Card>
        ) : services.map(s => (
          <Card key={s.id} data-testid={`service-card-${s.id}`} className="rounded-xl border-slate-200/60 hover:shadow-md group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 rounded-full" style={{ backgroundColor: s.color }} />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
                    {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
                  </div>
                </div>
                <Badge className={`rounded-full text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.duration_minutes} min</span>
                <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{s.price}</span>
                {s.compatible_species?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <PawPrint className="h-3 w-3" />
                    {s.compatible_species.map(sp => sp.charAt(0).toUpperCase() + sp.slice(1)).join(', ')}
                  </span>
                )}
              </div>
              {s.staff_ids && s.staff_ids.length > 0 ? (
                <div className="mt-3 flex items-start gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {s.staff_ids.map(id => (
                      <Badge key={id} variant="outline" className="text-[10px] rounded-full">
                        {staffNameById[id] || 'Unknown'}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                  <Users className="h-3 w-3" /> No groomer assigned, bookings disabled
                </p>
              )}
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ────────── Service Bundles section ────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5 text-violet-600" />
            Service Bundles
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Group multiple services together at a discounted bundle price
          </p>
        </div>
        <Button
          onClick={openNewBundle}
          disabled={services.length < 2}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Bundle
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {bundles.length === 0 ? (
          <Card className="col-span-full rounded-xl border-slate-200/60 border-dashed">
            <CardContent className="py-12 text-center text-slate-400">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No bundles yet</p>
              {services.length < 2 && (
                <p className="text-xs mt-1">Create at least 2 services first, then bundle them.</p>
              )}
            </CardContent>
          </Card>
        ) : bundles.map(b => (
          <Card key={b.id} className="rounded-xl border-slate-200/60 hover:shadow-md group relative overflow-hidden">
            {/* Discount ribbon */}
            {b.discount_percent > 0 && (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow">
                {b.discount_percent}% OFF
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-10 rounded-full shrink-0" style={{ backgroundColor: b.color || '#7C3AED' }} />
                <div className="min-w-0 flex-1 pr-12">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{b.name}</h3>
                  {b.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{b.description}</p>}
                </div>
              </div>

              {/* Included services list */}
              <div className="mt-4 space-y-1">
                {b.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
                      <span className="text-slate-700 truncate">
                        {item.service_name || 'Unknown service'}
                        {item.quantity > 1 && (
                          <span className="text-slate-400"> × {item.quantity}</span>
                        )}
                      </span>
                    </div>
                    <span className="text-slate-400 shrink-0 ml-2">
                      {formatPrice(item.line_total, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {b.total_duration_minutes} min total
                  </span>
                  <span className="line-through">{formatPrice(b.original_total, currency)}</span>
                </div>
                <div className="flex items-end justify-between">
                  <Badge className="rounded-full text-[10px] bg-green-100 text-green-800 border border-green-200">
                    Save {formatPrice(b.discount_amount, currency)}
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Bundle price</p>
                    <p className="text-lg font-bold text-violet-700">
                      {formatPrice(b.bundle_price, currency)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => openEditBundle(b)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteBundle(b.id)} className="text-red-500">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ────────── Bundle dialog ────────── */}
      <Dialog open={bundleDialogOpen} onOpenChange={setBundleDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-violet-600" />
              {bundleEditId ? 'Edit Bundle' : 'New Bundle'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Bundle Name *</Label>
                <Input
                  value={bundleForm.name}
                  onChange={e => setBundleForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Full Pampering Package"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={bundleForm.color}
                  onChange={e => setBundleForm(f => ({ ...f, color: e.target.value }))}
                  className="mt-1.5 h-10"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={bundleForm.description}
                onChange={e => setBundleForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What's included, who it's for, when to recommend it..."
                rows={2}
                className="mt-1.5"
              />
            </div>

            {/* Service picker */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Services in this bundle *
              </Label>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Pick at least 2 services. Adjust quantity per service if needed.
              </p>
              {services.length === 0 ? (
                <p className="text-xs text-amber-600 italic">No services configured yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {services.map(svc => {
                    const item = bundleForm.items.find(i => i.service_id === svc.id);
                    const checked = !!item;
                    return (
                      <div
                        key={svc.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${checked ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleBundleItem(svc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate">{svc.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {svc.duration_minutes} min · {formatPrice(svc.price, currency)}
                          </p>
                        </div>
                        {checked && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setBundleItemQty(svc.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs w-6 text-center font-medium">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setBundleItemQty(svc.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bundle price + live preview */}
            <div>
              <Label>Bundle Price *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bundleForm.bundle_price}
                onChange={e => setBundleForm(f => ({ ...f, bundle_price: e.target.value }))}
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">
                The price the customer pays. Should be lower than the sum of individual services.
              </p>
            </div>

            {/* Live preview */}
            {bundleForm.items.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Sum of services</span>
                  <span>{formatPrice(bundlePreview.originalTotal, currency)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total duration</span>
                  <span>{bundlePreview.totalDuration} min</span>
                </div>
                <div className="flex justify-between text-violet-700 font-semibold">
                  <span>Bundle price</span>
                  <span>{formatPrice(bundlePreview.bundlePrice, currency)}</span>
                </div>
                {bundlePreview.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium pt-1 border-t border-slate-200">
                    <span>Customer saves</span>
                    <span>{formatPrice(bundlePreview.discountAmount, currency)} ({bundlePreview.discountPercent}% off)</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveBundle}
              disabled={savingBundle || !bundleForm.name || bundleForm.items.length < 2}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {savingBundle ? 'Saving...' : (bundleEditId ? 'Update Bundle' : 'Create Bundle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Service' : 'New Service'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Service Name *</Label><Input data-testid="service-name-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Color</Label><Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="mt-1.5 h-10" /></div>
            </div>

            {/* Compatible Pet Types */}
            <div>
              <Label className="flex items-center gap-1.5">
                <PawPrint className="h-3.5 w-3.5" /> Compatible Pet Types
              </Label>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Leave empty for all species. Select specific types to restrict this service.
              </p>
              <div className="flex flex-wrap gap-2">
                {['dog', 'cat', 'bird', 'rabbit', 'other'].map(species => {
                  const checked = (form.compatible_species || []).includes(species);
                  return (
                    <label key={species} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer hover:bg-slate-50 text-sm capitalize"
                      style={{ borderColor: checked ? '#6366F1' : undefined, backgroundColor: checked ? '#EEF2FF' : undefined }}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          setForm(f => ({
                            ...f,
                            compatible_species: checked
                              ? f.compatible_species.filter(s => s !== species)
                              : [...(f.compatible_species || []), species],
                          }));
                        }}
                      />
                      {species}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Pricing toggle (placeholder) */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <Zap className="h-3.5 w-3.5" /> Dynamic Pricing
                </Label>
                <p className="text-xs text-slate-400 mt-0.5">Coming soon: time-based and demand pricing</p>
              </div>
              <Switch
                checked={form.dynamic_pricing_enabled}
                onCheckedChange={v => setForm(f => ({ ...f, dynamic_pricing_enabled: v }))}
                disabled
              />
            </div>

            {/* Capability - mandatory */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Groomers who can perform this service *
              </Label>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Bookings can only be assigned to groomers selected here. This drives auto-allocation and prevents invalid bookings.
              </p>
              {staff.length === 0 ? (
                <p className="text-xs text-amber-600 italic">No staff members yet. Add staff first.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {staff.map(st => (
                    <label key={st.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                      <Checkbox
                        checked={form.staff_ids.includes(st.id)}
                        onCheckedChange={() => toggleStaff(st.id)}
                      />
                      <span className="text-sm text-slate-700">{st.full_name}</span>
                      {st.role && <span className="text-xs text-slate-400">· {st.role}</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button data-testid="service-save-btn" onClick={handleSave} disabled={!form.name || form.staff_ids.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
