/* iPad sidebar only: keep the original mobile/portrait runtime intact. */
(function(){'use strict';
 const isIPad=/iPad/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&(/Macintosh/i.test(navigator.userAgent)||navigator.platform==='MacIntel'));
 if(!isIPad)return;
 document.documentElement.classList.add('sewer-ipad-library');
 const style=document.createElement('style');style.textContent=`
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app{direction:rtl!important;grid-template-columns:min(190px,25vw) minmax(0,1fr)!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>header{grid-column:1/-1!important;grid-row:1!important;width:100%!important;min-width:0!important;box-sizing:border-box!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>aside .libraryBrowser,html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>aside #library{display:block!important;height:auto!important;min-height:0!important;max-height:none!important;align-content:start!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>aside .sewerLibraryLayerBox{height:auto!important;min-height:0!important;max-height:none!important;align-self:start!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>main{grid-column:2!important;grid-row:2!important;min-width:0!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>aside{position:relative!important;grid-column:1!important;grid-row:2!important;inset:auto!important;transform:none!important;visibility:visible!important;pointer-events:auto!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;max-height:none!important;transition:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;box-sizing:border-box!important;z-index:10!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app .appRights{grid-column:1/-1!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui.sewer-hide-library .app{grid-template-columns:0 minmax(0,1fr)!important}
 html.sewer-ipad-library #sewerPhoneClose,html.sewer-ipad-library #sewerLibraryCategories{display:none!important}
 html.sewer-ipad-library.sewer-phone-ui body.sewer-ribbon-ui .app>aside .sewerLibrarySection>summary{font-size:11px!important;min-height:28px!important;display:list-item!important;cursor:pointer;touch-action:manipulation}
 `;document.head.append(style);
})();
