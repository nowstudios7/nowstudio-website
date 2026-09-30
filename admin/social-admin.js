/* NOW·STUDIO — admin/social.html (cùng pattern với services.html)
   Nháp: localStorage 'nowcms.social.draft' → {fields}
   Chính thức: content/social.json → publish qua NOWPUBLISH (/api/publish) */
(function(){
const KEY='nowcms.social.draft', SRC='../content/social.json';
const S=window.NOWCMS_SCHEMA, SO=window.NOWSOCIAL;
const $=id=>document.getElementById(id);
const pv=$('pv');
let D=null, published=null, dirty=false;
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const DEF={label:'Kết nối với NOW Studio',items:SO.order.map(id=>({id,url:'',show:true}))};

let tt;function toast(msg,bad){const t=$('toast');t.textContent=msg;t.className='toast on'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>t.className='toast'+(bad?' bad':''),2600)}
function modal(html){$('modal-body').innerHTML=html;$('mask').classList.add('on')}
function closeModal(){$('mask').classList.remove('on')}
$('mask').addEventListener('click',e=>{if(e.target===$('mask'))closeModal()});
function ask(title,body,okLabel,danger){return new Promise(res=>{
  modal(`<h3>${title}</h3>${body}<div class="m-acts"><button type="button" id="m-no">Huỷ</button><button type="button" class="${danger?'danger':'solid'}" id="m-ok">${okLabel}</button></div>`);
  $('m-no').onclick=()=>{closeModal();res(false)};$('m-ok').onclick=()=>{closeModal();res(true)};
})}

let pt;function push(){clearTimeout(pt);pt=setTimeout(()=>{try{pv.contentWindow.postMessage({type:'nowcms:draft',section:'social',data:{fields:D}},'*')}catch(e){}},150)}
function jump(){try{const d=pv.contentDocument,el=d.querySelector('#contact [data-social]')||d.getElementById('contact');if(!el)return;
  const tgt=el.hidden?d.getElementById('contact'):el;let y=0,n=tgt;while(n){y+=n.offsetTop;n=n.offsetParent}
  pv.contentWindow.scrollTo({top:Math.max(0,y-(tgt===el?220:0)),behavior:'smooth'})}catch(e){}}
function setDevice(m){$('stage').className='pv-stage '+(m?'mob':'desk');$('bm').classList.toggle('on',m);$('bd').classList.toggle('on',!m);setTimeout(jump,120)}
$('bd').onclick=()=>setDevice(false);$('bm').onclick=()=>setDevice(true);
$('jump').onclick=jump;$('reload').onclick=()=>{pv.src=pv.src};
pv.addEventListener('load',()=>{push();setTimeout(jump,500)});

function paintState(){const el=$('state');
  if(dirty){el.className='state dirty';el.textContent='Nháp chưa lưu'}
  else if(localStorage.getItem(KEY)){el.className='state saved';el.textContent='Đã lưu nháp'}
  else{el.className='state';el.textContent='Trùng bản đang chạy'}
  $('discard').disabled=!dirty&&!localStorage.getItem(KEY)}
function change(){dirty=true;paintState();push();paintMeta()}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

function buildRail(){
  $('rail').innerHTML='<div class="rail-t">Section</div>'+Object.keys(S.sections).map(k=>{const s=S.sections[k];const href=s.admin||(k==='hero'?'hero.html':'#');
    return `<a href="${href}" class="${k==='social'?'on':''}"><i>${s.icon||'▣'}</i>${s.title}</a>`}).join('')+
    ['About'].map(n=>`<span class="off"><i>▢</i>${n}<span class="soon">sắp có</span></span>`).join('');
}

function stateOf(it){const u=String(it.url||'').trim();
  if(!u)return{k:'empty',t:'Chưa có link — hiện chữ, chưa bấm được'};
  if(!SO.valid(it.id,u))return{k:'bad',t:'Link chưa hợp lệ'};
  if(it.show===false)return{k:'off',t:'Đã tắt'};
  return{k:'on',t:'Đang hiển thị'}}
function problem(it){const u=String(it.url||'').trim();if(!u||SO.valid(it.id,u))return'';
  const p=SO.platforms[it.id];
  if(!/^https:\/\//i.test(u))return p.name+': link phải bắt đầu bằng https://';
  return p.name+': link không thuộc '+p.hosts[0]+'.'}

function drawList(){
  const box=$('list');box.innerHTML='';
  D.items.forEach(it=>{
    const p=SO.platforms[it.id];if(!p)return;
    const r=document.createElement('div');r.className='soc';r.dataset.id=it.id;
    r.innerHTML=`<div class="soc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p.svg}</svg></div>
      <div class="soc-top"><span class="soc-n">${p.name}</span><span class="pill" data-pill></span><span class="sp"></span>
        <label class="check"><input type="checkbox" ${it.show!==false?'checked':''}>Hiện trên website</label>
        <button type="button" class="mini" data-open title="Mở link để kiểm tra">Mở ↗</button></div>
      <div class="soc-body"><input type="url" inputmode="url" spellcheck="false" autocomplete="off" placeholder="https://${p.hosts[0]}/…" value="${esc(it.url)}" aria-label="Link ${p.name}"></div>`;
    const inp=r.querySelector('input[type=url]');
    inp.oninput=()=>{it.url=inp.value;change()};
    inp.onblur=()=>{const v=inp.value.trim();if(v!==inp.value){inp.value=v;it.url=v;change()}};
    r.querySelector('input[type=checkbox]').onchange=e=>{it.show=e.target.checked;change()};
    r.querySelector('[data-open]').onclick=()=>{const u=String(it.url||'').trim();
      if(!SO.valid(it.id,u)){toast('Chưa có link hợp lệ để mở.',true);return}
      window.open(u,'_blank','noopener,noreferrer')};
    box.appendChild(r);
  });
  paintMeta();
}
function paintMeta(){
  let n=0;const probs=[];
  D.items.forEach(it=>{
    const row=$('list').querySelector('[data-id="'+it.id+'"]');const st=stateOf(it);if(st.k==='on'||st.k==='empty')n++;
    const pr=problem(it);if(pr)probs.push(pr);
    if(!row)return;
    const pill=row.querySelector('[data-pill]');pill.textContent=st.t;pill.className='pill'+(st.k==='on'?' on':st.k==='bad'?' bad':'');
    row.classList.toggle('off',st.k!=='on');
    row.querySelector('input[type=url]').classList.toggle('bad',!!pr);
    row.querySelector('[data-open]').disabled=!SO.valid(it.id,String(it.url||'').trim());
  });
  $('count').textContent=n+' / '+D.items.length+' đang hiện';
  const w=$('warn');w.style.display=probs.length?'block':'none';w.querySelector('ul').innerHTML=probs.map(x=>`<li>${esc(x)}</li>`).join('');
}
$('s-label').oninput=e=>{D.label=e.target.value;change()};
function allProblems(){const o=D.items.map(problem).filter(Boolean);if(!String(D.label||'').trim())o.push('Chưa có tiêu đề khu vực.');return o}

function saveDraft(){localStorage.setItem(KEY,JSON.stringify({fields:D}));dirty=false;paintState()}
$('save').onclick=()=>{saveDraft();toast('Đã lưu nháp. Khách chưa thấy cho tới khi Publish.');if(window.NOWPUBLISH)NOWPUBLISH.rescan()};
$('discard').onclick=async()=>{
  if(!await ask('Bỏ nháp?','<p>Mọi thay đổi chưa Publish sẽ mất, CMS trở về nội dung đang chạy trên website.</p>','Bỏ nháp',true))return;
  localStorage.removeItem(KEY);D=clone(published);dirty=false;fillAll();paintState();push();
  if(window.NOWPUBLISH)NOWPUBLISH.rescan();toast('Đã trở về bản đang chạy.');
};
$('export').onclick=()=>{
  const out=NOWPUBLISH.sections.social.build(clone({fields:D}));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
  a.download='social.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Đã tải social.json về máy (bản sao lưu).');
};
function beforePublish(files){
  const mine=files.some(f=>f.section==='social');const errs=mine?allProblems():[];
  if(errs.length){modal(`<h3>Chưa Publish được</h3><p>Mạng xã hội còn ${errs.length} lỗi:</p><ol>${errs.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="m-acts"><button type="button" class="solid" id="m-fix">Để mình sửa</button></div>`);$('m-fix').onclick=closeModal;return false}
  const vis=D.items.filter(x=>stateOf(x).k==='on').map(x=>SO.platforms[x.id].name);
  return ask('Publish lên website?',`<p>Các file sau sẽ được cập nhật trên website:</p><ul>${files.map(f=>`<li><code>/${esc(f.path)}</code> — ${esc(f.label)}</li>`).join('')}</ul>`+
    (mine?`<p style="margin-top:12px">${vis.length?'Mạng xã hội hiển thị: <b>'+vis.join(' · ')+'</b>':'Chưa có link nào — khu vực mạng xã hội sẽ ẩn.'}</p>`:''),'Publish ngay').then(ok=>{if(ok&&dirty)saveDraft();return ok});
}

function normalize(f){const o={label:f&&f.label!=null?f.label:DEF.label,items:[]};
  const by={};((f&&f.items)||[]).forEach(x=>{if(x&&x.id)by[x.id]=x});
  o.items=SO.order.map(id=>({id,url:by[id]?String(by[id].url||''):'',show:by[id]?by[id].show!==false:true}));return o}
function fillAll(){$('s-label').value=D.label||'';drawList()}

(async function boot(){
  try{const r=await fetch(SRC,{cache:'no-store'});if(r.ok){const j=await r.json();published=normalize(j.fields||j)}}catch(e){}
  if(!published)published=clone(DEF);
  let draft=null;try{draft=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  D=draft&&draft.fields?normalize(draft.fields):clone(published);
  buildRail();fillAll();paintState();push();
  NOWPUBLISH.init({section:'social',getDoc:()=>({fields:D}),beforePublish,
    onSaved:()=>{saveDraft();published=clone(D);toast('Đã Publish. Website cập nhật sau khoảng 1 phút.')}});
})();
})();
