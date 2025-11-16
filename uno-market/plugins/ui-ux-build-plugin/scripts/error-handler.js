#!/usr/bin/env node

/**
 * Comprehensive Error Handler and User Feedback System
 * Provides consistent error handling, user-friendly messages, and recovery suggestions
 * Part of Phase 8: Polish & Cross-Cutting Concerns
 */

const fs = require('fs');
const path = require('path');

// Error categories and severity levels
const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  EXECUTION: 'execution',
  NETWORK: 'network',
  FILESYSTEM: 'filesystem',
  CONFIGURATION: 'configuration',
  AGENT_TIMEOUT: 'agent_timeout',
  MEMORY: 'memory',
  PERMISSION: 'permission',
  DEPENDENCY: 'dependency',
  USER_INPUT: 'user_input'
};

const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error codes for consistent identification
const ERROR_CODES = {
  // Validation errors (1000-1099)
  VALIDATION_FAILED: 'E1001',
  INVALID_COMPONENT_NAME: 'E1002',
  INVALID_CONFIGURATION: 'E1003',
  MISSING_REQUIRED_FIELD: 'E1004',

  // Execution errors (1100-1199)
  AGENT_EXECUTION_FAILED: 'E1101',
  PARALLEL_EXECUTION_ERROR: 'E1102',
  TASK_COORDINATION_FAILED: 'E1103',
  RESOURCE_EXHAUSTED: 'E1104',

  // Network errors (1200-1299)
  API_CONNECTION_FAILED: 'E1201',
  REQUEST_TIMEOUT: 'E1202',
  RATE_LIMIT_EXCEEDED: 'E1203',

  // Filesystem errors (1300-1399)
  FILE_NOT_FOUND: 'E1301',
  PERMISSION_DENIED: 'E1302',
  DISK_FULL: 'E1303',
  FILE_CORRUPTED: 'E1304',

  // Configuration errors (1400-1499)
  CONFIG_FILE_MISSING: 'E1401',
  CONFIG_INVALID_FORMAT: 'E1402',
  CONFIG_VERSION_MISMATCH: 'E1403',

  // Agent timeout errors (1500-1599)
  UI_ARCHITECT_TIMEOUT: 'E1501',
  TAILWIND_STYLIST_TIMEOUT: 'E1502',
  BIOME_LINTER_TIMEOUT: 'E1503',
  VITEST_TESTER_TIMEOUT: 'E1504',
  MONOREPO_ORCHESTRATOR_TIMEOUT: 'E1505',

  // Memory errors (1600-1699)
  MEMORY_LIMIT_EXCEEDED: 'E1601',
  MEMORY_LEAK_DETECTED: 'E1602',

  // Permission errors (1700-1799)
  INSUFFICIENT_PERMISSIONS: 'E1701',
  ACCESS_DENIED: 'E1702',

  // Dependency errors (1800-1899)
  DEPENDENCY_MISSING: 'E1801',
  DEPENDENCY_VERSION_CONFLICT: 'E1802',
  TOOL_NOT_AVAILABLE: 'E1803',

  // User input errors (1900-1999)
  INVALID_ARGUMENT: 'E1901',
  MISSING_ARGUMENT: 'E1902',
  ARGUMENT_OUT_OF_RANGE: 'E1903'
};

class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableLogging: true,
      logLevel: 'info',
      enableRecoverySuggestions: true,
      enableUserFriendlyMessages: true,
      outputFormat: 'text', // 'text', 'json', 'markdown'
      ...options
    };

    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: []
    };

    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
  }

  // Main error handling method
  handleError(error, context = {}) {
    const processedError = this.processError(error, context);

    // Log the error
    if (this.options.enableLogging) {
      this.logError(processedError);
    }

    // Update statistics
    this.updateErrorStats(processedError);

    // Provide user feedback
    const userFeedback = this.generateUserFeedback(processedError);

    // Provide recovery suggestions
    const recoverySuggestions = this.generateRecoverySuggestions(processedError);

    // Return comprehensive error response
    return {
      error: processedError,
      userFeedback: userFeedback,
      recoverySuggestions: recoverySuggestions,
      timestamp: new Date().toISOString(),
      context: context
    };
  }

  // Process and standardize error
  processError(error, context) {
    let processedError = {
      code: 'UNKNOWN',
      message: error.message || 'Unknown error occurred',
      category: ERROR_CATEGORIES.EXECUTION,
      severity: SEVERITY_LEVEL.MEDIUM,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context
    };

    // Categorize and enhance error based on type and message
    if (error instanceof ValidationError) {
      processedError = { ...processedError, ...this.processValidationError(error) };
    } else if (error instanceof ExecutionError) {
      processedError = { ...processedError, ...this.processExecutionError(error) };
    } else if (error instanceof NetworkError) {
      processedError = { ...processedError, ...this.processNetworkError(error) };
    } else if (error instanceof FilesystemError) {
      processedError = { ...processedError, ...this.processFilesystemError(error) };
    } else {
      // Generic error processing
      processedError = this.analyzeGenericError(error, processedError);
    }

    return processedError;
  }

  // Process validation errors
  processValidationError(error) {
    return {
      code: error.code || ERROR_CODES.VALIDATION_FAILED,
      category: ERROR_CATEGORIES.VALIDATION,
      severity: SEVERITY_LEVEL.MEDIUM,
      field: error.field,
      validationRule: error.rule,
      providedValue: error.value
    };
  }

  // Process execution errors
  processExecutionError(error) {
    return {
      code: error.code || ERROR_CODES.AGENT_EXECUTION_FAILED,
      category: ERROR_CATEGORIES.EXECUTION,
      severity: this.determineExecutionSeverity(error),
      agent: error.agent,
      task: error.task,
      executionTime: error.executionTime
    };
  }

  // Process network errors
  processNetworkError(error) {
    return {
      code: error.code || ERROR_CODES.API_CONNECTION_FAILED,
      category: ERROR_CATEGORIES.NETWORK,
      severity: SEVERITY_LEVEL.HIGH,
      url: error.url,
      statusCode: error.statusCode,
      retryCount: error.retryCount
    };
  }

  // Process filesystem errors
  processFilesystemError(error) {
    return {
      code: error.code || ERROR_CODES.FILE_NOT_FOUND,
      category: ERROR_CATEGORIES.FILESYSTEM,
      severity: this.determineFilesystemSeverity(error),
      filePath: error.filePath,
      operation: error.operation,
      permissions: error.permissions
    };
  }

  // Analyze generic errors
  analyzeGenericError(error, processedError) {
    const message = error.message || '';
    const stack = error.stack || '';

    // Analyze error message and stack for patterns
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      processedError.code = ERROR_CODES.REQUEST_TIMEOUT;
      processedError.category = ERROR_CATEGORIES.AGENT_TIMEOUT;
      processedError.severity = SEVERITY_LEVEL.HIGH;
    } else if (message.includes('permission') || message.includes('EACCES') || message.includes('EPERM')) {
      processedError.code = ERROR_CODES.PERMISSION_DENIED;
      processedError.category = ERROR_CATEGORIES.PERMISSION;
      processedError.severity = SEVERITY_LEVEL.HIGH;
    } else if (message.includes('ENOENT') || message.includes('file not found')) {
      processedError.code = ERROR_CODES.FILE_NOT_FOUND;
      processedError.category = ERROR_CATEGORIES.FILESYSTEM;
      processedError.severity = SEVERITY_LEVEL.MEDIUM;
    } else if (message.includes('memory') || message.includes('heap')) {
      processedError.code = ERROR_CODES.MEMORY_LIMIT_EXCEEDED;
      processedError.category = ERROR_CATEGORIES.MEMORY;
      processedError.severity = SEVERITY_LEVEL.HIGH;
    } else if (message.includes('Module not found') || message.includes('Cannot find module')) {
      processedError.code = ERROR_CODES.DEPENDENCY_MISSING;
      processedError.category = ERROR_CATEGORIES.DEPENDENCY;
      processedError.severity = SEVERITY_LEVEL.MEDIUM;
    }

    return processedError;
  }

  // Determine execution error severity
  determineExecutionSeverity(error) {
    if (error.agent === 'monorepo-orchestrator') {
      return SEVERITY_LEVEL.CRITICAL;
    } else if (error.agent === 'ui-architect') {
      return SEVERITY_LEVEL.HIGH;
    } else {
      return SEVERITY_LEVEL.MEDIUM;
    }
  }

  // Determine filesystem error severity
  determineFilesystemSeverity(error) {
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return SEVERITY_LEVEL.HIGH;
    } else if (error.code === 'ENOSPC') {
      return SEVERITY_LEVEL.CRITICAL;
    } else {
      return SEVERITY_LEVEL.MEDIUM;
    }
  }

  // Log error with appropriate level
  logError(error) {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = this.formatLogMessage(error);

    switch (logLevel) {
      case 'error':
        console.error(`❌ ${logMessage}`);
        break;
      case 'warn':
        console.warn(`⚠️ ${logMessage}`);
        break;
      case 'info':
        console.info(`ℹ️ ${logMessage}`);
        break;
      default:
        console.log(`📝 ${logMessage}`);
    }

    // Log stack trace for debugging
    if (error.stack && this.options.logLevel === 'debug') {
      console.debug('Stack trace:', error.stack);
    }
  }

  // Get appropriate log level for severity
  getLogLevel(severity) {
    switch (severity) {
      case SEVERITY_LEVEL.CRITICAL:
        return 'error';
      case SEVERITY_LEVEL.HIGH:
        return 'error';
      case SEVERITY_LEVEL.MEDIUM:
        return 'warn';
      case SEVERITY_LEVEL.LOW:
        return 'info';
      default:
        return 'info';
    }
  }

  // Format log message
  formatLogMessage(error) {
    return `[${error.code}] ${error.category.toUpperCase()}: ${error.message}`;
  }

  // Update error statistics
  updateErrorStats(error) {
    this.errorStats.totalErrors++;

    // Update category statistics
    if (!this.errorStats.errorsByCategory[error.category]) {
      this.errorStats.errorsByCategory[error.category] = 0;
    }
    this.errorStats.errorsByCategory[error.category]++;

    // Update severity statistics
    if (!this.errorStats.errorsBySeverity[error.severity]) {
      this.errorStats.errorsBySeverity[error.severity] = 0;
    }
    this.errorStats.errorsBySeverity[error.severity]++;

    // Update recent errors (keep last 10)
    this.errorStats.recentErrors.unshift({
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      category: error.category,
      severity: error.severity
    });

    if (this.errorStats.recentErrors.length > 10) {
      this.errorStats.recentErrors.pop();
    }
  }

  // Generate user-friendly feedback
  generateUserFeedback(error) {
    if (!this.options.enableUserFriendlyMessages) {
      return error.message;
    }

    const feedbackTemplates = {
      [ERROR_CATEGORIES.VALIDATION]: {
        title: 'Validation Error',
        icon: '⚠️',
        message: 'There was an issue with the input provided.',
        suggestions: [
          'Please check your input and try again.',
          'Make sure all required fields are provided.',
          'Verify the format of your input data.'
        ]
      },
      [ERROR_CATEGORIES.EXECUTION]: {
        title: 'Execution Error',
        icon: '❌',
        message: 'An error occurred while executing the task.',
        suggestions: [
          'The system encountered an issue during processing.',
          'Please try again in a moment.',
          'If the problem persists, check your configuration.'
        ]
      },
      [ERROR_CATEGORIES.AGENT_TIMEOUT]: {
        title: 'Timeout Error',
        icon: '⏱️',
        message: 'The operation took too long to complete.',
        suggestions: [
          'Try reducing the complexity of your request.',
          'Check if your system has sufficient resources.',
          'Consider increasing timeout settings.'
        ]
      },
      [ERROR_CATEGORIES.FILESYSTEM]: {
        title: 'File System Error',
        icon: '📁',
        message: 'There was an issue accessing files.',
        suggestions: [
          'Check if you have the necessary permissions.',
          'Verify that the file paths are correct.',
          'Ensure there is enough disk space.'
        ]
      },
      [ERROR_CATEGORIES.NETWORK]: {
        title: 'Network Error',
        icon: '🌐',
        message: 'There was a network connectivity issue.',
        suggestions: [
          'Check your internet connection.',
          'Verify that external services are accessible.',
          'Try again in a few moments.'
        ]
      },
      [ERROR_CATEGORIES.DEPENDENCY]: {
        title: 'Dependency Error',
        icon: '📦',
        message: 'A required dependency is missing or incompatible.',
        suggestions: [
          'Run npm install to install missing dependencies.',
          'Check if all required tools are installed.',
          'Verify dependency versions are compatible.'
        ]
      }
    };

    const template = feedbackTemplates[error.category] || feedbackTemplates[ERROR_CATEGORIES.EXECUTION];

    let feedback = `${template.icon} ${template.title}: ${template.message}\n\n`;

    feedback += 'Suggestions:\n';
    template.suggestions.forEach((suggestion, index) => {
      feedback += `  ${index + 1}. ${suggestion}\n`;
    });

    return feedback;
  }

  // Generate recovery suggestions
  generateRecoverySuggestions(error) {
    if (!this.options.enableRecoverySuggestions) {
      return [];
    }

    const strategy = this.recoveryStrategies.get(error.code);
    if (!strategy) {
      return this.generateGenericRecoverySuggestions(error);
    }

    return strategy.suggestions.map(suggestion => ({
      action: suggestion.action,
      description: suggestion.description,
      automation: suggestion.automation || false,
      priority: suggestion.priority || 'medium'
    }));
  }

  // Generate generic recovery suggestions
  generateGenericRecoverySuggestions(error) {
    const suggestions = [
      {
        action: 'retry',
        description: 'Try the operation again',
        automation: true,
        priority: 'high'
      },
      {
        action: 'check_configuration',
        description: 'Verify your configuration files',
        automation: false,
        priority: 'medium'
      },
      {
        action: 'consult_documentation',
        description: 'Check the plugin documentation for guidance',
        automation: false,
        priority: 'low'
      }
    ];

    return suggestions;
  }

  // Initialize recovery strategies for common errors
  initializeRecoveryStrategies() {
    this.recoveryStrategies.set(ERROR_CODES.INVALID_COMPONENT_NAME, {
      suggestions: [
        {
          action: 'use_valid_name',
          description: 'Use a valid component name (PascalCase, no special characters)',
          automation: false,
          priority: 'high'
        },
        {
          action: 'check_naming_conventions',
          description: 'Follow React component naming conventions',
          automation: false,
          priority: 'medium'
        }
      ]
    });

    this.recoveryStrategies.set(ERROR_CODES.AGENT_TIMEOUT, {
      suggestions: [
        {
          action: 'increase_timeout',
          description: 'Increase agent timeout in configuration',
          automation: true,
          priority: 'high'
        },
        {
          action: 'reduce_complexity',
          description: 'Simplify the component requirements',
          automation: false,
          priority: 'medium'
        },
        {
          action: 'check_system_resources',
          description: 'Verify system has sufficient memory and CPU',
          automation: true,
          priority: 'medium'
        }
      ]
    });

    this.recoveryStrategies.set(ERROR_CODES.DEPENDENCY_MISSING, {
      suggestions: [
        {
          action: 'install_dependencies',
          description: 'Run npm install to install missing dependencies',
          automation: true,
          priority: 'high'
        },
        {
          action: 'check_node_version',
          description: 'Verify Node.js version is compatible',
          automation: true,
          priority: 'medium'
        }
      ]
    });

    this.recoveryStrategies.set(ERROR_CODES.FILE_NOT_FOUND, {
      suggestions: [
        {
          action: 'verify_file_path',
          description: 'Check that the file path is correct',
          automation: false,
          priority: 'high'
        },
        {
          action: 'create_missing_file',
          description: 'Create the missing file if needed',
          automation: true,
          priority: 'medium'
        }
      ]
    });
  }

  // Get error statistics
  getErrorStats() {
    return {
      ...this.errorStats,
      timestamp: new Date().toISOString()
    };
  }

  // Reset error statistics
  resetErrorStats() {
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: []
    };
  }

  // Export error report
  exportErrorReport(filePath) {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.getErrorStats(),
      recoveryStrategies: Array.from(this.recoveryStrategies.entries()).map(([code, strategy]) => ({
        errorCode: code,
        suggestions: strategy.suggestions
      }))
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export error report:', error.message);
      return false;
    }
  }

  // Custom error classes
  static ValidationError = class extends Error {
    constructor(message, code, field, rule, value) {
      super(message);
      this.name = 'ValidationError';
      this.code = code;
      this.field = field;
      this.rule = rule;
      this.value = value;
    }
  };

  static ExecutionError = class extends Error {
    constructor(message, code, agent, task, executionTime) {
      super(message);
      this.name = 'ExecutionError';
      this.code = code;
      this.agent = agent;
      this.task = task;
      this.executionTime = executionTime;
    }
  };

  static NetworkError = class extends Error {
    constructor(message, code, url, statusCode, retryCount) {
      super(message);
      this.name = 'NetworkError';
      this.code = code;
      this.url = url;
      this.statusCode = statusCode;
      this.retryCount = retryCount;
    }
  };

  static FilesystemError = class extends Error {
    constructor(message, code, filePath, operation, permissions) {
      super(message);
      this.name = 'FilesystemError';
      this.code = code;
      this.filePath = filePath;
      this.operation = operation;
      this.permissions = permissions;
    }
  };
}

// Create global error handler instance
const globalErrorHandler = new ErrorHandler();

// Export error handler and utilities
module.exports = ErrorHandler;
module.exports.globalErrorHandler = globalErrorHandler;
module.exports.ERROR_CODES = ERROR_CODES;
module.exports.ERROR_CATEGORIES = ERROR_CATEGORIES;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--stats':
        showStats = true;
        break;
      case '--export':
        options.exportFile = args[++i];
        break;
      case '--reset':
        options.resetStats = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Error Handler and User Feedback System

USAGE:
  node error-handler.js [OPTIONS]

OPTIONS:
  --stats           Show error statistics
  --export FILE     Export error report to file
  --reset          Reset error statistics
  --help, -h        Show this help message

EXAMPLES:
  node error-handler.js --stats
  node error-handler.js --export error-report.json
  node error-handler.js --reset
        `);
        process.exit(0);
        break;
    }
  }

  // Handle options
  if (options.resetStats) {
    globalErrorHandler.resetErrorStats();
    console.log('✅ Error statistics reset');
  }

  if (options.exportFile) {
    const success = globalErrorHandler.exportErrorReport(options.exportFile);
    if (success) {
      console.log(`✅ Error report exported to ${options.exportFile}`);
    } else {
      console.error('❌ Failed to export error report');
      process.exit(1);
    }
  }

  if (args.includes('--stats') || (!options.exportFile && !options.resetStats)) {
    const stats = globalErrorHandler.getErrorStats();
    console.log('📊 Error Statistics:');
    console.log(`Total Errors: ${stats.totalErrors}`);
    console.log('Errors by Category:');
    Object.entries(stats.errorsByCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    console.log('Errors by Severity:');
    Object.entries(stats.errorsBySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  main();
}