@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

REM 在 Windows 上把 fitness-coach 打包成桌面 App（FitnessCoach.exe）
REM 需要：能联网（脚本会下载 NW.js 运行时）
set NW_VER=v0.98.0
set NW_URL=https://dl.nwjs.io/%NW_VER%/nwjs-%NW_VER%-win-x64.zip
set APP=FitnessCoach

echo 下载 NW.js ...
powershell -Command "Invoke-WebRequest -Uri '%NW_URL%' -OutFile '%APP%.zip'"
echo 解压 ...
powershell -Command "Expand-Archive -Force '%APP%.zip' '%APP%-tmp'"
move "%APP%-tmp\nwjs-%NW_VER%-win-x64" "%APP%"
del /q "%APP%.zip"
rd /s /q "%APP%-tmp"

copy "%~dp0index.html" "%APP%\index.html"
copy "%~dp0package.json" "%APP%\package.json"
where node >nul 2>&1 && node "%~dp0make-icon.js" "%APP%\icon.png"

ren "%APP%\nw.exe" "FitnessCoach.exe"
echo 完成: %APP%\FitnessCoach.exe
echo 双击 FitnessCoach.exe 即可使用（数据存于本机 AppData，不会上传任何地方）。
pause
