Unicode true
Name "SmartRender V11.74"
OutFile "runtime/SmartRender-Desktop.exe"
Icon "runtime/smartrender.ico"
RequestExecutionLevel user
VIProductVersion "11.74.0.0"
VIAddVersionKey "ProductName" "SmartRender"
VIAddVersionKey "FileDescription" "SmartRender Desktop"
VIAddVersionKey "FileVersion" "11.74.0"
SilentInstall silent
AutoCloseWindow true
Section
Exec '"$EXEDIR\SmartRender-Core.exe"'
SectionEnd
