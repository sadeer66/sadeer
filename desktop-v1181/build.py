from pathlib import Path
import hashlib,json,re,shutil,urllib.request,zipfile
base=Path('desktop-v1181');app=base/'app';web=app/'resources/app/web';web.mkdir(parents=True,exist_ok=True)
html=Path('smart-render-v11.79/index.html').read_text()
html=html.replace('/sadeer/smart-render-v11.74/apple-touch-icon.png?v=1179-icon1','apple-touch-icon.png')
html=re.sub(r'<title>.*?</title>','<title>Smart Render Desktop</title>',html,count=1)
(web/'index.html').write_text(html)
shutil.copyfile(app/'smartrender.ico',web/'favicon.ico')
shutil.copyfile(base/'apple-touch-icon.png',web/'apple-touch-icon.png')
url='https://github.com/electron/electron/releases/download/v44.9.0/electron-v44.9.0-win32-x64.zip'
Path('output').mkdir(exist_ok=True)
if not Path('electron.zip').exists():urllib.request.urlretrieve(url,'electron.zip')
assert hashlib.sha256(Path('electron.zip').read_bytes()).hexdigest()=='88e08039d0ef359bab9f674e8051fa103bd8628ea7c5a5e1daaa610a8a0c6931'
with zipfile.ZipFile('electron.zip') as z:
 assert z.testzip() is None
 z.extractall(app/'runtime')
