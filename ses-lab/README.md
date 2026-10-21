# SES isolated four-stage preview

All four applications are copied independently under apps/: ColorPlan, FurniPlan, SewerPlan, and ElectricalPlan. Approved standalone program directories and ses-studio remain unchanged.

The shared .ses format retains each stage native editable data, base map, pixel dimensions and calibration. The menu is a yellow floating button at the bottom left. Programs initialize only when opened. Local preferences and IndexedDB backups are isolated per stage.

Run browser checks at tests/four-stages.html. Apple wrapper, unsigned simulator build instructions, and device acceptance checklist are in apple/README.md. Bundle preparation extracts large inline images into deduplicated local files, updates actual progress weights, and writes an integrity manifest.

No TestFlight upload or Apple signing is part of the unsigned preview build.
