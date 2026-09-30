/* NOW·STUDIO — Feedback renderer (một nguồn dữ liệu, hai nơi hiển thị)
   Nguồn: nháp localStorage (chỉ ?cms=preview) → content/feedback.json → window.FEEDBACK_FALLBACK.
   • Hero + collection (#testimonial): item status === 'published' (bản cũ không có status = published), theo thứ tự mảng.
   • Mini strip (#t-strip, dưới Hero trang chủ): published + homepage !== false. Autoplay 5s. Click → feedback/index.html?id=<slug>.
   • Trang Feedback (window.NOWFEEDBACK_PAGE): đọc ?id=, đồng bộ URL khi chuyển (pushState), hỗ trợ Back/Reload.
   Item: { _id, slug, status, homepage, couple, displayName, service, eventDate, year, location, label, text, short, illustration, createdAt, updatedAt }
   Dữ liệu cũ { text, author } vẫn đọc được. */
(function () {
  var DRAFT_KEY = 'nowcms.feedback.draft';
  var BASE = window.NOWCMS_BASE || '';
  var SRC = BASE + 'content/feedback.json';
  var PREVIEW = /[?&]cms=preview/.test(location.search);
  var PAGE = !!window.NOWFEEDBACK_PAGE;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var DELAY = 5000, RESUME = 7000;
  var items = [], idx = 0, sec, vp, dots, list, empty;
  var strip, sItems = [], sIdx = 0, sTimer = null, sHold = 0, sVisible = true;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function unwrap(j) { if (!j) return null; if (Array.isArray(j)) return j; var f = j.fields || j; return f && Array.isArray(f.items) ? f.items : null; }
  function slugify(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function svcLabel(v) { var t = (window.NOW_SERVICE_TYPES || []).filter(function (x) { return x.value === v; })[0]; return t ? t.label : ''; }
  function authorParts(it) { var a = String(it.author || ''); var k = a.indexOf('—'); return k < 0 ? [a.trim(), ''] : [a.slice(0, k).trim(), a.slice(k + 1).trim()]; }
  function name(it) { return String(it.displayName || it.couple || authorParts(it)[0]).trim(); }
  function year(it) { var d = String(it.eventDate || ''); return /^\d{4}/.test(d) ? d.slice(0, 4) : String(it.year || '').trim(); }
  function sid(it) { return String(it.slug || slugify(String(it._id || '').replace(/^fb-/, '')) || slugify(name(it))); }
  function isPub(it) { return it && (it.status == null || it.status === 'published') && String(it.text || '').trim(); }
  function listMeta(it) { return [svcLabel(it.service), year(it)].filter(Boolean).join(' · '); }
  function heroLine(it) {
    var sub = String(it.label || '').trim() || [svcLabel(it.service), String(it.location || '').trim(), year(it)].filter(Boolean).join(' · ') || authorParts(it)[1];
    return name(it) + (sub ? ' — ' + sub : '');
  }
  function shortQuote(it) {
    var s = String(it.short || '').trim(); if (s) return s;
    s = String(it.text || '').replace(/\s+/g, ' ').trim();
    if (s.length <= 130) return s;
    s = s.slice(0, 130); var k = s.lastIndexOf(' ');
    return s.slice(0, k > 80 ? k : 130).replace(/[,.;:!?\s]+$/, '') + '…';
  }
  function art(it, cls) { if (it.illustration === 'none' || !window.NOW_ILLUS) return ''; return NOW_ILLUS.svg(it.illustration || 'together', cls); }
  function pageHref(it) { return BASE + 'feedback/index.html?' + (PREVIEW ? 'cms=preview&' : '') + 'id=' + encodeURIComponent(sid(it)); }

  /* ── URL (chỉ trang Feedback) ── */
  function urlId() { var m = location.search.match(/[?&]id=([^&]+)/); return m ? decodeURIComponent(m[1]) : ''; }
  function writeUrl(replace) {
    if (!PAGE || !items[idx]) return;
    var q = (PREVIEW ? 'cms=preview&' : '') + 'id=' + encodeURIComponent(sid(items[idx]));
    if (urlId() === sid(items[idx]) && !replace) return;
    try { history[replace ? 'replaceState' : 'pushState']({ fb: sid(items[idx]) }, '', location.pathname + '?' + q); } catch (e) {}
  }
  function indexOfId(id) { for (var i = 0; i < items.length; i++) if (sid(items[i]) === id) return i; return -1; }

  /* ── HERO ── */
  function paintActive() {
    if (dots) dots.querySelectorAll('.t-dot').forEach(function (b, i) {
      var on = i === idx; b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      b.tabIndex = on ? 0 : -1;
    });
    if (list) list.querySelectorAll('.t-card').forEach(function (b, i) {
      var on = i === idx; b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  function show(next, dir, anim) {
    vp.querySelectorAll('.t-slide').forEach(function (s, i) {
      if (anim === false) s.style.transition = 'none';
      else if (i === next) { s.style.transition = 'none'; s.style.setProperty('--t-from', (dir * 14) + 'px'); void s.offsetWidth; s.style.transition = ''; }
      else if (i === idx) s.style.setProperty('--t-from', (-dir * 14) + 'px');
      s.classList.toggle('active', i === next);
      s.setAttribute('aria-hidden', i === next ? 'false' : 'true');
      if (anim === false) { void s.offsetWidth; s.style.transition = ''; }
    });
    idx = next; paintActive();
  }
  function go(n, dir, opt) {
    if (!items.length) return;
    var next = (n + items.length) % items.length;
    if (next === idx) return;
    show(next, dir || (next > idx ? 1 : -1));
    if (!(opt && opt.noUrl)) writeUrl(false);
  }
  function goId(id, opt) { var k = indexOfId(id); if (k > -1) { if (k === idx) return true; show(k, k > idx ? 1 : -1, opt && opt.instant ? false : undefined); if (!(opt && opt.noUrl)) writeUrl(false); return true; } return false; }

  function renderHero(src) {
    if (!sec) return;
    var keep = items[idx] ? sid(items[idx]) : '';
    items = src.filter(isPub);
    if (!items.length) {
      if (PAGE) { vp.innerHTML = ''; dots.innerHTML = ''; if (list) list.innerHTML = ''; if (empty) empty.hidden = false; }
      else sec.style.display = 'none';
      return;
    }
    if (empty) empty.hidden = true;
    sec.style.display = '';
    var n = items.length;
    vp.innerHTML = items.map(function (it, i) {
      var a = art(it, 't-illus');
      return '<div class="t-slide' + (i === 0 ? ' active' : '') + '" id="fb-' + esc(sid(it)) + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + n + '" aria-hidden="' + (i === 0 ? 'false' : 'true') + '">' +
        '<p class="testimonial-quote">' + esc(it.text) + '</p>' + (a || '<span class="t-illus-gap"></span>') +
        '<div class="testimonial-author">' + esc(heroLine(it)) + '</div></div>';
    }).join('');
    dots.innerHTML = n > 1 ? items.map(function (it, i) {
      return '<button type="button" class="t-dot' + (i === 0 ? ' active' : '') + '"' + (i === 0 ? ' aria-current="true"' : '') + ' tabindex="' + (i === 0 ? 0 : -1) + '" aria-label="Cảm nhận ' + (i + 1) + ' trên ' + n + ': ' + esc(name(it)) + '"></button>';
    }).join('') : '';
    dots.style.display = n > 1 ? '' : 'none';
    if (list) {
      list.innerHTML = n > 1 ? items.map(function (it, i) {
        var m = listMeta(it);
        return '<button type="button" class="t-card' + (i === 0 ? ' active' : '') + '"' + (i === 0 ? ' aria-current="true"' : '') + ' aria-label="Đọc cảm nhận của ' + esc(name(it)) + '">' +
          '<span class="t-card-art">' + art(it, 't-illus-s') + '</span>' +
          '<span class="t-card-t"><span class="t-card-n">' + esc(name(it)) + '</span>' + (m ? '<span class="t-card-m">' + esc(m) + '</span>' : '') + '</span></button>';
      }).join('') : '';
      list.style.display = n > 1 ? '' : 'none';
      list.style.setProperty('--t-cols', Math.min(n, 5));
    }
    vp.tabIndex = n > 1 ? 0 : -1;
    idx = 0;
    var want = PAGE ? urlId() : keep;
    if (want) {
      var k = indexOfId(want);
      if (k > 0) show(k, 1, false);
      else if (k < 0 && PAGE && urlId()) writeUrl(true);
    }
  }

  /* ── MINI STRIP ── */
  function stripSlide(it) {
    var m = [svcLabel(it.service), String(it.location || '').trim() || String(it.label || '').trim()].filter(Boolean).join(' · ');
    var a = art(it, 't-ms-svg');
    return '<span class="t-ms">' +
      '<span class="t-ms-art' + (a ? '' : ' ph') + '" aria-hidden="true">' + (a || '<span>&amp;</span>') + '</span>' +
      '<span class="t-ms-t"><span class="t-ms-lab">A note from our couple</span>' +
      '<span class="t-ms-who"><span class="t-ms-name">' + esc(name(it)) + '</span>' + (m ? '<span class="t-ms-meta">' + esc(m) + '</span>' : '') + '</span>' +
      '<span class="t-ms-q">' + esc(shortQuote(it)) + '</span></span>' +
      '<svg class="t-ms-go" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg></span>';
  }
  function renderStrip(src) {
    if (!strip) return;
    stopAuto();
    sItems = src.filter(function (x) { return isPub(x) && x.homepage !== false; });
    if (!sItems.length) { strip.style.display = 'none'; strip.innerHTML = ''; return; }
    strip.style.display = '';
    var loop = sItems.length > 1;
    strip.innerHTML = '<a class="t-strip-btn" href="' + esc(pageHref(sItems[0])) + '"><span class="t-strip-track">' +
      sItems.map(stripSlide).join('') + (loop ? stripSlide(sItems[0]) : '') + '</span></a>';
    sIdx = 0; setTrack(false); label(); schedule();
  }
  function track() { return strip.querySelector('.t-strip-track'); }
  function setTrack(anim) { var t = track(); if (!t) return; t.style.transition = anim ? '' : 'none'; t.style.transform = 'translateX(' + (-sIdx * 100) + '%)'; if (!anim) void t.offsetWidth; }
  function label() {
    var b = strip.querySelector('.t-strip-btn'), it = sItems[sIdx % sItems.length]; if (!b || !it) return;
    b.setAttribute('aria-label', 'Đọc cảm nhận đầy đủ của ' + name(it));
    b.href = pageHref(it);
    strip.querySelectorAll('.t-ms').forEach(function (s, i) { s.setAttribute('aria-hidden', i === sIdx ? 'false' : 'true'); });
  }
  function stripNext() {
    var n = sItems.length; if (n < 2 || !track()) return;
    sIdx++;
    if (RM.matches) { if (sIdx >= n) sIdx = 0; setTrack(false); }
    else setTrack(true);
    label();
  }
  function onTrackEnd(e) { if (e.target === track() && sIdx >= sItems.length) { sIdx = 0; setTrack(false); label(); } }
  function stopAuto() { clearTimeout(sTimer); sTimer = null; }
  function schedule(wait) {
    stopAuto();
    if (RM.matches || sItems.length < 2 || !sVisible || document.hidden || sHold) return;
    sTimer = setTimeout(function tick() {
      if (sHold || document.hidden || !sVisible) return;
      stripNext();
      sTimer = setTimeout(tick, DELAY);
    }, wait || DELAY);
  }
  function pause() { sHold++; stopAuto(); }
  function resume() { sHold = Math.max(0, sHold - 1); if (!sHold) schedule(RESUME); }

  function render(src) {
    src = Array.isArray(src) ? src : [];
    renderHero(src);
    renderStrip(src);
  }

  /* ── events ── */
  function bindHero() {
    dots.addEventListener('click', function (e) { var b = e.target.closest('.t-dot'); if (b) go([].indexOf.call(dots.children, b)); });
    if (list) list.addEventListener('click', function (e) {
      var b = e.target.closest('.t-card'); if (!b) return;
      go([].indexOf.call(list.children, b));
      var top = sec.getBoundingClientRect().top;
      if (top < -40) window.scrollTo({ top: window.pageYOffset + top - 72, behavior: RM.matches ? 'auto' : 'smooth' });
    });
    sec.addEventListener('keydown', function (e) {
      if (items.length < 2 || (list && list.contains(e.target))) return;
      var k = e.key, t = null;
      if (k === 'ArrowRight') t = idx + 1; else if (k === 'ArrowLeft') t = idx - 1;
      else if (k === 'Home') t = 0; else if (k === 'End') t = items.length - 1;
      if (t === null) return;
      e.preventDefault();
      go(t, k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0);
      if (dots.contains(document.activeElement)) dots.children[idx].focus();
    });
    var x0 = null, y0 = 0, lock = null;
    vp.addEventListener('touchstart', function (e) { if (items.length < 2) return; var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; lock = null; }, { passive: true });
    vp.addEventListener('touchmove', function (e) {
      if (x0 === null || lock) return;
      var t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    }, { passive: true });
    vp.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (lock === 'x' && Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      x0 = null;
    });
    if (PAGE) window.addEventListener('popstate', function () {
      var id = urlId(); if (!id && items.length) { if (idx !== 0) show(0, -1); return; }
      goId(id, { noUrl: true });
    });
  }
  function bindStrip() {
    strip.addEventListener('transitionend', onTrackEnd);
    strip.addEventListener('mouseenter', pause); strip.addEventListener('mouseleave', resume);
    strip.addEventListener('focusin', pause); strip.addEventListener('focusout', resume);
    strip.addEventListener('touchstart', function () { schedule(RESUME); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sVisible = es[0].isIntersecting; if (sVisible) schedule(); else stopAuto(); }, { threshold: 0.3 }).observe(strip);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); else stopAuto(); });
    if (RM.addEventListener) RM.addEventListener('change', function () { if (RM.matches) { stopAuto(); if (sIdx >= sItems.length) { sIdx = 0; setTrack(false); } } else schedule(); });
  }

  function boot() {
    sec = document.getElementById('testimonial');
    vp = document.getElementById('t-viewport'); dots = document.getElementById('t-dots');
    list = document.getElementById('t-list'); empty = document.getElementById('t-empty');
    strip = document.getElementById('t-strip');
    if (!vp || !dots) sec = null;
    if (sec) bindHero();
    if (strip) bindStrip();
    if (!sec && !strip) return;
    if (window.FEEDBACK_FALLBACK) render(window.FEEDBACK_FALLBACK);
    if (PREVIEW) { try { var d = unwrap(JSON.parse(localStorage.getItem(DRAFT_KEY))); if (d) { render(d); return; } } catch (e) {} }
    fetch(SRC, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { var d = unwrap(j); if (d) render(d); else if (!window.FEEDBACK_FALLBACK) render([]); })
      .catch(function () { if (!window.FEEDBACK_FALLBACK) render([]); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'nowcms:draft' || e.data.section !== 'feedback') return;
    var d = unwrap(e.data.data); if (d) render(d);
  });
  window.setTestimonial = function (i) { go(i); };
  window.NOWFEEDBACK = {
    render: render, go: go,
    goId: function (id) { return goId(id, { noUrl: !PAGE }); },
    count: function () { return items.length; }, stripCount: function () { return sItems.length; },
    idOf: sid, shortQuote: shortQuote, slugify: slugify
  };
})();
