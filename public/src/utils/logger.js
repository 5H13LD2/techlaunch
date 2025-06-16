// logger.js - Frontend logging utility
// A simplified version of Winston logger for browser environment

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const LOG_COLORS = {
    error: '🔴',
    warn: '🟡',
    info: '🔵',
    debug: '🟢'
};

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.service = options.service || 'frontend-service';
        this.logs = [];
        this.maxLogs = options.maxLogs || 1000; // Keep last 1000 logs in memory
    }

    _formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            service: this.service,
            ...meta
        };

        // Store log in memory
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift(); // Remove oldest log
        }

        // Format for console
        const emoji = LOG_COLORS[level] || '⚪';
        const formattedMessage = `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            return `${formattedMessage}\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return formattedMessage;
    }

    _shouldLog(level) {
        return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
    }

    _log(level, message, meta = {}) {
        if (!this._shouldLog(level)) return;

        const formattedMessage = this._formatMessage(level, message, meta);

        // Console output
        switch (level) {
            case 'error':
                console.error(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'info':
                console.info(formattedMessage);
                break;
            case 'debug':
                console.debug(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }

        // In development, also log to localStorage
        if (process.env.NODE_ENV !== 'production') {
            try {
                const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
                logs.push({
                    timestamp: new Date().toISOString(),
                    level,
                    message,
                    meta,
                    service: this.service
                });
                // Keep only last 100 logs in localStorage
                if (logs.length > 100) logs.shift();
                localStorage.setItem('app_logs', JSON.stringify(logs));
            } catch (error) {
                console.warn('Failed to store log in localStorage:', error);
            }
        }
    }

    error(message, meta = {}) {
        this._log('error', message, meta);
    }

    warn(message, meta = {}) {
        this._log('warn', message, meta);
    }

    info(message, meta = {}) {
        this._log('info', message, meta);
    }

    debug(message, meta = {}) {
        this._log('debug', message, meta);
    }

    // Get all stored logs
    getLogs() {
        return [...this.logs];
    }

    // Clear stored logs
    clearLogs() {
        this.logs = [];
        if (process.env.NODE_ENV !== 'production') {
            localStorage.removeItem('app_logs');
        }
    }

    // Export logs as JSON
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Create and export a singleton instance
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    service: 'frontend-service'
});

export default logger;

// Usage examples:
/*
import logger from './utils/logger.js';

// Basic logging
logger.info('📝 User logged in');
logger.error('❌ Failed to fetch data', { userId: '123', error: 'Network error' });

// With metadata
logger.debug('🔍 Searching courses', { 
    query: 'javascript',
    filters: { category: 'programming' }
});

// Get stored logs
const logs = logger.getLogs();

// Export logs
const logsJson = logger.exportLogs();

// Clear logs
logger.clearLogs();
*/ 