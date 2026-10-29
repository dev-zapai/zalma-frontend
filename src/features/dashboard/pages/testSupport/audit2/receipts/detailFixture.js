// Fixture for GroomingAppointmentDetailPage probes: a Melbourne salon,
// appointment a1 on Mon 2026-11-02 11:00-13:00 AEDT (00:00Z-02:00Z), two rows.
export const TZ = 'Australia/Melbourne';

export function row(id, name, sid, s, e, price = 80) {
  return { id, service_id: sid, name, staff_id: 'S0', staff_name: 'Groomer Zero',
    duration_minutes: 60, unit_price: price, quantity: 1, total: price,
    discount_type: null, discount_value: null, start_time: s, end_time: e,
    created_at: '2026-10-01T00:00:00+00:00' };
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

export function installGets(api, { appointment, tenant = {}, slots = [] } = {}) {
  let current = appointment;
  api.get.mockImplementation((url, cfg) => {
    if (url === '/g/appointments/a1') return Promise.resolve({ data: typeof current === 'function' ? current() : current });
    if (url === '/services') return Promise.resolve({ data: { items: [
      { id: 'svc60', name: 'Cut', duration_minutes: 60, price: 80, staff_ids: [] },
      { id: 'svc30', name: 'Wash', duration_minutes: 30, price: 40, staff_ids: [] },
    ] } });
    if (url === '/service-bundles') return Promise.resolve({ data: [] });
    if (url === '/tenant/me') return Promise.resolve({ data: { timezone: TZ, settings: { currency: 'AUD', ...tenant } } });
    if (url === '/staff') return Promise.resolve({ data: { items: [
      { id: 'S0', full_name: 'Groomer Zero', is_active: true },
      { id: 'S1', full_name: 'Groomer One', is_active: true },
    ] } });
    if (url === '/grooming-notes') return Promise.resolve({ data: [] });
    if (url === '/g/appointments/a1/staff-options') return Promise.resolve({ data: { options: [
      { staff_id: 'S0', full_name: 'Groomer Zero', assigned_here: true, on_shift: true, busy: false, available: true },
      { staff_id: 'S1', full_name: 'Groomer One', assigned_here: false, on_shift: true, busy: false, available: true },
    ] } });
    if (url === '/g/appointments/multi-auto-slots') return Promise.resolve({ data: slots });
    return Promise.resolve({ data: {} });
  });
  return { set: (a) => { current = a; } };
}
