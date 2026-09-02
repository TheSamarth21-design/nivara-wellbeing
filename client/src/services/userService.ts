import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserRole } from '../types/auth';

const STORAGE_PREFIX = 'nivara_user_profile_';

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = { uid, ...userSnap.data() } as UserProfile;
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (error: any) {
      console.warn('Firestore read permission or network issue:', error?.message || error);
    }

    // Fallback to local session cache if Firestore rules are not yet published
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
      if (cached) {
        return JSON.parse(cached) as UserProfile;
      }
    } catch {}

    return null;
  },

  async createUserProfile(
    uid: string,
    data: { name: string; email: string; role: UserRole; department?: string }
  ): Promise<UserProfile> {
    // Generate anonymous pseudonymous Wellbeing ID for identity separation
    const prefix = data.role === 'student' ? 'WELL' : data.role === 'counselor' ? 'CNS' : 'TCH';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const wellbeingId = `${prefix}-${randomSuffix}`;

    const profileData: UserProfile = {
      uid,
      name: data.name || 'User',
      email: data.email,
      role: data.role,
      wellbeingId,
      department: data.department || 'General'
    };

    // Cache locally first for instant resiliency
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(profileData));
    } catch {}

    // Persist to Firestore
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.warn(
        'Firestore security rules restricted profile creation. Using secure local session cache while rules are being deployed in Firebase Console.',
        error?.message || error
      );
    }

    return profileData;
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const cached = await this.getUserProfile(uid);
      if (cached) {
        const updated = { ...cached, ...data };
        localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(updated));
      }

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Firestore update restricted by security rules:', error);
    }
  }
};
