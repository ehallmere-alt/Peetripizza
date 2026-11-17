/* v18.02.2: presentation-only enhancement of existing read-only Tooted LIVE.
   Does not fetch, send, or modify kitchen data. */
(() => {
  'use strict';
  const init = () => {
    const list = document.getElementById('pp1769-products');
    const refresh = document.getElementById('pp1769-products-refresh');
    if (!list || !refresh || list.dataset.compact18022) return false;
    const card = list.closest('.ppmod');
    if (!card || !card.querySelector('h3')?.textContent.includes('Tooted LIVE')) return false;
    list.dataset.compact18022 = '1';
    const summary = document.createElement('p');
    summary.className = 'pp18022-summary';
    summary.setAttribute('aria-live','polite');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'pp18022-toggle';
    toggle.textContent = 'Vaata üksikasju';
    toggle.setAttribute('aria-expanded','false');
    const detailId = 'pp1769-products';
    toggle.setAttribute('aria-controls',detailId);
    list.hidden = true;
    list.style.display = 'none';
    list.before(summary);
    refresh.after(toggle);
    const update = () => {
      const items = [...list.querySelectorAll('li')];
      const products = items.filter(x => x.textContent.trim().startsWith('📦')).length;
      const toppings = items.filter(x => x.textContent.trim().startsWith('➕')).length;
      summary.textContent = 'Puuduvad tooted: ' + products + ' · Lisandid: ' + toppings;
    };
    const observer = new MutationObserver(update);
    observer.observe(list,{childList:true,subtree:true,characterData:true});
    update();
    toggle.addEventListener('click',() => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent = open ? 'Peida üksikasjad' : 'Vaata üksikasju';
      list.hidden = !open;
      list.style.display = open ? 'block' : 'none';
    });
    return true;
  };
  if (!init()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (init() || ++tries >= 30) clearInterval(timer);
    },300);
  }
})();
