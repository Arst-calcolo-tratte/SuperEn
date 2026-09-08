const TARGET=[6,38,43,53,61,83], TARGET_JOLLY=80;
const VC_FIXED=[11,13,19,28,32];
const fmtDate=d=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
const $=id=>document.getElementById(id);
function balls(nums, cls='draw-ball'){return nums.map(n=>`<span class="${cls}">${String(n).padStart(2,'0')}</span>`).join('')}
function renderSuper(data){
 const draws=(data.draws||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
 $('targetBalls').innerHTML=TARGET.map(n=>`<div class="ball">${String(n).padStart(2,'0')}</div>`).join('');
 const latest=draws[0];
 if(latest){
  $('latestDate').textContent=`Concorso ${latest.contest ?? '—'} · ${fmtDate(latest.date)}`;
  $('latestDraw').innerHTML=balls(latest.numbers); $('latestJolly').textContent=String(latest.jolly??'—').padStart(2,'0'); $('latestContest').textContent=latest.contest??'—';
  const hs=TARGET.filter(n=>latest.numbers.includes(n)); const badge=$('resultBadge'); badge.className='result-badge '+(hs.length?'hit':'none'); badge.textContent=`${hs.length}/6`;
  $('resultTitle').textContent=`Concorso ${latest.contest ?? '—'} · ${fmtDate(latest.date)}`;
  $('matchRow').innerHTML=TARGET.map(n=>`<span class="match-chip ${hs.includes(n)?'hit':''}">${String(n).padStart(2,'0')}</span>`).join('');
  $('resultMessage').textContent=hs.length?`La sestina fissa ha centrato ${hs.length} numero${hs.length===1?'':'i'} nell’ultima estrazione.`:'La sestina fissa non ha centrato numeri nell’ultima estrazione. Rimane invariata.';
 }
 const historical=draws.some(d=>TARGET.every(n=>d.numbers.includes(n))); $('historicalCheck').textContent=historical?'SÌ':'NO'; $('observed').textContent=draws.length;
 const best=Math.max(0,...draws.map(d=>TARGET.filter(n=>d.numbers.includes(n)).length)); $('bestHit').textContent=best?`${best}/6`:'0/6';
 $('history').innerHTML=draws.slice(0,8).map(d=>{const hs=TARGET.filter(n=>d.numbers.includes(n));return `<div class="history-item"><div class="history-date">${fmtDate(d.date)}</div><div class="history-numbers">${d.numbers.map(n=>`<span class="tiny ${TARGET.includes(n)?'hit':''}">${String(n).padStart(2,'0')}</span>`).join('')}</div><div class="hit-count">${hs.length}/6</div></div>`}).join('');
}
function renderVC(data){
 const draws=(data.draws||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
 $('vcFixedBalls').innerHTML=VC_FIXED.map(n=>`<div class="ball">${String(n).padStart(2,'0')}</div>`).join('');
 const model=(data.model&&data.model.numbers)||VC_FIXED;
 $('vcModelBalls').innerHTML=model.map(n=>`<div class="ball model-ball">${String(n).padStart(2,'0')}</div>`).join('');
 const latest=draws[0];
 if(latest){
   $('vcLatestDate').textContent=`Concorso ${latest.contest} · ${fmtDate(latest.date)}`;
   $('vcLatestDraw').innerHTML=balls(latest.numbers);
   const fh=VC_FIXED.filter(n=>latest.numbers.includes(n)).length, mh=model.filter(n=>latest.numbers.includes(n)).length;
   $('vcFixedResult').textContent=`${fh}/5`; $('vcModelResult').textContent=`${mh}/5`;
   $('vcFixedMessage').textContent=fh?`La cinquina fissa ha centrato ${fh} numero${fh===1?'':'i'}.`:'La cinquina fissa non ha centrato numeri.';
   $('vcModelMessage').textContent=mh?`Il modello dinamico ha centrato ${mh} numero${mh===1?'':'i'} con la cinquina proposta per questo ciclo.`:'Il modello dinamico non ha centrato numeri in questa estrazione.';
 }
 $('vcObserved').textContent=draws.length;
 $('vcFixedHistorical').textContent=draws.some(d=>VC_FIXED.every(n=>d.numbers.includes(n)))?'SÌ':'NO';
 $('vcModelStatus').textContent=(data.model?.status==='active')?'ATTIVO':'IN ATTESA DATI';
 $('vcModelHistory').textContent=data.model?.historyUsed??draws.length;
 $('vcHistory').innerHTML=draws.slice(0,10).map(d=>{const h=VC_FIXED.filter(n=>d.numbers.includes(n)).length;return `<div class="history-item"><div class="history-date">${fmtDate(d.date)}</div><div class="history-numbers">${d.numbers.map(n=>`<span class="tiny ${VC_FIXED.includes(n)?'hit':''}">${String(n).padStart(2,'0')}</span>`).join('')}</div><div class="hit-count">${h}/5</div></div>`}).join('');
 $('vcSyncLabel').textContent=data.updatedAt?`Aggiornato ${new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(data.updatedAt))}`:'Archivio locale';
}
Promise.all([fetch('data/draws.json',{cache:'no-store'}).then(r=>r.json()),fetch('data/vincicasa.json',{cache:'no-store'}).then(r=>r.json())]).then(([se,vc])=>{renderSuper(se);renderVC(vc);$('syncLabel').textContent=se.updatedAt?`Dati aggiornati ${new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(se.updatedAt))}`:'Archivio sincronizzato';}).catch(()=>{renderSuper({draws:[]});renderVC({draws:[]});});
$('showAll').addEventListener('click',()=>document.querySelector('#superHistory').scrollIntoView({behavior:'smooth'}));
$('showVcAll').addEventListener('click',()=>document.querySelector('#vcHistoryCard').scrollIntoView({behavior:'smooth'}));
