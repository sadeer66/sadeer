from pathlib import Path
import hashlib,shutil,urllib.request,zipfile
base=Path('desktop-electricalplan-v53');app=base/'app';web=app/'resources/app/web'
shutil.copytree('electricalplan-v53',web,dirs_exist_ok=True)
url='https://github.com/electron/electron/releases/download/v44.9.0/electron-v44.9.0-win32-x64.zip'
Path('output').mkdir(exist_ok=True)
if not Path('electron.zip').exists():urllib.request.urlretrieve(url,'electron.zip')
assert hashlib.sha256(Path('electron.zip').read_bytes()).hexdigest()=='88e08039d0ef359bab9f674e8051fa103bd8628ea7c5a5e1daaa610a8a0c6931'
with zipfile.ZipFile('electron.zip') as z:
 assert z.testzip() is None
 z.extractall(app/'runtime')
