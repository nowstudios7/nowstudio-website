/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — PUBLISH (CMS → Cloudflare Function → GitHub commit)

   Không có GitHub token ở đây. Frontend chỉ gửi nội dung JSON đến
   /api/publish; token nằm trong Cloudflare secrets ở server-side.

   Cách dùng trong một trang admin (một dòng):
     NOWPUBLISH.init({ section:'hero', getDoc:()=>doc, onSaved:()=>saveDraft() })

   · getDoc  — trả về bản đang sửa của section hiện tại (chưa cần lưu).
   · onSaved — gọi sau khi publish xong để trang tự cập nhật trạng thái.
   ───────────────────────────────────────────────────────────── */
(function () {
  var API = '/api';
  var BASE = window.NOWCMS_PUBLISH_BASE || '../';
  var LOG = 'nowcms.publish.log';

  /* ── các file nội dung + cách dựng payload cho từng loại ── */
  var SECTIONS = {
    hero: {
      path: 'content/hero.json', label: 'Hero', commit: 'Update hero section',
      build: function (draft) {
        var doc = window.NOWCMS ? NOWCMS.normalizeDoc('hero', clone(draft)) : draft;
        return stamp({ _type: doc._type || 'section.hero', _id: 'hero', fields: doc.fields || {} });
      }
    },
    gallery: {
      path: 'content/gallery.json', label: 'Gallery', commit: 'Update wedding gallery',
      build: function (draft) {
        var fields = draft && draft.fields ? draft.fields : draft;
        return stamp({ _type: 'section.gallery', _id: 'gallery', _note: 'Nội dung 2 gallery homepage. Xuất từ admin/gallery.html.', fields: fields || {} });
      }
    },
    guide: {
      path: 'content/guide.json', label: 'Wedding Guide', commit: 'Update Wedding Guide',
      build: function (draft) {
        return stamp(Object.assign({}, draft, {
          _type: 'collection.guide', _id: 'guide',
          _note: 'Nguồn dữ liệu Wedding Guide. Xuất từ admin/guide.html.'
        }));
      }
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function stamp(o) {
    var now = new Date().toISOString();
    o.status = 'published'; o._rev = now; o.updatedAt = now;
    return o;
  }
  var VOLATILE = { _rev: 1, updatedAt: 1, _note: 1 };
  function stable(v) {
    if (Array.isArray(v)) return v.map(stable);
    if (v && typeof v === 'object') {
      var out = {};
      Object.keys(v).sort().forEach(function (k) { if (!VOLATILE[k]) out[k] = stable(v[k]); });
      return out;
    }
    return v;
  }
  function canon(v) { try { return JSON.stringify(stable(typeof v === 'string' ? JSON.parse(v) : v)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function readLS(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── style (đồng bộ với admin: gold / bề mặt giấy) ── */
  var CSS = '\
.np-chip{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#8a7e76);border:1px solid var(--line,rgba(201,168,118,.3));border-radius:2px;padding:6px 11px;white-space:nowrap}\
.np-chip.on{color:var(--gold-dark,#a8864f);border-color:var(--gold,#c9a876)}\
.np-chip.bad{color:#b4552f;border-color:#e2c0ae}\
.np-wrap{position:relative;display:flex;gap:9px;align-items:center}\
.np-panel{position:absolute;top:calc(100% + 10px);right:0;width:min(420px,calc(100vw - 32px));background:#fff;border:1px solid var(--line,rgba(201,168,118,.3));box-shadow:0 26px 60px rgba(26,23,20,.18);padding:20px;z-index:80;display:none;text-align:left}\
.np-panel.on{display:block}\
.np-panel h4{font-family:var(--sans,sans-serif);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-dark,#a8864f);margin:0 0 10px;font-weight:400}\
.np-panel h4+h4{margin-top:22px}\
.np-panel p{font-size:12.5px;line-height:1.7;color:var(--mid,#4a4440);margin:0}\
.np-files{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}\
.np-files li{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;color:var(--dark,#1a1714);border-bottom:1px dotted var(--line,rgba(201,168,118,.3));padding-bottom:6px}\
.np-files code{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--gold-dark,#a8864f);background:none;border:0;padding:0}\
.np-msg{margin-top:14px;font-size:12.5px;color:var(--mid,#4a4440)}\
.np-msg b{font-weight:500;color:var(--dark,#1a1714)}\
.np-hist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;max-height:230px;overflow:auto}\
.np-hist li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;font-size:12px;color:var(--mid,#4a4440)}\
.np-dot{width:6px;height:6px;border-radius:50%;background:var(--gold,#c9a876);margin-top:5px}\
.np-dot.bad{background:#b4552f}\
.np-hist b{display:block;font-weight:500;color:var(--dark,#1a1714);font-size:12.5px}\
.np-hist small{color:var(--muted,#8a7e76);font-size:11px}\
.np-err{margin-top:12px;border:1px solid #e2c0ae;background:#fdf6f2;color:#8d3f1f;font-size:12.5px;line-height:1.6;padding:10px 12px}\
.np-ok{margin-top:12px;border:1px solid var(--gold,#c9a876);background:#fffaf2;color:var(--gold-dark,#a8864f);font-size:12.5px;line-height:1.6;padding:10px 12px}\
.np-row{display:flex;gap:9px;margin-top:18px;justify-content:flex-end;align-items:center}\
.np-pw{width:100%;margin-top:8px;font-size:13px;padding:10px 12px;border:1px solid var(--line,rgba(201,168,118,.3));border-radius:2px}\
.np-spin{display:inline-block;width:9px;height:9px;border:1.5px solid currentColor;border-right-color:transparent;border-radius:50%;animation:np-rot .7s linear infinite;margin-right:7px;vertical-align:-1px}\
@keyframes np-rot{to{transform:rotate(360deg)}}';

  var S = {
    cfg: null, current: null, changed: [], busy: false, maybeDirty: false, fingerprint: null,
    lastError: null, lastOk: null, authed: false, history: null, open: false
  };
  var el = {};

  function log(entry) {
    var list = readLS(LOG) || [];
    list.unshift(entry);
    try { localStorage.setItem(LOG, JSON.stringify(list.slice(0, 12))); } catch (e) {}
  }
  function localLog() { return readLS(LOG) || []; }

  /* ── thu thập file đã thay đổi trên MỌI section ── */
  function draftFor(name) {
    if (S.current && S.current.section === name && S.current.getDoc) {
      try { return S.current.getDoc(); } catch (e) {}
    }
    return readLS('nowcms.' + name + '.draft');
  }
  function fetchPublished(path) {
    return fetch(BASE + path + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .catch(function () { return null; });
  }
  function scan() {
    var names = Object.keys(SECTIONS);
    return Promise.all(names.map(function (name) {
      var def = SECTIONS[name], draft = draftFor(name);
      if (!draft) return null;
      var payload;
      try { payload = def.build(clone(draft)); } catch (e) { return null; }
      return fetchPublished(def.path).then(function (live) {
        var a = canon(payload), b = live == null ? null : canon(live);
        if (a && b && a === b) return null;
        return { section: name, path: def.path, label: def.label, json: JSON.stringify(payload, null, 2) };
      });
    })).then(function (rows) {
      S.changed = rows.filter(Boolean);
      S.maybeDirty = false;
      if (S.current && S.current.getDoc) { try { S.fingerprint = canon(clone(S.current.getDoc())); } catch (e) {} }
      paint();
      return S.changed;
    });
  }

  function commitMessage(list) {
    if (list.length === 1) return SECTIONS[list[0].section].commit;
    var labels = list.map(function (f) { return SECTIONS[f.section].label; });
    return 'Update ' + labels.join(', ') + ' content';
  }

  /* ── API ── */
  function api(path, init) {
    return fetch(API + path, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, init))
      .then(function (r) { return r.json().then(function (j) { j.__status = r.status; return j; }).catch(function () { return { ok: false, code: 'server', error: 'Server trả về dữ liệu không đọc được.', __status: r.status }; }); })
      .catch(function () { return { ok: false, code: 'network', error: 'Không kết nối được tới server Publish. Kiểm tra mạng.' }; });
  }

  /* ── UI ── */
  function build() {
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    var host = document.querySelector('.acts') || document.body;
    var wrap = document.createElement('div'); wrap.className = 'np-wrap';
    wrap.innerHTML = '<span class="np-chip" id="np-chip">Publish</span>' +
      '<button type="button" class="solid" id="np-btn">Publish</button>' +
      '<div class="np-panel" id="np-panel"></div>';
    host.appendChild(wrap);
    el.chip = wrap.querySelector('#np-chip');
    el.btn = wrap.querySelector('#np-btn');
    el.panel = wrap.querySelector('#np-panel');
    el.btn.addEventListener('click', onPublishClick);
    el.chip.addEventListener('click', function () { S.open = !S.open; if (S.open) { loadHistory(); scan(); } paint(); });
    document.addEventListener('click', function (e) { if (S.open && !wrap.contains(e.target)) { S.open = false; paint(); } });
  }

  function paint() {
    if (!el.btn) return;
    var n = S.changed.length;
    el.btn.disabled = S.busy || !S.cfg || !S.cfg.configured;
    if (!S.cfg) { el.chip.className = 'np-chip'; el.chip.textContent = 'Đang kiểm tra…'; el.btn.textContent = 'Publish'; }
    else if (!S.cfg.configured) { el.chip.className = 'np-chip bad'; el.chip.textContent = 'Chưa cấu hình'; el.btn.textContent = 'Publish'; }
    else if (S.busy) { el.chip.className = 'np-chip on'; el.chip.textContent = 'Đang publish…'; el.btn.innerHTML = '<span class="np-spin"></span>Đang publish'; }
    else if (S.lastError) { el.chip.className = 'np-chip bad'; el.chip.textContent = 'Publish lỗi'; el.btn.textContent = 'Thử lại'; }
    else if (n) { el.chip.className = 'np-chip bad'; el.chip.textContent = n + ' file chờ publish'; el.btn.textContent = 'Publish'; }
    else if (S.maybeDirty) { el.chip.className = 'np-chip'; el.chip.textContent = 'Đang có thay đổi…'; el.btn.textContent = 'Publish'; }
    else { el.chip.className = 'np-chip on'; el.chip.textContent = 'Đã publish'; el.btn.textContent = 'Publish'; }
    el.panel.classList.toggle('on', S.open);
    if (S.open) {
      var prev = el.panel.querySelector('#np-pw');
      var keep = prev ? prev.value : '', focused = prev && document.activeElement === prev;
      el.panel.innerHTML = panelHTML();
      bindPanel();
      var next = el.panel.querySelector('#np-pw');
      if (next && keep) { next.value = keep; if (focused) { next.focus(); next.setSelectionRange(keep.length, keep.length); } }
    }
  }

  function panelHTML() {
    var h = '';
    if (!S.cfg || !S.cfg.configured) {
      h += '<h4>Publish chưa sẵn sàng</h4><p>Trang này không thấy server Publish' +
        (S.cfg && S.cfg.missing && S.cfg.missing.length ? ' hoặc thiếu cấu hình: <code>' + S.cfg.missing.join('</code>, <code>') + '</code>' : '') +
        '.</p><p style="margin-top:10px">Mở CMS qua tên miền Cloudflare của website (không phải file trên máy) và cấu hình secrets theo <code>PUBLISH.md</code>.</p>';
      return h;
    }
    h += '<h4>File sẽ đưa lên website</h4>';
    if (!S.changed.length) h += '<p>Mọi nội dung đã được publish. Không có gì để đưa lên.</p>';
    else {
      h += '<ul class="np-files">' + S.changed.map(function (f) {
        return '<li><code>/' + esc(f.path) + '</code><span style="color:var(--muted,#8a7e76)">' + esc(f.label) + '</span></li>';
      }).join('') + '</ul><div class="np-msg">Commit: <b>' + esc(commitMessage(S.changed)) + '</b><br>' +
        '<span style="color:var(--muted,#8a7e76)">Nhánh ' + esc(S.cfg.repo ? S.cfg.repo.branch : '') + ' · ' + esc(S.cfg.repo ? S.cfg.repo.owner + '/' + S.cfg.repo.repo : '') + '</span></div>';
    }
    if (S.lastError) h += '<div class="np-err">' + esc(S.lastError) + '</div>';
    if (S.lastOk) h += '<div class="np-ok">' + S.lastOk + '</div>';
    if (!S.authed) h += '<div id="np-pwbox"><h4>Mật khẩu CMS</h4><input class="np-pw" type="password" id="np-pw" placeholder="Nhập để mở phiên publish 8 giờ" autocomplete="current-password"></div>';
    h += '<div class="np-row"><button type="button" id="np-refresh">Kiểm tra lại</button>' +
      (S.changed.length ? '<button type="button" class="solid" id="np-go">' + (S.busy ? 'Đang publish…' : 'Publish ngay') + '</button>' : '') + '</div>';
    h += '<h4>Lịch sử publish</h4>';
    var hist = mergedHistory();
    h += hist.length ? '<ul class="np-hist">' + hist.map(function (x) {
      return '<li><span class="np-dot' + (x.status === 'published' ? '' : ' bad') + '"></span><div><b>' +
        esc(x.message || '(không có message)') + '</b><small>' + esc(x.status === 'published' ? 'Published' : 'Failed') + ' · ' + esc(fmtTime(x.date)) +
        (x.files ? ' · ' + x.files + ' file' : '') + (x.url ? ' · <a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.shortSha || 'commit') + '</a>' : '') +
        '</small></div></li>';
    }).join('') + '</ul>' : '<p>Chưa có lần publish nào.</p>';
    return h;
  }
  function mergedHistory() {
    var out = (S.history || []).slice();
    localLog().forEach(function (x) {
      if (x.status === 'published' && out.some(function (c) { return c.sha && c.sha === x.sha; })) return;
      out.push(x);
    });
    return out.sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 8);
  }
  function bindPanel() {
    var r = el.panel.querySelector('#np-refresh'), g = el.panel.querySelector('#np-go'), pw = el.panel.querySelector('#np-pw');
    if (r) r.addEventListener('click', function () { S.lastError = null; S.lastOk = null; scan(); });
    if (g) g.addEventListener('click', onPublishClick);
    if (pw) pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onPublishClick(); } });
  }

  function loadHistory() {
    if (!S.cfg || !S.cfg.configured || !S.authed || S.history) return;
    api('/history').then(function (j) { if (j.ok) { S.history = j.commits; paint(); } });
  }

  /* ── luồng publish ── */
  function onPublishClick() {
    if (S.busy || !S.cfg || !S.cfg.configured) { S.open = true; paint(); return; }
    var field = el.panel.querySelector('#np-pw');
    var pass = field ? field.value : '';        // đọc NGAY, trước mọi lần vẽ lại
    S.lastError = null; S.lastOk = null;
    var wasOpen = S.open;
    S.open = true;
    if (!wasOpen) paint();
    scan().then(function (files) {
      if (!files.length) { S.lastOk = 'Mọi nội dung đã được publish.'; paint(); return; }
      if (!S.authed && !pass) {
        paint();
        var p = el.panel.querySelector('#np-pw');
        if (p) { p.focus(); p.placeholder = 'Nhập mật khẩu CMS rồi bấm Publish ngay'; }
        return;
      }
      run(files, pass);
    });
  }

  function run(files, password) {
    S.busy = true; paint();
    var step = S.authed || !password
      ? Promise.resolve({ ok: true })
      : api('/session', { method: 'POST', body: JSON.stringify({ password: password }) });
    step.then(function (auth) {
      if (!auth.ok) throw auth;
      S.authed = true;
      return api('/publish', {
        method: 'POST',
        body: JSON.stringify({ files: files.map(function (f) { return { path: f.path, json: f.json }; }), message: commitMessage(files) })
      });
    }).then(function (res) {
      if (!res.ok) throw res;
      S.busy = false;
      if (res.status === 'nochange') {
        S.lastOk = 'Mọi nội dung đã được publish.';
        S.changed = [];
        paint();
        return;
      }
      log({ status: 'published', message: res.message, date: res.committedAt || new Date().toISOString(), files: (res.files || []).length, sha: res.sha, shortSha: res.shortSha, url: res.url });
      S.history = null;
      var f = el.panel.querySelector('#np-pw'); if (f) f.value = '';
      S.lastOk = 'Đã commit <b>' + esc(res.shortSha) + '</b> lên nhánh ' + esc(res.branch) + ' · ' + (res.files || []).length +
        ' file. Cloudflare đang build lại website (thường 30–60 giây).' +
        (res.url ? ' <a href="' + esc(res.url) + '" target="_blank" rel="noopener">Xem commit ↗</a>' : '');
      if (S.current && S.current.onSaved) { try { S.current.onSaved(); } catch (e) {} }
      scan();
      loadHistory();
    }).catch(function (err) {
      S.busy = false;
      if (err && err.code === 'unauthorized') S.authed = false;
      S.lastError = (err && err.error) || 'Publish thất bại (lỗi không xác định).';
      log({ status: 'failed', message: commitMessage(files) + ' — ' + S.lastError, date: new Date().toISOString(), files: files.length });
      paint();
    });
  }

  /* theo dõi bản đang sửa: nếu khác lần quét trước → bật lại nút Publish */
  function watch() {
    setInterval(function () {
      if (!S.cfg || !S.cfg.configured || S.busy || !S.current || !S.current.getDoc) return;
      var fp;
      try { fp = canon(clone(S.current.getDoc())); } catch (e) { return; }
      if (fp === S.fingerprint) return;
      S.fingerprint = fp;
      if (S.open) { scan(); return; }
      S.maybeDirty = true; S.lastOk = null; paint();
    }, 2500);
  }

  window.NOWPUBLISH = {
    sections: SECTIONS,
    init: function (opts) {
      S.current = opts || null;
      if (!el.btn) build();
      paint();
      watch();
      api('/session').then(function (j) {
        S.cfg = j && j.ok ? j : { configured: false, missing: [] };
        S.authed = !!(j && j.authed);
        paint();
        if (S.cfg.configured) { scan(); if (S.authed) loadHistory(); }
      });
      return window.NOWPUBLISH;
    },
    rescan: scan,
    state: function () { return { changed: S.changed.slice(), authed: S.authed, configured: !!(S.cfg && S.cfg.configured) }; }
  };
})();
