const TARGET=[6,38,43,53,61,83], TARGET_JOLLY=80;
const fmtDate=d=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
const $=id=>document.getElementById(id);
function balls(nums, cls='draw-ball'){return nums.map(n=>`<span class="${cls}">${String(n).padStart(2,'0')}</span>`).join('')}
function targetBalls(){ $('targetBalls').innerHTML=TARGET.map(n=>`<div class="ball">${String(n).padStart(2,'0')}</div>`).join(''); }
function hits(draw){return TARGET.filter(n=>draw.numbers.includes(n));}
function render(data){
 const draws=(data.draws||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
 targetBalls();
 const latest=draws[0];
 if(latest){
  $('latestDate').textContent=`Concorso ${latest.contest} · ${fmtDate(latest.date)}`;
  $('latestDraw').innerHTML=balls(latest.numbers);
  $('latestJolly').textContent=String(latest.jolly).padStart(2,'0');
  $('latestContest').textContent=latest.contest;
 }
 const historical=draws.some(d=>TARGET.every(n=>d.numbers.includes(n)));
 $('historicalCheck').textContent=historical?'SÌ':'NO';
 const observed=draws.length;
 $('observed').textContent=observed;
 const best=Math.max(0,...draws.map(d=>hits(d).length));
 $('bestHit').textContent=best?`${best}/6`:'0/6';
 if(latest){
   const hs=hits(latest); const badge=$('resultBadge');
   badge.className='result-badge '+(hs.length?'hit':'none'); badge.textContent=hs.length?`${hs.length}/6`:'NESSUN HIT';
   $('resultTitle').textContent=`Concorso ${latest.contest} · ${fmtDate(latest.date)}`;
   $('matchRow').innerHTML=TARGET.map(n=>`<span class="match-chip ${hs.includes(n)?'hit':''}">${String(n).padStart(2,'0')}</span>`).join('');
   $('resultMessage').textContent=hs.length?`La sestina fissa ha centrato ${hs.length} numero${hs.length===1?'':'i'} nell'ultima estrazione.`:'La sestina fissa non ha centrato numeri nell’ultima estrazione. Rimane invariata per il prossimo concorso.';
 }
 $('history').innerHTML=draws.slice(0,8).map(d=>{const hs=hits(d);return `<div class="history-item"><div class="history-date">${fmtDate(d.date)}</div><div class="history-numbers">${d.numbers.map(n=>`<span class="tiny ${TARGET.includes(n)?'hit':''}">${String(n).padStart(2,'0')}</span>`).join('')}</div><div class="hit-count">${hs.length}/6</div></div>`}).join('');
 $('syncLabel').textContent=data.updatedAt?`Aggiornato ${new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(data.updatedAt))}`:'Archivio sincronizzato';
}
fetch('data/draws.json',{cache:'no-store'}).then(r=>r.json()).then(render).catch(()=>{$('syncLabel').textContent='Dati locali';targetBalls();});
$('showAll').addEventListener('click',()=>document.querySelector('.history-card').scrollIntoView({behavior:'smooth'}));
