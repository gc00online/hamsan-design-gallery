(() => {
'use strict';
const designs=window.DESIGNS;
const $=s=>document.querySelector(s);
const grid=$('#grid'),viewer=$('#viewer'),comparison=$('#comparison');
const validIds=new Set(designs.map(d=>d.id));
let saved=new Set();
try{const raw=JSON.parse(localStorage.getItem('hamsan-saved-v1')||'[]');if(Array.isArray(raw))saved=new Set(raw.filter(id=>validIds.has(id)));}catch{}
let selected=new Set(),filter='all',style='all',current=null,visible=[],toastTimer;
const asset=(id,type='thumbs')=>`assets/${type}/${id}.${type==='full'?'png':'webp'}`;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function persist(){try{localStorage.setItem('hamsan-saved-v1',JSON.stringify([...saved]));}catch{toast('현재 브라우저에서는 저장 상태가 유지되지 않을 수 있습니다.');}}
function toggleSaved(id){saved.has(id)?saved.delete(id):saved.add(id);persist();render();if(current)updateViewerSave();}
function updateCompare(){const n=selected.size;$('#compare-bar').hidden=!n;$('#compare-count').textContent=`${n}개 선택`;$('#compare-open').disabled=n<2;grid.querySelectorAll('[data-compare]').forEach(el=>{el.checked=selected.has(el.dataset.compare);});}
function render(){visible=designs.filter(d=>(filter==='all'||filter===d.group||(filter==='saved'&&saved.has(d.id)))&&(style==='all'||d.style===style));$('#result-count').textContent=visible.length;$('#saved-count').textContent=saved.size;$('#empty').hidden=visible.length>0;
grid.innerHTML=visible.map((d,i)=>`<article class="design-card" id="card-${d.id}"><button class="art-button" data-open="${d.id}" aria-label="${d.id} ${d.title} 확대 보기"><img src="${asset(d.id)}" width="1086" height="362" ${i<4?'fetchpriority="high"':'loading="lazy"'} decoding="async" alt="${d.brand} 현수막 ${d.id} — ${d.title}"></button><div class="card-info"><span class="card-id">${d.id}</span><h3 class="card-title">${d.title}</h3><button class="card-save" data-save="${d.id}" aria-label="${d.id} 시안 ${saved.has(d.id)?'저장 취소':'저장'}" aria-pressed="${saved.has(d.id)}">${saved.has(d.id)?'♥':'♡'}</button></div><div class="card-bottom"><span class="card-tags">${d.group==='previous'?'이전 원본 · ':''}${d.brand} &nbsp; / &nbsp; ${d.style}</span><label class="compare-choice"><input type="checkbox" data-compare="${d.id}" ${selected.has(d.id)?'checked':''} aria-label="${d.id} 비교 선택">비교 담기</label></div></article>`).join('');updateCompare();}
function updateViewerSave(){const b=$('#viewer-save');b.textContent=saved.has(current.id)?'♥ 저장한 시안':'♡ 시안 저장';b.setAttribute('aria-pressed',saved.has(current.id));}
function showDesign(id){const d=designs.find(x=>x.id===id);if(!d)return;current=d;$('#viewer-id').textContent=`${d.id} / ${d.brand} / ${d.style}`;$('#viewer-title').textContent=d.title;$('#viewer-img').src=asset(d.id,'full');$('#viewer-img').alt=`${d.id} ${d.brand} — ${d.title}`;$('#viewer-desc').textContent=d.description;$('#viewer-download').href=asset(d.id,'full');$('#viewer-download').download=`HAMSAN-${d.id}.png`;updateViewerSave();const list=visible.some(x=>x.id===id)?visible:designs;$('#viewer-position').textContent=`${String(list.findIndex(x=>x.id===id)+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;if(!viewer.open)viewer.showModal();history.replaceState(null,'',`#${id}`);}
function move(n){const list=visible.some(x=>x.id===current.id)?visible:designs;const i=list.findIndex(x=>x.id===current.id);showDesign(list[(i+n+list.length)%list.length].id);}
grid.addEventListener('click',e=>{const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]');if(open)showDesign(open.dataset.open);if(save)toggleSaved(save.dataset.save);});
grid.addEventListener('change',e=>{const input=e.target;if(!input.matches('[data-compare]'))return;const id=input.dataset.compare;if(input.checked&&selected.size>=3){input.checked=false;toast('비교는 최대 3개까지 담을 수 있습니다.');return;}input.checked?selected.add(id):selected.delete(id);updateCompare();});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',b===button);});render();}));
$('#style-filter').addEventListener('change',e=>{style=e.target.value;render();});
$('#viewer-close').addEventListener('click',()=>viewer.close());
$('#viewer-save').addEventListener('click',()=>toggleSaved(current.id));
$('#viewer-prev').addEventListener('click',()=>move(-1));$('#viewer-next').addEventListener('click',()=>move(1));
viewer.addEventListener('close',()=>history.replaceState(null,'','#collection'));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}});
$('#compare-clear').addEventListener('click',()=>{selected.clear();updateCompare();});
$('#compare-open').addEventListener('click',()=>{if(selected.size<2)return;$('#comparison-content').innerHTML=[...selected].map(id=>{const d=designs.find(x=>x.id===id);return `<figure class="compare-item"><img src="${asset(id,'full')}" alt="${id} ${d.title}"><figcaption><div>${id} · ${d.title}<span>${d.brand} / ${d.style}</span></div><a href="${asset(id,'full')}" download="HAMSAN-${id}.png">PNG 다운로드 ↓</a></figcaption></figure>`;}).join('');comparison.showModal();});
$('#comparison-close').addEventListener('click',()=>comparison.close());
[viewer,comparison].forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}));
const initial=location.hash.slice(1);if(initial==='previous'){document.querySelector('[data-filter=previous]').click();}else{render();if(validIds.has(initial))showDesign(initial);}
})();
