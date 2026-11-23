const projects = [
  {id:'ai-fashion-saas', title:'AI 女装电商 SaaS', english:'AI FASHION SAAS', category:'AI PRODUCTS', type:'AI 产品', description:'面向中小女装电商商家的 AI SaaS 平台，探索 AI 在业务场景中的应用。', role:'具体职责与参与范围待补充', symbol:'✧', color:'#a9c7d7', pale:'#eaf6fa', bg:'#e4eef2', focus:'产品定位、目标用户、业务痛点、AI 能力应用、功能设计与商业价值。'},
  {id:'real-business-product', title:'真实业务线上产品', english:'REAL BUSINESS PRODUCT', category:'AI PRODUCTS', type:'业务产品', description:'在真实业务场景中参与的线上产品，围绕实际需求展开产品实践。', role:'具体职责与参与范围待补充', symbol:'▤', color:'#dec6a3', pale:'#fff6e8', bg:'#f4eddf', focus:'真实业务背景、用户需求、产品方案、实际参与工作与可核实的项目成果。'},
  {id:'ai-3d-customization', title:'AI + 3D 定制平台', english:'AI + 3D CUSTOMIZATION', category:'EXPERIMENTS', type:'AI 交互实验', description:'一个结合 AI 与 3D 的定制平台 Demo，探索产品流程与交互体验。', role:'具体职责与参与范围待补充', symbol:'◇', color:'#c5b6da', pale:'#f5edfc', bg:'#eee8f4', focus:'AI 与 3D 的结合方式、用户流程、交互体验与技术应用探索。'},
  {id:'birthday-website', title:'生日祝福互动网站', english:'BIRTHDAY WEBSITE', category:'CREATIVE WORKS', type:'互动网页', description:'为朋友制作的生日祝福网站，把心意变成可以互动的小体验。', role:'创意构思 / 视觉设计 / 网页制作', symbol:'♡', color:'#e8bcc7', pale:'#fff0f3', bg:'#f7e9ed', focus:'创意构思、视觉语言、网页交互与表达方式。'},
  {id:'photography', title:'摄影作品', english:'PHOTOGRAPHY', category:'CREATIVE WORKS', type:'视觉创作', description:'通过摄影记录观察，探索构图、光影与视觉表达。', role:'摄影创作', symbol:'◎', color:'#b7d5c8', pale:'#effaf4', bg:'#e8f1eb', focus:'作品选择、构图、光影与创作思考。'},
  {id:'match-3-game', title:'三消小游戏', english:'MATCH-3 GAME', category:'EXPERIMENTS', type:'游戏原型', description:'独立制作的简单三消小游戏，探索规则、交互与实现。', role:'交互设计 / 独立制作', symbol:'▦', color:'#c4d5bd', pale:'#f4f8ec', bg:'#f0efe6', focus:'游戏规则、操作反馈、原型过程与实现复盘。'}
];
const categoryLabels = {'ALL':'全部作品', 'AI PRODUCTS':'AI 产品', 'EXPERIMENTS':'交互实验', 'CREATIVE WORKS':'创意作品'};
const capsuleDiameter = 80;
const capsuleLayout = [
  {x:92, y:174, layer:1, angle:-17, rest:11.7, mixX:-19, mixY:-25},
  {x:172.5, y:180.5, layer:2, angle:13, rest:13.4, mixX:15, mixY:-31},
  {x:215, y:213, layer:3, angle:18, rest:10.9, mixX:-24, mixY:-23},
  {x:43, y:214, layer:3, angle:-13, rest:12.6, mixX:23, mixY:-24},
  {x:98, y:248, layer:5, angle:-8, rest:14.3, mixX:18, mixY:-36},
  {x:178, y:250, layer:4, angle:14, rest:9.8, mixX:-16, mixY:-30}
];
const key='hi3d-my-capsules-v1',element=id=>document.getElementById(id);
function initial(){return {first:0,order:null,position:0,drawn:null,phase:'idle'}}
function load(){try{const value=JSON.parse(localStorage.getItem(key));if(!value||!Number.isInteger(value.first)||value.first<0||value.first>6||!Number.isInteger(value.position)||value.position<0||value.position>6||!['idle','fallen','preview'].includes(value.phase)||!(value.drawn===null||Number.isInteger(value.drawn)&&value.drawn>=0&&value.drawn<6)||value.order!==null&&(!Array.isArray(value.order)||value.order.length!==6||new Set(value.order).size!==6||value.order.some(item=>!Number.isInteger(item)||item<0||item>5))||value.first<6&&(value.order!==null||value.position!==0)||value.phase!=='idle'&&value.drawn===null)return initial();return value}catch{return initial()}}
let state=load(), busy=false, activeFilter='ALL', lastFocus=null, sound=false, audio=null, audioOutput=null;
let drawEpoch=0;
const sequenceWaiters = new Map();
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
function reducedMotion() { return motionPreference.matches || document.body.classList.contains('no-motion'); }
function setStage(stage) { element('machine').dataset.stage=stage; }
function waitFor(duration) {
  return new Promise(resolve => {
    const timer=setTimeout(() => { sequenceWaiters.delete(timer); resolve(); }, reducedMotion() ? 0 : duration);
    sequenceWaiters.set(timer, resolve);
  });
}
function releaseWaiters() {
  for (const [timer, resolve] of sequenceWaiters) { clearTimeout(timer); resolve(); }
  sequenceWaiters.clear();
}
function cancelDraw() {
  drawEpoch++;
  releaseWaiters();
  busy=false;
  element('knob').classList.remove('spin');
  element('machine').classList.remove('dispensing');
  setStage('idle');
  characterMotion.setPose('ready');
}
function positionDrop() {
  const scene=element('machine').parentElement.getBoundingClientRect();
  const outlet=document.querySelector('.slot').getBoundingClientRect();
  element('drop').style.left=`${outlet.left-scene.left+outlet.width/2-32}px`;
  element('drop').style.top=`${outlet.top-scene.top+outlet.height/2-32}px`;
}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function capsule(project,index,button=false) {
  const tag=button?'button':'span';
  const attributes=button?`type="button" aria-label="查看${project.title}" data-project="${index}"`:'';
  const layout=capsuleLayout[index];
  const variables=`--home-x:${layout.x}px;--home-y:${layout.y}px;--size:${capsuleDiameter}px;--layer:${layout.layer};--angle:${layout.angle}deg;--rest-time:${layout.rest}s;--rest-x:${index%2?-.6:.7}px;--mix-x:${layout.mixX}px;--mix-y:${layout.mixY}px;--exit-x:${171-layout.x-capsuleDiameter/2}px;--exit-y:${348-layout.y-capsuleDiameter/2}px;`;
  return `<${tag} class="capsule" ${attributes} style="--tint:${project.color};--pale:${project.pale};--delay:${index*-2.13}s;${variables}"><b aria-hidden="true">${project.symbol}</b></${tag}>`;
}
function shuffle(){const order=projects.map((_,index)=>index);for(let index=order.length-1;index>0;index--){const random=new Uint32Array(1);crypto.getRandomValues(random);const swap=random[0]%(index+1);[order[index],order[swap]]=[order[swap],order[index]]}return order}
function status() {
  const number=state.first<6?state.first:state.order?state.position:6;
  const complete=number===6;
  const phaseText=busy||state.phase==='fallen'?'':state.phase==='preview'?'已发现一件作品':complete?'ALL CAPSULES UNLOCKED':'';
  element('status').innerHTML=`<strong>${complete?'本轮作品已集齐':`已发现 ${String(number).padStart(2,'0')} / 06`}</strong>${phaseText?`<small>${phaseText}</small>`:''}<button id="reset" type="button" ${busy?'disabled':''}>重新体验 / RESTART</button>`;
  element('reset').onclick=reset;
  ['knob','girl','drawTop'].forEach(name=>element(name).disabled=busy||state.phase==='fallen');
  element('drawTop').textContent=busy?'正在扭蛋…':complete?'开始新一轮 ↻':state.first===0?'开始扭蛋 ↻':'继续扭蛋 ↻';
}
function machine() {
  element('globe').innerHTML=projects.map((project,index)=>capsule(project,index,true)).join('');
  element('globe').querySelectorAll('.capsule').forEach((node,index)=>{
    const collected=state.first<6&&index<state.first||state.first===6&&!state.order||state.order&&state.order.slice(0,state.position).includes(index);
    node.classList.toggle('gone',Boolean(collected));
    node.tabIndex=collected?-1:0;
    node.setAttribute('aria-hidden',String(Boolean(collected)));
    node.onclick=()=>{ location.hash=`#project/${projects[index].id}`; };
  });
  const drop=element('drop');
  drop.hidden=state.phase!=='fallen';
  if(state.drawn!==null&&state.phase==='fallen') {
    drop.innerHTML=capsule(projects[state.drawn],state.drawn,true);
    drop.querySelector('button').onclick=()=>showPreview(state.drawn);
    positionDrop();
  }
  status();
}
function soundEffect(kind){
 if(!sound)return;
 try{
  audio??=new(window.AudioContext||window.webkitAudioContext)();if(!audioOutput){audioOutput=audio.createGain();audioOutput.connect(audio.destination)}audioOutput.gain.value=sound?1:0;
  if(audio.state==='suspended')audio.resume();
  const now=audio.currentTime;
  const tone=(start,frequency,endFrequency,duration,volume,type='sine')=>{
   const oscillator=audio.createOscillator(),gain=audio.createGain();
   oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now+start);
   oscillator.frequency.exponentialRampToValueAtTime(endFrequency,now+start+duration);
   gain.gain.setValueAtTime(.001,now+start);
   gain.gain.linearRampToValueAtTime(volume,now+start+.008);
   gain.gain.exponentialRampToValueAtTime(.001,now+start+duration);
   oscillator.connect(gain).connect(audioOutput);
   oscillator.start(now+start);oscillator.stop(now+start+duration);
  };
  if(kind==='turn'){
   for(let step=0;step<5;step++)tone(step*.11,210,125,.065,.018,'triangle');
   [0.25,0.48,0.76,1.02,1.27,1.48].forEach((time,index)=>{
    tone(time,1250+index%3*210,590+index%2*140,.105,.018,'sine');
    tone(time+.012,2220+index%2*270,1150,.075,.009,'sine');
   });
  }
  if(kind==='drop'){tone(0,185,65,.19,.09,'triangle');tone(.15,135,85,.09,.025,'sine')}
  if(kind==='open'){tone(0,560,780,.24,.028);tone(.075,840,1120,.29,.019)}
 }catch{}
}
async function draw(event) {
  if(busy||state.phase==='fallen') return;
  const trigger=event?.currentTarget;
  if(trigger?.id==='drawTop') {
    trigger.classList.add('pressing');
    setTimeout(()=>trigger.classList.remove('pressing'),220);
  }
  if(state.phase==='preview') closePreview();
  lastFocus=trigger||element('drawTop');
  const epoch=++drawEpoch;
  busy=true;
  status();
  await characterMotion.ready;
  if(epoch!==drawEpoch) return;
  if(state.first===6&&(!state.order||state.position===6)) {
    state.order=shuffle(); state.position=0; save(); machine();
  }
  const index=state.first<6?state.first:state.order[state.position];
  setStage('starting');
  await characterMotion.setPose('operating',380);
  if(epoch!==drawEpoch) return;
  await waitFor(80);
  if(epoch!==drawEpoch) return;
  element('knob').classList.add('spin');
  element('machine').classList.add('dispensing');
  element('globe').querySelectorAll('.capsule')[index].classList.add('leaving');
  setStage('mixing'); characterMotion.turn(); soundEffect('turn');
  await waitFor(950);
  if(epoch!==drawEpoch) return;
  characterMotion.setPose('waiting');
  await waitFor(550);
  if(epoch!==drawEpoch) return;
  setStage('settling');
  await waitFor(200);
  if(epoch!==drawEpoch) return;
  if(state.first<6) state.first++; else state.position++;
  state.drawn=index; state.phase='fallen'; save(); busy=false;
  element('knob').classList.remove('spin');
  element('machine').classList.remove('dispensing');
  setStage('dropping'); machine(); soundEffect('drop');
  await Promise.all(element('drop').getAnimations().map(animation=>animation.finished.catch(()=>{})));
  if(epoch!==drawEpoch||state.phase!=='fallen') return;
  await characterMotion.playAction('surprise');
  if(epoch!==drawEpoch||state.phase!=='fallen') return;
  await characterMotion.setPose('celebrating');
  if(epoch!==drawEpoch) return;
  if(state.phase==='fallen') showPreview(index);
  setStage('idle');
}
element('girl').onclick=draw;
function showPreview(index) {
  if(state.drawn!==index||busy||!element('preview').hidden) return;
  setStage('idle');
  characterMotion.setPose('ready',0);
  const project=projects[index];
  if(!lastFocus?.isConnected) lastFocus=document.activeElement;
  state.phase='preview'; save(); machine();
  element('previewArt').style.setProperty('--art',project.bg);
  element('previewArt').innerHTML=capsule(project,index);
  element('previewCategory').textContent=`${String(index+1).padStart(2,'0')} / ${project.type}`;
  element('previewTitle').textContent=project.title;
  element('previewEnglish').textContent=project.english;
  element('previewDescription').textContent=project.description;
  element('previewRole').textContent=project.role;
  element('previewLink').href=`#project/${project.id}`;
  element('next').textContent=state.first===6&&(!state.order||state.position===6)?'开启新一轮 ↻':'继续扭蛋 ↻';
  element('preview').hidden=false;
  element('closeIcon').focus({preventScroll:true}); soundEffect('open');
}
function closePreview() {
  const wasOpen=!element('preview').hidden;
  element('preview').hidden=true;
  if(state.phase!=='idle') { state.phase='idle'; state.drawn=null; save(); machine(); }
  if(wasOpen) {
    characterMotion.setPose('ready');
    if(lastFocus?.isConnected) lastFocus.focus({preventScroll:true});
  }
}
function reset() {
  if(busy) return;
  cancelDraw(); closePreview(); state=initial(); save(); machine();
  element('toast').textContent='已重新开始，可以再次发现六个作品。';
  element('toast').hidden=false;
  setTimeout(()=>element('toast').hidden=true,2300);
}
function collection() {
  const focused=document.activeElement?.dataset?.filter;
  element('filters').innerHTML=Object.keys(categoryLabels).map(name=>`<button class="button ${name===activeFilter?'active':''}" data-filter="${name}" aria-pressed="${name===activeFilter}">${categoryLabels[name]}</button>`).join('');
  element('filters').querySelectorAll('button').forEach(button=>{
    button.onclick=()=>{ activeFilter=button.dataset.filter; collection(); };
    if(focused===button.dataset.filter) button.focus({preventScroll:true});
  });
  element('grid').innerHTML=projects.map((project,index)=>activeFilter!=='ALL'&&activeFilter!==project.category?'':`<a class="card" href="#project/${project.id}"><div class="art" style="--art:${project.bg}">${capsule(project,index)}</div><div class="cardcopy"><div class="cardmeta"><span>${String(index+1).padStart(2,'0')} / 06</span><span>${categoryLabels[project.category]}</span></div><h3>${project.title}<span class="project-en">${project.english}</span></h3><p>${project.description}</p><span class="textlink">查看项目 ↗</span></div></a>`).join('');
}
function block(title,content){return `<div class="block"><p class="eyebrow">${title}</p><p>${content}</p></div>`}
function detail(index) {
  const project=projects[index], previous=projects[(index+5)%6], next=projects[(index+1)%6];
  element('detailPage').innerHTML=`<a class="textlink" href="#works">← 返回作品收藏</a><div class="detailintro"><div><p class="eyebrow">${String(index+1).padStart(2,'0')} / 06 · ${project.type}</p><h1>${project.title}</h1><p class="project-en">${project.english}</p><p class="muted">${project.description}</p><p class="eyebrow">项目角色 / MY ROLE</p><p>${project.role}</p></div><div class="detailart" style="--art:${project.bg}">${capsule(project,index)}</div></div><div class="blocks">${block('01 / 项目概览',`${project.focus}<br><span class="placeholder">项目时间、背景与目标待补充</span>`)}${block('02 / 用户与需求','<span class="placeholder">待补充：目标用户、观察到的需求与业务问题。</span>')}${block('03 / 产品思考','<span class="placeholder">待补充：产品定位、产品结构、核心功能与使用流程。</span>')}${block('04 / 设计与实现','<span class="placeholder">待补充：原型、关键设计决策、实际 AI 应用及使用的工具。</span>')}${block('05 / 成果与复盘','<span class="placeholder">待补充：可核实的成果、个人贡献、遇到的问题与复盘。未验证的数据不展示。</span>')}${block('项目材料 / MATERIALS','<span class="placeholder">待补充：项目截图、原型链接或过程材料。</span>')}</div><div class="detailnav"><a href="#project/${previous.id}">← ${previous.title}</a><a href="#works">全部作品 ↑</a><a href="#project/${next.id}">${next.title} →</a></div>`;
  document.title=`${project.title} — MY CAPSULES`;
}
function syncPet(){const away=element('homePage').hidden||element('home').getBoundingClientRect().bottom<Math.min(innerHeight*.5,360);element('petDock').hidden=!away}
function route() {
  const hash=decodeURIComponent(location.hash.slice(1));
  const index=hash.startsWith('project/')?projects.findIndex(project=>project.id===hash.slice(8)):-1;
  const isDetail=index>=0;
  if(hash&&hash!=='home') { cancelDraw(); characterMotion.finishEntry(); closePreview(); machine(); }
  element('homePage').hidden=isDetail; element('detailPage').hidden=!isDetail;
  if(isDetail) { detail(index); window.scrollTo({top:0,behavior:'instant'}); }
  else {
    document.title='MY CAPSULES — AI 产品作品集';
    if(hash&&hash!=='home') requestAnimationFrame(()=>element(['works','about','contact'].includes(hash)?hash:'home').scrollIntoView());
    else if(hash==='home') window.scrollTo({top:0,behavior:'instant'});
  }
  element('nav').classList.remove('show'); element('menu').setAttribute('aria-expanded','false');
  requestAnimationFrame(syncPet);
}
element('knob').onclick=draw;
element('drawTop').onclick=draw;
element('closeIcon').onclick=closePreview;
element('closeText').onclick=closePreview;
element('next').onclick=()=>{ closePreview(); draw(); };
element('preview').onclick=event=>{ if(event.target===element('preview')) closePreview(); };
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!element('preview').hidden) closePreview();
  if(event.key==='Tab'&&!element('preview').hidden) {
    const options=[...element('preview').querySelectorAll('button,a')];
    const index=options.indexOf(document.activeElement);
    if(event.shiftKey&&index===0) { event.preventDefault(); options.at(-1).focus(); }
    else if(!event.shiftKey&&index===options.length-1) { event.preventDefault(); options[0].focus(); }
  }
});
element('menu').onclick=()=>{
  const opened=element('nav').classList.toggle('show');
  element('menu').setAttribute('aria-expanded',String(opened));
};
element('year').textContent=new Date().getFullYear();
element('sound').onclick=()=>{
  sound=!sound;
  if(audioOutput) audioOutput.gain.value=sound?1:0;
  element('sound').textContent=sound?'音效：开':'音效：关';
  element('sound').setAttribute('aria-pressed',String(sound));
  soundEffect('open');
};
function syncMotion() {
  const off=reducedMotion();
  element('motion').textContent=motionPreference.matches?'动态已减少（系统）':off?'恢复动态':'减少动态';
  element('motion').disabled=motionPreference.matches;
  element('motion').setAttribute('aria-pressed',String(off));
  if(off) { characterMotion.settleMotion(); releaseWaiters(); }
}
element('motion').onclick=()=>{ document.body.classList.toggle('no-motion'); syncMotion(); };
motionPreference.addEventListener('change',syncMotion);
element('retryAssets').onclick=()=>location.reload();
document.querySelectorAll('.character-part').forEach(image=>{
  const fallback=()=>{ element('girl').classList.add('has-fallback'); element('sceneNote').hidden=false; };
  image.addEventListener('error',fallback);
  if(image.complete&&!image.naturalWidth) fallback();
});
element('petDock').onclick=()=>{
  if(location.hash!=='#home') location.hash='#home';
  else element('home').scrollIntoView({behavior:reducedMotion()?'instant':'smooth'});
};
window.addEventListener('scroll',()=>requestAnimationFrame(syncPet),{passive:true});
window.addEventListener('resize',()=>{ syncPet(); if(state.phase==='fallen') positionDrop(); });
window.addEventListener('hashchange',route);
let sceneVisible=true;
function syncVisibility() {
  document.body.classList.toggle('scene-paused',!sceneVisible||document.hidden);
  if(document.hidden) characterMotion.finishEntry();
}
const sceneObserver=new IntersectionObserver(entries=>{
  sceneVisible=entries[0].isIntersecting;
  syncVisibility();
  if(!sceneVisible) characterMotion.finishEntry();
},{threshold:0});
sceneObserver.observe(document.querySelector('.scene'));
document.addEventListener('visibilitychange',syncVisibility);
machine(); collection(); route(); syncMotion();
if(state.phase==='preview') showPreview(state.drawn);
else characterMotion.enter();
