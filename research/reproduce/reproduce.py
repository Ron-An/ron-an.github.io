"""Python 3 standard-library only. Verify sampling & counts; optionally re-scrape.
Run: python reproduce.py
Run: python reproduce.py --collect  (writes fresh HTML metadata to ./observations/)
The published analyst classifications are never overwritten by this script.
"""
import argparse,collections,hashlib,json,time,urllib.request,urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

HERE=Path(__file__).resolve().parent
DATA=json.loads((HERE.parent/'data/companies.json').read_text('utf-8'))
ROWS=DATA['companies']
POOL=json.loads((HERE/'yc-candidate-pool.json').read_text('utf-8'))
assert len(ROWS)==80 and len({r['id'] for r in ROWS})==80
for year,size in [(2024,23),(2025,17)]:
    candidates=[r for r in POOL if r['year']==year and 'United States of America' in r['regions']]
    ordered=sorted(candidates,key=lambda r:hashlib.sha256((DATA['meta']['seed']+':'+r['id']).encode()).hexdigest())
    expected={'yc-'+r['id'] for r in ordered[:size]}
    actual={r['id'] for r in ROWS if r['group']=='yc' and r['year']==year}
    assert expected==actual, 'YC sample differs from frozen candidate pool'
    assert sum(r['group']=='primer' and r['year']==year for r in ROWS)==size
print('Verified: 80 unique companies, year-matched 40 + 40 sample.')
for field in ['customer','ai','sector']:
    for group in ['primer','yc']:
        values=collections.Counter(r[field] for r in ROWS if r['group']==group)
        print(group,field,json.dumps(dict(values),ensure_ascii=False))

class Metadata(HTMLParser):
    def __init__(self):super().__init__();self.values={}
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='meta' and attrs.get('property') in ['og:title','og:description','og:url']:
            self.values[attrs['property']]=attrs.get('content','')

if argparse.ArgumentParser(description=__doc__).parse_known_args()[1]==['--collect']:
    folder=HERE/'observations';folder.mkdir(exist_ok=True)
    policies={};last_request={};log=[]
    for row in ROWS:
        source=row['source'];host=urlsplit(source).netloc
        try:
            if host not in policies:
                policy=urllib.robotparser.RobotFileParser('https://'+host+'/robots.txt')
                policy.read();policies[host]=policy
            policy=policies[host]
            if not policy.can_fetch('CourseResearch',source):
                log.append({'id':row['id'],'source':source,'status':'skipped by current robots.txt'});continue
            interval=max(5 if row['group']=='primer' else 1,policy.crawl_delay('*') or 0)
            time.sleep(max(0,interval-(time.monotonic()-last_request.get(host,0))))
            request=urllib.request.Request(source,headers={'User-Agent':'CourseResearch/1.0 (public startup profile study)'})
            with urllib.request.urlopen(request,timeout=30) as response:blob=response.read();status=response.status
            last_request[host]=time.monotonic()
            parser=Metadata();parser.feed(blob.decode('utf-8','replace'))
            record={'id':row['id'],'source':source,'status':status,'sha256':hashlib.sha256(blob).hexdigest(),'metadata':parser.values}
            (folder/(row['id']+'.html')).write_bytes(blob)
        except Exception as exc:
            last_request[host]=time.monotonic();record={'id':row['id'],'source':source,'error':str(exc)}
        log.append(record)
        (folder/'collection-log.json').write_text(json.dumps(log,ensure_ascii=False,indent=2),'utf-8')
        print(row['id'],record.get('status','error'))
