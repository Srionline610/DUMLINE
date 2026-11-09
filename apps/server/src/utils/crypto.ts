import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { config } from '../config';
import { AuthTokenPayload } from '@dumline/shared';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signJwt(payload: Record<string, unknown>, expiresInSeconds = config.jwtExpiresInSeconds): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(message)
    .digest();
  const signatureB64 = base64UrlEncode(signature);

  return `${message}.${signatureB64}`;
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const expectedSig = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(message)
      .digest();
    const expectedSigB64 = base64UrlEncode(expectedSig);

    const sigBuf = Buffer.from(signatureB64);
    const expectedSigBuf = Buffer.from(expectedSigB64);

    if (sigBuf.length !== expectedSigBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedSigBuf)) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

