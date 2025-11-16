#!/usr/bin/env node

/**
 * Tailwind Configuration Generator
 * Generates Tailwind CSS configuration from design tokens
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

class TailwindConfigGenerator {
  constructor(options = {}) {
    this.tokensFile = options.tokens || path.join(__dirname, '../config/design-tokens.json');
    this.templateFile = options.template || path.join(__dirname, '../config/tailwind.config.template.js');
    this.outputFile = options.output || null;
    this.mergeMode = options.merge || false;
    this.existingConfig = options.existing || null;
    this.verbose = options.verbose || false;
  }

  // Main generation method
  generate() {
    try {
      this.log('Starting Tailwind configuration generation...', 'info');

      // Load design tokens
      const tokens = this.loadTokens();

      // Load template if exists
      let template = null;
      if (fs.existsSync(this.templateFile)) {
        template = this.loadTemplate();
      }

      // Generate configuration
      const config = this.generateConfig(tokens, template);

      // Apply merge if requested
      let finalConfig = config;
      if (this.mergeMode && this.existingConfig) {
        finalConfig = this.mergeConfigurations(config, this.existingConfig);
      }

      // Output or return
      if (this.outputFile) {
        this.writeConfig(finalConfig, this.outputFile);
      }

      this.log('Tailwind configuration generation completed successfully', 'success');
      return finalConfig;

    } catch (error) {
      this.log(`Generation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Load design tokens
  loadTokens() {
    this.log(`Loading design tokens from: ${this.tokensFile}`, 'info');

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

  // Load template
  loadTemplate() {
    this.log(`Loading template from: ${this.templateFile}`, 'info');

    try {
      const content = fs.readFileSync(this.templateFile, 'utf8');
      this.log('Template loaded successfully', 'success');
      return content;
    } catch (error) {
      throw new Error(`Failed to load template: ${error.message}`);
    }
  }

  // Generate configuration
  generateConfig(tokens, template = null) {
    this.log('Generating Tailwind configuration...', 'info');

    if (template) {
      // Use template-based generation
      return this.generateFromTemplate(tokens, template);
    } else {
      // Use programmatic generation
      return this.generateProgrammatic(tokens);
    }
  }

  // Generate from template
  generateFromTemplate(tokens, template) {
    this.log('Using template-based generation', 'info');

    // Extract tokens for template context
    const config = {
      tokens: tokens.tokens,
      metadata: tokens.metadata,
      version: tokens.version,
    };

    // For now, return the template as-is (it should already reference the tokens)
    // In a more sophisticated implementation, we could process template variables
    return template;
  }

  // Generate programmatically
  generateProgrammatic(tokens) {
    this.log('Using programmatic generation', 'info');

    const { tokens: designTokens } = tokens;

    const config = {
      // Content detection
      content: [
        './src/**/*.{js,ts,jsx,tsx,vue,svelte}',
        './components/**/*.{js,ts,jsx,tsx,vue,svelte}',
        './app/**/*.{js,ts,jsx,tsx,vue,svelte}',
        './pages/**/*.{js,ts,jsx,tsx,vue,svelte}',
        './lib/**/*.{js,ts,jsx,tsx,vue,svelte}',
      ],

      // Dark mode
      darkMode: 'class',

      // Theme from design tokens
      theme: {
        extend: this.generateThemeExtensions(designTokens)
      },

      // Plugins
      plugins: this.generatePlugins(designTokens),

      // Configuration options
      prefix: '',
      important: false,
      separator: ':',
      corePlugins: this.generateCorePlugins()
    };

    return this.formatConfig(config);
  }

  // Generate theme extensions
  generateThemeExtensions(tokens) {
    const extensions = {};

    // Colors
    if (tokens.colors) {
      extensions.colors = this.generateColorConfig(tokens.colors);
    }

    // Typography
    if (tokens.typography) {
      const typographyConfig = this.generateTypographyConfig(tokens.typography);
      Object.assign(extensions, typographyConfig);
    }

    // Spacing
    if (tokens.spacing) {
      extensions.spacing = {
        ...tokens.spacing,
        // Add common shortcuts
        'xs': tokens.spacing['1'] || '0.25rem',
        'sm': tokens.spacing['2'] || '0.5rem',
        'md': tokens.spacing['4'] || '1rem',
        'lg': tokens.spacing['6'] || '1.5rem',
        'xl': tokens.spacing['8'] || '2rem',
        '2xl': tokens.spacing['12'] || '3rem',
        '3xl': tokens.spacing['16'] || '4rem',
        '4xl': tokens.spacing['20'] || '5rem',
        '5xl': tokens.spacing['24'] || '6rem',
        '6xl': tokens.spacing['32'] || '8rem',
      };
    }

    // Border radius
    if (tokens.borderRadius) {
      extensions.borderRadius = tokens.borderRadius;
    }

    // Shadows
    if (tokens.shadows) {
      extensions.boxShadow = tokens.shadows;
    }

    // Opacity
    if (tokens.opacity) {
      extensions.opacity = tokens.opacity;
    }

    // Breakpoints
    if (tokens.breakpoints) {
      extensions.screens = tokens.breakpoints;
    }

    // Z-index
    if (tokens.zIndex) {
      extensions.zIndex = tokens.zIndex;
    }

    // Transitions
    if (tokens.transition) {
      extensions.transitionDuration = tokens.transition.duration;
      extensions.transitionTimingFunction = tokens.transition.timingFunction;
      extensions.transitionProperty = tokens.transition.property;
    }

    // Animation
    if (tokens.animation) {
      extensions.animationDuration = tokens.animation.duration;
      extensions.animationTimingFunction = tokens.animation.timingFunction;
    }

    // Components
    if (tokens.components) {
      Object.assign(extensions, this.generateComponentConfig(tokens.components));
    }

    // Custom tokens
    if (tokens.custom) {
      extensions.layout = tokens.custom.layout;
    }

    // Semantic colors
    if (tokens.semantic) {
      extensions.semantic = tokens.semantic;
    }

    // Accessibility
    if (tokens.accessibility) {
      extensions.focusRing = tokens.accessibility.focusRing;
    }

    return extensions;
  }

  // Generate color configuration
  generateColorConfig(colors) {
    const colorConfig = {};

    Object.keys(colors).forEach(colorName => {
      const colorValue = colors[colorName];

      if (typeof colorValue === 'string') {
        // Single color value
        colorConfig[colorName] = colorValue;
      } else if (typeof colorValue === 'object') {
        // Color scale
        colorConfig[colorName] = colorValue;
      }
    });

    // Add semantic colors and aliases
    if (colors.neutral) {
      colorConfig.gray = colors.neutral;
      colorConfig.slate = colors.secondary || colors.neutral;
    }

    if (colors.primary) {
      colorConfig.info = colors.primary;
    }

    if (colors.accent) {
      colorConfig.error = colors.accent;
    }

    // Add standard aliases
    colorConfig.black = '#000000';
    colorConfig.white = '#ffffff';
    colorConfig.transparent = 'transparent';
    colorConfig.current = 'currentColor';

    return colorConfig;
  }

  // Generate typography configuration
  generateTypographyConfig(typography) {
    const typographyConfig = {};

    if (typography.fontFamily) {
      typographyConfig.fontFamily = typography.fontFamily;
    }

    if (typography.fontSize) {
      typographyConfig.fontSize = {};
      Object.keys(typography.fontSize).forEach(sizeName => {
        const size = typography.fontSize[sizeName];
        if (Array.isArray(size)) {
          typographyConfig.fontSize[sizeName] = size;
        } else {
          typographyConfig.fontSize[sizeName] = [size, { lineHeight: '1.5' }];
        }
      });
    }

    if (typography.fontWeight) {
      typographyConfig.fontWeight = typography.fontWeight;
    }

    if (typography.letterSpacing) {
      typographyConfig.letterSpacing = typography.letterSpacing;
    }

    if (typography.lineHeight) {
      typographyConfig.lineHeight = typography.lineHeight;
    }

    return typographyConfig;
  }

  // Generate component configuration
  generateComponentConfig(components) {
    const componentConfig = {};

    Object.keys(components).forEach(componentName => {
      const component = components[componentName];
      componentConfig[componentName] = component;
    });

    return componentConfig;
  }

  // Generate plugins
  generatePlugins(tokens) {
    const plugins = [];

    // Utility plugins
    plugins.push(function({ addUtilities, theme }) {
      const newUtilities = {
        // Focus ring utilities
        '.focus-ring': {
          '@apply focus:outline-none focus:ring-2 focus:ring-offset-2': {},
        },
        '.focus-ring-primary': {
          '@apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500': {},
        },
        '.focus-ring-error': {
          '@apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500': {},
        },

        // Text utilities
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },

        // Reduced motion utilities
        '@media (prefers-reduced-motion: reduce)': {
          '.motion-safe': {
            'animation-duration': '0.01ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.01ms !important',
          },
        },
      };

      addUtilities(newUtilities);
    });

    // Aspect ratio plugin
    plugins.push(function({ addUtilities }) {
      const aspectRatios = {
        '.aspect-square': { aspectRatio: '1 / 1' },
        '.aspect-video': { aspectRatio: '16 / 9' },
        '.aspect-4/3': { aspectRatio: '4 / 3' },
        '.aspect-3/2': { aspectRatio: '3 / 2' },
        '.aspect-1/1': { aspectRatio: '1 / 1' },
        '.aspect-9/16': { aspectRatio: '9 / 16' },
      };

      addUtilities(aspectRatios);
    });

    // Container plugin
    plugins.push(function({ addComponents, theme }) {
      const containerComponents = {
        '.container': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),

          '@screen sm': {
            maxWidth: theme('screens.sm'),
          },
          '@screen md': {
            maxWidth: theme('screens.md'),
          },
          '@screen lg': {
            maxWidth: theme('screens.lg'),
          },
          '@screen xl': {
            maxWidth: theme('screens.xl'),
          },
          '@screen 2xl': {
            maxWidth: theme('screens.2xl'),
          },
        },
      };

      addComponents(containerComponents);
    });

    return plugins;
  }

  // Generate core plugins configuration
  generateCorePlugins() {
    // Enable all core plugins
    return {
      preflight: true,
      container: true,
      space: true,
      divide: true,
      aspectRatio: true,
      accentColor: true,
      animation: true,
      background: true,
      backdropBlur: true,
      backdropBrightness: true,
      backdropContrast: true,
      backdropFilter: true,
      backdropGrayscale: true,
      backdropHueRotate: true,
      backdropInvert: true,
      backdropOpacity: true,
      backdropSaturate: true,
      backdropSepia: true,
      backgroundAttachment: true,
      backgroundBlendMode: true,
      backgroundClip: true,
      backgroundColor: true,
      backgroundImage: true,
      backgroundOpacity: true,
      backgroundOrigin: true,
      backgroundPosition: true,
      backgroundRepeat: true,
      backgroundSize: true,
      blur: true,
      brightness: true,
      borderCollapse: true,
      borderColor: true,
      borderOpacity: true,
      borderRadius: true,
      borderStyle: true,
      borderWidth: true,
      boxDecorationBreak: true,
      boxShadow: true,
      boxSizing: true,
      breakAfter: true,
      breakBefore: true,
      breakInside: true,
      captionSide: true,
      caretColor: true,
      clear: true,
      colSpan: true,
      columns: true,
      container: true,
      content: true,
      contrast: true,
      cursor: true,
      display: true,
      divideColor: true,
      divideOpacity: true,
      divideStyle: true,
      divideWidth: true,
      dropShadow: true,
      fill: true,
      filter: true,
      flex: true,
      flexBasis: true,
      flexDirection: true,
      flexGrow: true,
      flexShrink: true,
      flexWrap: true,
      float: true,
      fontFamily: true,
      fontSize: true,
      fontSmoothing: true,
      fontStyle: true,
      fontVariantNumeric: true,
      fontWeight: true,
      gap: true,
      gradientColorStops: true,
      gradientColorStopPosition: true,
      grayscale: true,
      gridAutoColumns: true,
      gridAutoFlow: true,
      gridAutoRows: true,
      gridColumn: true,
      gridColumnEnd: true,
      gridColumnStart: true,
      gridRow: true,
      gridRowEnd: true,
      gridRowStart: true,
      gridTemplateColumns: true,
      gridTemplateRows: true,
      height: true,
      hueRotate: true,
      hyphens: true,
      inset: true,
      invert: true,
      isolation: true,
      justifyContent: true,
      justifyItems: true,
      justifySelf: true,
      letterSpacing: true,
      lineHeight: true,
      listStylePosition: true,
      listStyleType: true,
      margin: true,
      maxHeight: true,
      maxWidth: true,
      minHeight: true,
      minWidth: true,
      mixBlendMode: true,
      objectFit: true,
      objectPosition: true,
      opacity: true,
      order: true,
      outline: true,
      outlineColor: true,
      outlineOffset: true,
      outlineStyle: true,
      outlineWidth: true,
      overflow: true,
      overscrollBehavior: true,
      padding: true,
      placeContent: true,
      placeItems: true,
      placeSelf: true,
      placeholderColor: true,
      placeholderOpacity: true,
      position: true,
      resize: true,
      right: true,
      rowSpan: true,
      saturate: true,
      scale: true,
      scrollBehavior: true,
      scrollMargin: true,
      scrollMarginBottom: true,
      scrollMarginLeft: true,
      scrollMarginRight: true,
      scrollMarginTop: true,
      scrollMarginX: true,
      scrollMarginY: true,
      scrollPadding: true,
      scrollPaddingAlign: true,
      scrollPaddingBottom: true,
      scrollPaddingLeft: true,
      scrollPaddingRight: true,
      scrollPaddingTop: true,
      scrollPaddingX: true,
      scrollPaddingY: true,
      scrollSnapAlign: true,
      scrollSnapStop: true,
      scrollSnapType: true,
      scrollMarginInline: true,
      scrollMarginInlineStart: true,
      scrollMarginInlineEnd: true,
      scrollPaddingInline: true,
      scrollPaddingInlineStart: true,
      scrollPaddingInlineEnd: true,
      scrollMarginBlock: true,
      scrollMarginBlockStart: true,
      scrollMarginBlockEnd: true,
      scrollPaddingBlock: true,
      scrollPaddingBlockStart: true,
      scrollPaddingBlockEnd: true,
      sepia: true,
      skew: true,
      space: true,
      stroke: true,
      strokeWidth: true,
      tableLayout: true,
      textAlign: true,
      textColor: true,
      textDecoration: true,
      textOpacity: true,
      textOverflow: true,
      textTransform: true,
      textUnderlineOffset: true,
      transform: true,
      transformOrigin: true,
      translate: true,
      transitionDuration: true,
      transitionDelay: true,
      transitionProperty: true,
      transitionTimingFunction: true,
      userSelect: true,
      verticalAlign: true,
      visibility: true,
      whitespace: true,
      width: true,
      willChange: true,
      wordBreak: true,
      zIndex: true,
      gap: true,
      gridAutoFlow: true,
    };
  }

  // Merge configurations
  mergeConfigurations(generated, existing) {
    this.log('Merging configurations...', 'info');

    // For now, implement simple merge - in a more sophisticated version,
    // we could parse the existing config and merge intelligently
    try {
      const existingObj = this.parseConfig(existing);
      const generatedObj = this.parseConfig(generated);

      // Deep merge, preserving existing customizations
      const merged = this.deepMerge(generatedObj, existingObj);

      return this.formatConfig(merged);
    } catch (error) {
      this.log(`Failed to merge configurations: ${error.message}`, 'warning');
      return generated;
    }
  }

  // Parse configuration string
  parseConfig(configString) {
    try {
      // Remove module.exports wrapper if present
      const code = configString.replace(/^module\.exports\s*=\s*/, '').replace(/;?\s*$/, '');
      return eval(`(${code})`);
    } catch (error) {
      throw new Error(`Failed to parse configuration: ${error.message}`);
    }
  }

  // Deep merge objects
  deepMerge(target, source) {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }

  // Format configuration as JavaScript
  formatConfig(config) {
    const configString = `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)};

// Additional exports for design token access
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Export design tokens for external access if needed
  const designTokens = require('./design-tokens.json');
  module.exports.tokens = designTokens.tokens;
  module.exports.designTokens = designTokens;
}`;

    // Clean up JSON formatting for better readability
    return configString
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/"/g, "'");
  }

  // Write configuration to file
  writeConfig(config, filename) {
    this.log(`Writing configuration to: ${filename}`, 'info');

    try {
      fs.writeFileSync(filename, config, 'utf8');
      this.log('Configuration written successfully', 'success');
    } catch (error) {
      throw new Error(`Failed to write configuration: ${error.message}`);
    }
  }

  // Logging
  log(message, level = 'info') {
    if (!this.verbose && level === 'info') return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
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
      case '--tokens':
      case '-t':
        options.tokens = args[++i];
        break;
      case '--template':
        options.template = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--merge':
      case '-m':
        options.merge = true;
        break;
      case '--existing':
      case '-e':
        options.existing = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Tailwind Configuration Generator

USAGE:
  node generate-tailwind-config.js [OPTIONS]

OPTIONS:
  -t, --tokens FILE     Design tokens file path
  --template FILE       Template file path
  -o, --output FILE     Output file path
  -m, --merge           Merge with existing configuration
  -e, --existing FILE   Existing configuration file (for merging)
  -v, --verbose         Show detailed output
  -h, --help            Show this help message

EXAMPLES:
  node generate-tailwind-config.js
  node generate-tailwind-config.js --output ./tailwind.config.js
  node generate-tailwind-config.js --merge --existing ./current.config.js --output ./new.config.js
        `);
        process.exit(0);
        break;
    }
  }

  // Handle stdin for existing config
  if (!options.existing && !process.stdin.isTTY) {
    let existingData = '';
    process.stdin.on('data', chunk => {
      existingData += chunk;
    });
    process.stdin.on('end', () => {
      options.existing = existingData;
      runGenerator(options);
    });
  } else {
    runGenerator(options);
  }
}

function runGenerator(options) {
  try {
    const generator = new TailwindConfigGenerator(options);
    const config = generator.generate();

    // Output to stdout if no output file specified
    if (!options.output) {
      console.log(config);
    }

    process.exit(0);
  } catch (error) {
    console.error(colors.red + `Error: ${error.message}` + colors.reset);
    process.exit(1);
  }
}

// Export for use as module
module.exports = TailwindConfigGenerator;

// Run if called directly
if (require.main === module) {
  main();
}