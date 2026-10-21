'use strict';
(() => {
  const stage = document.documentElement.dataset.sesStage;
  if (!stage || !parent.SESDesktop) return;
  const get = id => document.getElementById(id);
  const english = () => window.FurniPlanLanguage?.get?.() === 'en' || document.documentElement.lang === 'en';
  const style = document.createElement('style');
  style.textContent = `
    html body #sesDesktopSwitch{display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:6px!important;flex:0 0 auto!important;order:-3!important;width:auto!important;min-width:78px!important;height:38px!important;min-height:38px!important;padding:3px 9px!important;border:1px solid #d4ad62!important;border-radius:8px!important;background:#b77e2a!important;color:#fff!important;box-shadow:inset 0 1px #fff4!important;cursor:pointer!important;white-space:nowrap!important;font:800 14px Arial,Tahoma!important}
    html body #sesDesktopSwitch img{width:29px!important;height:29px!important;object-fit:contain!important;border-radius:5px!important}
    html body #sesDesktopSwitch:hover{background:#d0983f!important}
    html body .ses-desktop-file-actions{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:7px!important;padding:5px 0!important;flex:0 0 auto!important;max-width:100%!important}
    html body .ses-desktop-file-actions button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;flex:0 0 auto!important;width:auto!important;min-width:145px!important;max-width:100%!important;min-height:40px!important;height:auto!important;padding:9px 12px!important;border-radius:8px!important;white-space:normal!important;line-height:1.4!important;font:700 13px Tahoma,Arial!important;cursor:pointer!important}
    html body #sesDesktopSave{background:#b77e2a!important;border:1px solid #edc783!important;color:#fff!important}
    html body #sesDesktopOpen{background:#146a68!important;border:1px solid #66bab5!important;color:#fff!important}
    html body .ses-desktop-file-actions button:hover{filter:brightness(1.12)!important}
    html body #sesDesktopFileStatus{font:12px/1.5 Tahoma,Arial!important;color:inherit!important;margin:4px 0!important;max-width:300px!important}
    html body #filePanel .ses-desktop-file-actions{flex-direction:column!important;align-items:stretch!important}
    html body #filePanel .ses-desktop-file-actions button{width:100%!important}
    #sesDesktopSwitch:focus-visible,.ses-desktop-file-actions button:focus-visible{outline:3px solid #ffe49c!important;outline-offset:2px!important}
  `;
  document.head.append(style);
  let queued = false;
  const switchButton = document.createElement('button');
  switchButton.id = 'sesDesktopSwitch'; switchButton.type = 'button';
  switchButton.dataset.fp222Label = '1';
  switchButton.setAttribute('aria-haspopup', 'dialog');
  switchButton.innerHTML = '<img src="../../assets/icons/ses-180-v9.png" alt=""><span>SES</span>';
  switchButton.onclick = () => parent.SESDesktop.open(stage, english(), switchButton);
  const actions = document.createElement('div');
  actions.className = 'ses-desktop-file-actions';
  actions.setAttribute('role', 'group');
  const save = document.createElement('button'); save.id='sesDesktopSave'; save.type='button'; save.dataset.fp222Label='1';
  const open = document.createElement('button'); open.id='sesDesktopOpen'; open.type='button'; open.dataset.fp222Label='1';
  actions.append(save, open);
  const status = document.createElement('p'); status.id='sesDesktopFileStatus'; status.setAttribute('role','status');
  const update = (el, value) => { if (el.textContent !== value) el.textContent = value; };
  async function command(action) {
    try { await parent.SESDesktop.command(action); }
    catch (error) { status.textContent = error.message; }
  }
  save.onclick = () => command('save'); open.onclick = () => command('open');
  function install() {
    queued = false;
    const host = stage === 'color' ? document.querySelector('.top') : stage === 'furni' ? get('fp222Tabs') : get('sewerRibbonTabs');
    const file = stage === 'color' ? get('filePanel')?.querySelector('.file-action-list') : stage === 'furni' ? get('fp222-panel-file') : get('sewerPane_file');
    if (host && switchButton.parentElement !== host) host.prepend(switchButton);
    if (file && actions.parentElement !== file) { file.prepend(actions); actions.after(status); }
    const en = english();
    update(save, en ? 'Save SES project' : 'حفظ مشروع SES');
    update(open, en ? 'Open SES project' : 'استرجاع مشروع SES');
    switchButton.title = en ? 'SES — switch programs or go home' : 'SES — التنقل بين البرامج والرئيسية';
    switchButton.setAttribute('aria-label', switchButton.title);
    actions.setAttribute('aria-label', en ? 'Unified SES project' : 'مشروع SES الموحّد');
  }
  const schedule = () => { if (!queued) { queued=true; requestAnimationFrame(install); } };
  new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true});
  window.addEventListener('furniplan-language-changed', schedule);
  new MutationObserver(schedule).observe(document.documentElement, {attributes:true, attributeFilter:['lang','dir']});
  parent.document.getElementById('projectStatus') && new MutationObserver(() => {
    status.textContent = parent.document.getElementById('projectStatus').textContent;
  }).observe(parent.document.getElementById('projectStatus'), {childList:true, subtree:true});
  install();
})();
