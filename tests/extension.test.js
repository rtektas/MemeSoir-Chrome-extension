import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createApp} from '../server/server.js';
test('extension worker: host/guest sessions, protected credentials, chat and cleanup',async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  let listener,onRemoved;const saved={};const chrome={
   storage:{session:{setAccessLevel:async()=>{},get:async k=>({[k]:saved[k]}),set:async o=>Object.assign(saved,o),remove:async k=>{delete saved[k]}}},
   runtime:{id:'test',getURL:p=>'chrome-extension://test/'+p,onMessage:{addListener:fn=>{listener=fn}}},
   permissions:{contains:async()=>true},tabs:{onRemoved:{addListener:fn=>{onRemoved=fn}}}
  };
  vm.runInNewContext(await readFile(new URL('../extension/background.js',import.meta.url),'utf8'),{chrome,fetch,URL,AbortSignal,Error});
  const popup={id:'test',url:'chrome-extension://test/popup.html'};
  const content=tab=>({id:'test',tab:{id:tab},url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'});
  const send=(m,s=popup)=>new Promise(resolve=>listener(m,s,resolve));
  assert.ok((await send({type:'connect',tab:1,base,name:'Resul',video:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'})).data);
  const h=(await send({type:'info'},content(1))).data;
  assert.ok(h.invite.includes('#room='));assert.equal(h.auth,undefined);
  const room=new URLSearchParams(new URL(h.invite).hash.slice(1)).get('room');
  assert.ok((await send({type:'connect',tab:2,base,room,name:'Ami'})).data);
  assert.ok((await send({type:'connect',tab:3,base,room,name:'Forbidden'},content(3))).error);
  assert.ok((await send({type:'connect',tab:1,base,room,name:'Duplicate'})).error);
  assert.ok((await send({type:'request',action:'sync',state:{position:34,paused:true,rate:1}},content(1))).data);
  const poll=(await send({type:'request',action:'poll'},content(2))).data;assert.equal(poll.state.position,34);
  assert.ok((await send({type:'request',action:'sync',state:{position:70,paused:false,rate:1}},content(2))).error);
  await send({type:'request',action:'chat',text:'Salut !'},content(2));
  assert.equal((await send({type:'request',action:'poll'},content(1))).data.messages[0].text,'Salut !');
  await onRemoved(2);assert.equal((await send({type:'status',tab:2})).data.connected,false);
  await send({type:'request',action:'leave'},content(1));assert.equal((await send({type:'status',tab:1})).data.connected,false);
 }finally{await new Promise(r=>server.close(r))}
});
test('manifest MV3 contains no remote script or permanent blanket host access',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../extension/manifest.json',import.meta.url)));
 assert.equal(manifest.manifest_version,3);assert.equal(manifest.host_permissions,undefined);assert.equal(manifest.externally_connectable,undefined);
 for(const f of ['content.js','popup.js','background.js']){const code=await readFile(new URL('../extension/'+f,import.meta.url),'utf8');assert.ok(!code.includes('eval('));}
});
