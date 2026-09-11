/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — WEDDING GUIDE · dữ liệu (mock, CMS-ready)

   Cấu trúc này là hợp đồng giữa UI và CMS. Khi nối CMS thật
   (Sanity / gallery-style JSON), chỉ cần trả về đúng shape này —
   không component nào phải sửa.

   CATEGORY  { id, name, slug, description, image, order,
               seoTitle, seoDescription, status }
   ARTICLE   { id, title, slug, excerpt, content[], featuredImage,
               galleryImages[], category, tags[], author,
               publishedAt, updatedAt, readingTime, featured,
               status, seoTitle, seoDescription, seoImage,
               canonicalUrl, relatedArticles[] }

   status: 'published' | 'draft' | 'scheduled'
   Chỉ bài status='published' và publishedAt <= now mới hiển thị.
   ───────────────────────────────────────────────────────────── */
(function () {
  var IMG = 'https://images.unsplash.com/photo-';
  function img(id, alt) { return { url: IMG + id, alt: alt }; }

  var CATEGORIES = [
    { id: 'c0', name: 'Tất cả', slug: 'all', description: '', image: null, order: 0, status: 'published' },
    { id: 'c1', name: 'Pre-Wedding', slug: 'pre-wedding', order: 1, status: 'published',
      description: 'Chuẩn bị và chụp bộ ảnh trước ngày cưới.',
      seoTitle: 'Kinh nghiệm chụp ảnh Pre-Wedding', seoDescription: 'Hướng dẫn chuẩn bị buổi chụp pre-wedding từ NOW Studio.' },
    { id: 'c2', name: 'Ngày cưới', slug: 'wedding-day', order: 2, status: 'published',
      description: 'Timeline và những việc cần lo trong ngày chính.' },
    { id: 'c3', name: 'Nhiếp ảnh', slug: 'photography', order: 3, status: 'published',
      description: 'Phóng sự cưới, cách chọn ekip, cách đọc một bộ ảnh.' },
    { id: 'c4', name: 'Makeup', slug: 'makeup', order: 4, status: 'published',
      description: 'Trang điểm cô dâu, trial, giữ lớp nền cả ngày.' },
    { id: 'c5', name: 'Váy cưới', slug: 'dress', order: 5, status: 'published',
      description: 'Chọn váy, thuê hay may, thử váy thế nào cho đỡ mệt.' },
    { id: 'c6', name: 'Ngân sách', slug: 'budget', order: 6, status: 'published',
      description: 'Phân bổ chi phí và những khoản dễ phát sinh.' },
    { id: 'c7', name: 'Lên kế hoạch', slug: 'planning', order: 7, status: 'published',
      description: 'Checklist theo mốc thời gian trước ngày cưới.' }
  ];

  var AUTHORS = {
    tuan: { id: 'a1', name: 'Tuấn', role: 'Photographer · NOW Studio' },
    team: { id: 'a2', name: 'NOW Team', role: 'NOW Studio' }
  };

  var ARTICLES = [
    {
      id: 'p1', slug: '5-dieu-can-biet-truoc-khi-chup-pre-wedding',
      title: '5 điều nên biết trước buổi chụp Pre-Wedding',
      excerpt: 'Một vài thứ chuẩn bị trước có thể làm buổi chụp nhẹ đi rất nhiều — và ảnh cũng tự nhiên hơn hẳn.',
      category: 'pre-wedding', tags: ['pre-wedding', 'chuẩn bị', 'concept'],
      author: AUTHORS.tuan, publishedAt: '2026-08-18', updatedAt: '2026-08-20',
      readingTime: 7, featured: true, status: 'published',
      featuredImage: img('1519225421980-715cb0215aed', 'Cặp đôi trong buổi chụp pre-wedding ngoài trời'),
      galleryImages: [img('1583939003579-730e3918a45a', 'Cặp đôi đi trên đường quê'), img('1511285560929-80b456fea0bc', 'Cặp đôi giữa cánh đồng')],
      seoTitle: '5 điều nên biết trước khi chụp Pre-Wedding | NOW Studio',
      seoDescription: 'Kinh nghiệm thực tế từ NOW Studio: chuẩn bị gì, chụp mấy điểm, chọn concept thế nào để buổi pre-wedding nhẹ nhàng hơn.',
      seoImage: null, canonicalUrl: '/guide/pre-wedding/5-dieu-can-biet-truoc-khi-chup-pre-wedding',
      relatedArticles: ['p4', 'p7', 'p2'],
      content: [
        { type: 'p', text: 'Gần như cặp đôi nào cũng hỏi tụi mình một câu giống nhau trước buổi chụp: “Tụi em cần chuẩn bị gì?” Câu trả lời ngắn là: ít hơn bạn nghĩ. Nhưng có vài thứ nếu lo trước thì cả ngày hôm đó sẽ dễ thở hơn nhiều.' },
        { type: 'h2', text: '1 · Đặt lịch sớm hơn bạn tính' },
        { type: 'p', text: 'Khoảng <strong>2–3 tháng trước ngày cưới</strong> là vừa. Không phải vì ekip bận — mà vì bạn cần thời gian dự phòng cho thời tiết. Miền Tây mùa mưa có thể đổ nước liên tục ba ngày, và một buổi chụp bị dời không nên kéo theo cả lịch in album.' },
        { type: 'p', text: 'Nếu chụp ngoại cảnh xa, cộng thêm một tuần cho việc đi lại và nghỉ ngơi. Chụp mệt vào ngày hôm trước lễ ăn hỏi là lý do phổ biến nhất khiến ảnh trông đờ đẫn.' },
        { type: 'figure', images: [img('1583939003579-730e3918a45a', 'Cặp đôi đi bộ trên đường quê buổi sáng sớm')], caption: 'Ánh sáng sớm ở miền Tây — khoảng 6h30, trước khi nắng gắt.' },
        { type: 'h2', text: '2 · Hai địa điểm là đủ' },
        { type: 'p', text: 'Ai cũng muốn chụp nhiều nơi. Nhưng mỗi lần di chuyển là mất 45–60 phút cho việc đi, thay đồ, dặm lại makeup. Chụp bốn điểm trong một ngày nghĩa là bạn chỉ thật sự chụp khoảng 40 phút ở mỗi nơi — không đủ để thả lỏng.' },
        { type: 'ul', items: [
          'Một nơi rộng, thoáng — cho ảnh toàn cảnh và không khí.',
          'Một nơi gần, thân thuộc — nhà, quán quen, con đường hai bạn hay đi.',
          'Nếu còn sức, thêm một điểm vào cuối ngày lúc hoàng hôn.'
        ]},
        { type: 'note', text: 'Bộ ảnh mà cặp đôi thích nhất thường không phải ở nơi đẹp nhất, mà ở nơi họ thoải mái nhất.', cite: 'Tuấn — Photographer' },
        { type: 'h2', text: '3 · Concept nên đơn giản' },
        { type: 'p', text: 'Concept không phải là đạo cụ và bối cảnh. Concept là câu trả lời cho: “Nhìn bộ ảnh này, người ta thấy hai bạn là người thế nào?” Nếu hai bạn hay đùa nhau, đừng chọn concept nghiêm trang. Nếu hai bạn ít nói, đừng ép cười suốt buổi.' },
        { type: 'p', text: 'Tụi mình thường hỏi vài câu rất đời trước buổi chụp — hai bạn quen nhau ở đâu, cuối tuần hay làm gì. Câu trả lời quyết định địa điểm và cách chụp nhiều hơn bất kỳ moodboard nào.' },
        { type: 'figure', images: [img('1481253127861-534498168948', 'Khoảnh khắc riêng của cặp đôi'), img('1478146896981-b80fe463b330', 'Cặp đôi ngồi cạnh nhau')], caption: 'Hai khung hình cách nhau bốn phút — không có tấm nào được sắp đặt.', duo: true },
        { type: 'h2', text: '4 · Quần áo: ít màu, ít hoa văn' },
        { type: 'p', text: 'Tông trung tính hoặc màu đất lên ảnh dễ nhất và không bị lỗi mốt sau vài năm. Tránh áo có chữ, sọc nhỏ li ti hoặc màu quá chói — chúng kéo mắt người xem ra khỏi gương mặt bạn.' },
        { type: 'ul', items: [
          'Hai bộ là đủ cho một buổi chụp nửa ngày.',
          'Thử mặc trước ở nhà, ngồi xuống đứng lên vài lần — nếu vướng thì bỏ.',
          'Giày: mang thêm một đôi đi được xa.'
        ]},
        { type: 'h2', text: '5 · Ngủ đủ, ăn sáng' },
        { type: 'p', text: 'Nghe hiển nhiên nhưng đây là thứ ảnh hưởng đến ảnh nhiều nhất. Máy ảnh ghi lại mức năng lượng của bạn khá trung thực. Một cặp đôi ngủ đủ và ăn sáng tử tế sẽ cho ra bộ ảnh khác hẳn một cặp đôi thức tới 2 giờ sáng lo chuyện cỗ bàn.' },
        { type: 'takeaway', title: 'Tóm lại', items: [
          'Đặt lịch trước 2–3 tháng, chừa chỗ cho thời tiết.',
          'Hai địa điểm, đừng tham.',
          'Concept bắt đầu từ tính cách hai bạn, không phải từ Pinterest.',
          'Quần áo tông trung tính, hai bộ.',
          'Ngủ đủ — điều rẻ nhất và hiệu quả nhất.'
        ]}
      ]
    },
    {
      id: 'p2', slug: 'timeline-ngay-cuoi-tu-makeup-den-ket-thuc',
      title: 'Timeline một ngày cưới, tính ngược từ giờ đón dâu',
      excerpt: 'Bảng giờ tụi mình vẫn đưa cho cô dâu chú rể — làm ngược từ giờ quan trọng nhất trở lại.',
      category: 'wedding-day', tags: ['timeline', 'ngày cưới', 'planning'],
      author: AUTHORS.team, publishedAt: '2026-08-04', readingTime: 9, featured: false, status: 'published',
      featuredImage: img('1520854221256-17451cc331bf', 'Nghi thức trao nhẫn trong lễ cưới'),
      galleryImages: [], seoTitle: 'Timeline ngày cưới chi tiết | NOW Studio',
      seoDescription: 'Bảng giờ ngày cưới tính ngược từ giờ đón dâu — kinh nghiệm thực tế sau nhiều mùa cưới.',
      canonicalUrl: '/guide/wedding-day/timeline-ngay-cuoi-tu-makeup-den-ket-thuc',
      relatedArticles: ['p6', 'p9', 'p1'], content: []
    },
    {
      id: 'p3', slug: 'phong-su-cuoi-la-gi',
      title: 'Phóng sự cưới là gì, và khác chụp truyền thống ở chỗ nào',
      excerpt: 'Hai cách chụp không hơn kém nhau — chúng trả lời hai câu hỏi khác nhau về ngày cưới của bạn.',
      category: 'photography', tags: ['phóng sự', 'documentary'],
      author: AUTHORS.tuan, publishedAt: '2026-07-22', readingTime: 6, featured: false, status: 'published',
      featuredImage: img('1469371670807-013ccf25f16a', 'Khoảnh khắc candid trong tiệc cưới'),
      galleryImages: [], canonicalUrl: '/guide/photography/phong-su-cuoi-la-gi',
      relatedArticles: ['p5', 'p1'], content: []
    },
    {
      id: 'p4', slug: 'chup-pre-wedding-nen-chuan-bi-truoc-bao-lau',
      title: 'Nên chụp Pre-Wedding trước ngày cưới bao lâu?',
      excerpt: 'Câu trả lời phụ thuộc vào một thứ ít ai tính tới: thời gian in album và thời tiết.',
      category: 'pre-wedding', tags: ['pre-wedding', 'lịch trình'],
      author: AUTHORS.team, publishedAt: '2026-07-09', readingTime: 5, featured: false, status: 'published',
      featuredImage: img('1511285560929-80b456fea0bc', 'Cặp đôi giữa cánh đồng lúc chiều'),
      galleryImages: [], canonicalUrl: '/guide/pre-wedding/chup-pre-wedding-nen-chuan-bi-truoc-bao-lau',
      relatedArticles: ['p1'], content: []
    },
    {
      id: 'p5', slug: 'lam-sao-chon-photographer-phu-hop',
      title: 'Làm sao biết một photographer hợp với mình',
      excerpt: 'Đừng chỉ xem ảnh đẹp. Có ba thứ khác nói nhiều hơn về việc bạn sẽ thấy thế nào trong ngày cưới.',
      category: 'photography', tags: ['chọn ekip'],
      author: AUTHORS.tuan, publishedAt: '2026-06-28', readingTime: 8, featured: false, status: 'published',
      featuredImage: img('1522673607200-164d1b6ce486', 'Chú rể chuẩn bị trước lễ'),
      galleryImages: [], canonicalUrl: '/guide/photography/lam-sao-chon-photographer-phu-hop',
      relatedArticles: ['p3'], content: []
    },
    {
      id: 'p6', slug: 'co-dau-nen-bat-dau-makeup-luc-may-gio',
      title: 'Cô dâu nên bắt đầu makeup lúc mấy giờ',
      excerpt: 'Một phép tính đơn giản, nhưng sai một tiếng là cả buổi sáng bị dồn.',
      category: 'makeup', tags: ['makeup', 'timeline'],
      author: AUTHORS.team, publishedAt: '2026-06-15', readingTime: 4, featured: false, status: 'published',
      featuredImage: img('1591604466107-ec97de577aff', 'Cô dâu chuẩn bị trong buổi sáng'),
      galleryImages: [], canonicalUrl: '/guide/makeup/co-dau-nen-bat-dau-makeup-luc-may-gio',
      relatedArticles: ['p2', 'p10'], content: []
    },
    {
      id: 'p7', slug: 'chon-vay-cuoi-theo-dang-nguoi',
      title: 'Chọn váy cưới: bắt đầu từ dáng người, không phải từ ảnh mẫu',
      excerpt: 'Chiếc váy đẹp nhất trên mẫu chưa chắc là chiếc bạn ngồi xuống được trong bữa tiệc bốn tiếng.',
      category: 'dress', tags: ['váy cưới'],
      author: AUTHORS.team, publishedAt: '2026-06-02', readingTime: 7, featured: false, status: 'published',
      featuredImage: img('1511578314322-379afb476865', 'Chi tiết váy cưới'),
      galleryImages: [], canonicalUrl: '/guide/dress/chon-vay-cuoi-theo-dang-nguoi',
      relatedArticles: ['p10'], content: []
    },
    {
      id: 'p8', slug: 'phan-bo-ngan-sach-dam-cuoi',
      title: 'Phân bổ ngân sách đám cưới, và những khoản luôn phát sinh',
      excerpt: 'Bảng phần trăm tụi mình thấy đúng nhất với các đám cưới miền Tây — kèm ba khoản hầu như ai cũng quên.',
      category: 'budget', tags: ['ngân sách', 'chi phí'],
      author: AUTHORS.team, publishedAt: '2026-05-20', readingTime: 10, featured: false, status: 'published',
      featuredImage: img('1519689680058-324335c77eba', 'Không gian tiệc cưới'),
      galleryImages: [], canonicalUrl: '/guide/budget/phan-bo-ngan-sach-dam-cuoi',
      relatedArticles: ['p9'], content: []
    },
    {
      id: 'p9', slug: 'checklist-chuan-bi-cuoi-theo-moc-thoi-gian',
      title: 'Checklist chuẩn bị cưới, chia theo mốc 6 tháng — 1 tháng — 1 tuần',
      excerpt: 'In ra, dán lên tủ lạnh, gạch dần. Không có gì thông minh ở đây cả — chỉ là đủ.',
      category: 'planning', tags: ['checklist', 'planning'],
      author: AUTHORS.team, publishedAt: '2026-05-06', readingTime: 12, featured: false, status: 'published',
      featuredImage: img('1507504031003-b417219a0fde', 'Toàn cảnh nơi tổ chức tiệc cưới'),
      galleryImages: [], canonicalUrl: '/guide/planning/checklist-chuan-bi-cuoi-theo-moc-thoi-gian',
      relatedArticles: ['p8', 'p2'], content: []
    },
    {
      id: 'p10', slug: 'trial-makeup-co-can-thiet-khong',
      title: 'Trial makeup có thật sự cần không?',
      excerpt: 'Có — nhưng không phải vì lý do mà phần lớn mọi người nghĩ.',
      category: 'makeup', tags: ['makeup', 'trial'],
      author: AUTHORS.team, publishedAt: '2026-04-24', readingTime: 5, featured: false, status: 'published',
      featuredImage: img('1490481651871-ab68de25d43d', 'Chi tiết trang điểm cô dâu'),
      galleryImages: [], canonicalUrl: '/guide/makeup/trial-makeup-co-can-thiet-khong',
      relatedArticles: ['p6'], content: []
    },
    {
      id: 'p11', slug: 'nhung-thu-co-dau-chu-re-thuong-quen',
      title: 'Những thứ cô dâu chú rể hay quên trong ngày cưới',
      excerpt: 'Danh sách này được góp nhặt từ những lần tụi mình phải chạy đi mua giúp.',
      category: 'wedding-day', tags: ['ngày cưới', 'checklist'],
      author: AUTHORS.tuan, publishedAt: '2026-04-10', readingTime: 6, featured: false, status: 'published',
      featuredImage: img('1465495976277-4387d4b0b4c6', 'Nghi thức trước cổng lễ'),
      galleryImages: [], canonicalUrl: '/guide/wedding-day/nhung-thu-co-dau-chu-re-thuong-quen',
      relatedArticles: ['p2', 'p9'], content: []
    },
    {
      id: 'p12', slug: 'nen-thue-hay-may-vay-cuoi',
      title: 'Nên thuê hay may váy cưới?',
      excerpt: 'So sánh thật về chi phí, thời gian và thứ bạn giữ lại được sau ngày cưới.',
      category: 'dress', tags: ['váy cưới', 'ngân sách'],
      author: AUTHORS.team, publishedAt: '2026-03-28', readingTime: 6, featured: false, status: 'published',
      featuredImage: img('1525328437458-0c4d4db7cab4', 'Cô dâu thử váy'),
      galleryImages: [], canonicalUrl: '/guide/dress/nen-thue-hay-may-vay-cuoi',
      relatedArticles: ['p7', 'p8'], content: []
    },
    {
      id: 'p13', slug: 'bai-nhap-chua-xuat-ban',
      title: '(Nháp) Chụp trong nhà thờ cần lưu ý gì',
      excerpt: 'Bài đang viết — không hiện trên trang.',
      category: 'photography', tags: [], author: AUTHORS.tuan,
      publishedAt: '2026-09-30', readingTime: 5, featured: false, status: 'draft',
      featuredImage: img('1544078751-58fee2d8a03b', 'Nghi thức trong nhà thờ'),
      galleryImages: [], canonicalUrl: '', relatedArticles: [], content: []
    }
  ];

  window.GUIDE_DATA = {
    site: {
      title: 'NOW Wedding Guide',
      kicker: 'Now Wedding Guide',
      heading: 'Những điều đáng biết\ntrước *ngày cưới*.',
      lede: 'Kinh nghiệm tụi mình đúc kết sau nhiều mùa cưới ở miền Tây — từ lúc còn đang lên danh sách khách mời cho tới khi xe hoa lăn bánh.',
      note: 'Viết bởi ekip đang đi chụp mỗi cuối tuần. Không phải bài tổng hợp trên mạng.',
      cta: { heading: 'Còn câu hỏi nào chưa có bài trả lời?', text: 'Nhắn tụi mình một câu. Trả lời được thì trả lời ngay, không thì hẹn cà phê.', label: 'Liên hệ NOW Studio', href: '../NOW Studio.html#contact' }
    },
    categories: CATEGORIES,
    articles: ARTICLES
  };
})();
