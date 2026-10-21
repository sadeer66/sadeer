# SES — Apple preparation

This is a new app target. It does not replace the approved FurniPlan app or modify any approved standalone program.

The app serves only its bundled Web folder over device loopback, on a fixed port so WebKit project storage keeps the same origin between launches. It never serves project files over HTTP. The native wrapper blocks remote web resources; all four engines, scripts, fonts and images are included in the bundle. No backend or account is required.

Project exports use the iOS Files picker. Project imports use the existing file input inside SES. Other downloads use WebKit downloads and the share sheet. JavaScript confirmation dialogs and printing have native handlers.

## Build

1. In a full checkout, run `python3 ses-lab/tools/prepare_bundle.py /tmp/SES-Web`.
2. Run `python3 ses-lab/tools/prepare_bundle.py /tmp/SES-Web --verify` (requires Node).
3. Copy the generated Web directory to `ses-lab/apple/SES/Web`.
4. Open `ses-lab/apple/SES.xcodeproj`, select scheme SES and an iOS simulator. Minimum deployment target is iOS 15.
5. For a device/archive, select your Apple development team, choose a NEW bundle identifier, enable signing, then Archive and upload through Organizer.

The GitHub build workflow prepares a complete Web archive and builds the unsigned simulator app. A simulator build is **not an installable signed iPhone app**. A TestFlight build requires the owner's Apple signing and App Store Connect access. No signing credentials are stored in this project.

## Device acceptance before TestFlight

- Airplane mode: cold launch each of the four stages and open multiple library categories.
- Import an image and DXF; calibrate; transfer both ways and verify dimensions.
- Save `.ses` to Files, close the app, reopen and restore all four stages.
- Cancel the Files exporter: keep the current project editable.
- Place furniture, sewer routes and electrical lighting rooms; rotate the device repeatedly.
- Check memory pressure on iPad Air 2 and Safari/WebKit compatibility on actual hardware.
- Verify PNG, PDF/print, file picker, popover, Arabic/English, and accessibility.

Web integration checks: `../tests/four-stages.html`. Passing browser checks and an unsigned compile do not substitute for the device acceptance above.

Apple references: [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview), [WKDownloadDelegate](https://developer.apple.com/documentation/webkit/wkdownloaddelegate), [NWListener](https://developer.apple.com/documentation/network/nwlistener).
