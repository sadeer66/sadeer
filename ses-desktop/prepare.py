#!/usr/bin/env python3
"""Build a separate desktop copy with byte-identical media stored only once."""
import argparse
import hashlib
import importlib.util
import json
import pathlib
import re
import subprocess

STAGES = ('color', 'furni', 'sewer', 'electric')
MEDIA = {'.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.wav'}

def digest(data):
    return hashlib.sha256(data).hexdigest()

def inventory(root):
    return {p.relative_to(root).as_posix(): {'bytes': p.stat().st_size, 'sha256': digest(p.read_bytes())}
            for p in sorted(root.rglob('*')) if p.is_file() and p.name != 'bundle-manifest.json'}

def prepare(source, destination):
    source, destination = source.resolve(), destination.resolve()
    if destination == source or source in destination.parents or destination in source.parents:
        raise ValueError('Desktop output must be outside the source tree')
    spec = importlib.util.spec_from_file_location('ses_prepare', source / 'tools/prepare_bundle.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    source_state = inventory(source)
    module.prepare(destination)
    module.verify(destination)
    prepared_bytes = sum(p.stat().st_size for p in destination.rglob('*') if p.is_file())
    assets = [p for p in sorted(destination.rglob('*')) if p.is_file() and p.suffix.lower() in MEDIA]
    library = destination / 'shared-library/files'
    library.mkdir(parents=True)
    aliases, unique, entries = {}, {}, {}
    media_bytes = 0
    for path in assets:
        data = path.read_bytes()
        sha = digest(data)
        original = path.relative_to(destination).as_posix()
        media_bytes += len(data)
        if sha not in unique:
            # Preserve the first extension; identical bytes share a file even if named differently.
            target = library / (sha + path.suffix.lower())
            target.write_bytes(data)
            unique[sha] = target.relative_to(destination).as_posix()
            entries[sha] = {'path': unique[sha], 'bytes': len(data), 'aliases': [], 'stages': []}
        aliases[original] = unique[sha]
        entries[sha]['aliases'].append(original)
        stage = original.split('/')[1] if original.startswith('apps/') else 'shell'
        if stage not in entries[sha]['stages']:
            entries[sha]['stages'].append(stage)
        path.unlink()
    index = {'version': 'desktop-central1', 'aliases': aliases, 'assets': entries}
    (destination / 'shared-library/index.json').write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
    # Existing relative URLs, dynamically built URLs, and saved-project URLs remain valid.
    # The desktop server resolves each original path to the shared physical file.
    stats = {
        'version': 'desktop-central1',
        'source_bytes': sum(x['bytes'] for x in source_state.values()),
        'prepared_bundle_bytes': prepared_bytes,
        'original_media_paths': len(aliases), 'unique_media_files': len(unique),
        'media_bytes_before_centralization': media_bytes,
        'media_bytes_after_centralization': sum(x['bytes'] for x in entries.values()),
        'identical_media_bytes_removed': media_bytes - sum(x['bytes'] for x in entries.values()),
        'assets_shared_between_programs': sum(len([s for s in x['stages'] if s in STAGES]) > 1 for x in entries.values()),
        'source_unchanged': source_state == inventory(source),
    }
    assert stats['source_unchanged'], 'Source tree was modified'
    (destination / 'central-library-report.json').write_text(json.dumps(stats, indent=2), encoding='utf-8')
    (destination / 'bundle-manifest.json').write_text(json.dumps({'version': 'desktop-central1', 'files': inventory(destination)}, indent=2), encoding='utf-8')
    verify(destination)
    print(json.dumps(stats, indent=2))

def verify(root):
    root = root.resolve()
    manifest = json.loads((root / 'bundle-manifest.json').read_text())['files']
    assert manifest == inventory(root), 'Bundle content or checksums differ'
    index = json.loads((root / 'shared-library/index.json').read_text())
    aliases = index['aliases']
    hashes = set()
    for sha, asset in index['assets'].items():
        path = root / asset['path']
        assert path.is_file() and digest(path.read_bytes()) == sha
        assert sha not in hashes
        hashes.add(sha)
        assert asset['bytes'] == path.stat().st_size
        for alias in asset['aliases']:
            assert aliases[alias] == asset['path'] and not (root / alias).exists()
    for alias, target in aliases.items():
        assert not alias.startswith('/') and '..' not in pathlib.PurePosixPath(alias).parts
        assert target.startswith('shared-library/files/') and target in manifest
    for stage in STAGES:
        folder = root / 'apps' / stage
        assert (folder / 'engine.html').is_file() and (folder / 'ses-adapter.js').is_file()
        # The loaders must still track the actual local engine/script byte lengths.
        text = (folder / 'index.html').read_text(encoding='utf-8')
        match = re.search(r'spec=(\{[^\n]+?\}),total=spec\.engine', text)
        weights = json.loads(match[1])
        assert weights['engine'] == (folder / 'engine.html').stat().st_size
        for name, size in weights['files'].items():
            assert (folder / name).resolve().stat().st_size == size
        for path in folder.rglob('*'):
            if not path.is_file() or path.suffix not in {'.html', '.js', '.css'}:
                continue
            for asset in re.findall(r'\.\./\.\./assets/embedded/[a-f0-9]+\.[a-z]+', path.read_text(encoding='utf-8')):
                relative = (folder / asset).resolve().relative_to(root).as_posix()
                assert relative in aliases, relative
            if path.suffix == '.js':
                subprocess.run(['node', '--check', str(path)], check=True)
    print('Central library integrity, aliases, loader sizes, and JavaScript checks passed.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('destination', type=pathlib.Path)
    parser.add_argument('--source', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[1] / 'ses-lab')
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    if args.verify:
        verify(args.destination)
    else:
        prepare(args.source, args.destination)
