import { config } from "../config/config";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = logLevelMap[config.logging.level] || LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (meta) {
      return `${baseMessage} ${JSON.stringify(meta, null, 2)}`;
    }

    return baseMessage;
  }

  error(message: string, meta?: any): void {
    if (this.currentLevel >= LogLevel.ERROR) {
      console.error(this.formatMessage("error", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.currentLevel >= LogLevel.WARN) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.currentLevel >= LogLevel.INFO) {
      console.info(this.formatMessage("info", message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
