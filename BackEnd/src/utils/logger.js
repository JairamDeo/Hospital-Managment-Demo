import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize } = format;

const isServerless = Boolean(process.env.VERCEL) || process.env.DISABLE_FILE_LOGS === 'true';

const addFileDetails = format((info) => {
  const oldStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, structuredStackTrace) => structuredStackTrace;
  const err = new Error();
  const stack = err.stack;
  Error.prepareStackTrace = oldStackTrace;

  if (stack && stack.length > 3) {
    const frame = stack[3];
    info.file = path.basename(frame.getFileName() || 'unknown');
    info.line = frame.getLineNumber();
    info.functionName = frame.getFunctionName() || 'anonymous';
  } else {
    info.file = 'unknown';
    info.line = 0;
    info.functionName = 'unknown';
  }

  return info;
});

const logFormat = printf(({ timestamp, level, message, file, line, functionName }) => {
  return `${timestamp} [${level}] [${file}:${line} - ${functionName}] ${message}`;
});

const consoleTransport = new transports.Console({
  format: combine(colorize(), addFileDetails(), timestamp(), logFormat),
});

const loggerTransports = [consoleTransport];

if (!isServerless) {
  loggerTransports.push(
    new transports.File({ filename: 'logs/app.log', level: 'info' }),
    new transports.File({ filename: 'logs/error.log', level: 'error' })
  );
}

export const logger = createLogger({
  level: 'debug',
  format: combine(addFileDetails(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: loggerTransports,
  exceptionHandlers: isServerless
    ? [consoleTransport]
    : [new transports.File({ filename: 'logs/exceptions.log', level: 'exception' })],
  rejectionHandlers: isServerless
    ? [consoleTransport]
    : [new transports.File({ filename: 'logs/rejections.log', level: 'rejection' })],
});

export default logger;
