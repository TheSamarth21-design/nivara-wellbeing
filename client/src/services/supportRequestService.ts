import {
  collection,
  doc,
  setDoc,
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

export type SupportRequestStatus =
  | 'waiting'
  | 'accepted'
  | 'active'
  | 'ended'
  | 'declined'
  | 'cancelled'
  | 'pending'   // backward compatibility
  | 'completed'; // backward compatibility

export interface SupportRequestDoc {
  id: string;
  requestId: string;
  studentId: string;
  studentName?: string;
  counselorId: string | null;
  counselorName?: string | null;
  callType: SupportSessionType;
  type?: SupportSessionType; // backward compatibility
  status: SupportRequestStatus;
  roomName: string;
  roomId?: string; // backward compatibility
  createdAt: Date;
  acceptedAt?: Date | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  completedAt?: Date | null; // backward compatibility
  declineReason?: string;
}

export interface JitsiJoinAuthorization {
  configured: boolean;
  requestId: string;
  roomName: string;
  jitsiDomain: string;
  domain?: string;
  jwtToken: string;
  token?: string;
  isModerator: boolean;
  callType: SupportSessionType;
  appId?: string;
  message?: string | null;
}

/**
 * Base API URL for FastAPI Render backend calls
 */
const getBackendApiBase = (): string => {
  const customAi = import.meta.env.VITE_AI_API_URL;
  if (customAi) {
    return customAi.replace(/\/+$/, '') + '/api/v1';
  }
  return 'https://nivara-ai-platform.onrender.com/api/v1';
};

/**
 * Generate a cryptographically unguessable room ID for Jitsi sessions.
 */
export const generateSecureRoomId = (type: SupportSessionType): string => {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').substring(0, 10)
    : Math.random().toString(36).substring(2, 12);
  const timePart = Date.now().toString(36);
  return `nivara-support-${type}-${timePart}-${randomPart}`;
};

export const supportRequestService = {
  /**
   * Create an SOS support request in FastAPI Backend and mirror in Firestore.
   * Generates a single secure roomName and sets status to "waiting".
   */
  async createSupportRequest(
    callType: SupportSessionType,
    studentName?: string
  ): Promise<SupportRequestDoc> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to request emergency counseling support.');
    }

    const preferredName = studentName || user.displayName || 'Student';
    let roomName = generateSecureRoomId(callType);
    let requestId = `sos-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // 1. Authorize via FastAPI backend on Render
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${getBackendApiBase()}/support/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          callType,
          studentName: preferredName,
          requestId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.roomName) {
          roomName = data.roomName;
        }
        if (data?.requestId) {
          requestId = data.requestId;
        }
      }
    } catch (err) {
      console.warn('[SupportRequestService] FastAPI backend create note (continuing with Firestore mirror):', err);
    }

    // 2. Persist in Firestore supportRequests collection
    const docRef = doc(db, 'supportRequests', requestId);
    const payload = {
      requestId,
      studentId: user.uid,
      studentName: preferredName,
      counselorId: null,
      counselorName: null,
      callType,
      type: callType,
      status: 'waiting' as SupportRequestStatus,
      roomName,
      roomId: roomName,
      createdAt: serverTimestamp(),
      acceptedAt: null,
      startedAt: null,
      endedAt: null
    };

    await setDoc(docRef, payload);

    return {
      id: requestId,
      requestId,
      studentId: user.uid,
      studentName: preferredName,
      counselorId: null,
      counselorName: null,
      callType,
      type: callType,
      status: 'waiting',
      roomName,
      roomId: roomName,
      createdAt: new Date(),
      acceptedAt: null,
      startedAt: null,
      endedAt: null
    };
  },

  /**
   * Obtain authenticated Jitsi room credentials & JWT from the FastAPI backend.
   * Grants moderator privileges to counselors to completely prevent the
   * "The conference has not yet started because no moderators have yet arrived" barrier.
   */
  async getJoinAuthorization(
    requestId: string,
    fallbackRoomName: string,
    callType: SupportSessionType,
    isCounselor: boolean = false
  ): Promise<JitsiJoinAuthorization> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => '') : '';

    try {
      const res = await fetch(`${getBackendApiBase()}/support/${requestId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          roomName: fallbackRoomName,
          callType,
          isCounselor,
          userName: user?.displayName || (isCounselor ? 'Campus Counselor' : 'Student')
        })
      });

      if (res.ok) {
        const data = await res.json();
        return {
          configured: Boolean(data.configured),
          requestId,
          roomName: data.roomName || fallbackRoomName,
          jitsiDomain: data.jitsiDomain || data.domain || '8x8.vc',
          domain: data.domain || data.jitsiDomain || '8x8.vc',
          jwtToken: data.jwtToken || data.token || '',
          token: data.jwtToken || data.token || '',
          isModerator: Boolean(data.isModerator),
          callType,
          message: data.message || null
        };
      }
    } catch (e) {
      console.warn('[SupportRequestService] Error retrieving join authorization from FastAPI backend:', e);
    }

    // Unconfigured safe fallback
    return {
      configured: false,
      requestId,
      roomName: fallbackRoomName,
      jitsiDomain: '8x8.vc',
      domain: '8x8.vc',
      jwtToken: '',
      token: '',
      isModerator: isCounselor,
      callType,
      message: 'Secure video calling is currently being configured. Please contact the counselor directly.'
    };
  },

  /**
   * Listen to status changes of a single support request in real time.
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
        const startedAt = data.startedAt instanceof Timestamp ? data.startedAt.toDate() : null;
        const endedAt = data.endedAt instanceof Timestamp
          ? data.endedAt.toDate()
          : data.completedAt instanceof Timestamp
          ? data.completedAt.toDate()
          : null;

        const effectiveCallType: SupportSessionType = data.callType || data.type || 'video';
        const effectiveRoom = data.roomName || data.roomId || '';
        const rawStatus = data.status || 'waiting';

        // Normalize legacy status names
        let normalizedStatus: SupportRequestStatus = rawStatus;
        if (rawStatus === 'pending') normalizedStatus = 'waiting';
        if (rawStatus === 'completed') normalizedStatus = 'ended';

        const requestDoc: SupportRequestDoc = {
          id: snapshot.id,
          requestId: data.requestId || snapshot.id,
          studentId: data.studentId || '',
          studentName: data.studentName || 'Student',
          counselorId: data.counselorId || null,
          counselorName: data.counselorName || null,
          callType: effectiveCallType,
          type: effectiveCallType,
          status: normalizedStatus,
          roomName: effectiveRoom,
          roomId: effectiveRoom,
          createdAt,
          acceptedAt,
          startedAt,
          endedAt,
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
   * Cancel an in-flight support request (Student action).
   */
  async cancelSupportRequest(requestId: string): Promise<void> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => '') : '';

    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'cancelled',
        endedAt: serverTimestamp()
      });

      // Notify FastAPI backend
      fetch(`${getBackendApiBase()}/support/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).catch(() => {});
    } catch (error) {
      console.error('[SupportRequestService] Error cancelling support request:', error);
      throw error;
    }
  },

  /**
   * Complete / end an ongoing support request.
   */
  async completeSupportRequest(requestId: string): Promise<void> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => '') : '';

    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'ended',
        endedAt: serverTimestamp()
      });

      // Notify FastAPI backend
      fetch(`${getBackendApiBase()}/support/${requestId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).catch(() => {});
    } catch (error) {
      console.error('[SupportRequestService] Error completing support request:', error);
      throw error;
    }
  },

  /**
   * Counselor action: Accept a support request.
   */
  async acceptSupportRequest(
    requestId: string,
    counselorId: string,
    counselorName?: string
  ): Promise<void> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => '') : '';
    const effectiveCounselorId = user?.uid || counselorId;
    const effectiveCounselorName = counselorName || user?.displayName || 'Campus Counselor';

    // 1. Notify FastAPI backend (verifies counselor role securely)
    try {
      await fetch(`${getBackendApiBase()}/support/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          counselorName: effectiveCounselorName
        })
      });
    } catch (err) {
      console.warn('[SupportRequestService] Backend accept notification note:', err);
    }

    // 2. Persist in Firestore
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'accepted',
        counselorId: effectiveCounselorId,
        counselorName: effectiveCounselorName,
        acceptedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error accepting support request in Firestore:', error);
      throw error;
    }
  },

  /**
   * Counselor action: Decline a support request.
   */
  async declineSupportRequest(requestId: string, reason?: string): Promise<void> {
    if (!auth.currentUser) {
      await auth.authStateReady().catch(() => {});
    }
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => '') : '';

    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'declined',
        declineReason: reason || 'Counselor is unavailable at this moment.',
        endedAt: serverTimestamp()
      });

      // Notify FastAPI backend
      fetch(`${getBackendApiBase()}/support/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: reason || 'Counselor is unavailable at this moment.' })
      }).catch(() => {});
    } catch (error) {
      console.error('[SupportRequestService] Error declining support request:', error);
      throw error;
    }
  },

  /**
   * Mark call as active once connection is established.
   */
  async markCallActive(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'active',
        startedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('[SupportRequestService] Note updating call to active:', error);
    }
  },

  /**
   * Counselor listener for all incoming real-time SOS requests.
   * Listens to requests where status is 'waiting' (or 'pending').
   */
  listenToPendingRequests(
    onUpdate: (requests: SupportRequestDoc[]) => void,
    onError?: (error: any) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'supportRequests'),
      where('status', 'in', ['waiting', 'pending']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SupportRequestDoc[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const effectiveCallType = data.callType || data.type || 'video';
          const effectiveRoom = data.roomName || data.roomId || '';
          return {
            id: docSnap.id,
            requestId: data.requestId || docSnap.id,
            studentId: data.studentId || '',
            studentName: data.studentName || 'Student',
            counselorId: data.counselorId || null,
            counselorName: data.counselorName || null,
            callType: effectiveCallType,
            type: effectiveCallType,
            status: data.status === 'pending' ? 'waiting' : data.status,
            roomName: effectiveRoom,
            roomId: effectiveRoom,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
            startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : null,
            endedAt: data.endedAt instanceof Timestamp ? data.endedAt.toDate() : null,
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
   * SIH Demo Simulation: Simulate counselor acceptance.
   */
  async simulateCounselorAccept(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportRequests', requestId);
      await updateDoc(docRef, {
        status: 'accepted',
        counselorId: 'counselor-duty-demo',
        counselorName: 'Dr. Madhura (Campus Clinical Counselor)',
        acceptedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[SupportRequestService] Error simulating counselor acceptance:', error);
      throw error;
    }
  }
};
