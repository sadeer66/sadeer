'use strict';
(() => {
  const get = id => document.getElementById(id);
  const style = document.createElement('style');
  style.textContent = `
    html body #sesMenuToggle,html body #sesMenuBackdrop,html body #sesControls{display:none!important}
    #sesDesktopNavigator{box-sizing:border-box;width:min(680px,calc(100vw - 48px));max-height:calc(100dvh - 48px);overflow:auto;border:1px solid #ccb58e;border-radius:22px;padding:24px;background:#f3eadb;color:#29313b;box-shadow:0 24px 90px #0006;font-family:Tahoma,Arial;direction:rtl}
    #sesDesktopNavigator::backdrop{background:#10182699;backdrop-filter:blur(5px)}
    #sesDesktopNavigator h2{font-size:22px;margin:0 0 8px;color:#644820}
    #sesDesktopNavigator p{font-size:13px;line-height:1.8;color:#6d604d;margin:0 0 20px}
    .ses-desktop-dialog-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
    #sesDesktopNavClose{flex:0 0 auto;border:1px solid #cdbb9f;border-radius:50%;width:36px;height:36px;background:#fff8ed;color:#493c2c;font-size:22px}
    #sesDesktopNavGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
    #sesDesktopNavGrid button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:145px;padding:18px;border:1px solid #d3c2a7;border-radius:15px;background:#fffaf0;color:#3b342b;font:700 15px/1.5 Tahoma,Arial;box-shadow:0 4px 12px #6d4c2310}
    #sesDesktopNavGrid button:hover{border-color:#b57e2c;background:#f9edda;box-shadow:0 7px 18px #6d4c2320}
    #sesDesktopNavGrid svg,#sesDesktopNavGrid img{width:66px;height:66px;object-fit:contain}
    #sesDesktopNavGrid button[data-home]{background:#e8d9bf}
    #sesDesktopNavigator button:focus-visible{outline:3px solid #b47e2d;outline-offset:3px}
    #sesDesktopHomeFiles{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:0 auto 22px}
    #sesDesktopHomeFiles button{padding:10px 18px;border:1px solid #b58d50;border-radius:9px;background:#146a68;color:white;font:700 13px Tahoma,Arial}
    #sesDesktopHomeFiles button[data-save]{background:#b77e2a}
  `;
  document.head.append(style);
  const dialog = document.createElement('dialog');
  dialog.id = 'sesDesktopNavigator'; dialog.setAttribute('aria-labelledby','sesDesktopNavTitle');
  dialog.innerHTML = '<div class="ses-desktop-dialog-head"><div><h2 id="sesDesktopNavTitle"></h2><p id="sesDesktopNavHint"></p></div><button id="sesDesktopNavClose" type="button" aria-label="إغلاق">×</button></div><div id="sesDesktopNavGrid"></div>';
  document.body.append(dialog);
  let returnFocus = null, navigating = false;
  get('sesDesktopNavClose').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); } });
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
  async function command(action) {
    if (action === 'save') return get('saveUnified').onclick();
    if (action === 'open') return get('openUnified').onclick();
    throw Error('Unknown SES action');
  }
  async function navigate(id) {
    if (navigating) return;
    navigating = true;
    returnFocus = null;
    dialog.close();
    try { if (id === 'home') await get('homeButton').onclick();else await SESProject.switchTo(id); }
    catch (error) { get('projectStatus').textContent = error.message; }
    finally { navigating = false; }
  }
  function open(activeStage, english=false, source=null) {
    if (navigating || document.body.classList.contains('project-busy')) return;
    returnFocus = source;
    dialog.dir = english ? 'ltr' : 'rtl';
    get('sesDesktopNavTitle').textContent = english ? 'Your SES workspace' : 'مساحة عملك في SES';
    get('sesDesktopNavHint').textContent = english ? 'Continue your project in another program, or return home.' : 'تابع مشروعك في برنامج آخر، أو عُد إلى الصفحة الرئيسية.';
    get('sesDesktopNavClose').setAttribute('aria-label', english ? 'Close' : 'إغلاق');
    const grid = get('sesDesktopNavGrid'); grid.replaceChildren();
    const home = document.createElement('button'); home.type='button'; home.dataset.home='1';
    home.innerHTML = '<svg viewBox="0 0 64 64" fill="none" stroke="#91652a" stroke-width="3" aria-hidden="true"><path d="M9 29 32 10l23 19M16 25v29h32V25M27 54V37h10v17" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    home.append(document.createTextNode(english ? 'SES Home' : 'الرئيسية SES'));
    home.onclick = () => navigate('home'); grid.append(home);
    const ar={color:'تلوين المخطط',furni:'تخطيط الأثاث',sewer:'تمديدات المجاري',electric:'تمديدات الكهرباء'};
    const en={color:'ColorPlan',furni:'FurniPlan',sewer:'SewerPlan',electric:'ElectricalPlan'};
    for (const id of ['color','furni','sewer','electric']) {
      if (id === activeStage) continue;
      const button=document.createElement('button');button.type='button';button.dataset.stage=id;
      const art=document.querySelector('#appTabs [data-program="'+id+'"] svg')?.cloneNode(true);
      if (art) { art.innerHTML=art.innerHTML.replaceAll('art-','desktop-nav-art-');button.append(art); }
      button.append(document.createTextNode(english?en[id]:ar[id]));button.onclick=()=>navigate(id);grid.append(button);
    }
    dialog.showModal();get('sesDesktopNavClose').focus();
  }
  window.SESDesktop = {command, open, get busy() { return navigating; }};
  const homeFiles=document.createElement('div');homeFiles.id='sesDesktopHomeFiles';
  const save=document.createElement('button');save.type='button';save.dataset.save='1';save.onclick=()=>command('save');
  const restore=document.createElement('button');restore.type='button';restore.onclick=()=>command('open');
  homeFiles.append(save,restore);document.querySelector('#home .intro').after(homeFiles);
  function labels(){const en=get('descriptionLanguage').getAttribute('aria-pressed')==='true';save.textContent=en?'Save SES project':'حفظ مشروع SES';restore.textContent=en?'Open SES project':'استرجاع مشروع SES';}
  get('descriptionLanguage').addEventListener('click',labels);labels();
  document.querySelector('.home-bottom p').textContent='اختر برنامجًا للبدء، وانتقل بين البرامج من زر SES في الشريط العلوي.';
})();
