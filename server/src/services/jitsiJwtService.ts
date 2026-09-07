import jwt from 'jsonwebtoken';

export interface GenerateJitsiTokenParams {
  userId: string;
  userName: string;
  userEmail?: string;
  roomName: string;
  isModerator: boolean;
}

export interface JitsiTokenResult {
  token: string;
  domain: string;
  appId: string;
  roomName: string;
}

export interface JitsiParticipantPayload {
  userId: string;
  userName: string;
  email?: string;
  avatarUrl?: string;
  isModerator?: boolean;
}

export interface JitsiRoomConfig {
  roomName: string;
  callType: 'audio' | 'video';
  participant: JitsiParticipantPayload;
}

export interface JitsiAuthResponse {
  roomName: string;
  jitsiDomain: string;
  jwtToken: string;
  isModerator: boolean;
  callType: 'audio' | 'video';
  domain?: string;
  appId?: string;
  token?: string;
}

/**
 * Normalizes private key loaded from environment variables.
 * Handles escaped literal \\n, surrounding quotes, and whitespace.
 */
export function normalizePrivateKey(rawKey?: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // Convert literal \n to actual newlines
  key = key.replace(/\\n/g, '\n');
  return key;
}

/**
 * PHASE 2: Official 8x8 Jitsi as a Service (JaaS) JWT Token Generator using RS256.
 *
 * Implements standard JaaS claims:
 * aud: "jitsi"
 * iss: "chat"
 * sub: JITSI_APP_ID (tenant prefix)
 * room: roomName (or cleanRoomName)
 * context.user: { id, name, email, moderator }
 */
export function generateJitsiToken(params: GenerateJitsiTokenParams): JitsiTokenResult {
  const rawAppId = process.env.JITSI_APP_ID || 'vpaas-magic-cookie-fa2e5fd198d04fdca12c4b95aa4ba3e3/53106a';
  const domain = process.env.JITSI_DOMAIN || '8x8.vc';
  const rawKey = process.env.JITSI_PRIVATE_KEY;

  if (!rawKey) {
    throw new Error('[JitsiJwtService] JITSI_PRIVATE_KEY environment variable is missing.');
  }

  const privateKey = normalizePrivateKey(rawKey);

  // Separate tenant App ID and Key ID if configured in standard vpaas-magic-cookie-XXX/YYY format
  const tenant = rawAppId.includes('/') ? rawAppId.split('/')[0] : rawAppId;
  const kid = rawAppId.includes('/') ? rawAppId : (process.env.JITSI_KEY_ID ? `${tenant}/${process.env.JITSI_KEY_ID}` : `${tenant}/53106a`);

  // Sanitize room name
  const rawRoom = params.roomName || 'nivara-emergency-support';
  const cleanRoom = rawRoom.includes('/') ? rawRoom.split('/')[1] : rawRoom;
  const sanitizedRoom = cleanRoom.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

  // On 8x8.vc JaaS, full room name is: vpaas-magic-cookie-XXX/<roomName>
  const fullRoomName = domain.includes('8x8.vc') && !sanitizedRoom.startsWith(tenant)
    ? `${tenant}/${sanitizedRoom}`
    : sanitizedRoom;

  // JaaS payload claims matching official 8x8 JaaS specification
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: tenant,
    room: sanitizedRoom,
    context: {
      user: {
        id: params.userId,
        name: params.userName || 'Student',
        email: params.userEmail || `${params.userId}@nivara.internal`,
        moderator: Boolean(params.isModerator)
      },
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        'outbound-call': false
      }
    }
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '2h', // Short, secure expiration
    header: {
      kid: kid,
      alg: 'RS256',
      typ: 'JWT'
    }
  });

  return {
    token,
    domain,
    appId: tenant,
    roomName: fullRoomName
  };
}

export class JitsiJwtService {
  public static generateJitsiToken = generateJitsiToken;

  public static generateToken(config: JitsiRoomConfig): JitsiAuthResponse {
    const result = generateJitsiToken({
      userId: config.participant.userId,
      userName: config.participant.userName,
      userEmail: config.participant.email,
      roomName: config.roomName,
      isModerator: Boolean(config.participant.isModerator)
    });

    return {
      roomName: result.roomName,
      jitsiDomain: result.domain,
      domain: result.domain,
      jwtToken: result.token,
      token: result.token,
      appId: result.appId,
      isModerator: Boolean(config.participant.isModerator),
      callType: config.callType
    };
  }
}
