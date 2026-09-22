from pathlib import Path
import re

p=Path('index.html')
c=p.read_text(encoding='utf-8')

# Version title
c=c.replace('<title>تأثيثي V58 — المساعد</title>','<title>تأثيثي V59 — المساعد المحمي</title>')

# Remove local password creation/change UI and make the hint explicit.
c=c.replace(
    '<div class="assistantAdminHint">زر «تحديث للجميع» يفتح صفحة تأكيد آمنة في GitHub. بعد الضغط على Submit new issue يتم تحديث الرابط المشترك تلقائيًا، ثم تراه نسخة الويب ونسخة الكمبيوتر عند فتح المساعد.</div>',
    '<div class="assistantAdminHint">الدخول إلى إدارة الرابط محمي بباسورد يتم التحقق منه من الموقع، وليس من داخل البرنامج. زر «تحديث للجميع» يفتح GitHub، ولا يعتمد التغيير النهائي إلا من حساب مالك المستودع.</div>'
)
c=c.replace(
    '<div class="assistantAdminActions"><button id="assistantChangePasswordBtn" type="button">تغيير باسورد الإدارة</button><button id="assistantRefreshBtn" type="button">تحديث الرابط من الموقع</button></div>',
    '<div class="assistantAdminActions"><button id="assistantRefreshBtn" type="button">تحديث الرابط من الموقع</button></div>'
)

# Add remote auth endpoints beside existing assistant endpoints.
if "ASSISTANT_AUTH_URL" not in c:
    anchor="const ASSISTANT_REMOTE_URL='https://sadeer66.github.io/sadeer/assistant.json';"
    if anchor not in c:
        raise SystemExit('assistant remote URL anchor missing')
    c=c.replace(anchor, anchor+"\nconst ASSISTANT_AUTH_URL='https://sadeer66.github.io/sadeer/assistant-auth.json';\nconst ASSISTANT_AUTH_SCRIPT='https://sadeer66.github.io/sadeer/assistant-auth.js';",1)

# Remove obsolete local password key.
c=c.replace("const ASSISTANT_ADMIN_HASH_KEY='taatheethiAssistantAdminHashV1';\n",'')

# Replace local-password workflow with remote verification.
start=c.find('async function ensureAssistantAdminUnlocked()')
end=c.find('function saveAssistantLocal()', start)
if start < 0 or end < 0:
    if 'async function fetchAssistantAdminHash()' not in c:
        raise SystemExit('assistant admin function anchors missing')
else:
    replacement=r'''async function fetchAssistantAdminHash(){
  try{
    delete window.TAATHEETHI_ASSISTANT_HASH;
    await new Promise((resolve,reject)=>{
      const old=document.getElementById('taatheethiAssistantAuthScript');if(old)old.remove();
      const s=document.createElement('script');s.id='taatheethiAssistantAuthScript';s.src=ASSISTANT_AUTH_SCRIPT+'?v='+Date.now();s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
    const h=String(window.TAATHEETHI_ASSISTANT_HASH||'').trim().toLowerCase();
    if(/^[a-f0-9]{64}$/.test(h))return h;
  }catch(e){}
  try{
    const r=await fetch(ASSISTANT_AUTH_URL+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
    const data=await r.json();const h=String(data.sha256||'').trim().toLowerCase();
    if(/^[a-f0-9]{64}$/.test(h))return h;
  }catch(e){}
  return '';
}
async function ensureAssistantAdminUnlocked(){
  const p=prompt('أدخل باسورد إدارة رابط المساعد:');if(!p)return false;
  assistantState.textContent='جاري التحقق من الباسورد من الموقع…';
  const remoteHash=await fetchAssistantAdminHash();
  if(!remoteHash){assistantState.textContent='تعذر التحقق من الباسورد الآن';alert('تعذر الاتصال بملف التحقق على الموقع. تأكد من وجود الإنترنت وحاول مرة أخرى.');return false;}
  const entered=await sha256Text(p);
  if(entered!==remoteHash){assistantState.textContent='الباسورد غير صحيح';alert('الباسورد غير صحيح.');return false;}
  assistantState.textContent='تم التحقق من باسورد الإدارة';return true;
}
async function openAssistantAdmin(){if(!await ensureAssistantAdminUnlocked())return;assistantAdminPanel.classList.add('open');assistantUrlInput.value=assistantCurrentUrl||'';}
'''
    c=c[:start]+replacement+c[end:]

# Remove obsolete listener if still present.
c=re.sub(r"\ndocument\.getElementById\('assistantChangePasswordBtn'\)\?\.addEventListener\('click',changeAssistantPassword\);",'',c)

# Update comment marker/version, keep compatibility with old code ids.
c=c.replace('// ===== V58 Shared Assistant =====','// ===== V59 Shared Assistant =====')
c=c.replace('// ===== End V58 Shared Assistant =====','// ===== End V59 Shared Assistant =====')

# Verify critical elements.
required=[
    "const ASSISTANT_AUTH_URL=",
    "const ASSISTANT_AUTH_SCRIPT=",
    "async function fetchAssistantAdminHash()",
    "async function ensureAssistantAdminUnlocked()",
    "جاري التحقق من الباسورد من الموقع",
    "button('v58Assistant'",
]
missing=[x for x in required if x not in c]
if missing:
    raise SystemExit('V59 verification failed: '+', '.join(missing))
if 'assistantChangePasswordBtn' in c or 'ASSISTANT_ADMIN_HASH_KEY' in c or 'أنشئ باسورد إدارة رابط المساعد لهذا الجهاز' in c:
    raise SystemExit('Old local password flow still present')

p.write_text(c,encoding='utf-8')

sw=Path('service-worker.js')
if sw.exists():
    t=sw.read_text(encoding='utf-8')
    t=re.sub(r'const CACHE_NAME = "[^"]+";', 'const CACHE_NAME = "taatheethi-v59-assistant-auth";', t, count=1)
    sw.write_text(t,encoding='utf-8')

print('V59 remote password verification applied')