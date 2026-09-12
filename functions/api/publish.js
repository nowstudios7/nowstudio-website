/* /api/publish — nhận nội dung JSON đã sửa trong CMS, commit thẳng lên GitHub.
   Chỉ chấp nhận các file content/*.json mà CMS thật sự quản lý. */
import { verifySession } from '../_lib/auth.js';
import { getFile, putFile } from '../_lib/github.js';

const ALLOWED_PATHS = new Set(['content/hero.json', 'content/gallery.json', 'content/guide.json']);

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const authed = await verifySession(request, env.SESSION_SECRET);
  if (!authed) return json({ ok: false, error: 'Chưa đăng nhập hoặc phiên đã hết hạn' }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'Payload không hợp lệ' }, 400); }
  const path = body && body.path;
  const content = body && body.content;
  if (!path || !ALLOWED_PATHS.has(path)) return json({ ok: false, error: 'Đường dẫn file không được phép' }, 403);
  if (content == null) return json({ ok: false, error: 'Thiếu nội dung' }, 400);
  if (!env.GITHUB_OWNER || !env.GITHUB_REPO || !env.GITHUB_BRANCH || !env.GITHUB_TOKEN) {
    return json({ ok: false, error: 'Server chưa cấu hình GITHUB_OWNER/GITHUB_REPO/GITHUB_BRANCH/GITHUB_TOKEN' }, 500);
  }

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const message = (body.message && String(body.message).slice(0, 200)) || `CMS publish: cap nhat ${path}`;

  try {
    const { sha } = await getFile(env, path);
    const result = await putFile(env, path, contentStr, message, sha);
    return json({
      ok: true,
      commit: {
        sha: result.commit && result.commit.sha,
        url: result.commit && result.commit.html_url,
        message
      }
    });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 502);
  }
}
