/* /api/publish — nhận nội dung JSON đã sửa trong CMS, commit thẳng lên GitHub.
   Chỉ chấp nhận các file content/*.json mà CMS thật sự quản lý.

   Contract (widget js/nowcms-publish.js):
     POST { files: [{ path, json }], message }   -> nhiều file, MỘT commit
     POST { path, content, message }             -> dạng cũ, vẫn hỗ trợ
   Trả về:
     { ok:true, status:'nochange' }
     { ok:true, status:'published', sha, shortSha, url, branch, message, committedAt, files:[path] }
     { ok:false, code, error } */
import { verifySession } from '../_lib/auth.js';
import { commitFiles } from '../_lib/github.js';

const ALLOWED_PATHS = new Set(['content/hero.json', 'content/gallery.json', 'content/guide.json']);
const REQUIRED_ENV = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'GITHUB_TOKEN'];

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function normPath(p) {
  return String(p == null ? '' : p).trim().replace(/^\/+/, '');
}

function toContentString(raw) {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch (e) { throw new Error('Nội dung không phải JSON hợp lệ'); }
  }
  if (value == null || typeof value !== 'object') throw new Error('Nội dung phải là một object JSON');
  return JSON.stringify(value, null, 2) + '\n';
}

export async function onRequestPost(context) {
  const { env, request } = context;

  const authed = await verifySession(request, env.SESSION_SECRET);
  if (!authed) return json({ ok: false, code: 'unauthorized', error: 'Chưa đăng nhập hoặc phiên đã hết hạn' }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, code: 'payload', error: 'Payload không hợp lệ' }, 400); }

  let incoming = Array.isArray(body && body.files) ? body.files : null;
  if (!incoming && body && body.path) incoming = [{ path: body.path, json: body.content }];
  if (!incoming || !incoming.length) return json({ ok: false, code: 'payload', error: 'Không có file nào để publish' }, 400);
  if (incoming.length > ALLOWED_PATHS.size) return json({ ok: false, code: 'payload', error: 'Quá nhiều file trong một request' }, 400);

  const files = [];
  const seen = new Set();
  for (const item of incoming) {
    const path = normPath(item && item.path);
    if (!ALLOWED_PATHS.has(path)) return json({ ok: false, code: 'path', error: `Đường dẫn file không được phép: ${path || '(trống)'}` }, 403);
    if (seen.has(path)) return json({ ok: false, code: 'path', error: `File bị lặp trong request: ${path}` }, 400);
    seen.add(path);
    const raw = item && (item.json !== undefined ? item.json : item.content);
    if (raw == null) return json({ ok: false, code: 'payload', error: `Thiếu nội dung cho ${path}` }, 400);
    let content;
    try { content = toContentString(raw); } catch (e) { return json({ ok: false, code: 'payload', error: `${path}: ${e.message}` }, 400); }
    files.push({ path, content });
  }

  const missing = REQUIRED_ENV.filter((k) => !env[k]);
  if (missing.length) return json({ ok: false, code: 'config', error: `Server chưa cấu hình ${missing.join('/')}` }, 424);

  const message = (body.message && String(body.message).slice(0, 200)) ||
    `CMS publish: cap nhat ${files.map((f) => f.path).join(', ')}`;

  try {
    const result = await commitFiles(env, files, message);
    if (result.nochange) return json({ ok: true, status: 'nochange', branch: result.branch, files: [] });
    return json({
      ok: true,
      status: 'published',
      sha: result.sha,
      shortSha: String(result.sha).slice(0, 7),
      url: result.url,
      branch: result.branch,
      message,
      committedAt: result.committedAt,
      files: files.map((f) => f.path)
    });
  } catch (e) {
    // 424 chứ không phải 5xx: Cloudflare thay body 5xx bằng trang lỗi HTML,
    // khiến frontend không đọc được JSON và chỉ báo "dữ liệu không đọc được".
    return json({ ok: false, code: 'github', error: String((e && e.message) || e) }, 424);
  }
}
