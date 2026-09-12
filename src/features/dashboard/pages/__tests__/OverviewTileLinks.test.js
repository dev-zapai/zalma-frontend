import { tileLinks } from '../../lib/tileLinks';

test('today tiles deep-link to the same salon-local day the backend counted', () => {
  expect(tileLinks('2027-03-08')).toEqual({
    clients: '/dashboard/clients?booked_on=2027-03-08',
    pets: '/dashboard/pets?booked_on=2027-03-08',
    revenue: '/dashboard/analytics?from=2027-03-08&to=2027-03-08',
  });
});

test('without a day (older backend) the tiles fall back to the plain pages', () => {
  expect(tileLinks(undefined)).toEqual({
    clients: '/dashboard/clients', pets: '/dashboard/pets', revenue: '/dashboard/analytics',
  });
});
