import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { AU_STATES, parseNominatimAddress, postcodeStateWarning } from '@/shared/lib/auAddress';

/**
 * Australian structured address form (per Australia Post / AS 4819):
 *   [ Search address… (optional autocomplete) ]
 *   [ Unit, apt or suite (optional) ]  - omitted unless showUnit
 *   [ Street address ]
 *   [ Suburb 50% | State 30% | Postcode 20% ]
 *
 * value: { unit?, address, suburb, state, postcode }
 * onChange(patch) - called with a partial patch to merge.
 * withSearch - show a Nominatim (AU-only) autocomplete that fills the fields.
 */
export default function AuAddressForm({ value = {}, onChange, withSearch = true, showUnit = false, unitLabel = 'Unit, apt or suite (optional)' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const skipNextSearch = useRef(false);

  // Debounced AU-restricted address search. Nominatim usage policy is 1 req/s;
  // 450ms debounce + 3-char minimum keeps us well inside it.
  useEffect(() => {
    if (!withSearch) return;
    if (skipNextSearch.current) { skipNextSearch.current = false; return; }
    if (!query || query.trim().length < 3) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=au&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
          { headers: { 'Accept-Language': 'en-AU' } }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query, withSearch]);

  const pick = (r) => {
    const parsed = parseNominatimAddress(r.address || {}, r.display_name);
    skipNextSearch.current = true;
    setQuery(r.display_name);
    setResults([]);
    onChange({
      address: parsed.street,
      suburb: parsed.suburb,
      state: parsed.state,
      postcode: parsed.postcode,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    });
  };

  const warning = postcodeStateWarning(value.state, value.postcode);

  return (
    <div className="space-y-3">
      {withSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search address… e.g. 14 Smith St Bondi"
            className="pl-9"
          />
          {results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-lg">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-start gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-700 line-clamp-2">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showUnit && (
        <div>
          <Label>{unitLabel}</Label>
          <Input
            value={value.unit || ''}
            onChange={e => onChange({ unit: e.target.value })}
            placeholder="e.g. Shop 2, Unit 5, Westfield Bondi"
            className="mt-1.5"
          />
        </div>
      )}

      <div>
        <Label>Street address</Label>
        <Input
          value={value.address || ''}
          onChange={e => onChange({ address: e.target.value })}
          placeholder="14 Smith St"
          className="mt-1.5"
        />
      </div>

      <div className="grid grid-cols-[5fr_3fr_2fr] gap-3">
        <div>
          <Label>Suburb</Label>
          <Input
            value={value.suburb || ''}
            onChange={e => onChange({ suburb: e.target.value })}
            placeholder="Bondi"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>State</Label>
          <Select value={value.state || ''} onValueChange={v => onChange({ state: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              {AU_STATES.map(s => (
                <SelectItem key={s.code} value={s.code}>{s.code} - {s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Postcode</Label>
          <Input
            value={value.postcode || ''}
            onChange={e => onChange({ postcode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="2026"
            inputMode="numeric"
            maxLength={4}
            className="mt-1.5"
          />
        </div>
      </div>

      {warning && <p className="text-xs text-amber-600">{warning}</p>}
    </div>
  );
}
