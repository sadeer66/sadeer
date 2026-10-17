from pathlib import Path

path = Path("smart-render-v11.74/index.html")
html = path.read_text(encoding="utf-8")
if 'id="mobileDockCSS1174"' in html:
    print("Already updated — no changes required")
    raise SystemExit(0)
if ("uiScales74" not in html or "const uiScaleStyle74=" not in html
    or "document.querySelector('.top').prepend(uiScales74)" not in html):
    raise RuntimeError("Unexpected source structure — refusing to change Smart Render.")
if not html.rstrip().endswith("</script></body></html>"):
    raise RuntimeError("Unexpected HTML ending — refusing to modify.")

patch = r"""
<!-- Smart Render V11.74: iPad/iPhone fixed sliders and responsive right side. -->
<style id="mobileDockCSS1174">
html.smartRenderAppleMobile1174 #topDock1174{display:flex!important;align-items:stretch;width:100%;min-width:0;gap:5px;direction:rtl;background:var(--night);padding:0 6px 0 0;flex:0 0 auto}
html.smartRenderAppleMobile1174 #topDock1174>.top{min-width:0!important;width:0!important;flex:1 1 0!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-x}
html.smartRenderAppleMobile1174 #topDock1174>#uiScales74{position:relative!important;right:auto!important;left:auto!important;top:auto!important;flex:0 0 184px!important;width:184px!important;min-width:184px!important;align-self:center!important;z-index:26;transform:none!important;touch-action:pan-y}
html.smartRenderAppleMobile1174 #topDock1174>#uiScales74 input[type=range]{touch-action:none;user-select:none;-webkit-user-select:none}
html.smartRenderAppleMobile1174 .side{overflow-x:hidden!important;box-sizing:border-box}
@media (orientation:portrait){html.smartRenderAppleMobile1174 .side{width:clamp(100px,calc(139px * var(--ui-text74)),45vw)!important;flex:0 0 auto!important;padding:5px!important}html.smartRenderAppleMobile1174 .side .buttons{grid-template-columns:minmax(0,1fr)!important}}
@media (orientation:landscape){html.smartRenderAppleMobile1174 .side{width:clamp(130px,calc(208.5px * var(--ui-text74)),35vw)!important;flex:0 0 auto!important}}
</style>
<script id="mobileDockJS1174">
(function(){
  const ua=navigator.userAgent||'';
  const isAppleMobile=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isAppleMobile)return;
  const toolbar=document.querySelector('.shell>.top');
  const controls=document.getElementById('uiScales74');
  if(!toolbar||!controls||!toolbar.parentNode)return;
  const dock=document.createElement('div');
  dock.id='topDock1174';
  toolbar.parentNode.insertBefore(dock,toolbar);
  dock.appendChild(controls);
  dock.appendChild(toolbar);
  document.documentElement.classList.add('smartRenderAppleMobile1174');
})();
</script>
"""
head, tail = html.rsplit("</body>", 1)
updated = head + patch + "</body>" + tail
path.write_text(updated, encoding="utf-8")
print(f"Updated iOS toolbar/sidebar only; source {len(html)}, result {len(updated)}.")
