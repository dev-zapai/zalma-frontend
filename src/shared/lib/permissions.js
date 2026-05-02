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
