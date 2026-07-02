import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Search, Globe, Check } from 'lucide-react';

// Timezone dropdown backed by browser's IANA database (Intl.supportedValuesOf).
// - Auto-detects user's zone on first mount and preselects if value is empty
// - Groups by continent (Africa/, Asia/, Australia/, etc.)
// - Shows current local time in each option so users can confirm the right pick
// - IANA zones (e.g. "Australia/Sydney") automatically handle DST — AEDT/AEST
//   switch is handled by the browser's tzdata, not by us
//
// No library dep: uses the native Intl API (browser support: Feb 2022+).
//
// Usage:
//   <TimezoneSelect value={tz} onChange={setTz} />

const ALL_ZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone').filter(z => z.includes('/'));
  } catch {
    // Fallback for very old browsers — a small curated list
    return [
      'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane', 'Australia/Adelaide',
      'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Hong_Kong',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin',
      'America/New_York', 'America/Los_Angeles', 'America/Chicago',
      'Pacific/Auckland', 'UTC',
    ];
  }
})();

// Format a zone's current time + offset — recomputed periodically so the
// display never lags reality (matters at DST-switch boundaries)
function formatZoneInfo(zone, now) {
  try {
    // Current time in zone
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(now);
    // Offset like "GMT+11" or "GMT-5"
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, timeZoneName: 'shortOffset',
    }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';
    return { time, offset };
  } catch {
    return { time: '', offset: '' };
  }
}

// Convert "Australia/Sydney" → "Sydney" (nice display name)
function cityFromZone(zone) {
  const parts = zone.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ');
}

function continentFromZone(zone) {
  return zone.split('/')[0];
}

export default function TimezoneSelect({ value, onChange, className = '', placeholder = 'Select timezone' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const containerRef = useRef(null);

  // Refresh "current time in each zone" every minute so options stay correct
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Auto-detect user's timezone on first mount if nothing selected
  useEffect(() => {
    if (!value) {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected && ALL_ZONES.includes(detected)) {
          onChange(detected);
        }
      } catch {
        // ignore — user can pick manually
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Filtered + grouped list
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? ALL_ZONES.filter(z => z.toLowerCase().includes(q) || cityFromZone(z).toLowerCase().includes(q))
      : ALL_ZONES;
    const groups = {};
    for (const z of filtered) {
      const g = continentFromZone(z);
      (groups[g] ||= []).push(z);
    }
    return groups;
  }, [query]);

  const selectedInfo = value ? formatZoneInfo(value, now) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-left text-sm flex items-center gap-2 hover:border-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <Globe className="h-4 w-4 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          {value ? (
            <div className="flex items-baseline gap-2 truncate">
              <span className="font-medium text-gray-900 truncate">{cityFromZone(value)}</span>
              {selectedInfo && (
                <span className="text-xs text-gray-400 shrink-0">
                  {selectedInfo.offset} · {selectedInfo.time}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-[260px] flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search city or region..."
              autoFocus
              className="w-full h-9 pl-9 pr-3 text-sm rounded-md bg-gray-50 border-0 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {Object.keys(grouped).length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">No timezones match</div>
            )}
            {Object.entries(grouped).map(([continent, zones]) => (
              <div key={continent}>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">
                  {continent}
                </div>
                {zones.map(zone => {
                  const info = formatZoneInfo(zone, now);
                  const selected = zone === value;
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => { onChange(zone); setOpen(false); setQuery(''); }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-indigo-50 ${selected ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{cityFromZone(zone)}</div>
                        <div className="text-xs text-gray-400 truncate">{zone} · {info.offset}</div>
                      </div>
                      <div className="text-xs text-gray-500 tabular-nums shrink-0">{info.time}</div>
                      {selected && <Check className="h-4 w-4 text-indigo-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
