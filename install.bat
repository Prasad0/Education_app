@echo off
echo 🚀 Setting up Coaching Finder App...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
) else (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo To run the app:
echo   📱 Start Metro: npm start
echo   🤖 Run Android: npm run android
echo   🍎 Run iOS: npm run ios
echo.
echo Demo credentials:
echo   📱 Phone: Any valid number (10+ digits)
echo   🔐 OTP: 123456
echo.
echo Happy coding! 🚀
pause
