import sys,re
src=open(sys.argv[1],encoding='utf-8').read()
# 1. strip comments (outside strings)
def strip_comments(s):
    out=[];i=0;n=len(s);q=None
    while i<n:
        c=s[i]
        if q:
            out.append(c)
            if c=='\\' and i+1<n: out.append(s[i+1]);i+=2;continue
            if c==q:q=None
            i+=1;continue
        if c in '"\'':q=c;out.append(c);i+=1;continue
        if s.startswith('/*',i):
            j=s.find('*/',i+2);i=n if j<0 else j+2;continue
        out.append(c);i+=1
    return ''.join(out)
s=strip_comments(src)
# 2. parse into nodes: ('rule',sel,body) | ('at',prelude,children|None,raw)
def find_block_end(s,i):
    depth=0;q=None;n=len(s)
    while i<n:
        c=s[i]
        if q:
            if c=='\\':i+=2;continue
            if c==q:q=None
        elif c in '"\'':q=c
        elif c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return i
        i+=1
    raise Exception('unbalanced')
def parse(s):
    nodes=[];i=0;n=len(s)
    while i<n:
        while i<n and s[i] in ' \t\r\n;':i+=1
        if i>=n:break
        if s[i]=='}':i+=1;continue
        # find next { or ; at depth 0
        j=i;q=None
        while j<n:
            c=s[j]
            if q:
                if c=='\\':j+=2;continue
                if c==q:q=None
            elif c in '"\'':q=c
            elif c in '{;':break
            j+=1
        if j>=n or s[j]==';':
            nodes.append(('stmt',s[i:j].strip()));i=j+1;continue
        pre=s[i:j].strip();end=find_block_end(s,j);body=s[j+1:end]
        if pre.startswith('@'):
            name=pre.split()[0].lower() if ' ' in pre or '(' in pre else pre.lower()
            if re.match(r'@(media|supports)',pre,re.I):nodes.append(('at',pre,parse(body)))
            else:nodes.append(('raw',pre+'{'+body+'}'))
        else:nodes.append(('rule',pre,body))
        i=end+1
    return nodes
def decls(body):
    out=[];i=0;n=len(body);start=0;q=None;depth=0
    for i,c in enumerate(body):
        if q:
            if c==q and body[i-1]!='\\':q=None
            continue
        if c in '"\'':q=c
        elif c=='(':depth+=1
        elif c==')':depth-=1
        elif c==';' and depth==0:out.append(body[start:i]);start=i+1
    out.append(body[start:]);res=[]
    for d in out:
        d=d.strip()
        if not d:continue
        k=d.find(':')
        if k<0:res.append((None,d,False));continue
        prop=d[:k].strip().lower();val=d[k+1:].strip()
        imp=bool(re.search(r'!\s*important\s*$',val,re.I))
        res.append((prop,d,imp,val))
    return res
norm=lambda sel:re.sub(r'\s+',' ',sel).strip()
stats={'removed':0}
def prune(nodes):
    # within this context, drop declarations overridden by a later rule with the same selector
    rules=[(idx,n) for idx,n in enumerate(nodes) if n[0]=='rule']
    parsed={idx:decls(n[2]) for idx,n in rules}
    later={} # (sel,prop) -> best importance seen later (True if !important)
    keep={}
    for idx,n in reversed(rules):
        sel=norm(n[1]);ds=parsed[idx];kept=[]
        for d in reversed(ds):
            if d[0] is None:kept.append(d[1]);continue
            prop,raw,imp,val=d
            key=(sel,prop);l=later.get(key)
            dead=l is not None and (l or not imp)
            if dead and not prop.startswith('-') and not prop.startswith('--'):
                stats['removed']+=1;continue
            kept.append(raw)
            if not prop.startswith('-') and not re.search(r'-webkit-|-moz-|-ms-',val):
                later[key]=bool(l) or imp
        keep[idx]=list(reversed(kept))
    out=[]
    for idx,n in enumerate(nodes):
        if n[0]=='rule':
            if keep[idx]:out.append(('rule',n[1],';'.join(keep[idx])))
            else:stats['removed_rules']=stats.get('removed_rules',0)+1
        elif n[0]=='at':
            ch=prune(n[2])
            if ch:out.append(('at',n[1],ch))
        else:out.append(n)
    return out
def emit(nodes):
    o=[]
    for n in nodes:
        if n[0]=='rule':o.append(n[1].strip()+'{'+n[2]+'}')
        elif n[0]=='at':o.append(n[1]+'{'+emit(n[2])+'}')
        elif n[0]=='raw':o.append(n[1])
        else:o.append(n[1]+';')
    return ''.join(o)
tree=parse(s)
res=emit(prune(tree))
open(sys.argv[2],'w',encoding='utf-8').write(res)
print(len(src),'->',len(res),stats)
