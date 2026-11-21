/* PP 18.01 — verified public reference data from peetripizza.ee (read-only).
   Never substitutes or invents upstream pizzeria IDs. No checkout, availability
   writes, authentication changes, official order changes or LIVE requests.
   Public menu names may vary by pizzeria; this is not a live stock API. */
(function () {
  'use strict';
  if (window.PP1801OfficialReference) return;

  const MENU_URL = 'https://www.peetripizza.ee/pizzeria/haapsalu-kaubamaja';
  const PLACES_URL = 'https://www.peetripizza.ee/index.php/telli';
  // Official Haapsalu Kaubamaja page, checked 17.11.2026.
  const MENU = Object.freeze({
    Pitsad: [
      'Margherita','Pepperoni','Peetri Pizza','Mafioso','Cananas',
      'Primavera Verde','Macho Pizza','Crazy Pepperoni','Oma Pizza',
      'Francescana','Margherita singiga','Investor Pets','Laste eine',
      'Fitlap Pizza tuunikalaga','Fitlap Pizza rostbiifiga',
      'Fitlap Pizza kanaga','Marcello Pizza','Vegetariana','Pizza Picante',
      'Topolino','Romana','Peetri Pepperone','Kebab','Hawaij Pizza',
      'Frutti Di Mare','Bolognese','Siciliana','Americana','Al Tonno',
      'Pool Cananas pool Margherita'
    ],
    Pastad: [
      'Bolognese','Carbonara','Fitlap Kanapasta','Fitlap Krevetipasta',
      'Fitlap Seenepasta','Fungi Pasta','Pollo'
    ],
    Joogid: [
      'Coca Cola','Coca Cola või Pepsi','Coca-Cola','Coca-Cola Zero',
      'Fanta','Fuzetea Lemon','Fuzetea Peach','Fuzetea green',
      'Neptunas mulliga','Neptunas mullita','Red Bull','Sprite','Vesi'
    ]
  });
  // Public store names. NOT login IDs or a statement of currently open locations.
  const LOCATIONS = Object.freeze([
    ['Tartu','Aardla'],['Narva','Fama Keskus'],['Tallinn','Haabersti'],
    ['Haapsalu','Haapsalu Kaubamaja'],['Tallinn','Hiiu (Tallinn)'],
    ['Tartu','Jaamamõisa Selver'],['Tallinn','JK Tallinna Kalev'],
    ['Jõgeva','Jõgeva'],['Jõhvi','Jõhvi bussijaam'],
    ['Jüri','Jüri, Aleviku tn'],['Tallinn','Kadaka tee'],
    ['Hiiumaa','Kärdla'],['Keila','Keila'],['Tallinn','Kolde Selver'],
    ['Kose','Kose'],['Tallinn','Kristiine (Sõpruse Rimi)'],
    ['Tallinn','Lasnamäe, Linnamäe'],['Tallinn','Lasnamäe, Virbi'],
    ['Laulasmaa','Laulasmaa'],['Tallinn','Liivalaia'],
    ['Maardu','Maardu'],['Märjamaa','Märjamaa'],
    ['Tallinn','Mustamäe (Magistral)'],['Tallinn','Narva mnt'],
    ['Tallinn','Nurmenuku'],['Tallinn','Odra'],
    ['Otepää','Otepää Golf & Country Club'],['Paldiski','Paldiski'],
    ['Peetri','Peetri Selver'],['Tallinn','Pirita Selver'],
    ['Tallinn','Pirita tee'],['Rakvere','Rakvere'],['Tallinn','Raudalu'],
    ['Tallinn','Roosikrantsi'],['Saaremaa','Saaremaa (Auriga kaubanduskeskus)'],
    ['Saku','Saku'],['Saue','Saue'],['Tallinn','Seitse Merd Pubi'],
    ['Sillamäe','Sillamäe'],['Tallinn','Tähesaju COOP'],
    ['Tallinn','Telliskivi'],['Pärnu','Ülejõe Selver'],
    ['Tallinn','Unibet Arena'],['Tallinn','Valdeku'],
    ['Tartu','Veeriku'],['Viimsi','Viimsi'],['Tallinn','Vilde tee'],
    ['Võru','Võru Rimi'],['Tartu','Vudila Go']
  ]);

  function tag(name, className, content) {
    const el = document.createElement(name);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = String(content);
    return el;
  }

  function link(url, label) {
    const a = tag('a', '', label);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function norm(text) {
    return String(text).toLocaleLowerCase('et-EE').trim();
  }

  function menuSection(page) {
    if (!page || document.getElementById('pp1801-menu')) return;
    const section = tag('section', 'pp1801-reference');
    section.id = 'pp1801-menu';
    section.append(tag('h3','','Ametlikud tooted · avalik menüü'));
    section.append(tag('p', '',
      'Päris Peetri Pizza toodete nimed (näidis: Haapsalu Kaubamaja). ' +
      'Saadavus ja hinnad võivad pitseeriate kaupa erineda. Ainult lugemiseks.'
    ));
    const tabs = tag('div', 'pp1801-cats');
    const search = tag('input');
    search.type = 'search';
    search.placeholder = 'Otsi ametlikku toodet';
    search.setAttribute('aria-label','Otsi ametlikku toodet');
    const list = tag('ul', 'pp1801-grid');
    list.setAttribute('aria-label','Ametlikud tootenimed');
    const footer = tag('p','pp1801-meta');
    footer.append('Allikas: ');
    footer.append(link(MENU_URL,'peetripizza.ee · Haapsalu Kaubamaja'));
    footer.append(' · Kontrollitud 17.11.2026 · ei muuda toodete saadavust');
    section.append(tabs, search, list, footer);
    let category='Kõik';
    for (const name of ['Kõik',...Object.keys(MENU)]) {
      const b=tag('button','',name);
      b.type='button';
      b.setAttribute('aria-pressed',String(name===category));
      b.addEventListener('click',()=>{
        category=name;
        tabs.querySelectorAll('button').forEach(btn=>
          btn.setAttribute('aria-pressed',String(btn===b))
        );
        render();
      });
      tabs.append(b);
    }
    function render(){
      const q=norm(search.value);
      list.replaceChildren();
      for(const [cat,names] of Object.entries(MENU)){
        if(category!=='Kõik' && cat!==category)continue;
        for(const name of names){
          if(q && !norm(name).includes(q))continue;
          const li=tag('li','',name);
          li.setAttribute('data-category',cat);
          list.append(li);
        }
      }
      if(!list.children.length)list.append(tag('li','','Tooteid ei leitud.'));
    }
    search.addEventListener('input',render);
    render();
    (page.querySelector('.pp140-kpis')||page.querySelector('.pp140-toolbar')||page.firstElementChild)
      .before(section);
  }

  function branchDirectory(mount, onLogin) {
    if (!mount || document.getElementById(onLogin?'pp1801-branches-login':'pp1801-branches-settings')) return;
    const box=tag('details','pp1801-reference');
    box.id=onLogin?'pp1801-branches-login':'pp1801-branches-settings';
    box.append(tag('summary','', 'Pitseeriad · ametlik avalik nimekiri ('+LOCATIONS.length+')'));
    const note=tag('p','pp1801-warning',
      'See on avalik infoloend, mitte sisselogimisvalik. ' +
      'Köögiga saab ühendada ainult serveris seadistatud pitseeria tegeliku ID ja parooliga.'
    );
    const input=tag('input');
    input.type='search';
    input.placeholder='Otsi linna või pitseeriat';
    input.setAttribute('aria-label','Otsi avalikust pitseeriate nimekirjast');
    const list=tag('ul','pp1801-location-list');
    const foot=tag('p','pp1801-meta');
    foot.append('Allikas: ');
    foot.append(link(PLACES_URL,'peetripizza.ee · Pitseeriad'));
    foot.append(' · Kontrollitud 17.11.2026; lahtioleku olek võib muutuda.');
    box.append(note,input,list,foot);
    function render(){
      list.replaceChildren();
      const q=norm(input.value);
      for(const [city,name] of LOCATIONS){
        if(q&&!norm(city+' '+name).includes(q))continue;
        const li=tag('li');
        li.append(tag('strong','',name),tag('small','',city));
        list.append(li);
      }
      if(!list.children.length)list.append(tag('li','','Pitseeriat ei leitud.'));
    }
    input.addEventListener('input',render);
    render();
    if(onLogin)mount.insertAdjacentElement('afterend',box);
    else mount.append(box);
  }

  function init() {
    menuSection(document.getElementById('productsPage'));
    const settings=document.querySelector('#settingsPage .panel');
    branchDirectory(settings,false);
    const login=document.querySelector('#pl-form fieldset.pl-field');
    branchDirectory(login,true);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else init();
  window.PP1801OfficialReference=Object.freeze({
    mode:'public-readonly-snapshot',updated:'2026-11-17',
    productCount:Object.values(MENU).reduce((n,items)=>n+items.length,0),
    branchCount:LOCATIONS.length
  });
})();