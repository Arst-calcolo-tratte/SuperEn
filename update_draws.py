import json,re,urllib.request,datetime
from html.parser import HTMLParser
URL='https://www.superenalotto.it/archivio-estrazioni'
OUT='data/draws.json'
class P(HTMLParser):
    def __init__(self): super().__init__(); self.rows=[]; self.row=None; self.cell=[]; self.in_td=False
    def handle_starttag(self,t,a):
        if t=='tr': self.row=[]
        if t in ('td','th'): self.cell=[]; self.in_td=True
    def handle_data(self,d):
        if self.in_td:self.cell.append(d)
    def handle_endtag(self,t):
        if t in ('td','th') and self.in_td:
            self.row.append(' '.join(''.join(self.cell).split())); self.in_td=False
        if t=='tr' and self.row:self.rows.append(self.row)
raw=urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0 (compatible; SestinaFissa/1.0)'}),timeout=30).read().decode('utf-8','ignore')
p=P();p.feed(raw)
out=[]
for r in p.rows:
    s=' '.join(r)
    m=re.search(r'Concorso\s*N[º°]\s*(\d+)\s+del\s+(\d{1,2})\s+(\w+)\s+(\d{4})',s,re.I)
    if not m: continue
    months={'gennaio':1,'febbraio':2,'marzo':3,'aprile':4,'maggio':5,'giugno':6,'luglio':7,'agosto':8,'settembre':9,'ottobre':10,'novembre':11,'dicembre':12}
    month=months.get(m.group(3).lower());
    if not month: continue
    nums=[]
    for x in re.findall(r'(?<!\d)([1-9]|[1-8]\d|90)(?!\d)',r[1] if len(r)>1 else ''):
        n=int(x)
        if n not in nums: nums.append(n)
    if len(nums)<6: continue
    j=int(re.search(r'(?<!\d)([1-9]|[1-8]\d|90)(?!\d)',r[2]).group()) if len(r)>2 and re.search(r'(?<!\d)([1-9]|[1-8]\d|90)(?!\d)',r[2]) else None
    out.append({'date':f'{m.group(4)}-{month:02d}-{int(m.group(2)):02d}','contest':int(m.group(1)),'numbers':sorted(nums[:6]),'jolly':j})
old=json.load(open(OUT,encoding='utf8'))
merged={d['contest']:d for d in old.get('draws',[])}
for d in out: merged[d['contest']]=d
old['draws']=sorted(merged.values(),key=lambda x:(x['date'],x['contest']),reverse=True)
old['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
json.dump(old,open(OUT,'w',encoding='utf8'),ensure_ascii=False,indent=2)
print('Updated',len(old['draws']),'draws; latest',old['draws'][0] if old['draws'] else None)
