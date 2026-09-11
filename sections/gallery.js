/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — GALLERY (loader + render + lightbox)

   Nội dung: content/gallery.json (quản lý bằng admin/gallery.html).
   Thứ tự ưu tiên: bản nháp localStorage (chỉ khi ?cms=preview)
   → content/gallery.json → FALLBACK trong file này (an toàn, không
   bao giờ để gallery trắng).

   Trình bày (offset cột, bảng tỷ lệ, cấp chữ) nằm ở đây và trong
   sections/gallery.css — CMS không sửa được layout, chỉ sửa nội dung.
   ───────────────────────────────────────────────────────────── */
(function () {
  var DRAFT_KEY = 'nowcms.gallery.draft';
  var SRC = (window.NOWCMS_BASE || '') + 'content/gallery.json';
  var PREVIEW = /[?&]cms=preview/.test(location.search);

  /* ── art direction cố định (không do CMS quản lý) ── */
  var COLUMNS = [
    { key: 'left', offset: null },
    { key: 'center', offset: null },
    { key: 'right', offset: 'offset-1' }
  ];
  /* type + size → tỷ lệ, dùng khi ảnh mới chưa có `ratio` */
  var RATIOS = {
    portrait:  { large: '2/3',  medium: '3/4',   small: '4/5' },
    landscape: { large: '4/3',  medium: '3/2',   small: '16/9' },
    detail:    { large: '4/5',  medium: '1/1',   small: '5/4' },
    wide:      { large: '16/9', medium: '2/1',   small: '21/9' }
  };
  window.GALLERY_RATIOS = RATIOS;
  window.GALLERY_COLUMNS = COLUMNS.map(function (c) { return c.key; });

  function ratioOf(im) {
    if (im.ratio) return im.ratio;
    var t = RATIOS[im.type] || RATIOS.portrait;
    return t[im.size] || t.medium;
  }

  /* ── ảnh: srcset theo bề rộng ô, Cloudinary/Unsplash đều nhận ── */
  function sized(url, w) {
    if (!url) return '';
    if (url.indexOf('res.cloudinary.com') > -1 && url.indexOf('/upload/') > -1)
      return url.replace('/upload/', '/upload/w_' + w + ',q_auto,f_auto/');
    if (url.indexOf('images.unsplash.com') > -1) return url + '?w=' + w + '&q=80&auto=format&fit=crop';
    return url;
  }
  var WIDTHS = [500, 900, 1400, 2000];
  function srcset(url) {
    return WIDTHS.map(function (w) { return sized(url, w) + ' ' + w + 'w'; }).join(', ');
  }
  window.gallerySized = sized;

  /* ── dữ liệu dự phòng ── */
  var U = 'https://images.unsplash.com/photo-';
  var FALLBACK = {
    featured: {
      label: 'Our Work',
      heading: 'Những khoảnh khắc đáng giữ lại.',
      description: 'Những khoảnh khắc thật, được ghi lại theo cách tự nhiên nhất.',
      cta: { label: 'Xem tiếp phần kể chuyện', href: '#editorial' },
      recommendedCount: 9,
      images: [
        { _id: 'fw-1', src: U + '1519225421980-715cb0215aed', alt: 'Cô dâu chú rể trong nắng chiều', category: 'Couple', couple: 'Hải & Ngân', year: '2025' },
        { _id: 'fw-2', src: U + '1606216794074-735e91aa2c92', alt: 'Chân dung cô dâu ngoài trời', category: 'Bride', couple: 'Minh & Thư', year: '2025' },
        { _id: 'fw-3', src: U + '1583939003579-730e3918a45a', alt: 'Cặp đôi nắm tay trên đường quê', category: 'Couple', couple: 'Duy & Linh', year: '2024' },
        { _id: 'fw-4', src: U + '1520854221256-17451cc331bf', alt: 'Nghi thức trao nhẫn', category: 'Ceremony', couple: 'Phúc & Trâm', year: '2024' },
        { _id: 'fw-5', src: U + '1511285560929-80b456fea0bc', alt: 'Cặp đôi giữa cánh đồng', category: 'Couple', couple: 'Khoa & Nhi', year: '2025' },
        { _id: 'fw-6', src: U + '1457449940276-e8deed18bfff', alt: 'Bó hoa cưới và chi tiết váy', category: 'Detail', couple: 'Minh & Thư', year: '2025' },
        { _id: 'fw-7', src: U + '1522673607200-164d1b6ce486', alt: 'Chú rể chuẩn bị trước lễ', category: 'Groom', couple: 'Duy & Linh', year: '2024' },
        { _id: 'fw-8', src: U + '1519741497674-611481863552', alt: 'Khoảnh khắc cười của cặp đôi', category: 'Candid', couple: 'Hải & Ngân', year: '2025' },
        { _id: 'fw-9', src: U + '1537633552985-df8429e8048b', alt: 'Cặp đôi trong không gian tiệc cưới', category: 'Reception', couple: 'Phúc & Trâm', year: '2024' }
      ]
    },
    editorial: {
      label: 'Selected stories',
      heading: 'ẢNH CƯỚI *tự nhiên*,\nKHÔNG DÀN DỰNG,\nKHÔNG DIỄN.',
      heading2: 'GHI LẠI ĐÚNG NHỮNG GÌ\n*đã xảy ra* HÔM ĐÓ.',
      description: 'Chúng mình đi cùng cả ngày cưới và chụp phần lớn thời gian không ai để ý tới máy ảnh — lúc mẹ sửa lại tóc cho con, lúc hai người đứng riêng vài phút trước khi ra ngoài. Ảnh dựng chỉ chiếm một phần nhỏ. Phần còn lại là ngày cưới thật của bạn, đúng như nó diễn ra.',
      recommendedCount: 14,
      images: [
        { _id: 'ed-1', src: U + '1583939003579-730e3918a45a', alt: 'Cặp đôi đi trên đường quê', column: 'left', order: 1, size: 'medium', type: 'portrait', ratio: '3/4', role: 'Couple walking' },
        { _id: 'ed-2', src: U + '1519689680058-324335c77eba', alt: 'Không gian tiệc cưới buổi sớm', caption: 'Buổi sáng, trước khi mọi thứ bắt đầu', column: 'left', order: 2, size: 'medium', type: 'landscape', ratio: '3/2', role: 'Establishing' },
        { _id: 'ed-3', src: U + '1591604466107-ec97de577aff', alt: 'Cô dâu trong nắng cuối ngày', column: 'left', order: 3, size: 'small', type: 'portrait', ratio: '4/5', role: 'Bride' },
        { _id: 'ed-4', src: U + '1469371670807-013ccf25f16a', alt: 'Khoảnh khắc candid trong tiệc', column: 'left', order: 4, size: 'medium', type: 'landscape', ratio: '3/2', role: 'Candid' },
        { _id: 'ed-5', src: U + '1460978812857-470ed1c77af0', alt: 'Chi tiết nhẫn và hoa', column: 'left', order: 5, size: 'small', type: 'landscape', ratio: '16/10', role: 'Detail' },
        { _id: 'ed-6', src: U + '1511578314322-379afb476865', alt: 'Chi tiết váy cô dâu', column: 'center', order: 1, size: 'large', type: 'portrait', ratio: '2/3', role: 'Bride portrait' },
        { _id: 'ed-7', src: U + '1481253127861-534498168948', alt: 'Cặp đôi trong khoảnh khắc riêng', column: 'center', order: 2, size: 'small', type: 'portrait', ratio: '4/5', role: 'Intimate' },
        { _id: 'ed-8', src: U + '1478146896981-b80fe463b330', alt: 'Cặp đôi ngồi cạnh nhau', column: 'center', order: 3, size: 'medium', type: 'portrait', ratio: '3/4', role: 'Couple' },
        { _id: 'ed-9', src: U + '1465495976277-4387d4b0b4c6', alt: 'Nghi thức trước cổng lễ', caption: 'Nghi thức, chụp từ phía sau khách', column: 'center', order: 4, size: 'medium', type: 'portrait', ratio: '3/4', role: 'Ceremony' },
        { _id: 'ed-10', src: U + '1507504031003-b417219a0fde', alt: 'Toàn cảnh nơi tổ chức', column: 'right', order: 1, size: 'medium', type: 'landscape', ratio: '3/2', role: 'Venue' },
        { _id: 'ed-11', src: U + '1490481651871-ab68de25d43d', alt: 'Hoa và trang trí bàn tiệc', column: 'right', order: 2, size: 'small', type: 'portrait', ratio: '4/5', role: 'Decoration' },
        { _id: 'ed-12', src: U + '1544078751-58fee2d8a03b', alt: 'Gia đình hai bên', column: 'right', order: 3, size: 'medium', type: 'portrait', ratio: '3/4', role: 'Family' },
        { _id: 'ed-13', src: U + '1525328437458-0c4d4db7cab4', alt: 'Cặp đôi cuối ngày', column: 'right', order: 4, size: 'medium', type: 'landscape', ratio: '3/2', role: 'Documentary' },
        { _id: 'ed-14', src: U + '1509927083803-4bd519298ac4', alt: 'Chi tiết cuối buổi', column: 'right', order: 5, size: 'medium', type: 'detail', ratio: '1/1', role: 'Detail' }
      ],
      signature: {
        label: 'Selected stories',
        words: [
          { _id: 'w-1', text: 'NOW STUDIO', level: 1, enabled: true },
          { _id: 'w-2', text: 'PHOTOGRAPHY', level: 2, enabled: true },
          { _id: 'w-3', text: 'WEDDING DRESS', level: 3, enabled: true },
          { _id: 'w-4', text: 'MAKE UP', level: 3, enabled: true },
          { _id: 'w-5', text: 'PORTRAITS', level: 4, enabled: true },
          { _id: 'w-6', text: 'DOCUMENTARY', level: 4, enabled: true },
          { _id: 'w-7', text: 'CANDID', level: 4, enabled: true }
        ],
        cta: { label: 'View portfolio', href: '#featured' }
      }
    }
  };
  window.GALLERY_FALLBACK = FALLBACK;

  /* ── helpers ── */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rich(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>'); }
  function nl(s) { return s.replace(/\n/g, '<br>'); }
  function srcOf(im) { return im.src || im.url || ''; }

  var lbList = [];

  function figure(im, opts) {
    opts = opts || {};
    var idx = lbList.push(im) - 1;
    var url = srcOf(im);
    var meta = '';
    if (opts.meta !== false && (im.couple || im.category)) {
      meta = '<figcaption class="g-meta"><b>' + esc(im.couple || '') + '</b><span>' +
             esc([im.category, im.year].filter(Boolean).join(' · ')) + '</span></figcaption>';
    }
    return '<figure class="g-fig" role="button" tabindex="0" data-lb="' + idx + '"' +
      (opts.ratio ? ' style="aspect-ratio:' + esc(opts.ratio) + '"' : '') +
      ' data-label="' + esc(im.role || im.category || 'Ảnh') + ' — chưa có ảnh">' +
      '<img loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async" src="' + esc(sized(url, 1200)) +
      '" srcset="' + esc(srcset(url)) + '" sizes="' + esc(opts.sizes || '33vw') +
      '" alt="' + esc(im.alt) + '">' + meta + '</figure>';
  }

  function renderFeatured(root, d) {
    if (!d) return;
    var head = root.querySelector('[data-cms="gallery.featured.head"]');
    if (head) head.innerHTML =
      '<div class="g-eyebrow">' + esc(d.label) + '</div>' +
      '<h2 class="g-head">' + rich(d.heading) + '</h2>' +
      '<p class="g-desc">' + rich(d.description) + '</p><div class="f-rule"></div>';
    var grid = root.querySelector('[data-cms="gallery.featured.items"]');
    if (grid) grid.innerHTML = (d.images || []).filter(srcOf).map(function (im, i) {
      return figure(im, { sizes: '(max-width:768px) 100vw, (max-width:1024px) 50vw, 400px', eager: i < 3 });
    }).join('');
    var cta = root.querySelector('[data-cms="gallery.featured.cta"]');
    if (cta && d.cta) { cta.setAttribute('href', d.cta.href || '#'); cta.querySelector('span').textContent = d.cta.label || ''; }
  }

  function renderEditorial(root, d) {
    if (!d) return;
    var head = root.querySelector('[data-cms="gallery.editorial.head"]');
    if (head) head.innerHTML =
      '<div><span class="g-eyebrow">' + esc(d.label) + '</span>' +
      '<h2 class="g-head">' + nl(rich(d.heading || '')) + '</h2>' +
      (d.heading2 ? '<h2 class="g-head">' + nl(rich(d.heading2)) + '</h2>' : '') + '</div>' +
      '<p class="e-philosophy">' + nl(rich(d.description || '')) + '</p>';

    var cols = root.querySelector('[data-cms="gallery.editorial.columns"]');
    if (cols) {
      var imgs = (d.images || []).filter(srcOf);
      cols.innerHTML = COLUMNS.map(function (c) {
        var list = imgs.filter(function (im) { return (im.column || 'left') === c.key; })
          .sort(function (a, b) { return (+a.order || 0) - (+b.order || 0); });
        return '<div class="e-col ' + (c.offset || '') + '" data-col="' + c.key + '">' +
          list.map(function (u) {
            return '<figure class="e-unit">' +
              figure(u, { ratio: ratioOf(u), sizes: '(max-width:768px) 100vw, (max-width:1024px) 46vw, 380px', meta: false }) +
              (u.caption ? '<figcaption class="e-cap">' + esc(u.caption) + '</figcaption>' : '') +
              '</figure>';
          }).join('') + '</div>';
      }).join('');
    }

    var sg = d.signature || {};
    var label = root.querySelector('[data-cms="gallery.editorial.label"]');
    if (label) label.textContent = sg.label || d.label || '';
    var sig = root.querySelector('[data-cms="gallery.editorial.signature"]');
    if (sig) {
      var words = (sg.words || []).filter(function (w) { return w.enabled !== false && String(w.text || '').trim(); });
      var levels = [1, 2, 3, 4];
      sig.innerHTML = levels.map(function (lv, i) {
        var row = words.filter(function (w) { return (+w.level || 4) === lv; });
        if (!row.length) return '';
        return '<div class="e-sig-row r' + (i + 1) + '">' + row.map(function (w) {
          return '<span class="lv' + lv + '">' + esc(w.text) + '</span>';
        }).join('') + '</div>';
      }).join('');
    }
    var cta = root.querySelector('[data-cms="gallery.editorial.cta"]');
    if (cta && sg.cta) { cta.setAttribute('href', sg.cta.href || '#'); cta.querySelector('span').textContent = sg.cta.label || ''; }
  }

  /* ── lightbox ── */
  var lb, lbImg, lbInfo, lbCount, lbIdx = 0, lastFocus = null;
  function show(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    var im = lbList[lbIdx];
    lbImg.classList.remove('in');
    var next = new Image();
    next.onload = function () { lbImg.src = next.src; lbImg.alt = im.alt || ''; lbImg.classList.add('in'); };
    next.src = sized(srcOf(im), 2000);
    lbInfo.innerHTML = '<b>' + esc(im.couple || im.role || '') + '</b><span>' +
      esc([im.category || '', im.year || ''].filter(Boolean).join(' · ')) + '</span>';
    lbCount.textContent = (lbIdx + 1) + ' / ' + lbList.length;
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    show(i);
    lb.querySelector('.glb-x').focus();
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function wire(root) {
    if (!root || root.__wired) return;
    root.__wired = true;
    root.addEventListener('click', function (e) {
      var f = e.target.closest('[data-lb]');
      if (f) open(+f.getAttribute('data-lb'));
    });
    root.addEventListener('keydown', function (e) {
      var f = e.target.closest && e.target.closest('[data-lb]');
      if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(+f.getAttribute('data-lb')); }
    });
  }

  function initLightbox() {
    lb = document.getElementById('glb');
    if (!lb || lb.__wired) return;
    lb.__wired = true;
    lbImg = lb.querySelector('img');
    lbInfo = lb.querySelector('.glb-info');
    lbCount = lb.querySelector('.glb-count');
    lb.querySelector('.glb-x').addEventListener('click', close);
    lb.querySelector('.glb-p').addEventListener('click', function () { show(lbIdx - 1); });
    lb.querySelector('.glb-n').addEventListener('click', function () { show(lbIdx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('glb-stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(lbIdx - 1);
      if (e.key === 'ArrowRight') show(lbIdx + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(lbIdx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ── render toàn bộ ── */
  function paint(data) {
    var f = document.getElementById('featured'), e = document.getElementById('editorial');
    lbList = [];
    if (f) { renderFeatured(f, data.featured); wire(f); }
    if (e) { renderEditorial(e, data.editorial); wire(e); }
    initLightbox();
    document.querySelectorAll('#featured img, #editorial img').forEach(function (img) {
      img.addEventListener('error', function () {
        var fig = img.closest('.g-fig');
        if (fig) fig.classList.add('is-missing');
      });
    });
  }
  window.renderGallery = paint;

  function unwrap(raw) {
    if (!raw) return null;
    var d = raw.fields || raw.gallery || raw;
    if (d.fields) d = d.fields;
    return (d.featured || d.editorial) ? d : null;
  }

  function load() {
    if (PREVIEW) {
      try {
        var draft = unwrap(JSON.parse(localStorage.getItem(DRAFT_KEY)));
        if (draft) { paint(draft); return; }
      } catch (err) { /* nháp lỗi → đọc file thật */ }
    }
    fetch(SRC, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { paint(unwrap(j) || FALLBACK); })
      .catch(function () { paint(FALLBACK); });   // file:// hoặc mất mạng
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
  window.initGallery = load;

  // trang quản lý gửi bản nháp → vẽ lại ngay, không reload
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'nowcms:draft' || e.data.section !== 'gallery') return;
    var d = unwrap(e.data.data);
    if (d) paint(d);
  });
})();
