// Fixture for GroomingAppointmentDetailPage tests: a Melbourne salon,
// appointment a1 on Mon 2026-11-02 11:00-13:00 AEDT (00:00Z-02:00Z), two rows.
export const TZ = 'Australia/Melbourne';

export function row(id, name, sid, s, e, price = 80, extra = {}) {
  return { id, service_id: sid, name, staff_id: 'S0', staff_name: 'Groomer Zero',
    duration_minutes: 60, unit_price: price, quantity: 1, total: price,
    discount_type: null, discount_value: null, start_time: s, end_time: e,
    created_at: '2026-10-01T00:00:00+00:00', bundle_id: null, bundle_name: null, ...extra };
}

export function appt(overrides = {}) {
  return {
    id: 'a1', staff_id: 'S0', client_id: 'c1', service_id: 'svc60', pet_id: null,
    start_time: '2026-11-02T00:00:00+00:00', end_time: '2026-11-02T02:00:00+00:00',
    status: 'scheduled', notes: null, payment_amount: null,
    staff: { id: 'S0', full_name: 'Groomer Zero' },
    client: { id: 'c1', full_name: 'Jo Smith', phone: '0400', profile_status: 'complete', verification_status: 'verified' },
    services_list: [
      row('r1', 'Cut', 'svc60', '2026-11-02T00:00:00+00:00', '2026-11-02T01:00:00+00:00'),
      row('r2', 'Wash', 'svc30', '2026-11-02T01:00:00+00:00', '2026-11-02T02:00:00+00:00'),
    ],
    photos: [], receipt: null, feedback: null, receipt_total: null,
    ...overrides,
  };
}

export const SERVICES = [
  { id: 'svc60', name: 'Cut', duration_minutes: 60, price: 80, staff_ids: [] },
  { id: 'svc30', name: 'Wash', duration_minutes: 30, price: 40, staff_ids: [] },
  { id: 'svcA', name: 'Service A', duration_minutes: 60, price: 100, staff_ids: [] },
  { id: 'svcB', name: 'Service B', duration_minutes: 120, price: 250, staff_ids: [] },
];

export const BUNDLES = [
  { id: 'b1', name: 'A + B', bundle_price: 300, is_active: true,
    items: [{ service_id: 'svcA', quantity: 1 }, { service_id: 'svcB', quantity: 1 }] },
];

const OPTIONS = [
  { staff_id: 'S0', full_name: 'Groomer Zero', assigned_here: true, capable: true, on_shift: true, busy: false, available: true },
  { staff_id: 'S1', full_name: 'Groomer One', assigned_here: false, capable: true, on_shift: true, busy: false, available: true },
];

export function installGets(api, { appointment, tenant = {}, slots = [], bundles = [], rescheduleSlots = [] } = {}) {
  let current = appointment;
  const calls = { appt: 0, staffOptions: [], rescheduleSlots: [] };
  api.get.mockImplementation((url, cfg) => {
    if (url === '/g/appointments/a1') { calls.appt += 1; return Promise.resolve({ data: typeof current === 'function' ? current() : current }); }
    if (url === '/services') return Promise.resolve({ data: { items: SERVICES } });
    if (url === '/service-bundles') return Promise.resolve({ data: bundles });
    if (url === '/tenant/me') return Promise.resolve({ data: { timezone: TZ, settings: { currency: 'AUD', ...tenant } } });
    if (url === '/staff') return Promise.resolve({ data: { items: [
      { id: 'S0', full_name: 'Groomer Zero', is_active: true },
      { id: 'S1', full_name: 'Groomer One', is_active: true },
    ] } });
    if (url === '/grooming-notes') return Promise.resolve({ data: [] });
    if (url === '/g/appointments/a1/staff-options') { calls.staffOptions.push(cfg?.params || {}); return Promise.resolve({ data: { options: OPTIONS } }); }
    if (url === '/g/appointments/multi-auto-slots') return Promise.resolve({ data: slots });
    if (url === '/g/appointments/a1/reschedule-slots') { calls.rescheduleSlots.push(cfg?.params || {}); return Promise.resolve({ data: rescheduleSlots }); }
    return Promise.resolve({ data: {} });
  });
  return { set: (a) => { current = a; }, calls };
}
