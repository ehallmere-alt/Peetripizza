import urllib.request,urllib.parse,json,re,sys,os,time,glob
BASE='http://127.0.0.1:8097/peetripizza/';A=os.path.dirname(os.path.abspath(__file__))
WEB=A+'/web/d1/d2/peetripizza';PD=WEB+'/private_data'
cookie={'v':''};res=[]
class NR(urllib.request.HTTPRedirectHandler):
  def redirect_request(self,*a,**k):return None
op=urllib.request.build_opener(NR)
def req(path,method='GET',data=None,headers=None,ctype=None,raw=False):
  h=dict(headers or {});
  if cookie['v']:h['Cookie']=cookie['v']
  body=None
  if data is not None:
    body=data if isinstance(data,bytes) else (json.dumps(data).encode() if ctype!='form' else urllib.parse.urlencode(data).encode())
    h['Content-Type']='application/x-www-form-urlencoded' if ctype=='form' else (ctype or 'application/json')
  r=urllib.request.Request(BASE+path,data=body,method=method,headers=h)
  try:resp=op.open(r);code=resp.status;txt=resp.read().decode();hd=resp.headers
  except urllib.error.HTTPError as e:code=e.code;txt=e.read().decode();hd=e.headers
  for c in hd.get_all('Set-Cookie') or []:
    m=re.match(r'(PEETRI_STAFF=[^;]*)',c)
    if m:cookie['v']=m.group(1)
  try:j=json.loads(txt)
  except Exception:j=None
  return code,(txt if raw else j),hd
def check(name,cond,info=''):
  res.append((name,bool(cond)));print(('PASS ' if cond else 'FAIL ')+name+('' if cond else '  -> '+str(info)[:300]))
def mode(m):open(A+'/mode.txt','w').write(m)
mode('ok')
# --- unauthenticated
for ep in ['live.php','kitchen-status.php','dough.php','pickup.php','wait-time.php','status.php','system-health.php','kitchen-history.php','live-health.php','order-shape.php','customer-bridge.php','client-log.php','site-status.php','version.php','print-log.php','kitchen-analytics.php']:
  c,j,_=req('api/'+ep);check('no login -> 401: '+ep,c==401 and j and j.get('error')=='authentication_required',(c,j))
c,j,_=req('api/customer-links.php','POST',{});check('no login -> 401: customer-links.php',c==401,(c,j))
c,j,_=req('api/track-status.php?t=bad');check('track-status bad token -> 404 (public endpoint)',c==404,(c,j))
c,j,_=req('api/bonuses.php');check('bonuses retired -> 410',c==410)
c,j,_=req('api/staff-mode.php');check('staff-mode retired -> 410',c==410)
c,j,_=req('api/orders.php');check('orders.php disabled (401 without login)',c in (401,503,403),(c,j))
c,t,_=req('private_data/x.json',raw=True);check('private_data not public (via php -S only checks file absence)',c in (403,404),c)
# --- login
c,html,_=req('',raw=True);m=re.search(r'name="csrf" value="([^"]+)"',html);check('login page renders with CSRF',c==200 and m,c)
csrf=m.group(1)
c,html,_=req('','POST',{'csrf':csrf,'pizzeria_id':'65','password':'wrong'},ctype='form',raw=True)
check('wrong password -> clear message',('Vale parool' in html),c)
mode('down');c,html,_=req('',raw=True);csrf=re.search(r'name="csrf" value="([^"]+)"',html).group(1)
c,html,_=req('','POST',{'csrf':csrf,'pizzeria_id':'65','password':'x'},ctype='form',raw=True);check('peetripizza.ee down -> says server does not answer',('server ei vasta' in html),c);mode('ok')
c,html,_=req('?aegus=1',raw=True);check('?aegus=1 shows session-expired notice',('Sessioon aegus' in html),c)
c,html,_=req('',raw=True);csrf=re.search(r'name="csrf" value="([^"]+)"',html).group(1)
c,t,h=req('','POST',{'csrf':csrf,'pizzeria_id':'65','password':'right-pass'},ctype='form',raw=True)
check('right password -> 303 redirect',c==303,(c,t[:200]))
c,html,_=req('',raw=True);m=re.search(r'name="pp-wait-csrf" content="([^"]+)"',html);check('dashboard after login',c==200 and m,c)
CS={'X-CSRF-Token':m.group(1)}
# --- read endpoints
c,j,_=req('api/status.php');check('status.php ok',c==200 and j['ok'],j)
c,j,_=req('api/live.php');check('live.php returns orders',c==200 and j and j['ok'] and len(j['orders'])==2,(c,j))
if c==200:
  o={x['number']:x for x in j['orders']}
  check('live: cancelled order filtered',not any(x['number']=='A103' for x in j['orders']))
  check('live: status mapping pending->new, preparing->active',o['A101']['status']=='new' and o['A102']['status']=='active',[x['status'] for x in j['orders']])
  dump=json.dumps(j,ensure_ascii=False)
  check('live: customer name shown',o['A101'].get('customerName')=='Mari Maasikas' and o['A102'].get('customerName')=='Jaan Tamm',(o['A101'].get('customerName'),o['A102'].get('customerName')))
  check('live: NO email/address leaked to kitchen',not re.search(r'mari@|Tamme',dump),dump[:300])
  ph={o['number']:o.get('customerPhone') for o in j['orders']}
  check('live v17.7: customer phone only in customerPhone (top-level and nested)',sorted(v for v in ph.values() if v)==['+372 5555 1234','5551111'] and dump.count('5555 1234')==1,ph)
  check('live v17.7: system number YYMMDD-N kept for non-numeric numbers',all(re.fullmatch(r'\d{6}-\d+|A\d+',str(n)) for n in ph),list(ph))
  check('live: items present',o['A101']['items'] and o['A102']['items'],o['A101']['items'])
  check('live: official deadline used',o['A102'].get('deadlineSource')=='official',o['A102'])
  LIVEID=o['A101']['id']
c,j,_=req('api/live.php','POST',{},headers=CS);check('live.php POST refused (read-only)',c==405,c)
c,j,_=req('api/live-health.php');check('live-health ok',c==200 and j['state']=='connected',(c,j))
c,j,_=req('api/order-shape.php');check('order-shape keys only, no values',c==200 and 'Mari' not in json.dumps(j) and '5555' not in json.dumps(j),(c,str(j)[:200]))
c,j,_=req('api/system-health.php');check('system-health ok',c==200 and j and j.get('ok') is not None,(c,str(j)[:300]));SH=j
c,j,_=req('api/customer-bridge.php');check('customer-bridge says writes disabled',c==200 and j['can_write'] is False,j)
# --- writes
c,j,_=req('api/kitchen-status.php');check('kitchen-status GET',c==200 and j['ok'],j)
c,j,_=req('api/kitchen-status.php','POST',{'id':LIVEID,'status':'active','official_status':'new','expected_revision':0});check('kitchen-status POST without CSRF refused',c==403,c)
c,j,_=req('api/kitchen-status.php','POST',{'id':LIVEID,'status':'active','official_status':'new','expected_revision':0},headers=CS);check('kitchen-status: Võta vastu saved',c==200 and j['ok'],(c,j))
c,j,_=req('api/kitchen-status.php','POST',{'id':LIVEID,'status':'done','official_status':'new','expected_revision':0},headers=CS);check('kitchen-status: stale revision -> 409',c==409,(c,j))
c,j,_=req('api/kitchen-status.php','POST',{'id':LIVEID,'status':'done','official_status':'new','expected_revision':1},headers=CS);check('kitchen-status: Valmis saved',c==200 and j['ok'],(c,j))
st=json.load(open(PD+'/internal-status-65.json'));check('kitchen-status written to disk',st['records'][LIVEID]['status']=='done',st)
c,j,_=req('api/kitchen-history.php?order='+LIVEID);check('kitchen-history shows 2 events',c==200 and len(j['events'])==2,(c,j))
c,j,_=req('api/wait-time.php');check('wait-time GET',c==200 and j['ok'],j)
c,j,_=req('api/wait-time.php','POST',{'minutes':30},headers=CS);check('wait-time POST 30',c==200 and j['minutes']==30,(c,j))
c,j,_=req('api/wait-time.php');check('wait-time persisted',j['minutes']==30,j)
c,j,_=req('api/wait-time.php','POST',{'minutes':31},headers=CS);check('wait-time invalid rejected',c==422,c)
c,j,_=req('api/pickup.php');check('pickup GET',c==200,j)
c,j,_=req('api/pickup.php','POST',{'key':'live:'+LIVEID,'action':'handed','expected_revision':0},headers=CS);check('pickup handed saved',c==200 and j['records']['live:'+LIVEID]['handed_at'],(c,j))
c,j,_=req('api/customer-links.php','POST',{'order_id':LIVEID},headers=CS);check('customer link created',c==200 and j['ok'],(c,j))
if c==200:
  tok=j['url'].split('t=')[1];c2,j2,_=req('api/track-status.php?t='+tok);check('tracking link works, status handed',c2==200 and j2['status']=='handed',(c2,j2))
c,j,_=req('api/dough.php');check('dough GET catalog',c==200 and j['catalog'],(c,str(j)[:200]))
if c==200:
  key=list(j['catalog'].keys())[0];
  fro=[k for k,v in j['catalog'].items() if v.get('frozen')] or [key]
  import datetime;d=(datetime.date.today()+datetime.timedelta(days=2)).isoformat()
  c,j,_=req('api/dough.php','POST',{'action':'create','items':{fro[0]:3},'delivery_date':d},headers=CS);check('dough order created',c==201 and j['ok'],(c,j))
  if c==201:
    oid=j['order']['id'];c,j,_=req('api/dough.php','POST',{'action':'status','id':oid,'status':'Kinnitatud','expected_revision':j['order'].get('revision',1)},headers=CS);check('dough status change',c==200,(c,j))
    c,j,_=req('api/dough.php');check('dough order listed after reload',any(x['id']==oid for x in j['orders']))
c,j,_=req('api/client-log.php','POST',{'kind':'error','message':'test'},headers=CS);check('client-log write',c==200,(c,j))
# --- v17.6 site status (read-only)
import glob
open(A+'/pid.txt','w').write('65')
for f in glob.glob(A+'/web/d1/d2/peetripizza/private_data/site-*.json'):os.remove(f)
c,j,_=req('api/site-status.php');check('site-status ok',c==200 and j.get('ok') and j.get('read_only'),(c,j))
if c==200:
  check('site-status wait 45',j.get('wait_time_minutes')==45,j)
  check('site-status names missing product',[x['name'] for x in j['missing_products']]==['#99','Coca-Cola 0,5l'],j['missing_products'])
  check('site-status topping name (et)',j['missing_toppings']==[{'id':3,'name':'Jalapeño <b>'}],j['missing_toppings'])
  check('site-status today hours',j.get('today_hours')=='10:00–22:00',j.get('today_hours'))
  check('site-status never leaks websocket_key','SECRET' not in json.dumps(j),j)
c,j,_=req('api/site-status.php','POST',{},headers=CS);check('site-status POST -> 405',c==405,(c,j))
mode('down');c,j,_=req('api/site-status.php');check('site-status upstream down -> cached (stale ok)',c==200 and j.get('ok'),(c,j))
mode('ok');os.remove(A+'/pid.txt')
# --- v17.10 version check (no github=1 here: that would reach the real internet)
c,j,_=req('api/version.php');check('version.php: release + files ok',c==200 and j.get('ok') and re.match(r'^\d+\.\d+\.\d+$',j.get('version','')) and j['files']['checked'] and j['files']['total']>100 and j['files']['missingCount']==0 and j.get('github') is None,(c,str(j)[:300]))
check('version.php: no secrets / order data',not re.search(r'session|websocket|password|customer|phone',json.dumps(j),re.I),str(j)[:300])
c,j,_=req('api/version.php','POST',{},headers=CS);check('version.php POST -> 405',c==405,(c,j))
# --- v17.14 Regression Guard: Smart Print Monitor
c,j,_=req('api/print-log.php');check('v17.14 print-log GET',c==200 and j['ok'] and isinstance(j['orders'],list),(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':LIVEID,'number':'A101','kind':'auto','device':'Tahvel aaaa'});check('v17.14 print-log POST without CSRF refused',c==403,(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':LIVEID,'number':'A101','kind':'auto','device':'Tahvel aaaa'},headers=CS);check('v17.14 print: first tablet claims auto print',c==200 and j['claimed'] is True and j['record']['count']==1,(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':LIVEID,'number':'A101','kind':'auto','device':'Tahvel bbbb'},headers=CS);check('v17.14 print: second tablet does NOT auto-print the same order',c==200 and j['claimed'] is False and j['record']['count']==1,(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'outcome','order':LIVEID,'outcome':'blocked','device':'Tahvel aaaa'},headers=CS);check('v17.14 print: blocked print is not counted',c==200 and j['record']['count']==0,(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':LIVEID,'number':'A101','kind':'auto','device':'Tahvel bbbb'},headers=CS);check('v17.14 print: after a blocked print another tablet may print',c==200 and j['claimed'] is True,(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':LIVEID,'number':'A101','kind':'copy','device':'Tahvel aaaa'},headers=CS);check('v17.14 print: manual copy is logged (count 2)',c==200 and j['record']['count']==2 and j['record']['last_kind']=='copy',(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':'../x','number':'1','kind':'manual','device':'Tahvel aaaa'},headers=CS);check('v17.14 print: bad order id -> 422',c==422,(c,j))
c,j,_=req('api/print-log.php','POST',{'action':'claim','order':LIVEID,'number':'1','kind':'manual','device':'<script>'},headers=CS);check('v17.14 print: bad device label -> 422',c==422,(c,j))
c,j,_=req('api/print-log.php');check('v17.14 print-log lists the order',c==200 and any(x['order']==LIVEID and x['count']==2 for x in j['orders']),(c,str(j)[:300]))
raw=open(PD+'/print-log-65.json').read();check('v17.14 print-log on disk has no customer data',not re.search(r'Mari|Maasikas|5555|@',raw),raw[:200])
# --- v17.14 Kitchen Analytics
nowms=int(time.time()*1000)
c,j,_=req('api/kitchen-analytics.php','POST',{'action':'sync','orders':[{'id':LIVEID,'number':'A101','created':nowms-30*60000,'deadline':nowms-25*60000}]});check('v17.14 analytics sync without CSRF refused',c==403,(c,j))
c,j,_=req('api/kitchen-analytics.php','POST',{'action':'sync','orders':[{'id':LIVEID,'number':'A101','created':nowms-30*60000,'deadline':nowms-25*60000},{'id':'bad','number':'x'}]},headers=CS);check('v17.14 analytics sync stored',c==200 and j['ok'],(c,j))
c,j,_=req('api/kitchen-analytics.php?period=today');check('v17.14 analytics today: order, prep time, late',c==200 and j['orders']>=1 and j['prep_count']>=1 and j['late']>=1 and len(j['hours'])==24,(c,str(j)[:300]))
check('v17.14 analytics: no staff names or ratings',c==200 and not re.search(r'actor|staff|rating|K..k',json.dumps(j)),str(j)[:200])
c,j,_=req('api/kitchen-analytics.php?period=year');check('v17.14 analytics bad period -> 422',c==422,(c,j))
for per in ('yesterday','7d'):
  c,j,_=req('api/kitchen-analytics.php?period='+per);check('v17.14 analytics period '+per,c==200 and j['ok'],(c,j))
raw=open(PD+'/analytics-65.json').read();check('v17.14 analytics on disk: ids, numbers, times only',not re.search(r'Mari|5555|@|Margherita',raw) and set(json.loads(raw)['orders'][LIVEID])<={'n','c','d','a','f'},raw[:200])
# --- v17.14 Taigna tellimine 4.0: edit window
c,j,_=req('api/dough.php');fro=[k for k,v in j['catalog'].items() if v.get('frozen')]
import datetime;d=(datetime.date.today()+datetime.timedelta(days=2)).isoformat()
c,j,_=req('api/dough.php','POST',{'action':'create','items':{fro[0]:2},'delivery_date':d},headers=CS);oid=j['order']['id'] if c==201 else ''
c,j,_=req('api/dough.php');row=[x for x in j['orders'] if x['id']==oid]
check('v17.14 dough: editable + editable_until in list',row and row[0]['editable'] is True and row[0]['editable_until'],row)
c,j,_=req('api/dough.php','POST',{'action':'edit','id':oid,'expected_revision':0,'items':{fro[0]:5},'delivery_date':d},headers=CS)
check('v17.14 dough: edit inside window saved with change details',c==200 and j['order']['history'][-1].get('changes')==[{'key':fro[0],'name':j['order']['items'][0]['name'],'from':2,'to':5}],(c,j))
rows=json.load(open(PD+'/dough-65.json'))
for r in rows:
  if r['id']==oid:r['created_at']=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=2)).isoformat()
open(PD+'/dough-65.json','w').write(json.dumps(rows))
c,j,_=req('api/dough.php','POST',{'action':'edit','id':oid,'expected_revision':1,'items':{fro[0]:6},'delivery_date':d},headers=CS)
check('v17.14 dough: edit after cut-off refused (edit_window_closed)',c==409 and j['error']=='edit_window_closed',(c,j))
c,j,_=req('api/dough.php','POST',{'action':'status','id':oid,'expected_revision':1,'status':'Tühistatud'},headers=CS);check('v17.14 dough: cancel still possible after cut-off',c==200,(c,j))
# --- v17.14 System Health 2.0
c,j,_=req('api/system-health.php');check('v17.14 system-health: storage size, disk, server time',c==200 and isinstance(j.get('storage'),dict) and j['storage']['files']>=1 and abs(j['server_time']-int(time.time()*1000))<60000 and any(x['key']=='storage_size' for x in j['checks']),(c,str(j)[:300]))
check('v17.14 system-health: no file names or secrets',not re.search(r'internal-status|dough-|password|session',json.dumps(j.get('storage'))),j.get('storage'))
# --- upstream failures
mode('expired');c,j,_=req('api/live.php');check('upstream session expired -> 401 (so the login banner shows)',c==401,(c,j))
mode('down');c,j,_=req('api/live.php');check('upstream down -> 502',c==502,(c,j))
mode('ok')
# --- logout
c,html,_=req('',raw=True);m=re.search(r'name="csrf" value="([^"]+)"',html)
if m:
  c,_,_=req('','POST',{'action':'logout','csrf':m.group(1)},ctype='form',raw=True);c,j,_=req('api/status.php');check('logout ends session',c==401,c)
else: check('logout form present on dashboard',False,'no csrf input')
print('\n%d/%d passed'%(sum(1 for _,o in res if o),len(res)))
