from pathlib import Path
import zipfile,shutil,json
r=Path('desktop-smart-render-v11.74/runtime');r.mkdir(exist_ok=True)
with zipfile.ZipFile('/tmp/electron.zip') as z:
 assert z.testzip() is None
 z.extractall(r)
(r/'electron.exe').rename(r/'SmartRender-Core.exe');(r/'resources/app').mkdir(exist_ok=True)
shutil.copytree('smart-render-v11.74',r/'resources/app/web')
shutil.copy2('desktop-smart-render-v11.74/main.cjs',r/'resources/app/main.cjs')
(r/'resources/app/package.json').write_text(json.dumps({'name':'smartrender','productName':'SmartRender','version':'11.74.0','main':'main.cjs'}))
shutil.copy2(r/'resources/app/web/favicon.ico',r/'smartrender.ico')
import subprocess
subprocess.run(['makensis','-V2','desktop-smart-render-v11.74/launcher.nsi'],check=True)
fs=list(r.rglob('*'));lines=[]
for p in fs:
 if p.is_file():lines.append('Delete "$INSTDIR\\'+str(p.relative_to(r)).replace('/','\\')+'"')
for p in sorted([p for p in fs if p.is_dir()],key=lambda p:len(p.parts),reverse=True):lines.append('RMDir "$INSTDIR\\'+str(p.relative_to(r)).replace('/','\\')+'"')
Path('desktop-smart-render-v11.74/uninstall-files.nsh').write_text('\n'.join(lines))
subprocess.run(['makensis','-V2','desktop-smart-render-v11.74/setup.nsi'],check=True)
