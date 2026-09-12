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

/* Commit NHIỀU file trong MỘT commit duy nhất (Git Data API).
   Trả { nochange: true } nếu cây thư mục không đổi — tránh tạo commit rỗng.
   Không force push: PATCH ref với force = false. */
export async function commitFiles(env, files, message) {
  const base = `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
  const branch = env.GITHUB_BRANCH;
  const h = authHeaders(env.GITHUB_TOKEN);
  const jh = Object.assign({ 'Content-Type': 'application/json' }, h);

  async function call(url, init, what) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`GitHub ${what} lỗi ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json();
  }

  // GitHub: ĐỌC ref dùng /git/ref/... (số ít), CẬP NHẬT ref dùng /git/refs/... (số nhiều).
  const refReadUrl = `${base}/git/ref/heads/${branch}`;
  const refWriteUrl = `${base}/git/refs/heads/${branch}`;
  const ref = await call(refReadUrl, { headers: h }, `GET ref heads/${branch}`);
  const parentSha = ref.object && ref.object.sha;
  if (!parentSha) throw new Error(`Không đọc được HEAD của nhánh ${branch}`);

  const parent = await call(`${base}/git/commits/${parentSha}`, { headers: h }, 'GET commit');
  const baseTreeSha = parent.tree && parent.tree.sha;

  const tree = await call(`${base}/git/trees`, {
    method: 'POST', headers: jh,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content }))
    })
  }, 'POST tree');

  if (tree.sha === baseTreeSha) return { nochange: true, branch, parentSha };

  const commit = await call(`${base}/git/commits`, {
    method: 'POST', headers: jh,
    body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] })
  }, 'POST commit');

  await call(refWriteUrl, {
    method: 'PATCH', headers: jh,
    body: JSON.stringify({ sha: commit.sha, force: false })
  }, 'PATCH ref');

  return {
    nochange: false,
    branch,
    sha: commit.sha,
    url: commit.html_url || `https://github.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commit/${commit.sha}`,
    committedAt: (commit.committer && commit.committer.date) || new Date().toISOString()
  };
}

export async function listCommits(env, path, perPage) {
  const params = new URLSearchParams({ sha: env.GITHUB_BRANCH, per_page: String(perPage || 10) });
  if (path) params.set('path', path);
  const url = `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commits?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(env.GITHUB_TOKEN) });
  if (!res.ok) throw new Error(`GitHub GET commits lỗi ${res.status}: ${await res.text()}`);
  return res.json();
}
