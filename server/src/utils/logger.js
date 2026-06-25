const timestamp = () => new Date().toISOString();

const logger = {
  info: (message) => {
    console.log(`[${timestamp()}] INFO: ${message}`);
  },
  warn: (message) => {
    console.warn(`[${timestamp()}] WARN: ${message}`);
  },
  error: (message) => {
    console.error(`[${timestamp()}] ERROR: ${message}`);
  },
  debug: (message) => {
    console.debug(`[${timestamp()}] DEBUG: ${message}`);
  }
};

module.exports = logger;
