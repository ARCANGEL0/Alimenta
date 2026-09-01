export const APP_NAME = 'ALIMENTA';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  donations: '/donations',
  inventory: '/inventory',
  expirations: '/expirations',
  beneficiaries: '/beneficiaries',
  distributions: '/distributions',
  disposals: '/disposals',
  donors: '/donors',
  reports: '/reports',
  users: '/users',
  settings: '/settings',
} as const;

export const STORAGE_LIMITS = {
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
};
