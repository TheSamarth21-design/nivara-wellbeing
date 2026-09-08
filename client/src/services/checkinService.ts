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
  moodTier?: string;
  energyLevel?: string;
  stressLevel?: string;
  sleepQuality?: string;
  feelingTags?: string[];
  note?: string;
  date?: string; // YYYY-MM-DD
  aiResult?: Record<string, unknown>;
  formData?: Record<string, unknown>;

  // Direct normalized indicators
  stressScore?: number | null;
  anxietyScore?: number | null;
  energyScore?: number | null;
  sleepScore?: number | null;
  academicPressureScore?: number | null;
  lonelinessScore?: number | null;
}

export interface StoredCheckin {
  id: string;
  studentId: string;
  userId: string;
  mood: string;
  moodScore: number;
  moodTier: string;
  energyLevel: string;
  energyScore: number | null;
  stressLevel: string;
  stressScore: number | null;
  anxietyLevel: number | null;
  sleepQuality: string;
  sleepScore: number | null;
  academicPressure: number | null;
  lonelinessLevel: number | null;
  answers: Record<string, unknown>;
  source: string;
  feelingTags: string[];
  note: string;
  date: string;
  aiResult?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WellbeingTrendSummary {
  recentMoodTrend: 'improving' | 'declining' | 'stable' | 'fluctuating';
  stressTrend: 'low' | 'moderate' | 'high' | 'increasing' | 'easing';
  sleepTrend: 'good' | 'inconsistent' | 'poor';
  academicPressure: 'low' | 'moderate' | 'high';
  energyTrend: 'normal' | 'low' | 'recovering';
  keyConcerns: string[];
  positiveSignals: string[];
  summarySentence: string;
  checkinCount: number;
  latestMood: string;
}

export interface AiWellbeingContextPayload {
  latest_mood: string;
  recent_mood_trend: string;
  stress_trend: string;
  sleep_trend: string;
  academic_pressure: string;
  energy_trend: string;
  key_concerns: string[];
  positive_signals: string[];
  summary_text: string;
  checkin_count: number;
}

const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// In-memory submission locking and duplicate debounce cache
let isSubmissionInProgress = false;
const recentSubmissionsCache = new Map<string, { checkin: StoredCheckin; timestamp: number }>();

const mapDocToCheckin = (docSnap: QueryDocumentSnapshot<DocumentData>): StoredCheckin => {
  const data = docSnap.data();
  const createdAtTimestamp = data.createdAt as Timestamp | undefined;
  const updatedAtTimestamp = data.updatedAt as Timestamp | undefined;

  const resolvedDate =
    data.date ||
    (createdAtTimestamp ? createdAtTimestamp.toDate().toISOString().split('T')[0] : getTodayDateString());

  const moodScoreNum = data.moodScore !== undefined && data.moodScore !== null ? Number(data.moodScore) : 3;
  const moodStr = data.mood || data.moodTier || (moodScoreNum >= 4 ? 'Good' : moodScoreNum >= 3 ? 'Okay' : 'Difficult');

  return {
    id: docSnap.id,
    studentId: data.studentId || data.userId || '',
    userId: data.userId || data.studentId || '',
    mood: moodStr,
    moodScore: moodScoreNum,
    moodTier: data.moodTier || moodStr.toLowerCase(),
    energyLevel: data.energyLevel || 'Moderate',
    energyScore: data.energyScore !== undefined ? Number(data.energyScore) : null,
    stressLevel: data.stressLevel || 'Moderate',
    stressScore: data.stressScore !== undefined ? Number(data.stressScore) : null,
    anxietyLevel: data.anxietyLevel !== undefined ? Number(data.anxietyLevel) : null,
    sleepQuality: data.sleepQuality || 'Good',
    sleepScore: data.sleepScore !== undefined ? Number(data.sleepScore) : null,
    academicPressure: data.academicPressure !== undefined ? Number(data.academicPressure) : null,
    lonelinessLevel: data.lonelinessLevel !== undefined ? Number(data.lonelinessLevel) : null,
    answers: (data.answers as Record<string, unknown>) || (data.formData as Record<string, unknown>) || {},
    source: data.source || 'daily_checkin',
    feelingTags: Array.isArray(data.feelingTags) ? data.feelingTags : [],
    note: data.note || '',
    date: resolvedDate,
    aiResult: data.aiResult,
    formData: data.formData,
    createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
    updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate() : new Date(),
  };
};

export const checkinService = {
  /**
   * Submit a daily check-in to Firestore under users/{uid}/checkins
   * and users/{uid}/wellbeingCheckins with duplicate protection.
   */
  async submitCheckin(input: CheckinInput): Promise<StoredCheckin> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated with Firebase to submit a check-in.');
    }

    const dateStr = input.date || getTodayDateString();
    const submitKey = `${user.uid}_${dateStr}`;
    const nowMs = Date.now();

    // 1. Duplicate check: prevent double clicks within 30 seconds
    const cached = recentSubmissionsCache.get(submitKey);
    if (cached && nowMs - cached.timestamp < 30000) {
      console.warn('[checkinService] Returning cached submission to prevent duplicate entry:', submitKey);
      return cached.checkin;
    }

    if (isSubmissionInProgress) {
      throw new Error('A check-in submission is already in progress. Please wait a moment.');
    }

    isSubmissionInProgress = true;

    try {
      const formData = input.formData || {};
      const moodScore = Number(input.moodScore ?? 3);
      const moodTier =
        input.moodTier || (moodScore >= 4 ? 'Good' : moodScore >= 3 ? 'Okay' : 'Difficult');

      // Normalized quantitative indicators
      const stressScore =
        input.stressScore !== undefined
          ? input.stressScore
          : formData.study_load !== undefined
          ? Number(formData.study_load)
          : input.stressLevel === 'High'
          ? 3
          : input.stressLevel === 'Moderate'
          ? 2
          : 1;

      const anxietyScore =
        input.anxietyScore !== undefined
          ? input.anxietyScore
          : formData.anxiety_level !== undefined
          ? Number(formData.anxiety_level)
          : null;

      const sleepScore =
        input.sleepScore !== undefined
          ? input.sleepScore
          : formData.sleep_quality !== undefined
          ? Number(formData.sleep_quality)
          : input.sleepQuality === 'Good'
          ? 3
          : input.sleepQuality === 'Okay'
          ? 2
          : 1;

      const energyScore =
        input.energyScore !== undefined
          ? input.energyScore
          : formData.depression !== undefined
          ? Math.max(1, 5 - Math.floor(Number(formData.depression) / 5))
          : input.energyLevel === 'Normal'
          ? 3
          : input.energyLevel === 'Moderate'
          ? 2
          : 1;

      const academicPressure =
        input.academicPressureScore !== undefined
          ? input.academicPressureScore
          : formData.study_load !== undefined
          ? Number(formData.study_load)
          : null;

      const lonelinessLevel =
        input.lonelinessScore !== undefined
          ? input.lonelinessScore
          : formData.social_support !== undefined
          ? Math.max(1, 5 - Number(formData.social_support))
          : null;

      const checkinPayload = {
        studentId: user.uid,
        userId: user.uid,
        mood: moodTier,
        moodTier: moodTier.toLowerCase(),
        moodScore: moodScore,
        energyLevel: input.energyLevel || 'Moderate',
        energyScore: energyScore,
        stressLevel: input.stressLevel || 'Moderate',
        stressScore: stressScore,
        anxietyLevel: anxietyScore,
        sleepQuality: input.sleepQuality || 'Good',
        sleepScore: sleepScore,
        academicPressure: academicPressure,
        lonelinessLevel: lonelinessLevel,
        answers: formData,
        source: 'daily_checkin',
        feelingTags: input.feelingTags || [],
        note: input.note || '',
        date: dateStr,
        aiResult: input.aiResult ?? null,
        formData: formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Write to users/{userId}/checkins
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      const docRef = await addDoc(userCheckinsRef, checkinPayload);

      // Best-effort mirror write to users/{userId}/wellbeingCheckins for dual compatibility
      try {
        const altRef = collection(db, 'users', user.uid, 'wellbeingCheckins');
        await addDoc(altRef, checkinPayload);
      } catch (mirrorErr) {
        console.debug('[checkinService] Mirror write skipped:', mirrorErr);
      }

      const stored: StoredCheckin = {
        id: docRef.id,
        studentId: user.uid,
        userId: user.uid,
        mood: moodTier,
        moodScore: moodScore,
        moodTier: moodTier.toLowerCase(),
        energyLevel: checkinPayload.energyLevel,
        energyScore: energyScore,
        stressLevel: checkinPayload.stressLevel,
        stressScore: stressScore,
        anxietyLevel: anxietyScore,
        sleepQuality: checkinPayload.sleepQuality,
        sleepScore: sleepScore,
        academicPressure: academicPressure,
        lonelinessLevel: lonelinessLevel,
        answers: formData,
        source: 'daily_checkin',
        feelingTags: checkinPayload.feelingTags,
        note: checkinPayload.note,
        date: dateStr,
        aiResult: input.aiResult,
        formData: formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Cache submission to prevent duplicates
      recentSubmissionsCache.set(submitKey, { checkin: stored, timestamp: nowMs });

      return stored;
    } catch (error) {
      console.error('Failed to submit check-in to Firestore:', error);
      throw error;
    } finally {
      isSubmissionInProgress = false;
    }
  },

  /**
   * Fetch all check-ins for the currently authenticated user, newest first.
   */
  async getCheckins(): Promise<StoredCheckin[]> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    try {
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      const q = query(userCheckinsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(mapDocToCheckin);
      }

      // Fallback: check wellbeingCheckins subcollection
      const altRef = collection(db, 'users', user.uid, 'wellbeingCheckins');
      const altSnap = await getDocs(query(altRef, orderBy('createdAt', 'desc')));
      return altSnap.docs.map(mapDocToCheckin);
    } catch (error) {
      console.error('Failed to fetch check-ins from Firestore:', error);
      throw error;
    }
  },

  /**
   * Fetch the most recent check-ins for the currently authenticated user (default limit: 7).
   */
  async getRecentCheckins(limitCount = 7): Promise<StoredCheckin[]> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    try {
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      const q = query(userCheckinsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(mapDocToCheckin);
      }

      // Fallback: check wellbeingCheckins subcollection
      const altRef = collection(db, 'users', user.uid, 'wellbeingCheckins');
      const altSnap = await getDocs(query(altRef, orderBy('createdAt', 'desc'), limit(limitCount)));
      return altSnap.docs.map(mapDocToCheckin);
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
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    const todayStr = getTodayDateString();

    try {
      const userCheckinsRef = collection(db, 'users', user.uid, 'checkins');
      const q = query(userCheckinsRef, where('date', '==', todayStr), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return mapDocToCheckin(querySnapshot.docs[0]);
      }

      // Fallback to wellbeingCheckins
      const altRef = collection(db, 'users', user.uid, 'wellbeingCheckins');
      const altSnap = await getDocs(query(altRef, where('date', '==', todayStr), limit(1)));
      if (!altSnap.empty) {
        return mapDocToCheckin(altSnap.docs[0]);
      }

      return null;
    } catch (error) {
      console.error("Failed to check today's check-in status from Firestore:", error);
      throw error;
    }
  },

  /**
   * Pure non-clinical trend analysis over recent check-ins (7, 14, or 30 days).
   * Identifies patterns without medical or diagnostic conclusions.
   */
  analyzeWellbeingTrends(checkins: StoredCheckin[], days = 14): WellbeingTrendSummary {
    if (!checkins || checkins.length === 0) {
      return {
        recentMoodTrend: 'stable',
        stressTrend: 'moderate',
        sleepTrend: 'inconsistent',
        academicPressure: 'moderate',
        energyTrend: 'normal',
        keyConcerns: [],
        positiveSignals: ['Open to daily check-ins'],
        summarySentence: 'No recent check-in patterns recorded yet.',
        checkinCount: 0,
        latestMood: 'Not recorded',
      };
    }

    const latest = checkins[0];
    const latestMood = latest.mood || latest.moodTier || 'Okay';

    // 1. Mood Trend Analysis
    let recentMoodTrend: 'improving' | 'declining' | 'stable' | 'fluctuating' = 'stable';
    if (checkins.length >= 2) {
      const half = Math.ceil(checkins.length / 2);
      const recentScores = checkins.slice(0, half).map((c) => Number(c.moodScore ?? 3));
      const olderScores = checkins.slice(half).map((c) => Number(c.moodScore ?? 3));

      const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const avgOlder = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
      const diff = avgRecent - avgOlder;

      if (diff >= 0.5) {
        recentMoodTrend = 'improving';
      } else if (diff <= -0.5) {
        recentMoodTrend = 'declining';
      } else {
        // Check for wide mood swings
        const minScore = Math.min(...checkins.map((c) => Number(c.moodScore ?? 3)));
        const maxScore = Math.max(...checkins.map((c) => Number(c.moodScore ?? 3)));
        recentMoodTrend = maxScore - minScore >= 3 ? 'fluctuating' : 'stable';
      }
    }

    // 2. Stress Trend Analysis
    let stressTrend: 'low' | 'moderate' | 'high' | 'increasing' | 'easing' = 'moderate';
    const highStressCount = checkins.filter(
      (c) => c.stressLevel === 'High' || (c.stressScore !== null && c.stressScore >= 3)
    ).length;

    if (highStressCount >= Math.ceil(checkins.length * 0.6)) {
      stressTrend = 'high';
    } else if (checkins.length >= 2) {
      const latestStressHigh = checkins[0].stressLevel === 'High';
      const prevStressHigh = checkins[1].stressLevel === 'High';
      if (latestStressHigh && !prevStressHigh) {
        stressTrend = 'increasing';
      } else if (!latestStressHigh && prevStressHigh) {
        stressTrend = 'easing';
      } else {
        stressTrend = checkins[0].stressLevel === 'Low' ? 'low' : 'moderate';
      }
    }

    // 3. Sleep Trend Analysis
    let sleepTrend: 'good' | 'inconsistent' | 'poor' = 'inconsistent';
    const poorSleepCount = checkins.filter(
      (c) => c.sleepQuality === 'Poor' || (c.sleepScore !== null && c.sleepScore <= 1)
    ).length;
    const goodSleepCount = checkins.filter(
      (c) => c.sleepQuality === 'Good' || (c.sleepScore !== null && c.sleepScore >= 3)
    ).length;

    if (poorSleepCount >= Math.ceil(checkins.length * 0.5)) {
      sleepTrend = 'poor';
    } else if (goodSleepCount >= Math.ceil(checkins.length * 0.6)) {
      sleepTrend = 'good';
    } else {
      sleepTrend = 'inconsistent';
    }

    // 4. Academic Pressure
    const highAcademicCount = checkins.filter(
      (c) => (c.academicPressure !== null && c.academicPressure >= 4) || (c.answers?.study_load as number >= 4)
    ).length;
    const academicPressure: 'low' | 'moderate' | 'high' =
      highAcademicCount >= Math.ceil(checkins.length * 0.5)
        ? 'high'
        : highAcademicCount >= 1
        ? 'moderate'
        : 'low';

    // 5. Energy Trend
    const lowEnergyCount = checkins.filter(
      (c) => c.energyLevel === 'Low' || c.energyLevel === 'Very Low' || (c.energyScore !== null && c.energyScore <= 1)
    ).length;
    const energyTrend: 'normal' | 'low' | 'recovering' =
      lowEnergyCount >= Math.ceil(checkins.length * 0.5)
        ? 'low'
        : checkins[0].energyLevel === 'Normal' && checkins.length > 1 && checkins[1].energyLevel === 'Low'
        ? 'recovering'
        : 'normal';

    // 6. Key Concerns & Positive Signals
    const keyConcerns: string[] = [];
    if (academicPressure === 'high') keyConcerns.push('Elevated academic pressure');
    if (stressTrend === 'high' || stressTrend === 'increasing') keyConcerns.push('Building stress');
    if (sleepTrend === 'poor') keyConcerns.push('Struggling with sleep');
    if (energyTrend === 'low') keyConcerns.push('Low energy levels');

    const positiveSignals: string[] = [];
    if (recentMoodTrend === 'improving') positiveSignals.push('Mood has shown an upward trend');
    if (recentMoodTrend === 'stable') positiveSignals.push('Mood consistency maintained');
    if (sleepTrend === 'good') positiveSignals.push('Restful sleep patterns');
    if (checkins.length >= 3) positiveSignals.push('Consistent daily self-reflection');

    // 7. Factual Non-Clinical Summary Sentence
    const parts: string[] = [];
    if (academicPressure === 'high') {
      parts.push('experiencing elevated academic workload');
    }
    if (sleepTrend === 'poor') {
      parts.push('irregular sleep quality');
    } else if (sleepTrend === 'good') {
      parts.push('healthy sleep patterns');
    }
    if (recentMoodTrend === 'improving') {
      parts.push('improving mood trend');
    } else if (recentMoodTrend === 'declining') {
      parts.push('dipping mood recently');
    }

    const summarySentence =
      parts.length > 0
        ? `Student self-reports reflect ${parts.join(' and ')} across recent check-ins.`
        : 'Student self-reports reflect stable wellbeing patterns across recent check-ins.';

    return {
      recentMoodTrend,
      stressTrend,
      sleepTrend,
      academicPressure,
      energyTrend,
      keyConcerns,
      positiveSignals,
      summarySentence,
      checkinCount: checkins.length,
      latestMood,
    };
  },

  /**
   * Retrieves concise, privacy-conscious wellbeing context for the NIVARA AI companion.
   * Sends minimal necessary context to avoid privacy leakage or bloated tokens.
   */
  async getWellbeingContextForAI(): Promise<AiWellbeingContextPayload | null> {
    try {
      const recent = await this.getRecentCheckins(7);
      if (!recent || recent.length === 0) {
        return null;
      }
      const trends = this.analyzeWellbeingTrends(recent, 7);
      return {
        latest_mood: trends.latestMood,
        recent_mood_trend: trends.recentMoodTrend,
        stress_trend: trends.stressTrend,
        sleep_trend: trends.sleepTrend,
        academic_pressure: trends.academicPressure,
        energy_trend: trends.energyTrend,
        key_concerns: trends.keyConcerns,
        positive_signals: trends.positiveSignals,
        summary_text: trends.summarySentence,
        checkin_count: trends.checkinCount,
      };
    } catch (err) {
      console.warn('[checkinService] Could not generate AI wellbeing context:', err);
      return null;
    }
  },
};
