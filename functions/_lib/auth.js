/* NOW·STUDIO — CMS: ký & xác thực session cookie bằng HMAC-SHA256.
   Không lưu trạng thái phía server (stateless) — chỉ cần SESSION_SECRET. */

const COOKIE_NAME = 'now_cms_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 giờ

function b64urlEncode(bytes) {
  let str = '';
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}
async function sign(payloadStr, secret) {
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadStr));
  return b64urlEncode(new Uint8Array(sigBuf));
}
function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function createSessionCookie(secret) {
  const payload = { iat: Date.now(), exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const payloadStr = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await sign(payloadStr, secret);
  const token = `${payloadStr}.${sig}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const p of header.split(/;\s*/)) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    if (p.slice(0, idx) === name) return p.slice(idx + 1);
  }
  return null;
}

export async function verifySession(request, secret) {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payloadStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expectedSig;
  try { expectedSig = await sign(payloadStr, secret); } catch (e) { return false; }
  if (!timingSafeEqualStr(sig, expectedSig)) return false;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadStr))); } catch (e) { return false; }
  if (!payload.exp || Date.now() > payload.exp) return false;
  return true;
}

export async function verifyPassword(input, expected) {
  const a = new TextEncoder().encode(input || '');
  const b = new TextEncoder().encode(expected || '');
  if (a.length !== b.length) {
    let dummy = 0; for (let i = 0; i < a.length; i++) dummy |= a[i];
    return false;
  }
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}
