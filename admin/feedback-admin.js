/* NOW·STUDIO — admin/feedback.html · Feedback / Testimonials
   Nháp: localStorage 'nowcms.feedback.draft' → {fields:{items}}
   Chính thức: content/feedback.json → Publish qua NOWPUBLISH (/api/publish → GitHub → Cloudflare)
   Một bản ghi dùng cho: thanh mini dưới Hero, section Feedback trang chủ, trang /feedback (?id=slug). */
(function(){
const KEY='nowcms.feedback.draft', SRC='../content/feedback.json';
const S=window.NOWCMS_SCHEMA, IL=window.NOW_ILLUS, TYPES=window.NOW_SERVICE_TYPES;
const $=id=>document.getElementById(id);
const pv=$('pv');
let D=null, published=null, pubSlugs={}, dirty=false, cur=-1, target='home';

const clone=o=>JSON.parse(JSON.stringify(o));
const now=()=>new Date().toISOString();
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const uid=()=>'fb-'+Math.random().toString(36).slice(2,8);
const slugify=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const svc=v=>(TYPES.find(t=>t.value===v)||{}).label||'';
const art=id=>id==='none'?'<span class="none">Không</span>':IL.svg(id||'together');
const nm=x=>String(x.displayName||x.couple||'').trim();
const yr=x=>/^\d{4}/.test(x.eventDate||'')?x.eventDate.slice(0,4):String(x.year||'');
const ST={draft:['Nháp','draft'],published:['Published','on'],hidden:['Đã ẩn','']};
const fmt=t=>{if(!t)return '—';const d=new Date(t);return isNaN(d)?'—':d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})};
function autoShort(x){let s=String(x.text||'').replace(/\s+/g,' ').trim();if(s.length<=130)return s;s=s.slice(0,130);const k=s.lastIndexOf(' ');return s.slice(0,k>80?k:130).replace(/[,.;:!?\s]+$/,'')+'…'}
const isPub=x=>x.status==='published'&&String(x.text||'').trim();

let tt;function toast(msg,bad){const t=$('toast');t.textContent=msg;t.className='toast on'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>t.className='toast'+(bad?' bad':''),2800)}
function modal(html){$('modal-body').innerHTML=html;$('mask').classList.add('on')}
function closeModal(){$('mask').classList.remove('on')}
$('mask').addEventListener('click',e=>{if(e.target===$('mask'))closeModal()});
function ask(title,body,okLabel,danger){
  return new Promise(res=>{
    modal(`<h3>${title}</h3>${body}<div class="m-acts"><button type="button" id="m-no">Huỷ</button><button type="button" class="${danger?'danger':'solid'}" id="m-ok">${okLabel}</button></div>`);
    $('m-no').onclick=()=>{closeModal();res(false)};
    $('m-ok').onclick=()=>{closeModal();res(true)};
  });
}

/* ── xem trước: Trang chủ / Trang Feedback, Desktop / Mobile ── */
const pvSrc=()=>target==='page'?'../feedback/index.html?cms=preview'+(cur>=0&&it().slug?'&id='+encodeURIComponent(it().slug):''):'../index.html?cms=preview';
let pt;function push(){clearTimeout(pt);pt=setTimeout(()=>{try{pv.contentWindow.postMessage({type:'nowcms:draft',section:'feedback',data:{fields:D}},'*');setTimeout(showCur,80)}catch(e){}},150)}
function showCur(){if(cur<0||!isPub(it()))return;try{const F=pv.contentWindow.NOWFEEDBACK;if(F)F.goId(it().slug)}catch(e){}}
function jump(){
  if(target==='page')return;
  try{const d=pv.contentDocument,sec=d.getElementById('testimonial');if(!sec||sec.style.display==='none')return;
    pv.contentWindow.scrollTo({top:sec.getBoundingClientRect().top+pv.contentWindow.scrollY-72,behavior:'smooth'});}catch(e){}
}
function setDevice(m){$('stage').className='pv-stage '+(m?'mob':'desk');$('bm').classList.toggle('on',m);$('bd').classList.toggle('on',!m);setTimeout(jump,120)}
function setTarget(t){target=t;$('tg-home').classList.toggle('on',t==='home');$('tg-page').classList.toggle('on',t==='page');$('jump').style.display=t==='page'?'none':'';pv.src=pvSrc()}
$('bd').onclick=()=>setDevice(false);
$('bm').onclick=()=>setDevice(true);
$('tg-home').onclick=()=>setTarget('home');
$('tg-page').onclick=()=>setTarget('page');
$('jump').onclick=jump;
$('reload').onclick=()=>{pv.src=pvSrc()};
pv.addEventListener('load',()=>{push();setTimeout(()=>{if(cur>=0)jump();showCur()},500)});

/* ── trạng thái lưu ── */
function paintState(){
  const el=$('state');
  if(dirty){el.className='state dirty';el.textContent='Nháp chưa lưu'}
  else if(localStorage.getItem(KEY)){el.className='state saved';el.textContent='Đã lưu nháp'}
  else{el.className='state';el.textContent='Trùng bản đang chạy'}
  $('discard').disabled=!dirty&&!localStorage.getItem(KEY);
}
function change(touch){dirty=true;if(touch&&touch.updatedAt!==undefined)touch.updatedAt=now();paintState();push();if(cur>=0){validateItem();paintStamp()}}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

function buildRail(){
  const soon=['About','Contact'];
  $('rail').innerHTML='<div class="rail-t">Section</div>'+
    Object.keys(S.sections).map(k=>{const s=S.sections[k];const href=s.admin||(k==='hero'?'hero.html':'#');
      return `<a href="${href}" class="${k==='feedback'?'on':''}"><i>${s.icon||'▣'}</i>${s.title}</a>`}).join('')+
    soon.map(n=>`<span class="off"><i>▢</i>${n}<span class="soon">sắp có</span></span>`).join('');
}

/* ── DANH SÁCH + lọc ── */
$('f-svc').innerHTML='<option value="">Mọi dịch vụ</option>'+TYPES.map(t=>`<option value="${t.value}">${t.label}</option>`).join('');
['f-q','f-svc','f-st'].forEach(id=>$(id).addEventListener('input',drawList));
function filtered(){
  const q=slugify($('f-q').value).replace(/-/g,' '),s=$('f-svc').value,st=$('f-st').value;
  return D.items.map((x,i)=>({x,i})).filter(({x})=>(!s||x.service===s)&&(!st||x.status===st)&&(!q||slugify([x.couple,x.displayName,x.text,x.location,x.label].join(' ')).replace(/-/g,' ').includes(q)));
}
function drawList(){
  const box=$('list');box.innerHTML='';
  const f=filtered(),fil=f.length!==D.items.length||$('f-q').value||$('f-svc').value||$('f-st').value;
  if(!f.length){box.innerHTML=`<div class="empty-f">${D.items.length?'Không có feedback nào khớp bộ lọc.':'Chưa có feedback nào. Bấm “+ Thêm feedback”.'}</div>`}
  f.forEach(({x:it,i})=>{
    const st=ST[it.status]||ST.draft,probs=problems(it,i);
    const r=document.createElement('div');r.className='svc fb'+(it.status==='published'?'':' off');
    r.innerHTML=`<div class="fb-art">${art(it.illustration)}</div>
      <div style="min-width:0"><div class="fb-n">${esc(nm(it)||'(chưa có tên)')}</div>
      <div class="fb-svc">${esc([svc(it.service),yr(it)].filter(Boolean).join(' · ')||'—')}</div>
      <div class="fb-q">${esc(it.text||'Chưa có nội dung')}</div>
      <div class="svc-meta"><span class="pill ${st[1]}">${st[0]}</span>${it.homepage!==false?'<span class="pill home">Trang chủ</span>':''}${probs.length?`<span class="pill bad">${probs.length} lỗi</span>`:''}</div></div>
      <div class="fb-no" title="Thứ tự hiển thị">${i+1}</div>
      <div class="svc-acts">
        <button type="button" class="mini" data-a="up" ${i===0||fil?'disabled':''} title="Lên">↑</button>
        <button type="button" class="mini" data-a="down" ${i===D.items.length-1||fil?'disabled':''} title="Xuống">↓</button>
        <button type="button" class="mini" data-a="vis">${it.status==='published'?'Ẩn':'Publish'}</button>
        <span class="sp"></span>
        <button type="button" class="mini" data-a="del">Xoá</button>
        <button type="button" class="mini" data-a="pv" ${isPub(it)?'':'disabled'}>Xem trước</button>
        <button type="button" class="mini" data-a="edit">Sửa</button>
      </div>`;
    r.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.a;
      if(a==='up'||a==='down'){const j=a==='up'?i-1:i+1;[D.items[i],D.items[j]]=[D.items[j],D.items[i]];drawList();change()}
      else if(a==='vis'){const was=it.status==='published';it.status=was?'hidden':'published';change(it);drawList();toast(was?'Đã ẩn — bấm Lưu nháp hoặc Publish để áp dụng.':'Đã chuyển sang Published (trong nháp).')}
      else if(a==='del')del(i);
      else if(a==='pv'){cur=-1;const F=()=>{try{pv.contentWindow.NOWFEEDBACK.goId(it.slug)}catch(e){}};if(target==='page'){pv.src='../feedback/index.html?cms=preview&id='+encodeURIComponent(it.slug)}else{jump();F()}}
      else openEdit(i);
    });
    box.appendChild(r);
  });
  const p=D.items.filter(x=>x.status==='published').length,h=D.items.filter(x=>x.status==='published'&&x.homepage!==false).length;
  $('count').textContent=p+' published · '+h+' trang chủ · '+D.items.length+' tổng';
}
$('add').onclick=()=>{
  const t=now();
  D.items.push({_id:uid(),slug:'',status:'draft',homepage:true,couple:'',displayName:'',service:'wedding',eventDate:'',year:'',location:'',label:'',text:'',short:'',illustration:IL.ids[D.items.length%IL.ids.length],createdAt:t,updatedAt:t});
  ['f-q','f-svc','f-st'].forEach(id=>$(id).value='');
  change();openEdit(D.items.length-1);
  toast('Feedback mới ở trạng thái Nháp — chuyển sang Published khi đã nhập xong.');
};
async function del(i){
  const x=D.items[i];
  if(!await ask('Xoá feedback của “'+esc(nm(x)||'khách')+'”?','<p>Feedback sẽ biến mất khỏi trang chủ và trang Feedback sau lần Publish tới, link cũ tới feedback này sẽ mở feedback đầu tiên. Nếu chỉ muốn tạm giấu, hãy chọn <b>Ẩn</b>.</p>','Xoá feedback',true))return;
  D.items.splice(i,1);if(cur===i)cur=-1;change();closeEdit();toast('Đã xoá. Bấm “Bỏ nháp” nếu muốn lấy lại.');
}

/* ── FORM ── */
const it=()=>D.items[cur];
function openEdit(i){
  cur=i;const x=it();
  $('v-list').classList.remove('on');$('v-edit').classList.add('on');
  $('e-head').textContent=nm(x)||'Feedback mới';
  $('e-couple').value=x.couple||'';$('e-display').value=x.displayName||'';$('e-date').value=x.eventDate||'';$('e-loc').value=x.location||'';
  $('e-label').value=x.label||'';$('e-text').value=x.text||'';$('e-short').value=x.short||'';$('e-slug').value=x.slug||'';
  $('e-slug').dataset.touched=x.slug?'1':'';
  $('e-home').checked=x.homepage!==false;
  $('e-display').placeholder=x.couple?'Để trống = “'+x.couple+'”':'Để trống = dùng tên cặp đôi';
  $('e-service').innerHTML=TYPES.map(t=>`<option value="${t.value}">${t.label}</option>`).join('');$('e-service').value=x.service||'wedding';
  $('e-order').innerHTML=D.items.map((_,k)=>`<option value="${k}">${k+1}</option>`).join('');$('e-order').value=i;
  $('e-illus').innerHTML=IL.ids.concat('none').map(k=>`<button type="button" data-k="${k}" class="${(x.illustration||'together')===k?'on':''}"><span class="th${k==='none'?' none':''}">${k==='none'?'—':IL.svg(k)}</span><span class="cap">${IL.label(k)}</span></button>`).join('');
  $('e-illus').querySelectorAll('button').forEach(b=>b.onclick=()=>{x.illustration=b.dataset.k;$('e-illus').querySelectorAll('button').forEach(y=>y.classList.toggle('on',y===b));change(x)});
  paintStatus();counts();validateItem();paintStamp();
  window.scrollTo(0,0);
  if(target==='page')pv.src=pvSrc();else setTimeout(()=>{jump();showCur()},80);
}
function closeEdit(){cur=-1;$('v-edit').classList.remove('on');$('v-list').classList.add('on');drawList()}
function paintStatus(){$('e-status').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===(it().status||'draft')))}
function paintStamp(){const x=it();$('e-stamp').innerHTML=`<span>Tạo: <b>${fmt(x.createdAt)}</b></span><span>Sửa: <b>${fmt(x.updatedAt)}</b></span>`;
  $('e-link').innerHTML=x.slug?'Link: <code>/feedback?id='+esc(x.slug)+'</code>'+(pubSlugs[x._id]&&pubSlugs[x._id]!==x.slug?' — <span style="color:var(--warn)">đổi mã sẽ làm hỏng link cũ <code>'+esc(pubSlugs[x._id])+'</code></span>':''):'Link tạo tự động từ tên.'}
function counts(){const n=words($('e-text').value),el=$('e-text-n');el.textContent=n+' chữ';el.style.color=n>90?'var(--warn)':'';
  const s=$('e-short').value.length;$('e-short-n').textContent=s?s+'/180':'';
  const box=$('e-short-auto');box.style.display=$('e-short').value.trim()?'none':'';box.querySelector('span').textContent=autoShort(it())||'—'}
function autoSlug(){const x=it();if($('e-slug').dataset.touched||pubSlugs[x._id])return;x.slug=uniq(slugify(x.couple));$('e-slug').value=x.slug}
function uniq(s,skip){if(!s)return '';let o=s,k=2;while(D.items.some((y,i)=>i!==(skip==null?cur:skip)&&y.slug===o))o=s+'-'+k++;return o}
function bindText(id,key,after){$(id).oninput=e=>{const x=it();x[key]=e.target.value;if(after)after(x);change(x)}}
bindText('e-couple','couple',x=>{$('e-head').textContent=nm(x)||'Feedback mới';$('e-display').placeholder=x.couple?'Để trống = “'+x.couple+'”':'Để trống = dùng tên cặp đôi';autoSlug()});
bindText('e-display','displayName',x=>{$('e-head').textContent=nm(x)||'Feedback mới'});
bindText('e-loc','location');bindText('e-label','label');
bindText('e-text','text',counts);bindText('e-short','short',counts);
$('e-date').onchange=e=>{const x=it();x.eventDate=e.target.value;if(x.eventDate)x.year=x.eventDate.slice(0,4);change(x)};
$('e-service').onchange=e=>{const x=it();x.service=e.target.value;change(x)};
$('e-home').onchange=e=>{const x=it();x.homepage=e.target.checked;change(x)};
$('e-slug').oninput=e=>{e.target.dataset.touched='1';const x=it();x.slug=e.target.value;change(x)};
$('e-slug').onblur=e=>{const x=it();x.slug=slugify(x.slug)||uniq(slugify(x.couple));e.target.value=x.slug;change(x)};
$('e-status').querySelectorAll('button').forEach(b=>b.onclick=()=>{const x=it();x.status=b.dataset.v;paintStatus();change(x)});
$('e-order').onchange=e=>{const j=+e.target.value;const x=D.items.splice(cur,1)[0];D.items.splice(j,0,x);cur=j;change();toast('Đã chuyển sang vị trí '+(j+1)+'.')};
$('back').onclick=closeEdit;
$('e-done').onclick=()=>{const p=problems(it(),cur);if(p.length)toast('Còn '+p.length+' lỗi — vẫn giữ trong nháp, sửa trước khi Publish.',true);closeEdit()};
$('e-preview').onclick=()=>{if(!isPub(it())){toast('Feedback chưa Published nên chưa có trên website. Chuyển trạng thái để xem thử.',true);return}if(target==='page')pv.src=pvSrc();else{jump();showCur()}};
$('e-dup').onclick=()=>{
  const x=clone(it()),t=now();x._id=uid();x.status='draft';x.slug=uniq((x.slug||slugify(x.couple)||'feedback')+'-ban-sao',-1);x.createdAt=t;x.updatedAt=t;
  D.items.splice(cur+1,0,x);change();openEdit(cur+1);toast('Đã nhân bản thành Nháp mới.');
};
$('e-del').onclick=()=>del(cur);

/* ── kiểm tra ── */
function problems(x,i){
  const p=[];
  if(!String(x.couple||'').trim())p.push('Chưa có tên cặp đôi / khách hàng.');
  if(!String(x.text||'').trim())p.push('Chưa có lời nhận xét.');
  const s=String(x.slug||'').trim();
  if(!s)p.push('Chưa có mã định danh.');
  else if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))p.push('Mã định danh chỉ gồm chữ thường không dấu, số, gạch ngang.');
  else if(D.items.some((y,k)=>k!==i&&y.slug===s))p.push('Mã định danh trùng với feedback khác.');
  return p;
}
function validateItem(){
  const p=problems(it(),cur),box=$('e-warn');
  $('e-couple').classList.toggle('bad',!String(it().couple||'').trim());
  $('e-text').classList.toggle('bad',!String(it().text||'').trim());
  $('e-slug').classList.toggle('bad',p.some(x=>/định danh/.test(x)));
  box.style.display=p.length?'block':'none';
  box.querySelector('ul').innerHTML=p.map(x=>`<li>${x}</li>`).join('');
}
function allProblems(){
  const out=[];
  D.items.forEach((x,i)=>{if(x.status==='published')problems(x,i).forEach(p=>out.push((nm(x)||'Feedback #'+(i+1))+': '+p));
    else if(D.items.some((y,k)=>k!==i&&y.slug&&y.slug===x.slug))out.push((nm(x)||'Feedback #'+(i+1))+': Mã định danh trùng.')});
  return out;
}

/* ── lưu / bỏ / xuất ── */
function saveDraft(){localStorage.setItem(KEY,JSON.stringify({fields:D}));dirty=false;paintState()}
$('save').onclick=()=>{saveDraft();toast('Đã lưu nháp. Khách chưa thấy cho tới khi Publish.');if(window.NOWPUBLISH)NOWPUBLISH.rescan()};
$('discard').onclick=async()=>{
  if(!await ask('Bỏ nháp?','<p>Mọi thay đổi chưa Publish sẽ mất, CMS trở về nội dung đang chạy trên website.</p>','Bỏ nháp',true))return;
  localStorage.removeItem(KEY);D=clone(published);dirty=false;cur=-1;closeEdit();paintState();push();
  if(window.NOWPUBLISH)NOWPUBLISH.rescan();toast('Đã trở về bản đang chạy.');
};
$('export').onclick=()=>{
  const out=NOWPUBLISH.sections.feedback.build(clone({fields:D}));
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
  a.download='feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('Đã tải feedback.json về máy (bản sao lưu).');
};

function beforePublish(files){
  const mine=files.some(f=>f.section==='feedback');
  const errs=mine?allProblems():[];
  if(errs.length){
    modal(`<h3>Chưa Publish được</h3><p>Feedback còn ${errs.length} lỗi:</p><ol>${errs.slice(0,10).map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="m-acts"><button type="button" class="solid" id="m-fix">Để mình sửa</button></div>`);
    $('m-fix').onclick=closeModal;return false;
  }
  const pub=D.items.filter(isPub),home=pub.filter(x=>x.homepage!==false);
  return ask('Publish lên website?',
    `<p>Các file sau sẽ được cập nhật:</p><ul>${files.map(f=>`<li><code>/${esc(f.path)}</code> — ${esc(f.label)}</li>`).join('')}</ul>`+
    (mine?`<p style="margin-top:12px">${pub.length?'<b>Trang Feedback</b> ('+pub.length+'): '+pub.map(x=>esc(nm(x))).join(' · ')+'<br><b>Thanh trang chủ</b> ('+home.length+'): '+(home.map(x=>esc(nm(x))).join(' · ')||'— ẩn thanh'):'<b>Không có feedback nào Published — section Feedback và thanh trang chủ sẽ ẩn.</b>'}</p>`:''),
    'Publish ngay').then(ok=>{if(ok&&dirty)saveDraft();return ok});
}

function migrate(items,rev){
  items.forEach(x=>{
    x._id=x._id||uid();
    if(!x.couple&&x.author){const p=x.author.split('—');x.couple=p[0].trim();if(!x.label&&p[1])x.label=p.slice(1).join('—').trim()}
    if(!x.status)x.status='published';
    if(x.homepage==null)x.homepage=true;
    if(!x.service)x.service='wedding';
    ['displayName','eventDate','year','location','label','short'].forEach(k=>{if(x[k]==null)x[k]=''});
    if(!x.illustration)x.illustration='together';
    if(!x.createdAt)x.createdAt=rev||now();
    if(!x.updatedAt)x.updatedAt=x.createdAt;
  });
  items.forEach((x,i)=>{if(!x.slug)x.slug=uniq(slugify(String(x._id).replace(/^fb-/,''))||slugify(x.couple)||'feedback',i)});
  return items;
}

(async function boot(){
  let rev='';
  try{const r=await fetch(SRC,{cache:'no-store'});if(r.ok){const j=await r.json();rev=j._rev||j.updatedAt||'';published=j.fields||j}}catch(e){}
  if(!published||!Array.isArray(published.items))published={items:[]};
  D=published;migrate(D.items,rev);published=clone(D);
  published.items.forEach(x=>pubSlugs[x._id]=x.slug);
  let draft=null;try{draft=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(draft&&draft.fields&&Array.isArray(draft.fields.items)){D=clone(draft.fields);migrate(D.items,rev)}else D=clone(published);
  buildRail();drawList();paintState();push();
  NOWPUBLISH.init({section:'feedback',getDoc:()=>({fields:D}),beforePublish,
    onSaved:()=>{saveDraft();published=clone(D);published.items.forEach(x=>pubSlugs[x._id]=x.slug);toast('Đã Publish. Website cập nhật sau khoảng 1 phút.')}});
})();
})();
