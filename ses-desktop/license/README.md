# Offline device activation

This branch adds signed permanent per-device licenses to the isolated SES Windows copy. Existing preview installer, master, Apple builds, and standalone apps are unchanged.

## Owner setup (one time)

1. Install SES License Manager on the owner's Windows computer.
2. Choose a password of at least 12 characters and generate the owner key pair locally.
3. Keep `SES-Owner-Private.pem` and its password private and backed up. The private key is an encrypted PKCS#8 Ed25519 key. It never goes into GitHub, CI, or customer apps.
4. Supply only `SES-Public-Key.json` to the builder. Replace `ses-desktop/license/public-keys.json` with that public configuration and rebuild the customer installer. The build refuses to package a customer app without a configured public key.

Do not generate a new owner key for each customer. Losing the password or private key prevents new licenses under that key; existing signed permanent licenses continue to verify.

## Customer activation

On first launch the customer sees an activation screen, copies the device code or exports a `.sesrequest` file, and sends it to the owner. The owner opens the request, enters the customer's name, selects purchased programs, and signs a `.seslicense` file using their encrypted private key and password. The customer imports that file once. Subsequent launches verify locally with no server or Internet access. Default licenses are permanent and have no time restriction.

The device code is derived from Windows MachineGuid, salted and hashed; raw MachineGuid is not exported. Reinstalling/cloning Windows or moving to a different device can require reactivation. A license belongs to one Windows installation. Multiple-device entitlement counts and replacement-device decisions are managed manually by the owner; there is no central online seat counter or remote revocation.

## Owner records

Every issued license is automatically recorded before its output file is saved. The local owner registry is encrypted with Windows DPAPI and lists customer, device code, license ID, purchased programs, and issue date. Search and exact re-export of the original signed license are available. `.sesregistry` backups merge without deleting existing records or duplicating license IDs; each license signature is checked during restore. Backups contain signed customer licenses and public verification keys, but never owner private keys or passwords. Keep exported backups private because they contain customer information. The ledger records issuance, not online activation or usage.

## Boundaries

Signature verification and entitlement checks run in Electron's main process. The local server refuses requests before activation and blocks unpurchased program code. IPC validates the exact top-level sender. Activation state is encrypted with Windows DPAPI and re-verified on each launch. Packaged apps never enable CI test fixtures or `--smoke-test` bypasses. The customer package includes only the public verification key and excludes the issuing tool, test fixture, and all private keys.

The tests generate throwaway keys in memory, verify tamper/wrong-device/unknown-key rejection, check the locked server, exercise Windows DPAPI persistence, then run the four-program UI tests. No production owner key is generated in CI.

Offline licensing deters casual unauthorized use; it cannot make local code unextractable or stop a skilled attacker patching the executable. Existing public source and standalone web versions remain accessible as before. This license change does not privatize them. The mechanism does not encrypt all Web resources, implement code obfuscation, or constitute commercial code signing.
