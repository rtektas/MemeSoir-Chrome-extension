(()=>{
 if(globalThis.__memeSoir){globalThis.__memeSoir.hidden=false;return}
 const host=document.createElement('div');host.style.cssText='position:fixed;right:18px;top:80px;z-index:2147483647;width:320px;max-width:calc(100vw - 36px);';document.documentElement.append(host);globalThis.__memeSoir=host;
 const shadow=host.attachShadow({mode:'closed'});
 // Keep keyboard events inside the panel without cancelling native text editing.
 for (const type of ['keydown', 'keyup', 'keypress']) {
  shadow.addEventListener(type, event => event.stopPropagation());
 }
 shadow.innerHTML=`<style>
 :host{all:initial;font-family:system-ui,sans-serif;color:#f6f5ee}*{box-sizing:border-box}.card{background:#121722;border:1px solid #3c4555;border-radius:17px;box-shadow:0 16px 70px #0008;overflow:hidden;font-size:13px}header{display:flex;align-items:center;gap:8px;padding:17px;border-bottom:1px solid #2e3644}header strong{font-size:17px;flex:1}header b{color:#d1ff83;font-size:24px}button{font:inherit;cursor:pointer;border:0;border-radius:7px;padding:9px 12px;background:#d1ff83;color:#192212;font-weight:700}header button{background:#252e3b;color:#fff;padding:5px 9px}.main{padding:14px}.status{font-size:12px;color:#c9dbb2;line-height:1.5;margin-bottom:10px}.people{color:#97a2b5;font-size:11px;line-height:1.6;margin:10px 0}.messages{height:220px;overflow:auto;background:#0d1119;border-radius:9px;padding:11px}.msg{margin:0 0 12px;overflow-wrap:anywhere;line-height:1.5}.msg strong{display:block;font-size:10px;color:#c1da9d}.msg span{white-space:pre-wrap}form{display:flex;gap:6px;margin-top:10px}input,textarea{font:inherit;color:#fff;background:#202735;border:1px solid #414b5c;border-radius:7px;padding:10px;min-width:0}input{flex:1;width:100%}textarea{width:100%;height:60px;margin-top:8px;font-size:11px}.actions{display:flex;gap:7px}.actions button{flex:1;font-size:11px}.quiet{background:#273141;color:#e2e7ef}.note{font-size:10px;color:#8f9db2;margin:11px 0 0}.hidden{display:none}button:focus-visible,input:focus-visible{outline:2px solid #fff}.collapsed .main{display:none}
 </style><section class="card"><header><b>◒</b><strong>MêmeSoir</strong><button id="min" title="Réduire le chat">−</button></header><div class="main"><div id="status" class="status" role="status">Connexion à la soirée…</div><div class="actions"><button id="copy">Inviter mes amis ↗</button><button id="leave" class="quiet">Quitter</button></div><textarea id="link" class="hidden" readonly aria-label="Lien d’invitation"></textarea><div id="people" class="people"></div><div id="messages" class="messages" role="log" aria-live="polite"></div><form><input id="text" maxlength="500" placeholder="Un message pour la soirée…" aria-label="Message"><button type="submit">↑</button></form><button id="unlock" class="hidden">Activer la lecture synchronisée</button><p class="note">L’hôte a la télécommande · YouTube bêta</p></div></section>`;
 const $=id=>shadow.getElementById(id);let info,stopped=false,video,mutedUntil=0,lastState,lastPush=0,busy=false,lastMessages='',bound=new AbortController();
 async function msg(m){const r=await chrome.runtime.sendMessage(m);if(r.error)throw new Error(r.error);return r.data}
 const api=(action,extra={})=>msg({type:'request',action,...extra});
 const status=text=>$('status').textContent=text;
 const isHost=()=>info?.me===info?.host;
 const ad=()=>!!document.querySelector('.html5-video-player.ad-showing, .html5-video-player.ad-interrupting');
 const rightVideo=()=>new URL(location.href).searchParams.get('v')===new URL(info.video).searchParams.get('v');
 function bind(){
  const found=document.querySelector('video.html5-main-video')||document.querySelector('video');
  if(found===video)return;bound.abort();bound=new AbortController();video=found;
  if(video)for(const event of ['play','pause','seeked','ratechange','waiting','playing'])video.addEventListener(event,()=>{
   if(isHost()&&Date.now()>mutedUntil)push();
  },{signal:bound.signal});
 }
 let pushing=false,pushAgain=false;
 async function push(){
  if(stopped||!video||!isHost()||!rightVideo())return;
  if(pushing){pushAgain=true;return}pushing=true;
  try{
   // Never send ad timeline positions to the party; freeze the last content position.
   const paused=ad()||video.paused||video.readyState<3;
   const position=ad()?(lastState?.position||0):video.currentTime;
   if(!Number.isFinite(position))return;
   const data=await api('sync',{state:{position,paused,rate:video.playbackRate}});lastState=data.state;lastPush=Date.now();
  }catch(e){status('Connexion interrompue : '+e.message)}finally{pushing=false;if(pushAgain){pushAgain=false;push()}}
 }
 async function apply(s,now){
  if(!video||ad()||!rightVideo()||video.readyState<1)return;
  const target=s.position+(s.paused?0:Math.max(0,now-s.at)/1000*s.rate);
  mutedUntil=Date.now()+1000;
  video.playbackRate=s.rate;
  const position=Number.isFinite(video.duration)?Math.min(target,Math.max(0,video.duration-.1)):target;
  if(Math.abs(video.currentTime-position)>(s.paused?.25:1.3))video.currentTime=position;
  if(s.paused){video.pause()}else if(video.paused){try{await video.play();$('unlock').classList.add('hidden')}catch{$('unlock').classList.remove('hidden');status('Clique sur « Activer » pour autoriser la lecture.')}}
 }
 function render(data){
  $('people').textContent=data.members.map(m=>(m.id===data.host?'♛ ':'')+m.name).join(' · ');
  const hostPresent=data.members.some(m=>m.id===data.host);
  const messages=JSON.stringify(data.messages);if(messages!==lastMessages){
   const box=$('messages'),near=box.scrollHeight-box.scrollTop-box.clientHeight<60;box.replaceChildren();
   for(const m of data.messages){const p=document.createElement('p');p.className='msg';const n=document.createElement('strong');n.textContent=m.name;const t=document.createElement('span');t.textContent=m.text;p.append(n,t);box.append(p)}
   if(near)box.scrollTop=box.scrollHeight;lastMessages=messages;
  }
  if(!rightVideo())status('La vidéo a changé. Reviens à celle du salon ou quitte pour créer une autre soirée.');
  else if(!video)status('En attente du lecteur vidéo…');
  else if(ad())status('Publicité en cours : synchronisation après la publicité.');
  else if(!hostPresent)status('Hôte déconnecté. En attente de son retour…');
  else status(isHost()?'Tu as la télécommande · '+data.members.length+' en ligne':'Avec tes amis · La lecture suit l’hôte');
 }
 async function tick(){
  if(stopped)return;
  try{
   bind();if(isHost()&&Date.now()-lastPush>2500)await push();
   const started=Date.now(),data=await api('poll');lastState=data.state;render(data);
   if(!isHost())await apply(data.state,data.serverTime+(Date.now()-started)/2);
  }catch(e){status(e.message+' · Nouvelle tentative…')}
  if(!stopped)setTimeout(tick,750);
 }
 $('min').onclick=()=>shadow.querySelector('.card').classList.toggle('collapsed');
 $('copy').onclick=async()=>{if(!info)return;try{await navigator.clipboard.writeText(info.invite);status('Lien copié. Envoie-le à tes amis !')}catch{$('link').value=info.invite;$('link').classList.remove('hidden');$('link').select();status('Copie ce lien pour inviter tes amis.')}};
 $('leave').onclick=async()=>{stopped=true;bound.abort();try{await api('leave')}catch{}host.remove();delete globalThis.__memeSoir};
 $('unlock').onclick=async()=>{try{await video.play();$('unlock').classList.add('hidden')}catch{status('Lance la vidéo avec le bouton YouTube, puis réessaie.')}};
 shadow.querySelector('form').onsubmit=async e=>{e.preventDefault();const input=$('text');if(!input.value.trim()||busy)return;busy=true;try{await api('chat',{text:input.value});input.value=''}catch(e){status(e.message)}finally{busy=false}};
 msg({type:'info'}).then(data=>{info=data;tick()}).catch(e=>status(e.message));
})();
