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
for ep in ['live.php','kitchen-status.php','dough.php','pickup.php','wait-time.php','status.php','system-health.php','kitchen-history.php','live-health.php','order-shape.php','customer-bridge.php','client-log.php','site-status.php']:
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
