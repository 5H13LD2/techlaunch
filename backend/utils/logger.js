const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    return JSON.stringify(logEntry);
  }

  writeToFile(level, message, data = null) {
    try {
      const logFile = path.join(this.logsDir, `${level}.log`);
      const logEntry = this.formatMessage(level, message, data);
      fs.appendFileSync(logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, data = null) {
    console.log(`[INFO] ${message}`, data || '');
    this.writeToFile('info', message, data);
  }

  error(message, data = null) {
    console.error(`[ERROR] ${message}`, data || '');
    this.writeToFile('error', message, data);
  }

  warn(message, data = null) {
    console.warn(`[WARN] ${message}`, data || '');
    this.writeToFile('warn', message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '');
      this.writeToFile('debug', message, data);
    }
  }
}

module.exports = new Logger();