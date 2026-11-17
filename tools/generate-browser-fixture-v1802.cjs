'use strict';
/* Generate a LOCAL, deliberately unauthenticated static browser fixture.
   No credentials, production API calls, orders or live session are imported. */
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../app/peetripizza');
const source=fs.readFileSync(path.join(dir,'dashboard.php'),'utf8');
const php=/<\?(?:php|=)[\s\S]*?\?>/g;
const result=source.replace(php,tag=>{
 if(tag.startsWith('<?php'))return '';
 if(tag.includes('pp_pizzeria')&&tag.includes("'name'"))return 'Testköök';
 if(tag.includes('pp_pizzeria')&&tag.includes("'id'"))return '65';
 return 'TEST-ONLY';
}).replace('<title>','<meta name="robots" content="noindex"><title>TEST · ');
if(result.includes('<?php')||result.includes('<?='))throw Error('Unprocessed PHP');
const file=path.join(dir,'browser-fixture-v1802.html');
fs.writeFileSync(file,result);
console.log('Generated static test-only kitchen fixture:',file);
