import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface CheckinInput {
  moodScore: number;
  moodTier: string;
  energyLevel: string;
  stressLevel: string;
  sleepQuality: string;
  feelingTags: string[];
  note: string;
  date?: string; // YYYY-MM-DD
  aiResult?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

export interface StoredCheckin {
  id: string;
  userId: string;
  moodScore: number;
  moodTier: string;
  energyLevel: string;
  stressLevel: string;
  sleepQuality: string;
  feelingTags: string[];
  note: string;
  date: string;
  aiResult?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const mapDocToCheckin = (docSnap: QueryDocumentSnapshot<DocumentData>): StoredCheckin => {
  const data = docSnap.data();
  const createdAtTimestamp = data.createdAt as Timestamp | undefined;
  const updatedAtTimestamp = data.updatedAt as Timestamp | undefined;

  return {
    id: docSnap.id,
    userId: data.userId || '',
    moodScore: Number(data.moodScore ?? 5),
    moodTier: data.moodTier || 'neutral',
    energyLevel: data.energyLevel || 'Moderate',
    stressLevel: data.stressLevel || 'Moderate',
    sleepQuality: data.sleepQuality || 'Good',
    feelingTags: Array.isArray(data.feelingTags) ? data.feelingTags : [],
    note: data.note || '',
    date: data.date || (createdAtTimestamp ? createdAtTimestamp.toDate().toISOString().split('T')[0] : getTodayDateString()),
    aiResult: data.aiResult,
    formData: data.formData,
    createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
    updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate() : new Date(),
  };
};

export const checkinService = {
  /**
   * Submit a daily check-in to Firestore under users/{uid}/checkins
   * Throws a real error if unauthenticated or if write fails.
   */
  async submitCheckin(input: CheckinInput): Promise<StoredCheckin> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated with Firebase to submit a check-in.');
    }

    const dateStr = input.date || getTodayDateString();
    const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');

    const checkinPayload = {
      userId: user.uid,
      moodScore: Number(input.moodScore),
      moodTier: input.moodTier || 'neutral',
      energyLevel: input.energyLevel || 'Moderate',
      stressLevel: input.stressLevel || 'Moderate',
      sleepQuality: input.sleepQuality || 'Good',
      feelingTags: input.feelingTags || [],
      note: input.note || '',
      date: dateStr,
      aiResult: input.aiResult ?? null,
      formData: input.formData ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(userCheckinsRef, checkinPayload);
      
      return {
        id: docRef.id,
        userId: user.uid,
        moodScore: checkinPayload.moodScore,
        moodTier: checkinPayload.moodTier,
        energyLevel: checkinPayload.energyLevel,
        stressLevel: checkinPayload.stressLevel,
        sleepQuality: checkinPayload.sleepQuality,
        feelingTags: checkinPayload.feelingTags,
        note: checkinPayload.note,
        date: checkinPayload.date,
        aiResult: input.aiResult,
        formData: input.formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to submit check-in to Firestore:', error);
      throw error;
    }
  },

  /**
   * Fetch all check-ins for the currently authenticated user, newest first.
   */
  async getCheckins(): Promise<StoredCheckin[]> {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    try {
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      const q = query(userCheckinsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(mapDocToCheckin);
    } catch (error) {
      console.error('Failed to fetch check-ins from Firestore:', error);
      throw error;
    }
  },

  /**
   * Fetch the most recent check-ins for the currently authenticated user (default limit: 7).
   */
  async getRecentCheckins(limitCount = 7): Promise<StoredCheckin[]> {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    try {
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      const q = query(userCheckinsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(mapDocToCheckin);
    } catch (error) {
      console.error(`Failed to fetch recent check-ins (limit: ${limitCount}) from Firestore:`, error);
      throw error;
    }
  },

  /**
   * Check if the authenticated user has already completed today's check-in.
   * Returns the checkin if completed today, or null if not yet completed.
   */
  async getTodayCheckin(): Promise<StoredCheckin | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const todayStr = getTodayDateString();

    try {
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      // Query by date field
      const q = query(userCheckinsRef, where('date', '==', todayStr), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return mapDocToCheckin(querySnapshot.docs[0]);
      }

      return null;
    } catch (error) {
      console.error("Failed to check today's check-in status from Firestore:", error);
      throw error;
    }
  }
};
