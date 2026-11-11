/* v16.9.2: restore original LIVE action, preserve source handlers and order view. */
(()=>{'use strict';
 const page=document.getElementById('ordersPage');
 const header=page?.querySelector('.pp157-list-header');
 const native=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Laadi päris tellimused ainult lugemiseks');
 if(header&&native&&!page.querySelector('.pp1692-live-mount')){
  const mount=document.createElement('div');mount.className='pp1692-live-mount';
  mount.append(native);header.append(mount);
 }
 // An obsolete team section should not appear in the drawer or settings.
 for(const element of document.querySelectorAll('#drawer nav .navitem, #settingsPage section')){
  const title=element.querySelector('h2,h3,strong')?.textContent?.trim()||element.textContent.trim();
  if(/^Köögimeeskond$/i.test(title))element.remove();
 }
})();
