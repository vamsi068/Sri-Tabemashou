@echo off
setlocal
cd /d "%~dp0"

echo ================================================
echo Sri Tabemashou - Enable Firebase Email/Password
echo ================================================
echo.

echo This will configure Email/Password authentication
echo for Firebase project: sri-tabemashou
 echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)

where npx >nul 2>nul
if errorlevel 1 (
  echo ERROR: npx is not available with your Node.js installation.
  pause
  exit /b 1
)

echo Step 1/2: Firebase login...
npx --yes firebase-tools login
if errorlevel 1 (
  echo.
  echo Firebase login failed or was cancelled.
  pause
  exit /b 1
)

echo.
echo Step 2/2: Deploying Authentication configuration...
npx --yes firebase-tools deploy --only auth --project sri-tabemashou
if errorlevel 1 (
  echo.
  echo Authentication deployment failed.
  echo You can enable Email/Password manually in Firebase Console.
  pause
  exit /b 1
)

echo.
echo ================================================
echo SUCCESS: Email/Password Authentication enabled.
echo ================================================
echo.
echo Now open login.html and create the first Admin.
echo.
pause
