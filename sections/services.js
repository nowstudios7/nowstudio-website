/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — Section Dịch vụ (renderer riêng, như gallery.js)

   Nội dung: content/services.json (quản lý bằng admin/services.html).
   Thứ tự ưu tiên: bản nháp localStorage (chỉ khi ?cms=preview)
   → content/services.json → giữ nguyên HTML tĩnh trong trang.
   Thiết kế (font, màu, khoảng cách, breakpoint) do CSS quyết định —
   CMS chỉ đổi nội dung, thứ tự và ẩn/hiện.
   ───────────────────────────────────────────────────────────── */
(function () {
  var DRAFT_KEY = 'nowcms.services.draft';
  var SRC = (window.NOWCMS_BASE || '') + 'content/services.json';
  var PREVIEW = /[?&]cms=preview/.test(location.search);

  /* bộ icon đã chốt trong design system — CMS chỉ chọn, không vẽ mới */
  var ICONS = {
    camera: '<rect x="6" y="14" width="36" height="26" rx="3" stroke="currentColor" stroke-width="1.8"/><circle cx="24" cy="27" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M16 14v-3a2 2 0 0 1 2-2h5l3 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="37" cy="20" r="2" fill="currentColor"/>',
    makeup: '<path d="M12 36c2-4 6-6 12-6s10 2 12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="24" cy="18" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M30 14c1.5 1 2.5 2.8 2.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    dress: '<path d="M16 12h16v6l-4 4 4 4v10H16V26l4-4-4-4V12z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 12v24M28 12v24" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    retouch: '<rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 24l6 6 10-12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 18h32" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
  };
  var ICON_LABELS = { camera: 'Máy ảnh', makeup: 'Chân dung', dress: 'Váy & vest', retouch: 'Hoàn thiện' };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function unwrap(j) {
    if (!j) return null;
    var f = j.fields || j;
    return f && Array.isArray(f.items) ? f : null;
  }

  function card(it) {
    var cls = 'service-card' + (it.showDesktop === false ? ' svc-hide-d' : '') + (it.showMobile === false ? ' svc-hide-m' : '');
    return '<div class="' + cls + '" data-svc="' + esc(it._id || it.slug) + '">' +
      '<div class="service-num" data-auto=""></div>' +
      '<svg class="service-icon" viewBox="0 0 48 48" fill="none">' + (ICONS[it.icon] || ICONS.camera) + '</svg>' +
      '<div class="service-name">' + esc(it.title || it.name) + '</div>' +
      '<p class="service-desc">' + esc(it.description) + '</p>' +
      (String(it.note || '').trim() ? '<p class="service-desc service-note">' + esc(it.note) + '</p>' : '') +
      '</div>';
  }

  function paint(d) {
    var sec = document.getElementById('services');
    if (!sec || !d) return;
    var grid = sec.querySelector('.services-grid');
    var lab = sec.querySelector('.services-header .section-label');
    var tit = sec.querySelector('.services-header .section-title');
    if (lab && d.label != null) lab.textContent = d.label;
    if (tit && d.title != null) tit.innerHTML = String(d.title).split('\n').map(esc).join('<br>');
    var items = d.items.filter(function (it) { return it && it.status !== 'hidden'; });
    sec.style.display = items.length ? '' : 'none';
    grid.innerHTML = items.map(card).join('');
    var nD = items.filter(function (it) { return it.showDesktop !== false; }).length;
    grid.style.setProperty('--svc-n', Math.max(1, Math.min(nD, 4)));
    if (document.body.style.color === 'rgb(240, 236, 230)')           // giữ nền tối nếu tweak Dark đang bật
      grid.querySelectorAll('.service-card').forEach(function (el) { el.style.background = '#2a2520'; });
  }

  function boot() {
    if (!document.getElementById('services')) return;
    if (PREVIEW) {
      try { var d = unwrap(JSON.parse(localStorage.getItem(DRAFT_KEY))); if (d) { paint(d); return; } } catch (e) {}
    }
    fetch(SRC, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { var d = unwrap(j); if (d) paint(d); })
      .catch(function () { /* file:// hoặc chưa có file → giữ HTML tĩnh */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'nowcms:draft' || e.data.section !== 'services') return;
    var d = unwrap(e.data.data);
    if (d) paint(d);
  });

  window.NOWSERVICES = { icons: ICONS, iconLabels: ICON_LABELS, paint: paint };
})();
