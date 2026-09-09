import json,re,time,urllib.request,urllib.error,datetime,itertools,math
from html.parser import HTMLParser
from pathlib import Path

UA='Mozilla/5.0 (compatible; SestinaFissa-VinciCasa/1.0; +https://github.com/)'
ROOT=Path(__file__).resolve().parent
SE_OUT=ROOT/'data/draws.json'
VC_OUT=ROOT/'data/vincicasa.json'
SE_URL='https://www.superenalotto.it/archivio-estrazioni'
VC_OFFICIAL='https://www.sisal.it/estrazioni/vincicasa'
VC_FALLBACK_YEARS='https://www.xamig.com/vincicasa/{year}/estrazioni.php'
VC_BOOTSTRAP_FIRST_YEAR=2014

MONTHS={'gennaio':1,'febbraio':2,'marzo':3,'aprile':4,'maggio':5,'giugno':6,'luglio':7,'agosto':8,'settembre':9,'ottobre':10,'novembre':11,'dicembre':12}

def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=None; self.cell=[]; self.in_cell=False
    def handle_starttag(self,t,a):
        if t=='tr': self.row=[]
        if t in ('td','th'): self.cell=[]; self.in_cell=True
    def handle_data(self,d):
        if self.in_cell: self.cell.append(d)
    def handle_endtag(self,t):
        if t in ('td','th') and self.in_cell:
            self.row.append(' '.join(''.join(self.cell).split())); self.in_cell=False
        elif t=='tr' and self.row: self.rows.append(self.row)

def fetch(url,tries=2,delay=2):
    """GET a URL with a couple of retries; network hiccups shouldn't kill a whole run."""
    last_err=None
    for attempt in range(tries):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept-Language':'it-IT,it;q=0.9,en;q=0.7'})
            with urllib.request.urlopen(req,timeout=35) as r:
                return r.read().decode('utf-8','ignore')
        except (urllib.error.URLError,TimeoutError) as e:
            last_err=e
            if attempt<tries-1: time.sleep(delay)
    raise last_err

def parse_super():
    raw=fetch(SE_URL); p=TableParser(); p.feed(raw); out=[]
    for r in p.rows:
        s=' '.join(r)
        m=re.search(r'Concorso\s*N[º°]?\s*(\d+)\s+del\s+(\d{1,2})\s+(\w+)\s+(\d{4})',s,re.I)
        if not m: continue
        month=MONTHS.get(m.group(3).lower())
        if not month or len(r)<3: continue
        nums=[]
        for x in re.findall(r'(?<!\d)([1-9]|[1-8]\d|90)(?!\d)',r[1]):
            n=int(x)
            if n not in nums: nums.append(n)
        if len(nums)<6: continue
        jm=re.search(r'(?<!\d)([1-9]|[1-8]\d|90)(?!\d)',r[2])
        out.append({'date':f'{m.group(4)}-{month:02d}-{int(m.group(2)):02d}','contest':int(m.group(1)),'numbers':sorted(nums[:6]),'jolly':int(jm.group()) if jm else None})
    return out

def parse_vc_table(raw):
    # Xamig annual archive: CONCORSO | DATA | N1 | N2 | N3 | N4 | N5 | ...
    p=TableParser(); p.feed(raw); out=[]
    for r in p.rows:
        if len(r)<7: continue
        m=re.fullmatch(r"\s*(\d{1,4})\s*",r[0])
        date=re.fullmatch(r"\s*(\d{1,2})/(\d{1,2})/(\d{4})\s*",r[1])
        if not m or not date: continue
        nums=[]
        for cell in r[2:7]:
            mm=re.fullmatch(r"\s*(\d{1,2})\s*",cell)
            if not mm: break
            n=int(mm.group(1))
            if not 1<=n<=40: break
            nums.append(n)
        if len(nums)!=5 or len(set(nums))!=5: continue
        out.append({'date':f'{date.group(3)}-{int(date.group(2)):02d}-{int(date.group(1)):02d}','contest':int(m.group(1)),'numbers':sorted(nums)})
    return out

def parse_vc_official(raw):
    # Official Sisal archive page is the primary update source. It may expose recent rows.
    p=TableParser(); p.feed(raw); out=[]
    for r in p.rows:
        s=' '.join(r)
        m=re.search(r'(?:Concorso\s*N[º°]?\s*|N[º°]\s*)(\d+)',s,re.I)
        d=re.search(r'(\d{1,2})[ /-](\d{1,2})[ /-](\d{4})',s)
        if not m or not d: continue
        nums=[]
        for cell in r:
            for x in re.findall(r'(?<!\d)([1-9]|[1-3]\d|40)(?!\d)',cell):
                n=int(x)
                if n not in nums: nums.append(n)
        if len(nums)<5: continue
        # Keep the last five plausible numbers only if exactly five appear in a cell/row.
        # Exclude contest number by preferring values 1..40 after the date.
        nums=nums[-5:]
        if len(set(nums))==5:
            out.append({'date':f'{d.group(3)}-{int(d.group(2)):02d}-{int(d.group(1)):02d}','contest':int(m.group(1)),'numbers':sorted(nums)})
    return out

def load(path):
    if path.exists(): return json.loads(path.read_text(encoding='utf8'))
    return {'draws':[]}

def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')

def update_super():
    old=load(SE_OUT)
    old['lastAttemptAt']=now_iso()
    try:
        fresh=parse_super()
    except Exception as e:
        old['lastError']=f'{type(e).__name__}: {e}'
        save(SE_OUT,old)
        print('SuperEnalotto update failed:',e); return
    # Merge keyed by draw date: each date has exactly one draw, and unlike the contest
    # number (which resets to 1 every January and is missing on most bootstrapped rows)
    # the date is always present and unique, so this can never collapse the archive.
    merged={d['date']:d for d in old.get('draws',[]) if isinstance(d,dict) and 'date' in d}
    for d in fresh: merged[d['date']]=d
    old['draws']=sorted(merged.values(),key=lambda x:x['date'],reverse=True)
    old['updatedAt']=now_iso()
    old['lastError']=None
    save(SE_OUT,old)
    print('SuperEnalotto:',len(old['draws']),'draws')

def mean(vals): return sum(vals)/len(vals) if vals else 0.0

def z(v,mu,sd): return (v-mu)/sd if sd else 0.0

def rank_vincicasa(draws):
    """Deterministic ensemble over all 658,008 combinations.
    This is a heuristic ranking, not a change to the equal mathematical odds.
    Uses historical frequency, recent frequency, pair co-occurrence and central structure.
    """
    if len(draws)<100:
        return {'status':'insufficient_history','numbers':[11,13,19,28,32],'score':None,'historyUsed':len(draws)}
    chrono=list(reversed(draws))
    counts=[0]*41
    for d in chrono:
        for n in d['numbers']: counts[n]+=1
    n=len(chrono); expected=n*5/40
    recent=chrono[-min(250,n):]; rc=[0]*41
    for d in recent:
        for x in d['numbers']: rc[x]+=1
    # pair counts
    pairs={(a,b):0 for a,b in itertools.combinations(range(1,41),2)}
    for d in chrono:
        for a,b in itertools.combinations(d['numbers'],2): pairs[(a,b)]+=1
    pair_mean=mean(pairs.values()); pair_sd=math.sqrt(mean([(v-pair_mean)**2 for v in pairs.values()])) if pairs else 1
    # number score: modest frequency + recent frequency; shrink strongly toward zero.
    fsd=math.sqrt(expected*(1-5/40)) if expected else 1
    rsd=math.sqrt(len(recent)*5/40*(1-5/40)) if recent else 1
    ns={i:0.55*z(counts[i],expected,fsd)+0.30*z(rc[i],len(recent)*5/40,rsd) for i in range(1,41)}
    scores=[]
    for comb in itertools.combinations(range(1,41),5):
        s=sum(ns[x] for x in comb)
        ps=sum(z(pairs.get((a,b),0),pair_mean,pair_sd) for a,b in itertools.combinations(comb,2))
        total=sum(comb); parity=sum(x%2 for x in comb); rng=comb[-1]-comb[0]
        # Central structural preference learned descriptively from the historical combinatorial distribution.
        struct=-abs(total-100)/35.0 - abs(parity-3)*0.18 - abs(rng-24)/35.0
        s += 0.10*ps + 0.12*struct
        scores.append((s,comb))
    scores.sort(reverse=True)
    best=scores[0]
    return {'status':'active','numbers':list(best[1]),'score':round(best[0],6),'historyUsed':n,'top10':[{'numbers':list(c),'score':round(s,6)} for s,c in scores[:10]],'method':'ensemble-frequency-recent-pairs-structure-v1'}

def update_vincicasa():
    old=load(VC_OUT)
    old['lastAttemptAt']=now_iso()
    had_error=False
    merged={d['date']+'|'+str(d['contest']):d for d in old.get('draws',[]) if isinstance(d,dict) and 'date' in d and 'contest' in d}
    today=datetime.datetime.now(datetime.timezone.utc).year
    # Bootstrap the full annual archive only until it's genuinely complete, then remember that
    # with a persisted flag. Re-deriving "complete" from len(merged) alone re-triggers a 13-page
    # crawl of a third-party site on every run if a single year ever comes back short — the flag
    # makes completion sticky so steady-state runs only ever touch the current and previous year.
    bootstrap_done=bool(old.get('historyComplete'))
    years=range(max(VC_BOOTSTRAP_FIRST_YEAR,today-1),today+1) if bootstrap_done else range(VC_BOOTSTRAP_FIRST_YEAR,today+1)
    for year in years:
        try:
            fresh=parse_vc_table(fetch(VC_FALLBACK_YEARS.format(year=year)))
            for d in fresh: merged[d['date']+'|'+str(d['contest'])]=d
            print('VinciCasa',year,len(fresh))
        except Exception as e:
            had_error=True
            print('VinciCasa year',year,'failed:',e)
    # Official Sisal is the authority for the latest result. Its page structure is not guaranteed
    # to be tabular, so only merge rows that can be parsed unambiguously.
    try:
        fresh=parse_vc_official(fetch(VC_OFFICIAL))
        for d in fresh: merged[d['date']+'|'+str(d['contest'])]=d
        print('VinciCasa official:',len(fresh))
    except Exception as e:
        had_error=True
        print('VinciCasa official update failed:',e)
    draws=sorted(merged.values(),key=lambda x:(x['date'],x['contest']),reverse=True)
    # Sanity filter: one date/contest must represent exactly one 5-number draw.
    clean=[]; seen=set()
    for d in draws:
        key=(d['date'],d['contest'])
        nums=d.get('numbers',[])
        if key in seen or len(nums)!=5 or len(set(nums))!=5 or any(n<1 or n>40 for n in nums): continue
        seen.add(key); clean.append({'date':d['date'],'contest':int(d['contest']),'numbers':sorted(nums)})
    if not clean and old.get('draws'):
        # Every source failed on a run — never overwrite good history with nothing.
        old['lastError']='Nessuna estrazione valida ottenuta in questo tentativo; archivio precedente conservato.'
        save(VC_OUT,old)
        print('VinciCasa: update produced no valid draws, keeping previous archive')
        return
    old['draws']=clean
    old['updatedAt']=now_iso()
    old['source']=VC_OFFICIAL
    old['historyComplete']=len(clean)>=3000 or bootstrap_done
    old['model']=rank_vincicasa(clean)
    old['lastError']=('Una o più fonti non hanno risposto correttamente; dati parzialmente aggiornati.' if had_error else None)
    save(VC_OUT,old)
    print('VinciCasa total:',len(clean),'draws; complete:',old['historyComplete'],'dynamic:',old['model'].get('numbers'))

def main():
    update_super(); update_vincicasa()

if __name__=='__main__': main()
