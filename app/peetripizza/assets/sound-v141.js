/* Peetri Pizza v14.1 — local Web Audio notifications, never communicates with upstream API.
   v17.64: owner «эти не слышно» — new loud tones (bell, alarm, beep) in 1–3 kHz that cut through kitchen noise,
   master compressor+gain instead of the old .28 amplitude cap; old tones kept as options. */
(function(){
 'use strict';
 const AudioCtor=window.AudioContext||window.webkitAudioContext;
 const allowedTones=new Set(['bell','alarm','beep','double','classic','soft']);
 const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v===null?fallback:v}catch(_){return fallback}};
 const TONE_KEY='pp-sound-tone-v1764';
 const state={tone:read(TONE_KEY,'bell'),volume:read('pp-sound-volume-v141',80)};
 if(!allowedTones.has(state.tone))state.tone='bell';
 state.volume=Math.max(0,Math.min(100,Number(state.volume)||0));
 let ctx=null,bus=null,needsGesture=true,failed=false,activePromise=null;
 const id=name=>document.getElementById(name);
 const enabled=()=>!!read('pp-sound-v1',false);
 const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
 function update(){
   const status=id('pp141-sound-status-text'),dot=id('pp141-sound-status-dot');
   const btn=id('pp141-activate-sound');
   if(!status)return;
   let message,kind;
   if(!AudioCtor){message='See brauser ei toeta Web Audio heli';kind='error';}
   else if(!enabled()){message='Heliteavitused on välja lülitatud';kind='off';}
   else if(ctx?.state==='running'){
     message=state.volume===0?'Heli aktiveeritud · helitugevus 0%':'Heli aktiveeritud · valmis uueks tellimuseks';kind='ok';
   }else if(failed){message='Heli ei käivitu · puuduta „Aktiveeri heli”';kind='warn';}
   else {message='Heli vajab üht puudutust · vali „Aktiveeri heli”';kind='warn';}
   status.textContent=message;dot.dataset.state=kind;
   if(btn){btn.disabled=!AudioCtor;btn.textContent=ctx?.state==='running'?'✓ Heli aktiivne':'▶ Aktiveeri heli';}
   const range=id('pp141-sound-volume');if(range)range.value=String(state.volume);
   const label=id('pp141-volume-value');if(label)label.textContent=state.volume+'%';
   const select=id('pp141-sound-tone');if(select)select.value=state.tone;
 }
 function unlock(){
   if(!AudioCtor){failed=true;update();return Promise.resolve(false)}
   try{
     if(!ctx){ctx=new AudioCtor();ctx.onstatechange=()=>{needsGesture=ctx.state!=='running';update()};
       try{const comp=ctx.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=6;comp.ratio.value=8;comp.attack.value=.002;comp.release.value=.15;
         const g=ctx.createGain();g.gain.value=1.6;comp.connect(g);g.connect(ctx.destination);bus=comp;}catch(_){bus=null;}}
     if(ctx.state==='running'){needsGesture=false;failed=false;update();return Promise.resolve(true)}
     // Always call resume directly from gesture event when possible.
     if(!activePromise){activePromise=ctx.resume().then(()=>{
       needsGesture=ctx.state!=='running';failed=needsGesture;update();return !needsGesture;
     }).catch(()=>{failed=true;needsGesture=true;update();return false}).finally(()=>{activePromise=null});}
     update();return activePromise;
   }catch(_){failed=true;needsGesture=true;update();return Promise.resolve(false)}
 }
 function oscillatorAt(start,hz,duration,wave,level){
   const osc=ctx.createOscillator(),env=ctx.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(hz,start);
   const amplitude=Math.max(.0001,Math.min(1,level*(state.volume/100)));
   env.gain.setValueAtTime(.0001,start);
   env.gain.exponentialRampToValueAtTime(amplitude,start+.015);
   env.gain.exponentialRampToValueAtTime(.0001,start+duration);
   osc.connect(env);env.connect(bus||ctx.destination);
   osc.start(start);osc.stop(start+duration+.015);
   osc.onended=()=>{osc.disconnect();env.disconnect()};
 }
 // v17.64 bell: inharmonic partials like a counter bell, decays naturally
 function bellAt(t,hz,level){
   [[1,1,1.1],[2.76,.55,.7],[5.4,.3,.45],[8.93,.15,.3]].forEach(([m,l,d])=>{
     const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(hz*m,t);
     const a=Math.max(.0001,Math.min(1,level*l*(state.volume/100)));
     env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(a,t+.004);env.gain.exponentialRampToValueAtTime(.0001,t+d);
     osc.connect(env);env.connect(bus||ctx.destination);osc.start(t);osc.stop(t+d+.02);osc.onended=()=>{osc.disconnect();env.disconnect()};
   });
 }
 function urgentPattern(){
   if(!ctx||ctx.state!=='running'||state.volume<=0||document.hidden)return false;
   try{const t=ctx.currentTime+.025;
     for(let i=0;i<4;i++){oscillatorAt(t+i*.16,2400,.1,'square',.55);}
     for(let i=0;i<4;i++){oscillatorAt(t+.8+i*.16,2400,.1,'square',.55);}return true;
   }catch(_){return false}
 }
 function offlinePattern(){
   if(!ctx||ctx.state!=='running'||state.volume<=0||document.hidden)return false;
   try{const t=ctx.currentTime+.025;oscillatorAt(t,880,.25,'square',.4);oscillatorAt(t+.3,587,.4,'square',.4);return true;}catch(_){return false}
 }
 function soundPattern(){
   if(!ctx||ctx.state!=='running'||state.volume<=0||document.hidden)return false;
   try{
     const t=ctx.currentTime+.025;
     if(state.tone==='bell'){bellAt(t,1320,.9);bellAt(t+.45,1320,.9);bellAt(t+.9,1760,1);}
     else if(state.tone==='alarm'){for(let i=0;i<3;i++){oscillatorAt(t+i*.5,1000,.22,'square',.5);oscillatorAt(t+i*.5+.24,1500,.22,'square',.5);}}
     else if(state.tone==='beep'){for(let i=0;i<3;i++){oscillatorAt(t+i*.3,2000,.18,'square',.55);}}
     else if(state.tone==='classic')oscillatorAt(t,820,.25,'sine',.5);
     else if(state.tone==='soft'){
       oscillatorAt(t,560,.22,'sine',.4);oscillatorAt(t+.25,710,.31,'sine',.38);
     }else{
       oscillatorAt(t,880,.17,'triangle',.6);oscillatorAt(t+.23,1100,.23,'triangle',.55);
     }
     return true;
   }catch(_){failed=true;update();return false}
 }
 // Play works after a user interaction has unlocked the persistent context.
 // Don't silently spawn a new context from polling: browsers routinely block that.
 function play(kind){
   if(!enabled()||!AudioCtor||document.hidden)return false;
   if(!ctx||ctx.state!=='running'){needsGesture=true;update();return false}
   return kind==='offline'?offlinePattern():kind==='urgent'?urgentPattern():soundPattern();
 }
 // Explicit user action: creation/resume occurs synchronously before async callbacks.
 function preview(kind){
   const task=unlock();
   task.then(ok=>{if(ok)(kind==='urgent'?urgentPattern():kind==='offline'?offlinePattern():soundPattern())});
 }
 document.addEventListener('pointerdown',e=>{
   if(!enabled()||!AudioCtor||(!needsGesture&&ctx?.state==='running'))return;
   // Enabling through the settings toggle fires change after pointerdown.
   unlock();
 },{capture:true,passive:true});
 document.addEventListener('keydown',e=>{
   if(!enabled()||!AudioCtor||e.repeat||(!needsGesture&&ctx?.state==='running'))return;
   unlock();
 },{capture:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled())update()});
 id('pp141-sound-tone')?.addEventListener('change',e=>{if(!allowedTones.has(e.target.value))return;state.tone=e.target.value;save(TONE_KEY,state.tone);update();preview()});
 id('pp141-sound-volume')?.addEventListener('input',e=>{state.volume=Math.max(0,Math.min(100,Number(e.target.value)||0));save('pp-sound-volume-v141',state.volume);update()});
 id('pp141-activate-sound')?.addEventListener('click',()=>{unlock()});
 id('pp141-test-sound')?.addEventListener('click',()=>preview());
 window.addEventListener('storage',e=>{if(['pp-sound-v1',TONE_KEY,'pp-sound-volume-v141'].includes(e.key)){
   state.tone=read(TONE_KEY,'bell');if(!allowedTones.has(state.tone))state.tone='bell';state.volume=Math.max(0,Math.min(100,Number(read('pp-sound-volume-v141',80))||0));update();
 }});
 window.PPSound={play,unlock,preview,sync:update,diagnostics:()=>({supported:!!AudioCtor,enabled:enabled(),state:ctx?.state||'not-initialized',tone:state.tone,volume:state.volume})};
 update();
})();
