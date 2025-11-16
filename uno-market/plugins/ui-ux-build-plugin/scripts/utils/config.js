#!/usr/bin/env node

import { getPluginRoot, validateEnvironment } from './error-handler.js';

/**
 * Plugin configuration management
 */

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG = {
  quality: {
    lintOnSave: true,
    formatOnSave: true,
    typeCheckOnSave: true,
    maxFileSize: 1024 * 1024, // 1MB
  },
  agents: {
    timeoutMs: 30000,
    retryAttempts: 2,
    retryDelayMs: 1000,
    parallelLimit: 5
  },
  performance: {
    enableCaching: true,
    cacheDuration: 300, // 5 minutes
    maxCacheSize: 100
  },
  logging: {
    level: 'info',
    includeTimestamps: true,
    includeStackTraces: false
  }
};

/**
 * Load configuration from multiple sources
 */
export function loadConfig() {
  const pluginRoot = getPluginRoot();

  // Load from environment variables
  const envConfig = {
    quality: {
      lintOnSave: parseEnvBool('PLUGIN_LINT_ON_SAVE', true),
      formatOnSave: parseEnvBool('PLUGIN_FORMAT_ON_SAVE', true),
      typeCheckOnSave: parseEnvBool('PLUGIN_TYPE_CHECK_ON_SAVE', true),
    },
    agents: {
      timeoutMs: parseInt(process.env.PLUGIN_AGENT_TIMEOUT) || 30000,
      retryAttempts: parseInt(process.env.PLUGIN_AGENT_RETRIES) || 2,
    },
    logging: {
      level: process.env.PLUGIN_LOG_LEVEL || 'info',
      includeStackTraces: parseEnvBool('PLUGIN_LOG_STACK', false),
    }
  };

  // Merge configurations (env overrides defaults)
  return mergeConfigs(DEFAULT_CONFIG, envConfig);
}

/**
 * Get configuration value with fallback
 */
export function getConfigValue(path, defaultValue = null) {
  const config = loadConfig();
  return getNestedValue(config, path, defaultValue);
}

/**
 * Validate configuration
 */
export function validateConfig(config = null) {
  const configToValidate = config || loadConfig();

  const errors = [];

  // Validate quality settings
  if (configToValidate.quality.timeoutMs < 1000) {
    errors.push('Quality timeout must be at least 1000ms');
  }

  // Validate agent settings
  if (configToValidate.agents.timeoutMs < 1000 || configToValidate.agents.timeoutMs > 300000) {
    errors.push('Agent timeout must be between 1000ms and 300000ms');
  }

  if (configToValidate.agents.retryAttempts < 0 || configToValidate.agents.retryAttempts > 5) {
    errors.push('Agent retry attempts must be between 0 and 5');
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Configuration validation failed: ${errors.join(', ')}`,
      'config',
      errors
    );
  }

  return true;
}

// Helper functions
function parseEnvBool(key, defaultValue) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function mergeConfigs(target, source) {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = { ...result[key], ...value };
    } else {
      result[key] = value;
    }
  }

  return result;
}

function getNestedValue(obj, path, defaultValue) {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : defaultValue;
  }, obj);
}

// Export default config for immediate use
export default DEFAULT_CONFIG;