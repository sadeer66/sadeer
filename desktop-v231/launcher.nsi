Unicode true
Name "FurniPlan V231"
OutFile "runtime/FurniPlan-Desktop.exe"
Icon "runtime/furniplan.ico"
RequestExecutionLevel user
VIProductVersion "231.0.0.0"
VIAddVersionKey "ProductName" "FurniPlan"
VIAddVersionKey "FileDescription" "FurniPlan Desktop"
VIAddVersionKey "FileVersion" "231.0.0"
SilentInstall silent
AutoCloseWindow true
Section
Exec '"$EXEDIR\FurniPlan-Core.exe"'
SectionEnd
