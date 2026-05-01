import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, PawPrint, TrendingUp, Scissors, Calendar, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { listItems } from '@/lib/listResponse';
import { differenceInYears, differenceInMonths, parseISO, isBefore } from 'date-fns';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Guinea Pig', 'Hamster', 'Fish', 'Reptile', 'Other'];
const FLAG_OPTIONS = ['aggressive', 'senior', 'anxious', 'first_visit', 'matting', 'medical'];

function PetAvatar({ pet }) {
  const colors = {
    Dog: 'bg-amber-100 text-amber-700',
    Cat: 'bg-purple-100 text-purple-700',
    Rabbit: 'bg-pink-100 text-pink-700',
    Bird: 'bg-sky-100 text-sky-700',
  };
  const cls = colors[pet.species] || 'bg-slate-100 text-slate-600';
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cls}`}>
      {pet.photo_url
        ? <img src={pet.photo_url} alt={pet.name} className="w-9 h-9 rounded-full object-cover" />
        : <PawPrint className="h-4 w-4" />}
    </div>
  );
}

function formatAge(dob) {
  if (!dob) return '-';
  try {
    const birthDate = parseISO(dob);
    const now = new Date();
    const years = differenceInYears(now, birthDate);
    const months = differenceInMonths(now, birthDate) % 12;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}m`;
    return '<1m';
  } catch {
    return '-';
  }
}

export default function PetsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', species: '', breed: '', gender: '', owner_id: '', weight: '', color: '', notes: '', allergy: '', special_flag: '' });
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);

  // Filters
  const [speciesFilter, setSpeciesFilter] = useState(searchParams.get('species') || 'all');
  const [flagFilter, setFlagFilter] = useState(searchParams.get('flag') || 'all');
  const [newPetFilter, setNewPetFilter] = useState(searchParams.get('new_pet') || 'all');
  const [desexedFilter, setDesexedFilter] = useState(searchParams.get('desexed') || 'all');
  const [vaccinationFilter, setVaccinationFilter] = useState(searchParams.get('vaccination') || 'all');

  // Sort
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'name');
  const [sortDir, setSortDir] = useState(searchParams.get('sort_dir') || 'asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await api.get('/pets/kpis');
      setKpis(res.data);
    } catch (e) { console.error('Failed to fetch pet KPIs', e); }
  }, []);

  const fetchPets = useCallback(async () => {
    try {
      const params = { page, sort_by: sortBy, sort_dir: sortDir };
      if (search) params.search = search;
      if (speciesFilter !== 'all') params.species = speciesFilter;
      if (flagFilter !== 'all') params.special_flag = flagFilter;
      if (newPetFilter === 'new') params.is_new_pet = true;
      if (desexedFilter === 'desexed') params.desexed = 'true';
      if (desexedFilter === 'not_desexed') params.desexed = 'false';
      if (vaccinationFilter === 'expired') params.vaccination_expired = 'true';
      if (vaccinationFilter === 'up_to_date') params.vaccination_expired = 'false';
      const res = await api.get('/pets', { params });
      setPets(listItems(res.data));
      if (res.data?.total_pages) setTotalPages(res.data.total_pages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search, speciesFilter, flagFilter, newPetFilter, desexedFilter, vaccinationFilter, sortBy, sortDir, page]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/clients', { params: { limit: 200 } });
      setClients(listItems(res.data));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);
  useEffect(() => { fetchPets(); }, [fetchPets]);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Sync filters to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (speciesFilter !== 'all') p.set('species', speciesFilter);
    if (flagFilter !== 'all') p.set('flag', flagFilter);
    if (newPetFilter !== 'all') p.set('new_pet', newPetFilter);
    if (desexedFilter !== 'all') p.set('desexed', desexedFilter);
    if (vaccinationFilter !== 'all') p.set('vaccination', vaccinationFilter);
    if (sortBy !== 'name') p.set('sort_by', sortBy);
    if (sortDir !== 'asc') p.set('sort_dir', sortDir);
    setSearchParams(p, { replace: true });
  }, [search, speciesFilter, flagFilter, newPetFilter, desexedFilter, vaccinationFilter, sortBy, sortDir, setSearchParams]);

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
    setForm({ name: '', species: '', breed: '', gender: '', owner_id: '', weight: '', color: '', notes: '', allergy: '', special_flag: '' });
    setDialogOpen(true);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v != null) payload[k] = v;
      });
      if (payload.weight) payload.weight = parseFloat(payload.weight);

      await api.post('/pets', payload);
      toast.success(`${form.name} added`);
      setDialogOpen(false);
      fetchPets();
      fetchKpis();
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to add pet');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();

  // KPI card definitions
  const kpiCards = kpis ? [
    { label: 'Total Pets', value: kpis.total, icon: PawPrint, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active (120d)', value: kpis.active_120d, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Groomed This Week', value: kpis.groomed_this_week, icon: Scissors, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Due This Week', value: kpis.due_this_week, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'High-Risk', value: kpis.high_risk, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ] : [];

  return (
    <div data-testid="pets-page" className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pets</h1>
          <p className="text-sm text-slate-500 mt-1">All pets registered at your salon</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
          <Plus className="h-4 w-4 mr-1.5" /> Add Pet
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpiCards.map((k, i) => (
            <Card key={i} className="rounded-xl border-slate-200/60 hover:shadow-md transition-shadow">
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
                placeholder="Search by pet name, species, breed, or owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Species: All</SelectItem>
                  {SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={flagFilter} onValueChange={setFlagFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Special Flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Flag: All</SelectItem>
                  {FLAG_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newPetFilter} onValueChange={setNewPetFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="New/Returning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="new">New Pets Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={desexedFilter} onValueChange={setDesexedFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Desexed Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Desexed: All</SelectItem>
                  <SelectItem value="desexed">Desexed</SelectItem>
                  <SelectItem value="not_desexed">Not Desexed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={vaccinationFilter} onValueChange={setVaccinationFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Vaccination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vaccination: All</SelectItem>
                  <SelectItem value="up_to_date">Up to Date</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                    Pet <SortArrow col="name" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('species')}>
                    Species / Breed <SortArrow col="species" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('owner')}>
                    Owner <SortArrow col="owner" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('date_of_birth')}>
                    Age <SortArrow col="date_of_birth" />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('weight')}>
                    Weight <SortArrow col="weight" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      {loading ? 'Loading...' : 'No pets found. Add your first pet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  pets.map(p => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => navigate(`/dashboard/pets/${p.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PetAvatar pet={p} />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-500 md:hidden">{p.species} {p.breed ? `· ${p.breed}` : ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline" className="text-xs font-normal">{p.species || '-'}</Badge>
                          {p.breed && <p className="text-xs text-slate-500 mt-0.5">{p.breed}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.owner ? (
                          <button
                            className="text-sm text-primary hover:underline text-left"
                            onClick={e => { e.stopPropagation(); navigate(`/dashboard/clients/${p.owner_id}`); }}
                          >
                            {p.owner.full_name}
                          </button>
                        ) : <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{formatAge(p.date_of_birth)}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.special_flag && (
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                              {p.special_flag.replace('_', ' ')}
                            </Badge>
                          )}
                          {p.allergy && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              Allergy
                            </Badge>
                          )}
                          {p.is_new_pet && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                              New
                            </Badge>
                          )}
                          {p.desexed_status === false && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              Not desexed
                            </Badge>
                          )}
                          {p.vaccination_expiry && isBefore(parseISO(p.vaccination_expiry), today) && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              Vacc expired
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{p.weight ? `${p.weight} kg` : '-'}</span>
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

      {/* Add Pet Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pet Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Buddy" className="mt-1.5" />
              </div>
              <div>
                <Label>Owner / Client *</Label>
                <Select value={form.owner_id} onValueChange={v => setForm({ ...form, owner_id: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Species</Label>
                <Select value={form.species} onValueChange={v => setForm({ ...form, species: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select species" /></SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed</Label>
                <Input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="Golden Retriever" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="15" className="mt-1.5" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Golden" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Allergy</Label>
                <Input
                  value={form.allergy}
                  onChange={e => setForm({ ...form, allergy: e.target.value })}
                  placeholder="e.g. Chicken, fragrances"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Special Flag</Label>
                <Select value={form.special_flag} onValueChange={v => setForm({ ...form, special_flag: v })}>
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
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Behaviour notes, handling tips, etc." className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.owner_id || saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? 'Adding...' : 'Add Pet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
