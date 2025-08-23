#!/bin/bash

echo "🚀 Setting up Coaching Finder App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if React Native CLI is installed
if ! command -v npx react-native &> /dev/null; then
    echo "📱 Installing React Native CLI..."
    npm install -g @react-native-community/cli
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To run the app:"
echo "  📱 Start Metro: npm start"
echo "  🤖 Run Android: npm run android"
echo "  🍎 Run iOS: npm run ios"
echo ""
echo "Demo credentials:"
echo "  📱 Phone: Any valid number (10+ digits)"
echo "  🔐 OTP: 123456"
echo ""
echo "Happy coding! 🚀"
