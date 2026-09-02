import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserRole } from '../types/auth';

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      return {
        uid,
        ...userSnap.data()
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile from Firestore:', error);
      throw error;
    }
  },

  async createUserProfile(
    uid: string,
    data: { name: string; email: string; role: UserRole; department?: string }
  ): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', uid);
      
      // Generate anonymous pseudonymous Wellbeing ID for identity separation
      const prefix = data.role === 'student' ? 'WELL' : data.role === 'counselor' ? 'CNS' : 'TCH';
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const wellbeingId = `${prefix}-${randomSuffix}`;

      const profileData: Omit<UserProfile, 'uid'> = {
        name: data.name || 'User',
        email: data.email,
        role: data.role,
        wellbeingId,
        department: data.department || 'General',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, profileData);

      return {
        uid,
        ...profileData
      };
    } catch (error) {
      console.error('Error creating user profile in Firestore:', error);
      throw error;
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile in Firestore:', error);
      throw error;
    }
  }
};
