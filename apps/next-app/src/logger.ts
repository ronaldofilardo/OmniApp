import pino from 'pino';
import config from './config';

const level = config.env === 'development' ? 'debug' : 'info';

const logger = pino({
  level,
  base: { pid: false },
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;