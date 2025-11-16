#!/usr/bin/env node

/**
 * Design Token Validator
 * Validates design tokens for consistency, format, and conflicts
 * Part of Phase 7: Tailwind Configuration Management
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuration
const DEFAULT_TOKENS_FILE = path.join(__dirname, '../config/design-tokens.json');
const DEFAULT_STRICT_MODE = false;
const DEFAULT_OUTPUT_FORMAT = 'text'; // 'text', 'json', 'summary'

class DesignTokenValidator {
  constructor(options = {}) {
    this.tokensFile = options.file || DEFAULT_TOKENS_FILE;
    this.strictMode = options.strict || DEFAULT_STRICT_MODE;
    this.outputFormat = options.format || DEFAULT_OUTPUT_FORMAT;
    this.verbose = options.verbose || false;
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  // Main validation method
  validate() {
    try {
      this.log('Starting design token validation...', 'info');

      // Load design tokens
      const tokens = this.loadTokens();

      // Run all validations
      this.validateStructure(tokens);
      this.validateColors(tokens);
      this.validateTypography(tokens);
      this.validateSpacing(tokens);
      this.validateBreakpoints(tokens);
      this.validateComponents(tokens);
      this.validateAccessibility(tokens);
      this.validateNaming(tokens);
      this.validateConsistency(tokens);
      this.validateConflicts(tokens);

      // Generate results
      const results = this.generateResults();

      // Output results
      this.outputResults(results);

      return results;

    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      return {
        success: false,
        errors: [error.message],
        warnings: [],
        info: []
      };
    }
  }

  // Load and parse design tokens file
  loadTokens() {
    if (!fs.existsSync(this.tokensFile)) {
      throw new Error(`Design tokens file not found: ${this.tokensFile}`);
    }

    try {
      const content = fs.readFileSync(this.tokensFile, 'utf8');
      const tokens = JSON.parse(content);
      this.log('Design tokens loaded successfully', 'success');
      return tokens;
    } catch (error) {
      throw new Error(`Failed to parse design tokens: ${error.message}`);
    }
  }

  // Validate overall structure
  validateStructure(tokens) {
    this.log('Validating structure...', 'info');

    // Check root structure
    if (!tokens.tokens) {
      this.addError('Missing required "tokens" property at root level');
      return;
    }

    const requiredSections = ['colors', 'typography', 'spacing', 'breakpoints'];
    requiredSections.forEach(section => {
      if (!tokens.tokens[section]) {
        this.addError(`Missing required section: ${section}`);
      }
    });

    // Check metadata
    if (!tokens.version) {
      this.addWarning('Missing version information');
    }

    if (!tokens.metadata || !tokens.metadata.name) {
      this.addWarning('Missing metadata information');
    }

    this.log('Structure validation completed', 'success');
  }

  // Validate color tokens
  validateColors(tokens) {
    if (!tokens.tokens.colors) return;

    this.log('Validating colors...', 'info');

    const colors = tokens.tokens.colors;

    // Check required color palettes
    const requiredPalettes = ['primary', 'secondary', 'neutral'];
    requiredPalettes.forEach(palette => {
      if (!colors[palette]) {
        this.addError(`Missing required color palette: ${palette}`);
      }
    });

    // Validate each color palette
    Object.keys(colors).forEach(paletteName => {
      const palette = colors[paletteName];
      this.validateColorPalette(paletteName, palette);
    });

    this.log('Color validation completed', 'success');
  }

  // Validate individual color palette
  validateColorPalette(name, palette) {
    if (typeof palette === 'string') {
      // Single color value
      if (!this.isValidColor(palette)) {
        this.addError(`Invalid color format in ${name}: ${palette}`);
      }
    } else if (typeof palette === 'object') {
      // Color scale (e.g., primary: { 50: '#...', 500: '#...', 950: '#...' })
      this.validateColorScale(name, palette);
    } else {
      this.addError(`Invalid color structure in ${name}: must be string or object`);
    }
  }

  // Validate color scale (e.g., 50, 100, 200...950)
  validateColorScale(name, scale) {
    // Check for standard scale values
    const standardScales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    const missingScales = standardScales.filter(scaleValue => !scale[scaleValue]);

    if (missingScales.length > 0) {
      this.addWarning(`Color palette ${name} is missing standard scales: ${missingScales.join(', ')}`);
    }

    // Validate each color in scale
    Object.keys(scale).forEach(scaleValue => {
      const colorValue = scale[scaleValue];
      if (!this.isValidColor(colorValue)) {
        this.addError(`Invalid color format in ${name}.${scaleValue}: ${colorValue}`);
      }
    });

    // Check color progression (optional, for strict mode)
    if (this.strictMode) {
      this.validateColorProgression(name, scale);
    }
  }

  // Validate color progression (light to dark)
  validateColorProgression(name, scale) {
    const scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    const colors = scales.filter(s => scale[s]).map(s => scale[s]);

    for (let i = 1; i < colors.length; i++) {
      const prevBrightness = this.getColorBrightness(colors[i - 1]);
      const currentBrightness = this.getColorBrightness(colors[i]);

      if (currentBrightness >= prevBrightness) {
        this.addWarning(`Color progression may be incorrect in ${name}: ${scales[i-1]} to ${scales[i]} should get darker`);
      }
    }
  }

  // Validate typography tokens
  validateTypography(tokens) {
    if (!tokens.tokens.typography) return;

    this.log('Validating typography...', 'info');

    const typography = tokens.tokens.typography;

    // Check font families
    if (typography.fontFamily) {
      this.validateFontFamilies(typography.fontFamily);
    }

    // Check font sizes
    if (typography.fontSize) {
      this.validateFontSizes(typography.fontSize);
    }

    // Check font weights
    if (typography.fontWeight) {
      this.validateFontWeights(typography.fontWeight);
    }

    // Check letter spacing
    if (typography.letterSpacing) {
      this.validateLetterSpacing(typography.letterSpacing);
    }

    this.log('Typography validation completed', 'success');
  }

  // Validate font families
  validateFontFamilies(fontFamilies) {
    const requiredTypes = ['sans', 'serif', 'mono'];
    requiredTypes.forEach(type => {
      if (!fontFamilies[type]) {
        this.addWarning(`Missing font family for ${type}`);
      }
    });

    Object.keys(fontFamilies).forEach(type => {
      const family = fontFamilies[type];
      if (!Array.isArray(family) || family.length === 0) {
        this.addError(`Invalid font family structure for ${type}: must be non-empty array`);
      }
    });
  }

  // Validate font sizes
  validateFontSizes(fontSizes) {
    Object.keys(fontSizes).forEach(sizeName => {
      const size = fontSizes[sizeName];
      if (Array.isArray(size)) {
        // Format: ["1rem", { "lineHeight": "1.5" }]
        if (!this.isValidSize(size[0])) {
          this.addError(`Invalid font size format for ${sizeName}: ${size[0]}`);
        }
      } else if (typeof size === 'string') {
        if (!this.isValidSize(size)) {
          this.addError(`Invalid font size format for ${sizeName}: ${size}`);
        }
      } else {
        this.addError(`Invalid font size structure for ${sizeName}: must be string or array`);
      }
    });
  }

  // Validate font weights
  validateFontWeights(fontWeights) {
    const validWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
    const validNames = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];

    Object.keys(fontWeights).forEach(weightName => {
      const weight = fontWeights[weightName];
      if (!validWeights.includes(weight) && !validNames.includes(weightName)) {
        this.addWarning(`Unusual font weight value for ${weightName}: ${weight}`);
      }
    });
  }

  // Validate letter spacing
  validateLetterSpacing(letterSpacing) {
    Object.keys(letterSpacing).forEach(spacingName => {
      const spacing = letterSpacing[spacingName];
      if (typeof spacing !== 'string' || !spacing.match(/^-?[\d.]+em$/)) {
        this.addError(`Invalid letter spacing format for ${spacingName}: ${spacing} (should be em units)`);
      }
    });
  }

  // Validate spacing tokens
  validateSpacing(tokens) {
    if (!tokens.tokens.spacing) return;

    this.log('Validating spacing...', 'info');

    const spacing = tokens.tokens.spacing;

    // Check for standard spacing values
    const standardSpacing = {
      '0': '0px',
      'px': '1px',
      '1': '0.25rem',
      '2': '0.5rem',
      '4': '1rem',
      '8': '2rem',
      '16': '4rem',
      '32': '8rem',
      '64': '16rem'
    };

    Object.keys(standardSpacing).forEach(key => {
      if (!spacing[key]) {
        this.addWarning(`Missing standard spacing value: ${key}`);
      }
    });

    // Validate spacing formats
    Object.keys(spacing).forEach(spacingName => {
      const value = spacing[spacingName];
      if (!this.isValidSpacing(value)) {
        this.addError(`Invalid spacing format for ${spacingName}: ${value}`);
      }
    });

    this.log('Spacing validation completed', 'success');
  }

  // Validate breakpoints
  validateBreakpoints(tokens) {
    if (!tokens.tokens.breakpoints) return;

    this.log('Validating breakpoints...', 'info');

    const breakpoints = tokens.tokens.breakpoints;

    // Check for standard breakpoints
    const standardBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
    standardBreakpoints.forEach(bp => {
      if (!breakpoints[bp]) {
        this.addWarning(`Missing standard breakpoint: ${bp}`);
      }
    });

    // Validate breakpoint formats
    Object.keys(breakpoints).forEach(bpName => {
      const value = breakpoints[bpName];
      if (!this.isValidBreakpoint(value)) {
        this.addError(`Invalid breakpoint format for ${bpName}: ${value}`);
      }
    });

    // Check breakpoint progression
    if (this.strictMode) {
      this.validateBreakpointProgression(breakpoints);
    }

    this.log('Breakpoint validation completed', 'success');
  }

  // Validate breakpoint progression
  validateBreakpointProgression(breakpoints) {
    const bps = ['sm', 'md', 'lg', 'xl', '2xl'];
    const values = bps.filter(bp => breakpoints[bp]).map(bp => this.parsePxValue(breakpoints[bp]));

    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) {
        this.addError(`Breakpoint progression incorrect: ${bps[i-1]} (${values[i-1]}px) should be smaller than ${bps[i]} (${values[i]}px)`);
      }
    }
  }

  // Validate component tokens
  validateComponents(tokens) {
    if (!tokens.tokens.components) return;

    this.log('Validating components...', 'info');

    const components = tokens.tokens.components;

    // Check common component structures
    const commonComponents = ['button', 'input', 'card'];
    commonComponents.forEach(comp => {
      if (components[comp]) {
        this.validateComponent(comp, components[comp]);
      }
    });

    this.log('Component validation completed', 'success');
  }

  // Validate individual component
  validateComponent(name, component) {
    if (component.padding) {
      if (typeof component.padding === 'object') {
        // Validate each padding size in the object
        Object.keys(component.padding).forEach(size => {
          const paddingValue = component.padding[size];
          if (!this.isValidSpacing(paddingValue) && !this.isValidPaddingCompound(paddingValue)) {
            this.addError(`Invalid padding in ${name} component.${size}: ${paddingValue}`);
          }
        });
      } else if (!this.isValidSpacing(component.padding) && !this.isValidPaddingCompound(component.padding)) {
        this.addError(`Invalid padding in ${name} component: ${component.padding}`);
      }
    }

    if (component.fontSize) {
      if (typeof component.fontSize === 'object') {
        // Validate each font size in the object
        Object.keys(component.fontSize).forEach(size => {
          if (!this.isValidSize(component.fontSize[size])) {
            this.addError(`Invalid font size in ${name} component.${size}: ${component.fontSize[size]}`);
          }
        });
      } else if (!this.isValidSize(component.fontSize)) {
        this.addError(`Invalid font size in ${name} component: ${component.fontSize}`);
      }
    }

    if (component.borderRadius) {
      if (typeof component.borderRadius === 'object') {
        // Validate each border radius in the object
        Object.keys(component.borderRadius).forEach(size => {
          if (!this.isValidSize(component.borderRadius[size])) {
            this.addError(`Invalid border radius in ${name} component.${size}: ${component.borderRadius[size]}`);
          }
        });
      } else if (!this.isValidSize(component.borderRadius)) {
        this.addError(`Invalid border radius in ${name} component: ${component.borderRadius}`);
      }
    }
  }

  // Validate accessibility tokens
  validateAccessibility(tokens) {
    if (!tokens.tokens.accessibility) return;

    this.log('Validating accessibility...', 'info');

    const accessibility = tokens.tokens.accessibility;

    // Check focus ring configuration
    if (accessibility.focusRing) {
      const focusRing = accessibility.focusRing;
      if (focusRing.width && !this.isValidSize(focusRing.width)) {
        this.addError(`Invalid focus ring width: ${focusRing.width}`);
      }
      if (focusRing.color && !this.isValidColor(focusRing.color)) {
        this.addError(`Invalid focus ring color: ${focusRing.color}`);
      }
    }

    // Check contrast ratios
    if (accessibility.contrast) {
      const contrast = accessibility.contrast;
      const requiredRatios = ['minimum', 'large', 'enhanced'];
      requiredRatios.forEach(ratio => {
        if (!contrast[ratio]) {
          this.addWarning(`Missing contrast ratio for ${ratio}`);
        }
      });
    }

    this.log('Accessibility validation completed', 'success');
  }

  // Validate naming conventions
  validateNaming(tokens) {
    this.log('Validating naming conventions...', 'info');

    // Check for consistent naming patterns
    const checkNaming = (obj, path = '') => {
      Object.keys(obj).forEach(key => {
        // Check for camelCase vs kebab-case consistency
        if (key.includes('_')) {
          this.addWarning(`Consider using camelCase instead of underscores: ${path}${key}`);
        }

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkNaming(obj[key], `${path}${key}.`);
        }
      });
    };

    checkNaming(tokens.tokens);

    this.log('Naming validation completed', 'success');
  }

  // Validate consistency across tokens
  validateConsistency(tokens) {
    this.log('Validating consistency...', 'info');

    // Check for consistent units
    this.checkUnitConsistency(tokens);

    // Check for consistent naming patterns
    this.checkNamingConsistency(tokens);

    this.log('Consistency validation completed', 'success');
  }

  // Check for consistent units
  checkUnitConsistency(tokens) {
    // Collect all spacing values and check for mixed units
    const spacingValues = [];
    const collectSpacing = (obj) => {
      Object.values(obj).forEach(value => {
        if (typeof value === 'string' && this.isValidSpacing(value)) {
          spacingValues.push(value);
        } else if (typeof value === 'object' && value !== null) {
          collectSpacing(value);
        }
      });
    };

    if (tokens.tokens.spacing) {
      collectSpacing(tokens.tokens.spacing);
    }

    // Check for mixed rem/px usage (warning level)
    const hasRem = spacingValues.some(v => v.includes('rem'));
    const hasPx = spacingValues.some(v => v.includes('px') && !v === '0px');

    if (hasRem && hasPx) {
      this.addWarning('Mixed units detected in spacing values. Consider using rem for consistency.');
    }
  }

  // Check for naming consistency
  checkNamingConsistency(tokens) {
    // Check color palette naming consistency
    const colors = tokens.tokens.colors || {};
    const colorNames = Object.keys(colors);

    // Look for potential naming inconsistencies
    const colorPatterns = {
      'Gray/Grey': colorNames.filter(n => n.toLowerCase().includes('gray') || n.toLowerCase().includes('grey')),
      'Primary/Secondary': colorNames.filter(n => n.toLowerCase().includes('primary') || n.toLowerCase().includes('secondary'))
    };

    Object.entries(colorPatterns).forEach(([pattern, names]) => {
      if (names.length > 2) {
        this.addWarning(`Multiple similar color names detected for ${pattern}: ${names.join(', ')}`);
      }
    });
  }

  // Validate conflicts
  validateConflicts(tokens) {
    this.log('Validating conflicts...', 'info');

    // Check for naming conflicts
    this.checkNamingConflicts(tokens);

    // Check for value conflicts
    this.checkValueConflicts(tokens);

    this.log('Conflict validation completed', 'success');
  }

  // Check for naming conflicts
  checkNamingConflicts(tokens) {
    const allNames = new Set();
    const duplicates = new Set();

    const collectNames = (obj, path = '') => {
      Object.keys(obj).forEach(key => {
        const fullName = path + key;
        if (allNames.has(fullName)) {
          duplicates.add(fullName);
        }
        allNames.add(fullName);

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          collectNames(obj[key], fullName + '.');
        }
      });
    };

    collectNames(tokens.tokens);

    duplicates.forEach(name => {
      this.addError(`Naming conflict detected: ${name}`);
    });
  }

  // Check for value conflicts
  checkValueConflicts(tokens) {
    // This would check for inconsistent values across different contexts
    // For now, it's a placeholder for future enhancement
    this.addInfo('Value conflict checking not yet implemented');
  }

  // Utility methods
  isValidColor(color) {
    return /^#[0-9a-fA-F]{6}$/.test(color);
  }

  isValidSize(size) {
    return /^[\d.]+(rem|px|em|%)$/.test(size);
  }

  isValidSpacing(spacing) {
    return /^[\d.]+(rem|px|em|vh|vw|%)$/.test(spacing);
  }

  isValidPaddingCompound(padding) {
    // Handle compound padding like "0.5rem 1rem"
    return /^[\d.]+(rem|px|em|vh|vw|%)(\s+[\d.]+(rem|px|em|vh|vw|%))*$/.test(padding);
  }

  isValidBreakpoint(breakpoint) {
    return /^[\d.]+(px|em|rem)$/.test(breakpoint);
  }

  getColorBrightness(color) {
    // Simple brightness calculation for validation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  parsePxValue(value) {
    const match = value.match(/^[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  // Add validation results
  addError(message) {
    this.errors.push(message);
    this.log(`ERROR: ${message}`, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(`WARNING: ${message}`, 'warning');
  }

  addInfo(message) {
    this.info.push(message);
    this.log(`INFO: ${message}`, 'info');
  }

  // Logging
  log(message, level = 'info') {
    if (!this.verbose && level === 'info') return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  // Generate results object
  generateResults() {
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      summary: {
        total: this.errors.length + this.warnings.length + this.info.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        info: this.info.length
      }
    };
  }

  // Output results
  outputResults(results) {
    if (this.outputFormat === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else if (this.outputFormat === 'summary') {
      this.outputSummary(results);
    } else {
      this.outputDetailed(results);
    }
  }

  // Output detailed results
  outputDetailed(results) {
    console.log('\n' + '='.repeat(60));
    console.log('DESIGN TOKEN VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (results.success) {
      console.log(colors.green + '\n✅ All validations passed!' + colors.reset);
    } else {
      console.log(colors.red + '\n❌ Validation failed!' + colors.reset);
    }

    // Output summary
    console.log('\nSUMMARY:');
    console.log(`  Errors: ${results.summary.errors}`);
    console.log(`  Warnings: ${results.summary.warnings}`);
    console.log(`  Info: ${results.summary.info}`);
    console.log(`  Total: ${results.summary.total}`);

    // Output errors
    if (results.errors.length > 0) {
      console.log('\nERRORS:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Output warnings
    if (results.warnings.length > 0) {
      console.log('\nWARNINGS:');
      results.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    // Output info
    if (this.verbose && results.info.length > 0) {
      console.log('\nINFO:');
      results.info.forEach((info, index) => {
        console.log(`  ${index + 1}. ${info}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  // Output summary
  outputSummary(results) {
    if (results.success) {
      console.log(colors.green + `✅ Success: ${results.summary.warnings} warnings, ${results.summary.info} info messages` + colors.reset);
    } else {
      console.log(colors.red + `❌ Failed: ${results.summary.errors} errors, ${results.summary.warnings} warnings` + colors.reset);
    }
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--file':
      case '-f':
        options.file = args[++i];
        break;
      case '--strict':
      case '-s':
        options.strict = true;
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Design Token Validator

USAGE:
  node validate-design-tokens.js [OPTIONS]

OPTIONS:
  -f, --file FILE      Design tokens file path (default: config/design-tokens.json)
  -s, --strict         Enable strict validation mode
  --format FORMAT      Output format: text, json, summary (default: text)
  -v, --verbose        Show detailed output
  -h, --help           Show this help message

EXAMPLES:
  node validate-design-tokens.js
  node validate-design-tokens.js --strict --verbose
  node validate-design-tokens.js --file ./custom-tokens.json --format json
        `);
        process.exit(0);
        break;
    }
  }

  // Run validation
  const validator = new DesignTokenValidator(options);
  const results = validator.validate();

  // Exit with appropriate code
  process.exit(results.success ? 0 : 1);
}

// Export for use as module
module.exports = DesignTokenValidator;

// Run if called directly
if (require.main === module) {
  main();
}