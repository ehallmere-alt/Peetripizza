/* Peetri Pizza v12.6 — fullscreen is local display only, no server writes. */
(()=>{const b=document.getElementById('pp126-fullscreen');if(!b)return;
function sync(){const active=!!document.fullscreenElement;b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'Välju täisekraanilt':'Täisekraan');const span=b.querySelector('span');if(span)span.textContent=active?'Välju':'Täisekraan';}
b.addEventListener('click',async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}else{throw Error('unsupported');}}catch(_){const toast=document.getElementById('toast');if(toast){toast.textContent='Täisekraan pole selles brauseris saadaval';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2800);}}sync();});
document.addEventListener('fullscreenchange',sync);sync();})();

/* v12.7: indicate when the statistics page is active. */
(()=>{const stats=document.querySelector('.pp126-stats-btn');if(!stats)return;
const update=()=>{const page=document.querySelector('.page.active, .page.is-active, [data-page].active');const active=!!(page&&(page.id==='statisticsPage'||page.id==='statsPage'||page.dataset.page==='statistics'));if(active)stats.setAttribute('aria-current','page');else stats.removeAttribute('aria-current');};
const target=document.querySelector('main')||document.body;
const observer=new MutationObserver(update);observer.observe(target,{subtree:true,attributes:true,attributeFilter:['class','hidden']});update();
})();
