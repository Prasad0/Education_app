# API Setup Guide for Development and Production

## Overview

This guide explains how to configure your React Native/Expo app to work with APIs in both development and production environments.

## 🚀 Quick Start

### 1. Find Your Local IP Address

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your network adapter.

**On Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### 2. Update Configuration Files

The configuration now uses the same server for both environments:
- **Development**: `http://65.0.135.170/api` (port 3000)
- **Production**: `http://65.0.135.170/api` (default port 80)

No manual IP updates needed - the configuration automatically switches between ports.

### 3. Test Your Setup

```bash
# Start development server
npx expo start

# Check environment info in console
# You should see: 🌍 API Environment: development
```

## 📁 File Structure

```
src/
├── config/
│   ├── api.ts              # Main axios configuration
│   └── environment.ts      # Environment management
android/
└── app/
    └── src/
        └── main/
            └── res/
                └── xml/
                    └── network_security_config.xml
```

## 🔧 Configuration Details

### Environment Files

- **Development**: Uses HTTP with development port (e.g., `http://65.0.135.170:3000`)
- **Production**: Uses HTTP with production port (e.g., `http://65.0.135.170`)

### Automatic Environment Detection

The app automatically detects the environment:
- `__DEV__ = true` → Development mode
- `__DEV__ = false` → Production mode

## 🛡️ Security Configuration

### Android

1. **Network Security Config**: `android/app/src/main/res/xml/network_security_config.xml`
2. **AndroidManifest.xml**: Add these attributes to `<application>` tag:
   ```xml
   android:networkSecurityConfig="@xml/network_security_config"
   android:usesCleartextTraffic="true"
   ```

### iOS

For iOS, add this to your `Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.1.100</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.0</string>
        </dict>
    </dict>
</dict>
```

## 🔍 Error Handling

### Enhanced Error Logging

The new configuration includes:
- **Request/Response Logging**: Full details in development
- **Error Categorization**: Network, HTTP, and setup errors
- **User-Friendly Messages**: Clear error messages for users
- **Automatic Token Management**: Handles 401 errors automatically

### Error Types

1. **Network Errors**: No internet connection
2. **HTTP Errors**: Server responses (4xx, 5xx)
3. **Request Errors**: Malformed requests
4. **Authentication Errors**: Token expiration

## 🧪 Testing

### Development Testing

```typescript
import { getEnvironmentInfo } from './src/config/environment';

// Check current environment
console.log(getEnvironmentInfo());

// Test API calls
import api from './src/config/api';
api.get('/test-endpoint');
```

### Production Testing

1. Build production APK/IPA
2. Test on real device
3. Verify HTTPS connections
4. Check error handling

## 🔄 Environment Switching

### Manual Override

You can manually override the environment:

```typescript
// Force development mode (for testing)
process.env.NODE_ENV = 'development';

// Force production mode
process.env.NODE_ENV = 'production';
```

### Build Configuration

In your `eas.json`:
```json
{
  "build": {
    "development": {
      "env": {
        "NODE_ENV": "development"
      }
    },
    "production": {
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **API calls fail in production**: Check HTTPS configuration
2. **Local development not working**: Verify IP address and network security config
3. **Authentication errors**: Check token storage and interceptor logic

### Debug Commands

```bash
# Check environment
npx expo-doctor

# View build logs
eas build:list

# Check network configuration
npx expo start --clear
```

## 📱 Platform-Specific Notes

### Android

- Network security config required for HTTP in development
- Cleartext traffic must be explicitly allowed
- Emulator uses `10.0.2.2` for localhost

### iOS

- App Transport Security (ATS) enforces HTTPS by default
- HTTP exceptions must be configured in Info.plist
- Simulator uses `localhost` or `127.0.0.1`

## 🔐 Security Best Practices

1. **Never use HTTP in production**
2. **Use environment variables for sensitive data**
3. **Implement proper token management**
4. **Log errors appropriately for each environment**
5. **Use HTTPS for all production APIs**

## 📞 Support

If you encounter issues:
1. Check the console logs for detailed error information
2. Verify your local IP address is correct
3. Ensure network security configurations are properly set
4. Test with a simple API endpoint first
