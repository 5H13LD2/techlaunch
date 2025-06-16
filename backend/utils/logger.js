const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: logFormat,
    handleExceptions: true,
    handleRejections: true,
    maxsize: 5242880, // 5MB
    maxFiles: 10
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10
  })
];

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  transports,
  exitOnError: false
});

// Add custom methods for better usability
logger.database = (message, meta = {}) => {
  logger.info(`[DATABASE] ${message}`, meta);
};

logger.api = (message, meta = {}) => {
  logger.info(`[API] ${message}`, meta);
};

logger.lesson = (message, meta = {}) => {
  logger.info(`[LESSON] ${message}`, meta);
};

logger.firebase = (message, meta = {}) => {
  logger.info(`[FIREBASE] ${message}`, meta);
};

logger.performance = (message, meta = {}) => {
  logger.info(`[PERFORMANCE] ${message}`, meta);
};

// Helper method to log HTTP requests
logger.httpRequest = (req, res, responseTime) => {
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'Unknown';
  const contentLength = res.get('content-length') || 0;
  
  logger.http(`${method} ${url}`, {
    ip,
    userAgent,
    statusCode: res.statusCode,
    contentLength,
    responseTime: `${responseTime}ms`
  });
};

// Helper method to log lesson operations
logger.lessonOperation = (operation, lessonId, details = {}) => {
  logger.lesson(`${operation} lesson: ${lessonId}`, details);
};

// Helper method to log Firebase operations
logger.firebaseOperation = (operation, collection, docId, details = {}) => {
  logger.firebase(`${operation} ${collection}/${docId}`, details);
};

// Helper method to log performance metrics
logger.performanceMetric = (operation, duration, details = {}) => {
  logger.performance(`${operation} completed in ${duration}ms`, details);
};

// Helper method to log structured errors
logger.structuredError = (error, context = {}) => {
  logger.error('Structured error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    context
  });
};

// Helper method to create child logger with context
logger.child = (context) => {
  return {
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
    http: (message, meta = {}) => logger.http(message, { ...context, ...meta })
  };
};

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log startup message
logger.info('Logger initialized', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: logger.level,
  logDirectory: logsDir
});

module.exports = logger;