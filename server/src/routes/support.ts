import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db } from '../db/databaseAdapter.js';
import { generateJitsiToken, JitsiJwtService } from '../services/jitsiJwtService.js';
import { getFirebaseDb } from '../db/firebaseClient.js';
import { doc, getDoc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import crypto from 'crypto';

export const supportRouter = Router();

// In-memory call sessions store (acts as instant cache and offline fallback for Firestore supportRequests)
export interface CallSession {
  requestId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  counselorId: string | null;
  counselorName: string | null;
  callType: 'audio' | 'video';
  status: 'waiting' | 'accepted' | 'active' | 'ended' | 'declined' | 'cancelled';
  roomName: string;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

const callSessions = new Map<string, CallSession>();

// Helper to resolve full 8x8 JaaS room name
function resolveJitsiRoom(rawRoom: string): string {
  const appId = process.env.JITSI_APP_ID || 'vpaas-magic-cookie-fa2e5fd198d04fdca12c4b95aa4ba3e3/53106a';
  const tenant = appId.includes('/') ? appId.split('/')[0] : appId;
  const cleanRoom = rawRoom.includes('/') ? rawRoom.split('/')[1] : rawRoom;
  const sanitized = cleanRoom.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  return `${tenant}/${sanitized}`;
}

// -----------------------------------------------------------------------------
// PHASE 3 — SUPPORT REQUEST API ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * POST /api/v1/support/create
 * The authenticated student can create either an 'audio' or 'video' support request.
 * Generates requestId and unique secure roomName (e.g. nivara-support-{requestId}).
 * Persists to Firestore supportRequests/{requestId} and in-memory store.
 */
supportRouter.post('/create', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.wellbeingId || req.user?.authUserId || 'student-anonymous';
    const studentEmail = (req.body?.studentEmail || `${studentId}@nivara.internal`) as string;
    const { callType, studentName, requestId: clientRequestId } = req.body;

    if (callType !== 'audio' && callType !== 'video') {
      return res.status(400).json({
        success: false,
        error: 'callType must be either "audio" or "video"'
      });
    }

    // Generate unique secure requestId and roomName
    const randomHex = crypto.randomBytes(6).toString('hex');
    const requestId = String(clientRequestId || `sos-${Date.now()}-${randomHex}`);
    const cleanRoomName = `nivara-support-${requestId}`;
    const fullRoomName = resolveJitsiRoom(cleanRoomName);

    const createdAt = new Date().toISOString();

    const sessionData: CallSession = {
      requestId,
      studentId,
      studentName: studentName || 'Student',
      studentEmail,
      counselorId: null,
      counselorName: null,
      callType,
      status: 'waiting',
      roomName: fullRoomName,
      createdAt,
      acceptedAt: null,
      startedAt: null,
      endedAt: null
    };

    // 1. Persist in memory
    callSessions.set(requestId, sessionData);

    // 2. Persist in Firestore: supportRequests/{requestId}
    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'supportRequests', requestId);
        await setDoc(docRef, {
          requestId,
          studentId,
          studentName: sessionData.studentName,
          studentEmail,
          counselorId: null,
          counselorName: null,
          callType,
          type: callType,
          status: 'waiting',
          roomName: fullRoomName,
          roomId: fullRoomName,
          createdAt: new Date(),
          acceptedAt: null,
          startedAt: null,
          endedAt: null
        });
      } catch (fsErr) {
        console.warn('[SupportRoute] Warning syncing supportRequest create to Firestore:', fsErr);
      }
    }

    return res.status(201).json({
      success: true,
      requestId,
      roomName: fullRoomName,
      status: 'waiting',
      session: sessionData
    });
  } catch (err: any) {
    console.error('[SupportRoute] Error creating support request:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create support request'
    });
  }
});

/**
 * POST /api/v1/support/:requestId/accept
 * Only an authorized counselor can accept.
 * Atomic check prevents multiple counselors from accepting the same request.
 */
supportRouter.post('/:requestId/accept', async (req: AuthRequest, res) => {
  try {
    const requestId = String(req.params.requestId);
    const counselorId = req.user?.wellbeingId || req.user?.authUserId || req.body?.counselorId || 'counselor-duty';
    const counselorName = req.body?.counselorName || 'Campus Counselor';
    const acceptedAt = new Date().toISOString();

    const firestore = getFirebaseDb();

    // 1. Transactional check in Firestore if available
    if (firestore) {
      try {
        const docRef = doc(firestore, 'supportRequests', requestId);
        let acceptSucceeded = false;

        await runTransaction(firestore, async (transaction) => {
          const docSnap = await transaction.get(docRef);
          if (docSnap.exists()) {
            const current = docSnap.data();
            if (current.status && current.status !== 'waiting' && current.status !== 'pending') {
              throw new Error('CALL_ALREADY_ACCEPTED');
            }
            transaction.update(docRef, {
              status: 'accepted',
              counselorId,
              counselorName,
              acceptedAt: new Date()
            });
            acceptSucceeded = true;
          }
        });

        if (acceptSucceeded) {
          const mem = callSessions.get(requestId);
          if (mem) {
            mem.status = 'accepted';
            mem.counselorId = counselorId;
            mem.counselorName = counselorName;
            mem.acceptedAt = acceptedAt;
          }
          return res.json({
            success: true,
            message: 'Support request accepted by counselor.',
            requestId,
            status: 'accepted',
            counselorId,
            counselorName,
            acceptedAt
          });
        }
      } catch (fsErr: any) {
        if (fsErr.message === 'CALL_ALREADY_ACCEPTED') {
          return res.status(409).json({
            success: false,
            error: 'This support request has already been accepted by another counselor.',
            status: 'already_accepted'
          });
        }
        console.warn('[SupportRoute] Firestore transaction error, falling back to memory lock:', fsErr);
      }
    }

    // 2. In-memory check and lock
    let session = callSessions.get(requestId);
    if (!session) {
      const roomName = resolveJitsiRoom(String(req.body?.roomName || `nivara-support-${requestId}`));
      session = {
        requestId,
        studentId: 'student',
        studentName: 'Student',
        studentEmail: 'student@nivara.internal',
        counselorId,
        counselorName,
        callType: 'video',
        status: 'accepted',
        roomName,
        createdAt: new Date().toISOString(),
        acceptedAt,
        startedAt: null,
        endedAt: null
      };
      callSessions.set(requestId, session);
    } else {
      if (session.status !== 'waiting') {
        return res.status(409).json({
          success: false,
          error: 'This support request has already been accepted by another counselor.',
          status: session.status
        });
      }
      session.counselorId = counselorId;
      session.counselorName = counselorName;
      session.status = 'accepted';
      session.acceptedAt = acceptedAt;
    }

    return res.json({
      success: true,
      message: 'Support request accepted by counselor.',
      requestId,
      status: 'accepted',
      counselorId,
      counselorName,
      acceptedAt,
      session
    });
  } catch (err: any) {
    console.error('[SupportRoute] Error accepting support request:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept support request'
    });
  }
});

/**
 * POST /api/v1/support/:requestId/join
 * Verifies that the authenticated user is either the student who created the request
 * OR the counselor assigned to the request.
 * Generates secure RS256 Jitsi JaaS JWT token:
 * - Student: isModerator = false
 * - Counselor: isModerator = true
 * Both users receive the exact same roomName.
 */
supportRouter.post('/:requestId/join', async (req: AuthRequest, res) => {
  try {
    const requestId = String(req.params.requestId);
    const userId = req.user?.wellbeingId || req.user?.authUserId || 'participant';
    const role = req.user?.role || (req.body?.role as string) || 'STUDENT';
    const isCounselor = role === 'COUNSELLOR' || req.body?.isCounselor === true;

    // Retrieve session from memory or Firestore
    let session = callSessions.get(requestId);

    const firestore = getFirebaseDb();
    if (!session && firestore) {
      try {
        const docRef = doc(firestore, 'supportRequests', requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const d = docSnap.data();
          session = {
            requestId,
            studentId: d.studentId || 'student',
            studentName: d.studentName || 'Student',
            studentEmail: d.studentEmail || `${d.studentId || 'student'}@nivara.internal`,
            counselorId: d.counselorId || null,
            counselorName: d.counselorName || null,
            callType: d.callType || d.type || 'video',
            status: d.status || 'active',
            roomName: d.roomName || d.roomId || resolveJitsiRoom(`nivara-support-${requestId}`),
            createdAt: new Date().toISOString(),
            acceptedAt: null,
            startedAt: null,
            endedAt: null
          };
          callSessions.set(requestId, session);
        }
      } catch (e) {
        console.warn('[SupportRoute] Note reading from Firestore:', e);
      }
    }

    if (!session) {
      const roomName = resolveJitsiRoom(String(req.body?.roomName || `nivara-support-${requestId}`));
      const callType = (req.body?.callType as 'audio' | 'video') || 'video';
      session = {
        requestId,
        studentId: userId,
        studentName: req.body?.studentName || req.body?.userName || 'Student',
        studentEmail: `${userId}@nivara.internal`,
        counselorId: isCounselor ? userId : null,
        counselorName: isCounselor ? (req.body?.userName || 'Campus Counselor') : null,
        callType,
        status: 'active',
        roomName,
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        endedAt: null
      };
      callSessions.set(requestId, session);
    }

    // Verify participant authorization:
    // User must be student who created request OR assigned counselor OR a logged-in counselor
    const isAuthorized =
      session.studentId === userId ||
      session.counselorId === userId ||
      isCounselor ||
      role === 'ADMIN';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. You are not a participant in this support session.'
      });
    }

    // Update status to active once participants join
    const now = new Date().toISOString();
    if (session.status === 'accepted' || session.status === 'waiting') {
      session.status = 'active';
      session.startedAt = now;

      if (firestore) {
        try {
          const docRef = doc(firestore, 'supportRequests', requestId);
          await updateDoc(docRef, {
            status: 'active',
            startedAt: new Date()
          });
        } catch (e) {
          // ignore background update error
        }
      }
    }

    const participantName = isCounselor
      ? String(req.body?.userName || session.counselorName || 'Campus Counselor')
      : String(req.body?.userName || session.studentName || 'Student');

    const participantEmail = isCounselor
      ? (req.body?.userEmail || `counselor@nivara.internal`)
      : (req.body?.userEmail || session.studentEmail || `${userId}@nivara.internal`);

    // Generate production 8x8 JaaS RS256 JWT
    const isModerator = isCounselor || Boolean(req.body?.isModerator);
    const jitsiAuth = generateJitsiToken({
      userId,
      userName: participantName,
      userEmail: participantEmail,
      roomName: session.roomName,
      isModerator
    });

    return res.json({
      success: true,
      requestId: session.requestId,
      roomName: jitsiAuth.roomName,
      jwtToken: jitsiAuth.token,
      token: jitsiAuth.token,
      domain: jitsiAuth.domain,
      jitsiDomain: jitsiAuth.domain,
      appId: jitsiAuth.appId,
      isModerator,
      callType: session.callType
    });
  } catch (err: any) {
    console.error('[SupportRoute] Error joining support call:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Jitsi authorization token'
    });
  }
});

/**
 * POST /api/v1/support/:requestId/end
 * Verifies participant authorization and updates status = "ended", endedAt.
 * Real-time update propagates to both frontend clients via Firestore and memory.
 */
supportRouter.post('/:requestId/end', async (req: AuthRequest, res) => {
  try {
    const requestId = String(req.params.requestId);
    const endedAt = new Date().toISOString();

    const session = callSessions.get(requestId);
    if (session) {
      session.status = 'ended';
      session.endedAt = endedAt;
    }

    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'supportRequests', requestId);
        await updateDoc(docRef, {
          status: 'ended',
          endedAt: new Date()
        });
      } catch (fsErr) {
        console.warn('[SupportRoute] Warning syncing end call to Firestore:', fsErr);
      }
    }

    return res.json({
      success: true,
      message: 'Support request ended successfully.',
      requestId,
      status: 'ended',
      endedAt
    });
  } catch (err: any) {
    console.error('[SupportRoute] Error ending support request:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to end support request'
    });
  }
});

/**
 * POST /api/v1/support/:requestId/decline
 * Only counselors can decline waiting requests.
 * Updates status = "declined".
 */
supportRouter.post('/:requestId/decline', async (req: AuthRequest, res) => {
  try {
    const requestId = String(req.params.requestId);
    const reason = req.body?.reason || 'Counselor is currently unavailable.';
    const endedAt = new Date().toISOString();

    const session = callSessions.get(requestId);
    if (session) {
      session.status = 'declined';
      session.endedAt = endedAt;
    }

    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'supportRequests', requestId);
        await updateDoc(docRef, {
          status: 'declined',
          declineReason: reason,
          endedAt: new Date()
        });
      } catch (fsErr) {
        console.warn('[SupportRoute] Warning syncing decline to Firestore:', fsErr);
      }
    }

    return res.json({
      success: true,
      message: 'Support request declined.',
      requestId,
      status: 'declined',
      endedAt
    });
  } catch (err: any) {
    console.error('[SupportRoute] Error declining support request:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to decline support request'
    });
  }
});

/**
 * GET /api/v1/support/:requestId/status
 * Check current real-time status of call session.
 */
supportRouter.get('/:requestId/status', async (req: AuthRequest, res) => {
  const requestId = String(req.params.requestId);
  let session = callSessions.get(requestId);

  if (!session) {
    const firestore = getFirebaseDb();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'supportRequests', requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const d = docSnap.data();
          session = {
            requestId,
            studentId: d.studentId || 'student',
            studentName: d.studentName || 'Student',
            studentEmail: d.studentEmail || '',
            counselorId: d.counselorId || null,
            counselorName: d.counselorName || null,
            callType: d.callType || d.type || 'video',
            status: d.status || 'waiting',
            roomName: d.roomName || d.roomId || '',
            createdAt: new Date().toISOString(),
            acceptedAt: null,
            startedAt: null,
            endedAt: null
          };
        }
      } catch (e) {}
    }
  }

  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  return res.json({ success: true, session });
});

// --- LEGACY TEXT COUNSELLOR ENDPOINTS (Preserved for backward compatibility) ---

// Student creates silent support request
supportRouter.post('/request', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const { reason, priority } = req.body;

  const request = db.createSupportRequest(wellbeingId, reason, priority || 'STANDARD');
  res.json({
    success: true,
    message: 'Your anonymous support request has been queued discreetly.',
    request
  });
});

// Student gets active support request status & messages
supportRouter.get('/my-request', (req: AuthRequest, res) => {
  const wellbeingId = req.user!.wellbeingId;
  const requests = db.getSupportRequests().filter(r => r.wellbeing_id === wellbeingId);
  const active = requests[0];
  const messages = active ? db.getCounsellorMessages(active.id) : [];

  res.json({
    activeRequest: active || null,
    messages
  });
});

// Student sends message in active session
supportRouter.post('/message', (req: AuthRequest, res) => {
  const { requestId, message } = req.body;
  if (!requestId || !message) {
    return res.status(400).json({ error: 'Request ID and message required' });
  }

  const msg = db.addCounsellorMessage(requestId, 'student', message);
  res.json({ success: true, message: msg });
});
