import React, { useEffect, useRef, useState } from 'react';
import api from '@/shared/lib/api';
import { listItems } from '@/shared/lib/listResponse';
import { Input } from '@/shared/components/ui/input';

/**
 * Search-as-you-type client picker (fix 03). Replaces dropdowns that loaded
 * 200 clients: types two or more characters, waits 250 ms, asks
 * /clients?q= (prefix search on name, last name, phone, email, suburb) and
 * lists the hits. onSelect(client) on pick, onSelect(null) when cleared.
 */
export default function ClientPicker({ value, valueLabel, onSelect, placeholder = 'Type a client name or phone...', disabled = false, autoFocus = false }) {
  const [text, setText] = useState(valueLabel || '');
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef(null);
  const chosen = useRef(Boolean(value));

  useEffect(() => { if (valueLabel != null) setText(valueLabel); }, [valueLabel]);

  const onChange = (e) => {
    const t = e.target.value;
    setText(t);
    if (chosen.current) { chosen.current = false; onSelect && onSelect(null); }
    clearTimeout(timer.current);
    if (t.trim().length < 2) { setHits([]); setOpen(false); setSearched(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get('/clients', { params: { q: t.trim(), limit: 20 } });
        setHits(listItems(res.data));
      } catch (err) {
        console.error(err);
        setHits([]);
      }
      setSearched(true);
      setOpen(true);
    }, 250);
  };

  const pick = (c) => {
    chosen.current = true;
    setText(c.full_name || '');
    setHits([]); setOpen(false); setSearched(false);
    onSelect && onSelect(c);
  };

  return (
    <div className="relative" data-testid="client-picker">
      <Input value={text} onChange={onChange} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus}
             onFocus={() => hits.length && setOpen(true)} aria-autocomplete="list" />
      {open && (
        <div role="listbox" className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-slate-200 bg-white shadow-md">
          {hits.length === 0 && searched && (
            <div className="px-3 py-2 text-sm text-slate-500">No clients found</div>
          )}
          {hits.map(c => (
            <div key={c.id} role="option" aria-selected={c.id === value} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)}
                 className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50">
              {c.full_name}{c.phone ? ` ${c.phone}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
