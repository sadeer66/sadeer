Unicode true
!include "MUI2.nsh"
Name "Smart Render V11.81"
OutFile "../output/SmartRender-V11.81-Setup.exe"
InstallDir "$LOCALAPPDATA\SmartRender"
InstallDirRegKey HKCU "Software\SmartRender" "InstallDir"
RequestExecutionLevel user
SetCompressor zlib
SetCompress force
ShowInstDetails show
ShowUninstDetails show
VIProductVersion "11.81.0.0"
VIAddVersionKey "ProductName" "Smart Render"
VIAddVersionKey "FileDescription" "Smart Render Setup"
VIAddVersionKey "FileVersion" "11.81.0"
VIAddVersionKey "CompanyName" "Sadeer Yaseen Mohammed"
VIAddVersionKey "LegalCopyright" "Sadeer Yaseen Mohammed"
Icon "app/smartrender.ico"
UninstallIcon "app/smartrender.ico"
!define MUI_ICON "app/smartrender.ico"
!define MUI_UNICON "app/smartrender.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to Smart Render Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will install Smart Render V11.81 on your computer.$\r$\n$\r$\nPlease close Smart Render before continuing.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN "$INSTDIR\SmartRender.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run Smart Render"
!define MUI_FINISHPAGE_TEXT "Smart Render has been installed.$\r$\n$\r$\nClick Finish to close Setup."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Section "Smart Render"
SetShellVarContext current
check_running:
FindWindow $0 "Chrome_WidgetWin_1" "Smart Render Desktop"
StrCmp $0 0 check_file
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Save your project and close Smart Render, then click Retry." IDRETRY check_running
Abort
check_file:
IfFileExists "$INSTDIR\SmartRender.exe" 0 install_ready
ClearErrors
FileOpen $1 "$INSTDIR\SmartRender.exe" a
IfErrors file_busy
FileClose $1
Goto install_ready
file_busy:
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Close the previous Smart Render application, then click Retry." IDRETRY check_running
Abort
install_ready:
SetOutPath "$INSTDIR"
File "app/SmartRender.exe"
File "app/smartrender.ico"
SetOutPath "$INSTDIR\runtime"
File /r /x ".*" "app/runtime/*"
SetOutPath "$INSTDIR\resources"
File /r "app/resources/*"
SetOutPath "$INSTDIR"
WriteUninstaller "$INSTDIR\Uninstall.exe"
CreateDirectory "$SMPROGRAMS\SmartRender"
CreateShortcut "$DESKTOP\SmartRender.lnk" "$INSTDIR\SmartRender.exe" "" "$INSTDIR\smartrender.ico" 0 SW_SHOWMAXIMIZED
CreateShortcut "$SMPROGRAMS\SmartRender\SmartRender.lnk" "$INSTDIR\SmartRender.exe" "" "$INSTDIR\smartrender.ico" 0 SW_SHOWMAXIMIZED
CreateShortcut "$SMPROGRAMS\SmartRender\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
WriteRegStr HKCU "Software\SmartRender" "InstallDir" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "DisplayName" "Smart Render"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "DisplayVersion" "11.81"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "Publisher" "Sadeer Yaseen Mohammed"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "InstallLocation" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "DisplayIcon" "$INSTDIR\smartrender.ico"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "UninstallString" '"$INSTDIR\Uninstall.exe"'
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "NoModify" 1
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "NoRepair" 1
SectionEnd
Section "Uninstall"
SetShellVarContext current
check_uninstall:
FindWindow $0 "Chrome_WidgetWin_1" "Smart Render Desktop"
StrCmp $0 0 uninstall_ready
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Close Smart Render before uninstalling." IDRETRY check_uninstall
Abort
uninstall_ready:
Delete "$DESKTOP\SmartRender.lnk"
Delete "$SMPROGRAMS\SmartRender\SmartRender.lnk"
Delete "$SMPROGRAMS\SmartRender\Uninstall.lnk"
RMDir "$SMPROGRAMS\SmartRender"
Delete "$INSTDIR\web\index.html"
Delete "$INSTDIR\web\favicon.ico"
Delete "$INSTDIR\web\apple-touch-icon.png"
RMDir "$INSTDIR\web"
RMDir /r "$INSTDIR\runtime"
RMDir /r "$INSTDIR\resources"
Delete "$INSTDIR\SmartRender.exe"
Delete "$INSTDIR\smartrender.ico"
Delete "$INSTDIR\Uninstall.exe"
RMDir "$INSTDIR"
DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender"
DeleteRegKey HKCU "Software\SmartRender"
SectionEnd
