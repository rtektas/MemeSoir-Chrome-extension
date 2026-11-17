const p=new URLSearchParams(location.hash.slice(1));const room=p.get('room'),v=p.get('video');
try{const u=new URL(v);if(!/^[\w-]{32}$/.test(room||'')||u.protocol!=='https:'||u.hostname!=='www.youtube.com'||u.pathname!=='/watch'||!/^[\w-]{11}$/.test(u.searchParams.get('v')||''))throw Error();
 document.getElementById('intro').textContent='Tes amis t’invitent à une soirée. Prépare le popcorn, ils t’attendent.';
 const a=document.getElementById('video');a.href='https://www.youtube.com/watch?v='+u.searchParams.get('v');a.target='_blank';a.rel='noopener noreferrer';a.hidden=false;
 const b=document.getElementById('copy');b.hidden=false;b.onclick=async()=>{try{await navigator.clipboard.writeText(location.href);document.getElementById('status').textContent='Invitation copiée ! Colle-la dans l’extension.'}catch{const t=document.getElementById('link');t.hidden=false;t.value=location.href;t.select()}};
}catch{if(location.hash)document.getElementById('intro').textContent='Cette invitation est invalide. Demande un nouveau lien à l’hôte.'}
