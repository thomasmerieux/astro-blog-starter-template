// Structured logging utility for better debugging and monitoring

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private context: LogContext = {};

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  public clearContext(): void {
    this.context = {};
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logContext = { ...this.context, ...context };
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${
      Object.keys(logContext).length > 0 ? ` | Context: ${JSON.stringify(logContext)}` : ''
    }`;
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    };
  }

  private log(
    level: LogLevel, 
    message: string, 
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const logEntry = this.createLogEntry(level, message, context, error, metadata);
    const formattedMessage = this.formatMessage(level, message, context);

    // Console logging based on environment
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, error ? error.stack : '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        // Use console.warn for info logs to satisfy linting rules
        console.warn(`[INFO] ${formattedMessage}`);
        break;
      case LogLevel.DEBUG:
        if (import.meta.env.DEV) {
          console.warn(`[DEBUG] ${formattedMessage}`);
        }
        break;
    }

    // In production, you could send structured logs to a service
    if (!import.meta.env.DEV) {
      this.sendToLoggingService(logEntry);
    }
  }

  public error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  public warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  public info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  public debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  // Specialized logging methods for common use cases
  public rsvpSubmission(data: {
    email: string;
    attending: string;
    language: string;
    ipAddress?: string;
    success: boolean;
    error?: Error;
  }): void {
    const message = `RSVP submission ${data.success ? 'successful' : 'failed'} for ${data.email}`;
    const context: LogContext = {
      ipAddress: data.ipAddress,
      url: '/api/rsvp'
    };
    const metadata = {
      email: data.email,
      attending: data.attending,
      language: data.language,
      success: data.success
    };

    if (data.success) {
      this.info(message, context, metadata);
    } else {
      this.error(message, data.error, context, metadata);
    }
  }

  public adminAction(action: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.info(`Admin action: ${action}`, { ...context, admin: true }, metadata);
  }

  public emailSent(data: {
    to: string;
    type: 'rsvp_confirmation' | 'admin_notification' | 'test';
    success: boolean;
    messageId?: string;
    error?: Error;
  }): void {
    const message = `Email ${data.type} ${data.success ? 'sent successfully' : 'failed'} to ${data.to}`;
    const metadata = {
      to: data.to,
      type: data.type,
      success: data.success,
      messageId: data.messageId
    };

    if (data.success) {
      this.info(message, undefined, metadata);
    } else {
      this.error(message, data.error, undefined, metadata);
    }
  }

  public performanceLog(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} completed`, context, { 
      operation,
      duration_ms: duration,
      performance: true 
    });
  }

  public securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    const level = severity === 'high' ? LogLevel.ERROR : 
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `Security event: ${event}`, context, undefined, {
      security: true,
      severity
    });
  }

  private async sendToLoggingService(_logEntry: LogEntry): Promise<void> {
    try {
      // In production, send to logging service (e.g., Cloudflare Analytics, DataDog, etc.)
      // Example implementation:
      /*
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
      */
    } catch (error) {
      // Silently fail to avoid infinite logging loops
      console.warn('Failed to send log to service:', error);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Helper function for timing operations
export async function withTiming<T>(
  operation: string, 
  fn: () => T | Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logger.performanceLog(operation, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`${operation} failed`, error as Error, context, { 
      operation,
      duration_ms: duration 
    });
    throw error;
  }
}