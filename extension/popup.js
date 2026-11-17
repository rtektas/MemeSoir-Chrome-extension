const $=id=>document.getElementById(id);
let activeSessionTab;
chrome.tabs.query({active:true,currentWindow:true}).then(async ([tab])=>{
 if(tab && (await message({type:'status',tab:tab.id})).connected){activeSessionTab=tab.id;$('join').textContent='Retrouver ma soirée ↗';$('create').hidden=true;}
}).catch(()=>{});
async function message(m){const r=await chrome.runtime.sendMessage(m);if(r.error)throw new Error(r.error);return r.data}
chrome.storage.local.get(['name','base']).then(s=>{if(s.name)$('name').value=s.name;if(s.base)$('server').value=s.base});
async function start(join){
 const status=$('status');status.className='';
 try{
  if(activeSessionTab){await chrome.scripting.executeScript({target:{tabId:activeSessionTab},files:['content.js']});window.close();return}
  const name=$('name').value.trim();if(!name)throw new Error('Choisis un pseudo pour la soirée.');
  let base=$('server').value.trim(),room;
  if(join){const link=new URL($('invite').value.trim());const params=new URLSearchParams(link.hash.slice(1));room=params.get('room');if(!/^[\w-]{32}$/.test(room||''))throw new Error('Ce lien d’invitation est invalide.');base=link.origin}
  const u=new URL(base);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Le serveur doit utiliser HTTPS (sauf localhost).');
  if(u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('L’adresse du serveur ne doit contenir ni chemin ni identifiants.');
  // Request permissions directly from the button gesture, before other async work.
  const granted=await chrome.permissions.request({origins:[u.origin+'/*']});if(!granted)throw new Error('Accès au serveur refusé.');
  $('create').disabled=$('join').disabled=true;status.textContent='Connexion à la soirée…';
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.url?.startsWith('https://www.youtube.com/watch?'))throw new Error('Ouvre d’abord une vidéo sur www.youtube.com, puis réessaie.');
  const current=await message({type:'status',tab:tab.id});
  if(current.connected){await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});window.close();return}
  const connected=await message({type:'connect',tab:tab.id,base:u.origin,room,name,video:tab.url});
  await chrome.storage.local.set({name,base:u.origin});
  if(new URL(tab.url).searchParams.get('v')!==new URL(connected.video).searchParams.get('v')){
   // Navigation revokes activeTab: user reopens the extension to attach the panel.
   await chrome.tabs.update(tab.id,{url:connected.video});status.textContent='La vidéo de tes amis s’ouvre. Reclique sur MêmeSoir puis sur Rejoindre pour afficher le chat.';return;
  }
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});window.close();
 }catch(e){status.textContent=e.message==='Failed to fetch'?'Serveur inaccessible. Lance DEMARRER-WINDOWS.bat ou vérifie son adresse.':e.message;status.className='error'}finally{$('create').disabled=$('join').disabled=false}
}
$('create').onclick=()=>start(false);$('join').onclick=()=>start(true);
