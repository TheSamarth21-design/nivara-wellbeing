import { UserRole } from '../types/auth';

export function getDashboardRoute(role: UserRole | string | null | undefined): string {
  if (!role) return '/select-role';

  const normalized = role.toLowerCase();

  switch (normalized) {
    case 'student':
      return '/student/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'counselor':
      return '/counselor/dashboard';
    default:
      return '/select-role';
  }
}
