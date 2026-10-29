// Where a Notification Command Center action button navigates. Each action
// lands on the EXACT issue: the affected appointment, client or pet, and
// for a missing vaccination record the pet's Vaccination Documents tab.
// Returns null for actions that do not navigate (confirm, call, acknowledge...).
export function actionTarget(item, action) {
  if (!item) return null;
  const clientId = item.context?.client_id || item.entity_id;
  const petId = item.context?.pet_id || item.entity_id;

  switch (action) {
    case 'generate_receipt':
    case 'check_status':
    case 'assign_staff':
    case 'reschedule':
      return item.entity_id ? `/dashboard/appointments/${item.entity_id}/detail` : null;
    case 'add_email':
    case 'complete_profile':
    case 'review_profile':
    case 'flag_client':
      return clientId ? `/dashboard/clients/${clientId}` : null;
    case 'open_receipt':
    case 'send_reminder':
      // An overdue invoice opens its appointment's Receipt tab, where the
      // payment can be recorded (bug send_reminder_does_nothing, 2026-10-28).
      return item.context?.appointment_id
        ? `/dashboard/appointments/${item.context.appointment_id}/detail?tab=receipt` : null;
    case 'update_record':
      if (!petId) return null;
      if (item.category === 'missing_vaccination') return `/dashboard/pets/${petId}?tab=vaccination`;
      return `/dashboard/pets/${petId}`;
    default:
      return null;
  }
}
