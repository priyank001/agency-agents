import { scrypt as scryptCb, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, saltB64, keyB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(keyB64, 'base64url');
  if (salt.length !== 16 || expected.length !== SCRYPT.keylen) return false;
  const actual = await scrypt(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return timingSafeEqual(actual, expected);
}

/** AES-256-GCM envelope for integration secrets. Format: v1.<iv>.<ciphertext>.<tag> */
export function createSecretBox(masterKey) {
  if (typeof masterKey !== 'string' || masterKey.length < 32) {
    throw new Error('Secret master key must be at least 32 characters');
  }
  const key = createHash('sha256').update(masterKey).digest();
  return {
    encrypt(plain) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
      return ['v1', iv.toString('base64url'), ct.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
    },
    decrypt(token) {
      const [v, iv, ct, tag] = String(token).split('.');
      if (v !== 'v1' || !iv || ct === undefined || !tag) throw new Error('Malformed secret');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
    },
  };
}

export function randomId(prefix) {
  return `${prefix}_${randomBytes(12).toString('base64url')}`;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function timingSafeEqualStr(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb) && String(a).length === String(b).length;
}
