Unicode true
!include "MUI2.nsh"
Name "FurniPlan V233"
OutFile "../FurniPlan-V233-Setup.exe"
InstallDir "$LOCALAPPDATA\FurniPlan"
InstallDirRegKey HKCU "Software\FurniPlan" "InstallDir"
RequestExecutionLevel user
VIProductVersion "233.0.0.0"
VIAddVersionKey "ProductName" "FurniPlan"
VIAddVersionKey "FileDescription" "FurniPlan Desktop"
VIAddVersionKey "FileVersion" "233.0.0"
VIAddVersionKey "LegalCopyright" "Sadeer Yaseen Mohammed"
SetCompressor zlib
Icon "runtime/furniplan.ico"
UninstallIcon "runtime/furniplan.ico"
!define MUI_ICON "runtime/furniplan.ico"
!define MUI_UNICON "runtime/furniplan.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\FurniPlan-Desktop.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Arabic"
Section "FurniPlan"
SetShellVarContext current
IfFileExists "$INSTDIR\FurniPlan-Core.exe" 0 install_ready
check_running:
ClearErrors
FileOpen $0 "$INSTDIR\FurniPlan-Core.exe" a
IfErrors app_running
FileClose $0
Goto install_ready
app_running:
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Please save your work and close FurniPlan, then click Retry." IDRETRY check_running
Abort
install_ready:
SetOutPath "$INSTDIR"
File /r "runtime/*"
WriteUninstaller "$INSTDIR\Uninstall.exe"
CreateDirectory "$SMPROGRAMS\FurniPlan"
CreateShortcut "$DESKTOP\FurniPlan.lnk" "$INSTDIR\FurniPlan-Desktop.exe" "" "$INSTDIR\furniplan.ico"
CreateShortcut "$SMPROGRAMS\FurniPlan\FurniPlan.lnk" "$INSTDIR\FurniPlan-Desktop.exe" "" "$INSTDIR\furniplan.ico"
CreateShortcut "$SMPROGRAMS\FurniPlan\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
WriteRegStr HKCU "Software\FurniPlan" "InstallDir" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "DisplayName" "FurniPlan"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "DisplayVersion" "233"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "Publisher" "Sadeer Yaseen Mohammed"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "DisplayIcon" "$INSTDIR\furniplan.ico"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "UninstallString" '"$INSTDIR\Uninstall.exe"'
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "NoModify" 1
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan" "NoRepair" 1
SectionEnd
Section "Uninstall"
SetShellVarContext current
Delete "$DESKTOP\FurniPlan.lnk"
Delete "$SMPROGRAMS\FurniPlan\FurniPlan.lnk"
Delete "$SMPROGRAMS\FurniPlan\Uninstall.lnk"
RMDir "$SMPROGRAMS\FurniPlan"
!include "uninstall-files.nsh"
Delete "$INSTDIR\Uninstall.exe"
RMDir "$INSTDIR"
DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FurniPlan"
DeleteRegKey HKCU "Software\FurniPlan"
SectionEnd
