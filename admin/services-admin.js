/* NOW·STUDIO — admin/services.html (cùng pattern với gallery.html)
   Nháp: localStorage 'nowcms.services.draft' → {fields}
   Chính thức: content/services.json → publish qua NOWPUBLISH (/api/publish) */
(function(){
const KEY='nowcms.services.draft', SRC='../content/services.json';
const S=window.NOWCMS_SCHEMA, SV=window.NOWSERVICES;
const $=id=>document.getElementById(id);
const pv=$('pv');
let D=null, published=null, dirty=false, cur=-1;

const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const uid=()=>'svc-'+Math.random().toString(36).slice(2,8);
const slugify=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const icon=k=>`<svg viewBox="0 0 48 48" fill="none">${SV.icons[k]||SV.icons.camera}</svg>`;
const words=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;

/* ── toast / modal ── */
let tt;function toast(msg,bad){const t=$('toast');t.textContent=msg;t.className='toast on'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>t.className='toast'+(bad?' bad':''),2600)}
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

/* ── xem trước ── */
let pt;function push(){clearTimeout(pt);pt=setTimeout(()=>{try{pv.contentWindow.postMessage({type:'nowcms:draft',section:'services',data:{fields:D}},'*')}catch(e){}},150)}
function jump(slug){
  try{
    const d=pv.contentDocument, sec=d.getElementById('services');if(!sec)return;
    let el=sec;
    if(slug){const c=d.querySelector('[data-svc="'+slug+'"]');if(c&&c.offsetParent)el=c}
    let y=0,n=el;while(n){y+=n.offsetTop;n=n.offsetParent}
    pv.contentWindow.scrollTo({top:Math.max(0,y-(el===sec?0:60)),behavior:'smooth'});
  }catch(e){}
}
function setDevice(m){$('stage').className='pv-stage '+(m?'mob':'desk');$('bm').classList.toggle('on',m);$('bd').classList.toggle('on',!m);setTimeout(()=>jump(cur>=0?D.items[cur]._id:''),120)}
$('bd').onclick=()=>setDevice(false);
$('bm').onclick=()=>setDevice(true);
$('jump').onclick=()=>jump('');
$('reload').onclick=()=>{pv.src=pv.src};
pv.addEventListener('load',()=>{push();setTimeout(()=>jump(cur>=0?D.items[cur]._id:''),500)});

/* ── trạng thái ── */
function paintState(){
  const el=$('state');
  if(dirty){el.className='state dirty';el.textContent='Nháp chưa lưu'}
  else if(localStorage.getItem(KEY)){el.className='state saved';el.textContent='Đã lưu nháp'}
  else{el.className='state';el.textContent='Trùng bản đang chạy'}
  $('discard').disabled=!dirty&&!localStorage.getItem(KEY);
}
function change(){dirty=true;paintState();push();if(cur>=0)validateItem()}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

/* ── rail (giống gallery) ── */
function buildRail(){
  const soon=['About','Contact'];
  $('rail').innerHTML='<div class="rail-t">Section</div>'+
    Object.keys(S.sections).map(k=>{const s=S.sections[k];const href=s.admin||(k==='hero'?'hero.html':'#');
      return `<a href="${href}" class="${k==='services'?'on':''}"><i>${s.icon||'▣'}</i>${s.title}</a>`}).join('')+
    soon.map(n=>`<span class="off"><i>▢</i>${n}<span class="soon">sắp có</span></span>`).join('');
}

/* ── DANH SÁCH ── */
function drawList(){
  const box=$('list');box.innerHTML='';
  let no=0;
  D.items.forEach((it,i)=>{
    const on=it.status!=='hidden';if(on)no++;
    const probs=problems(it,i);
    const r=document.createElement('div');r.className='svc'+(on?'':' off');
    const devs=it.showDesktop===false&&it.showMobile===false?'<span class="pill bad">Không thiết bị nào</span>':
      it.showDesktop===false?'<span class="pill">Chỉ điện thoại</span>':it.showMobile===false?'<span class="pill">Chỉ máy tính</span>':'';
    r.innerHTML=`<div class="svc-ic">${icon(it.icon)}</div>
      <div style="min-width:0"><div class="svc-top"><span class="svc-no">${on?String(no).padStart(2,'0'):'—'}</span><span class="svc-n">${esc(it.name||'(chưa đặt tên)')}</span></div>
      <div class="svc-meta"><span class="pill ${on?'on':''}">${on?'Đang hiển thị':'Đã ẩn'}</span>${devs}${probs.length?`<span class="pill bad">${probs.length} lỗi</span>`:''}</div></div>
      <div class="svc-acts">
        <button type="button" class="mini" data-a="up" ${i===0?'disabled':''} title="Lên">↑</button>
        <button type="button" class="mini" data-a="down" ${i===D.items.length-1?'disabled':''} title="Xuống">↓</button>
        <button type="button" class="mini" data-a="vis">${on?'Ẩn':'Hiện'}</button>
        <span class="sp"></span>
        <button type="button" class="mini" data-a="pv" ${on?'':'disabled'}>Xem trước</button>
        <button type="button" class="mini" data-a="edit">Sửa</button>
      </div>`;
    r.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.a;
      if(a==='up'||a==='down'){const j=a==='up'?i-1:i+1;[D.items[i],D.items[j]]=[D.items[j],D.items[i]];drawList();change()}
      else if(a==='vis'){it.status=on?'hidden':'published';drawList();change();toast(on?'Đã ẩn “'+it.name+'” — bấm Lưu nháp để giữ.':'Đã hiện lại “'+it.name+'”.')}
      else if(a==='pv')jump(it._id);
      else openEdit(i);
    });
    box.appendChild(r);
  });
  const n=D.items.filter(x=>x.status!=='hidden').length;
  $('count').textContent=n+' / '+D.items.length+' đang hiện';
}
$('add').onclick=()=>{
  D.items.push({_id:uid(),slug:'',name:'',title:'',icon:'camera',status:'hidden',showDesktop:true,showMobile:true,description:'',note:''});
  change();openEdit(D.items.length-1);
  toast('Dịch vụ mới đang ở trạng thái Ẩn — bật “Đang hiển thị” khi đã viết xong.');
};
$('h-label').oninput=e=>{D.label=e.target.value;change()};
$('h-title').oninput=e=>{D.title=e.target.value;change()};

/* ── FORM SỬA ── */
function openEdit(i){
  cur=i;const it=D.items[i];
  $('v-list').classList.remove('on');$('v-edit').classList.add('on');
  $('e-head').textContent=it.name||'Dịch vụ mới';
  $('e-name').value=it.name||'';$('e-slug').value=it.slug||'';
  $('e-title').value=it.title&&it.title!==it.name?it.title:'';
  $('e-desc').value=it.description||'';$('e-note').value=it.note||'';
  $('e-desk').checked=it.showDesktop!==false;$('e-mob').checked=it.showMobile!==false;
  $('e-order').innerHTML=D.items.map((_,k)=>`<option value="${k}">${k+1}</option>`).join('');$('e-order').value=i;
  $('e-icons').innerHTML=Object.keys(SV.icons).map(k=>`<button type="button" data-k="${k}" class="${it.icon===k?'on':''}">${icon(k)}${SV.iconLabels[k]||k}</button>`).join('');
  $('e-icons').querySelectorAll('button').forEach(b=>b.onclick=()=>{it.icon=b.dataset.k;$('e-icons').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));change()});
  paintStatus();descCount();validateItem();
  window.scrollTo(0,0);setTimeout(()=>jump(it._id),80);
}
function closeEdit(){cur=-1;$('v-edit').classList.remove('on');$('v-list').classList.add('on');drawList();jump('')}
function paintStatus(){const it=D.items[cur];$('e-status').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===(it.status==='hidden'?'hidden':'published')))}
function descCount(){const n=words($('e-desc').value);const el=$('e-desc-n');el.textContent=n+' chữ';el.style.color=n>55?'var(--warn)':''}
const it=()=>D.items[cur];
$('e-name').oninput=e=>{const x=it(),old=x.name;x.name=e.target.value;
  if(!x.title||x.title===old)x.title=x.name;
  if(!$('e-slug').dataset.touched&&(!x.slug||x.slug===slugify(old))){x.slug=slugify(x.name);$('e-slug').value=x.slug}
  $('e-head').textContent=x.name||'Dịch vụ mới';change()};
$('e-slug').oninput=e=>{e.target.dataset.touched='1';it().slug=e.target.value;change()};
$('e-slug').onblur=e=>{const x=it();x.slug=slugify(x.slug||x.name);e.target.value=x.slug;change()};
$('e-title').oninput=e=>{it().title=e.target.value.trim()?e.target.value:it().name;change()};
$('e-desc').oninput=e=>{it().description=e.target.value;descCount();change()};
$('e-note').oninput=e=>{it().note=e.target.value;change()};
$('e-desk').onchange=e=>{it().showDesktop=e.target.checked;change()};
$('e-mob').onchange=e=>{it().showMobile=e.target.checked;change()};
$('e-status').querySelectorAll('button').forEach(b=>b.onclick=()=>{it().status=b.dataset.v;paintStatus();change()});
$('e-order').onchange=e=>{const j=+e.target.value;const x=D.items.splice(cur,1)[0];D.items.splice(j,0,x);cur=j;change();toast('Đã chuyển sang vị trí '+(j+1)+'.')};
$('back').onclick=closeEdit;
$('e-done').onclick=()=>{const p=problems(it(),cur);if(p.length)toast('Còn '+p.length+' lỗi — vẫn giữ trong nháp, sửa trước khi Publish.',true);closeEdit()};
$('e-preview').onclick=()=>{if(it().status==='hidden')toast('Dịch vụ đang Ẩn nên không có trên website.',true);else jump(it()._id)};
$('e-del').onclick=async()=>{
  const x=it();
  const ok=await ask('Xoá “'+esc(x.name||'dịch vụ này')+'”?','<p>Dịch vụ sẽ biến mất khỏi danh sách và website sau lần Publish tới. Nếu chỉ muốn tạm giấu, hãy chọn <b>Ẩn</b> thay vì xoá.</p>','Xoá dịch vụ',true);
  if(!ok)return;
  D.items.splice(cur,1);cur=-1;change();closeEdit();toast('Đã xoá. Bấm “Bỏ nháp” nếu muốn lấy lại.');
};

/* ── kiểm tra ── */
function problems(x,i){
  const p=[];
  if(!String(x.name||'').trim())p.push('Chưa có tên dịch vụ.');
  if(!String(x.description||'').trim())p.push('Chưa có mô tả.');
  const s=String(x.slug||'').trim();
  if(!s)p.push('Chưa có mã định danh.');
  else if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))p.push('Mã định danh chỉ gồm chữ thường không dấu, số, gạch ngang.');
  else if(D.items.some((y,k)=>k!==i&&y.slug===s))p.push('Mã định danh trùng với dịch vụ khác.');
  if(x.status!=='hidden'&&x.showDesktop===false&&x.showMobile===false)p.push('Đang hiển thị nhưng tắt cả máy tính lẫn điện thoại.');
  return p;
}
function validateItem(){
  const p=problems(it(),cur),box=$('e-warn');
  $('e-name').classList.toggle('bad',!String(it().name||'').trim());
  $('e-desc').classList.toggle('bad',!String(it().description||'').trim());
  $('e-slug').classList.toggle('bad',p.some(x=>/định danh/.test(x)));
  box.style.display=p.length?'block':'none';
  box.querySelector('ul').innerHTML=p.map(x=>`<li>${x}</li>`).join('');
}
function allProblems(){
  const out=[];
  D.items.forEach((x,i)=>problems(x,i).forEach(p=>out.push((x.name||'Dịch vụ #'+(i+1))+': '+p)));
  if(!D.items.some(x=>x.status!=='hidden'))out.push('Không có dịch vụ nào đang hiển thị — section sẽ bị ẩn khỏi website.');
  return out;
}

/* ── lưu / bỏ / xuất ── */
function saveDraft(){localStorage.setItem(KEY,JSON.stringify({fields:D}));dirty=false;paintState()}
$('save').onclick=()=>{saveDraft();toast('Đã lưu nháp. Khách chưa thấy cho tới khi Publish.');if(window.NOWPUBLISH)NOWPUBLISH.rescan()};
$('discard').onclick=async()=>{
  if(!await ask('Bỏ nháp?','<p>Mọi thay đổi chưa Publish sẽ mất, CMS trở về nội dung đang chạy trên website.</p>','Bỏ nháp',true))return;
  localStorage.removeItem(KEY);D=clone(published);dirty=false;cur=-1;fillAll();paintState();push();closeEdit();
  if(window.NOWPUBLISH)NOWPUBLISH.rescan();toast('Đã trở về bản đang chạy.');
};
$('export').onclick=()=>{
  const out=NOWPUBLISH.sections.services.build(clone({fields:D}));
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
  a.download='services.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('Đã tải services.json về máy (bản sao lưu).');
};

/* ── publish: xác nhận trước, chặn nếu có lỗi ── */
function beforePublish(files){
  const mine=files.some(f=>f.section==='services');
  const errs=mine?allProblems():[];
  if(errs.length){
    modal(`<h3>Chưa Publish được</h3><p>Section Dịch vụ còn ${errs.length} lỗi:</p><ol>${errs.slice(0,10).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
      <div class="m-acts"><button type="button" class="solid" id="m-fix">Để mình sửa</button></div>`);
    $('m-fix').onclick=closeModal;return false;
  }
  const vis=D.items.filter(x=>x.status!=='hidden').map(x=>esc(x.name));
  return ask('Publish lên website?',
    `<p>Các file sau sẽ được cập nhật trên website:</p><ul>${files.map(f=>`<li><code>/${esc(f.path)}</code> — ${esc(f.label)}</li>`).join('')}</ul>`+
    (mine?`<p style="margin-top:12px">Dịch vụ hiển thị, theo thứ tự: <b>${vis.join(' · ')}</b></p>`:''),
    'Publish ngay').then(ok=>{if(ok&&dirty)saveDraft();return ok});
}

function fillAll(){$('h-label').value=D.label||'';$('h-title').value=D.title||'';drawList()}

(async function boot(){
  try{const r=await fetch(SRC,{cache:'no-store'});if(r.ok){const j=await r.json();published=j.fields||j}}catch(e){}
  if(!published||!Array.isArray(published.items))published={label:'What We Do',title:'Dịch Vụ\nCủa Chúng Tôi',items:[
    {_id:'svc-photography',slug:'photography',name:'Photography',title:'Photography',icon:'camera',status:'published',showDesktop:true,showMobile:true,description:'',note:''},
    {_id:'svc-makeup',slug:'makeup',name:'Makeup',title:'Makeup',icon:'makeup',status:'published',showDesktop:true,showMobile:true,description:'',note:''}]};
  let draft=null;try{draft=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  D=clone(draft&&draft.fields&&Array.isArray(draft.fields.items)?draft.fields:published);
  D.items.forEach(x=>{x._id=x._id||uid();x.slug=x.slug||slugify(x.name)});
  buildRail();fillAll();paintState();push();
  NOWPUBLISH.init({section:'services',getDoc:()=>({fields:D}),beforePublish,
    onSaved:()=>{saveDraft();published=clone(D);toast('Đã Publish. Website cập nhật sau khoảng 1 phút.')}});
})();
})();
