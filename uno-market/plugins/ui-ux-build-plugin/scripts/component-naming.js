#!/usr/bin/env node

/**
 * Component naming validation and transformation utilities
 */

import { ValidationError } from './utils/error-handler.js';

/**
 * Validate component name according to React conventions
 */
export function validateComponentName(name) {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Component name is required', 'componentName', name);
  }

  // Check for empty string
  if (name.trim().length === 0) {
    throw new ValidationError('Component name cannot be empty', 'componentName', name);
  }

  // Check length
  if (name.length > 100) {
    throw new ValidationError('Component name must be 100 characters or less', 'componentName', name);
  }

  // Check for invalid characters (allow only letters, numbers, and spaces for processing)
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    throw new ValidationError(
      'Component name can only contain letters, numbers, spaces, hyphens, and underscores',
      'componentName',
      name
    );
  }

  // Check for reserved words
  const reservedWords = [
    'React', 'Component', 'Element', 'Fragment', 'Portal',
    'Profiler', 'StrictMode', 'Suspense', 'ErrorBoundary',
    'html', 'div', 'span', 'button', 'input', 'form',
    'class', 'function', 'var', 'let', 'const', 'import',
    'export', 'default', 'return', 'if', 'else', 'for',
    'while', 'do', 'switch', 'case', 'break', 'continue'
  ];

  const normalized = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (reservedWords.includes(normalized)) {
    throw new ValidationError(
      `Component name cannot be a reserved word: ${normalized}`,
      'componentName',
      name
    );
  }

  return true;
}

/**
 * Transform various name formats to PascalCase
 */
export function toPascalCase(name) {
  validateComponentName(name);

  return name
    // Split on separators and spaces
    .split(/[\s\-_]+/)
    // Filter out empty strings
    .filter(Boolean)
    // Capitalize each word and join
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Transform to kebab-case for file/directory names
 */
export function toKebabCase(name) {
  validateComponentName(name);

  return toPascalCase(name)
    // Insert hyphen before uppercase letters (except first)
    .replace(/([A-Z])/g, '-$1')
    // Convert to lowercase
    .toLowerCase()
    // Remove leading hyphen
    .replace(/^-/, '');
}

/**
 * Transform to camelCase for variable names
 */
export function toCamelCase(name) {
  const pascalCase = toPascalCase(name);
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

/**
 * Generate appropriate file names based on naming conventions
 */
export function generateFileNames(componentName) {
  const pascalCase = toPascalCase(componentName);
  const kebabCase = toKebabCase(componentName);
  const camelCase = toCamelCase(componentName);

  return {
    componentFile: `${pascalCase}.tsx`,
    testFile: `${pascalCase}.test.tsx`,
    storyFile: `${pascalCase}.stories.tsx`,
    indexFile: 'index.ts',
    typesFile: `${pascalCase}.types.ts`,
    directory: kebabCase,
    pascalCase,
    kebabCase,
    camelCase,
    displayName: pascalCase,
    testDescribe: pascalCase,
    importPath: `./${kebabCase}/${pascalCase}`
  };
}

/**
 * Validate directory path and ensure it exists or can be created
 */
export function validateDirectoryPath(path) {
  if (!path || typeof path !== 'string') {
    throw new ValidationError('Directory path is required', 'directoryPath', path);
  }

  // Check for invalid characters
  if (!/^[a-zA-Z0-9\/\-_]+$/.test(path)) {
    throw new ValidationError(
      'Directory path can only contain letters, numbers, slashes, hyphens, and underscores',
      'directoryPath',
      path
    );
  }

  // Check for path traversal attempts
  if (path.includes('..') || path.startsWith('/')) {
    throw new ValidationError(
      'Directory path cannot traverse parent directories or start with root',
      'directoryPath',
      path
    );
  }

  return path;
}

/**
 * Normalize and validate the output directory
 */
export function normalizeOutputDirectory(directory) {
  if (!directory) {
    return 'src/components'; // Default directory
  }

  validateDirectoryPath(directory);

  // Remove trailing slash
  return directory.replace(/\/$/, '');
}

/**
 * Check if a filename conflicts with existing files
 */
export function checkFileConflict(outputDir, fileName) {
  const fs = require('fs');
  const path = require('path');

  const fullPath = path.join(outputDir, fileName);

  try {
    return fs.existsSync(fullPath);
  } catch (error) {
    // If we can't check, assume no conflict
    return false;
  }
}

/**
 * Generate unique filename if conflict exists
 */
export function generateUniqueFileName(outputDir, baseFileName, extension = 'tsx') {
  let fileName = baseFileName;
  let counter = 1;

  while (checkFileConflict(outputDir, `${fileName}.${extension}`)) {
    fileName = `${baseFileName}${counter}`;
    counter++;
  }

  return `${fileName}.${extension}`;
}

/**
 * Validate and suggest improvements for component names
 */
export function suggestNameImprovements(name) {
  const suggestions = [];

  try {
    validateComponentName(name);
  } catch (error) {
    if (error.message.includes('reserved word')) {
      const normalized = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      suggestions.push(`${normalized}Component`);
      suggestions.push(`My${normalized}`);
      suggestions.push(`${normalized}Widget`);
    }

    if (error.message.includes('invalid characters')) {
      const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
      if (cleaned) {
        suggestions.push(cleaned.replace(/\s+/g, ' '));
        suggestions.push(cleaned.replace(/\s+/g, '-'));
        suggestions.push(cleaned.replace(/\s+/g, ''));
      }
    }
  }

  // Always provide PascalCase suggestion
  suggestions.push(toPascalCase(name));

  // Remove duplicates
  return [...new Set(suggestions)];
}

/**
 * Format component name according to team conventions
 */
export function formatComponentName(name, style = 'PascalCase') {
  switch (style) {
    case 'PascalCase':
      return toPascalCase(name);
    case 'camelCase':
      return toCamelCase(name);
    case 'kebab-case':
      return toKebabCase(name);
    case 'snake_case':
      return toKebabCase(name).replace(/-/g, '_');
    default:
      return toPascalCase(name);
  }
}

/**
 * Export all naming utilities
 */
export default {
  validateComponentName,
  toPascalCase,
  toKebabCase,
  toCamelCase,
  generateFileNames,
  validateDirectoryPath,
  normalizeOutputDirectory,
  checkFileConflict,
  generateUniqueFileName,
  suggestNameImprovements,
  formatComponentName
};