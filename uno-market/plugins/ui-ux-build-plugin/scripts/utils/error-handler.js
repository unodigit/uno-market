#!/usr/bin/env node

/**
 * Error handling utilities for plugin scripts
 */

export class PluginError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends PluginError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends PluginError {
  constructor(message, command, exitCode) {
    super(message, 'EXECUTION_ERROR', { command, exitCode });
    this.name = 'ExecutionError';
  }
}

/**
 * Handle errors with proper logging and exit codes
 */
export function handleError(error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    }
  };

  // Log error information
  console.error(`[${timestamp}] ERROR: ${error.message}`);
  if (error.details) {
    console.error('Details:', JSON.stringify(error.details, null, 2));
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
  }

  // Exit with appropriate code
  process.exit(error.code === 'VALIDATION_ERROR' ? 1 : 2);
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
    }
  };
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required environment variables: ${missing.join(', ')}`,
      'environment',
      missing
    );
  }
}

/**
 * Get plugin root directory from environment
 */
export function getPluginRoot() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();

  if (!pluginRoot) {
    throw new ValidationError(
      'CLAUDE_PLUGIN_ROOT environment variable is required',
      'CLAUDE_PLUGIN_ROOT',
      pluginRoot
    );
  }

  return pluginRoot;
}