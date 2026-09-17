const TARGET=[6,38,43,53,61,83], TARGET_JOLLY=80;
const VC_FIXED=[11,13,19,28,32];

const $=id=>document.getElementById(id);
const fmtDate=d=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
const fmtSync=d=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(d));
const pad=n=>String(n).padStart(2,'0');
function balls(nums,cls='ball'){return nums.map(n=>`<span class="${cls}">${pad(n)}</span>`).join('')}

function renderSuper(data){
  const draws=(data.draws||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  $('targetBalls').innerHTML=TARGET.map(n=>`<div class="ball">${pad(n)}</div>`).join('');
  const latest=draws[0];
  if(latest){
    $('latestDate').textContent=`${fmtDate(latest.date)}${latest.contest?` · concorso ${latest.contest}`:''}`;
    $('latestDraw').innerHTML=balls(latest.numbers,'ball ball-mini');
    $('latestJolly').textContent=latest.jolly!=null?pad(latest.jolly):'—';
    const hits=TARGET.filter(n=>latest.numbers.includes(n));
    const badge=$('resultBadge');
    badge.className='pill pill-badge '+(hits.length?'hit':'none');
    badge.textContent=`${hits.length}/6`;
    $('matchRow').innerHTML=TARGET.map(n=>`<span class="match-chip ${hits.includes(n)?'hit':''}">${pad(n)}</span>`).join('');
    $('resultMessage').textContent=hits.length?`La sestina fissa ha centrato ${hits.length} numero${hits.length===1?'':'i'} in questa estrazione.`:'La sestina fissa non ha centrato numeri in questa estrazione. Resta invariata.';
  }
  const historical=draws.some(d=>TARGET.every(n=>d.numbers.includes(n)));
  $('historicalCheck').textContent=historical?'Sì':'No';
  $('observed').textContent=draws.length;
  const best=Math.max(0,...draws.map(d=>TARGET.filter(n=>d.numbers.includes(n)).length));
  $('bestHit').textContent=best?`${best}/6`:'0/6';
  $('latestContest').textContent=latest?fmtDate(latest.date):'—';
  $('history').innerHTML=draws.slice(0,8).map(d=>{
    const hits=TARGET.filter(n=>d.numbers.includes(n));
    return `<div class="history-item"><div class="history-date">${fmtDate(d.date)}</div><div class="history-numbers">${d.numbers.map(n=>`<span class="tiny ${TARGET.includes(n)?'hit':''}">${pad(n)}</span>`).join('')}</div><div class="hit-count">${hits.length}/6</div></div>`;
  }).join('');
}

function renderVC(data){
  const draws=(data.draws||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  $('vcFixedBalls').innerHTML=VC_FIXED.map(n=>`<div class="ball">${pad(n)}</div>`).join('');
  const model=(data.model&&data.model.numbers)||VC_FIXED;
  $('vcModelBalls').innerHTML=model.map(n=>`<div class="ball">${pad(n)}</div>`).join('');
  const latest=draws[0];
  if(latest){
    $('vcLatestDate').textContent=`${fmtDate(latest.date)} · concorso ${latest.contest}`;
    $('vcLatestDraw').innerHTML=balls(latest.numbers,'ball ball-mini');
    const fh=VC_FIXED.filter(n=>latest.numbers.includes(n)).length;
    const mh=model.filter(n=>latest.numbers.includes(n)).length;
    $('vcFixedResult').textContent=`${fh}/5`;
    $('vcModelResult').textContent=`${mh}/5`;
    $('vcFixedMessage').textContent=fh?`${fh} numero${fh===1?'':'i'} centrato${fh===1?'':'i'}.`:'Nessun numero centrato.';
    $('vcModelMessage').textContent=mh?`${mh} numero${mh===1?'':'i'} centrato${mh===1?'':'i'} con la proposta di questo ciclo.`:'Nessun numero centrato in questa estrazione.';
  }
  $('vcObserved').textContent=draws.length;
  $('vcFixedHistorical').textContent=draws.some(d=>VC_FIXED.every(n=>d.numbers.includes(n)))?'Sì':'No';
  $('vcHistoryComplete').textContent=data.historyComplete?'Sì':'In costruzione';
  $('vcModelHistory').textContent=data.model?.historyUsed??draws.length;
  const statusPill=$('vcModelStatus');
  const active=data.model?.status==='active';
  statusPill.className='pill pill-badge '+(active?'active':'waiting');
  statusPill.textContent=active?'Attivo':'In attesa di storico';
  $('vcHistory').innerHTML=draws.slice(0,10).map(d=>{
    const h=VC_FIXED.filter(n=>d.numbers.includes(n)).length;
    return `<div class="history-item"><div class="history-date">${fmtDate(d.date)}</div><div class="history-numbers">${d.numbers.map(n=>`<span class="tiny ${VC_FIXED.includes(n)?'hit':''}">${pad(n)}</span>`).join('')}</div><div class="hit-count">${h}/5</div></div>`;
  }).join('');
}

function renderStatus(se,vc){
  const dot=$('statusDot'), label=$('syncLabel');
  const error=se.lastError||vc.lastError;
  if(error){
    dot.classList.add('warn'); label.textContent='Ultimo aggiornamento non riuscito — dati precedenti conservati'; label.title=error;
  }else{
    dot.classList.remove('warn');
    const stamps=[se.updatedAt,vc.updatedAt].filter(Boolean).sort();
    label.textContent=stamps.length?`Aggiornato ${fmtSync(stamps[stamps.length-1])}`:'Archivio locale';
    label.title='Dati pubblicati nel repository';
  }
}

let loading=false;
async function loadData({refresh=false}={}){
  if(loading)return;
  loading=true;
  const button=$('recalcLink');
  const label=$('syncLabel');
  const dot=$('statusDot');
  if(button){button.disabled=true;button.classList.add('loading');button.textContent='Aggiornamento…';}
  if(label)label.textContent='Aggiornamento dati…';
  try{
    const q=refresh?`?v=${Date.now()}`:'';
    const [seRes,vcRes]=await Promise.all([
      fetch(`data/draws.json${q}`,{cache:'no-store'}),
      fetch(`data/vincicasa.json${q}`,{cache:'no-store'})
    ]);
    if(!seRes.ok||!vcRes.ok)throw new Error('Archivio dati non disponibile');
    const [se,vc]=await Promise.all([seRes.json(),vcRes.json()]);
    renderSuper(se); renderVC(vc); renderStatus(se,vc);
  }catch(e){
    dot?.classList.add('warn');
    if(label)label.textContent='Impossibile aggiornare i dati';
    if(label)label.title=e.message||'Errore di rete';
  }finally{
    loading=false;
    if(button){button.disabled=false;button.classList.remove('loading');button.textContent='Aggiorna dati ↻';}
  }
}

function setupRecalcLink(){
  const button=$('recalcLink');
  if(!button)return;
  button.hidden=false;
  button.removeAttribute('href');
  button.removeAttribute('target');
  button.setAttribute('type','button');
  button.setAttribute('aria-label','Aggiorna i dati pubblicati');
  button.addEventListener('click',()=>loadData({refresh:true}));
}

setupRecalcLink();
loadData();
