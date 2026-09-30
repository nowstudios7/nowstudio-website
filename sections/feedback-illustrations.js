/* NOW·STUDIO — Bộ Couple Illustration (fine-line, một phong cách)
   Dùng chung cho website (sections/feedback.js) và CMS (admin/feedback.html).
   Nét = currentColor; phần che khuất tô bằng --illus-bg (màu nền nơi đặt hình).
   Không có nét mặt — chỉ dáng người, để không mô phỏng khách thật. */
(function () {
  var BG = 'var(--illus-bg,#1a1714)';

  function groom(back) {
    var head = back
      ? '<path d="M-15 40C-15 26-6 20 1 20C9 20 16 27 15 40C15 50 11 57 1 58C-9 57-15 50-15 40Z"/><path d="M-13 50C-6 55 7 55 13 50"/><path d="M-9 25C-3 22 5 22 10 26"/><path d="M-15 41C-18 41-18 47-14 48M15 41C18 41 18 47 14 48"/>'
      : '<path d="M-15 40C-15 26-6 20 3 21C12 22 16 30 15 40C15 50 11 58 3 60C-5 60-13 54-15 40Z"/><path d="M-15 37C-15 24-3 16 7 19C13 21 16 27 15 34C10 29 1 27-7 31"/><path d="M-14 42C-17 42-17 48-13 49"/>';
    var body = back
      ? '<path d="M-7 64C-2 68 4 68 9 64"/><path d="M-7 59L-7 66M9 58L9 65"/><path d="M-7 66C-23 71-37 78-43 92L-49 150M9 65C21 69 31 76 37 88L43 150"/><path d="M1 70L1 150"/><path d="M-37 106L-39 150M31 104L33 150"/>'
      : '<path d="M-6 59L-7 68M8 58L9 67"/><path d="M-7 68L1 80L9 67"/><path d="M-3 73L1 76L5 73L5 79L1 76L-3 79Z"/><path d="M-7 68C-23 72-37 78-43 92L-49 150M9 67C21 70 31 76 37 88L43 150"/><path d="M-7 68L-11 86L1 100L-1 150M9 67L13 84L1 100"/><path d="M-34 112L-22 110"/><path d="M-37 106L-39 150M31 104L33 150"/>';
    return '<path d="M-15 40C-15 26-6 20 3 21C12 22 16 30 15 40C15 50 11 58 3 60L9 67C21 70 31 76 37 88L43 150L-49 150L-43 92C-37 78-23 72-7 68L-6 59C-12 55-15 48-15 40Z" fill="' + BG + '" stroke="none"/>' + head + body;
  }

  function bride(back, veil) {
    var sil = '<path d="M-13 55C-13 44-6 38 1 38C9 38 14 45 14 54C14 62 11 67 7 70L9 80C21 84 29 92 32 104L35 150L-31 150L-28 102C-24 90-16 84-6 80L-4 70C-10 66-13 61-13 55Z" fill="' + BG + '" stroke="none"/>';
    var flower = function (x, y) {
      var p = '';
      for (var i = 0; i < 5; i++) p += '<ellipse cx="' + x + '" cy="' + (y - 2.4) + '" rx="1.3" ry="2.2" transform="rotate(' + (i * 72) + ' ' + x + ' ' + y + ')"/>';
      return p;
    };
    if (back) {
      return sil +
        '<path d="M-13 55C-13 44-6 38 1 38C9 38 14 45 14 54C14 62 9 70 1 70C-7 70-13 64-13 55Z"/>' +
        '<path d="M-7 42C-7 34 8 34 8 42C8 47-7 47-7 42Z"/><path d="M-4 41C-1 39 3 39 5 41"/>' + flower(10, 45) +
        '<path d="M-10 62C-4 66 6 66 11 62"/><path d="M-4 70L-6 80M6 70L9 80"/>' +
        '<path d="M-6 80C-16 84-24 90-28 102L-31 150M9 80C21 84 29 92 32 104L35 150"/>' +
        '<path d="M-12 104L1 124L14 104"/>' +
        (veil ? '<path d="M-6 44C-24 70-38 110-42 150M8 44C26 70 40 110 44 150"/><path d="M-2 46C-12 80-16 118-18 150"/>' : '');
    }
    return sil +
      '<path d="M-13 55C-13 44-6 38 1 38C9 38 14 45 14 54C14 64 8 71 0 71C-8 71-13 64-13 55Z"/>' +
      '<path d="M-13 52C-11 42-3 37 5 38C11 39 15 44 15 50"/><path d="M-12 56C-8 50-2 46 6 44"/>' +
      '<path d="M9 41C11 34 21 35 21 42C21 48 15 50 13 47"/>' + flower(18, 51) +
      '<path d="M-4 70L-6 80M6 70L9 80"/>' +
      '<path d="M-6 80C-16 84-24 90-28 102L-31 150M9 80C21 84 29 92 32 104L35 150"/>' +
      '<path d="M-26 108C-12 113 6 113 30 106"/>' +
      (veil ? '<path d="M16 46C30 66 42 100 48 150"/><path d="M18 58C28 80 34 110 36 150"/>' : '');
  }

  function bouquet(x, y) {
    var out = '<path d="M' + (x - 2) + ' ' + (y + 6) + 'L' + (x - 8) + ' ' + (y + 24) + 'M' + x + ' ' + (y + 6) + 'L' + (x - 3) + ' ' + (y + 24) + 'M' + (x + 3) + ' ' + (y + 6) + 'L' + (x + 2) + ' ' + (y + 24) + '"/>';
    out += '<path d="M' + (x - 14) + ' ' + (y + 4) + 'C' + (x - 22) + ' ' + y + ' ' + (x - 26) + ' ' + (y - 6) + ' ' + (x - 28) + ' ' + (y - 10) + 'C' + (x - 20) + ' ' + (y - 8) + ' ' + (x - 15) + ' ' + (y - 3) + ' ' + (x - 14) + ' ' + (y + 4) + 'Z"/>';
    out += '<path d="M' + (x + 14) + ' ' + (y + 3) + 'C' + (x + 22) + ' ' + y + ' ' + (x + 27) + ' ' + (y - 5) + ' ' + (x + 30) + ' ' + (y - 9) + 'C' + (x + 21) + ' ' + (y - 8) + ' ' + (x + 16) + ' ' + (y - 3) + ' ' + (x + 14) + ' ' + (y + 3) + 'Z"/>';
    [[x - 8, y - 2, 5.5], [x + 6, y - 4, 6], [x - 1, y + 4, 5], [x + 13, y + 4, 4]].forEach(function (f) {
      var cx = f[0], cy = f[1], r = f[2];
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + BG + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.42).toFixed(1) + '"/>';
      out += '<path d="M' + (cx - r * 0.6) + ' ' + (cy - r * 0.6) + 'L' + (cx - r * 0.3) + ' ' + (cy - r * 0.3) + 'M' + (cx + r * 0.6) + ' ' + (cy - r * 0.6) + 'L' + (cx + r * 0.3) + ' ' + (cy - r * 0.3) + 'M' + cx + ' ' + (cy + r * 0.8) + 'L' + cx + ' ' + (cy + r * 0.42) + '"/>';
    });
    return out;
  }

  function g(tx, ty, inner, opt) {
    opt = opt || {};
    var t = 'translate(' + tx + ' ' + ty + ')' + (opt.rot ? ' rotate(' + opt.rot + ' 0 70)' : '') + (opt.flip ? ' scale(-1 1)' : '');
    return '<g transform="' + t + '">' + inner + '</g>';
  }

  var SCENES = {
    together: { label: 'Bên nhau', draw: function () { return g(100, 0, groom()) + g(150, 4, bride(false, true)) + bouquet(168, 124); } },
    facing:   { label: 'Nhìn nhau', draw: function () { return g(104, 0, groom()) + g(146, 3, bride(false, true), { rot: -8 }); } },
    lean:     { label: 'Tựa vai', draw: function () { return g(98, 0, groom()) + g(138, 10, bride(false, false), { rot: -16 }) + bouquet(160, 126); } },
    mirror:   { label: 'Cài hoa', draw: function () { return g(142, 0, groom(), { flip: true }) + g(92, 4, bride(false, true), { flip: true }) + bouquet(74, 124); } },
    backs:    { label: 'Sau lưng', draw: function () { return g(98, 0, groom(true)) + g(146, 4, bride(true, true)); } }
  };

  function svg(id, cls) {
    var s = SCENES[id];
    if (!s) return '';
    return '<svg class="nfi' + (cls ? ' ' + cls : '') + '" viewBox="0 0 240 150" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + s.draw() + '</svg>';
  }

  window.NOW_ILLUS = {
    ids: Object.keys(SCENES),
    label: function (id) { return SCENES[id] ? SCENES[id].label : 'Không dùng'; },
    svg: svg
  };

  window.NOW_SERVICE_TYPES = [
    { value: 'wedding', label: 'Wedding Day' },
    { value: 'prewedding', label: 'Pre-Wedding' },
    { value: 'studio', label: 'Ảnh cưới Studio' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'film', label: 'Quay phim' },
    { value: 'other', label: 'Khác' }
  ];
})();
