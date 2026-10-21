# SES Desktop — central library preview

This isolated development build uses copies under `ses-lab`, leaving the approved standalone programs and the master branch unchanged. It is a test build, not the licensed commercial release.

## Build

From the repository root:

```sh
python ses-desktop/prepare.py ses-desktop/Web
python ses-desktop/prepare.py ses-desktop/Web --verify
node ses-desktop/test-server.cjs ses-desktop/Web
cd ses-desktop
npm install
npx electron . --smoke-test
npm run package
```

On Windows, set `PYTHONUTF8=1` before preparation so the retained Arabic source is read consistently. The Windows workflow sets this automatically.

The Windows workflow produces a separate installer named SES Central Preview. Its app ID, shortcut, data profile, and installation name differ from production. It never registers `.ses` file associations. Existing standalone apps and projects remain unchanged.

## Shared library

All images and fonts are grouped by SHA-256 of their complete bytes. Only exact duplicates are merged; no image is recompressed, scaled, or renamed inside a catalog. Quoted large base64 images are first extracted by the existing isolated bundle preparer. Each resulting media file is moved to one content-addressed physical file under `Web/shared-library/files/`.

`shared-library/index.json` maps the original URLs to those shared files. The internal loopback server resolves these aliases, including dynamically constructed URLs and existing saved-project URLs. This preserves each program's catalog, item names, dimensions, and categories without copying the actual image. There are no image symlinks or duplicate files at the old paths.

All four programs and assets are bundled locally. The desktop shell blocks external network requests. A fixed loopback port preserves local storage between launches. A single-instance lock prevents simultaneous profile access. Canvas image operations remain same-origin. This is a packaging architecture, not copy protection or licensing enforcement. The signed device activation agreed for the future product is not implemented by this library change.

`central-library-report.json` records media savings and verifies source files were not modified. `bundle-manifest.json` contains complete byte lengths and checksums. The preview validates each file on first access. This detects accidental corruption, not deliberate tampering by an attacker able to modify the app.

For reliable use, launch the desktop app. Opening the HTML through `file://` bypasses URL alias resolution and is unsupported.

## Desktop-only controls

The preparer injects two desktop integration scripts into the generated copy only. Each native File panel gains a bronze Save SES project button and a teal Open SES project button. Both invoke the existing unified project implementation, preserving all four stages. Each native top toolbar gains an SES button opening an internal keyboard-accessible dialog with the other three program icons and Home. The old floating SES controls are hidden in this generated desktop copy. Web, Apple, and approved standalone sources are unchanged.
