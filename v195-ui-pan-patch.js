/* FurniPlan V195 — unified library access, final English refresh, and free plan panning */
(() => {
  'use strict';

  const AR = /[\u0600-\u06FF]/;
  const EXTRA_EN = Object.freeze({
    '▦ مكتبة':'▦ Library',
    'على iPad: اضغط القطعة ثم المس مكان وضعها، أو اسحبها من مقبض ⠿ إلى الخارطة. عند التكبير اسحب مكانًا فارغًا لتحريك الخارطة.':'On iPad: tap an item then tap its position, or drag it by the ⠿ handle onto the plan. When zoomed, drag an empty area to pan the plan.',
    'اضغط «معايرة القياس»، ثم اختر نقطتين على الخارطة تمثلان مسافة معلومة، وبعدها اكتب طولها الحقيقي بالسنتيمتر.':'Press “Calibrate Scale”, choose two known points on the plan, then enter the real distance in centimetres.',
    'اسحب الباب أو الشباك وارمه مباشرة فوق الخارطة. يمكن تعديل المقاس والدوران من الشريط السفلي.':'Drag the door or window directly onto the plan. Size and rotation can be adjusted from the bottom bar.',
    'يغيّر حجم جميع أرقام القياسات على الخارطة وفي PNG والطباعة':'Changes all measurement-number sizes on the plan, PNG, and print.',
    'يغيّر حجم جميع مسميات الخارطة دفعة واحدة، ويظهر نفس الحجم في PNG والطباعة':'Changes all plan-label sizes at once; the same size appears in PNG and print.',
    'عند التكبير: اسحب مكانًا فارغًا بالماوس أو الإصبع لتحريك الخارطة':'When zoomed, drag an empty area with the mouse or finger to pan the plan.',
    'لا توجد صورة — ستظهر كقطعة رسومية بسيطة':'No image — a simple graphic item will be shown.',
    'لم يتم اختيار شعار بعد':'No logo selected yet.',
    'جاري تجهيز البرنامج ليعمل بدون نت…':'Preparing the app for offline use…',
    'شريط «حجم القياسات» يغيّر حجم الجميع معًا.':'The “Measurement Size” control changes all of them together.',
    'اسحب المسمى على الخارطة لتغيير مكانه. شريط «حجم المسميات» يغيّر حجم الجميع معًا.':'Drag the label on the plan to move it. The “Label Size” control changes all labels together.',
    'اختر القطعة الآن، لكن يجب معايرة القياس قبل وضعها على الخارطة.':'The item is ready, but calibrate the scale before placing it on the plan.',
    'تم تجهيز ':'Prepared ',
    'اضغط مكانها على الخارطة لتُنزل بنفس القياسات والدوران والتعديلات':'Tap its place on the plan to insert it with the same dimensions, rotation, and edits.'
  });

  const language = () => {
    try { return window.FurniPlanLanguage?.get?.() === 'ar' ? 'ar' : 'en'; }
    catch (_) { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  };

  const translate = value => {
    const raw = String(value ?? '');
    if (!raw || !AR.test(raw)) return raw;
    const lead = (raw.match(/^\s*/) || [''])[0];
    const tail = (raw.match(/\s*$/) || [''])[0];
    const core = raw.trim();
    if (EXTRA_EN[core]) return lead + EXTRA_EN[core] + tail;
    try {
      const converted = window.FurniPlanLanguage?.translate?.(core);
      return lead + (converted || core) + tail;
    } catch (_) { return raw; }
  };

  function localizeNode(node) {
    if (!node) return;
    const en = language() === 'en';
    if (node.nodeType === Node.TEXT_NODE) {
      const original = node.__fpV195Arabic ?? node.nodeValue;
      if (AR.test(original || '')) node.__fpV195Arabic = original;
      if (node.__fpV195Arabic !== undefined) node.nodeValue = en ? translate(node.__fpV195Arabic) : node.__fpV195Arabic;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.id === 'fpLanguageToggle') return;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) return;
    for (const attr of ['title', 'aria-label', 'placeholder', 'alt']) {
      const key = '__fpV195Arabic_' + attr;
      const current = node.getAttribute(attr) || '';
      const original = node[key] ?? current;
      if (AR.test(original)) node[key] = original;
      if (node[key] !== undefined) node.setAttribute(attr, en ? translate(node[key]) : node[key]);
    }
    for (const child of Array.from(node.childNodes)) localizeNode(child);
  }

  function stylePrimaryLibraryButton() {
    const legacy = document.getElementById('mobileFullLibraryBtn');
    if (legacy) legacy.remove();

    const library = document.getElementById('v101Library');
    if (!library) return;
    library.classList.add('fpV195PrimaryLibrary');
    const isEn = language() === 'en';
    const label = library.querySelector('.iconLabel');
    if (label) label.textContent = isEn ? 'Library' : 'مكتبة';
    library.title = isEn ? 'Open Full Library' : 'فتح المكتبة الكاملة';
    library.setAttribute('aria-label', library.title);
  }

  function refreshLanguage() {
    if (document.body) localizeNode(document.body);
    stylePrimaryLibraryButton();
  }

  function installLanguageRefresh() {
    const api = window.FurniPlanLanguage;
    if (api && !api.__fpV195RefreshWrapped) {
      api.__fpV195RefreshWrapped = true;
      const nativeSet = typeof api.set === 'function' ? api.set.bind(api) : null;
      const nativeTranslate = typeof api.translate === 'function' ? api.translate.bind(api) : null;
      if (nativeTranslate) api.translate = value => EXTRA_EN[String(value ?? '').trim()] || nativeTranslate(value) || value;
      if (nativeSet) api.set = value => {
        const result = nativeSet(value);
        setTimeout(refreshLanguage, 0);
        setTimeout(refreshLanguage, 180);
        return result;
      };
    }
    window.addEventListener('furniplan-language-changed', () => setTimeout(refreshLanguage, 0));
    [0, 120, 500, 1200, 2600].forEach(delay => setTimeout(refreshLanguage, delay));
  }

  function installFreePlanPanning() {
    const scroller = document.getElementById('mainScroll');
    const stage = document.getElementById('stage');
    const plan = document.getElementById('canvas');
    if (!scroller || !stage || !plan || window.__fpV195FreePlanPanning) return;
    window.__fpV195FreePlanPanning = true;

    const nativeUpdate = window.updateStageSize;
    if (typeof nativeUpdate === 'function') {
      window.updateStageSize = function(...args) {
        const priorLeft = Number.parseFloat(stage.style.left) || 0;
        const priorTop = Number.parseFloat(stage.style.top) || 0;
        const result = nativeUpdate.apply(this, args);
        const displayW = Number.parseFloat(stage.style.width) || plan.clientWidth || plan.width;
        const displayH = Number.parseFloat(stage.style.height) || plan.clientHeight || plan.height;
        const viewW = Math.max(1, scroller.clientWidth);
        const viewH = Math.max(1, scroller.clientHeight);
        const scale = displayW / Math.max(1, plan.width);
        const gutterX = scale > 1.01 ? Math.min(380, Math.max(110, Math.round(viewW * 0.34))) : 28;
        const gutterY = scale > 1.01 ? Math.min(280, Math.max(84, Math.round(viewH * 0.26))) : 28;
        const contentW = Math.max(viewW + gutterX * 2, displayW + gutterX * 2);
        const contentH = Math.max(viewH + gutterY * 2, displayH + gutterY * 2);
        const left = Math.round((contentW - displayW) / 2);
        const top = Math.round((contentH - displayH) / 2);
        const wrap = stage.parentElement;
        if (wrap) {
          wrap.style.setProperty('width', contentW + 'px', 'important');
          wrap.style.setProperty('height', contentH + 'px', 'important');
        }
        stage.style.setProperty('left', left + 'px', 'important');
        stage.style.setProperty('top', top + 'px', 'important');
        const dx = left - priorLeft;
        const dy = top - priorTop;
        if (dx || dy) {
          requestAnimationFrame(() => {
            scroller.scrollLeft = Math.max(0, scroller.scrollLeft + dx);
            scroller.scrollTop = Math.max(0, scroller.scrollTop + dy);
          });
        }
        try { window.updatePanState?.(); } catch (_) {}
        return result;
      };
      window.updateStageSize();
    }

    let touchPan = null;
    const canStartTouchPan = event => {
      if (event.pointerType !== 'touch' || event.button !== 0) return false;
      if (document.getElementById('mapLockToggle')?.checked) return false;
      if (document.getElementById('fullLibraryModal')?.classList.contains('open')) return false;
      try {
        if (typeof pendingFurnitureDef !== 'undefined' && pendingFurnitureDef) return false;
        if (typeof mode !== 'undefined' && mode !== 'select') return false;
      } catch (_) {}
      const canMove = scroller.scrollWidth > scroller.clientWidth + 2 || scroller.scrollHeight > scroller.clientHeight + 2;
      if (!canMove) return false;
      if (event.target === plan) {
        try {
          const p = typeof toCanvasPos === 'function' ? toCanvasPos(event) : null;
          const hasObject = typeof hitTest === 'function' && hitTest(p);
          const hasMeasurement = typeof hitTestMeasurement === 'function' && hitTestMeasurement(p);
          const hasLabel = typeof hitTestMapLabel === 'function' && hitTestMapLabel(p);
          if (p && (hasObject || hasMeasurement || hasLabel)) return false;
        } catch (_) {}
      }
      return true;
    };
    scroller.addEventListener('pointerdown', event => {
      if (!canStartTouchPan(event)) return;
      touchPan = { id:event.pointerId, x:event.clientX, y:event.clientY, left:scroller.scrollLeft, top:scroller.scrollTop, active:false };
    }, true);
    scroller.addEventListener('pointermove', event => {
      if (!touchPan || touchPan.id !== event.pointerId) return;
      const dx = event.clientX - touchPan.x;
      const dy = event.clientY - touchPan.y;
      if (!touchPan.active && Math.hypot(dx, dy) < 7) return;
      touchPan.active = true;
      try { scroller.setPointerCapture(event.pointerId); } catch (_) {}
      scroller.scrollLeft = touchPan.left - dx;
      scroller.scrollTop = touchPan.top - dy;
      scroller.classList.add('panning');
      event.preventDefault();
      event.stopPropagation();
    }, {capture:true, passive:false});
    const endTouchPan = event => {
      if (!touchPan || touchPan.id !== event.pointerId) return;
      try { scroller.releasePointerCapture(event.pointerId); } catch (_) {}
      touchPan = null;
      scroller.classList.remove('panning');
    };
    scroller.addEventListener('pointerup', endTouchPan, true);
    scroller.addEventListener('pointercancel', endTouchPan, true);
    scroller.addEventListener('lostpointercapture', endTouchPan, true);
  }

  const css = document.createElement('style');
  css.id = 'furniplan-v195-ui-pan-style';
  css.textContent = `
    #mobileFullLibraryBtn{display:none!important}
    #modernTopToolbar #v101Library.fpV195PrimaryLibrary{
      flex:0 0 clamp(66px,calc(var(--tool-btn-w,58px) * 1.24),88px)!important;
      width:clamp(66px,calc(var(--tool-btn-w,58px) * 1.24),88px)!important;
      min-width:clamp(66px,calc(var(--tool-btn-w,58px) * 1.24),88px)!important;
      background:linear-gradient(180deg,#146c9f 0%,#0c4776 100%)!important;
      border-color:#f1b84b!important;
      box-shadow:0 0 0 1px rgba(255,221,136,.28),0 6px 16px rgba(2,20,40,.38),inset 0 1px 0 rgba(255,255,255,.18)!important;
    }
    #modernTopToolbar #v101Library.fpV195PrimaryLibrary:hover{filter:brightness(1.14)!important}
    #modernTopToolbar #v101Library.fpV195PrimaryLibrary svg{color:#ffe0a0!important;stroke:currentColor!important;transform:scale(1.11)!important}
    #modernTopToolbar #v101Library.fpV195PrimaryLibrary .iconLabel{font-weight:900!important;color:#fff8df!important}
    #mainScroll{overscroll-behavior:contain!important}
    #mainScroll.panning,#mainScroll.panning *{cursor:grabbing!important}
    @media(max-width:700px){
      #modernTopToolbar #v101Library.fpV195PrimaryLibrary{flex-basis:54px!important;width:54px!important;min-width:54px!important}
    }
  `;
  document.head.appendChild(css);
  installLanguageRefresh();
  installFreePlanPanning();
})();
