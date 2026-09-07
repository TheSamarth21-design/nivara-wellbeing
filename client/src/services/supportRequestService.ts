import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type SupportSessionType = 'audio' | 'video';
export type SupportRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface SupportRequestDoc {
  id: string;
  studentId: string;
  studentName?: string;
  counselorId: string | null;
  type: SupportSessionType;
  status: SupportRequestStatus;
  roomId: string;
  createdAt: Date;
  acceptedAt?: Date | null;
  completedAt?: Date | null;
  declineReason?: string;
}

/**
 * Generate a cryptographically unguessable room ID for Jitsi sessions.
 * Never based on predictable student UIDs alone.
 */
export const generateSecureRoomId = (type: SupportSessionType): string => {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').substring(0, 12)
    : Math.random().toString(36).substring(2, 14);
  const timePart = Date.now().toString(36);
  return `nivara-support-${type}-${timePart}-${randomPart}`;
};

export const supportRequestService = {
  /**
   * Create an SOS support request in Firestore.
   * Throws an error if user is unauthenticated or if permission is denied.
   */
  async createSupportRequest(type: SupportSessionType, studentName?: string): Promise<SupportRequestDoc> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to request emergency counseling support.');
    }

    const roomId = generateSecureRoomId(type);

    const payload = {
      studentId: user.uid,
      studentName: studentName || user.displayName || 'Student',
      counselorId: null,
      type,
      status: 'pending' as SupportRequestStatus,
      roomId,
      createdAt: serverTimestamp(),
      acceptedAt: null,
      completedAt: null
    };

    try {
      const collectionRef = collection(db, 'supportRequests');
      const docRef = await addDoc(collectionRef, payload);

      return {
        id: docRef.id,
        studentId: user.uid,
        studentName: payload.studentName,
        counselorId: null,
        type,
        status: 'pending',
        roomId,
        createdAt: new Date(),
        acceptedAt: null,
        completedAt: null
      };
    } catch (error: any) {
      console.error('[SupportRequestService] Error creating support request:', error);
      throw error;
    }
  },

  /**
   * Listen to status changes of a single support request in real time.
   * Returns an unsubscribe function to prevent memory leaks.
   */
  listenToSupportRequest(
    requestId: string,
    onUpdate: (data: SupportRequestDoc | null) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const docRef = doc(db, 'supportRequests', requestId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate(null);
          return;
        }

        const data = snapshot.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
        const acceptedAt = data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null;
        const completedAt = data.completedAt instanceof Timestamp ? data.completedAt.toDate() : null;

        const requestDoc: SupportRequestDoc = {
          id: snapshot.id,
          studentId: data.studentId || '',
          studentName: data.studentName,
          counselorId: data.counselorId || null,
          type: data.type || 'video',
          status: data.status || 'pending',
          roomId: data.roomId || '',
          createdAt,
          acceptedAt,
          completedAt,
          declineReason: data.declineReason
        };

        onUpdate(requestDoc);
      },
      (error) => {
        console.error('[SupportRequestService] Snapshot error on request:', requestId, error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Cancel an in-flight pending support request.
   */
  async cancelSupportRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'cancelled',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error cancelling support request:', error);
      throw error;
    }
  },

  /**
   * Complete an ongoing support request after session ends.
   */
  async completeSupportRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error completing support request:', error);
      throw error;
    }
  },

  /**
   * Counselor action: Accept a pending support request and join.
   */
  async acceptSupportRequest(requestId: string, counselorId: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'accepted',
        counselorId,
        acceptedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error accepting support request:', error);
      throw error;
    }
  },

  /**
   * Counselor action: Decline a support request.
   */
  async declineSupportRequest(requestId: string, reason?: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'declined',
        declineReason: reason || 'Counselor is unavailable at this moment.',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error declining support request:', error);
      throw error;
    }
  },

  /**
   * Counselor listener for pending requests.
   */
  listenToPendingRequests(
    onUpdate: (requests: SupportRequestDoc[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'supportRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SupportRequestDoc[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            studentId: data.studentId || '',
            studentName: data.studentName,
            counselorId: data.counselorId || null,
            type: data.type || 'video',
            status: data.status || 'pending',
            roomId: data.roomId || '',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : null,
            declineReason: data.declineReason
          };
        });
        onUpdate(list);
      },
      (error) => {
        console.error('[SupportRequestService] Pending requests listener error:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * SIH Demo Simulation: Simulate a counselor accepting the support request.
   * Useful for live demonstrations without needing a second physical device.
   */
  async simulateCounselorAccept(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'accepted',
        counselorId: 'counselor-campus-demo',
        acceptedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error simulating counselor acceptance:', error);
      throw error;
    }
  }
};
