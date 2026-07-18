// Salon-timezone display helpers.
//
// Appointments are stored as UTC instants. The DASHBOARD always talks about
// the salon's wall clock (a Melbourne salon's 11:00 booking must read 11:00
// even when the admin is browsing from India), so format stored times with
// the tenant's timezone, never the browser's.

const DEFAULT_TZ = 'Australia/Melbourne';

export function formatInSalonTz(iso, tz, options = {}) {
  if (!iso) return '';
  const dt = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(dt.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: tz || DEFAULT_TZ,
      ...options,
    }).format(dt);
  } catch {
    return dt.toLocaleString();
  }
}

// "Jul 20, 11:00 am" in the salon's clock
export function salonDateTime(iso, tz) {
  return formatInSalonTz(iso, tz, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// "11:00 am"
export function salonTime(iso, tz) {
  return formatInSalonTz(iso, tz, { hour: 'numeric', minute: '2-digit' });
}

// Today's date at the salon as 'YYYY-MM-DD' (en-CA locale renders ISO order)
export function salonTodayISO(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || DEFAULT_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// The salon's current wall-clock time, e.g. "6:23 pm"
export function salonNowTime(tz) {
  return salonTime(new Date(), tz);
}
