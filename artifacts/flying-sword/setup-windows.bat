@echo off
setlocal

echo.
echo  ============================================
echo   Flying Sword ^| Local Windows Setup
echo  ============================================
echo.

REM --- Step 1: Make sure we are in the right folder ---
if not exist "package.local.json" (
    echo ERROR: Cannot find package.local.json
    echo Please make sure you are running this script from:
    echo   artifacts\flying-sword\
    echo.
    pause
    exit /b 1
)

REM --- Step 2: Backup original, copy local package.json ---
echo [1/4] Replacing package.json with local version...
if exist "package.json" (
    copy /Y "package.json" "package.workspace.json" >nul
)
copy /Y "package.local.json" "package.json" >nul
if errorlevel 1 (
    echo ERROR: Failed to copy package.local.json to package.json
    pause
    exit /b 1
)
echo       Done. (Original saved as package.workspace.json)

REM --- Step 3: Delete old node_modules and lock file to force clean install ---
echo [2/4] Cleaning old node_modules...
if exist "node_modules" (
    rmdir /S /Q "node_modules"
    echo       Removed old node_modules
) else (
    echo       No old node_modules found
)
if exist "package-lock.json" del /Q "package-lock.json"
if exist "pnpm-lock.yaml" del /Q "pnpm-lock.yaml" 2>nul

REM --- Step 4: Install ---
echo [3/4] Running npm install...
echo       (This takes 2-3 minutes on first run)
npm install
if errorlevel 1 (
    echo.
    echo Install failed. Trying with --legacy-peer-deps...
    npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: npm install failed. See errors above.
        pause
        exit /b 1
    )
)
echo       Done.

REM --- Step 5: Start ---
echo [4/4] Starting dev server...
echo.
echo  ============================================
echo   App running at: http://localhost:5173
echo   Dashboard:      http://localhost:5173/os
echo   Terminal:       http://localhost:5173/os/terminal
echo.
echo   Keep your backend running at localhost:9999
echo  ============================================
echo.
npm run dev

pause
