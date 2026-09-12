/* /api/session — đăng nhập CMS bằng mật khẩu, đổi lấy cookie phiên (HttpOnly, Secure). */
import { createSessionCookie, clearSessionCookie, verifySession, verifyPassword } from '../_lib/auth.js';

function json(obj, status, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {})
  });
}

export async function onRequestGet(context) {
  const ok = await verifySession(context.request, context.env.SESSION_SECRET);
  return json({ authenticated: ok });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.CMS_PASSWORD || !env.SESSION_SECRET) {
    return json({ ok: false, error: 'Server chưa cấu hình CMS_PASSWORD/SESSION_SECRET' }, 500);
  }
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'Payload không hợp lệ' }, 400); }
  const password = body && body.password;
  if (!password || !(await verifyPassword(password, env.CMS_PASSWORD))) {
    return json({ ok: false, error: 'Sai mật khẩu' }, 401);
  }
  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}

export async function onRequestDelete(context) {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
