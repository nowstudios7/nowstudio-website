/* NOW·STUDIO — admin/proofs.html · Feedback khách hàng (ảnh chụp tin nhắn / bình luận thật → section #feedback trang chủ)
   Nháp: localStorage 'nowcms.proofs.draft' → {fields}
   Chính thức: content/feedback-proofs.json → Publish (NOWPUBLISH → /api/publish → GitHub → Cloudflare)
   Ảnh từ máy: nén WebP trong trình duyệt → /api/upload (cùng phiên đăng nhập CMS) → media/feedback/*.webp */
(function(){
const KEY='nowcms.proofs.draft', SRC='../content/feedback-proofs.json', SOC='../content/social.json';
const S=window.NOWCMS_SCHEMA, P=window.NOWPROOFS, SO=window.NOWSOCIAL;
const $=id=>document.getElementById(id), pv=$('pv');
const PER=20, LOCAL={}, STN={draft:'Bản nháp',published:'Đã xuất bản',hidden:'Đã ẩn'};
let D=null, published=null, dirty=false, cur=-1, page=0, dragI=-1;
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const now=()=>new Date().toISOString();
const uid=()=>'fb-'+now().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,8);
const fmtD=iso=>{const d=new Date(iso);return isNaN(d)?'—':d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})};
const thumb=it=>LOCAL[it._id]||P.thumbOf(it), full=it=>LOCAL[it._id]||P.fullOf(it);

let tt;function toast(msg,bad){const t=$('toast');t.textContent=msg;t.className='toast on'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>t.className='toast'+(bad?' bad':''),3200)}
function modal(html,wide){$('modal-body').className='modal'+(wide?' wide':'');$('modal-body').innerHTML=html;$('mask').classList.add('on')}
function closeModal(){$('mask').classList.remove('on')}
$('mask').addEventListener('click',e=>{if(e.target===$('mask'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('mask').classList.contains('on'))closeModal()});
function ask(title,body,okLabel,danger){return new Promise(res=>{
  modal(`<h3>${title}</h3>${body}<div class="m-acts"><button type="button" id="m-no">Huỷ</button><button type="button" class="${danger?'danger':'solid'}" id="m-ok">${okLabel}</button></div>`);
  $('m-no').onclick=()=>{closeModal();res(false)};$('m-ok').onclick=()=>{closeModal();res(true)};
})}

/* ── xem trước trang chủ ── */
let pt,DEMO=false,DEMO_ITEMS=null;
function pvDoc(){if(!DEMO)return D;if(!DEMO_ITEMS&&window.NOWPROOFS_DEMO)DEMO_ITEMS=NOWPROOFS_DEMO();return Object.assign({},D,{enabled:true,items:DEMO_ITEMS||[]})}
function push(){clearTimeout(pt);pt=setTimeout(()=>{try{pv.contentWindow.postMessage({type:'nowcms:draft',section:'proofs',data:{fields:pvDoc()}},'*')}catch(e){}},150)}
/* đưa section #feedback vào giữa khung xem trước (chờ tới khi section hiện) */
let jt;function jump(tries){clearTimeout(jt);tries=tries==null?12:tries;
  try{const w=pv.contentWindow,el=pv.contentDocument.getElementById('feedback');
    if(!el||el.hidden||!el.offsetHeight){if(tries>0)jt=setTimeout(()=>jump(tries-1),300);return}
    const top=el.getBoundingClientRect().top+w.scrollY,hh=el.offsetHeight,vh=w.innerHeight;
    w.scrollTo({top:Math.max(0,hh<vh?top-(vh-hh)/2:top-56),behavior:'smooth'})}catch(e){}}
$('demo').onclick=()=>{DEMO=!DEMO;$('demo').classList.toggle('on',DEMO);$('demo').textContent=DEMO?'Đang xem dữ liệu mẫu':'Xem với dữ liệu mẫu';push();setTimeout(()=>jump(),400)};
function previewItem(id){push();setTimeout(()=>{jump();setTimeout(()=>{try{pv.contentWindow.NOWPROOFS.openId(id)}catch(e){}},500)},350)}
function setDevice(m){$('stage').className='pv-stage '+(m?'mob':'desk');$('bm').classList.toggle('on',m);$('bd').classList.toggle('on',!m);setTimeout(()=>jump(),250)}
$('bd').onclick=()=>setDevice(false);$('bm').onclick=()=>setDevice(true);
$('jump').onclick=()=>jump();$('reload').onclick=()=>{pv.src=pv.src};
pv.addEventListener('load',()=>{push();setTimeout(()=>jump(),500)});

function paintState(){const el=$('state');
  if(dirty){el.className='state dirty';el.textContent='Nháp chưa lưu'}
  else if(localStorage.getItem(KEY)){el.className='state saved';el.textContent='Đã lưu nháp'}
  else{el.className='state';el.textContent='Trùng bản đang chạy'}
  $('discard').disabled=!dirty&&!localStorage.getItem(KEY)}
function change(it){if(it)it.updatedAt=now();dirty=true;paintState();push();paintWarn()}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

function buildRail(){
  $('rail').innerHTML='<div class="rail-t">Section</div>'+Object.keys(S.sections).map(k=>{const s=S.sections[k];const href=s.admin||(k==='hero'?'hero.html':'#');
    return `<a href="${href}" class="${k==='proofs'?'on':''}"><i>${s.icon||'▣'}</i>${s.title}</a>`}).join('')+
    ['About'].map(n=>`<span class="off"><i>▢</i>${n}<span class="soon">sắp có</span></span>`).join('');
}
const catOpts=(v,all)=>(all?'<option value="all">Mọi danh mục</option><option value="none">Không phân loại</option>':'<option value="">Không phân loại</option>')+P.categories.map(c=>`<option value="${c.id}"${c.id===v?' selected':''}>${esc(c.name)}</option>`).join('');
const srcOpts=v=>'<option value="">Không ghi</option>'+P.sources.map(s=>`<option value="${s.id}"${s.id===v?' selected':''}>${esc(s.name)}</option>`).join('');
function dimText(it){if(!(it.w>0))return'Chưa rõ kích thước';const r=it.h/it.w;return it.w+'×'+it.h+' px · '+(r>2.4?'ảnh dài':r>1.1?'ảnh dọc':r<0.9?'ảnh ngang':'ảnh vuông')}

/* ── kiểm tra ── */
function probOf(it){const o=[];if(!P.validUrl(it.src))o.push('link ảnh không hợp lệ');if(it.status==='published'&&!it.consent)o.push('chưa xác nhận đã che thông tin & khách đồng ý');return o}
function problems(){const o=[];[['heroImage','Ảnh đầu trang /feedback'],['ctaImage','Ảnh cuối trang /feedback']].forEach(([k,n])=>{if(D[k]&&!P.validUrl(D[k]))o.push(n+': link phải bắt đầu bằng https://')});D.items.forEach((it,i)=>{if(it.status==='published')probOf(it).forEach(p=>o.push('Feedback #'+(i+1)+': '+p))});
  D.slogans.forEach((s,i)=>{if(s.show&&s.text.length>120)o.push('Slogan '+(i+1)+': quá dài (tối đa 120 ký tự)')});return o}
function paintWarn(){const p=problems(),w=$('warn');w.style.display=p.length?'block':'none';w.querySelector('ul').innerHTML=p.map(x=>`<li>${esc(x)}</li>`).join('')}

/* ── chuyển màn ── */
function view(v){['v-list','v-add','v-edit','v-cfg'].forEach(id=>$(id).classList.toggle('on',id===v));$('tab-list').classList.toggle('on',v!=='v-cfg');$('tab-cfg').classList.toggle('on',v==='v-cfg');window.scrollTo(0,0)}
function toList(){cur=-1;view('v-list');drawList()}
$('tab-list').onclick=toList;$('tab-cfg').onclick=()=>{view('v-cfg');drawCfg()};
$('add').onclick=()=>{view('v-add');$('drop-st').textContent='';$('drop-st').className=''};
$('add-back').onclick=toList;$('e-back').onclick=toList;$('e-done').onclick=toList;

/* ── danh sách ── */
const F={q:'',st:'all',cat:'all',sort:'order'}, SEL=new Set();
const plain=()=>!F.q.trim()&&F.st==='all'&&F.cat==='all'&&F.sort==='order';
function rows(){let r=D.items.map((it,i)=>({it,i}));const q=F.q.trim().toLowerCase();
  if(q)r=r.filter(({it})=>(it.title+' '+it.note).toLowerCase().includes(q));
  if(F.st!=='all')r=r.filter(({it})=>it.status===F.st);
  if(F.cat!=='all')r=r.filter(({it})=>F.cat==='none'?!it.category:it.category===F.cat);
  if(F.sort!=='order'){const k=F.sort==='created'?'createdAt':'updatedAt';r.sort((a,b)=>String(b.it[k]).localeCompare(String(a.it[k]))||a.i-b.i)}
  return r}
$('q').oninput=e=>{F.q=e.target.value;page=0;drawList()};
['st','cat','sort'].forEach(k=>{$('f-'+k).onchange=e=>{F[k]=e.target.value;page=0;drawList()}});
$('stats').onclick=e=>{const b=e.target.closest('[data-st]');if(!b)return;F.st=b.dataset.st;$('f-st').value=F.st;page=0;drawList()};
$('pager').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;page+=+b.dataset.p;drawList();window.scrollTo(0,0)};
function drawList(){
  const all=rows(),pages=Math.max(1,Math.ceil(all.length/PER));page=Math.max(0,Math.min(page,pages-1));
  const vis=all.slice(page*PER,page*PER+PER),box=$('list'),canMove=plain();box.innerHTML='';
  const n={draft:0,published:0,hidden:0};D.items.forEach(x=>n[x.status]++);
  $('stats').innerHTML=[['all','Tất cả',D.items.length],['published','Đã xuất bản',n.published],['draft','Bản nháp',n.draft],['hidden','Đã ẩn',n.hidden]].map(([k,l,c])=>`<button type="button" class="mini${F.st===k?' on':''}" data-st="${k}">${l} · ${c}</button>`).join('');
  if(!D.items.length)box.innerHTML='<div class="empty">Chưa có feedback nào. Bấm <b>+ Thêm feedback</b> để tải ảnh lên.</div>';
  else if(!all.length)box.innerHTML='<div class="empty">Không có feedback khớp bộ lọc.</div>';
  vis.forEach(({it,i})=>{
    const r=document.createElement('div'),c=P.catBy(it.category),bad=it.status==='published'&&probOf(it).length;
    r.className='tr'+(it.status==='published'?'':' off');
    r.innerHTML=`<input type="checkbox" class="tr-cb" aria-label="Chọn feedback ${i+1}"${SEL.has(it._id)?' checked':''}>
      <button type="button" class="tr-th" data-a="view" title="Xem ảnh lớn"><img src="${esc(thumb(it))}" alt="" loading="lazy" draggable="false"></button>
      <div class="tr-b"><div class="tr-t${it.title?'':' muted'}">${esc(it.title||'Chưa đặt tiêu đề')}</div>
        <div class="tr-m"><span class="pill${bad?' bad':it.status==='published'?' on':''}">${bad?'Thiếu xác nhận':STN[it.status]}</span><span>${esc(c?c.name:'Không phân loại')}</span><span>Cập nhật ${fmtD(it.updatedAt)}</span></div>
        <div class="tr-acts"><button type="button" class="mini" data-a="edit">Sửa</button><button type="button" class="mini" data-a="vis">${it.status==='published'?'Ẩn':'Xuất bản'}</button><button type="button" class="mini" data-a="pv"${it.status==='published'&&!bad?'':' disabled'} title="Mở ảnh này trong khung xem trước">Xem</button><button type="button" class="mini" data-a="dup">Nhân bản</button><button type="button" class="mini danger" data-a="del">Xoá</button></div></div>
      <div class="tr-ord"><button type="button" class="mini" data-a="up"${!canMove||i===0?' disabled':''} aria-label="Lên một bậc">↑</button><span class="tr-no">${i+1}</span><button type="button" class="mini" data-a="down"${!canMove||i===D.items.length-1?' disabled':''} aria-label="Xuống một bậc">↓</button></div>`;
    r.querySelector('.tr-cb').onchange=e=>{e.target.checked?SEL.add(it._id):SEL.delete(it._id);paintBulk()};
    r.onclick=e=>{const b=e.target.closest('[data-a]');if(b)act(b.dataset.a,i)};
    if(canMove){r.draggable=true;
      r.addEventListener('dragstart',e=>{dragI=i;r.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))});
      r.addEventListener('dragend',()=>{dragI=-1;r.classList.remove('dragging');box.querySelectorAll('.over').forEach(x=>x.classList.remove('over'))});
      r.addEventListener('dragover',e=>{if(dragI<0)return;e.preventDefault();r.classList.add('over')});
      r.addEventListener('dragleave',()=>r.classList.remove('over'));
      r.addEventListener('drop',e=>{e.preventDefault();r.classList.remove('over');if(dragI>=0&&dragI!==i)move(dragI,i)})}
    box.appendChild(r)});
  $('pager').hidden=pages<2;
  $('pager').innerHTML=`<button type="button" class="mini" data-p="-1"${page===0?' disabled':''}>‹ Trước</button><span>Trang ${page+1} / ${pages}</span><button type="button" class="mini" data-p="1"${page>=pages-1?' disabled':''}>Sau ›</button>`;
  $('order-hint').innerHTML=canMove?'Kéo thả dòng hoặc dùng ↑ ↓ để đổi thứ tự — thứ tự này là thứ tự trên trang chủ. Chỉ feedback <b>Đã xuất bản</b> và <b>đã tích xác nhận</b> mới hiện cho khách.':'Đang tìm / lọc / sắp xếp — chọn “Thứ tự hiển thị” và bỏ lọc để đổi thứ tự.';
  paintBulk();paintWarn();
}
function move(from,to){const [x]=D.items.splice(from,1);D.items.splice(to,0,x);change();drawList();toast('Đã chuyển tới vị trí '+(to+1)+'.')}
function paintBulk(){
  [...SEL].forEach(id=>{if(!D.items.some(x=>x._id===id))SEL.delete(id)});
  const n=SEL.size,b=$('bulk');b.hidden=!D.items.length;$('bulk-n').textContent=n?'Đã chọn '+n:'';
  b.querySelectorAll('[data-b]').forEach(x=>x.disabled=!n);
  const ids=rows().slice(page*PER,page*PER+PER).map(r=>r.it._id);$('sel-page').checked=!!ids.length&&ids.every(id=>SEL.has(id));
}
$('sel-page').onchange=e=>{rows().slice(page*PER,page*PER+PER).forEach(r=>e.target.checked?SEL.add(r.it._id):SEL.delete(r.it._id));drawList()};
$('bulk').addEventListener('click',async e=>{const b=e.target.closest('[data-b]');if(!b)return;const v=b.dataset.b,list=D.items.filter(x=>SEL.has(x._id));if(!list.length)return;
  if(v==='del'){if(!await ask('Xoá '+list.length+' feedback?','<p>Các feedback này bị gỡ khỏi danh sách và khỏi trang chủ sau khi Publish. File ảnh trong kho lưu trữ được giữ lại, không bị xoá.</p>','Xoá '+list.length+' mục',true))return;
    D.items=D.items.filter(x=>!SEL.has(x._id));SEL.clear();change();drawList();toast('Đã xoá '+list.length+' feedback.');return}
  if(v==='published'){const bad=list.filter(x=>!x.consent||!P.validUrl(x.src));list.forEach(x=>{if(!bad.includes(x)){x.status='published';x.updatedAt=now()}});change();drawList();
    toast(bad.length?'Đã xuất bản '+(list.length-bad.length)+' · '+bad.length+' mục chưa tích xác nhận nên giữ nguyên.':'Đã xuất bản '+list.length+' feedback — áp dụng khi Publish.',!!bad.length);return}
  list.forEach(x=>{x.status=v;x.updatedAt=now()});change();drawList();toast('Đã chuyển '+list.length+' feedback sang “'+STN[v]+'”.')});

async function act(a,i){const it=D.items[i];if(!it)return;
  if(a==='up'||a==='down'){const j=a==='up'?i-1:i+1;if(j>=0&&j<D.items.length)move(i,j);return}
  if(a==='edit'){openEdit(i);return}
  if(a==='vis'){setStatus(it,it.status==='published'?'hidden':'published');drawList();return}
  if(a==='pv'){previewItem(it._id);return}
  if(a==='dup'){D.items.splice(i+1,0,dup(it));change();drawList();toast('Đã nhân bản thành bản nháp ở vị trí '+(i+2)+'.');return}
  if(a==='del'){if(await delOne(i))drawList();return}
  if(a==='view'){modal(`<h3>${esc(it.title||'Feedback #'+(i+1))}</h3><p>${esc(dimText(it))}</p><div class="big"><img src="${esc(full(it))}" alt=""></div><div class="m-acts"><a href="${esc(full(it))}" target="_blank" rel="noopener noreferrer">Mở ảnh gốc ↗</a><span style="flex:1"></span><button type="button" class="solid" id="m-ok">Đóng</button></div>`,true);$('m-ok').onclick=closeModal}
}
function setStatus(it,v){
  if(v==='published'&&!P.validUrl(it.src)){toast('Link ảnh chưa hợp lệ — sửa trước khi xuất bản.',true);return false}
  if(v==='published'&&!it.consent){toast('Tích “Đã che thông tin & khách đồng ý đăng” trước khi xuất bản.',true);return false}
  it.status=v;change(it);toast(v==='published'?'Sẽ hiện trên trang chủ sau khi Publish.':'Đã chuyển sang “'+STN[v]+'”.');return true}
function dup(it){const x=clone(it),t=now();x._id=uid();x.status='draft';x.title=it.title?it.title+' (bản sao)':'';x.createdAt=t;x.updatedAt=t;if(LOCAL[it._id])LOCAL[x._id]=LOCAL[it._id];return x}
async function delOne(i){if(!await ask('Xoá feedback này?','<p>Feedback bị gỡ khỏi danh sách và khỏi trang chủ sau khi Publish. File ảnh trong kho lưu trữ được giữ lại.</p>','Xoá',true))return false;
  const [x]=D.items.splice(i,1);SEL.delete(x._id);change();toast('Đã xoá.');return true}

/* ── sửa ── */
const it=()=>D.items[cur];
function openEdit(i){cur=i;view('v-edit');fillEdit()}
function fillEdit(){const x=it();if(!x)return toList();
  $('e-head').textContent=x.title||'Feedback #'+(cur+1);$('e-img').src=full(x);$('e-dim').textContent=dimText(x);
  $('e-title').value=x.title;$('e-note').value=x.note;$('e-cat').innerHTML=catOpts(x.category);$('e-src').innerHTML=srcOpts(x.source);
  $('e-order').innerHTML=D.items.map((_,k)=>`<option value="${k}"${k===cur?' selected':''}>Vị trí ${k+1} / ${D.items.length}</option>`).join('');
  $('e-consent').checked=x.consent;paintStatus();paintStamp()}
function paintStatus(){$('e-status').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===it().status))}
function paintStamp(){const x=it();$('e-stamp').textContent='Tạo '+fmtD(x.createdAt)+' · Cập nhật '+fmtD(x.updatedAt)+(P.isMedia(x.src)?' · Lưu trên website':' · Ảnh từ link ngoài')}
$('e-title').oninput=e=>{const x=it();x.title=e.target.value;$('e-head').textContent=x.title||'Feedback #'+(cur+1);change(x)};
$('e-note').oninput=e=>{const x=it();x.note=e.target.value;change(x)};
$('e-cat').onchange=e=>{const x=it();x.category=e.target.value;change(x)};
$('e-src').onchange=e=>{const x=it();x.source=e.target.value;change(x)};
$('e-status').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;setStatus(it(),b.dataset.v);paintStatus();paintStamp()};
$('e-consent').onchange=e=>{const x=it();x.consent=e.target.checked;if(!x.consent&&x.status==='published'){x.status='hidden';toast('Đã ẩn vì bỏ xác nhận.')}change(x);paintStatus()};
$('e-order').onchange=e=>{const j=+e.target.value,[x]=D.items.splice(cur,1);D.items.splice(j,0,x);cur=j;change();fillEdit();toast('Đã chuyển tới vị trí '+(j+1)+'.')};
$('e-dup').onclick=()=>{const x=dup(it());D.items.splice(cur+1,0,x);change();openEdit(cur+1);toast('Đang sửa bản sao (bản nháp).')};
$('e-del').onclick=async()=>{if(await delOne(cur))toList()};
$('e-pv').onclick=()=>{const x=it();if(!P.isPublic(x)){toast('Chỉ xem được feedback đã xuất bản và đã tích xác nhận.',true);return}previewItem(x._id)};
$('e-replace').onclick=()=>$('e-file').click();
$('e-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const x=it();
  try{checkFile(f);await ensureAuth();toast('Đang nén và tải ảnh mới…');const r=await uploadOne(f);x.src=r.src;x.thumb=r.thumb;x.w=r.w;x.h=r.h;LOCAL[x._id]=LOCAL[r._id];change(x);fillEdit();toast('Đã thay ảnh. Ảnh cũ vẫn được giữ trong kho.')}
  catch(err){toast(err.message,true)}};
$('e-relink').onclick=()=>{const x=it();
  modal(`<h3>Dùng link ảnh khác</h3><label for="m-src">Link ảnh gốc</label><input id="m-src" type="url" spellcheck="false" value="${esc(P.isMedia(x.src)?'':x.src)}" placeholder="https://i.ibb.co/…"><label for="m-th">Link ảnh nhỏ (không bắt buộc)</label><input id="m-th" type="url" spellcheck="false" value="${esc(P.isMedia(x.thumb)?'':x.thumb)}" placeholder="Bỏ trống = dùng ảnh gốc"><div class="m-acts"><button type="button" id="m-no">Huỷ</button><button type="button" class="solid" id="m-ok">Lưu</button></div>`,true);
  $('m-no').onclick=closeModal;
  $('m-ok').onclick=async()=>{const s=$('m-src').value.trim(),t=$('m-th').value.trim();
    if(!/^https:\/\//i.test(s)){toast('Link ảnh phải bắt đầu bằng https://',true);return}
    if(t&&!/^https:\/\//i.test(t)){toast('Link ảnh nhỏ phải bắt đầu bằng https://',true);return}
    $('m-ok').disabled=true;$('m-ok').textContent='Đang kiểm tra…';const d=await probe(s);
    if(!d){$('m-ok').disabled=false;$('m-ok').textContent='Lưu';toast('Không mở được ảnh từ link này.',true);return}
    x.src=s;x.thumb=t;x.w=d.w;x.h=d.h;delete LOCAL[x._id];closeModal();change(x);fillEdit()}};

/* ── tải ảnh từ máy ── */
const OK_TYPES=['image/png','image/jpeg','image/webp'],MAXB=15*1024*1024;
function checkFile(f){if(!OK_TYPES.includes(f.type))throw new Error(f.name+': chỉ nhận PNG, JPG hoặc WebP.');if(f.size>MAXB)throw new Error(f.name+': vượt 15 MB.')}
async function decode(f){if(window.createImageBitmap){try{return await createImageBitmap(f)}catch(e){}}
  return await new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error(f.name+': không đọc được ảnh.'));im.src=u})}
const toBlob=(c,t,q)=>new Promise(r=>c.toBlob(r,t,q));
async function encode(src,maxW,q){const w0=src.width||src.naturalWidth,h0=src.height||src.naturalHeight,r=Math.min(1,maxW/w0,12000/h0);
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w0*r));c.height=Math.max(1,Math.round(h0*r));
  const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,c.width,c.height);
  let b=await toBlob(c,'image/webp',q),ext='webp';if(!b||b.type!=='image/webp'){b=await toBlob(c,'image/jpeg',q);ext='jpg'}
  if(!b)throw new Error('Trình duyệt không nén được ảnh này.');return{blob:b,ext,w:c.width,h:c.height}}
const b64=blob=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=()=>rej(new Error('Không đọc được file.'));fr.readAsDataURL(blob)});
async function ensureAuth(){
  let s=null;try{s=await (await fetch('/api/session',{credentials:'same-origin'})).json()}catch(e){}
  if(!s||!s.ok||!s.configured)throw new Error('Tải ảnh từ máy chỉ hoạt động khi mở CMS trên tên miền website đã cấu hình Publish (PUBLISH.md). Tạm thời hãy dán link ảnh.');
  if(s.authed)return;
  const pw=await new Promise(res=>{modal(`<h3>Mật khẩu CMS</h3><p>Cần đăng nhập để tải ảnh lên website — phiên 8 giờ, dùng chung với Publish.</p><input type="password" id="m-pw" autocomplete="current-password" style="margin-top:12px"><div class="m-acts"><button type="button" id="m-no">Huỷ</button><button type="button" class="solid" id="m-ok">Đăng nhập</button></div>`);
    const i=$('m-pw'),done=v=>{closeModal();res(v)};i.focus();$('m-no').onclick=()=>done('');$('m-ok').onclick=()=>done(i.value);i.onkeydown=e=>{if(e.key==='Enter')done(i.value)}});
  if(!pw)throw new Error('Đã huỷ — cần mật khẩu CMS để tải ảnh.');
  let r=null;try{r=await (await fetch('/api/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})})).json()}catch(e){}
  if(!r||!r.ok)throw new Error((r&&r.error)||'Không đăng nhập được.')}
async function uploadOne(f,onStep){
  const id=uid(),img=await decode(f);onStep&&onStep('Đang nén…');
  const big=await encode(img,1440,.86),sm=await encode(img,600,.8),base='media/feedback/'+id;
  const files=[{path:base+'.'+big.ext,b64:await b64(big.blob)},{path:base+'-t.'+sm.ext,b64:await b64(sm.blob)}];
  onStep&&onStep('Đang tải lên…');
  let r=null;try{r=await (await fetch('/api/upload',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({files})})).json()}catch(e){}
  if(!r||!r.ok)throw new Error((r&&r.error)||'Tải lên thất bại — kiểm tra mạng.');
  LOCAL[id]=URL.createObjectURL(big.blob);
  return{_id:id,src:files[0].path,thumb:files[1].path,w:big.w,h:big.h}}
function newItem(o){const t=now();return Object.assign({_id:uid(),src:'',thumb:'',w:0,h:0,title:'',note:'',category:$('a-cat').value,source:$('a-src').value,status:'draft',consent:false,createdAt:t,updatedAt:t},o)}
async function handleFiles(list){
  const st=$('drop-st');st.className='';st.textContent='';
  const files=[...list],good=[],bad=[];files.forEach(f=>{try{checkFile(f);good.push(f)}catch(e){bad.push(e.message)}});
  if(bad.length){st.className='bad';st.textContent=bad.join(' · ')}
  if(!good.length)return;
  try{await ensureAuth()}catch(e){st.className='bad';st.textContent=e.message;return}
  let ok=0;
  for(const f of good){
    const row=document.createElement('div');row.className='up';const pre=URL.createObjectURL(f);
    row.innerHTML=`<img src="${pre}" alt=""><span class="up-n">${esc(f.name)}</span><span class="up-s">Đang đọc…</span>`;$('up-list').prepend(row);
    const s=row.querySelector('.up-s');
    try{const r=await uploadOne(f,t=>s.textContent=t);const x=newItem(r);D.items.unshift(x);ok++;change();
      s.className='up-s ok';s.innerHTML='Bản nháp · <a href="#" data-id="'+x._id+'">Sửa</a>'}
    catch(e){s.className='up-s bad';s.textContent=e.message}
  }
  if(ok){F.q='';F.st=F.cat='all';F.sort='order';['st','cat','sort'].forEach(k=>$('f-'+k).value=F[k]);$('q').value='';page=0;toast('Đã thêm '+ok+' feedback (bản nháp). Ảnh hiện trên website khoảng 1 phút sau khi tải.')}
}
$('up-list').onclick=e=>{const a=e.target.closest('a[data-id]');if(!a)return;e.preventDefault();const i=D.items.findIndex(x=>x._id===a.dataset.id);if(i>-1)openEdit(i)};
$('pick').onclick=()=>$('file').click();
$('file').onchange=e=>{handleFiles(e.target.files);e.target.value=''};
const drop=$('drop');
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>{if(e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)});

/* ── thêm từ link ── */
function extract(txt){const out=[],add=u=>{u=u.trim().replace(/&amp;/g,'&');if(!out.includes(u))out.push(u)};let m;
  const bb=/\[img\]\s*(\S+?)\s*\[\/img\]/gi;while((m=bb.exec(txt)))add(m[1]);
  if(!out.length){const h=/<img[^>]+src=["']([^"']+)["']/gi;while((m=h.exec(txt)))add(m[1])}
  if(!out.length){const r=/https?:\/\/[^\s"'<>\[\]]+/gi;while((m=r.exec(txt)))add(m[0])}return out}
function probe(u){return new Promise(res=>{const im=new Image(),to=setTimeout(()=>{im.src='';res(null)},15000);
  im.onload=()=>{clearTimeout(to);res(im.naturalWidth?{w:im.naturalWidth,h:im.naturalHeight}:null)};im.onerror=()=>{clearTimeout(to);res(null)};im.src=u})}
$('a-go').onclick=async()=>{const urls=extract($('a-urls').value);if(!urls.length){toast('Chưa thấy link ảnh nào.',true);return}
  const todo=urls.filter(u=>/^https:\/\//i.test(u)&&!D.items.some(x=>x.src===u)),skip=urls.length-todo.length,b=$('a-go');
  b.disabled=true;b.textContent='Đang kiểm tra '+todo.length+' ảnh…';const dims=await Promise.all(todo.map(probe));b.disabled=false;b.textContent='Thêm từ link';
  const fail=[];let ok=0;todo.forEach((u,k)=>{if(dims[k]){D.items.unshift(newItem({src:u,w:dims[k].w,h:dims[k].h}));ok++}else fail.push(u)});
  if(ok){$('a-urls').value=fail.join('\n');change()}
  toast([ok?'Đã thêm '+ok+' feedback (bản nháp)':'',skip?skip+' link trùng hoặc không phải https':'',fail.length?fail.length+' link không mở được ảnh':''].filter(Boolean).join(' · ')+'.',!ok)};

/* ── cấu hình hiển thị ── */
function drawCfg(){
  $('c-on').checked=D.enabled;
  $('c-layout').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===D.layout));
  $('c-init').innerHTML=P.initials.map(n=>`<option value="${n}"${n===D.initial?' selected':''}>${n} feedback</option>`).join('');
  $('say-every').innerHTML=P.sloganEverys.map(n=>`<option value="${n}"${n===D.sloganEvery?' selected':''}>${n} ảnh</option>`).join('');
  $('say-ideas').innerHTML=P.sloganIdeas.map(t=>`<option value="${esc(t)}"></option>`).join('');
  const box=$('say');box.innerHTML='';
  D.slogans.forEach((s,i)=>{const r=document.createElement('div');r.className='say-row';
    r.innerHTML=`<span class="pr-no" style="font-family:var(--serif);color:var(--gold-dark)">${i+1}</span><input type="text" list="say-ideas" maxlength="120" value="${esc(s.text)}" placeholder="Câu ngắn…" aria-label="Slogan ${i+1}"><label class="check"><input type="checkbox"${s.show?' checked':''}>Hiện</label><button type="button" class="mini" data-m="-1"${i===0?' disabled':''} aria-label="Lên">↑</button><button type="button" class="mini" data-m="1"${i===D.slogans.length-1?' disabled':''} aria-label="Xuống">↓</button>`;
    r.querySelector('input[type=text]').oninput=e=>{s.text=e.target.value;change()};
    r.querySelector('input[type=checkbox]').onchange=e=>{s.show=e.target.checked;change()};
    r.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const j=i+ +b.dataset.m,[x]=D.slogans.splice(i,1);D.slogans.splice(j,0,x);change();drawCfg()});
    box.appendChild(r)});
  [['img-hero','heroImage'],['img-cta','ctaImage']].forEach(([id,k])=>{const el=$(id);el.value=D[k]||'';el.classList.toggle('bad',!!D[k]&&!P.validUrl(D[k]));el.oninput=()=>{D[k]=el.value.trim();el.classList.toggle('bad',!!D[k]&&!P.validUrl(D[k]));change()}});
  paintInbox()}
$('c-on').onchange=e=>{D.enabled=e.target.checked;change();toast(D.enabled?'Khu vực sẽ hiện khi có feedback đã xuất bản.':'Khu vực sẽ ẩn trên trang chủ sau khi Publish.')};
$('c-layout').onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;D.layout=b.dataset.v;change();drawCfg()};
$('c-init').onchange=e=>{D.initial=+e.target.value;change()};
$('say-every').onchange=e=>{D.sloganEvery=+e.target.value;change()};
async function paintInbox(){const el=$('inbox-st');let f=null;
  try{const d=JSON.parse(localStorage.getItem('nowcms.social.draft'));f=d&&(d.fields||d)}catch(e){}
  if(!f){try{const r=await fetch(SOC,{cache:'no-store'});if(r.ok){const j=await r.json();f=j.fields||j}}catch(e){}}
  const u=f?String(f.inbox||'').trim():'',ok=u&&SO&&SO.valid('inbox',u);
  el.className='inbox-st'+(ok?'':' bad');
  el.innerHTML=ok?'Đang mở: <code>'+esc(u)+'</code>':u?'URL Inbox chưa hợp lệ — nút đang ẩn trên trang chủ.':'Chưa có URL Inbox — nút đang ẩn trên trang chủ.'}

/* ── nháp / xuất / publish ── */
function saveDraft(){localStorage.setItem(KEY,JSON.stringify({fields:D}));dirty=false;paintState()}
$('save').onclick=()=>{saveDraft();toast('Đã lưu nháp. Khách chưa thấy cho tới khi Publish.');if(window.NOWPUBLISH)NOWPUBLISH.rescan()};
$('discard').onclick=async()=>{
  if(!await ask('Bỏ nháp?','<p>Mọi thay đổi chưa Publish sẽ mất, CMS trở về nội dung đang chạy trên website. Ảnh đã tải lên vẫn nằm trong kho.</p>','Bỏ nháp',true))return;
  localStorage.removeItem(KEY);D=clone(published);dirty=false;SEL.clear();toList();paintState();push();
  if(window.NOWPUBLISH)NOWPUBLISH.rescan();toast('Đã trở về bản đang chạy.')};
$('export').onclick=()=>{const out=NOWPUBLISH.sections.proofs.build(clone({fields:D}));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
  a.download='feedback-proofs.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Đã tải feedback-proofs.json về máy (bản sao lưu).')};
function beforePublish(files){
  const mine=files.some(f=>f.section==='proofs'),errs=mine?problems():[];
  if(errs.length){modal(`<h3>Chưa Publish được</h3><p>Feedback khách hàng còn ${errs.length} lỗi:</p><ol>${errs.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="m-acts"><button type="button" class="solid" id="m-fix">Để mình sửa</button></div>`);$('m-fix').onclick=closeModal;return false}
  const on=D.items.filter(P.isPublic).length;
  return ask('Publish lên website?',`<p>Các file sau sẽ được cập nhật:</p><ul>${files.map(f=>`<li><code>/${esc(f.path)}</code> — ${esc(f.label)}</li>`).join('')}</ul>`+
    (mine?`<p style="margin-top:12px">${!D.enabled?'Khu vực Feedback ảnh trên trang chủ đang <b>tắt</b>.':on?'Trang chủ sẽ hiển thị <b>'+on+' feedback ảnh</b>.':'Chưa có feedback nào xuất bản — khu vực sẽ ẩn trên trang chủ.'}</p>`:''),'Publish ngay').then(ok=>{if(ok&&dirty)saveDraft();return ok})}

function normItem(x){return{_id:String(x._id||uid()),src:String(x.src||''),thumb:String(x.thumb||''),w:+x.w||0,h:+x.h||0,title:String(x.title||''),note:String(x.note||''),
  category:P.catBy(x.category)?x.category:'',source:P.srcBy(x.source)?x.source:'',status:P.statuses.includes(x.status)?x.status:'draft',consent:x.consent===true,createdAt:x.createdAt||now(),updatedAt:x.updatedAt||x.createdAt||now()}}
function normalize(f){f=f||{};
  const sl=Array.isArray(f.slogans)?f.slogans.slice(0,4).map(s=>({text:String((s&&s.text)||''),show:!!s&&s.show!==false})):P.defaultSlogans.map(t=>({text:t,show:true}));
  while(sl.length<4)sl.push({text:'',show:false});
  return{heroImage:String(f.heroImage||''),ctaImage:String(f.ctaImage||''),enabled:f.enabled!==false,layout:P.layouts.includes(f.layout)?f.layout:'gallery',initial:P.initials.includes(+f.initial)?+f.initial:8,
    sloganEvery:P.sloganEverys.includes(+f.sloganEvery)?+f.sloganEvery:8,slogans:sl,items:(Array.isArray(f.items)?f.items:[]).filter(x=>x&&x.src).map(normItem)}}

(async function boot(){
  try{const r=await fetch(SRC,{cache:'no-store'});if(r.ok){const j=await r.json();published=normalize(j.fields||j)}}catch(e){}
  if(!published)published=normalize({});
  let draft=null;try{draft=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  D=draft&&draft.fields?normalize(draft.fields):clone(published);
  $('f-cat').innerHTML=catOpts('all',true);$('a-cat').innerHTML=catOpts('after-delivery');$('a-src').innerHTML=srcOpts('messenger');
  buildRail();drawList();paintState();push();
  NOWPUBLISH.init({section:'proofs',getDoc:()=>({fields:D}),beforePublish,
    onSaved:()=>{saveDraft();published=clone(D);toast('Đã Publish. Trang chủ cập nhật sau khoảng 1 phút.')}});
})();
})();
