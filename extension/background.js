// Session credentials stay in extension-owned storage, never in the invitation.
chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
const key=id=>'tab:'+id;
async function api(base,body,auth){
 const res=await fetch(base+'/api',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(8000),credentials:'omit',redirect:'error'});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Connexion impossible.');return data;
}
function baseURL(value){
 const u=new URL(value);
 if(u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Indiquez uniquement l’adresse du serveur, sans chemin.');
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Utilisez HTTPS, ou localhost pour le test local.');
 return u.origin;
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 (async()=>{
  if(sender.id!==chrome.runtime.id)throw new Error('Accès refusé.');
  const popup=!sender.tab&&sender.url===chrome.runtime.getURL('popup.html');
  const id=sender.tab?.id??m.tab;
  if(!Number.isInteger(id))throw new Error('Onglet absent.');
  if(m.type==='connect'){
   if(!popup)throw new Error('Ouvrez l’extension pour vous connecter.');
   const base=baseURL(m.base);
   if(!(await chrome.permissions.contains({origins:[base+'/*']})))throw new Error('Autorisez l’accès au serveur.');
   const old=(await chrome.storage.session.get(key(id)))[key(id)];
   if(old)throw new Error('Quittez d’abord la soirée active dans cet onglet.');
   const data=await api(base,{action:m.room?'join':'create',room:m.room,name:m.name,video:m.video});
   const session={base,room:data.room,auth:data.auth,me:data.me,host:data.host,video:data.video};
   await chrome.storage.session.set({[key(id)]:session});
   return {video:data.video};
  }
  const session=(await chrome.storage.session.get(key(id)))[key(id)];
  if(m.type==='status')return session?{connected:true}: {connected:false};
  if(!session)throw new Error('Ouvrez MêmeSoir pour créer ou rejoindre une soirée.');
  if(m.type==='info')return {me:session.me,host:session.host,video:session.video,invite:session.base+'/#room='+encodeURIComponent(session.room)+'&video='+encodeURIComponent(session.video)};
  if(m.type==='request'){
   if(!['poll','sync','chat','leave'].includes(m.action))throw new Error('Action refusée.');
   if(m.action==='leave'){
    try{await api(session.base,{action:'leave',room:session.room},session.auth)}finally{await chrome.storage.session.remove(key(id))}
    return {ok:true};
   }
   return api(session.base,{action:m.action,room:session.room,state:m.state,text:m.text},session.auth);
  }
  throw new Error('Requête inconnue.');
 })().then(data=>reply({data})).catch(e=>reply({error:e.message}));return true;
});
chrome.tabs.onRemoved.addListener(async id=>{
 const session=(await chrome.storage.session.get(key(id)))[key(id)];
 if(session){await chrome.storage.session.remove(key(id));try{await api(session.base,{action:'leave',room:session.room},session.auth)}catch{}}
});
