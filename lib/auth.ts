// lib/auth.ts — sesi login admin berbasis cookie bertanda tangan HMAC (Web Crypto, jalan di Edge & Node)

export const SESSION_COOKIE = 'kost_session';

const enc = new TextEncoder();

async function hmac(data: string) {
  const secret = process.env.AUTH_SECRET || 'dev-secret-ganti-saya';
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** token = username.expiry.signature */
export async function createSession(username: string, days = 7) {
  const exp = Date.now() + days * 86400000;
  const payload = `${username}.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(token?: string | null) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [user, exp, sig] = parts;
  if (Number(exp) < Date.now()) return false;
  return (await hmac(`${user}.${exp}`)) === sig;
}
