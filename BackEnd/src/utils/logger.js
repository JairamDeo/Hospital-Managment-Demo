import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize } = format;

// Defined the custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create the logger instance with specific configurations
export const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/app.log', level: 'info' }),  // Info and higher
    new transports.File({ filename: 'logs/error.log', level: 'error' }) // Error and higher
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' })
  ],
});

export default logger;
