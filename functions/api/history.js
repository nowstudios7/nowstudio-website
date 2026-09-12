/* /api/history — xem lịch sử commit của các file content/*.json (chỉ đọc). */
import { verifySession } from '../_lib/auth.js';
import { listCommits } from '../_lib/github.js';

const ALLOWED_PATHS = new Set(['content/hero.json', 'content/gallery.json', 'content/guide.json']);

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const authed = await verifySession(request, env.SESSION_SECRET);
  if (!authed) return json({ ok: false, error: 'Chưa đăng nhập hoặc phiên đã hết hạn' }, 401);

  const url = new URL(request.url);
  const path = url.searchParams.get('path') || undefined;
  if (path && !ALLOWED_PATHS.has(path)) return json({ ok: false, error: 'Đường dẫn file không được phép' }, 403);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 30);
  if (!env.GITHUB_OWNER || !env.GITHUB_REPO || !env.GITHUB_BRANCH || !env.GITHUB_TOKEN) {
    return json({ ok: false, error: 'Server chưa cấu hình GITHUB_OWNER/GITHUB_REPO/GITHUB_BRANCH/GITHUB_TOKEN' }, 500);
  }

  try {
    const commits = await listCommits(env, path, limit);
    return json({
      ok: true,
      commits: commits.map((c) => ({
        sha: c.sha,
        message: c.commit && c.commit.message,
        author: c.commit && c.commit.author && c.commit.author.name,
        date: c.commit && c.commit.author && c.commit.author.date,
        url: c.html_url
      }))
    });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 502);
  }
}
