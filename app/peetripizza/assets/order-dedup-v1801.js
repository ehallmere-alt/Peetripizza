/* Peetri Pizza v18.01 — presentation-only duplicate topping cleanup.
   Never mutates order data, status, LIVE, printing, timers, or sound.
   Applies within ONE product line: different pizzas retain independent toppings. */
(function () {
  'use strict';
  if (window.PP1801OrderDedup) return;
  const root = document.getElementById('ordersPage');
  if (!root) return;

  function normalized(text) {
    return String(text || '')
      .normalize('NFKC')
      .toLocaleLowerCase('et-EE')
      .replace(/^[\s+−-]+/u, '')
      .replace(/\s+/gu, ' ')
      .trim();
  }

  function clean(line) {
    const extras = line.querySelector('.pp177-extras');
    if (!extras) return;
    // ops-v1754 copies ALL '+ LISA' toppings to green modifier chips but
    // leaves the original summary visible. Hide that copied source block.
    // The check is restricted to the same product line; no pizza is merged.
    if (extras.classList.contains('pp1754-moved')) {
      if (extras.style.getPropertyValue('display') !== 'none' ||
          extras.style.getPropertyPriority('display') !== 'important') {
        extras.style.setProperty('display', 'none', 'important');
      }
      if (!extras.hidden) extras.hidden = true;
      return;
    }
    const pills = Array.from(line.querySelectorAll(
      '.pp177-mods em, .pp94-specs:not(.pp177-extras) em'
    ));
    const shown = new Set(pills.map(el => normalized(el.textContent)).filter(Boolean));
    const items = Array.from(extras.querySelectorAll('em'));
    if (!items.length) return;

    let kept = 0;
    for (const item of items) {
      const key = normalized(item.textContent);
      const duplicate = !!key && shown.has(key);
      // Inline style prevents older card CSS from overriding the hidden attribute.
      item.style.display = duplicate ? 'none' : '';
      item.hidden = duplicate;
      if (!duplicate) kept++;
    }
    // Hide the redundant "+ LISA" summary only if all its items were
    // already rendered as pills for this exact pizza line.
    extras.style.display = kept ? '' : 'none';
    extras.hidden = kept === 0;
  }

  let scheduled = false;
  function update() {
    scheduled = false;
    root.querySelectorAll('.product-line').forEach(clean);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(root, {childList:true, subtree:true});
  window.addEventListener('pp145:orders', schedule);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
  schedule();

  window.PP1801OrderDedup = Object.freeze({update:schedule, readOnly:true});
})();