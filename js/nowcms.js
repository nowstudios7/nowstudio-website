/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — CMS core (runtime loader + render engine)

   Nguyên tắc:
   · HTML tĩnh trong trang là BẢN DỰ PHÒNG. Loader chỉ ghi đè nếu
     có dữ liệu. Mất JS → website vẫn hiển thị bình thường.
   · Loader không biết gì về Hero. Nó chỉ đọc khai báo trong
     js/nowcms.schema.js rồi điền dữ liệu vào các ổ cắm data-cms.
     → Thêm section mới KHÔNG cần sửa file này.
   · Nguồn dữ liệu nằm sau một lớp adapter (json | sanity).
     Đổi CMS = đổi một dòng trong schema, không đụng website.

   Thứ tự ưu tiên dữ liệu:
     1. Bản nháp trong localStorage — CHỈ khi URL có ?cms=preview
     2. Nguồn thật theo adapter (file JSON, hoặc Sanity ở Bước 2)
   ───────────────────────────────────────────────────────────── */
(function () {
  var SCHEMA = window.NOWCMS_SCHEMA || { sections: {}, source: 'json' };
  var PREVIEW = /[?&]cms=preview/.test(location.search);

  /* ── helpers ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function rich(s) { // *chữ* → in nghiêng gold · xuống dòng → <br>
    return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  }
  function get(obj, path) {
    return String(path).split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  }

  /* ── kiểu ảnh: luôn là ĐỐI TƯỢNG, không phải một dòng link ──
     { _id, url, alt, focus, width, height, srcset } */
  function normalizeImage(v) {
    if (typeof v === 'string') v = { url: v };
    v = v || {};
    return {
      _id: v._id || uid('img'),
      url: v.url || v.image || v.src || '',
      alt: v.alt || '',
      focus: v.focus || 'center 26%',
      width: v.width || null,
      height: v.height || null,
      srcset: v.srcset || null
    };
  }
  function imgAttrs(im) {
    var a = 'src="' + esc(im.url) + '" alt="' + esc(im.alt) + '"';
    if (im.srcset) a += ' srcset="' + esc([].concat(im.srcset).join(', ')) + '"';
    if (im.width && im.height) a += ' width="' + im.width + '" height="' + im.height + '"';
    if (im.focus) a += ' style="object-position:' + esc(im.focus) + '"';
    return a;
  }

  /* ── vỏ chuẩn cho MỌI section (nhận cả dữ liệu cũ dạng phẳng) ── */
  function normalizeDoc(name, raw) {
    if (!raw) return null;
    var doc = raw[name] && !raw.fields ? raw[name] : raw;      // {hero:{…}} (v1) hoặc {…}
    if (doc[name] && doc[name].fields) doc = doc[name];         // {hero:{fields:{…}}}
    var fields = doc.fields || doc;
    var def = SCHEMA.sections[name] || {};
    var out = {
      _type: doc._type || def.sanityType || ('section.' + name),
      _id: doc._id || name,
      _rev: doc._rev || null,
      status: doc.status || 'published',
      updatedAt: doc.updatedAt || null,
      fields: fields
    };
    // chuẩn hoá danh sách: ảnh thành đối tượng, mọi item có _id
    (def.fields || []).forEach(function (f) {
      var v = get(fields, f.key);
      if (f.type === 'imageList' && Array.isArray(v)) {
        setDeep(fields, f.key, v.map(normalizeImage));
      } else if (f.type === 'statList' && Array.isArray(v)) {
        setDeep(fields, f.key, v.map(function (s) {
          return { _id: s._id || uid('stat'), value: s.value || '', label: s.label || '' };
        }));
      }
    });
    return out;
  }
  function setDeep(obj, path, val) {
    var ks = String(path).split('.'), last = ks.pop();
    var t = ks.reduce(function (o, k) { return (o[k] = o[k] || {}); }, obj);
    t[last] = val;
  }

  /* ── các kiểu field: thêm kiểu mới ở đây, dùng lại cho mọi section ── */
  var TYPES = {
    text: function (el, v) { el.innerHTML = rich(v); },
    lines: function (el, v) { el.innerHTML = rich([].concat(v || []).join('\n')); },
    paragraphs: function (el, v) {
      el.innerHTML = [].concat(v || []).filter(function (p) { return String(p).trim(); })
        .map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('');
    },
    link: function (el, v) {
      if (!v) return;
      if (v.label != null) {
        var svg = el.querySelector('svg');
        el.textContent = v.label;
        if (svg) el.appendChild(svg);
      }
      if (v.href) el.setAttribute('href', v.href);
    },
    imageList: function (el, v, f) {
      var list = [].concat(v || []).map(normalizeImage).filter(function (i) { return i.url; });
      if (!list.length) return;
      el.innerHTML =
        list.map(function (im, i) {
          return '<div class="slide' + (i === 0 ? ' active' : '') + '"><img ' + imgAttrs(im) + '></div>';
        }).join('') +
        '<div class="slider-dots">' + list.map(function (im, i) {
          return '<span class="sdot' + (i === 0 ? ' active' : '') + '" onclick="goSlide(' + i + ')" aria-label="Ảnh ' + (i + 1) + '"></span>';
        }).join('') + '</div>';
      if (f && f.onRender && typeof window[f.onRender] === 'function') window[f.onRender]();
    },
    statList: function (el, v, f) {
      var list = [].concat(v || []).filter(function (s) { return s && (s.value || s.label); });
      if (!list.length) return;
      var keep = f && f.keepChild ? el.querySelector(f.keepChild) : null;
      el.innerHTML = list.map(function (s) {
        return '<div class="stat-item"><span class="stat-num">' + esc(s.value) +
               '</span><span class="stat-label">' + esc(s.label) + '</span></div>';
      }).join('');
      if (keep) el.appendChild(keep);
    }
  };

  /* ── render một section từ khai báo ── */
  function renderSection(name, doc, root) {
    var def = SCHEMA.sections[name];
    if (!def || !doc) return;
    root = root || document;
    (def.fields || []).forEach(function (f) {
      var el = root.querySelector('[data-cms="' + f.target + '"]');
      if (!el) return;
      var v = get(doc.fields || doc, f.key);
      if (v === undefined || v === null) return;
      var fn = TYPES[f.type];
      if (fn) fn(el, v, f);
    });
    root.querySelectorAll && root.querySelectorAll('[data-cms-section="' + name + '"]').forEach(function (n) {
      n.setAttribute('data-cms-rev', doc._rev || '');
    });
  }

  /* ── adapter nguồn dữ liệu ── */
  var SOURCES = {
    json: {
      label: 'File JSON trong website',
      read: function (name, def) {
        return fetch((window.NOWCMS_BASE || '') + def.source, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });   // file:// hoặc chưa có file → giữ HTML tĩnh
      },
      // Bước 1: "xuất bản" = tải file về để bạn đưa lên hosting.
      // Bước 2: adapter sanity bên dưới thay chỗ này bằng 1 lần bấm.
      publish: function (name, doc) {
        var out = {};
        out._type = doc._type; out._id = doc._id;
        out._rev = new Date().toISOString();
        out.status = 'published';
        out.updatedAt = out._rev;
        out.fields = doc.fields;
        return Promise.resolve({ mode: 'download', filename: name + '.json', json: JSON.stringify(out, null, 2) });
      }
    },

    /* Bước 2 — CMS online. Chỉ cần điền projectId trong schema.
       Không cần sửa gì trong website: cùng vỏ dữ liệu, cùng ổ cắm. */
    sanity: {
      label: 'Sanity (CMS online)',
      read: function (name, def) {
        var c = SCHEMA.sanity || {};
        if (!c.projectId) return Promise.resolve(null);
        var host = c.projectId + (c.useCdn ? '.apicdn' : '.api') + '.sanity.io';
        var groq = encodeURIComponent('*[_type=="' + (def.sanityType || 'section.' + name) + '"][0]');
        return fetch('https://' + host + '/v' + c.apiVersion + '/data/query/' + c.dataset + '?query=' + groq)
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { return j && j.result ? j.result : null; })
          .catch(function () { return null; });
      },
      publish: function () {
        return Promise.reject(new Error('Sanity publish diễn ra trong Studio, không qua website.'));
      }
    }
  };

  function draftKey(name) { return 'nowcms.' + name + '.draft'; }
  function readDraft(name) {
    try { return JSON.parse(localStorage.getItem(draftKey(name))); } catch (e) { return null; }
  }

  function mount(name, root) {
    var def = SCHEMA.sections[name];
    if (!def) return Promise.resolve(null);
    if (PREVIEW) {
      var d = readDraft(name);
      if (d) { var nd = normalizeDoc(name, d); renderSection(name, nd, root); return Promise.resolve(nd); }
    }
    var src = SOURCES[SCHEMA.source] || SOURCES.json;
    return src.read(name, def).then(function (raw) {
      var doc = normalizeDoc(name, raw);
      if (doc) renderSection(name, doc, root);
      return doc;
    });
  }

  window.NOWCMS = {
    schema: SCHEMA,
    sources: SOURCES,
    types: TYPES,
    preview: PREVIEW,
    draftKey: draftKey,
    normalizeDoc: normalizeDoc,
    normalizeImage: normalizeImage,
    uid: uid,
    rich: rich,
    render: renderSection,
    mount: mount,
    load: function (name) {                       // đọc dữ liệu thật, không render (dùng cho admin)
      var def = SCHEMA.sections[name]; if (!def) return Promise.resolve(null);
      return (SOURCES[SCHEMA.source] || SOURCES.json).read(name, def)
        .then(function (raw) { return normalizeDoc(name, raw); });
    },
    publish: function (name, doc) {
      var src = SOURCES[SCHEMA.source] || SOURCES.json;
      return src.publish(name, doc);
    },
    refresh: function (name) { return mount(name, document); }
  };

  var run = function () { Object.keys(SCHEMA.sections).forEach(function (s) { mount(s, document); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  // Trang quản lý gửi bản nháp qua postMessage → cập nhật ngay, không reload
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'nowcms:draft') return;
    renderSection(e.data.section, normalizeDoc(e.data.section, e.data.data), document);
  });
})();
