const { app, BrowserWindow, shell, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

app.setName('FurniPlan');
app.setAppUserModelId('com.sadeer.furniplan');

let localServer = null;

function writeLog(message) {
  try {
    const dir = app.getPath('userData');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'FurniPlan-startup.log'), `[${new Date().toISOString()}] ${message}\n`);
  } catch (_) {}
}

const mime = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon',
  '.webp':'image/webp',
  '.gif':'image/gif',
  '.woff':'font/woff',
  '.woff2':'font/woff2'
};

function startLocalServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url, 'http://127.0.0.1');
        let rel = decodeURIComponent(requestUrl.pathname || '/');
        if (rel === '/') rel = '/index.html';

        rel = rel.replace(/^\/+/, '');
        const requested = path.resolve(rootDir, rel);
        const rootResolved = path.resolve(rootDir);

        if (requested !== rootResolved && !requested.startsWith(rootResolved + path.sep)) {
          res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8'});
          res.end('Forbidden');
          return;
        }

        fs.stat(requested, (statErr, stat) => {
          if (statErr || !stat.isFile()) {
            res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
            res.end('Not found');
            return;
          }

          res.writeHead(200, {
            'Content-Type': mime[path.extname(requested).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
          });
          const stream = fs.createReadStream(requested);
          stream.on('error', () => {
            if (!res.headersSent) res.writeHead(500);
            res.end();
          });
          stream.pipe(res);
        });
      } catch (err) {
        writeLog(`Server request error: ${err && err.stack ? err.stack : err}`);
        res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
        res.end('Server error');
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({server, port: addr.port});
    });
  });
}

async function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const appRoot = app.getAppPath();
  const indexPath = path.join(appRoot, 'index.html');

  writeLog(`V124 starting. appRoot=${appRoot} index=${indexPath} exists=${fs.existsSync(indexPath)} packaged=${app.isPackaged}`);

  if (!fs.existsSync(indexPath)) {
    dialog.showErrorBox('FurniPlan', `لم يتم العثور على ملف واجهة البرنامج.\n\nالمسار: ${indexPath}\n\nأعد تثبيت FurniPlan V124.`);
    writeLog('index.html missing before server startup');
    app.quit();
    return;
  }

  try {
    const started = await startLocalServer(appRoot);
    localServer = started.server;
    const startUrl = `http://127.0.0.1:${started.port}/index.html`;
    writeLog(`Local server started: ${startUrl}`);

    const win = new BrowserWindow({
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
      minWidth: 1000,
      minHeight: 650,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      title: 'FurniPlan V147',
      icon: path.join(appRoot, 'build', 'furniplan.ico'),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false
      }
    });

    const revealTimer = setTimeout(() => {
      if (!win.isDestroyed() && !win.isVisible()) {
        win.maximize();
        win.show();
      }
    }, 1500);

    win.once('ready-to-show', () => {
      clearTimeout(revealTimer);
      win.maximize();
      win.show();
    });

    win.webContents.on('did-finish-load', async () => {
      writeLog('Page loaded successfully.');
      try {
        await win.webContents.executeJavaScript(`
          (() => {
            if (window.__fpDesktopV147) return;
            window.__fpDesktopV147 = true;

            function ensureTextModal(){
              let overlay=document.getElementById('fpDesktopTextModal');
              if(overlay)return overlay;
              overlay=document.createElement('div');
              overlay.id='fpDesktopTextModal';
              overlay.style.cssText='display:none;position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.72);align-items:center;justify-content:center;font-family:Tahoma,Arial,sans-serif;direction:rtl';
              overlay.innerHTML='<div style="width:min(440px,90vw);background:#0f172a;border:1px solid #38bdf8;border-radius:16px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.55)">'+
                '<div id="fpDesktopTextTitle" style="color:#fff;font-weight:800;font-size:18px;margin-bottom:12px"></div>'+
                '<input id="fpDesktopTextInput" type="text" style="width:100%;box-sizing:border-box;background:#fff;color:#111827;border:2px solid #38bdf8;border-radius:10px;padding:11px 12px;font:700 17px Tahoma;outline:none">'+
                '<div style="display:flex;gap:10px;margin-top:14px">'+
                  '<button id="fpDesktopTextOk" style="flex:1;border:0;border-radius:10px;padding:10px;background:#0284c7;color:#fff;font:800 15px Tahoma;cursor:pointer">اعتماد</button>'+
                  '<button id="fpDesktopTextCancel" style="flex:0 0 110px;border:1px solid #64748b;border-radius:10px;padding:10px;background:#1e293b;color:#fff;font:700 14px Tahoma;cursor:pointer">إلغاء</button>'+
                '</div></div>';
              document.body.appendChild(overlay);
              return overlay;
            }

            function askText(title,initial=''){
              return new Promise(resolve=>{
                const overlay=ensureTextModal();
                const titleEl=document.getElementById('fpDesktopTextTitle');
                const input=document.getElementById('fpDesktopTextInput');
                const ok=document.getElementById('fpDesktopTextOk');
                const cancel=document.getElementById('fpDesktopTextCancel');
                titleEl.textContent=title;
                input.value=initial||'';
                overlay.style.display='flex';
                setTimeout(()=>{input.focus();input.select();},20);

                let done=false;
                const finish=value=>{
                  if(done)return;done=true;
                  overlay.style.display='none';
                  ok.onclick=null;cancel.onclick=null;input.onkeydown=null;
                  resolve(value);
                };
                ok.onclick=()=>finish(String(input.value||'').trim());
                cancel.onclick=()=>finish(null);
                input.onkeydown=e=>{
                  if(e.key==='Enter'){e.preventDefault();finish(String(input.value||'').trim());}
                  else if(e.key==='Escape'){e.preventDefault();finish(null);}
                };
              });
            }

            function hideAreaBadge(){
              try{
                if(typeof areaResultTimer!=='undefined'&&areaResultTimer){clearTimeout(areaResultTimer);areaResultTimer=null;}
                if(typeof areaResultBadge!=='undefined'&&areaResultBadge)areaResultBadge.style.display='none';
              }catch(_){}
            }

            async function finishAreaDesktop(){
              if(typeof mode==='undefined'||mode!=='areaMeasure')return;
              if(!Array.isArray(areaDraft)||areaDraft.length<3){
                if(typeof showAreaResultText==='function')showAreaResultText('يلزم تحديد 3 زوايا على الأقل لإنهاء المساحة',true);
                if(typeof setStatus==='function')setStatus('حدد 3 زوايا على الأقل لإنهاء المساحة');
                return;
              }

              const st=polygonAreaStats(areaDraft);
              const def='غرفة '+(areaPolygons.length+1);
              const entered=await askText('اكتب اسم الغرفة أو المساحة',def);
              const name=(entered===null?def:(String(entered).trim()||def));

              const before=cloneEditState();
              const result={id:randId(),name,points:areaDraft.map(p=>({...p})),areaM2:st.areaM2,perimeterM:st.perimeterM};
              areaPolygons.push(result);
              lastAreaResult=result;
              areaDraft=[];
              commitHistory(before);

              hideAreaBadge();
              activateWorkingTool('select');
              pendingFurnitureDef=null;
              selectedMeasureId=null;
              selectedMapLabelId=null;
              clearFurnitureSelection();
              updateInteractionCursor();
              syncSelectedPanel();
              syncAreaToolLabel();
              draw();
              setStatus('تم حفظ '+name+' — '+st.areaM2.toFixed(2)+' م²');
            }

            async function beginLabelDesktop(){
              if(!hasPlan()){alert('ارفع الخارطة أولاً.');return;}
              const entered=await askText('اكتب المسمى الذي تريد وضعه على الخارطة','');
              if(entered===null)return;
              const clean=String(entered).trim();
              if(!clean)return;
              pendingMapLabelText=clean;
              activateWorkingTool('labelPlace');
              points=[];
              selectedMeasureId=null;
              selectedMapLabelId=null;
              clearFurnitureSelection();
              syncSelectedPanel();
              updateInteractionCursor();
              setStatus('انقر مكان «'+clean+'» على الخارطة');
              draw();
            }

            // Capture the visible toolbar buttons directly.
            document.addEventListener('click',e=>{
              const area=e.target && e.target.closest ? e.target.closest('#v65Area') : null;
              if(area){
                e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
                if(mode==='areaMeasure') finishAreaDesktop();
                else {
                  if(!hasPlan()){alert('ارفع الخارطة أولاً.');return;}
                  if(!pxPerCm){alert('عاير الخارطة أولاً حتى يمكن حساب المساحة والمحيط.');return;}
                  activateWorkingTool('areaMeasure');
                  areaDraft=[];lastAreaResult=null;
                  clearFurnitureSelection();selectedMeasureId=null;selectedMapLabelId=null;pendingFurnitureDef=null;
                  updateInteractionCursor();syncSelectedPanel();syncAreaToolLabel();
                  showAreaResultText('حدد زوايا الغرفة — بعد النقطة الثالثة اضغط «إنهاء مساحة»',false);
                  setStatus('حدد زوايا الغرفة ثم اضغط «إنهاء مساحة»');
                  draw();
                }
                return;
              }
              const label=e.target && e.target.closest ? e.target.closest('#v44Label') : null;
              if(label){
                e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
                beginLabelDesktop();
              }
            },true);

            // T shortcut.
            window.addEventListener('keydown',e=>{
              const tag=document.activeElement?.tagName;
              if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
              if(e.ctrlKey||e.metaKey||e.altKey)return;
              if(String(e.key||'').toLowerCase()==='t'){
                e.preventDefault();e.stopImmediatePropagation();
                beginLabelDesktop();
              }
            },true);

            document.title='FurniPlan V147';
            const mark=document.createElement('div');
            mark.textContent='Windows V138 — desktop modal fix';
            mark.style.cssText='position:fixed;left:28px;top:96px;z-index:99999;color:#7dd3fc;font:700 11px Tahoma;pointer-events:none';
            document.body.appendChild(mark);
            if(typeof setStatus==='function')setStatus('Windows V138 جاهز — إصلاح المساحة والمسميات مفعّل');
          })();
        `);
        writeLog('Desktop V147 patch injected successfully.');
      } catch (err) {
        writeLog(`Desktop V147 patch injection failed: ${err && err.stack ? err.stack : err}`);
      }
    });

    win.webContents.on('render-process-gone', (_event, details) => {
      writeLog(`Renderer process gone: ${JSON.stringify(details)}`);
      dialog.showErrorBox('FurniPlan', 'تعذر تشغيل واجهة البرنامج. أغلق البرنامج وافتحه مرة أخرى.');
    });

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      writeLog(`Load failed: ${errorCode} ${errorDescription} ${validatedURL}`);
      dialog.showErrorBox('FurniPlan', `تعذر فتح واجهة FurniPlan.\n${errorDescription} (${errorCode})`);
    });

    await win.loadURL(startUrl);

    win.on('page-title-updated', (event) => {
      event.preventDefault();
      win.setTitle('FurniPlan V147');
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url && /^https?:/i.test(url) && !url.startsWith('http://127.0.0.1:')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });
  } catch (err) {
    writeLog(`Startup failed: ${err && err.stack ? err.stack : err}`);
    dialog.showErrorBox('FurniPlan', 'تعذر تشغيل خادم FurniPlan المحلي. أعد تثبيت النسخة V124.');
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  try { if (localServer) localServer.close(); } catch (_) {}
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
