const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isDemo = process.env.SMS_PROVIDER === 'demo';
const enableProductionLogs = process.env.ENABLE_PRODUCTION_LOGS === 'true';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment || isDemo || enableProductionLogs) {
      console.log(`[INFO] ${new Date().toISOString()}:`, message, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (isDevelopment || enableProductionLogs) {
      console.warn(`[WARN] ${new Date().toISOString()}:`, message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, message, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (isDevelopment || enableProductionLogs) {
      console.log(`[DEBUG] ${new Date().toISOString()}:`, message, ...args);
    }
  },

  demo: (message: string, ...args: any[]) => {
    if (isDemo) {
      console.log(`[DEMO] ${new Date().toISOString()}:`, message, ...args);
    }
  },

  production: (message: string, ...args: any[]) => {
    if (isProduction) {
      console.log(`[PROD] ${new Date().toISOString()}:`, message, ...args);
    }
  }
};