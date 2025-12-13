@echo off
REM Cloudinary Integration Installation Script for Windows

echo.
echo ========================================
echo  Cloudinary Integration Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing Cloudinary package...
cd backend
call npm install cloudinary

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Cloudinary package
    pause
    exit /b 1
)

echo [2/3] Verifying installation...
call npm list cloudinary

if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not verify Cloudinary installation
)

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Get Cloudinary credentials from https://cloudinary.com/console
echo 2. Add to backend/.env:
echo    CLOUDINARY_CLOUD_NAME=your_cloud_name
echo    CLOUDINARY_API_KEY=your_api_key
echo    CLOUDINARY_API_SECRET=your_api_secret
echo 3. Restart your backend server: npm run dev
echo 4. Test image uploads from Android app
echo.
echo Documentation: See CLOUDINARY_INTEGRATION_GUIDE.md
echo.
pause
