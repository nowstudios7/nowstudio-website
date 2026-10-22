/* NOW·STUDIO — Feedback ảnh thật trên TRANG CHỦ (section #feedback). Không có trang riêng.
   Nguồn: nháp localStorage (chỉ ?cms=preview) → content/feedback-proofs.json — quản lý tại admin/proofs.html
   fields: { enabled, layout:'gallery'|'carousel', initial, sloganEvery, slogans:[{text,show}], items:[…] }
   item:   { _id, src, thumb, w, h, title, note, category, source, status:'draft'|'published'|'hidden', consent, createdAt, updatedAt }
   Công khai khi status==='published' && consent===true && ảnh hợp lệ. Thứ tự mảng = thứ tự hiển thị.
   Ảnh: https://… (imgbb/Cloudinary) hoặc media/feedback/*.webp (tải từ máy qua /api/upload).
   window.NOWPROOFS dùng chung cho admin. */
(function () {
  'use strict';
  var BASE = window.NOWCMS_BASE || '';
  var SRC = BASE + 'content/feedback-proofs.json', DRAFT = 'nowcms.proofs.draft';
  var Q = new URLSearchParams(location.search);
  var PREVIEW = Q.get('cms') === 'preview';
  var DEMO = window.NOWPROOFS_FORCE_DEMO === true; /* feedback/demo.html — dữ liệu mẫu, có nhãn, noindex */
  var CATS = [
    { id: 'after-shoot', name: 'Sau buổi chụp' },
    { id: 'after-delivery', name: 'Sau khi nhận ảnh' },
    { id: 'wedding-day', name: 'Ngày cưới' },
    { id: 'album', name: 'Album & sản phẩm' }
  ];
  var SRCS = [{ id: 'messenger', name: 'Messenger' }, { id: 'zalo', name: 'Zalo' }, { id: 'facebook', name: 'Facebook' }, { id: 'other', name: 'Khác' }]; /* chỉ dùng trong CMS */
  /* Câu nghỉ — nơi DUY NHẤT khai báo. CMS (fields.slogans) ghi đè; IDEAS = gợi ý trong admin */
  var IDEAS = [
    'Chuyên nghiệp trong từng khung hình. Tận tâm trong từng trải nghiệm.',
    'Lắng nghe điều bạn mong muốn. Chăm chút từng điều nhỏ nhất.',
    'Một bộ ảnh đẹp bắt đầu từ sự thấu hiểu.',
    'Ảnh đẹp là kết quả. Trải nghiệm tốt là điều chúng tôi muốn bạn nhớ.',
    'Ít tạo dáng hơn, nhiều cảm xúc thật hơn.',
    'Từ buổi chụp đầu tiên đến khi trao tận tay thành phẩm.',
    'Đồng hành bằng sự tận tâm, kể chuyện bằng những khoảnh khắc thật.'
  ];
  var SAY = IDEAS.slice(0, 4), LAYOUTS = ['gallery', 'carousel'], INITIALS = [4, 6, 8, 12, 16], EVERYS = [4, 6, 8, 12], STATUSES = ['draft', 'published', 'hidden'];
  var MEDIA = /^media\/feedback\/[a-z0-9][a-z0-9-]{2,80}\.(webp|jpg|png)$/;
  function find(a, k, v) { for (var i = 0; i < a.length; i++) if (a[i][k] === v) return a[i]; return null; }
  function catBy(id) { return find(CATS, 'id', id); }
  function srcBy(id) { return find(SRCS, 'id', id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isMedia(u) { return MEDIA.test(String(u || '').trim()); }
  function validUrl(u) { u = String(u || '').trim(); return isMedia(u) || /^https:\/\/[^\s"'<>]+$/i.test(u); }
  function abs(u) { u = String(u || '').trim(); return isMedia(u) ? BASE + u : u; }
  function isPublic(it) { return !!(it && it.status === 'published' && it.consent === true && (validUrl(it.src) || ((PREVIEW || DEMO) && it._demo && /^data:image\//.test(it.src)))); }
  function fullOf(it) { return abs(it.src); }
  function thumbOf(it) {
    if (validUrl(it.thumb)) return abs(it.thumb);
    var u = String(it.src || '');
    if (u.indexOf('res.cloudinary.com') > -1 && u.indexOf('/upload/') > -1) return u.replace('/upload/', '/upload/w_640,q_auto,f_auto/');
    return abs(u);
  }
  function metaOf(it) { var c = catBy(it.category); return c ? [c.name] : []; }
  function altOf(it) { var c = catBy(it.category); return 'Ảnh chụp feedback của khách hàng NOW Studio' + (c ? ' — ' + c.name : ''); }
  function cfgOf(f) {
    f = f || {};
    var sl = Array.isArray(f.slogans) ? f.slogans.filter(function (s) { return s && s.show !== false && String(s.text || '').trim(); }).map(function (s) { return String(s.text).trim(); }) : SAY.slice();
    return { enabled: f.enabled !== false, layout: LAYOUTS.indexOf(f.layout) > -1 ? f.layout : 'gallery', initial: INITIALS.indexOf(+f.initial) > -1 ? +f.initial : 8, every: EVERYS.indexOf(+f.sloganEvery) > -1 ? +f.sloganEvery : 8, slogans: sl };
  }
  var API = { categories: CATS, sources: SRCS, sloganIdeas: IDEAS, defaultSlogans: SAY, layouts: LAYOUTS, initials: INITIALS, sloganEverys: EVERYS, statuses: STATUSES,
    catBy: catBy, srcBy: srcBy, validUrl: validUrl, isMedia: isMedia, abs: abs, isPublic: isPublic, thumbOf: thumbOf, fullOf: fullOf, cfgOf: cfgOf };
  window.NOWPROOFS = API;

  var sec = document.getElementById('feedback'), colsEl = document.getElementById('fr-flow');
  if (!sec || !colsEl) return;
  var $ = function (id) { return document.getElementById(id); };
  var foot = $('fr-foot'), more = $('fr-more'), count = $('fr-count'), root = colsEl, bar = $('fr-bar'), tabs = $('fr-tabs');
  var PAGEMODE = !!window.NOWPROOFS_PAGE; /* feedback/index.html: lưới + bộ lọc danh mục, bỏ qua cờ enabled của trang chủ */
  var ALL = [], C = cfgOf({}), PAGE = C.initial, shown = PAGE, lkey = '', cache = {}, cat = 'all';
  var ARW = function (d) { return '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };

  /* ── dữ liệu ── */
  function unwrap(j) { var f = j && (j.fields || j); return f && Array.isArray(f.items) ? f : null; }
  function load() {
    if (DEMO && window.NOWPROOFS_DEMO) { apply({ items: window.NOWPROOFS_DEMO() }); return; }
    if (PREVIEW) { try { var l = unwrap(JSON.parse(localStorage.getItem(DRAFT))); if (l) { apply(l); return; } } catch (e) {} }
    fetch(SRC, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { apply(unwrap(j) || { items: [] }); })
      .catch(function () { apply({ items: [] }); });
  }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!PREVIEW || !m || m.type !== 'nowcms:draft' || m.section !== 'proofs') return;
    var l = unwrap(m.data); if (l) apply(l);
  });
  function apply(f) {
    C = cfgOf(f); PAGE = C.initial; shown = PAGE;
    ALL = f.items.filter(isPublic).map(function (x) { var o = {}; for (var k in x) o[k] = x[k]; o._id = String(o._id || o.src); return o; });
    [['fr-hero-img', f.heroImage], ['fr-cta-img', f.ctaImage]].forEach(function (p) { var el = $(p[0]); if (el && validUrl(p[1]) && el.getAttribute('src') !== abs(p[1])) el.src = abs(p[1]); });
    if (cat !== 'all' && !ALL.some(function (x) { return x.category === cat; })) cat = 'all';
    renderTabs();
    if ((!C.enabled && !PAGEMODE) || !ALL.length) {
      if (lb && !lb.hidden) close();
      colsEl.innerHTML = ''; foot.hidden = true;
      if (!C.enabled && !PAGEMODE) { sec.hidden = !PREVIEW; if (PREVIEW) colsEl.innerHTML = '<p class="fr-empty">Khu vực đang tắt trong CMS — khách sẽ không thấy khu vực này.</p>'; return; }
      /* bật nhưng chưa có ảnh: vẫn giữ khu vực, báo trung thực — không dùng ảnh giả */
      sec.hidden = false;
      colsEl.innerHTML = '<p class="fr-wait">Những lời nhắn thật đang được NOW Studio chọn lọc và xin phép khách trước khi đăng.</p>' + (PREVIEW ? '<p class="fr-empty">Chưa có feedback ảnh nào được xuất bản.</p>' : '');
      return;
    }
    sec.hidden = false; sec.dataset.layout = C.layout;
    renderGrid();
    if (lb && !lb.hidden) { lbList = current(); if (!lbList.length) close(); else { lbI = Math.min(lbI, lbList.length - 1); show(); } }
  }
  function current() { return cat === 'all' ? ALL : ALL.filter(function (x) { return x.category === cat; }); }
  /* bộ lọc danh mục (chỉ trang /feedback): chỉ hiện khi có ≥ 2 danh mục có dữ liệu và ≥ 6 ảnh */
  function renderTabs() {
    if (!bar || !tabs) return;
    var cs = CATS.filter(function (c) { return ALL.some(function (x) { return x.category === c.id; }); });
    var on = cs.length > 1 && ALL.length >= 6;
    bar.hidden = !on; if (!on) { cat = 'all'; tabs.innerHTML = ''; return; }
    tabs.innerHTML = [{ id: 'all', name: 'Tất cả feedback' }].concat(cs).map(function (c) {
      return '<button type="button" class="fr-tab" data-cat="' + c.id + '" aria-pressed="' + (cat === c.id) + '">' + esc(c.name) + '</button>';
    }).join('');
  }
  if (tabs) tabs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b || b.dataset.cat === cat) return;
    cat = b.dataset.cat; shown = PAGE; renderTabs(); renderGrid();
    var y = colsEl.getBoundingClientRect().top + window.pageYOffset - (bar.offsetHeight + (window.innerWidth <= 760 ? 64 : 72)) - 10;
    if (window.pageYOffset > y) window.scrollTo({ top: y, behavior: 'smooth' });
  });

  /* ── hiển thị: lưới masonry (desktop) · dải vuốt ngang (mobile, hoặc khi chọn 'carousel') ── */
  function lay() { if (PAGEMODE && window.innerWidth <= 760) return 1; if (!PAGEMODE && (C.layout === 'carousel' || window.innerWidth <= 760)) return 'row'; var w = colsEl.clientWidth; return w >= 1100 ? 4 : w >= 820 ? 3 : 2; }
  function ratio(it) { return it.w > 0 && it.h > 0 ? it.h / it.w : 1.6; }
  function node(it, i) {
    var key = it._id + '|' + it.src, f = cache[key];
    if (!f) {
      f = document.createElement('figure'); f.className = 'fr-item';
      var w = it.w > 0 ? it.w : 900, h = it.h > 0 ? it.h : 1440, c = catBy(it.category);
      f.innerHTML = '<button type="button" class="fr-open" aria-label="Xem lớn — ' + esc(altOf(it)) + '"><span class="fr-frame"><img alt="' + esc(altOf(it)) + '" width="' + w + '" height="' + h + '" loading="lazy" decoding="async"></span>' + (c ? '<span class="fr-cap">' + esc(c.name) + '</span>' : '') + '</button>';
      var img = f.querySelector('img');
      img.onload = function () { if (!(it.w > 0 && it.h > 0) && img.naturalWidth) { it.w = img.naturalWidth; it.h = img.naturalHeight; img.width = it.w; img.height = it.h; relayoutSoon(); } };
      img.src = thumbOf(it);
      cache[key] = f;
    }
    f.dataset.id = it._id;
    return f;
  }
  function say(t) {
    var a = document.createElement('aside'); a.className = 'fr-say'; a.setAttribute('aria-label', 'NOW Studio');
    var m = String(t).match(/^(.+?[.!?])\s+(.+)$/);
    a.innerHTML = '<span class="fr-say-rule" aria-hidden="true"></span><p>' + (m ? esc(m[1]) + ' <em>' + esc(m[2]) + '</em>' : esc(t)) + '</p>';
    return a;
  }
  function renderGrid() {
    var list = current(), out = []; lkey = lay();
    if (lkey === 'row') {
      var wrap = document.createElement('div'); wrap.className = 'fr-rowwrap';
      var row = document.createElement('div'); row.className = 'fr-row'; row.setAttribute('role', 'list'); row.setAttribute('aria-label', 'Ảnh feedback — vuốt ngang để xem thêm');
      list.forEach(function (it, i) { var n = node(it, i); n.setAttribute('role', 'listitem'); row.appendChild(n); });
      wrap.appendChild(row);
      if (list.length > 1) wrap.insertAdjacentHTML('beforeend', '<button type="button" class="fr-arrow prev" data-row="-1" aria-label="Feedback trước">' + ARW('M12 4l-6 6 6 6') + '</button><button type="button" class="fr-arrow next" data-row="1" aria-label="Feedback sau">' + ARW('M8 4l6 6-6 6') + '</button>');
      out.push(wrap);
      if (C.slogans[0]) out.push(say(C.slogans[0]));
      colsEl.replaceChildren.apply(colsEl, out);
      row.addEventListener('scroll', arrows, { passive: true }); arrows();
      foot.hidden = true;
      return;
    }
    var vis = list.slice(0, shown), k = 0;
    for (var s = 0; s < vis.length; s += C.every, k++) {
      var part = vis.slice(s, s + C.every), n = Math.min(lkey, part.length), cols = [], hs = [];
      for (var c = 0; c < n; c++) { var d = document.createElement('div'); d.className = 'fr-col'; cols.push(d); hs.push(0); }
      for (var p = 0; p < part.length; p++) {
        var q = 0; for (var x = 1; x < n; x++) if (hs[x] < hs[q] - 0.001) q = x;
        cols[q].appendChild(node(part[p], s + p)); hs[q] += ratio(part[p]) + 0.2;
      }
      var blk = document.createElement('div'); blk.className = 'fr-cols';
      blk.replaceChildren.apply(blk, cols); out.push(blk);
      if (s + C.every < vis.length && k < C.slogans.length) out.push(say(C.slogans[k]));
    }
    colsEl.replaceChildren.apply(colsEl, out);
    foot.hidden = list.length <= PAGE;
    more.hidden = list.length <= shown;
    count.textContent = 'Đang xem ' + vis.length + ' / ' + list.length;
  }
  function arrows() {
    var row = colsEl.querySelector('.fr-row'); if (!row) return;
    var pv = colsEl.querySelector('.fr-arrow.prev'), nx = colsEl.querySelector('.fr-arrow.next'); if (!pv) return;
    pv.disabled = row.scrollLeft < 8; nx.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 8;
  }
  colsEl.addEventListener('click', function (e) {
    var a = e.target.closest('[data-row]');
    if (a) { var row = colsEl.querySelector('.fr-row'); row.scrollBy({ left: +a.dataset.row * row.clientWidth * 0.8, behavior: 'smooth' }); return; }
    var b = e.target.closest('.fr-open'); if (b) open(b.closest('.fr-item').dataset.id);
  });
  var rt; function relayoutSoon() { clearTimeout(rt); rt = setTimeout(function () { if (ALL.length) renderGrid(); }, 120); }
  more.addEventListener('click', function () {
    var first = current()[shown]; shown += PAGE; renderGrid();
    var f = first && colsEl.querySelector('[data-id="' + CSS.escape(first._id) + '"] .fr-open'); if (f) f.focus({ preventScroll: true });
  });
  window.addEventListener('resize', function () { if (ALL.length && lay() !== lkey) relayoutSoon(); if (lb && !lb.hidden) layout(true); });
  API.openId = function (id) { if (ALL.some(function (x) { return x._id === id; })) open(id); };

  /* ── lightbox ── */
  var lb, st, im, ld, hint, lbList = [], lbI = 0, zoom = 1, base = 0, lastFocus = null, isLong = false, token = 0;
  var ZS = [1, 1.5, 2, 3], ZMAX = 4;
  var I = function (d) { return '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  function build() {
    lb = document.createElement('div'); lb.className = 'pf-lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Xem feedback cỡ lớn');
    lb.innerHTML = '<div class="pf-lb-bar"><div class="pf-lb-info"><span class="pf-lb-n" aria-live="polite"></span><span class="pf-lb-m"></span></div><div class="pf-lb-tools">' +
      '<button type="button" data-a="out" aria-label="Thu nhỏ">' + I('<path d="M5 10h10"/>') + '</button>' +
      '<button type="button" data-a="fit" class="pf-lb-fit">Vừa khung</button>' +
      '<button type="button" data-a="in" aria-label="Phóng to">' + I('<path d="M5 10h10M10 5v10"/>') + '</button>' +
      '<button type="button" data-a="close" class="pf-lb-x" aria-label="Đóng (Esc)">' + I('<path d="M5 5l10 10M15 5L5 15"/>') + '</button></div></div>' +
      '<div class="pf-lb-stage"><img class="pf-lb-img" alt="" draggable="false"><span class="pf-lb-load" hidden>Đang tải ảnh gốc…</span></div>' +
      '<button type="button" class="pf-lb-nav pf-prev" data-a="prev" aria-label="Feedback trước">' + I('<path d="M12 4l-6 6 6 6"/>') + '</button>' +
      '<button type="button" class="pf-lb-nav pf-next" data-a="next" aria-label="Feedback sau">' + I('<path d="M8 4l6 6-6 6"/>') + '</button>' +
      '<div class="pf-lb-hint off" aria-hidden="true">Cuộn để đọc tiếp</div>';
    document.body.appendChild(lb);
    st = lb.querySelector('.pf-lb-stage'); im = lb.querySelector('.pf-lb-img'); ld = lb.querySelector('.pf-lb-load'); hint = lb.querySelector('.pf-lb-hint');
    lb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (b) { var a = b.dataset.a; if (a === 'close') close(); else if (a === 'prev') go(-1); else if (a === 'next') go(1); else if (a === 'in') step(1); else if (a === 'out') step(-1); else if (a === 'fit') setZoom(1); return; }
      if (e.target === st && !moved) close();
    });
    st.addEventListener('scroll', function () { if (st.scrollTop > 40) hint.classList.add('off'); }, { passive: true });
    im.addEventListener('dblclick', function (e) { var r = st.getBoundingClientRect(); setZoom(zoom > 1 ? 1 : 2, e.clientX - r.left, e.clientY - r.top); });
    /* kéo để xem khi đã phóng to (chuột) */
    var drag = null, moved = false;
    im.addEventListener('pointerdown', function (e) {
      moved = false; if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (st.scrollWidth <= st.clientWidth + 1 && st.scrollHeight <= st.clientHeight + 1) return;
      drag = { x: e.clientX, y: e.clientY, l: st.scrollLeft, t: st.scrollTop }; im.setPointerCapture(e.pointerId); e.preventDefault();
    });
    im.addEventListener('pointermove', function (e) {
      if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; lb.classList.add('dragging'); }
      st.scrollLeft = drag.l - dx; st.scrollTop = drag.t - dy;
    });
    function endDrag() { drag = null; lb.classList.remove('dragging'); setTimeout(function () { moved = false; }, 0); }
    im.addEventListener('pointerup', endDrag); im.addEventListener('pointercancel', endDrag);
    /* cảm ứng: chụm 2 ngón để zoom, vuốt ngang để chuyển, chạm đúp để phóng to */
    var t0 = null, pinch = null, lastTap = 0;
    st.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { var r = st.getBoundingClientRect(); pinch = { d: dist(e.touches), z: zoom, x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top }; t0 = null; }
      else if (e.touches.length === 1) t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }, { passive: true });
    st.addEventListener('touchmove', function (e) {
      if (pinch && e.touches.length === 2) { e.preventDefault(); setZoom(pinch.z * dist(e.touches) / pinch.d, pinch.x, pinch.y); }
    }, { passive: false });
    st.addEventListener('touchend', function (e) {
      if (pinch) { if (e.touches.length < 2) pinch = null; return; }
      if (!t0) return;
      var t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, now = Date.now();
      var flat = st.scrollWidth <= st.clientWidth + 2;
      if (zoom === 1 && flat && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && now - t0.t < 700) { go(dx < 0 ? 1 : -1); t0 = null; return; }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && e.target === im) {
        if (now - lastTap < 300) { var r = st.getBoundingClientRect(); setZoom(zoom > 1 ? 1 : 2, t.clientX - r.left, t.clientY - r.top); lastTap = 0; e.preventDefault(); }
        else lastTap = now;
      }
      t0 = null;
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft' && zoom === 1) { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight' && zoom === 1) { e.preventDefault(); go(1); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); step(1); }
      else if (e.key === '-') { e.preventDefault(); step(-1); }
      else if (e.key === '0') { e.preventDefault(); setZoom(1); }
      else if (e.key === 'Tab') {
        var f = [].slice.call(lb.querySelectorAll('button:not(:disabled)')).filter(function (b) { return b.offsetParent !== null; });
        if (!f.length) return; var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
  function open(id) {
    if (!lb) build();
    lbList = current(); lbI = Math.max(0, lbList.map(function (x) { return x._id; }).indexOf(id));
    lastFocus = document.activeElement;
    lb.hidden = false; document.documentElement.classList.add('pf-lock');
    show(); lb.querySelector('.pf-lb-x').focus({ preventScroll: true });
  }
  function close() {
    if (!lb || lb.hidden) return;
    lb.hidden = true; document.documentElement.classList.remove('pf-lock'); token++;
    var it = lbList[lbI], target = it && colsEl.querySelector('[data-id="' + CSS.escape(it._id) + '"] .fr-open');
    var el = target || lastFocus; if (el && el.focus) el.focus({ preventScroll: true });
  }
  function go(d) { var n = lbI + d; if (n < 0 || n >= lbList.length) return; lbI = n; if (lbI >= shown) { shown = Math.ceil((lbI + 1) / PAGE) * PAGE; renderGrid(); } show(); }
  function show() {
    var it = lbList[lbI]; if (!it) return;
    var my = ++token;
    lb.querySelector('.pf-lb-n').textContent = String(lbI + 1).padStart(2, '0') + ' / ' + String(lbList.length).padStart(2, '0');
    lb.querySelector('.pf-lb-m').textContent = metaOf(it).join(' · ');
    lb.querySelector('[data-a="prev"]').disabled = lbI === 0;
    lb.querySelector('[data-a="next"]').disabled = lbI === lbList.length - 1;
    im.alt = altOf(it); zoom = 1;
    var th = thumbOf(it);
    im.src = th; layout(false); st.scrollTop = 0; st.scrollLeft = 0;
    if (th !== fullOf(it)) {
      ld.hidden = false;
      var full = new Image(); full.decoding = 'async';
      full.onload = function () { if (my !== token) return; im.src = fullOf(it); ld.hidden = true; if (!(it.w > 0)) { it.w = full.naturalWidth; it.h = full.naturalHeight; layout(true); } };
      full.onerror = function () { if (my === token) ld.hidden = true; };
      full.src = fullOf(it);
    } else ld.hidden = true;
    [lbList[lbI + 1], lbList[lbI - 1]].forEach(function (n) { if (n) { var p = new Image(); p.src = fullOf(n); } });
  }
  function layout(keep) {
    var it = lbList[lbI]; if (!it) return;
    var cs = getComputedStyle(st);
    var sw = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var sh = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var ar = it.w > 0 && it.h > 0 ? it.h / it.w : (im.naturalWidth ? im.naturalHeight / im.naturalWidth : 1.6);
    var fit = Math.min(sw, sh / ar), read = Math.min(sw, 620);
    isLong = fit < read * 0.8;
    base = isLong ? read : fit;
    if (it.w > 0) base = Math.min(base, Math.max(it.w * 1.25, Math.min(sw, 360)));
    apply_(keep);
  }
  function apply_(keep, cx, cy) {
    var fx, fy;
    if (keep) { cx = cx == null ? st.clientWidth / 2 : cx; cy = cy == null ? st.clientHeight / 2 : cy; fx = (st.scrollLeft + cx) / st.scrollWidth; fy = (st.scrollTop + cy) / st.scrollHeight; }
    im.style.width = Math.round(base * zoom) + 'px';
    if (keep) { st.scrollLeft = fx * st.scrollWidth - cx; st.scrollTop = fy * st.scrollHeight - cy; }
    lb.classList.toggle('zoomed', zoom > 1);
    lb.querySelector('[data-a="out"]').disabled = zoom <= 1;
    lb.querySelector('[data-a="in"]').disabled = zoom >= ZMAX;
    var fb = lb.querySelector('[data-a="fit"]'); fb.disabled = zoom === 1; fb.textContent = zoom === 1 ? 'Vừa khung' : Math.round(zoom * 100) + '% · Vừa khung';
    hint.classList.toggle('off', !(isLong && zoom === 1 && st.scrollTop < 40));
  }
  function setZoom(z, cx, cy) { z = Math.max(1, Math.min(ZMAX, z)); if (Math.abs(z - zoom) < 0.01) return; zoom = z; apply_(true, cx, cy); }
  function step(d) {
    var i; if (d > 0) { for (i = 0; i < ZS.length; i++) if (ZS[i] > zoom + 0.01) return setZoom(ZS[i]); setZoom(ZMAX); }
    else { for (i = ZS.length - 1; i >= 0; i--) if (ZS[i] < zoom - 0.01) return setZoom(ZS[i]); setZoom(1); }
  }

  /* ── CTA Inbox: URL từ content/social.json → fields.inbox (admin/social.html). Chưa có URL hợp lệ → ẩn nút, không dùng link thay thế. ── */
  var cta = $('fr-cta'), inbox = $('fr-inbox'), inboxNote = $('fr-inbox-note');
  function paintInbox(f) {
    var u = f ? String(f.inbox || '').trim() : '', ok = !!(u && window.NOWSOCIAL && NOWSOCIAL.valid('inbox', u));
    inbox.hidden = !ok;
    if (ok) { inbox.href = u; inbox.target = '_blank'; inbox.rel = 'noopener noreferrer'; } else inbox.removeAttribute('href');
    if (inboxNote) inboxNote.hidden = ok || !(PREVIEW || DEMO);
    /* khu vực CTA luôn hiện (còn link “Xem tất cả feedback”); chỉ nút Inbox ẩn khi thiếu URL */
  }
  if (cta && inbox) {
    var sd = null; if (PREVIEW) { try { var x = JSON.parse(localStorage.getItem('nowcms.social.draft')); sd = x && (x.fields || x); } catch (e) {} }
    if (sd) paintInbox(sd);
    else fetch(BASE + 'content/social.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { paintInbox(j && (j.fields || j)); }).catch(function () { paintInbox(null); });
    window.addEventListener('message', function (e) { var m = e.data; if (PREVIEW && m && m.type === 'nowcms:draft' && m.section === 'social' && m.data) paintInbox(m.data.fields || m.data); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
