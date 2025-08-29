const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNetworkSecurity = (config) => {
  // First, create the network security config file
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const networkSecurityConfigPath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml/network_security_config.xml'
      );
      
      // Ensure the directory exists
      const dir = path.dirname(networkSecurityConfigPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create the network security config file
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow HTTP traffic for your API server -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">65.0.135.170</domain>
    </domain-config>
    
    <!-- Allow HTTP for local development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">127.0.0.1</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>
    
    <!-- Allow HTTP for common local network ranges -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.0.0/16</domain>
        <domain includeSubdomains="true">10.0.0.0/8</domain>
        <domain includeSubdomains="true">172.16.0.0/12</domain>
    </domain-config>
    
    <!-- Default configuration - allow HTTP by default -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>`;
      
      fs.writeFileSync(networkSecurityConfigPath, networkSecurityConfig);
      console.log('✅ Network security config file created at:', networkSecurityConfigPath);
      
      return config;
    },
  ]);

  // Then, modify the Android manifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Add network security config to application tag
    if (androidManifest.manifest.application && androidManifest.manifest.application[0]) {
      const application = androidManifest.manifest.application[0];
      
      // Add usesCleartextTraffic attribute - CRITICAL for HTTP support
      if (!application.$) {
        application.$ = {};
      }
      application.$['android:usesCleartextTraffic'] = 'true';
      
      // Add networkSecurityConfig attribute
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      
      // Add additional attributes for HTTP support
      application.$['android:requestLegacyExternalStorage'] = 'true';
    }

    // Add permissions if they don't exist
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];
    const hasInternetPermission = permissions.some(
      (permission) => permission.$ && permission.$['android:name'] === 'android.permission.INTERNET'
    );
    const hasNetworkStatePermission = permissions.some(
      (permission) => permission.$ && permission.$['android:name'] === 'android.permission.ACCESS_NETWORK_STATE'
    );

    if (!hasInternetPermission) {
      permissions.push({
        $: {
          'android:name': 'android.permission.INTERNET',
        },
      });
    }

    if (!hasNetworkStatePermission) {
      permissions.push({
        $: {
          'android:name': 'android.permission.ACCESS_NETWORK_STATE',
        },
      });
    }

    // Add application tag attributes for HTTP support
    if (androidManifest.manifest.application && androidManifest.manifest.application[0]) {
      const application = androidManifest.manifest.application[0];
      if (!application.$) {
        application.$ = {};
      }
      
      // These attributes help with HTTP traffic
      application.$['android:allowBackup'] = 'true';
      application.$['android:largeHeap'] = 'true';
    }

    return config;
  });

  return config;
};

module.exports = withNetworkSecurity;
