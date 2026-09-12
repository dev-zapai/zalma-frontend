// Where the Overview "today" tiles go. `today` is the salon-local date the
// backend computed the tiles for, so the destination shows exactly the same
// clients / pets / revenue window the tile counted.
export function tileLinks(today) {
  if (!today) {
    return { clients: '/dashboard/clients', pets: '/dashboard/pets', revenue: '/dashboard/analytics' };
  }
  return {
    clients: `/dashboard/clients?booked_on=${today}`,
    pets: `/dashboard/pets?booked_on=${today}`,
    revenue: `/dashboard/analytics?from=${today}&to=${today}`,
  };
}
