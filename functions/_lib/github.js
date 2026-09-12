/* NOW·STUDIO — CMS: gọi GitHub Contents/Commits API để publish trực tiếp. */

const API = 'https://api.github.com';

function authHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'nowstudio-cms-publish'
  };
}

function b64encodeUnicode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

export async function getFile(env, path) {
  const url = `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const res = await fetch(url, { headers: authHeaders(env.GITHUB_TOKEN) });
  if (res.status === 404) return { sha: null };
  if (!res.ok) throw new Error(`GitHub GET contents lỗi ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return { sha: j.sha };
}

export async function putFile(env, path, contentStr, message, sha) {
  const url = `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  const body = { message, content: b64encodeUnicode(contentStr), branch: env.GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders(env.GITHUB_TOKEN)),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub PUT contents lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function listCommits(env, path, perPage) {
  const params = new URLSearchParams({ sha: env.GITHUB_BRANCH, per_page: String(perPage || 10) });
  if (path) params.set('path', path);
  const url = `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commits?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(env.GITHUB_TOKEN) });
  if (!res.ok) throw new Error(`GitHub GET commits lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}
