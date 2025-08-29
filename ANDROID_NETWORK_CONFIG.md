# Android Network Security Configuration

## Required Changes for HTTP Development

To allow HTTP traffic during development, you need to update your Android manifest file.

### 1. Update AndroidManifest.xml

Add the following to your `android/app/src/main/AndroidManifest.xml` file inside the `<application>` tag:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true"
    ... >
```

### 2. File Location

The network security config file is located at:
`android/app/src/main/res/xml/network_security_config.xml`

### 3. What This Configuration Does

- **Development**: Allows HTTP traffic to local IP addresses (192.168.x.x, 10.x.x.x, etc.)
- **Production**: Only allows HTTPS traffic to production servers
- **Security**: Maintains security by default while allowing development flexibility

### 4. Customize for Your Network

Update the IP addresses in `network_security_config.xml` to match your local development environment:

```xml
<domain includeSubdomains="false">YOUR_LOCAL_IP</domain>
```

### 5. Testing

After making these changes:
1. Clean and rebuild your project
2. Test API calls to your local development server
3. Verify production builds still use HTTPS

## Security Notes

- This configuration only affects development builds
- Production builds will enforce HTTPS
- Always use HTTPS for production APIs
- Consider using environment variables to switch between HTTP/HTTPS
