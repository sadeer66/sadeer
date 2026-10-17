Unicode true
!include "MUI2.nsh"
Name "SmartRender V11.74"
OutFile "../SmartRender-V11.74-Setup.exe"
InstallDir "$LOCALAPPDATA\SmartRender"
InstallDirRegKey HKCU "Software\SmartRender" "InstallDir"
RequestExecutionLevel user
VIProductVersion "11.74.0.0"
VIAddVersionKey "ProductName" "SmartRender"
VIAddVersionKey "FileDescription" "SmartRender Desktop"
VIAddVersionKey "FileVersion" "11.74.0"
VIAddVersionKey "LegalCopyright" "Sadeer Yaseen Mohammed"
SetCompressor zlib
Icon "runtime/smartrender.ico"
UninstallIcon "runtime/smartrender.ico"
!define MUI_ICON "runtime/smartrender.ico"
!define MUI_UNICON "runtime/smartrender.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\SmartRender-Desktop.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Arabic"
Section "SmartRender"
SetShellVarContext current
IfFileExists "$INSTDIR\SmartRender-Core.exe" 0 install_ready
check_running:
ClearErrors
FileOpen $0 "$INSTDIR\SmartRender-Core.exe" a
IfErrors app_running
FileClose $0
Goto install_ready
app_running:
MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Please save your work and close SmartRender, then click Retry." IDRETRY check_running
Abort
install_ready:
SetOutPath "$INSTDIR"
File /r "runtime/*"
WriteUninstaller "$INSTDIR\Uninstall.exe"
CreateDirectory "$SMPROGRAMS\SmartRender"
CreateShortcut "$DESKTOP\SmartRender.lnk" "$INSTDIR\SmartRender-Desktop.exe" "" "$INSTDIR\smartrender.ico"
CreateShortcut "$SMPROGRAMS\SmartRender\SmartRender.lnk" "$INSTDIR\SmartRender-Desktop.exe" "" "$INSTDIR\smartrender.ico"
CreateShortcut "$SMPROGRAMS\SmartRender\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
WriteRegStr HKCU "Software\SmartRender" "InstallDir" "$INSTDIR"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "DisplayName" "SmartRender"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "DisplayVersion" "11.74"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "Publisher" "Sadeer Yaseen Mohammed"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "DisplayIcon" "$INSTDIR\smartrender.ico"
WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "UninstallString" '"$INSTDIR\Uninstall.exe"'
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "NoModify" 1
WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender" "NoRepair" 1
SectionEnd
Section "Uninstall"
SetShellVarContext current
Delete "$DESKTOP\SmartRender.lnk"
Delete "$SMPROGRAMS\SmartRender\SmartRender.lnk"
Delete "$SMPROGRAMS\SmartRender\Uninstall.lnk"
RMDir "$SMPROGRAMS\SmartRender"
!include "uninstall-files.nsh"
Delete "$INSTDIR\Uninstall.exe"
RMDir "$INSTDIR"
DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartRender"
DeleteRegKey HKCU "Software\SmartRender"
SectionEnd
