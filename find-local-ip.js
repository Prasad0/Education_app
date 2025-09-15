#!/usr/bin/env node

const os = require('os');

console.log('🔍 Finding your local IP address...\n');

const interfaces = os.networkInterfaces();
const localIPs = [];

Object.keys(interfaces).forEach((name) => {
  interfaces[name].forEach((networkInterface) => {
    // Skip internal and non-IPv4 addresses
    if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
      localIPs.push({
        name: name,
        address: networkInterface.address,
        netmask: networkInterface.netmask,
        family: networkInterface.family
      });
    }
  });
});

if (localIPs.length === 0) {
  console.log('❌ No local IP addresses found');
} else {
  console.log('✅ Found local IP addresses:\n');
  
  localIPs.forEach((ip, index) => {
    console.log(`${index + 1}. ${ip.name}: ${ip.address}`);
    
    // Highlight common local network ranges
    if (ip.address.startsWith('192.168.')) {
      console.log('   📱 Good for mobile development');
    } else if (ip.address.startsWith('10.')) {
      console.log('   🏢 Corporate/enterprise network');
    } else if (ip.address.startsWith('172.')) {
      console.log('   🏢 Corporate/enterprise network');
    }
    console.log('');
  });
  
  console.log('💡 Update these files with your IP address:');
  console.log('   - src/config/environment.ts (line 25)');
  console.log('   - android/app/src/main/res/xml/network_security_config.xml');
  console.log('\n🚀 Then restart your development server!');
}

console.log('\n📋 Manual commands to find IP:');
console.log('   Windows: ipconfig');
console.log('   Mac/Linux: ifconfig');
console.log('   Linux: ip addr show');
