/* /api/upload — tải ảnh feedback (đã nén ở trình duyệt, admin/proofs.html) lên repo: media/feedback/*.
   Dùng chung đăng nhập (cookie phiên) và cách commit với /api/publish.
   Chỉ nhận: đúng thư mục media/feedback, đuôi webp/jpg/png, nội dung khớp chữ ký ảnh,
   ≤ 4 file/lần, ≤ 4 MB/ảnh, ≤ 9 MB/lần. Không ghi đè ảnh đã có.

   POST { files: [{ path, b64 }] }
   Trả về: { ok:true, status:'uploaded', sha, shortSha, files:[path] } | { ok:false, code, error } */
import { verifySession } from '../_lib/auth.js';
import { commitFiles } from '../_lib/github.js';

const PATH_OK = /^media\/feedback\/[a-z0-9][a-z0-9-]{2,80}\.(webp|jpg|png)$/;
const B64_OK = /^[A-Za-z0-9+/]+={0,2}$/;
const SIG = { webp: 'UklGR', jpg: '/9j/', png: 'iVBORw0KGgo' };
const MAX_FILES = 4;
const MAX_FILE = Math.ceil(4 * 1024 * 1024 * 4 / 3);   // ~4 MB sau giải mã
const MAX_TOTAL = Math.ceil(9 * 1024 * 1024 * 4 / 3);  // ~9 MB mỗi lần
const REQUIRED_ENV = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'GITHUB_TOKEN'];

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

async function exists(env, path) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const res = await fetch(url, { method: 'GET', headers: {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'nowstudio-cms-upload' } });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`GitHub kiểm tra file lỗi ${res.status}`);
  return true;
}

export async function onRequestPost(context) {
  const { env, request } = context;

  const authed = await verifySession(request, env.SESSION_SECRET);
  if (!authed) return json({ ok: false, code: 'unauthorized', error: 'Chưa đăng nhập hoặc phiên đã hết hạn' }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, code: 'payload', error: 'Payload không hợp lệ' }, 400); }
  const incoming = Array.isArray(body && body.files) ? body.files : null;
  if (!incoming || !incoming.length) return json({ ok: false, code: 'payload', error: 'Không có ảnh nào để tải lên' }, 400);
  if (incoming.length > MAX_FILES) return json({ ok: false, code: 'payload', error: `Tối đa ${MAX_FILES} file mỗi lần tải` }, 400);

  const files = [];
  const seen = new Set();
  let total = 0;
  for (const f of incoming) {
    const path = String((f && f.path) || '').trim();
    if (!PATH_OK.test(path)) return json({ ok: false, code: 'path', error: `Đường dẫn ảnh không được phép: ${path || '(trống)'}` }, 403);
    if (seen.has(path)) return json({ ok: false, code: 'path', error: `Ảnh bị lặp trong request: ${path}` }, 400);
    seen.add(path);
    const b64 = typeof (f && f.b64) === 'string' ? f.b64.replace(/\s/g, '') : '';
    if (!b64 || !B64_OK.test(b64)) return json({ ok: false, code: 'payload', error: 'Dữ liệu ảnh không hợp lệ' }, 400);
    const ext = path.split('.').pop();
    if (!b64.startsWith(SIG[ext])) return json({ ok: false, code: 'payload', error: `Nội dung file không khớp định dạng ảnh (${ext})` }, 400);
    if (b64.length > MAX_FILE) return json({ ok: false, code: 'too_large', error: 'Ảnh vượt 4 MB sau khi nén' }, 413);
    total += b64.length;
    if (total > MAX_TOTAL) return json({ ok: false, code: 'too_large', error: 'Tổng dung lượng một lần tải vượt 9 MB' }, 413);
    files.push({ path, b64 });
  }

  const missing = REQUIRED_ENV.filter((k) => !env[k]);
  if (missing.length) return json({ ok: false, code: 'config', error: `Server chưa cấu hình ${missing.join('/')}` }, 424);

  try {
    for (const f of files) {
      if (await exists(env, f.path)) return json({ ok: false, code: 'exists', error: `Ảnh đã tồn tại: ${f.path}` }, 409);
    }
    const result = await commitFiles(env, files, 'Upload feedback image' + (files.length > 1 ? 's' : ''));
    return json({
      ok: true,
      status: result.nochange ? 'nochange' : 'uploaded',
      sha: result.sha,
      shortSha: result.sha ? String(result.sha).slice(0, 7) : '',
      files: files.map((f) => f.path)
    });
  } catch (e) {
    // 424 thay vì 5xx để Cloudflare không thay body bằng trang lỗi HTML.
    return json({ ok: false, code: 'github', error: String((e && e.message) || e) }, 424);
  }
}
