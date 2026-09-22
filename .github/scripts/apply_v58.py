from pathlib import Path
import re

p=Path('index.html')
c=p.read_text(encoding='utf-8')

if 'V58 Shared Assistant' in c and "button('v58Assistant'" in c:
    print('V58 assistant base already applied')
else:
    c=c.replace('<title>تأثيثي V57 — أيقونات الأبواب والشبابيك</title>','<title>تأثيثي V58 — المساعد</title>')

    css='''

/* V58 Assistant */
#assistantModal .modalCard{max-width:560px;position:relative}
.assistantHero{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #334155;border-radius:14px;background:linear-gradient(135deg,#111827,#172033);margin:8px 0 14px}
.assistantHeroIcon{width:54px;height:54px;min-width:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#dc2626;color:#fff;box-shadow:0 8px 20px rgba(220,38,38,.24)}
.assistantHeroIcon svg{width:30px;height:30px;fill:currentColor;stroke:currentColor}
.assistantHeroText b{display:block;font-size:17px;margin-bottom:3px}.assistantHeroText span{font-size:12px;color:#cbd5e1;line-height:1.6}
.assistantWatchBtn{width:100%;min-height:48px;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;background:#b91c1c;border-color:#ef4444}
.assistantWatchBtn:disabled{opacity:.5;cursor:not-allowed}.assistantState{font-size:11px;color:#94a3b8;text-align:center;margin-top:8px;min-height:18px}
.assistantAdminBtn{position:absolute;left:12px;top:12px;width:32px;height:32px;min-width:32px;padding:0;border-radius:9px;font-size:15px;display:flex;align-items:center;justify-content:center;background:#0f172a;border:1px solid #475569;color:#cbd5e1}
.assistantAdminPanel{display:none;margin-top:14px;border-top:1px solid #334155;padding-top:12px}.assistantAdminPanel.open{display:block}
.assistantAdminPanel .assistantAdminHint{font-size:10.5px;color:#94a3b8;line-height:1.6;margin:6px 0 10px}.assistantAdminActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.assistantAdminActions button{flex:1;min-width:150px}
@media(max-width:700px){#assistantModal .modalCard{width:min(94vw,560px)}.assistantHeroIcon{width:46px;height:46px;min-width:46px}.assistantHeroText b{font-size:15px}.assistantHeroText span{font-size:11px}}
'''
    if '/* V58 Assistant */' not in c:
        idx=c.find('\n</style>')
        if idx<0: raise SystemExit('style closing tag not found')
        c=c[:idx]+css+c[idx:]

    info='<button id="infoBtn"><span class="actionIcon">●</span>معلوماتك</button>'
    if 'id="assistantBtn"' not in c:
        if info not in c: raise SystemExit('info base button anchor missing')
        c=c.replace(info,info+'\n      <button id="assistantBtn"><span class="actionIcon">▶</span>المساعد</button>',1)

    modal='''
<div class="modalOverlay" id="assistantModal">
  <div class="modalCard">
    <button id="assistantAdminBtn" class="assistantAdminBtn" type="button" title="إدارة رابط الشرح" aria-label="إدارة رابط الشرح">⚙</button>
    <h3>المساعد</h3>
    <div class="assistantHero">
      <div class="assistantHeroIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="assistantHeroText"><b>شرح برنامج تأثيثي</b><span>يفتح فيديو أو قائمة تشغيل الشرح على YouTube. الرابط مشترك بين نسخة الويب ونسخة الكمبيوتر.</span></div>
    </div>
    <button id="assistantWatchBtn" class="assistantWatchBtn" type="button" disabled>▶ مشاهدة الشرح على YouTube</button>
    <div id="assistantState" class="assistantState">جاري التحقق من رابط الشرح…</div>
    <div id="assistantAdminPanel" class="assistantAdminPanel">
      <div class="field"><label>رابط YouTube</label><input id="assistantUrlInput" type="url" inputmode="url" dir="ltr" placeholder="https://www.youtube.com/watch?v=..."></div>
      <div class="assistantAdminHint">زر «تحديث للجميع» يفتح صفحة تأكيد آمنة في GitHub. بعد الضغط على Submit new issue يتم تحديث الرابط المشترك تلقائيًا، ثم تراه نسخة الويب ونسخة الكمبيوتر عند فتح المساعد.</div>
      <div class="assistantAdminActions"><button id="assistantSaveLocalBtn" type="button">حفظ مؤقت على هذا الجهاز</button><button id="assistantPublishBtn" type="button" class="primary">تحديث الرابط للجميع</button></div>
      <div class="assistantAdminActions"><button id="assistantChangePasswordBtn" type="button">تغيير باسورد الإدارة</button><button id="assistantRefreshBtn" type="button">تحديث الرابط من الموقع</button></div>
    </div>
    <div class="modalActions"><button id="closeAssistantBtn" type="button">إغلاق</button></div>
  </div>
</div>

'''
    if 'id="assistantModal"' not in c:
        a='<div class="modalOverlay" id="brandModal">'
        if a not in c: raise SystemExit('brand modal anchor missing')
        c=c.replace(a,modal+a,1)

    js=r'''

// ===== V58 Shared Assistant =====
const ASSISTANT_REMOTE_URL='https://sadeer66.github.io/sadeer/assistant.json';
const ASSISTANT_FALLBACK_KEY='taatheethiAssistantUrlFallbackV1';
const ASSISTANT_ADMIN_HASH_KEY='taatheethiAssistantAdminHashV1';
let assistantCurrentUrl='';
const assistantModal=document.getElementById('assistantModal');
const assistantWatchBtn=document.getElementById('assistantWatchBtn');
const assistantState=document.getElementById('assistantState');
const assistantAdminPanel=document.getElementById('assistantAdminPanel');
const assistantUrlInput=document.getElementById('assistantUrlInput');
function isValidAssistantUrl(value){try{const u=new URL(String(value||'').trim());return u.protocol==='https:'&&(u.hostname==='youtube.com'||u.hostname==='www.youtube.com'||u.hostname==='youtu.be'||u.hostname.endsWith('.youtube.com'));}catch(e){return false;}}
function setAssistantUrl(url,source=''){assistantCurrentUrl=isValidAssistantUrl(url)?String(url).trim():'';assistantWatchBtn.disabled=!assistantCurrentUrl;if(assistantCurrentUrl){assistantState.textContent=source==='remote'?'رابط الشرح محدث من الموقع':'رابط الشرح جاهز';try{localStorage.setItem(ASSISTANT_FALLBACK_KEY,assistantCurrentUrl)}catch(e){}}else assistantState.textContent='لم تتم إضافة رابط شرح بعد';if(assistantUrlInput)assistantUrlInput.value=assistantCurrentUrl;}
async function refreshAssistantUrl(showState=true){if(showState)assistantState.textContent='جاري تحديث رابط الشرح…';try{const r=await fetch(ASSISTANT_REMOTE_URL+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();if(isValidAssistantUrl(data.youtube_url)){setAssistantUrl(data.youtube_url,'remote');return true;}setAssistantUrl('','remote');return true;}catch(e){let fallback='';try{fallback=localStorage.getItem(ASSISTANT_FALLBACK_KEY)||''}catch(_){}setAssistantUrl(fallback,'local');assistantState.textContent=fallback?'تعذر الاتصال بالموقع — تم استخدام آخر رابط محفوظ':'تعذر الوصول إلى رابط الشرح الآن';return false;}}
function openAssistantDialog(){assistantModal.style.display='flex';assistantAdminPanel.classList.remove('open');refreshAssistantUrl(true);}
function closeAssistantDialog(){assistantModal.style.display='none';assistantAdminPanel.classList.remove('open');}
async function sha256Text(s){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function ensureAssistantAdminUnlocked(){let saved='';try{saved=localStorage.getItem(ASSISTANT_ADMIN_HASH_KEY)||''}catch(e){}if(!saved){const p1=prompt('أنشئ باسورد إدارة رابط المساعد لهذا الجهاز:');if(!p1)return false;if(p1.length<4){alert('اجعل الباسورد 4 أحرف أو أرقام على الأقل.');return false;}const p2=prompt('أعد كتابة الباسورد للتأكيد:');if(p1!==p2){alert('الباسورد غير متطابق.');return false;}const h=await sha256Text(p1);try{localStorage.setItem(ASSISTANT_ADMIN_HASH_KEY,h)}catch(e){}return true;}const p=prompt('أدخل باسورد إدارة رابط المساعد:');if(!p)return false;if(await sha256Text(p)!==saved){alert('الباسورد غير صحيح.');return false;}return true;}
async function openAssistantAdmin(){if(!await ensureAssistantAdminUnlocked())return;assistantAdminPanel.classList.add('open');assistantUrlInput.value=assistantCurrentUrl||'';}
async function changeAssistantPassword(){let saved='';try{saved=localStorage.getItem(ASSISTANT_ADMIN_HASH_KEY)||''}catch(e){}if(saved){const old=prompt('أدخل الباسورد الحالي:');if(!old||await sha256Text(old)!==saved){alert('الباسورد الحالي غير صحيح.');return;}}const p1=prompt('أدخل الباسورد الجديد:');if(!p1)return;if(p1.length<4){alert('اجعل الباسورد 4 أحرف أو أرقام على الأقل.');return;}const p2=prompt('أعد كتابة الباسورد الجديد:');if(p1!==p2){alert('الباسورد غير متطابق.');return;}try{localStorage.setItem(ASSISTANT_ADMIN_HASH_KEY,await sha256Text(p1));alert('تم تغيير باسورد الإدارة على هذا الجهاز.');}catch(e){alert('تعذر حفظ الباسورد.');}}
function saveAssistantLocal(){const url=assistantUrlInput.value.trim();if(!isValidAssistantUrl(url)){alert('أدخل رابط YouTube صحيحًا يبدأ بـ https://');return;}setAssistantUrl(url,'local');assistantState.textContent='تم حفظ الرابط مؤقتًا على هذا الجهاز';}
function publishAssistantLink(){const url=assistantUrlInput.value.trim();if(!isValidAssistantUrl(url)){alert('أدخل رابط YouTube صحيحًا قبل التحديث.');return;}setAssistantUrl(url,'local');const title='[Taatheethi Assistant] Update YouTube link';const body='TAATHEETHI_ASSISTANT_URL\n'+url+'\n\nتم إنشاء هذا الطلب من صفحة المساعد في برنامج تأثيثي.';const issue='https://github.com/sadeer66/sadeer/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);window.open(issue,'_blank','noopener');assistantState.textContent='تم فتح GitHub — اضغط Submit new issue لإكمال تحديث الرابط للجميع';}
assistantWatchBtn?.addEventListener('click',()=>{if(assistantCurrentUrl)window.open(assistantCurrentUrl,'_blank','noopener');});
document.getElementById('assistantAdminBtn')?.addEventListener('click',openAssistantAdmin);
document.getElementById('assistantSaveLocalBtn')?.addEventListener('click',saveAssistantLocal);
document.getElementById('assistantPublishBtn')?.addEventListener('click',publishAssistantLink);
document.getElementById('assistantChangePasswordBtn')?.addEventListener('click',changeAssistantPassword);
document.getElementById('assistantRefreshBtn')?.addEventListener('click',()=>refreshAssistantUrl(true));
document.getElementById('closeAssistantBtn')?.addEventListener('click',closeAssistantDialog);
document.getElementById('assistantBtn')?.addEventListener('click',openAssistantDialog);
assistantModal?.addEventListener('click',e=>{if(e.target===assistantModal)closeAssistantDialog();});
refreshAssistantUrl(false);
// ===== End V58 Shared Assistant =====
'''
    if '// ===== V58 Shared Assistant =====' not in c:
        a="document.getElementById('infoBtn').onclick=openBrandDialog;"
        if a not in c: raise SystemExit('info handler anchor missing')
        c=c.replace(a,js+'\n'+a,1)

    if "assistant:svg(" not in c:
        a="    info:svg('<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 10v7M12 7h.01\"/>'),"
        if a not in c: raise SystemExit('info icon anchor missing')
        c=c.replace(a,a+"\n    assistant:svg('<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m10 8 6 4-6 4Z\"/>'),",1)

    old="""    [
      button('v44Info','info','معلوماتك',()=>click('infoBtn'),'secondaryTop','معلومات')
    ]"""
    new="""    [
      button('v44Info','info','معلوماتك',()=>click('infoBtn'),'secondaryTop','معلومات'),
      button('v58Assistant','assistant','المساعد',()=>openAssistantDialog(),'','المساعد')
    ]"""
    if "button('v58Assistant'" not in c:
        if old not in c: raise SystemExit('top info group anchor missing')
        c=c.replace(old,new,1)

    p.write_text(c,encoding='utf-8')


# V58 desktop-safe shared config: dynamic script works from file:// without CORS.
if "ASSISTANT_REMOTE_SCRIPT" not in c:
    old="const ASSISTANT_REMOTE_URL='https://sadeer66.github.io/sadeer/assistant.json';"
    new=old+"\nconst ASSISTANT_REMOTE_SCRIPT='https://sadeer66.github.io/sadeer/assistant-link.js';"
    if old not in c: raise SystemExit('assistant remote URL anchor missing')
    c=c.replace(old,new,1)

old_refresh="""async function refreshAssistantUrl(showState=true){if(showState)assistantState.textContent='جاري تحديث رابط الشرح…';try{const r=await fetch(ASSISTANT_REMOTE_URL+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();if(isValidAssistantUrl(data.youtube_url)){setAssistantUrl(data.youtube_url,'remote');return true;}setAssistantUrl('','remote');return true;}catch(e){let fallback='';try{fallback=localStorage.getItem(ASSISTANT_FALLBACK_KEY)||''}catch(_){}setAssistantUrl(fallback,'local');assistantState.textContent=fallback?'تعذر الاتصال بالموقع — تم استخدام آخر رابط محفوظ':'تعذر الوصول إلى رابط الشرح الآن';return false;}}"""
new_refresh="""async function refreshAssistantUrl(showState=true){if(showState)assistantState.textContent='جاري تحديث رابط الشرح…';try{delete window.TAATHEETHI_ASSISTANT_URL;await new Promise((resolve,reject)=>{const old=document.getElementById('taatheethiAssistantRemoteScript');if(old)old.remove();const s=document.createElement('script');s.id='taatheethiAssistantRemoteScript';s.src=ASSISTANT_REMOTE_SCRIPT+'?v='+Date.now();s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});const remote=window.TAATHEETHI_ASSISTANT_URL||'';if(isValidAssistantUrl(remote)){setAssistantUrl(remote,'remote');return true;}setAssistantUrl('','remote');return true;}catch(e){try{const r=await fetch(ASSISTANT_REMOTE_URL+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();if(isValidAssistantUrl(data.youtube_url)){setAssistantUrl(data.youtube_url,'remote');return true;}}catch(_){}let fallback='';try{fallback=localStorage.getItem(ASSISTANT_FALLBACK_KEY)||''}catch(_){}setAssistantUrl(fallback,'local');assistantState.textContent=fallback?'تعذر الاتصال بالموقع — تم استخدام آخر رابط محفوظ':'تعذر الوصول إلى رابط الشرح الآن';return false;}}"""
if old_refresh in c:
    c=c.replace(old_refresh,new_refresh,1)
elif 'taatheethiAssistantRemoteScript' not in c:
    raise SystemExit('assistant refresh function anchor missing')

p.write_text(c,encoding='utf-8')

sw=Path('service-worker.js')
if sw.exists():
    t=sw.read_text(encoding='utf-8')
    t=re.sub(r'const CACHE_NAME = "[^"]+";', 'const CACHE_NAME = "taatheethi-v58-assistant";', t, count=1)
    sw.write_text(t,encoding='utf-8')

print('V58 assistant patch applied')