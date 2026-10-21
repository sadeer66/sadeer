#!/usr/bin/env python3
"""Prepare a self-contained Web folder from the isolated SES directory."""
import argparse,base64,hashlib,json,pathlib,re,shutil,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
def prepare(destination):
 destination=destination.resolve()
 if destination==ROOT or ROOT in destination.parents:raise SystemExit('Choose an output outside the SES source tree')
 if destination.exists():shutil.rmtree(destination)
 destination.mkdir(parents=True)
 excluded={'apple','tools','tests','core.html','service-worker.js','.DS_Store'}
 for path in ROOT.rglob('*'):
  rel=path.relative_to(ROOT)
  if any(part in excluded for part in rel.parts)or not path.is_file():continue
  if path.suffix.lower()in {'.md','.txt','.zip','.exe'}:continue
  target=destination/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
 before=sum(f.stat().st_size for f in destination.rglob('*')if f.is_file());embedded=destination/'assets/embedded';embedded.mkdir(parents=True,exist_ok=True)
 pattern=re.compile(r'([\"\'])(data:image/(png|webp|jpeg|jpg|gif|svg\+xml);base64,([A-Za-z0-9+/=]+))\1')
 count=0
 for stage in ['color','furni','sewer','electric']:
  for path in (destination/'apps'/stage).rglob('*'):
   if not path.is_file()or path.suffix not in ['.html','.js']:continue
   text=path.read_text(encoding='utf-8')
   def extract(match):
    nonlocal count
    try:data=base64.b64decode(match[4],validate=True)
    except ValueError:return match[0]
    if len(data)<2048:return match[0]
    extension={'jpeg':'jpg','svg+xml':'svg'}.get(match[3],match[3]);name=hashlib.sha256(data).hexdigest()+'.'+extension
    target=embedded/name
    if not target.exists():target.write_bytes(data)
    count+=1
    return match[1]+'../../assets/embedded/'+name+match[1]
   text=pattern.sub(extract,text);path.write_text(text,encoding='utf-8')
 # Progress weights describe the actual packaged files, after extraction.
 for stage in ['color','furni','sewer','electric']:
  folder=destination/'apps'/stage;path=folder/'index.html';text=path.read_text()
  pattern_spec=re.compile(r'spec=(\{[^\n]+?\}),total=spec\.engine')
  match=pattern_spec.search(text)
  if not match:raise RuntimeError('Missing loader manifest: '+stage)
  spec=json.loads(match[1]);spec['engine']=(folder/'engine.html').stat().st_size
  for name in spec['files']:spec['files'][name]=(folder/name).resolve().stat().st_size
  text=text[:match.start(1)]+json.dumps(spec,ensure_ascii=False,separators=(',',':'))+text[match.end(1):];path.write_text(text)
 manifest={str(f.relative_to(destination)):{'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}for f in sorted(destination.rglob('*'))if f.is_file()}
 (destination/'bundle-manifest.json').write_text(json.dumps({'version':'four7','files':manifest},ensure_ascii=False,indent=2))
 for stage in ['color','furni','sewer','electric']:
  assert(destination/'apps'/stage/'engine.html').is_file()
  assert(destination/'apps'/stage/'ses-adapter.js').is_file()
 after=sum(f.stat().st_size for f in destination.rglob('*')if f.is_file())
 print(json.dumps({'files':len(manifest),'extracted_images':count,'source_bytes':before,'bundle_bytes':after,'web':str(destination)},indent=2))

def verify(destination):
 manifest=json.loads((destination/'bundle-manifest.json').read_text())['files']
 for path,spec in manifest.items():
  data=(destination/path).read_bytes()
  assert len(data)==spec['bytes']and hashlib.sha256(data).hexdigest()==spec['sha256'],path
 for stage in ['color','furni','sewer','electric']:
  folder=destination/'apps'/stage
  for path in folder.rglob('*'):
   if path.suffix not in ['.html','.js']or not path.is_file():continue
   text=path.read_text()
   for asset in re.findall(r'\.\./\.\./assets/embedded/[a-f0-9]+\.[a-z]+',text):assert(folder/asset).resolve().is_file(),asset
   if path.suffix=='.js':subprocess.run(['node','--check',str(path)],check=True)
 print('Bundle integrity and JavaScript checks passed:',len(manifest),'files')
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('destination',type=pathlib.Path);parser.add_argument('--verify',action='store_true');args=parser.parse_args()
 if args.verify:verify(args.destination)
 else:prepare(args.destination)
