/* /api/session — đăng nhập CMS bằng mật khẩu, đổi lấy cookie phiên (HttpOnly, Secure).
   GET còn trả trạng thái cấu hình để widget Publish biết server đã sẵn sàng hay chưa.
   Không bao giờ trả giá trị secret/token/password về frontend — chỉ trả TÊN biến còn thiếu. */
import { createSessionCookie, clearSessionCookie, verifySession, verifyPassword } from '../_lib/auth.js';

const REQUIRED_ENV = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'GITHUB_TOKEN', 'CMS_PASSWORD', 'SESSION_SECRET'];

function json(obj, status, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, extraHeaders || {})
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const missing = REQUIRED_ENV.filter((k) => !env[k]);
  const authed = env.SESSION_SECRET ? await verifySession(request, env.SESSION_SECRET) : false;
  return json({
    ok: true,
    configured: missing.length === 0,
    missing,
    authed,
    authenticated: authed,
    repo: {
      owner: env.GITHUB_OWNER || '',
      repo: env.GITHUB_REPO || '',
      branch: env.GITHUB_BRANCH || ''
    }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.CMS_PASSWORD || !env.SESSION_SECRET) {
    return json({ ok: false, code: 'config', error: 'Server chưa cấu hình CMS_PASSWORD/SESSION_SECRET' }, 500);
  }
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, code: 'payload', error: 'Payload không hợp lệ' }, 400); }
  const password = body && body.password;
  if (!password || !(await verifyPassword(password, env.CMS_PASSWORD))) {
    return json({ ok: false, code: 'unauthorized', error: 'Sai mật khẩu' }, 401);
  }
  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return json({ ok: true, authed: true }, 200, { 'Set-Cookie': cookie });
}

export async function onRequestDelete(context) {
  return json({ ok: true, authed: false }, 200, { 'Set-Cookie': clearSessionCookie() });
}
