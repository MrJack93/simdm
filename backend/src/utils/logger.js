/**
 * L3 Fix: Async logger cu Pino
 * Înlocuiește appendFileSync (blocant) cu queue async
 * Suportă console + file transport cu níveluri
 */

const pino = require('pino');

// Transport multiplu: console + file
const transport = pino.transport({
  targets: [
    {
      level: 'info',
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    {
      level: 'debug',
      target: 'pino/file',
      options: { destination: '/tmp/backend.log' },
    },
  ],
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: 'simdm-backend',
      environment: process.env.NODE_ENV || 'development',
    },
  },
  transport
);

/**
 * Log function — API compatibility
 */
function log(msg, level = 'info') {
  // Sanitizare: elimină căi sensibile din logs
  const sanitized = msg
    .replace(/\/sessions\/[^/]+/g, '/***')
    .replace(/\/var\/lib\/[^/]+/g, '/***')
    .replace(/password[=:]\S+/gi, 'password=***');

  if (level === 'error') {
    logger.error(sanitized);
  } else if (level === 'warn') {
    logger.warn(sanitized);
  } else if (level === 'debug') {
    logger.debug(sanitized);
  } else {
    logger.info(sanitized);
  }
}

module.exports = { logger, log };
