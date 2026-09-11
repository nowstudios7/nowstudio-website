/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — WEDDING GUIDE · components

   Mọi component nhận DỮ LIỆU, không biết bài cụ thể nào:
     ArticleCard(article, opts) · FeaturedArticle(article)
     ArticleGrid(articles, opts) · CategoryNavigation(cats, active)
     ArticleHero(article) · ArticleContent(blocks)
     RelatedArticles(article) · ArticleMeta(article) · LoadMore
   CMS trả về bao nhiêu bài cũng render được.
   ───────────────────────────────────────────────────────────── */
(function () {
  var G = window.GUIDE;
  if (!G) return;

  /* ── helpers ── */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function sized(url, w) {
    if (!url) return '';
    if (url.indexOf('res.cloudinary.com') > -1 && url.indexOf('/upload/') > -1) return url.replace('/upload/', '/upload/w_' + w + ',q_auto,f_auto/');
    if (url.indexOf('images.unsplash.com') > -1) return url + '?w=' + w + '&q=80&auto=format&fit=crop';
    return url;
  }
  function srcset(url) { return [500, 900, 1400, 2000].map(function (w) { return sized(url, w) + ' ' + w + 'w'; }).join(', '); }
  function Image(img, opts) {
    opts = opts || {};
    if (!img || !img.url) return '<div class="shot" aria-hidden="true"></div>';
    return '<div class="shot">' +
      '<img src="' + esc(sized(img.url, 1200)) + '" srcset="' + esc(srcset(img.url)) +
      '" sizes="' + esc(opts.sizes || '(max-width:768px) 100vw, 33vw') +
      '" alt="' + esc(img.alt) + '" loading="' + (opts.eager ? 'eager' : 'lazy') +
      '" fetchpriority="' + (opts.eager ? 'high' : 'auto') + '" decoding="async"></div>';
  }
  function catName(slug) { var c = G.category(slug); return c ? c.name : slug; }
  function dateVN(s) {
    var d = new Date(s + 'T00:00:00');
    if (isNaN(d)) return s;
    return d.getDate() + ' tháng ' + (d.getMonth() + 1) + ', ' + d.getFullYear();
  }
  /* URL sạch, sẵn cho routing thật: /guide/<category>/<slug> */
  function articleUrl(a) { return 'article.html?slug=' + encodeURIComponent(a.slug); }
  function categoryUrl(slug) { return slug === 'all' ? 'index.html' : 'index.html?c=' + encodeURIComponent(slug); }
  window.guideUrl = { article: articleUrl, category: categoryUrl };

  /* ── ArticleMeta ── */
  function ArticleMeta(a) {
    return '<div class="a-meta"><span><time datetime="' + esc(a.publishedAt) + '">' + esc(dateVN(a.publishedAt)) + '</time></span>' +
      (a.readingTime ? '<span>' + a.readingTime + ' phút đọc</span>' : '') + '</div>';
  }

  var ARROW = '<svg width="17" height="9" viewBox="0 0 18 10" fill="none" aria-hidden="true"><path d="M1 5h15M11 1l5 4-5 4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ── ArticleCard ── */
  function ArticleCard(a, opts) {
    opts = opts || {};
    return '<article class="rv"><a class="card" href="' + articleUrl(a) + '">' +
      Image(a.featuredImage, { sizes: opts.sizes || '(max-width:768px) 100vw, (max-width:1024px) 46vw, 380px' }) +
      '<div class="a-cat">' + esc(catName(a.category)) + '</div>' +
      '<h3>' + esc(a.title) + '</h3>' +
      '<p>' + esc(a.excerpt) + '</p>' +
      ArticleMeta(a) + '</a></article>';
  }

  /* ── FeaturedArticle ── */
  function FeaturedArticle(a) {
    if (!a) return '';
    return '<a class="feat" href="' + articleUrl(a) + '">' +
      Image(a.featuredImage, { sizes: '(max-width:1024px) 100vw, 640px', eager: true }) +
      '<div class="body"><div class="a-cat">' + esc(catName(a.category)) + '</div>' +
      '<h2>' + esc(a.title) + '</h2>' +
      '<p>' + esc(a.excerpt) + '</p>' + ArticleMeta(a) +
      '<span class="a-more">Đọc bài viết' + ARROW + '</span></div></a>';
  }

  /* ── Spread (large editorial feature, nền tối) ── */
  function Spread(a) {
    if (!a) return '';
    return '<section class="spread"><div class="in wrap">' +
      Image(a.featuredImage, { sizes: '(max-width:1024px) 100vw, 620px' }) +
      '<div><div class="a-cat">' + esc(catName(a.category)) + '</div>' +
      '<h2>' + esc(a.title) + '</h2><p>' + esc(a.excerpt) + '</p>' + ArticleMeta(a) +
      '<a class="a-more" href="' + articleUrl(a) + '">Đọc bài viết' + ARROW + '</a></div></div></section>';
  }

  /* ── ArticleGrid ── */
  function ArticleGrid(list, opts) {
    opts = opts || {};
    if (!list.length) return '<p class="empty">Chưa có bài viết trong mục này.</p>';
    return '<div class="' + (opts.duo ? 'duo' : 'grid') + '">' + list.map(function (a) { return ArticleCard(a, opts); }).join('') + '</div>';
  }

  /* ── CategoryNavigation ── */
  function CategoryNavigation(cats, active) {
    return '<nav class="cat-nav" aria-label="Chủ đề"><div class="wrap"><div class="cat-scroll">' +
      cats.filter(function (c) { return c.status === 'published'; })
        .sort(function (x, y) { return x.order - y.order; })
        .map(function (c) {
          var n = c.slug === 'all' ? G.published().length : G.list(c.slug).length;
          return '<a href="' + categoryUrl(c.slug) + '" class="' + (c.slug === active ? 'on' : '') + '"' +
            (c.slug === active ? ' aria-current="page"' : '') + '>' + esc(c.name) +
            '<span class="n">' + n + '</span></a>';
        }).join('') +
      '</div></div></nav>';
  }

  /* ── ArticleContent ── */
  function ArticleContent(blocks) {
    return (blocks || []).map(function (b, i) {
      if (b.type === 'h2') return '<h2>' + esc(b.text) + '</h2>';
      if (b.type === 'quote') return '<blockquote><p>' + esc(b.text) + '</p></blockquote>';
      if (b.type === 'list') return '<ul>' + b.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      if (b.type === 'image') return '<figure class="' + (i % 3 === 0 ? 'bleed' : '') + '">' +
        Image(b.image, { sizes: '(max-width:768px) 100vw, 900px' }) +
        (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
      return '<p>' + esc(b.text) + '</p>';
    }).join('');
  }

  /* ── RelatedArticles ── */
  function RelatedArticles(a) {
    var list = (a.relatedArticles || []).map(function (id) { return G.byId(id); }).filter(Boolean);
    if (list.length < 3) {
      G.list(a.category).forEach(function (x) { if (x.id !== a.id && list.indexOf(x) < 0 && list.length < 3) list.push(x); });
    }
    if (!list.length) return '';
    return '<section class="wrap related"><div class="sec-head"><h2>Bài viết liên quan</h2>' +
      '<a class="side" href="index.html">Xem tất cả</a></div>' + ArticleGrid(list.slice(0, 3)) + '</section>';
  }

  /* ── reveal khi scroll ── */
  function reveal(root) {
    var els = (root || document).querySelectorAll('.rv:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  window.GuideUI = {
    esc: esc, Image: Image, catName: catName, dateVN: dateVN,
    ArticleMeta: ArticleMeta, ArticleCard: ArticleCard, FeaturedArticle: FeaturedArticle,
    Spread: Spread, ArticleGrid: ArticleGrid, CategoryNavigation: CategoryNavigation,
    ArticleContent: ArticleContent, RelatedArticles: RelatedArticles, reveal: reveal,
    ARROW: ARROW, sized: sized
  };

  window.toggleMenu = function () { document.body.classList.toggle('nav-open'); };
})();
