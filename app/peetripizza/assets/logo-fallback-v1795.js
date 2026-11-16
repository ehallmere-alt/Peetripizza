(() => {
  'use strict';

  function init() {
    document.querySelectorAll('.pp-logo-slot img').forEach(img => {
      const fallback = img.nextElementSibling;

      if (!fallback ||
          !fallback.classList.contains('pp-logo-fallback')) return;

      const showFallback = () => {
        img.hidden = true;
        fallback.hidden = false;
      };

      img.addEventListener('error', showFallback);

      if (img.complete && img.naturalWidth === 0) {
        showFallback();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
