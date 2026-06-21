@echo off
echo.
echo  ========================================
echo   Flying Sword - AI DEV OS
echo   Local Windows Setup
echo  ========================================
echo.

REM Copy local package.json (no pnpm workspace, no Replit deps)
echo [1/4] Preparing package.json for Windows...
copy /Y package.local.json package.json.backup 2>nul
copy /Y package.local.json package.json
if errorlevel 1 (
    echo ERROR: Could not copy package.local.json
    pause
    exit /b 1
)
echo       OK

REM Create assets folder if not exists
echo [2/4] Creating assets folder...
if not exist "src\assets" mkdir "src\assets"
echo       OK

REM Install dependencies
echo [3/4] Installing dependencies (npm install)...
echo       This may take 2-3 minutes on first run...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    echo Try: npm install --legacy-peer-deps
    pause
    exit /b 1
)
echo       OK

REM Done
echo [4/4] Setup complete!
echo.
echo  ========================================
echo   Starting dev server...
echo   Frontend: http://localhost:5173
echo   Dashboard: http://localhost:5173/os
echo.
echo   Make sure your backend is running at:
echo   http://localhost:9999
echo  ========================================
echo.
npm run dev
pause
