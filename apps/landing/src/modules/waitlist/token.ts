import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

export type TokenPurpose = 'confirm' | 'zoho-access-token';
export type TokenKeys = { current: Uint8Array; previous?: Uint8Array };
export type OpenResult<T> = { status: 'valid'; payload: T } | { status: 'expired' } | { status: 'invalid' };

export const confirmTtlMs = 7 * 24 * 60 * 60 * 1000;

const version = 1;
const ivLength = 12;
const tagLength = 16;

const parseKey = (value: string | undefined) => {
  if (!value) return undefined;
  const key = Buffer.from(value, 'base64');
  // Buffer.from skips invalid characters, so the round trip is what proves the input was canonical base64
  return key.length === 32 && key.toString('base64') === value ? new Uint8Array(key) : undefined;
};

export const parseTokenKeys = (current: string | undefined, previous?: string): TokenKeys | undefined => {
  const currentKey = parseKey(current);
  if (!currentKey) return undefined;
  if (!previous) return { current: currentKey };
  const previousKey = parseKey(previous);
  return previousKey && { current: currentKey, previous: previousKey };
};

const aad = (purpose: TokenPurpose) => Buffer.from(`waitlist/${purpose}`);

export const sealToken = <T>(purpose: TokenPurpose, payload: T, keys: TokenKeys, ttlMs: number, now = Date.now()) => {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv('aes-256-gcm', keys.current, iv, { authTagLength: tagLength });
  cipher.setAAD(aad(purpose));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ payload, exp: now + ttlMs }), 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.of(version), iv, ciphertext, cipher.getAuthTag()]).toString('base64url');
};

const decrypt = (purpose: TokenPurpose, raw: Buffer, key: Uint8Array) => {
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(1, 1 + ivLength), { authTagLength: tagLength });
    decipher.setAAD(aad(purpose));
    decipher.setAuthTag(raw.subarray(-tagLength));
    const plaintext = Buffer.concat([decipher.update(raw.subarray(1 + ivLength, -tagLength)), decipher.final()]);
    return JSON.parse(plaintext.toString('utf8')) as { payload: unknown; exp: unknown };
  } catch {
    return undefined;
  }
};

export const openToken = <T>(purpose: TokenPurpose, token: string, keys: TokenKeys, now = Date.now()): OpenResult<T> => {
  const raw = Buffer.from(token, 'base64url');
  if (raw.length < 1 + ivLength + tagLength || raw[0] !== version) return { status: 'invalid' };
  const opened = [keys.current, keys.previous].reduce<ReturnType<typeof decrypt>>((found, key) => found ?? (key && decrypt(purpose, raw, key)), undefined);
  if (typeof opened?.exp !== 'number') return { status: 'invalid' };
  return opened.exp <= now ? { status: 'expired' } : { status: 'valid', payload: opened.payload as T };
};

export const deriveKey = (keys: TokenKeys, info: 'waitlist/throttle') => new Uint8Array(hkdfSync('sha256', keys.current, new Uint8Array(), info, 32));
