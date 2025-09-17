const isDevelopment = process.env.NODE_ENV === 'development';
const isDemo = process.env.SMS_PROVIDER === 'demo';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment || isDemo) {
      console.log(message, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  demo: (message: string, ...args: any[]) => {
    if (isDemo) {
      console.log(message, ...args);
    }
  }
};