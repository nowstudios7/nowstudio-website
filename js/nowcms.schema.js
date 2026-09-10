/* ─────────────────────────────────────────────────────────────
   NOW·STUDIO — CMS: khai báo nội dung (content model)
   Đây là file DUY NHẤT bạn/mình sửa khi muốn thêm ô nội dung
   mới hoặc thêm section mới. Không có logic, chỉ khai báo.

   Mỗi field gồm:
     key     — đường dẫn trong dữ liệu (fields.<key>)
     target  — ổ cắm trong HTML: data-cms="<target>"
     type    — loại ô: text | lines | paragraphs | link | imageList | statList
     label   — tên hiển thị trong trang quản lý
     hint    — câu hướng dẫn dưới ô
     group   — nhóm để xếp form trong admin
   Thêm section mới = thêm một entry vào `sections`, không sửa
   nowcms.js, không sửa admin.
   ───────────────────────────────────────────────────────────── */
window.NOWCMS_SCHEMA = {

  /* Nguồn dữ liệu đang dùng: 'json' (file trong web) hoặc 'sanity' (CMS online).
     Bước 2 chỉ cần đổi dòng này sang 'sanity' và điền config bên dưới. */
  source: 'json',

  sanity: {
    projectId: '',        // điền ở Bước 2
    dataset: 'production',
    apiVersion: '2024-10-01',
    useCdn: true
  },

  focusOptions: [
    { value: 'center 26%', label: 'Mặt phía trên (mặc định)' },
    { value: 'center 40%', label: 'Hơi trên' },
    { value: 'center', label: 'Giữa ảnh' },
    { value: 'center top', label: 'Sát trên' },
    { value: 'center bottom', label: 'Sát dưới' }
  ],

  sections: {

    hero: {
      title: 'Hero',
      icon: '▣',
      source: 'content/hero.json',
      sanityType: 'section.hero',
      groups: [
        { id: 'media', title: 'Ảnh Hero — slideshow' },
        { id: 'caption', title: 'Caption trên ảnh' },
        { id: 'copy', title: 'Chữ' },
        { id: 'cta', title: 'Nút bấm' },
        { id: 'facts', title: 'Số liệu & dòng cuối' }
      ],
      fields: [
        {
          key: 'slides', target: 'hero.slides', type: 'imageList', group: 'media',
          label: 'Ảnh slideshow', min: 1,
          hint: 'Ảnh đầu tiên hiện trước. Số dots tự đổi theo số ảnh. “Điểm nhìn” quyết định phần nào của ảnh được giữ khi crop trên điện thoại.',
          onRender: 'initHeroSlider'
        },
        { key: 'caption.name', target: 'hero.caption.name', type: 'text', group: 'caption', label: 'Tên cặp đôi' },
        { key: 'caption.meta', target: 'hero.caption.meta', type: 'text', group: 'caption', label: 'Địa điểm, năm' },

        { key: 'rail', target: 'hero.rail', type: 'text', group: 'copy', label: 'Dòng dọc cạnh trái' },
        { key: 'eyebrow', target: 'hero.eyebrow', type: 'text', group: 'copy', label: 'Dòng nhỏ trên tiêu đề' },
        {
          key: 'headline', target: 'hero.headline', type: 'lines', group: 'copy',
          label: 'Tiêu đề — mỗi dòng một hàng', rows: 3,
          hint: 'Đặt *dấu sao* quanh chữ muốn in nghiêng màu gold. Giữ 3 dòng ngắn để không vỡ trên điện thoại.'
        },
        { key: 'subheadline', target: 'hero.subheadline', type: 'text', group: 'copy', label: 'Dòng phụ (in nghiêng)' },
        {
          key: 'body', target: 'hero.body', type: 'paragraphs', group: 'copy',
          label: 'Mô tả', rows: 8, hint: 'Cách nhau một dòng trống = đoạn mới.'
        },
        { key: 'note', target: 'hero.note', type: 'text', group: 'copy', label: 'Ghi chú nhỏ (dịch vụ trọn gói)', rows: 3, multiline: true },

        { key: 'cta.primary', target: 'hero.cta.primary', type: 'link', group: 'cta', label: 'Nút chính' },
        { key: 'cta.secondary', target: 'hero.cta.secondary', type: 'link', group: 'cta', label: 'Nút phụ' },

        {
          key: 'stats', target: 'hero.stats', type: 'statList', group: 'facts',
          label: 'Số liệu', keepChild: '.hero-est',
          hint: 'Thêm hoặc bớt tự do — dải hairline tự chia đều.'
        },
        { key: 'badge', target: 'hero.badge', type: 'text', group: 'facts', label: 'Dòng bên phải dải số liệu' }
      ]
    }

    /* Section tiếp theo làm y hệt — ví dụ:
    portfolio: {
      title: 'Bộ sưu tập', source: 'content/portfolio.json',
      sanityType: 'section.portfolio',
      groups: [{ id:'copy', title:'Chữ' }, { id:'media', title:'Ảnh' }],
      fields: [
        { key:'title',  target:'portfolio.title',  type:'text',      group:'copy' },
        { key:'items',  target:'portfolio.items',  type:'imageList', group:'media' }
      ]
    }
    */
  }
};
