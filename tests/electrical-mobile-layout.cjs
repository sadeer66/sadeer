const {chromium}=require('playwright-core'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));const p=fs.existsSync(f)&&fs.statSync(f).isDirectory()?path.join(f,'index.html'):f;if(!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{await new Promise(r=>server.listen(8765,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});fs.mkdirSync('mobile-qa',{recursive:true});
 try{for(const [name,width,height,phone] of [['iphone-portrait',393,852,true],['iphone-landscape',852,393,true],['ipad-landscape',1024,768,false],['ipad-portrait',768,1024,false]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,userAgent:phone?'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});const page=await context.newPage();await page.goto('http://127.0.0.1:8765/electricalplan-v53/',{waitUntil:'load'});await page.waitForSelector('body.elUnifiedUI');await page.waitForTimeout(5500);
 for(const pane of ['file','library']){await page.locator('#sewerTab_'+pane).tap({timeout:10000});await page.waitForTimeout(200);
 const sizes=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom};};return {viewport:innerWidth,head:rect('#electricalApp>header'),ribbon:rect('#sewerRibbonHeader'),dock:rect('#elRightAside'),main:rect('#electricalApp>main'),controls:rect('#sewerInterfacePanel'),body:rect('#elRightBody'),scroll:document.querySelector('#elRightBody').scrollWidth};});console.log(name,pane,JSON.stringify(sizes));

 await page.screenshot({path:`mobile-qa/${name}-${pane}.png`});
 assert(sizes.head.h<90,'Compact toolbar height');assert(sizes.scroll<=sizes.body.w+2,'Panel contents fit its width');assert(sizes.main.w>width*.65,'Map should retain most of the width');assert(sizes.head.h-sizes.ribbon.h<12,'No tall empty toolbar padding');assert(Math.abs(sizes.main.y-sizes.head.b)<3,'Map starts directly below toolbar');assert(sizes.controls.x>=0&&sizes.controls.x+sizes.controls.w<=width+1,'Fixed controls remain inside viewport');
 }

 console.log('UI',name,await page.evaluate(()=>({active:window.ElectricalRightPanel.active,summaries:[...document.querySelectorAll('#sewerPane_library summary')].map(e=>({text:e.textContent,display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility,rect:e.getBoundingClientRect().toJSON()}))})));
 const summary=page.locator('#sewerPane_library .sewerLibrarySection>summary:visible').first();
 const wasOpen=await summary.evaluate(e=>e.parentElement.open);await summary.tap({timeout:10000});
 assert.equal(await summary.evaluate(e=>e.parentElement.open),!wasOpen,'Touch opens library section');
 await summary.tap();
 const toggle=page.locator('#v54Furniture');const before=await toggle.getAttribute('class');await toggle.tap({timeout:10000});assert.notEqual(await toggle.getAttribute('class'),before,'Touch changes furniture visibility');await toggle.tap();
 const category=page.locator('#library .sewerLibrarySection>summary').first();if(!await category.evaluate(e=>e.parentElement.open))await category.tap();
 await page.evaluate(()=>document.querySelector('#elRightBody').scrollTop=0);
 const rect=await page.locator('#elRightBody').boundingBox();const cdp=await context.newCDPSession(page),x=rect.x+rect.width/2,y=rect.y+Math.min(rect.height-30,220);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let step=1;step<=10;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*12}]});await page.waitForTimeout(25);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
 const scrollTop=await page.locator('#elRightBody').evaluate(e=>e.scrollTop);assert(scrollTop>20,'Finger swipe scrolls right panel');
 await page.locator('.elDockHead button').tap();assert.equal(await page.evaluate(()=>window.ElectricalRightPanel.active),'','Touch closes panel');
 assert.equal(await page.locator('#sewerOrientationScreen').evaluate(e=>getComputedStyle(e).display),'none','No legacy orientation splash');
 console.log('TOUCH PASS',name,'scrollTop',scrollTop);
 await context.close();} }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exit(1)});
