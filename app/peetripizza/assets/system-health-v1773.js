
(() => {
  'use strict';
  if(window.PP1773Health) return;

  const $=id=>document.getElementById(id);
  const page=$('settingsPage');
  const old=$('pp1769-health');
  if(!page||!old) return;

  const host=old.closest('.ppmod');
  if(!host) return;

  const style=document.createElement('style');
  style.textContent=`
    #pp1773{margin:14px 0}
    #pp1773 .cards{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:9px
    }
    #pp1773 .card{
      padding:13px;
      background:#f5f8f5;
      border:1px solid #dfe8e1;
      border-radius:12px;
      min-width:0
    }
    #pp1773 .label{
      font-size:12px;
      font-weight:700;
      color:#55705d
    }
    #pp1773 .value{
      margin-top:7px;
      font-size:15px;
      font-weight:700;
      color:#173d29;
      overflow-wrap:anywhere
    }
    #pp1773 .alert{
      padding:10px 12px;
      margin:12px 0;
      border-radius:10px;
      background:#fff8e8;
      border:1px solid #ead7a8;
      color:#765319;
      font-size:13px
    }
    #pp1773 details{
      margin-top:12px;
      border-top:1px solid #e2e9e4;
      padding-top:12px
    }
    #pp1773 summary{
      cursor:pointer;
      font-weight:700;
      padding:8px 0
    }
    #pp1773 .actions{
      display:flex;
      gap:10px;
      align-items:center;
      flex-wrap:wrap;
      margin-top:12px
    }
    #pp1773 button{
      padding:10px 14px;
      border-radius:9px;
      border:1px solid #cbdcd1;
      background:#f0f7f2;
      color:#205c39;
      font-weight:700
    }
    #pp1773 .small{
      font-size:12px;
      color:#64776c
    }
    #pp1773 #pp1769-health{
      margin:12px 0
    }
    #pp1773 #pp1772{
      margin:12px 0;
      padding:12px
    }
    @media(min-width:800px){
      #pp1773 .cards{
        grid-template-columns:repeat(4,minmax(0,1fr))
      }
    }
  `;
  document.head.appendChild(style);

  const ui=document.createElement('div');
  ui.id='pp1773';
  ui.innerHTML=`
    <div class="cards">
      <div class="card">
        <div class="label">SERVER</div>
        <div class="value" id="pp1773-server">Kontrollimata</div>
      </div>
      <div class="card">
        <div class="label">LIVE</div>
        <div class="value" id="pp1773-live">Kontrollimata</div>
      </div>
      <div class="card">
        <div class="label">SEADMED</div>
        <div class="value" id="pp1773-devices">Kontrollimata</div>
      </div>
      <div class="card">
        <div class="label">TURVALISUS</div>
        <div class="value" id="pp1773-security">Kontrollimata</div>
      </div>
    </div>
    <div id="pp1773-alert" class="alert" hidden></div>
    <div class="actions">
      <button type="button" id="pp1773-refresh">↻ Kontrolli</button>
      <span class="small" id="pp1773-updated"></span>
    </div>
    <details>
      <summary>Kõik kontrollid</summary>
      <div id="pp1773-details"></div>
    </details>
  `;

  host.appendChild(ui);

  const details=$('pp1773-details');

  // Preserve the existing checks, but move their
  // verbose output into a collapsible section.
  details.appendChild(old);

  const extra=$('pp1770-health-extra');
  if(extra) details.appendChild(extra);

  const legacy=$('pp1772');
  if(legacy) details.appendChild(legacy);

  const state=$('pp1769-health-state');
  if(state) state.hidden=true;

  const oldButton=$('pp1769-health-refresh');
  if(oldButton) oldButton.hidden=true;

  const write=(id,value)=>{
    const node=$(id);
    if(node) node.textContent=value;
  };

  async function request(path){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),10000);
    try{
      const res=await fetch(path,{
        credentials:'same-origin',
        cache:'no-store',
        headers:{Accept:'application/json'},
        signal:controller.signal
      });
      if(!res.ok) throw Error('HTTP '+res.status);
      const data=await res.json();
      if(!data||data.ok!==true) throw Error('API');
      return data;
    }finally{
      clearTimeout(timer);
    }
  }

  let busy=false;
  let lastCheck=0;

  async function refresh(){
    if(busy) return;
    busy=true;

    const btn=$('pp1773-refresh');
    btn.disabled=true;

    try{
      const [health,devices,website,liveCache]=await Promise.allSettled([
        request('api/system-health.php'),
        request('api/heartbeat.php'),
        request('api/site-status.php'),
        request('api/live-health-v1774.php')
      ]);

      const warnings=[];

      if(health.status==='fulfilled'){
        const checks=Array.isArray(health.value.checks)
          ?health.value.checks:[];

        const relevant=checks.filter(c=>
          ['runtime','json','curl','storage','disk'].includes(c.key)
        );

        const serverBad=relevant.some(c=>c.state==='error');
        const serverWarn=relevant.some(c=>c.state==='warn');

        write('pp1773-server',
          serverBad?'✕ Viga':
          serverWarn?'⚠ Hoiatus':'✓ Korras');

        const protection=checks.find(c=>
          c.key==='http_protection'
        );

        write('pp1773-security',
          protection?.state==='ok'?'✓ Korras':
          protection?.state==='error'?'✕ Kontrolli':
          '⚠ Kontrollimata');

        const release=checks.find(c=>c.key==='release');

        if(release?.state==='error'){
          warnings.push(
            'Versioonifailid erinevad kontrollversioonist. '+
            'Muudetud failid tuleb enne uue baasversiooni '+
            'kinnitamist üle vaadata.'
          );
        }
      }else{
        write('pp1773-server','⚠ Pole saadaval');
        write('pp1773-security','⚠ Teadmata');
      }

      if(devices.status==='fulfilled'){
        const d=devices.value;
        const now=Number(d.now)||Math.floor(Date.now()/1000);
        const rows=Array.isArray(d.devices)?d.devices:[];

        const active=rows.filter(x=>
          Number(x.seen)>0 &&
          now-Number(x.seen)<=120
        ).length;

        write('pp1773-devices',
          active+' / '+rows.length+' aktiivset');

        // Tablet telemetry is tracked separately.
        // It must not determine the LIVE orders status.
      }else{
        write('pp1773-devices','⚠ Teadmata');
      }

      // LIVE status comes from the server's recent order cache.
      // This is NOT an independent probe of the official API.
      if(liveCache.status==='fulfilled'){
        const info=liveCache.value;
        const age=Number(info.age_seconds);

        if(info.state==='fresh'){
          write('pp1773-live','✓ Tellimuste andmed värsked');
        }else if(info.state==='delayed'){
          write('pp1773-live','⚠ Andmed hilinevad · '+age+' s');
        }else if(info.state==='stale'){
          write('pp1773-live','⚠ Vananenud · '+age+' s');
        }else{
          write('pp1773-live','• Andmed puuduvad');
        }

        if(info.state==='delayed'||info.state==='stale'){
          warnings.push(
            'LIVE tellimuste kohalikud andmed on aegunud. '+
            'See ei tõenda ametliku API katkestust.'
          );
        }
      }else{
        write('pp1773-live','⚠ Kontroll pole saadaval');
      }

      if(website.status!=='fulfilled'){
        warnings.push(
          'Ametliku veebilehe andmeid ei saanud kontrollida.'
        );
      }else if(website.value.stale){
        warnings.push(
          'Veebilehe andmed pärinevad vanast vahemälust.'
        );
      }

      const alert=$('pp1773-alert');
      alert.hidden=warnings.length===0;
      alert.textContent=warnings.join(' ');

      lastCheck=Date.now();

      write('pp1773-updated',
        'Viimati kontrollitud: '+
        new Intl.DateTimeFormat('et-EE',{
          timeZone:'Europe/Tallinn',
          hour:'2-digit',
          minute:'2-digit'
        }).format(new Date(lastCheck))
      );

    }catch(_){
      write('pp1773-updated','⚠ Kontroll ebaõnnestus');
    }finally{
      busy=false;
      btn.disabled=false;
    }
  }

  $('pp1773-refresh').addEventListener('click',()=>{
    window.PP1769Modules?.refreshHealth();
    refresh();
  });

  const observer=new MutationObserver(()=>{
    if(
      page.classList.contains('active') &&
      !document.hidden &&
      Date.now()-lastCheck>30000
    ) refresh();
  });

  observer.observe(page,{
    attributes:true,
    attributeFilter:['class']
  });

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden &&
       page.classList.contains('active') &&
       Date.now()-lastCheck>30000) refresh();
  });

  window.PP1773Health=Object.freeze({
    refresh,
    officialWrites:false
  });

  if(page.classList.contains('active')) refresh();
})();
