#!/usr/bin/env node

/**
 * Constitution compliance validation for generated components
 */

import { handleError } from './utils/error-handler.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';

/**
 * Constitution principles to validate against
 */
const CONSTITUTION_PRINCIPLES = {
  'Technology Stack Standardization': {
    '1': 'Must use Tailwind CSS for styling',
    '2': 'Must use React/TypeScript for component architecture',
    '3': 'Must use Vite/ESBuild for build processes',
    '4': 'No SDK dependencies allowed'
  },
  'Multi-Model Cost Optimization': {
    '1': 'Must use Claude Sonnet 4.5 for architectural decisions',
    '2': 'Must use GLM 4.6 for high-volume execution tasks',
    '3': 'Must implement prompt caching for repeated operations'
  },
  'Parallel Agent Orchestration': {
    '1': 'Must implement 5 specialized sub-agents',
    '2': 'Must support parallel execution with proper coordination',
    '3': 'No MCP server integration - orchestration via Task tool'
  },
  'Automated Quality Enforcement': {
    '1': 'Must enforce coding standards through PostUse hooks',
    '2': 'Must provide immediate correction of violations',
    '3': 'Must achieve 95% automatic correction rate'
  },
  'Simplicity and Portability': {
    '1': 'Must use local configuration files for integrations',
    '2': 'Must support environment variables for path portability',
    '3': 'Must handle Tailwind CSS configuration automatically',
    '4': 'No external runtime dependencies or MCP servers'
  }
};

/**
 * Validate component against technology stack standards
 */
function validateTechnologyStack(componentPath, content) {
  const issues = [];
  const compliance = { passed: 0, total: 4, issues: [] };

  // Check for TypeScript
  if (!componentPath.endsWith('.tsx') && !componentPath.endsWith('.ts')) {
    issues.push('Component must use TypeScript (.tsx/.ts)');
  } else {
    compliance.passed++;
  }

  // Check for React imports
  if (content.includes('import React')) {
    compliance.passed++;
  } else {
    issues.push('Component must import React');
  }

  // Check for Tailwind CSS classes
  if (/className=.*\b(?:bg-|text-|p-|m-|flex|grid|w-|h-)/.test(content)) {
    compliance.passed++;
  } else {
    issues.push('Component must use Tailwind CSS utility classes');
  }

  // Check for SDK dependencies (should be absent)
  const sdkPatterns = [
    /import.*from ['"]@?[a-z-]+-sdk['"]/gi,
    /import.*from ['"]@?[a-z-]+\/sdk['"]/gi,
    /require\(['"].*sdk['"]\)/gi
  ];

  const hasSdk = sdkPatterns.some(pattern => pattern.test(content));
  if (!hasSdk) {
    compliance.passed++;
  } else {
    issues.push('Component must not use SDK dependencies');
  }

  compliance.issues = issues;
  return compliance;
}

/**
 * Validate component architecture patterns
 */
function validateArchitecture(componentPath, content) {
  const issues = [];
  const compliance = { passed: 0, total: 3, issues: [] };

  // Check for functional component pattern (preferred)
  const functionalComponentPattern = /export\s+(?:const\s+\w+\s*=\s*)?React\.FC|React\.forwardRef/;
  if (functionalComponentPattern.test(content)) {
    compliance.passed++;
  } else {
    issues.push('Component should use functional component pattern');
  }

  // Check for proper TypeScript interfaces
  const interfacePattern = /interface\s+\w+(?:Props|State|Ref)/;
  if (interfacePattern.test(content)) {
    compliance.passed++;
  } else {
    issues.push('Component should define TypeScript interfaces');
  }

  // Check for proper prop handling
  const propsPattern = /(?:interface\s+\w+Props|{[^}]*(?:\w+):)/;
  if (propsPattern.test(content)) {
    compliance.passed++;
  } else {
    issues.push('Component should define and use props properly');
  }

  compliance.issues = issues;
  return compliance;
}

/**
 * Validate Tailwind CSS compliance
 */
function validateTailwindCompliance(componentPath, content) {
  const issues = [];
  const compliance = { passed: 0, total: 4, issues: [] };

  // Check for Tailwind utility classes
  const tailwindClasses = content.match(/className={[^}]*}/g) || [];
  const hasTailwindClasses = tailwindClasses.some(classes =>
    /\b(?:flex|grid|p-|m-|text-|bg-|border-|rounded-|shadow-)/.test(classes[0])
  );

  if (hasTailwindClasses) {
    compliance.passed++;
  } else {
    issues.push('Component should use Tailwind utility classes');
  }

  // Check for responsive design
  const responsivePatterns = [
    /sm:/,
    /md:/,
    /lg:/,
    /xl:/
  ];

  const hasResponsive = responsivePatterns.some(pattern => pattern.test(content));
  if (hasResponsive) {
    compliance.passed++;
  } else {
    issues.push('Component should include responsive design patterns');
  }

  // Check for design token usage (colors, spacing)
  const designTokenPatterns = [
    /primary-\d+/,
    /secondary-\d+/,
    /accent-\d+/,
    /space-[xy]-\d+/,
    /text-[a-z]+-\d+/
  ];

  const hasDesignTokens = designTokenPatterns.some(pattern => pattern.test(content));
  if (hasDesignTokens) {
    compliance.passed++;
  } else {
    issues.push('Component should use design tokens for consistency');
  }

  // Check for accessibility attributes
  const accessibilityPatterns = [
    /aria-/,
    /role=/,
    /tabIndex/,
    /focus:/,
    /alt=/
  ];

  const hasAccessibility = accessibilityPatterns.some(pattern => pattern.test(content));
  if (hasAccessibility) {
    compliance.passed++;
  } else {
    issues.push('Component should include accessibility attributes');
  }

  compliance.issues = issues;
  return compliance;
}

/**
 * Validate quality and maintainability
 */
function validateQuality(componentPath, content) {
  const issues = [];
  const compliance = { passed: 0, total: 3, issues: [] };

  // Check for JSDoc comments
  const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
  if (hasJSDoc) {
    compliance.passed++;
  } else {
    issues.push('Component should include JSDoc documentation');
  }

  // Check for proper error handling
  const errorHandlingPatterns = [
    /try\s*{/,
    /catch\s*\(/,
    /throw\s+/,
    /typeof\s+\w+\s*===?\s*['"]undefined['"]/
  ];

  const hasErrorHandling = errorHandlingPatterns.some(pattern => pattern.test(content));
  if (hasErrorHandling) {
    compliance.passed++;
  } else {
    issues.push('Component should include proper error handling');
  }

  // Check for component structure (should be reasonably sized)
  const lineCount = content.split('\n').length;
  if (lineCount > 0 && lineCount < 500) {
    compliance.passed++;
  } else {
    issues.push('Component should be reasonably sized (< 500 lines)');
  }

  compliance.issues = issues;
  return compliance;
}

/**
 * Validate overall component compliance
 */
function validateComponent(componentPath) {
  if (!existsSync(componentPath)) {
    throw new Error(`Component file not found: ${componentPath}`);
  }

  const content = readFileSync(componentPath, 'utf8');
  const fileName = componentPath.split('/').pop();

  console.log(`📋 Validating component: ${fileName}`);

  const results = {
    fileName,
    technologyStack: validateTechnologyStack(componentPath, content),
    architecture: validateArchitecture(componentPath, content),
    tailwindCompliance: validateTailwindCompliance(componentPath, content),
    quality: validateQuality(componentPath, content),
    overall: { passed: 0, total: 4, issues: [] }
  };

  // Calculate overall compliance
  const categories = ['technologyStack', 'architecture', 'tailwindCompliance', 'quality'];
  categories.forEach(category => {
    results.overall.passed += results[category].passed;
    results.overall.total += results[category].total;
    results.overall.issues.push(...results[category].issues.map(issue => `${category}: ${issue}`));
  });

  // Calculate compliance percentage
  const compliancePercentage = Math.round((results.overall.passed / results.overall.total) * 100);

  results.overall.percentage = compliancePercentage;
  results.overall.compliant = compliancePercentage >= 75; // 75% threshold

  return results;
}

/**
 * Validate complete component directory
 */
function validateComponentDirectory(componentDir) {
  console.log(`📁 Validating component directory: ${componentDir}`);

  const requiredFiles = [
    'index.ts',
    `${componentDir.split('/').pop()}.tsx`
  ];

  const optionalFiles = [
    `${componentDir.split('/').pop()}.test.tsx`,
    `${componentDir.split('/').pop()}.stories.tsx`,
    `${componentDir.split('/').pop()}.types.ts`
  ];

  const validation = {
    directory: componentDir,
    requiredFiles: { present: 0, total: requiredFiles.length, missing: [] },
    optionalFiles: { present: 0, total: optionalFiles.length },
    components: [],
    overall: { passed: 0, total: 0, compliant: false, percentage: 0 }
  };

  // Check required files
  requiredFiles.forEach(file => {
    const filePath = `${componentDir}/${file}`;
    if (existsSync(filePath)) {
      validation.requiredFiles.present++;
      validation.requiredFiles.total++;
    } else {
      validation.requiredFiles.missing.push(file);
    }
  });

  // Check optional files
  optionalFiles.forEach(file => {
    const filePath = `${componentDir}/${file}`;
    if (existsSync(filePath)) {
      validation.optionalFiles.present++;
      validation.optionalFiles.total++;
    }
  });

  // Validate component files
  const componentFiles = requiredFiles
    .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
    .map(file => `${componentDir}/${file}`)
    .filter(existsSync);

  componentFiles.forEach(filePath => {
    try {
      const result = validateComponent(filePath);
      validation.components.push(result);
      validation.overall.passed += result.overall.passed;
      validation.overall.total += result.overall.total;
    } catch (error) {
      console.error(`❌ Error validating ${filePath}:`, error.message);
    }
  });

  // Calculate overall directory compliance
  const requiredCompliance = validation.requiredFiles.present === validation.requiredFiles.total;
  const componentCompliance = validation.overall.total > 0 && (validation.overall.passed / validation.overall.total) >= 0.75;

  validation.overall.compliant = requiredCompliance && componentCompliance;
  validation.overall.percentage = validation.overall.total > 0
    ? Math.round((validation.overall.passed / validation.overall.total) * 100)
    : 0;

  return validation;
}

/**
 * Run comprehensive validation
 */
async function runValidation(directories = []) {
  console.log('🏛️ FrontEnd UI/UX Build Plugin - Constitution Compliance Validation');
  console.log('=' .repeat(70));

  const allResults = [];

  for (const dir of directories) {
    try {
      const result = validateComponentDirectory(dir);
      allResults.push(result);

      console.log(`\n📁 ${result.directory}`);
      console.log(`   Required files: ${result.requiredFiles.present}/${result.requiredFiles.total}`);
      console.log(`   Optional files: ${result.optionalFiles.present}/${result.optionalFiles.total}`);
      console.log(`   Components: ${result.components.length}`);
      console.log(`   Overall compliance: ${result.overall.percentage}% (${result.overall.compliant ? '✅' : '❌'})`);

      // Show component-level results
      result.components.forEach(comp => {
        console.log(`     ${comp.fileName}: ${comp.overall.percentage}% compliance`);
        if (comp.overall.issues.length > 0) {
          comp.overall.issues.slice(0, 3).forEach(issue => {
            console.log(`        ⚠️  ${issue}`);
          });
        }
      });

      if (result.overall.issues.length > 0) {
        console.log(`   Issues: ${result.overall.issues.length}`);
      }

    } catch (error) {
      console.error(`❌ Error validating ${dir}:`, error.message);
      allResults.push({
        directory: dir,
        error: error.message,
        overall: { compliant: false }
      });
    }
  }

  // Summary
  const compliantDirs = allResults.filter(r => r.overall.compliant).length;
  const totalDirs = allResults.length;
  const overallCompliance = totalDirs > 0 ? (compliantDirs / totalDirs) * 100 : 0;

  console.log('\n📊 Validation Summary:');
  console.log(`   Directories validated: ${totalDirs}`);
  console.log(`   Compliant directories: ${compliantDirs}`);
  console.log(`   Overall compliance: ${Math.round(overallCompliance)}%`);

  if (overallCompliance >= 80) {
    console.log('✅ Generated components meet constitution standards');
  } else {
    console.log('❌ Some components do not meet constitution standards');
    console.log('💡 Review the issues above and fix compliance problems');
  }

  return {
    compliant: overallCompliance >= 80,
    percentage: overallCompliance,
    results: allResults
  };
}

// Main execution
async function main() {
  try {
    // Default component directories to validate
    const componentDirs = [
      'src/components/ui',
      'src/components/forms',
      'src/components/layout'
    ];

    // Filter to existing directories
    const existingDirs = componentDirs.filter(dir => {
      const fs = require('fs');
      return fs.existsSync(dir);
    });

    if (existingDirs.length === 0) {
      console.log('ℹ️  No component directories found to validate');
      console.log('   Expected directories: src/components/ui, src/components/forms, src/components/layout');
      console.log('   Create components first using: /scaffold-component TestComponent');
      return;
    }

    await runValidation(existingDirs);

  } catch (error) {
    handleError(error, { component: 'validate-constitution' });
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main();
}

export {
  validateComponent,
  validateComponentDirectory,
  runValidation
};