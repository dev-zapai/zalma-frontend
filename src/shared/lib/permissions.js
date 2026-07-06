export const PERMISSIONS = {
  admin: {
    canManageStaff: true,
    canManageServices: true,
    canManageSettings: true,
    canInviteMembers: true,
    canDeleteClients: true,
    canViewAllAppointments: true,
    canViewAnalytics: true,
    canManageDoctors: true,
  },
  staff: {
    canManageStaff: false,
    canManageServices: false,
    canManageSettings: false,
    canInviteMembers: false,
    canDeleteClients: false,
    canViewAllAppointments: true,
    canViewAnalytics: true,
    canManageDoctors: false,
  },
  doctor: {
    canManageStaff: false,
    canManageServices: false,
    canManageSettings: false,
    canInviteMembers: false,
    canDeleteClients: false,
    canViewAllAppointments: false,
    canViewAnalytics: false,
    canManageDoctors: false,
  },
};

export const can = (role, permission) => PERMISSIONS[role]?.[permission] ?? false;

/* ── Flag-based permission helpers (the three orthogonal flags) ──────────────
 * Permission decisions key off the booleans on the profile, NOT the legacy
 * `role` string. Pass a `profile` object (from useAuth()).
 *   isOwner  — the single account owner (grant/revoke admin, ownership actions)
 *   isAdmin  — management rights (owner implies admin)
 *   isStaff  — a working staff member (roster, scheduling, availability)
 * Invariant mirrored from the backend: isOwner ⇒ isAdmin.
 */
export const isOwner = (p) => !!p?.is_owner;
export const isAdmin = (p) => !!p?.is_admin || !!p?.is_owner;
export const isStaff = (p) => !!p?.is_staff;
// Only the owner may grant/revoke admin on others.
export const canManageAdmins = (p) => isOwner(p);
