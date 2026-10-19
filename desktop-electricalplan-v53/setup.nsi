Unicode true
!include "MUI2.nsh"
Name "ElectricalPlan V53.0"
OutFile "../output/ElectricalPlan-V53.0-Setup.exe"
InstallDir "$LOCALAPPDATA\ElectricalPlan"
InstallDirRegKey HKCU "Software\ElectricalPlan" "InstallDir"
RequestExecutionLevel user
SetCompressor zlib
SetCompress force
ShowInstDetails show
ShowUninstDetails show
VIProductVersion "53.0.0.0"
VIAddVersionKey "ProductName" "ElectricalPlan"
VIAddVersionKey "FileDescription" "ElectricalPlan Setup"
VIAddVersionKey "FileVersion" "53.0.0"
VIAddVersionKey "CompanyName" "Sadeer Yaseen Mohammed"
VIAddVersionKey "LegalCopyright" "Sadeer Yaseen Mohammed"
Icon "app/electricalplan.ico"
UninstallIcon "app/electricalplan.ico"
!define MUI_ICON "app/electricalplan.ico"
!define MUI_UNICON "app/electricalplan.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to ElectricalPlan Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will install ElectricalPlan V53.0 on your computer.$\r$\n$\r$\nPlease close ElectricalPlan before continuing.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN "$INSTDIR\ElectricalPlan.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run ElectricalPlan"
!define MUI_FINISHPAGE_TEXT "ElectricalPlan has been installed.$\r$\n$\r$\nClick Finish to close Setup."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Section "ElectricalPlan"
SetShellVarContext current
check_running:
FindWindow $0 "Chrome_WidgetWin_1" "ElectricalPlan Desktop"
StrCmp $0 0 check_file
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Save your project and close ElectricalPlan, then click Retry." IDRETRY check_running
Abort
check_file:
IfFileExists "$INSTDIR\ElectricalPlan.exe" 0 install_ready
ClearErrors
FileOpen $1 "$INSTDIR\ElectricalPlan.exe" a
IfErrors file_busy
FileClose $1
Goto install_ready
file_busy:
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Close the previous ElectricalPlan application, then click Retry." IDRETRY check_running
Abort
install_ready:
SetOutPath "$INSTDIR"
File "app/ElectricalPlan.exe"
File "app/electricalplan.ico"
SetOutPath "$INSTDIR\runtime"
File /r /x ".*" "app/runtime/*"
SetOutPath "$INSTDIR\resources"
File /r "app/resources/*"
SetOutPath "$INSTDIR"
WriteUninstaller "$INSTDIR\Uninstall.exe"
CreateDirectory "$SMPROGRAMS\ElectricalPlan"
CreateShortcut "$DESKTOP\ElectricalPlan.lnk" "$INSTDIR\ElectricalPlan.exe" "" "$INSTDIR\electricalplan.ico" 0 SW_SHOWMAXIMIZED
CreateShortcut "$SMPROGRAMS\ElectricalPlan\ElectricalPlan.lnk" "$INSTDIR\ElectricalPlan.exe" "" "$INSTDIR\electricalplan.ico" 0 SW_SHOWMAXIMIZED
CreateShortcut "$SMPROGRAMS\ElectricalPlan\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
WriteRegStr HKCU "Software\ElectricalPlan" "InstallDir" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "DisplayName" "ElectricalPlan"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "DisplayVersion" "53.0"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "Publisher" "Sadeer Yaseen Mohammed"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "InstallLocation" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "DisplayIcon" "$INSTDIR\electricalplan.ico"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "UninstallString" '"$INSTDIR\Uninstall.exe"'
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "NoModify" 1
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan" "NoRepair" 1
SectionEnd
Section "Uninstall"
SetShellVarContext current
check_uninstall:
FindWindow $0 "Chrome_WidgetWin_1" "ElectricalPlan Desktop"
StrCmp $0 0 uninstall_ready
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Close ElectricalPlan before uninstalling." IDRETRY check_uninstall
Abort
uninstall_ready:
Delete "$DESKTOP\ElectricalPlan.lnk"
Delete "$SMPROGRAMS\ElectricalPlan\ElectricalPlan.lnk"
Delete "$SMPROGRAMS\ElectricalPlan\Uninstall.lnk"
RMDir "$SMPROGRAMS\ElectricalPlan"
Delete "$INSTDIR\web\index.html"
Delete "$INSTDIR\web\favicon.ico"
Delete "$INSTDIR\web\apple-touch-icon.png"
RMDir "$INSTDIR\web"
RMDir /r "$INSTDIR\runtime"
RMDir /r "$INSTDIR\resources"
Delete "$INSTDIR\ElectricalPlan.exe"
Delete "$INSTDIR\electricalplan.ico"
Delete "$INSTDIR\Uninstall.exe"
RMDir "$INSTDIR"
DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElectricalPlan"
DeleteRegKey HKCU "Software\ElectricalPlan"
SectionEnd
