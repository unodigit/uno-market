/**
 * Tailwind CSS Configuration Template
 * Auto-generated from design tokens for FrontEnd UI/UX Build Plugin
 * Version: 1.0.0
 *
 * This template provides a comprehensive Tailwind CSS configuration
 * that can be automatically updated from design tokens.
 *
 * Usage:
 * 1. Copy this file to your project as tailwind.config.js
 * 2. Customize as needed for your specific project
 * 3. Use the tailwind-config skill to keep it synchronized with design tokens
 */

const designTokens = require('./design-tokens.json');
const { tokens } = designTokens;

module.exports = {
  // Use modern content detection
  content: [
    './src/**/*.{js,ts,jsx,tsx,vue,svelte}',
    './components/**/*.{js,ts,jsx,tsx,vue,svelte}',
    './app/**/*.{js,ts,jsx,tsx,vue,svelte}',
    './pages/**/*.{js,ts,jsx,tsx,vue,svelte}',
    './lib/**/*.{js,ts,jsx,tsx,vue,svelte}',
  ],

  // Dark mode configuration
  darkMode: 'class',

  // Theme configuration from design tokens
  theme: {
    // Extend with design tokens
    extend: {
      // Colors from design tokens
      colors: {
        // Primary colors
        primary: tokens.colors.primary,

        // Secondary colors
        secondary: tokens.colors.secondary,

        // Accent colors
        accent: tokens.colors.accent,

        // Neutral colors (with aliases)
        neutral: tokens.colors.neutral,
        gray: tokens.colors.neutral,
        slate: tokens.colors.secondary,

        // Semantic colors
        success: tokens.colors.success,
        warning: tokens.colors.warning,
        error: tokens.colors.error,

        // Info colors (derived from primary)
        info: {
          50: tokens.colors.primary[50],
          100: tokens.colors.primary[100],
          200: tokens.colors.primary[200],
          300: tokens.colors.primary[300],
          400: tokens.colors.primary[400],
          500: tokens.colors.primary[500],
          600: tokens.colors.primary[600],
          700: tokens.colors.primary[700],
          800: tokens.colors.primary[800],
          900: tokens.colors.primary[900],
          950: tokens.colors.primary[950],
        },

        // Brand colors (custom)
        brand: tokens.custom.brand,

        // Standard aliases
        black: tokens.colors.neutral.black,
        white: tokens.colors.neutral.white,
        transparent: 'transparent',
        current: 'currentColor',
      },

      // Typography from design tokens
      fontFamily: {
        sans: tokens.typography.fontFamily.sans,
        serif: tokens.typography.fontFamily.serif,
        mono: tokens.typography.fontFamily.mono,
      },

      fontSize: {
        ...Object.fromEntries(
          Object.entries(tokens.typography.fontSize).map(([key, value]) => [
            key,
            Array.isArray(value) ? value : [value, { lineHeight: '1.5' }]
          ])
        ),
      },

      fontWeight: tokens.typography.fontWeight,

      letterSpacing: tokens.typography.letterSpacing,

      lineHeight: tokens.typography.lineHeight,

      // Spacing from design tokens
      spacing: {
        ...tokens.spacing,
        // Add common spacing shortcuts
        'xs': tokens.spacing['1'],
        'sm': tokens.spacing['2'],
        'md': tokens.spacing['4'],
        'lg': tokens.spacing['6'],
        'xl': tokens.spacing['8'],
        '2xl': tokens.spacing['12'],
        '3xl': tokens.spacing['16'],
        '4xl': tokens.spacing['20'],
        '5xl': tokens.spacing['24'],
        '6xl': tokens.spacing['32'],
      },

      // Border radius from design tokens
      borderRadius: tokens.borderRadius,

      // Shadows from design tokens
      boxShadow: tokens.shadows,

      // Opacity from design tokens
      opacity: tokens.opacity,

      // Breakpoints from design tokens
      screens: tokens.breakpoints,

      // Container queries from design tokens
      container: tokens.container,

      // Z-index from design tokens
      zIndex: tokens.zIndex,

      // Transitions from design tokens
      transitionDuration: tokens.transition.duration,
      transitionTimingFunction: tokens.transition.timingFunction,
      transitionProperty: tokens.transition.property,

      // Animation duration and timing
      animationDuration: tokens.animation.duration,
      animationTimingFunction: tokens.animation.timingFunction,

      // Component-specific styles
      // These can be used with @apply directive
      button: {
        padding: tokens.components.button.padding,
        fontSize: tokens.components.button.fontSize,
        borderRadius: tokens.components.button.borderRadius,
        fontWeight: tokens.components.button.fontWeight,
      },

      input: {
        padding: tokens.components.input.padding,
        fontSize: tokens.components.input.fontSize,
        borderRadius: tokens.components.input.borderRadius,
        borderWidth: tokens.components.input.borderWidth,
      },

      card: {
        padding: tokens.components.card.padding,
        borderRadius: tokens.components.card.borderRadius,
        boxShadow: tokens.components.card.shadow,
        backgroundColor: tokens.components.card.backgroundColor,
      },

      modal: {
        padding: tokens.components.modal.padding,
        borderRadius: tokens.components.modal.borderRadius,
        boxShadow: tokens.components.modal.shadow,
        backgroundColor: tokens.components.modal.backgroundColor,
        maxWidth: tokens.components.modal.maxWidth,
        maxHeight: tokens.components.modal.maxHeight,
      },

      // Layout tokens
      layout: tokens.custom.layout,

      // Semantic colors for states
      semantic: tokens.semantic,

      // Accessibility
      focusRing: tokens.accessibility.focusRing,
    },
  },

  // Plugins
  plugins: [
    // Plugin for component utilities
    function({ addUtilities, theme }) {
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
    },

    // Plugin for aspect ratio support
    function({ addUtilities }) {
      const aspectRatios = {
        '.aspect-square': { aspectRatio: '1 / 1' },
        '.aspect-video': { aspectRatio: '16 / 9' },
        '.aspect-4/3': { aspectRatio: '4 / 3' },
        '.aspect-3/2': { aspectRatio: '3 / 2' },
        '.aspect-1/1': { aspectRatio: '1 / 1' },
        '.aspect-9/16': { aspectRatio: '9 / 16' },
      };

      addUtilities(aspectRatios);
    },

    // Plugin for container queries
    function({ addComponents, theme }) {
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
    },
  ],

  // Prefix for utilities (if needed)
  prefix: '',

  // Important configuration (if needed)
  important: false,

  // Separator for utilities
  separator: ':',

  // Core plugins to include
  corePlugins: {
    // Ensure all core plugins are enabled
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
  },
};

// Export additional utilities for programmatic use
module.exports.tokens = tokens;
module.exports.designTokens = designTokens;