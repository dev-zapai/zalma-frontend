import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar } from '@/shared/components/ui/calendar';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

/**
 * Zalma's own date picker - identical in every browser, unlike the native
 * <input type="date"> whose calendar popup exists in Chromium but not in
 * Safari. Same string contract as the native input so call sites swap 1:1:
 *
 *   value:    'YYYY-MM-DD' or ''
 *   onChange: (value) => void      - '' when cleared
 *   min/max:  'YYYY-MM-DD' bounds (optional)
 */

function parseISODate(s) {
  if (!s || typeof s !== 'string') return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function toISO(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(s) {
  const dt = parseISODate(s);
  if (!dt) return '';
  return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DatePicker({
  value = '',
  onChange,
  min,
  max,
  placeholder = 'Pick a date',
  clearable = true,
  showToday = true,
  disabled = false,
  className = '',
  'data-testid': testId,
}) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  const disabledMatchers = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });

  const pick = (dt) => {
    if (!dt) return;
    onChange?.(toISO(dt));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid={testId}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm',
            'ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 transition-colors',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
          <span className={cn('flex-1 text-left truncate', value ? 'text-foreground' : 'text-muted-foreground')}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          {clearable && value && !disabled && (
            <span
              role="button"
              aria-label="Clear date"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); onChange?.(''); }}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected || minDate || new Date()}
          onSelect={pick}
          disabled={disabledMatchers.length ? disabledMatchers : undefined}
          initialFocus
        />
        {(clearable || showToday) && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            {clearable ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500"
                onClick={() => { onChange?.(''); setOpen(false); }}>
                Clear
              </Button>
            ) : <span />}
            {showToday && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary"
                onClick={() => pick(new Date())}
                disabled={!!((minDate && new Date() < minDate && toISO(new Date()) !== toISO(minDate))
                  || (maxDate && new Date() > maxDate && toISO(new Date()) !== toISO(maxDate)))}>
                Today
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
