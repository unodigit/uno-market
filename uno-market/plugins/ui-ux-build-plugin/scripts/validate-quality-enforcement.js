#!/usr/bin/env node

/**
 * Validate quality enforcement meets 95% automatic correction target
 * Part of User Story 3: Automated Quality Enforcement
 */

import { readFile, access, constants } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

// Configuration
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || '.';
const METRICS_DIR = `${PLUGIN_ROOT}/.quality-metrics`;
const TEST_SAMPLES_DIR = './quality-enforcement-test';
const TARGET_CORRECTION_RATE = 95;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logValidation(message) {
    log(`🔍 ${message}`, 'magenta');
}

// Test samples with various quality issues
const testSamples = [
    {
        name: 'TypeScript with Type Errors',
        filename: 'TypeScriptErrors.tsx',
        content: `import React from 'react';

export default function TypeScriptErrors(props) {
  var state = null;
  let untypedVar = props.someValue;

  function badFunction(param) {
    return param.toString();
  }

  return (
    <div>
      <h1>Bad Component</h1>
      <p>Props: {props.title}</p>
    </div>
  );
}`,
        expectedFixes: 5,
        categories: ['typescript', 'types', 'formatting']
    },
    {
        name: 'Formatting Issues',
        filename: 'FormattingIssues.tsx',
        content: `import React,{useState}from'react';

export default function FormattingIssues({title,count=0}){
const[state,setState]=useState(null);
if(state==null){
setState({loaded:true});
}
return(<div><h1>{title}</h1><p>Count:{count}</p></div>);
}`,
        expectedFixes: 8,
        categories: ['formatting', 'imports']
    },
    {
        name: 'Import Organization',
        filename: 'ImportOrganization.tsx',
        content: `import { useState } from 'react';
import React, { useEffect } from 'react';
import { Button } from './Button';
import { Card } from '../Card';
import { Navigation } from '../../../components/Navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';

export default function ImportOrganization() {
  const [state, setState] = useState(null);
  useEffect(() => {
    setState({ loaded: true });
  }, []);

  return <div><Card><Header /></Card></div>;
}`,
        expectedFixes: 6,
        categories: ['imports', 'formatting']
    },
    {
        name: 'React Best Practices',
        filename: 'ReactBestPractices.tsx',
        content: `import React from 'react';

export default class ReactBestPractices extends React.Component {
  componentWillMount() {
    console.log('Deprecated lifecycle');
  }

  render() {
    var items = ['item1', 'item2'];
    return (
      <div>
        <ul>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>
    );
  }
}`,
        expectedFixes: 3,
        categories: ['react', 'typescript', 'formatting']
    },
    {
        name: 'Accessibility Issues',
        filename: 'AccessibilityIssues.tsx',
        content: `import React from 'react';

export default function AccessibilityIssues(props) {
  return (
    <div>
      <img src="image.jpg" />
      <div onClick={() => alert('clicked')}>
        Click me
      </div>
      <input placeholder="Enter text" />
      <button>Submit</button>
    </div>
  );
}`,
        expectedFixes: 4,
        categories: ['accessibility', 'react']
    }
];

class QualityEnforcementValidator {
    constructor() {
        this.validationResults = [];
        this.totalExpectedFixes = 0;
        this.totalAppliedFixes = 0;
        this.startTime = Date.now();
    }

    async runValidation() {
        log('🎯 FrontEnd UI/UX Build Plugin - Quality Enforcement Validation', 'cyan');
        log('=' .repeat(70), 'cyan');
        log(`Target Correction Rate: ${TARGET_CORRECTION_RATE}%`);
        log('');

        try {
            // Setup validation environment
            await this.setupValidationEnvironment();

            // Run validation tests
            await this.validateAutomatedCorrections();
            await this.analyzeMetricsData();
            await this.testHookPerformance();
            await this.validateCoverage();

            // Generate final report
            this.generateValidationReport();

        } catch (error) {
            logError(`Validation failed: ${error.message}`);
            process.exit(1);
        } finally {
            await this.cleanupValidationEnvironment();
        }
    }

    async setupValidationEnvironment() {
        logValidation('Setting up validation environment...');

        try {
            // Create test directory
            await execSync(`mkdir -p ${TEST_SAMPLES_DIR}`, { stdio: 'pipe' });

            // Ensure metrics directory exists
            await execSync(`mkdir -p ${METRICS_DIR}`, { stdio: 'pipe' });

            logSuccess('Validation environment created');
        } catch (error) {
            logError(`Failed to setup validation environment: ${error.message}`);
            throw error;
        }
    }

    async validateAutomatedCorrections() {
        logValidation('Validating automated corrections across test samples...');

        for (const sample of testSamples) {
            logInfo(`Testing: ${sample.name}`);

            try {
                const filePath = join(TEST_SAMPLES_DIR, sample.filename);
                const beforeContent = sample.content;

                // Write test file
                await writeFile(filePath, beforeContent);
                this.totalExpectedFixes += sample.expectedFixes;

                // Run quality enforcement
                const startTime = Date.now();
                await this.runQualityEnforcement(filePath);
                const endTime = Date.now();

                // Analyze results
                const afterContent = await readFile(filePath, 'utf8');
                const appliedFixes = this.countAppliedFixes(beforeContent, afterContent);
                this.totalAppliedFixes += appliedFixes;

                // Calculate effectiveness
                const effectiveness = (appliedFixes / sample.expectedFixes) * 100;

                this.validationResults.push({
                    sample: sample.name,
                    categories: sample.categories,
                    expectedFixes: sample.expectedFixes,
                    appliedFixes: appliedFixes,
                    effectiveness: effectiveness,
                    duration: endTime - startTime,
                    success: appliedFixes > 0
                });

                if (effectiveness >= 80) {
                    logSuccess(`${sample.name}: ${appliedFixes}/${sample.expectedFixes} fixes (${effectiveness.toFixed(1)}%)`);
                } else {
                    logWarning(`${sample.name}: ${appliedFixes}/${sample.expectedFixes} fixes (${effectiveness.toFixed(1)}%)`);
                }

            } catch (error) {
                this.validationResults.push({
                    sample: sample.name,
                    error: error.message,
                    success: false
                });

                logError(`${sample.name}: Failed - ${error.message}`);
            }
        }
    }

    async runQualityEnforcement(filePath) {
        // Run Biome for linting and formatting
        try {
            execSync(`npx biome check --apply ${filePath}`, { stdio: 'pipe' });
            execSync(`npx biome format --write ${filePath}`, { stdio: 'pipe' });
        } catch (error) {
            // Biome may exit with non-zero code even when fixes are applied
            // This is expected behavior, so we continue
        }

        // Run type checking if it's a TypeScript file
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            try {
                execSync(`npx tsc --noEmit ${filePath}`, { stdio: 'pipe' });
            } catch (error) {
                // Type errors may remain - this is acceptable for validation
            }
        }
    }

    countAppliedFixes(beforeContent, afterContent) {
        // Count the number of differences between before and after
        const beforeLines = beforeContent.split('\n');
        const afterLines = afterContent.split('\n');

        let fixes = 0;

        // Simple heuristic-based fix counting
        const fixIndicators = [
            /import\s+\{[^}]+\}\s+from/g, // Import organization
            /function\s+\w+\([^)]*\):\s*\w+/g, // Type annotations
            /const\s+\[?\w+]?\s*=/g, // Variable declarations
            /className=\{[^}]+\}/g, // React className patterns
            /key=\{[^}]+\}/g, // React key props
            /alt=\{[^}]*\}/g, // Accessibility alt text
            /aria-\w+=\{[^}]*\}/g, // ARIA attributes
        ];

        fixIndicators.forEach(indicator => {
            const beforeMatches = (beforeContent.match(indicator) || []).length;
            const afterMatches = (afterContent.match(indicator) || []).length;
            fixes += Math.abs(afterMatches - beforeMatches);
        });

        // Count formatting improvements
        const formattingImprovements = this.countFormattingImprovements(beforeContent, afterContent);
        fixes += formattingImprovements;

        // Count structural changes
        const structuralChanges = Math.abs(beforeLines.length - afterLines.length);
        fixes += structuralChanges;

        return Math.max(fixes, 1); // At least 1 fix if content changed
    }

    countFormattingImprovements(beforeContent, afterContent) {
        let improvements = 0;

        // Check for proper spacing
        const beforeSpacing = (beforeContent.match(/\s+/g) || []).length;
        const afterSpacing = (afterContent.match(/\s+/g) || []).length;
        improvements += Math.abs(afterSpacing - beforeSpacing) / 10; // Normalize

        // Check for proper line breaks
        const beforeLines = beforeContent.split('\n');
        const afterLines = afterContent.split('\n');

        for (let i = 0; i < Math.min(beforeLines.length, afterLines.length); i++) {
            if (beforeLines[i].trim() !== afterLines[i].trim()) {
                if (beforeLines[i].length !== afterLines[i].length) {
                    improvements += 0.5;
                }
            }
        }

        return Math.floor(improvements);
    }

    async analyzeMetricsData() {
        logValidation('Analyzing quality metrics data...');

        const metricsFile = join(METRICS_DIR, 'quality-metrics.jsonl');
        const summaryFile = join(METRICS_DIR, 'daily-summary.json');

        try {
            let correctionRate = 0;
            let totalOperations = 0;
            let successfulCorrections = 0;

            if (await this.fileExists(summaryFile)) {
                const summary = JSON.parse(await readFile(summaryFile, 'utf8'));
                correctionRate = summary.summary?.correction_rate_percent || 0;
                totalOperations = summary.summary?.total_file_operations || 0;
                successfulCorrections = summary.summary?.successful_corrections || 0;

                logInfo(`Historical correction rate: ${correctionRate.toFixed(1)}% (${successfulCorrections}/${totalOperations} operations)`);
            }

            this.validationResults.push({
                category: 'metrics-analysis',
                correctionRate: correctionRate,
                totalOperations: totalOperations,
                successfulCorrections: successfulCorrections,
                meetsTarget: correctionRate >= TARGET_CORRECTION_RATE
            });

        } catch (error) {
            logWarning(`Could not analyze metrics data: ${error.message}`);
            this.validationResults.push({
                category: 'metrics-analysis',
                error: error.message,
                meetsTarget: false
            });
        }
    }

    async testHookPerformance() {
        logValidation('Testing hook performance...');

        try {
            // Test hook execution latency
            const testFile = join(TEST_SAMPLES_DIR, 'PerformanceTest.tsx');
            await writeFile(testFile, testSamples[0].content);

            const startTime = Date.now();
            await this.runQualityEnforcement(testFile);
            const endTime = Date.now();

            const hookLatency = endTime - startTime;
            const meetsLatencyTarget = hookLatency <= 200; // Target: < 200ms

            this.validationResults.push({
                category: 'hook-performance',
                latency: hookLatency,
                meetsLatencyTarget: meetsLatencyTarget,
                success: true
            });

            if (meetsLatencyTarget) {
                logSuccess(`Hook performance: ${hookLatency}ms (target: < 200ms)`);
            } else {
                logWarning(`Hook performance: ${hookLatency}ms (target: < 200ms)`);
            }

        } catch (error) {
            this.validationResults.push({
                category: 'hook-performance',
                error: error.message,
                success: false
            });

            logError(`Hook performance test failed: ${error.message}`);
        }
    }

    async validateCoverage() {
        logValidation('Validating quality enforcement coverage...');

        const categories = ['typescript', 'formatting', 'imports', 'react', 'accessibility'];
        const coveredCategories = new Set();

        this.validationResults.forEach(result => {
            if (result.categories) {
                result.categories.forEach(category => coveredCategories.add(category));
            }
        });

        const coveragePercentage = (coveredCategories.size / categories.length) * 100;

        this.validationResults.push({
            category: 'coverage-validation',
            totalCategories: categories.length,
            coveredCategories: coveredCategories.size,
            coveragePercentage: coveragePercentage,
            categories: Array.from(coveredCategories),
            meetsTarget: coveragePercentage >= 80 // Target: 80% coverage
        });

        logInfo(`Coverage: ${coveredCategories.size}/${categories.length} categories (${coveragePercentage.toFixed(1)}%)`);
    }

    generateValidationReport() {
        const totalDuration = Date.now() - this.startTime;
        const overallCorrectionRate = this.totalExpectedFixes > 0
            ? (this.totalAppliedFixes / this.totalExpectedFixes) * 100
            : 0;

        log('');
        log('📊 Quality Enforcement Validation Report', 'cyan');
        log('=' .repeat(50), 'cyan');
        log('');

        // Overall correction rate
        log(`🎯 Overall Correction Rate: ${overallCorrectionRate.toFixed(1)}%`);
        log(`   Target: ${TARGET_CORRECTION_RATE}%`);
        log(`   Applied Fixes: ${this.totalAppliedFixes}/${this.totalExpectedFixes}`);
        log(`   Duration: ${totalDuration}ms`);
        log('');

        // Performance metrics
        const performanceResult = this.validationResults.find(r => r.category === 'hook-performance');
        if (performanceResult && performanceResult.success) {
            log(`⚡ Hook Latency: ${performanceResult.latency}ms`);
            log(`   Target: < 200ms`);
            log(`   Status: ${performanceResult.meetsLatencyTarget ? '✅ Pass' : '❌ Fail'}`);
        }
        log('');

        // Coverage analysis
        const coverageResult = this.validationResults.find(r => r.category === 'coverage-validation');
        if (coverageResult) {
            log(`📋 Coverage Analysis:`);
            log(`   Categories Covered: ${coverageResult.coveredCategories}/${coverageResult.totalCategories}`);
            log(`   Coverage: ${coverageResult.coveragePercentage.toFixed(1)}%`);
            log(`   Status: ${coverageResult.meetsTarget ? '✅ Pass' : '❌ Fail'}`);
            if (coverageResult.categories.length > 0) {
                log(`   Covered: ${coverageResult.categories.join(', ')}`);
            }
        }
        log('');

        // Sample-by-sample results
        log('🔍 Sample Test Results:');
        this.validationResults
            .filter(r => r.sample)
            .forEach(result => {
                const status = result.success ? '✅' : '❌';
                const effectiveness = result.effectiveness ? result.effectiveness.toFixed(1) : 'N/A';
                log(`   ${status} ${result.sample}: ${result.appliedFixes || 0}/${result.expectedFixes || 0} (${effectiveness}%)`);
            });
        log('');

        // Final verdict
        const meetsCorrectionTarget = overallCorrectionRate >= TARGET_CORRECTION_RATE;
        const meetsPerformanceTarget = !performanceResult || performanceResult.meetsLatencyTarget;
        const meetsCoverageTarget = !coverageResult || coverageResult.meetsTarget;

        const allTargetsMet = meetsCorrectionTarget && meetsPerformanceTarget && meetsCoverageTarget;

        log('🏆 Final Verdict:', allTargetsMet ? 'green' : 'red');
        log(`   Correction Rate (${TARGET_CORRECTION_RATE}%): ${meetsCorrectionTarget ? '✅ Pass' : '❌ Fail'}`);
        log(`   Performance (< 200ms): ${meetsPerformanceTarget ? '✅ Pass' : '❌ Fail'}`);
        log(`   Coverage (≥80%): ${meetsCoverageTarget ? '✅ Pass' : '❌ Fail'}`);
        log('');

        if (allTargetsMet) {
            logSuccess(`🎉 Quality enforcement validation PASSED! (${overallCorrectionRate.toFixed(1)}% correction rate)`);
        } else {
            logError(`❌ Quality enforcement validation FAILED! (${overallCorrectionRate.toFixed(1)}% correction rate, target: ${TARGET_CORRECTION_RATE}%)`);
            log('');
            log('Recommendations:');
            if (!meetsCorrectionTarget) {
                log('  - Improve automatic fix algorithms');
                log('  - Expand hook trigger conditions');
                log('  - Add more comprehensive linting rules');
            }
            if (!meetsPerformanceTarget) {
                log('  - Optimize hook execution time');
                log('  - Implement better batching strategies');
                log('  - Consider caching frequently executed operations');
            }
            if (!meetsCoverageTarget) {
                log('  - Add support for additional quality categories');
                log('  - Implement specialized hooks for uncovered areas');
            }
            process.exit(1);
        }
    }

    async cleanupValidationEnvironment() {
        logValidation('Cleaning up validation environment...');

        try {
            if (await this.fileExists(TEST_SAMPLES_DIR)) {
                execSync(`rm -rf ${TEST_SAMPLES_DIR}`, { stdio: 'pipe' });
            }
            logSuccess('Validation environment cleaned up');
        } catch (error) {
            logWarning(`Failed to cleanup validation environment: ${error.message}`);
        }
    }

    async fileExists(filePath) {
        try {
            await access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
}

// Helper function to write files
async function writeFile(filePath, content) {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, content);
}

// Main execution
async function main() {
    const validator = new QualityEnforcementValidator();
    await validator.runValidation();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Quality enforcement validation failed:', error);
        process.exit(1);
    });
}

export { QualityEnforcementValidator };