/* Peetri Pizza v17.67 — one shared clock for the whole kitchen screen.
   Before: about 60 separate setInterval timers (1 s, 1.5 s, 2 s, 3 s, 4 s, 5 s …), each waking the tablet on its own.
   Now: every repeating timer of 500 ms or longer runs from ONE clock that ticks twice a second, so the work of the
   same moment happens together (one style/layout pass instead of many).
   While the screen is hidden (tablet asleep, another app on top) short timers run at most once every 10 s;
   when the screen comes back every timer runs once right away. LIVE polling has its own setTimeout chain and is not
   touched here (it already pauses while hidden and refreshes the moment the screen is back).
   Must load before every other script (plain <script> at the top of <head>). */
(function(){
 'use strict';
 if(window.PPTimer)return;
 const nativeSet=window.setInterval.bind(window),nativeClear=window.clearInterval.bind(window),nativeClearT=window.clearTimeout.bind(window);
 const BASE=500,HIDDEN_MIN=10000;
 const jobs=new Map();let seq=0,master=0,stats={ticks:0,runs:0};
 function report(e){setTimeout(()=>{throw e},0);} // still reaches window.onerror → client-log
 function tick(){
  const now=Date.now(),hidden=document.hidden;stats.ticks++;
  for(const [id,j] of jobs){
   if(now<j.due)continue;
   if(hidden&&j.ms<HIDDEN_MIN&&now-j.last<HIDDEN_MIN)continue;
   j.last=now;j.due=now+j.ms-(BASE/2); // never drift by a whole tick
   stats.runs++;
   try{j.fn.apply(window,j.args)}catch(e){report(e)}
   if(!jobs.has(id))continue;
  }
 }
 function ensure(){if(!master&&jobs.size)master=nativeSet(tick,BASE);if(master&&!jobs.size){nativeClear(master);master=0;}}
 window.setInterval=function(fn,ms,...args){
  ms=Number(ms)||0;
  if(typeof fn!=='function'||ms<BASE)return nativeSet(fn,ms,...args); // strings and fast animations stay native
  const id=1e7+(++seq);const now=Date.now();
  jobs.set(id,{fn,ms,args,due:now+ms-(BASE/2),last:now});ensure();return id;
 };
 window.clearInterval=function(id){if(jobs.delete(id)){ensure();return;}nativeClear(id);};
 window.clearTimeout=function(id){if(jobs.delete(id)){ensure();return;}nativeClearT(id);};
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  const now=Date.now();for(const j of jobs.values())j.due=Math.min(j.due,now); // catch up at once
  tick();
 });
 window.PPTimer={count:()=>jobs.size,stats:()=>Object.assign({jobs:jobs.size,master:!!master},stats)};
})();
