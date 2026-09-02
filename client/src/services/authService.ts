import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from './userService';
import { UserProfile, UserRole } from '../types/auth';

export class RoleMismatchError extends Error {
  constructor(public actualRole: UserRole, public selectedRole: UserRole) {
    super(`This account is registered as a ${actualRole}. Please select the correct role.`);
    this.name = 'RoleMismatchError';
  }
}

export const authService = {
  async loginWithEmail(
    email: string,
    password: string,
    selectedRole: UserRole
  ): Promise<{ user: User; profile: UserProfile }> {
    // 1. Firebase Authentication
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = credential.user;

    // 2. Fetch User Profile from Firestore / resilient cache
    let profile = await userService.getUserProfile(user.uid);

    // If no profile exists yet, initialize it under the selected role
    if (!profile) {
      profile = await userService.createUserProfile(user.uid, {
        name: user.displayName || email.split('@')[0],
        email: user.email || email,
        role: selectedRole
      });
    }

    // 3. Verify Selected Role Against Authorized Role
    if (profile.role !== selectedRole) {
      await signOut(auth);
      throw new RoleMismatchError(profile.role, selectedRole);
    }

    return { user, profile };
  },

  async registerWithEmail(
    email: string,
    password: string,
    name: string,
    selectedRole: UserRole
  ): Promise<{ user: User; profile: UserProfile }> {
    try {
      // 1. Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = credential.user;

      // 2. Create profile with the selected role
      const profile = await userService.createUserProfile(user.uid, {
        name: name.trim() || email.split('@')[0],
        email: user.email || email,
        role: selectedRole
      });

      return { user, profile };
    } catch (err: any) {
      // If user was created in Firebase Auth during a previous attempt, seamlessly log them in
      if (err?.code === 'auth/email-already-in-use') {
        return await this.loginWithEmail(email, password, selectedRole);
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  }
};
