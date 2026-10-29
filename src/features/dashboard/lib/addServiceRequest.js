// Builds the request the appointment page sends when the admin clicks "Add"
// in the Add Service panel. Pure, so the exact wire payload is unit-tested.
//
// `allowConflict` is the explicit double-booking override. Only a literal
// `true` counts: the Add button's onClick used to hand the React click event
// to this parameter, and an event object is not JSON-serializable, so axios
// threw before the request ever left the browser ("Failed to add").
export function addServiceRequest(appointmentId, addServiceId, { services = [], staffId = '', qty = 1, allowConflict = false, replaceExisting = false } = {}) {
  if (!appointmentId || !addServiceId) return null;
  const allow = allowConflict === true;
  const staff_id = staffId || null;

  if (addServiceId.startsWith('bundle:')) {
    const bundleId = addServiceId.slice('bundle:'.length);
    if (!bundleId) return null;
    // replace_existing: the admin confirmed that a loose row of a member
    // service should give way to the bundle (2026-10-27).
    return {
      kind: 'bundle',
      url: `/g/appointments/${appointmentId}/bundles`,
      body: { bundle_id: bundleId, staff_id, allow_conflict: allow, replace_existing: replaceExisting === true },
    };
  }

  const svc = services.find(s => s.id === addServiceId);
  if (!svc) return null;
  const quantity = Number.isInteger(qty) && qty > 0 ? qty : 1;
  const unit = parseFloat(svc.price);
  return {
    kind: 'service',
    url: `/g/appointments/${appointmentId}/services`,
    body: {
      service_id: svc.id,
      staff_id,
      name: svc.name,
      duration_minutes: svc.duration_minutes,
      unit_price: unit,
      quantity,
      total: Math.round(unit * quantity * 100) / 100,
      allow_conflict: allow,
    },
  };
}
