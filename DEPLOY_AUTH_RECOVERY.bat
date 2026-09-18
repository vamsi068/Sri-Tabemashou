@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo Sri Tabemashou Firebase Auth + Recovery Deploy
echo ================================================
echo.
where firebase >nul 2>nul
if errorlevel 1 (
  echo Firebase CLI is not installed.
  echo Install it with: npm install -g firebase-tools
  pause
  exit /b 1
)
call firebase login
if errorlevel 1 exit /b 1
call firebase use sri-tabemashou
if errorlevel 1 exit /b 1
call firebase deploy --only auth,firestore,functions
if errorlevel 1 (
  echo.
  echo Deployment failed. Check the error above.
  pause
  exit /b 1
)
echo.
echo Deployment completed.
echo Enable Phone provider and Email/Password in Firebase Console if they are not enabled.
pause
