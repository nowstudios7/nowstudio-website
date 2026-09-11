/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — WEDDING GUIDE · data layer + components

   DATA LAYER
   Nguồn: content/guide.json (CMS quản lý). Thứ tự ưu tiên:
     1. Bản nháp localStorage — chỉ khi URL có ?cms=preview
     2. content/guide.json
     3. guide/guide.data.js — bản dự phòng, không bao giờ để trang trắng
   Truy cập bất đồng bộ: Guide.ready(function(G){ … }).

   API đọc (giống hợp đồng của một CMS thật):
     Guide.getArticles(opts) · getArticleBySlug · getFeatured
     getLatest · getByCategory · getRelated · getCategories · getTags

   COMPONENTS — nhận DỮ LIỆU, không biết bài cụ thể nào:
     ArticleCard · FeaturedArticle · FeatureBreak · ArticleGrid
     CategoryNavigation · ArticleMeta · ArticleContent

   Trạng thái bài: draft | scheduled | published | archived.
   Chỉ 'published' (hoặc 'scheduled' đã tới giờ) mới hiện ra ngoài.
   ───────────────────────────────────────────────────────────── */
(function () {
  var DRAFT_KEY = 'nowcms.guide.draft';
  var PREVIEW = /[?&]cms=preview/.test(location.search);
  var CONTENT = window.GUIDE_CONTENT || (window.GUIDE_BASE ? 'content/guide.json' : '../content/guide.json');

  var D = { site: {}, categories: [], tags: [], articles: [], media: [], authors: [] };
  var loaded = false, queue = [];

  /* ── helpers ── */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rich(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }
  function sized(url, w) {
    if (!url) return '';
    if (url.indexOf('res.cloudinary.com') > -1 && url.indexOf('/upload/') > -1) return url.replace('/upload/', '/upload/w_' + w + ',q_auto,f_auto/');
    if (url.indexOf('images.unsplash.com') > -1) return url + '?w=' + w + '&q=80&auto=format&fit=crop';
    return url;
  }
  function srcset(url) { return [500, 900, 1400, 2000].map(function (w) { return sized(url, w) + ' ' + w + 'w'; }).join(', '); }
  var MM = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + '.' + MM[d.getMonth()] + '.' + d.getFullYear();
  }
  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  /* ── chuẩn hoá: nhận cả shape của content/guide.json lẫn guide.data.js ── */
  function normImage(v) {
    if (!v) return null;
    if (typeof v === 'string') return { url: v, alt: '' };
    return { mediaId: v.mediaId || null, url: v.url || '', alt: v.alt || v.altText || '' };
  }
  function normArticle(a, authors) {
    var author = a.author;
    if (!author && a.authorId) {
      for (var i = 0; i < authors.length; i++) if (authors[i].id === a.authorId) author = authors[i];
    }
    return {
      id: a.id, title: a.title || '', slug: a.slug || slugify(a.title),
      excerpt: a.excerpt || '', content: a.content || [],
      featuredImage: normImage(a.featuredImage),
      galleryImages: (a.galleryImages || []).map(normImage),
      category: a.category || '', tags: a.tags || [],
      author: author || { name: 'NOW Studio', role: 'NOW Studio' },
      authorId: a.authorId || (author && author.id) || null,
      publishedAt: a.publishedAt || '', updatedAt: a.updatedAt || a.publishedAt || '',
      createdAt: a.createdAt || a.publishedAt || '',
      readingTime: a.readingTime || null,
      status: a.status || 'draft', featured: !!a.featured, sortOrder: a.sortOrder || 0,
      seoTitle: a.seoTitle || '', seoDescription: a.seoDescription || '',
      seoImage: normImage(a.seoImage), canonicalUrl: a.canonicalUrl || '', noIndex: !!a.noIndex,
      ogTitle: a.ogTitle || '', ogDescription: a.ogDescription || '', ogImage: normImage(a.ogImage),
      relatedArticles: a.relatedArticles || []
    };
  }
  function normalize(raw) {
    var authors = raw.authors || [];
    return {
      site: raw.site || {},
      authors: authors,
      categories: (raw.categories || []).slice(),
      tags: raw.tags || [],
      media: raw.media || [],
      redirects: raw.redirects || [],
      articles: (raw.articles || []).map(function (a) { return normArticle(a, authors); })
    };
  }

  /* ── API đọc ── */
  function isLive(a) {
    if (a.status === 'published') return true;
    /* scheduled: tự lên sóng khi tới giờ — không cần cron cho site tĩnh */
    if (a.status === 'scheduled' && a.publishedAt) return new Date(a.publishedAt).getTime() <= Date.now();
    return false;
  }
  function byDateDesc(a, b) { return new Date(b.publishedAt) - new Date(a.publishedAt); }

  function getArticles(o) {
    o = o || {};
    var list = D.articles.filter(function (a) { return o.includeHidden ? true : isLive(a); });
    if (o.category && o.category !== 'all') list = list.filter(function (a) { return a.category === o.category; });
    if (o.tag) list = list.filter(function (a) { return (a.tags || []).indexOf(o.tag) > -1; });
    if (o.search) {
      var q = o.search.toLowerCase();
      list = list.filter(function (a) {
        return (a.title + ' ' + a.excerpt + ' ' + (a.tags || []).join(' ')).toLowerCase().indexOf(q) > -1;
      });
    }
    list = list.sort(byDateDesc);
    if (o.exclude) list = list.filter(function (a) { return a.id !== o.exclude; });
    if (o.offset) list = list.slice(o.offset);
    if (o.limit) list = list.slice(0, o.limit);
    return list;
  }
  function getArticleBySlug(slug) {
    for (var i = 0; i < D.articles.length; i++) if (D.articles[i].slug === slug) return D.articles[i];
    return null;
  }
  function getById(id) { for (var i = 0; i < D.articles.length; i++) if (D.articles[i].id === id) return D.articles[i]; return null; }
  function getFeatured(cat) {
    var list = getArticles({ category: cat });
    return list.filter(function (a) { return a.featured; })
      .sort(function (a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); })[0] || list[0] || null;
  }
  function getLatest(n, cat) { return getArticles({ category: cat, limit: n }); }
  function getRelated(a, n) {
    n = n || 3;
    var out = (a.relatedArticles || []).map(getById).filter(function (x) { return x && isLive(x); });
    var pool = getArticles({ exclude: a.id });
    pool.filter(function (x) { return x.category === a.category; }).forEach(function (x) { if (out.length < n && out.indexOf(x) < 0) out.push(x); });
    pool.forEach(function (x) { if (out.length < n && out.indexOf(x) < 0) out.push(x); });
    return out.slice(0, n);
  }
  function getCategories(withCounts) {
    var cats = D.categories.filter(function (c) { return c.status !== 'archived'; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    if (!withCounts) return cats;
    var counts = { all: getArticles({}).length };
    getArticles({}).forEach(function (a) { counts[a.category] = (counts[a.category] || 0) + 1; });
    return cats.map(function (c) { var x = Object.assign({}, c); x.count = counts[c.slug] || 0; return x; });
  }
  function catOf(slug) {
    for (var i = 0; i < D.categories.length; i++) if (D.categories[i].slug === slug) return D.categories[i];
    return { name: slug, slug: slug };
  }
  function urlOf(a) { return (window.GUIDE_BASE || '') + 'article.html?slug=' + encodeURIComponent(a.slug); }

  /* ── COMPONENTS ── */
  function Media(image, opts) {
    opts = opts || {};
    var url = image && image.url ? image.url : '';
    return '<div class="gd-media" data-slot="' + esc(opts.slot || 'Image slot') + '">' +
      '<img loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async"' + (opts.eager ? ' fetchpriority="high"' : '') +
      ' src="' + esc(sized(url, opts.base || 1000)) + '" srcset="' + esc(srcset(url)) +
      '" sizes="' + esc(opts.sizes || '33vw') + '" alt="' + esc(image && image.alt) + '"></div>';
  }
  function ArticleMeta(a, withAuthor) {
    var bits = [fmtDate(a.publishedAt)];
    if (a.readingTime) bits.push(a.readingTime + ' phút đọc');
    if (withAuthor && a.author) bits.push(a.author.name);
    return '<div class="gd-meta">' + bits.filter(Boolean).map(function (b, i) {
      return (i ? '<span class="dot"></span>' : '') + '<span>' + esc(b) + '</span>';
    }).join('') + '</div>';
  }
  var ARROW = '<svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden="true"><path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function ArticleCard(a, opts) {
    opts = opts || {};
    var c = catOf(a.category);
    return '<a class="gd-card" href="' + urlOf(a) + '" data-cat="' + esc(a.category) + '">' +
      Media(a.featuredImage, { slot: c.name + ' — ' + a.title, sizes: opts.sizes || '(max-width:768px) 100vw, (max-width:1024px) 46vw, 380px', base: 900 }) +
      '<span class="gd-eyebrow">' + esc(c.name) + '</span><h4>' + esc(a.title) + '</h4>' +
      '<p>' + esc(a.excerpt) + '</p>' + ArticleMeta(a) + '</a>';
  }
  function FeaturedArticle(a) {
    var c = catOf(a.category);
    return '<a href="' + urlOf(a) + '">' +
      Media(a.featuredImage, { slot: 'Featured — ' + a.title, sizes: '(max-width:1024px) 100vw, 660px', base: 1400, eager: true }) +
      '<div><span class="gd-eyebrow">' + esc(c.name) + '</span><h2>' + esc(a.title) + '</h2>' +
      '<p>' + esc(a.excerpt) + '</p>' + ArticleMeta(a, true) +
      '<span class="gd-link">Đọc bài ' + ARROW + '</span></div></a>';
  }
  function FeatureBreak(a) {
    var c = catOf(a.category);
    return '<a href="' + urlOf(a) + '">' +
      Media(a.featuredImage, { slot: c.name + ' — ' + a.title, sizes: '(max-width:1024px) 100vw, 620px', base: 1400 }) +
      '<div class="txt"><span class="gd-eyebrow">' + esc(c.name) + '</span><h3>' + esc(a.title) + '</h3>' +
      '<p>' + esc(a.excerpt) + '</p>' + ArticleMeta(a) +
      '<span class="gd-link">Đọc bài ' + ARROW + '</span></div></a>';
  }
  function ArticleGrid(list, opts) {
    if (!list.length) return '<p class="gd-empty">Chưa có bài nào trong mục này.</p>';
    return list.map(function (a) { return ArticleCard(a, opts); }).join('');
  }
  function CategoryNavigation(cats, activeSlug) {
    return cats.map(function (c) {
      return '<button type="button" class="gd-cat' + (c.slug === activeSlug ? ' on' : '') +
        '" data-slug="' + esc(c.slug) + '" aria-pressed="' + (c.slug === activeSlug) + '">' +
        esc(c.name) + (c.count ? '<span class="n">' + c.count + '</span>' : '') + '</button>';
    }).join('');
  }
  function ArticleContent(blocks) {
    return (blocks || []).map(function (b) {
      switch (b.type) {
        case 'h2': return '<h2>' + esc(b.text) + '</h2>';
        case 'h3': return '<h3>' + esc(b.text) + '</h3>';
        case 'p': return '<p>' + b.text + '</p>';
        case 'ul': return '<ul>' + b.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
        case 'ol': return '<ol>' + b.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ol>';
        case 'divider': return '<div class="gd-rule" style="margin:44px 0"></div>';
        case 'note': return '<blockquote class="ar-note"><p>' + esc(b.text) + '</p>' + (b.cite ? '<span>' + esc(b.cite) + '</span>' : '') + '</blockquote>';
        case 'figure':
          return '<figure class="ar-figure' + (b.duo ? ' duo' : '') + '"><div class="inner">' +
            (b.images || []).map(function (im) { return Media(normImage(im), { slot: 'Article image', sizes: b.duo ? '(max-width:768px) 100vw, 512px' : '(max-width:1024px) 100vw, 1040px', base: 1400 }); }).join('') +
            '</div>' + (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
        case 'takeaway':
          return '<div class="ar-takeaway"><div class="gd-kicker">' + esc(b.title || 'Tóm lại') + '</div><ul>' +
            b.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
        default: return '';
      }
    }).join('');
  }

  function guardImages(root) {
    (root || document).querySelectorAll('.gd-media img').forEach(function (img) {
      var mark = function () { var m = img.closest('.gd-media'); if (m) m.classList.add('is-missing'); };
      if (img.complete && img.naturalWidth === 0) mark();
      img.addEventListener('error', mark);
    });
  }
  function revealAll(root) {
    var els = (root || document).querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  var G = {
    esc: esc, rich: rich, fmtDate: fmtDate, slugify: slugify, sized: sized, urlOf: urlOf, catOf: catOf,
    getArticles: getArticles, getArticleBySlug: getArticleBySlug, getById: getById,
    getFeatured: getFeatured, getLatest: getLatest, getRelated: getRelated,
    getCategories: getCategories, getTags: function () { return D.tags; },
    isLive: isLive, normalize: normalize,
    Media: Media, ArticleMeta: ArticleMeta, ArticleCard: ArticleCard, FeaturedArticle: FeaturedArticle,
    FeatureBreak: FeatureBreak, ArticleGrid: ArticleGrid, CategoryNavigation: CategoryNavigation,
    ArticleContent: ArticleContent, guardImages: guardImages, reveal: revealAll, ARROW: ARROW,
    ready: function (cb) { if (loaded) cb(G); else queue.push(cb); },
    /* tương thích ngược với code cũ */
    published: function () { return getArticles({}); },
    bySlug: getArticleBySlug, byId: getById
  };
  Object.defineProperty(G, 'data', { get: function () { return D; } });
  window.Guide = G;

  function apply(raw) {
    D = normalize(raw);
    G.site = D.site;
    loaded = true;
    queue.splice(0).forEach(function (cb) { cb(G); });
  }

  function boot() {
    if (PREVIEW) {
      try {
        var draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
        if (draft && draft.articles) { apply(draft); return; }
      } catch (e) { /* nháp hỏng → đọc file thật */ }
    }
    fetch(CONTENT, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { apply(j || window.GUIDE_DATA || {}); })
      .catch(function () { apply(window.GUIDE_DATA || {}); });   // file:// hoặc mất mạng
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* trang quản lý gửi nháp → vẽ lại ngay */
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'nowcms:draft' || e.data.section !== 'guide') return;
    D = normalize(e.data.data);
    G.site = D.site;
    if (typeof window.guideRender === 'function') window.guideRender(G);
  });
})();
