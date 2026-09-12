/**
 * Smoke test for the Availability calendar Day view: one column per groomer,
 * every appointment that day rendered as pet name and owner name, and a
 * booked block click opens that appointment.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { format, startOfWeek, addDays } from 'date-fns';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }), { virtual: true });
jest.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ profile: { is_admin: true, role: 'admin', staff_id: null } }),
}));
jest.mock('@/shared/components/DatePicker', () => (props) => (
  <input data-testid="datepicker" value={props.value || ''} onChange={e => props.onChange(e.target.value)} />
));
jest.mock('@/shared/lib/api', () => ({ __esModule: true, default: { get: jest.fn() } }));

import api from '@/shared/lib/api';
import AvailabilityPage from '../AvailabilityPage';

const today = new Date();
const monday = startOfWeek(today, { weekStartsOn: 1 });
const todayIso = format(today, 'yyyy-MM-dd');

function weekPayload() {
  const days = (blocksForToday) => Array.from({ length: 7 }, (_, i) => {
    const d = format(addDays(monday, i), 'yyyy-MM-dd');
    return {
      date: d, day_of_week: i, is_off: false, is_override: false, override: null,
      schedule: null, appointments: [],
      blocks: d === todayIso ? blocksForToday : [{ start: '09:00', end: '17:00', status: 'available' }],
    };
  });
  return {
    start_date: format(monday, 'yyyy-MM-dd'),
    staff: [
      { id: 'S0', full_name: 'Test Groomer', color: '#6366F1', inactive: false,
        days: days([
          { start: '09:00', end: '10:00', status: 'available' },
          { start: '10:00', end: '11:00', status: 'booked', appointment_id: 'a1' },
          { start: '11:00', end: '17:00', status: 'available' },
        ]) },
      { id: 'S1', full_name: 'Trainee', color: '#06B6D4', inactive: true,
        days: days([
          { start: '13:00', end: '14:00', status: 'booked', appointment_id: 'a2' },
        ]) },
    ],
  };
}

beforeEach(() => {
  api.get.mockImplementation((url) => {
    if (url === '/staff') return Promise.resolve({ data: { items: [] } });
    if (url === '/tenant/me') return Promise.resolve({ data: { settings: { calendar_hour_start: 8, calendar_hour_end: 18 } } });
    if (url === '/availability/week') return Promise.resolve({ data: weekPayload() });
    if (url === '/g/appointments') return Promise.resolve({ data: { items: [
      { id: 'a1', pet: { name: 'Rex' }, client: { full_name: 'Jo Smith' },
        services_list: [{ name: 'Wash' }, { name: 'Cut' }] },
      { id: 'a2', pet: { name: 'Milo' }, client: { full_name: 'Sam Lee' }, service: { name: 'Groom' }, services_list: [] },
    ] } });
    return Promise.resolve({ data: {} });
  });
});

async function flush() {
  for (let i = 0; i < 6; i++) await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

test('Day view shows a column per groomer with every appointment and opens one on click', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => { root.render(<AvailabilityPage />); });
  await flush();

  // Week view first: 7 weekday headers exist
  expect(el.textContent).toMatch(/Mon/);

  const dayBtn = Array.from(el.querySelectorAll('button')).find(b => b.textContent.trim() === 'day');
  expect(dayBtn).toBeTruthy();
  await act(async () => { dayBtn.click(); });
  await flush();

  const text = el.textContent;
  expect(text).toContain('Test Groomer');
  expect(text).toContain('Trainee');
  expect(text).toContain('inactive');
  expect(text).toContain('Rex · Jo Smith');     // pet · owner on the block
  expect(text).toContain('Milo · Sam Lee');
  expect(text).not.toContain('Wash');           // no service on the block
  expect(text).toContain(format(today, 'EEEE, MMM d, yyyy'));
  // the day view requested the appointments for that date
  expect(api.get).toHaveBeenCalledWith('/g/appointments', { params: { date_from: todayIso, date_to: todayIso, limit: 200 } });

  // clicking a booked block opens the appointment, not the new-booking page
  const block = Array.from(el.querySelectorAll('div[title^="Open appointment"]'))[0];
  expect(block).toBeTruthy();
  await act(async () => { block.click(); });
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard/appointments/a1/detail');

  await act(async () => { root.unmount(); });
  el.remove();
});
