/* V129: relocate existing appearance controls; keep all V127 actions intact. */
(function(){'use strict';
function boot(){
 const tablet=/iPad/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Macintosh/i.test(navigator.userAgent))||(/Android/i.test(navigator.userAgent)&&Math.min(screen.width,screen.height)>=600);
 if(tablet)document.documentElement.classList.add('sewer-tablet-ui');
 const header=document.getElementById('sewerRibbonHeader'),panel=document.getElementById('sewerInterfacePanel'),scroll=document.getElementById('sewerPrimaryScroll'),modes=document.getElementById('sewerModeDock');
 if(!header||!panel||!scroll)return;
 const dock=document.createElement('div');dock.id='sewerSizeDock';header.prepend(dock);dock.append(panel);
 const brand=document.createElement('span');brand.id='sewerCompactBrand';brand.dir='ltr';brand.innerHTML='<span>Sewer</span><span>Plan</span>';dock.append(brand);
 if(modes)scroll.prepend(modes);
 const css=document.createElement('style');css.textContent=`
 html body #sewerOrientationScreen{display:none!important;pointer-events:none!important}
 html.sewer-tablet-ui body.sewer-ribbon-ui .app{grid-template-columns:min(190px,25vw) minmax(0,1fr)!important;direction:rtl!important}
 html.sewer-tablet-ui body.sewer-ribbon-ui .app>main{grid-column:2!important;grid-row:2!important}
 html.sewer-tablet-ui body.sewer-ribbon-ui .app>aside{position:relative!important;grid-column:1!important;grid-row:2!important;inset:auto!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;transform:none!important;visibility:visible!important;pointer-events:auto!important;transition:none!important;overflow-y:auto!important;touch-action:pan-y!important}
 html.sewer-tablet-ui body.sewer-ribbon-ui .app .appRights{grid-column:1/-1!important}
 html.sewer-tablet-ui body.sewer-ribbon-ui.sewer-hide-library .app{grid-template-columns:0 minmax(0,1fr)!important}
 html.sewer-tablet-ui #sewerPhoneClose,html.sewer-tablet-ui #sewerLibraryCategories{display:none!important}

 html body.sewer-ribbon-ui #sewerRibbonHeader{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:7px!important;direction:rtl!important}
 html body.sewer-ribbon-ui #sewerSizeDock{grid-column:1!important;grid-row:1!important;display:flex!important;align-items:center!important;gap:7px!important;direction:rtl;width:max-content;align-self:start}
 html body.sewer-ribbon-ui #sewerPrimaryScroll{grid-column:2!important;grid-row:1!important;min-width:0!important}
 html body.sewer-ribbon-ui #sewerSizeDock #sewerInterfacePanel{gap:5px!important;flex-direction:column!important;width:132px!important}
 html body.sewer-ribbon-ui #sewerSizeDock .modernSliderBox{display:grid!important;grid-template-columns:90px 32px!important;grid-template-rows:12px 18px!important;width:132px!important;min-width:132px!important;height:32px!important;min-height:32px!important;max-height:32px!important;padding:0 3px!important;gap:0!important}
 html body.sewer-ribbon-ui #sewerSizeDock .modernSliderBox>span:first-child{font:9px/12px Tahoma,Arial!important}
 html body.sewer-ribbon-ui #sewerSizeDock input[type=range]{width:90px!important;min-width:90px!important;height:18px!important;min-height:18px!important;max-height:18px!important;direction:ltr!important}
 html body.sewer-ribbon-ui #sewerSizeDock .sliderValue{font-size:9px!important;min-width:0!important}
 html body.sewer-ribbon-ui #sewerSizeDock input::-webkit-slider-runnable-track{background:linear-gradient(to right,#69839f 0%,#69839f var(--fill),#435c76 var(--fill),#435c76 100%)!important}
 html body.sewer-ribbon-ui #sewerSizeDock input::-moz-range-track{background:linear-gradient(to right,#69839f 0%,#69839f var(--fill),#435c76 var(--fill),#435c76 100%)!important}
 html body.sewer-ribbon-ui #sewerSizeDock input::-webkit-slider-thumb{background:#e0ae53!important;border-color:#e0ae53!important}
 html body.sewer-ribbon-ui #sewerSizeDock input::-moz-range-thumb{background:#e0ae53!important;border-color:#e0ae53!important}
 #sewerCompactBrand{font:800 15px/1 Arial,sans-serif!important;white-space:nowrap!important;flex-shrink:0}
 #sewerCompactBrand>span:first-child{color:#f4f7fc!important}#sewerCompactBrand>span:last-child{color:#e0ae53!important}
 @media(max-width:500px){#sewerCompactBrand{font-size:11px!important}html body.sewer-ribbon-ui #sewerRibbonHeader{gap:3px!important}html body.sewer-ribbon-ui #sewerSizeDock{gap:3px!important}}
 `;document.head.append(css);
 for(const input of panel.querySelectorAll('input[type=range]')){const paint=()=>input.style.setProperty('--fill',((input.value-input.min)/(input.max-input.min)*100)+'%');input.addEventListener('input',paint);paint();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
