import { createLogger, format, transports } from 'winston';
import { existsSync, mkdirSync } from 'fs';

const customFormat = format.printf(({ timestamp, level, stack, message }) => {
    return `${timestamp} - [${level.toUpperCase().padEnd(7)}] - ${message}`;
});

if (!existsSync('logs')) {
    mkdirSync('logs');
}

const devLogger = {
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        customFormat,
    ),
    transports: [new transports.Console()],
};

// For production environment
const prodLogger = {
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
    ),
    transports: [
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new transports.File({
            filename: 'logs/combine.log',
            level: 'info',
        }),
    ],
};

const instanceLogger = process.env.MODE === 'DEV' ? devLogger : prodLogger;
const loggerInstance = createLogger(instanceLogger);
export const instance = loggerInstance;
