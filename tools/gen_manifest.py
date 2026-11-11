import hashlib,os,sys
root,ver=sys.argv[1],sys.argv[2];os.chdir(root)
out=["<?php","/** Auto-generated %s file checksum map; do not include this file itself. */"%ver,"return ["]
files=sorted(os.path.join(d,f)[2:] for d,_,fs in os.walk('.') for f in fs if os.path.join(d,f)[2:]!='tools/release-manifest.php')
out+=["    '%s' => '%s',"%(r,hashlib.sha256(open(r,'rb').read()).hexdigest()) for r in files]
open('tools/release-manifest.php','w').write("\n".join(out+["];"])+"\n");print(len(files))
