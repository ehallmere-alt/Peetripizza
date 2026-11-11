# Usage: python3 tools/css-prune.py IN.css OUT.css APP_DIR  (dev tool; removes declarations overridden by a later rule with the same selector in the same @media, and selectors whose class/id never appears in the app).
import sys,re,glob,os
sys.setrecursionlimit(10000)
exec(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'css_prune_lib.py')).read().split('tree=parse(s)')[0].replace("src=open(sys.argv[1],encoding='utf-8').read()","src=open(sys.argv[1],encoding='utf-8').read()"))
APP=sys.argv[3]
corpus=''
for f in glob.glob(APP+'/**/*',recursive=True):
    if os.path.isfile(f) and re.search(r'\.(php|js|html)$',f):corpus+=open(f,encoding='utf-8',errors='ignore').read()+'\n'
cache={}
def alive(tok):
    if tok in cache:return cache[tok]
    ok=tok in corpus
    if not ok:
        # dynamic names like 'urgency-'+x : keep if a prefix ending in - or _ appears inside a quote
        parts=re.split(r'(?<=[-_])',tok)
        for k in range(len(parts)-1,0,-1):
            pre=''.join(parts[:k])
            if len(pre)>=4 and re.search(r"""['"`\s.]"""+re.escape(pre)+r"""['"`]?\s*\+|\$\{[^}]*\}|['"`\s.]"""+re.escape(pre)+r"""\$\{""",corpus):ok=True;break
    cache[tok]=ok;return ok
def split_top(sel):
    out=[];d=0;st=0
    for i,c in enumerate(sel):
        if c in '([':d+=1
        elif c in ')]':d-=1
        elif c==',' and d==0:out.append(sel[st:i]);st=i+1
    out.append(sel[st:]);return [x.strip() for x in out]
def strip_parens(s):
    o='';d=0
    for c in s:
        if c=='(':d+=1;continue
        if c==')':d-=1;continue
        if d==0:o+=c
    return re.sub(r'\[[^\]]*\]','',o)
dead={'parts':0,'rules':0}
def clean(nodes):
    out=[]
    for n in nodes:
        if n[0]=='rule':
            parts=split_top(n[1]);keep=[]
            for p in parts:
                toks=re.findall(r'[.#](-?[A-Za-z_][\w-]*)',strip_parens(p))
                if all(alive(t) for t in toks):keep.append(p)
                else:dead['parts']+=1
            if keep:out.append(('rule',','.join(keep),n[2]))
            else:dead['rules']+=1
        elif n[0]=='at':
            ch=clean(n[2])
            if ch:out.append(('at',n[1],ch))
        else:out.append(n)
    return out
tree=clean(prune(parse(s)))
res=emit(tree);open(sys.argv[2],'w',encoding='utf-8').write(res)
print(len(src),'->',len(res),stats,dead)
print('dead tokens sample',[k for k,v in cache.items() if not v][:60])
