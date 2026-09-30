/* NOW·STUDIO — Mạng xã hội trong section Đặt Lịch Chụp (#contact)
   Nội dung: content/social.json (quản lý bằng admin/social.html).
   Ưu tiên: nháp localStorage (chỉ ?cms=preview) → content/social.json.
   Nền tảng chưa có link hợp lệ vẫn hiện icon + tên nhưng KHÔNG phải link (không có URL giả).
   Chỉ ẩn khi admin tắt “Hiện trên website”. Trong xem trước admin, mục chưa có link hiện mờ để dễ nhận ra. */
(function () {
  var DRAFT_KEY = 'nowcms.social.draft';
  var SRC = (window.NOWCMS_BASE || '') + 'content/social.json';
  var PREVIEW = /[?&]cms=preview/.test(location.search);

  var P = {
    facebook: { name: 'Facebook', hosts: ['facebook.com', 'fb.com', 'fb.me'],
      svg: '<path d="M15.5 3H13a4 4 0 0 0-4 4v3H6.5v3.5H9V21h3.5v-7.5H15l.6-3.5h-3.1V7.6c0-.6.4-1.1 1.1-1.1h1.9z"/>' },
    instagram: { name: 'Instagram', hosts: ['instagram.com', 'instagr.am'],
      svg: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" stroke="none"/>' },
    tiktok: { name: 'TikTok', hosts: ['tiktok.com'],
      svg: '<path d="M13.5 3v11.8a3.3 3.3 0 1 1-3.3-3.3"/><path d="M13.5 3c.4 2.7 2.3 4.6 5 4.8"/>' },
    youtube: { name: 'YouTube', hosts: ['youtube.com', 'youtu.be'],
      svg: '<rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10.2 9.3v5.4l4.6-2.7z" fill="currentColor" stroke="none"/>' }
  };
  var ORDER = ['facebook', 'instagram', 'tiktok', 'youtube'];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* chỉ chấp nhận https + đúng tên miền của nền tảng — chặn link giả / javascript: */
  function valid(id, url) {
    var p = P[id]; if (!p || !url) return false;
    var u; try { u = new URL(String(url).trim()); } catch (e) { return false; }
    if (u.protocol !== 'https:') return false;
    var h = u.hostname.toLowerCase().replace(/^www\.|^m\./, '');
    return p.hosts.some(function (d) { return h === d || h.slice(-(d.length + 1)) === '.' + d; });
  }
  function unwrap(j) { var f = j && (j.fields || j); return f && Array.isArray(f.items) ? f : null; }
  function icon(id) { return '<svg class="social-link-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[id].svg + '</svg>'; }

  function paint(d) {
    var box = document.querySelector('#contact [data-social]');
    if (!box || !d) return;
    var byId = {}; d.items.forEach(function (it) { if (it && it.id) byId[it.id] = it; });
    var html = '';
    ORDER.forEach(function (id) {
      var it = byId[id]; if (!it || it.show === false) return;
      var nm = P[id].name;
      if (valid(id, it.url)) {
        html += '<li><a class="social-link" href="' + esc(String(it.url).trim()) + '" target="_blank" rel="noopener noreferrer" aria-label="' + nm + ' của NOW Studio (mở tab mới)">' + icon(id) + '<span>' + nm + '</span></a></li>';
      } else {
        html += '<li><span class="social-link is-empty' + (PREVIEW ? ' is-draft' : '') + '" aria-label="' + nm + ' — sắp cập nhật">' + icon(id) + '<span>' + nm + '</span></span></li>';
      }
    });
    var lab = box.querySelector('.contact-social-label');
    if (lab && d.label != null) lab.textContent = d.label;
    box.querySelector('.contact-social-list').innerHTML = html;
    box.hidden = !html;
  }

  function boot() {
    if (!document.querySelector('#contact [data-social]')) return;
    if (PREVIEW) { try { var d = unwrap(JSON.parse(localStorage.getItem(DRAFT_KEY))); if (d) { paint(d); return; } } catch (e) {} }
    fetch(SRC, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { var d = unwrap(j); if (d) paint(d); })
      .catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'nowcms:draft' || e.data.section !== 'social') return;
    var d = unwrap(e.data.data); if (d) paint(d);
  });

  window.NOWSOCIAL = { platforms: P, order: ORDER, valid: valid, icon: icon, paint: paint };
})();
