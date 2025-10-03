export interface AdminPermissions {
  show_valuation_queue: boolean;
  show_clients: boolean;
  show_affiliates: boolean;
  show_vendors: boolean;
  show_documents: boolean;
  show_transactions: boolean;
  show_accountants: boolean;
  show_promocodes: boolean;
  show_feedback: boolean;
  show_education: boolean;
  show_reviews: boolean;
  show_records: boolean;
  show_referrals: boolean;
}

export interface AdminProfile {
  is_super_admin: boolean;
  allow_all_access: boolean;
  permission?: AdminPermissions;
}

export type PermissionLevel = 'Super Admin' | 'Admin' | 'Employee' | 'Subscriber'

/**
 * Determines the permission level of an admin based on their profile
 * @param adminProfile - The admin profile object from the database
 * @returns The permission level string
 */
export const getPermissionLevel = (adminProfile: AdminProfile | null | undefined): PermissionLevel => {
  if (!adminProfile) {
    return 'Subscriber';
  }

  // Check if super admin
  if (adminProfile.is_super_admin) {
    return 'Super Admin';
  }

  // Check if has allow all access
  if (adminProfile.allow_all_access) {
    return 'Admin';
  }

  // Check if all permissions are true (equivalent to the old _isAdmin function)
  if (adminProfile.permission) {
    const permissions = adminProfile.permission;
    const allPermissionsTrue = Object.values(permissions).every(permission => permission === true);
    
    if (allPermissionsTrue) {
      return 'Admin';
    }
  }

  return 'Employee';
};

/**
 * Checks if an admin has all permissions (equivalent to the old _isAdmin function)
 * @param adminProfile - The admin profile object from the database
 * @returns boolean indicating if admin has all permissions
 */
export const isAdmin = (adminProfile: AdminProfile | null | undefined): boolean => {
  if (!adminProfile) {
    return false;
  }

  // Check if super admin
  if (adminProfile.is_super_admin) {
    return true;
  }

  // Check if has allow all access
  if (adminProfile.allow_all_access) {
    return true;
  }

  // Check if all permissions are true
  if (adminProfile.permission) {
    const permissions = adminProfile.permission;
    return Object.values(permissions).every(permission => permission === true);
  }

  return false;
};
