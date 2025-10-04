import { Platform } from 'react-native';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Environment configuration interface
interface EnvironmentConfig {
  name: Environment;
  apiBaseUrl: string;
  baseUrl: string;
  timeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  allowHttp: boolean;
  features: {
    analytics: boolean;
    crashReporting: boolean;
    debugMenu: boolean;
  };
}

// Get your local machine's IP address
// You can find this by running 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
const getLocalIP = (): string => {
  // Using the same server for development and production
  // Development uses port 3000, production uses default port 80
  return '13.200.17.30';
};

// Environment configurations
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    apiBaseUrl: `http://13.200.17.30:3000/api`,
    baseUrl: `http://13.200.17.30:3000/`,
    timeout: 10000,
    logLevel: 'debug',
    allowHttp: true,
    features: {
      analytics: false,
      crashReporting: false,
      debugMenu: true,
    },
  },
  staging: {
    name: 'staging',
    apiBaseUrl: 'http://13.200.17.30/api',
    baseUrl: 'http://13.200.17.30/',
    timeout: 15000,
    logLevel: 'info',
    allowHttp: false,
    features: {
      analytics: true,
      crashReporting: false,
      debugMenu: true,
    },
  },
  production: {
    name: 'production',
    apiBaseUrl: 'http://13.200.17.30/api',
    baseUrl: 'http://13.200.17.30',
    timeout: 15000,
    logLevel: 'error',
    allowHttp: true,
    features: {
      analytics: true,
      crashReporting: true,
      debugMenu: false,
    },
  },
};

// Determine current environment
export const getCurrentEnvironment = (): Environment => {
  if (__DEV__) {
    return 'development';
  }
  
  // You can add logic here to determine staging vs production
  // For example, based on build configuration or environment variables
  return 'production';
};

// Get current environment configuration
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment();
  return environments[env];
};

// Environment-specific utilities
export const isDevelopment = (): boolean => getCurrentEnvironment() === 'development';
export const isProduction = (): boolean => getCurrentEnvironment() === 'production';
export const isStaging = (): boolean => getCurrentEnvironment() === 'staging';

// Feature flags
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  const config = getEnvironmentConfig();
  return config.features[feature];
};

// Network configuration
export const getNetworkConfig = () => {
  const config = getEnvironmentConfig();
  return {
    baseUrl: config.baseUrl,
    apiBaseUrl: config.apiBaseUrl,
    timeout: config.timeout,
    allowHttp: config.allowHttp,
    platform: Platform.OS,
  };
};

// Logging configuration
export const getLogConfig = () => {
  const config = getEnvironmentConfig();
  return {
    level: config.logLevel,
    enableConsole: isDevelopment(),
    enableRemoteLogging: isProduction() || isStaging(),
  };
};

// Export environment info for debugging
export const getEnvironmentInfo = () => ({
  environment: getCurrentEnvironment(),
  config: getEnvironmentConfig(),
  platform: Platform.OS,
  isDev: __DEV__,
  version: '1.0.0', // You can get this from package.json
});

// Default export
export default getEnvironmentConfig;
