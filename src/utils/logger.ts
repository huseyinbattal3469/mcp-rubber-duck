import winston from 'winston';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import { maskSensitiveData, maskSensitiveText } from './sensitive.js';

const rawLogLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
// Treat a special 'all' value as verbose (maps to debug) and also enable the DUCK_LOG_ALL behavior
const logAll = process.env.DUCK_LOG_ALL === 'true' || rawLogLevel === 'all';
const logLevel = rawLogLevel === 'all' ? 'debug' : rawLogLevel;
const isMCP = process.env.MCP_SERVER === 'true' || process.argv.includes('--mcp');

// Environment/runtime detection
const interactiveTTY = !!(process.stdout && process.stdout.isTTY);
const inVSCodeOutput = !!(process.env.VSCODE_PID && !interactiveTTY);
const forcedPlain = process.env.DUCK_LOG_PLAIN === 'true' || !!process.env.CI;
const forcedEmoji = process.env.DUCK_FORCE_EMOJI === 'true';

function emojiOrFallback(emoji: string, fallback = '(duck)') {
  if (forcedEmoji) return emoji;
  if (forcedPlain || inVSCodeOutput || !interactiveTTY) return fallback;
  return emoji;
}

function formatLevel(level: string) {
  if (forcedPlain || inVSCodeOutput || !interactiveTTY) return level;
  return chalk.green(level);
}

// Base winston logger (structured JSON for files and non-interactive consumers)
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    // For structured logs we keep JSON format
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      // If running as MCP, be conservative and silence non-debug unless explicitly in debug/all mode
      silent: isMCP && logLevel !== 'debug',
      // When running as an MCP server, write logs to stderr to avoid polluting stdout (JSON-RPC)
      stderrLevels: isMCP ? ['error', 'warn', 'info', 'debug'] : ['error'],
    }),
  ],
});

// Human-friendly console wrapper that respects environment
function writeConsole(level: string, message: string, meta?: any) {
  const label = formatLevel(level);
  const emoji = emojiOrFallback('🦆');
  
  // Mask sensitive data in meta if present
  const safeMeta = meta ? maskSensitiveData(meta) : undefined;
  const metaStr = safeMeta ? ` ${JSON.stringify(safeMeta)}` : '';

  if (inVSCodeOutput || forcedPlain || !interactiveTTY || isMCP) {
    // Emit plain JSON line so VS Code and other consumers can parse safely
    const safeMessage = maskSensitiveText(stripAnsi(`${label}: ${emoji} ${message}${metaStr}`));
    const out = `${JSON.stringify({ level, message: safeMessage, timestamp: new Date(), meta: safeMeta })}\n`;
    if (isMCP) process.stderr.write(out); else process.stdout.write(out);
    return;
  }

  // Pretty terminal output
  const pretty = `${label}: ${emoji} ${message}${metaStr}`;
  // For interactive terminals we still prefer stdout, unless running as MCP server where
  // stdout is reserved for JSON-RPC; write pretty output to stderr in that case.
  if (isMCP) process.stderr.write(`${pretty}\n`); else process.stdout.write(`${pretty}\n`);
}

// Convenience logging functions that use both winston (structured) and console (human)
export function info(msg: string, meta?: any) {
  // Mask sensitive data before logging
  const safeMeta = meta ? maskSensitiveData(meta) : undefined;
  logger.info(maskSensitiveText(msg), safeMeta);
  writeConsole('info', msg, meta);
}

export function warn(msg: string, meta?: any) {
  const safeMeta = meta ? maskSensitiveData(meta) : undefined;
  logger.warn(maskSensitiveText(msg), safeMeta);
  writeConsole('warn', msg, meta);
}

export function error(msg: string, meta?: any) {
  const safeMeta = meta ? maskSensitiveData(meta) : undefined;
  logger.error(maskSensitiveText(msg), safeMeta);
  writeConsole('error', msg, meta);
}

// 'all' mode: log request/response details; these are no-ops unless DUCK_LOG_ALL=true or LOG_LEVEL=all
export function all(msg: string, meta?: any) {
  if (!logAll) return;
  // Keep structured log but also write to console in friendly format
  // Apply extra masking for verbose logs since they contain more sensitive data
  const safeMeta = meta ? maskSensitiveData(meta) : undefined;
  logger.debug(maskSensitiveText(msg), safeMeta);
  writeConsole('debug', msg, meta);
}

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'combined.log',
    })
  );
}