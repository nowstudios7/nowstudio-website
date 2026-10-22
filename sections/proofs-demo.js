/* DỮ LIỆU MẪU — chỉ dùng trong file kiểm tra “Feedback ảnh - Xem trước.html” (gửi vào trang chủ ?cms=preview) (dọc / ngang / ảnh dài).
   Ảnh vẽ tạm bằng canvas, có nhãn "DỮ LIỆU MẪU". KHÔNG dùng làm feedback thật. */
window.NOWPROOFS_DEMO = function () {
  var specs = [
    [1170, 2532, 'messenger', 'after-delivery'], [1600, 900, 'facebook', 'wedding-day'], [1170, 4600, 'zalo', 'after-delivery'],
    [1080, 1350, 'messenger', 'after-shoot'], [1170, 2200, 'zalo', 'album'], [1200, 1500, 'facebook', 'after-shoot'],
    [1170, 3400, 'messenger', 'wedding-day'], [1440, 1000, 'zalo', 'album'], [1170, 2532, 'facebook', 'after-delivery'],
    [1170, 1900, 'messenger', 'after-shoot'], [1170, 5200, 'zalo', 'wedding-day'], [1350, 1080, 'facebook', 'album'],
    [1170, 2700, 'messenger', 'after-delivery'], [1170, 1700, 'zalo', 'after-shoot'], [1500, 1100, 'facebook', 'wedding-day']
  ];
  function draw(w, h, src, n) {
    var s = 0.4, c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
    var x = c.getContext('2d'), W = c.width, H = c.height;
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#f3f1ee'; x.fillRect(0, 0, W, 44);
    x.fillStyle = '#b4552f'; x.font = '600 13px sans-serif'; x.fillText('DỮ LIỆU MẪU #' + n + ' · ' + src.toUpperCase(), 14, 27);
    var me = src === 'zalo' ? '#d6e6ff' : src === 'facebook' ? '#eceff3' : '#e7d9c2', y = 64, seed = n * 97;
    function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    while (y < H - 30) {
      var right = r() > 0.55, bw = W * (0.35 + r() * 0.42), bh = 22 + Math.floor(r() * 4) * 16;
      x.fillStyle = right ? me : '#efefef';
      var bx = right ? W - bw - 14 : 14;
      x.beginPath(); if (x.roundRect) x.roundRect(bx, y, bw, bh, 12); else x.rect(bx, y, bw, bh); x.fill();
      x.fillStyle = 'rgba(0,0,0,.18)';
      for (var l = 0; l < (bh - 10) / 16; l++) x.fillRect(bx + 12, y + 11 + l * 16, (bw - 24) * (l === Math.floor((bh - 10) / 16) - 1 ? 0.6 : 1), 6);
      y += bh + 10 + r() * 14;
    }
    return c.toDataURL('image/jpeg', 0.82);
  }
  return specs.map(function (p, i) {
    return { _id: 'demo-' + (i + 1), _demo: true, src: draw(p[0], p[1], p[2], i + 1), w: p[0], h: p[1], source: p[2], category: p[3], status: 'published', consent: true, title: 'Mẫu ' + (i + 1) };
  });
};
