import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const token=()=>randomBytes(24).toString('base64url');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
export function validVideo(value){
 let u; try{u=new URL(value)}catch{fail('Lien YouTube invalide.')}
 if(u.protocol!=='https:' || !['www.youtube.com','youtube.com'].includes(u.hostname) || u.pathname!=='/watch' || !/^[\w-]{11}$/.test(u.searchParams.get('v')||'')) fail('Cette version accepte les vidéos YouTube classiques (/watch?v=…).');
 return 'https://www.youtube.com/watch?v='+u.searchParams.get('v');
}
export function createApp(){
 const rooms=new Map(), rates=new Map();
 const sweep=setInterval(()=>{
  const now=Date.now();
  for(const [id,r] of rooms) if(now-r.touched>2*3600000 || now-r.created>12*3600000) rooms.delete(id);
  for(const [ip,r] of rates) if(now-r.at>60000) rates.delete(ip);
 },60000);sweep.unref();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
  try{
   const url=new URL(req.url,'http://localhost');
   if(req.method==='GET' && ['/', '/invite.js', '/style.css'].includes(url.pathname)){
    const name={'/':'index.html','/invite.js':'invite.js','/style.css':'style.css'}[url.pathname];
    const content=await readFile(new URL('./'+name,import.meta.url));
    res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':'text/javascript'});res.end(content);return;
   }
   if(req.method==='GET'&&url.pathname==='/health'){send(200,{ok:true});return}
   if(req.method!=='POST'||url.pathname!=='/api')fail('Introuvable.',404);
   if(!req.headers['content-type']?.startsWith('application/json'))fail('JSON requis.',415);
   const ip=req.socket.remoteAddress;let rate=rates.get(ip);
   if(!rate||Date.now()-rate.at>60000){rate={at:Date.now(),n:0};rates.set(ip,rate)}
   if(++rate.n>3000)fail('Trop de requêtes. Réessayez dans une minute.',429);
   let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)fail('Message trop volumineux.',413)}
   let b;try{b=JSON.parse(text)}catch{fail('JSON invalide.')}
   if(!b||typeof b!=='object'||Array.isArray(b))fail('Requête invalide.');
   const name=()=>{if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>24)fail('Choisissez un pseudo de 1 à 24 caractères.');return b.name.trim()};
   let r,member;
   const snapshot=()=>({room:r.id,video:r.video,host:r.host,state:r.state,serverTime:Date.now(),members:[...r.members.values()].filter(p=>Date.now()-p.seen<90000).map(p=>({id:p.id,name:p.name})),messages:r.messages});
   if(b.action==='create'){
    if(rooms.size>=500)fail('Serveur complet.',503);
    const video=validVideo(b.video), pseudo=name();
    const id=token(),idMember=token(),auth=token();
    member={id:idMember,name:pseudo,auth,seen:Date.now(),lastChat:0};
    r={id,video,host:idMember,members:new Map([[auth,member]]),messages:[],state:{position:0,paused:true,rate:1,at:Date.now(),revision:0},created:Date.now(),touched:Date.now()};rooms.set(id,r);
    send(200,{...snapshot(),auth,me:idMember});return;
   }
   r=rooms.get(b.room);if(!r)fail('Salon fermé ou expiré. Créez une nouvelle soirée.',404);
   if(b.action==='join'){
    const pseudo=name();
    for(const [key,p] of r.members)if(p.id!==r.host&&Date.now()-p.seen>120000)r.members.delete(key);
    if(r.members.size>=20)fail('Ce salon est complet (20 personnes).',409);
    const auth=token();member={id:token(),auth,name:pseudo,seen:Date.now(),lastChat:0};r.members.set(auth,member);r.touched=Date.now();
    send(200,{...snapshot(),auth,me:member.id});return;
   }
   member=r.members.get(req.headers.authorization?.replace(/^Bearer /,''));if(!member)fail('Session invalide. Rejoignez à nouveau le salon.',401);
   member.seen=Date.now();r.touched=Date.now();
   if(b.action==='sync'){
    if(member.id!==r.host)fail('Seul l’hôte contrôle la lecture.',403);
    const s=b.state;
    if(!s||!Number.isFinite(s.position)||s.position<0||s.position>604800||typeof s.paused!=='boolean'||!Number.isFinite(s.rate)||s.rate<0.25||s.rate>2)fail('État vidéo invalide.');
    r.state={position:s.position,paused:s.paused,rate:s.rate,at:Date.now(),revision:r.state.revision+1};
   }else if(b.action==='chat'){
    if(typeof b.text!=='string'||!b.text.trim()||b.text.length>500)fail('Le message doit contenir entre 1 et 500 caractères.');
    if(Date.now()-member.lastChat<700)fail('Attendez un instant entre deux messages.',429);
    member.lastChat=Date.now();r.messages.push({id:token(),name:member.name,member:member.id,text:b.text.trim(),at:Date.now()});r.messages=r.messages.slice(-100);
   }else if(b.action==='leave'){
    if(member.id===r.host)rooms.delete(r.id);else r.members.delete(member.auth);
    send(200,{ok:true});return;
   }else if(b.action!=='poll')fail('Action inconnue.');
   send(200,snapshot());
  }catch(e){send(e.status||500,{error:e.status?e.message:'Erreur du serveur.'})}
 });
 server.on('close',()=>clearInterval(sweep));return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8787);createApp().listen(port,'0.0.0.0',()=>console.log(`MêmeSoir prêt : http://localhost:${port}`));
}
