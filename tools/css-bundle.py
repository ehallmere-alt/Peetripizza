#!/usr/bin/env python3
"""Peetri Pizza: glue the head stylesheets of dashboard.php into one file (same order, comments stripped).
usage: css-bundle.py APP_DIR OUT_NAME   e.g. css-bundle.py app/peetripizza app-v1748.css
Takes every <link rel="stylesheet" href="assets/..."> and inline <style> (except the boot guard) between the first
and the last stylesheet link in <head>, writes assets/OUT_NAME, and replaces that span with one <link>.
The original links stay in an HTML comment right after it (smoke check + humans see what is inside).
Run it on a dashboard.php that still has the separate links."""
import sys,re,os
app,out=sys.argv[1:3]
def strip_comments(s):
    o=[];i=0;n=len(s);q=None
    while i<n:
        c=s[i]
        if q:
            o.append(c)
            if c=='\\' and i+1<n:o.append(s[i+1]);i+=2;continue
            if c==q:q=None
            i+=1;continue
        if c in '"\'':q=c;o.append(c);i+=1;continue
        if s.startswith('/*',i):
            j=s.find('*/',i+2);i=n if j<0 else j+2;continue
        o.append(c);i+=1
    return ''.join(o)
p=os.path.join(app,'dashboard.php');html=open(p,encoding='utf-8').read()
head_end=html.index('</head>')
tok=re.compile(r'<link rel="stylesheet" href="(assets/[^"?]+\.css)(\?[^"]*)?">|<style>(.*?)</style>',re.S)
items=[m for m in tok.finditer(html,0,head_end)]
links=[m for m in items if m.group(1)]
if not links:raise SystemExit('no stylesheet links (already bundled?)')
a,b=links[0].start(),links[-1].end()
span=[m for m in items if a<=m.start()<b]
parts=[];names=[]
for m in span:
    if m.group(1):
        css=open(os.path.join(app,m.group(1)),encoding='utf-8').read();names.append(m.group(0))
        parts.append('/* == '+m.group(1)+' == */\n'+strip_comments(css).strip())
    else:
        parts.append('/* == inline style == */\n'+m.group(3).strip());names.append('<style>…</style>')
body='\n'.join(parts)+'\n'
open(os.path.join(app,'assets',out),'w',encoding='utf-8').write('/* Peetri Pizza: dashboard stylesheets in one file, same order as before (tools/css-bundle.py). Do not edit; edit the sources and rebuild. */\n'+body)
import hashlib
v=hashlib.sha256(body.encode()).hexdigest()[:10]
src='<!-- assets/'+out+' = these, in this order: '+' '.join(x for x in names if x.startswith('<link'))+' -->'
html=html[:a]+'<link rel="stylesheet" href="assets/'+out+'?v='+v+'">'+src+html[b:]
open(p,'w',encoding='utf-8').write(html)
print(out,len(body),'bytes from',len(names),'parts')
