from pathlib import Path
import zipfile,json,hashlib
b=Path('desktop-electricalplan-v53');root='ElectricalPlan-V53-Complete/'
files=[(p,'ElectricalPlan/'+p.relative_to(b/'app').as_posix()) for p in (b/'app').rglob('*') if p.is_file()]
files += [(p,'Source/'+p.name) for p in (b/'source').iterdir() if p.is_file()]
files += [(b/'app/resources/app/main.cjs','Source/main.cjs'),(b/'app/resources/app/package.json','Source/package.json'),(b/'setup.nsi','Source/setup.nsi'),(b/'README-Arabic.txt','README-Arabic.txt')]
files += [(b/'build.py','Source/build.py'),(b/'package.py','Source/package.py'),(Path('.github/workflows/electricalplan-v53-release.yml'),'Source/electricalplan-v53-release.yml')]
m={n:hashlib.sha256(p.read_bytes()).hexdigest() for p,n in files}
p=Path('output/ElectricalPlan-V53-Complete.zip')
with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f,n in files:z.write(f,root+n)
 z.writestr(root+'SHA256.json',json.dumps(m,indent=2))
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None
 for n,h in m.items():assert hashlib.sha256(z.read(root+n)).hexdigest()==h
for f in (b/'app').rglob('*'):
 if f.is_file():assert hashlib.sha256(f.read_bytes()).digest()==hashlib.sha256((Path('verify')/f.relative_to(b/'app')).read_bytes()).digest(),str(f)
Path('output/SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(Path('output').glob('*')) if p.suffix in ['.exe','.zip']))
print('All installer payloads and ZIP contents verified')
