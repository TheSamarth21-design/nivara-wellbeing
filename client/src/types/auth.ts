import { User } from 'firebase/auth';

export type UserRole = 'student' | 'teacher' | 'counselor';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  wellbeingId?: string;
  department?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, selectedRole: UserRole) => Promise<void>;
  register: (email: string, password: string, name: string, selectedRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}
