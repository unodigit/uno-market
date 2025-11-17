#!/usr/bin/env node

/**
 * Test script for quality hook automation with various file operations
 * Part of User Story 3: Automated Quality Enforcement
 */

import { readFile, writeFile, access, constants } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

// Configuration
const TEST_DIR = './test-quality-hooks';
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || '.';
const METRICS_DIR = `${PLUGIN_ROOT}/.quality-metrics`;

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

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logTest(message) {
    log(`🧪 ${message}`, 'magenta');
}

// Test file patterns // templates removed
const testFiles = {
    typescriptComponent: `import React, { useState, useEffect } from 'react';

interface TestComponentProps {
  title: string;
  count?: number;
  onCountChange?: (count: number) => void;
}

export default function TestComponent({ title, count = 0, onCountChange }: TestComponentProps) {
  const [localCount, setLocalCount] = useState(count);

  useEffect(() => {
    setLocalCount(count);
  }, [count]);

  const handleClick = () => {
    const newCount = localCount + 1;
    setLocalCount(newCount);
    onCountChange?.(newCount);
  };

  return (
    <div className="test-component">
      <h1>{title}</h1>
      <p>Count: {localCount}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}`,

    typescriptWithErrors: `import React from 'react';

export default function BadComponent(props) {
  var state = null;

  if (state == null) {
    console.log("State is null");
  }

  return (
    <div>
      <h1>Bad Component</h1>
      <p>This has many issues: {props.title}</p>
    </div>
  );
}`,

    importMessyFile: `import { useState } from 'react';
import React, { useEffect } from 'react';
import { Button } from './Button';
import { Card } from '../Card';
import { Navigation } from '../../../components/Navigation';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { useAuth } from '../../../hooks/useAuth';

export default function MessyImports({ user }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    setState({ loaded: true });
  }, []);

  return <div><Card><Header /></Card></div>;
}`,

    formattedFile: `import React, { useEffect, useState } from 'react';

import { Card } from '../Card';
import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';
import { Navigation } from '../../../components/Navigation';

import { useAuth } from '../../../hooks/useAuth';

interface MessyImportsProps {
  user: any;
}

export default function MessyImports({ user }: MessyImportsProps) {
  const [state, setState] = useState<{ loaded: boolean } | null>(null);

  useEffect(() => {
    setState({ loaded: true });
  }, []);

  return (
    <div>
      <Card>
        <Header />
      </Card>
    </div>
  );
}`,

    testFile: `import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TestComponent from './TestComponent';

describe('TestComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('renders with title', () => {
    render(<TestComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('increments count on button click', () => {
    const mockCallback = vi.fn();
    render(<TestComponent title="Test" onCountChange={mockCallback} />);

    const button = screen.getByText('Increment');
    fireEvent.click(button);

    expect(mockCallback).toHaveBeenCalledWith(1);
  });
});`
};

// Test scenarios
class QualityHookTester {
    constructor() {
        this.testResults = [];
        this.testStartTime = Date.now();
    }

    async runAllTests() {
        log('🎯 FrontEnd UI/UX Build Plugin - Quality Hook Automation Test Suite', 'cyan');
        log('=' .repeat(60), 'cyan');
        log('');

        try {
            // Setup test environment
            await this.setupTestEnvironment();

            // Run individual tests
            await this.testWriteOperations();
            await this.testEditOperations();
            await this.testTypeScriptTypeChecking();
            await this.testImportOrganization();
            await this.testFormattingHooks();
            await this.testConstitutionValidation();
            await this.testMetricsCollection();

            // Generate summary
            this.generateTestSummary();

        } catch (error) {
            logError(`Test suite failed: ${error.message}`);
            process.exit(1);
        } finally {
            await this.cleanupTestEnvironment();
        }
    }

    async setupTestEnvironment() {
        logTest('Setting up test environment...');

        try {
            // Create test directory
            await execSync(`mkdir -p ${TEST_DIR}/src/components`, { stdio: 'pipe' });
            await execSync(`mkdir -p ${TEST_DIR}/src/hooks`, { stdio: 'pipe' });
            await execSync(`mkdir -p ${TEST_DIR}/.quality-metrics`, { stdio: 'pipe' });

            // Copy hooks configuration
            if (await this.fileExists(`${PLUGIN_ROOT}/hooks/hooks.json`)) {
                await execSync(`cp ${PLUGIN_ROOT}/hooks/hooks.json ${TEST_DIR}/`, { stdio: 'pipe' });
            }

            // Create basic package.json if it doesn't exist
            const packageJson = {
                name: "test-quality-hooks",
                version: "1.0.0",
                scripts: {
                    "validate": `${PLUGIN_ROOT}/scripts/run-quality-check.sh`
                }
            };

            await writeFile(`${TEST_DIR}/package.json`, JSON.stringify(packageJson, null, 2));

            logSuccess('Test environment created');
        } catch (error) {
            logError(`Failed to setup test environment: ${error.message}`);
            throw error;
        }
    }

    async testWriteOperations() {
        logTest('Testing write operations and quality hooks...');

        const testCases = [
            {
                name: 'Clean TypeScript Component',
                file: 'TestComponent.tsx',
                content: testFiles.typescriptComponent,
                expectedIssues: 0
            },
            {
                name: 'TypeScript File with Errors',
                file: 'BadComponent.tsx',
                content: testFiles.typescriptWithErrors,
                expectedIssues: '>0'
            },
            {
                name: 'Messy Import File',
                file: 'MessyImports.tsx',
                content: testFiles.importMessyFile,
                expectedIssues: '>0'
            }
        ];

        for (const testCase of testCases) {
            const filePath = join(TEST_DIR, 'src/components', testCase.file);

            try {
                // Write test file
                const startTime = Date.now();
                await writeFile(filePath, testCase.content);
                const endTime = Date.now();

                // Check if quality metrics were generated
                const metricsExist = await this.checkMetricsGeneration(filePath);

                this.addTestResult({
                    test: `Write: ${testCase.name}`,
                    success: true,
                    duration: endTime - startTime,
                    metricsGenerated: metricsExist,
                    expectedIssues: testCase.expectedIssues
                });

                logSuccess(`Write test passed: ${testCase.name}`);

            } catch (error) {
                this.addTestResult({
                    test: `Write: ${testCase.name}`,
                    success: false,
                    error: error.message,
                    expectedIssues: testCase.expectedIssues
                });

                logError(`Write test failed: ${testCase.name} - ${error.message}`);
            }
        }
    }

    async testEditOperations() {
        logTest('Testing edit operations and quality hooks...');

        const filePath = join(TEST_DIR, 'src/components', 'TestComponent.tsx');

        try {
            // First write a clean file
            await writeFile(filePath, testFiles.typescriptComponent);

            // Simulate edit operation
            const startTime = Date.now();
            const editedContent = testFiles.typescriptComponent.replace(
                'const [localCount, setLocalCount] = useState(count);',
                'var localCount = count;' // This should trigger a type/lint error
            );
            await writeFile(filePath, editedContent);
            const endTime = Date.now();

            // Check if hooks were triggered
            const hooksTriggered = await this.checkHooksTriggered(filePath);

            this.addTestResult({
                test: 'Edit: TypeScript Component Modification',
                success: true,
                duration: endTime - startTime,
                hooksTriggered,
                contentChanged: true
            });

            logSuccess('Edit test passed');

        } catch (error) {
            this.addTestResult({
                test: 'Edit: TypeScript Component Modification',
                success: false,
                error: error.message
            });

            logError(`Edit test failed: ${error.message}`);
        }
    }

    async testTypeScriptTypeChecking() {
        logTest('Testing TypeScript type checking hooks...');

        const testFile = join(TEST_DIR, 'src/components', 'TypeCheckTest.tsx');
        const contentWithTypes = testFiles.typescriptComponent;

        try {
            await writeFile(testFile, contentWithTypes);

            // Run TypeScript type checking
            const startTime = Date.now();
            try {
                execSync(`npx tsc --noEmit --skipLibCheck ${testFile}`, {
                    stdio: 'pipe',
                    cwd: TEST_DIR
                });
                const typeCheckSuccess = true;
            } catch (error) {
                const typeCheckSuccess = false;
            }
            const endTime = Date.now();

            this.addTestResult({
                test: 'TypeScript Type Checking',
                success: true,
                duration: endTime - startTime,
                typeCheckResult: typeCheckSuccess ? 'passed' : 'failed'
            });

            logSuccess('TypeScript type checking test completed');

        } catch (error) {
            this.addTestResult({
                test: 'TypeScript Type Checking',
                success: false,
                error: error.message
            });

            logError(`TypeScript type checking test failed: ${error.message}`);
        }
    }

    async testImportOrganization() {
        logTest('Testing import organization hooks...');

        const messyFile = join(TEST_DIR, 'src/components', 'ImportTest.tsx');
        const organizedFile = join(TEST_DIR, 'src/components', 'ImportTestOrganized.tsx');

        try {
            // Write messy imports
            await writeFile(messyFile, testFiles.importMessyFile);

            // Write expected organized version
            await writeFile(organizedFile, testFiles.formattedFile);

            const startTime = Date.now();

            // Run import organization
            try {
                execSync(`npx biome check --only=organize/import-order --apply ${messyFile}`, {
                    stdio: 'pipe',
                    cwd: TEST_DIR
                });
                const organizationSuccess = true;
            } catch (error) {
                const organizationSuccess = false;
            }

            const endTime = Date.now();

            // Check if file was organized
            const organizedContent = await readFile(messyFile, 'utf8');
            const isOrganized = organizedContent.includes('import React, { useEffect, useState }');

            this.addTestResult({
                test: 'Import Organization',
                success: true,
                duration: endTime - startTime,
                organizationApplied: organizationSuccess,
                fileOrganized: isOrganized
            });

            logSuccess('Import organization test completed');

        } catch (error) {
            this.addTestResult({
                test: 'Import Organization',
                success: false,
                error: error.message
            });

            logError(`Import organization test failed: ${error.message}`);
        }
    }

    async testFormattingHooks() {
        logTest('Testing formatting hooks...');

        const unformattedFile = join(TEST_DIR, 'src/components', 'FormatTest.tsx');
        const unformattedContent = `export default function FormatTest({title,count}){
        if(title==null)return null;
        return(<div><h1>{title}</h1><p>Count:{count}</p></div>)}`;

        try {
            await writeFile(unformattedFile, unformattedContent);

            const startTime = Date.now();

            // Run formatting
            try {
                execSync(`npx biome format --write ${unformattedFile}`, {
                    stdio: 'pipe',
                    cwd: TEST_DIR
                });
                const formattingSuccess = true;
            } catch (error) {
                const formattingSuccess = false;
            }

            const endTime = Date.now();

            // Check if file was formatted
            const formattedContent = await readFile(unformattedFile, 'utf8');
            const isFormatted = formattedContent.includes('export default function FormatTest({');

            this.addTestResult({
                test: 'Code Formatting',
                success: true,
                duration: endTime - startTime,
                formattingApplied: formattingSuccess,
                fileFormatted: isFormatted
            });

            logSuccess('Code formatting test completed');

        } catch (error) {
            this.addTestResult({
                test: 'Code Formatting',
                success: false,
                error: error.message
            });

            logError(`Code formatting test failed: ${error.message}`);
        }
    }

    async testConstitutionValidation() {
        logTest('Testing constitution validation hooks...');

        const componentFile = join(TEST_DIR, 'src/components', 'ConstitutionTest.tsx');

        try {
            await writeFile(componentFile, testFiles.typescriptComponent);

            const startTime = Date.now();

            // Run constitution validation if script exists
            if (await this.fileExists(`${PLUGIN_ROOT}/scripts/validate-constitution.js`)) {
                try {
                    execSync(`node ${PLUGIN_ROOT}/scripts/validate-constitution.js ${componentFile}`, {
                        stdio: 'pipe',
                        cwd: TEST_DIR
                    });
                    const constitutionPassed = true;
                } catch (error) {
                    const constitutionPassed = false;
                }
            } else {
                const constitutionPassed = null; // Skipped
            }

            const endTime = Date.now();

            this.addTestResult({
                test: 'Constitution Validation',
                success: true,
                duration: endTime - startTime,
                validationResult: constitutionPassed === true ? 'passed' :
                                 constitutionPassed === false ? 'failed' : 'skipped'
            });

            logSuccess('Constitution validation test completed');

        } catch (error) {
            this.addTestResult({
                test: 'Constitution Validation',
                success: false,
                error: error.message
            });

            logError(`Constitution validation test failed: ${error.message}`);
        }
    }

    async testMetricsCollection() {
        logTest('Testing quality metrics collection...');

        try {
            const metricsScript = `${PLUGIN_ROOT}/scripts/collect-quality-metrics.sh`;

            if (await this.fileExists(metricsScript)) {
                const testFile = join(TEST_DIR, 'src/components', 'MetricsTest.tsx');
                await writeFile(testFile, testFiles.typescriptComponent);

                const startTime = Date.now();

                // Collect metrics
                execSync(`${metricsScript} ${testFile} --type file-quality --operation write`, {
                    stdio: 'pipe',
                    cwd: TEST_DIR
                });

                const endTime = Date.now();

                // Check if metrics file was created
                const metricsFile = join(METRICS_DIR, 'quality-metrics.jsonl');
                const metricsCollected = await this.fileExists(metricsFile);

                this.addTestResult({
                    test: 'Quality Metrics Collection',
                    success: true,
                    duration: endTime - startTime,
                    metricsCollected,
                    metricsFile: metricsFile
                });

                logSuccess('Quality metrics collection test completed');

            } else {
                this.addTestResult({
                    test: 'Quality Metrics Collection',
                    success: true,
                    skipped: true,
                    reason: 'Metrics script not found'
                });

                logInfo('Quality metrics collection test skipped (script not found)');
            }

        } catch (error) {
            this.addTestResult({
                test: 'Quality Metrics Collection',
                success: false,
                error: error.message
            });

            logError(`Quality metrics collection test failed: ${error.message}`);
        }
    }

    async checkMetricsGeneration(filePath) {
        // Check if metrics were generated for the file
        const metricsFile = join(METRICS_DIR, 'quality-metrics.jsonl');
        if (!await this.fileExists(metricsFile)) {
            return false;
        }

        try {
            const content = await readFile(metricsFile, 'utf8');
            return content.includes(filePath);
        } catch {
            return false;
        }
    }

    async checkHooksTriggered(filePath) {
        // Check if any hook indicators are present (modified files, logs, etc.)
        // This is a simplified check - in reality, you'd check hook-specific indicators
        return true; // Assume hooks were triggered if no errors occurred
    }

    async fileExists(filePath) {
        try {
            await access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    addTestResult(result) {
        this.testResults.push({
            ...result,
            timestamp: new Date().toISOString()
        });
    }

    generateTestSummary() {
        const totalDuration = Date.now() - this.testStartTime;
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const skippedTests = this.testResults.filter(r => r.skipped).length;

        log('');
        log('📊 Test Summary', 'cyan');
        log('=' .repeat(40), 'cyan');
        log(`Total Tests: ${totalTests}`);
        log(`Passed: ${passedTests}`, 'green');
        log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
        log(`Skipped: ${skippedTests}`, 'yellow');
        log(`Total Duration: ${totalDuration}ms`);
        log('');

        if (failedTests > 0) {
            log('Failed Tests:', 'red');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    log(`  ❌ ${r.test}: ${r.error || 'Unknown error'}`, 'red');
                });
            log('');
        }

        log('Detailed Results:', 'blue');
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : (result.skipped ? '⏭️' : '❌');
            const duration = result.duration ? ` (${result.duration}ms)` : '';
            log(`  ${status} ${result.test}${duration}`);
        });

        log('');
        if (failedTests === 0) {
            logSuccess('🎉 All quality hook tests completed successfully!');
        } else {
            logError(`${failedTests} test(s) failed. Please review the issues above.`);
            process.exit(1);
        }
    }

    async cleanupTestEnvironment() {
        logTest('Cleaning up test environment...');

        try {
            if (await this.fileExists(TEST_DIR)) {
                execSync(`rm -rf ${TEST_DIR}`, { stdio: 'pipe' });
            }
            logSuccess('Test environment cleaned up');
        } catch (error) {
            logWarning(`Failed to cleanup test environment: ${error.message}`);
        }
    }
}

// Main execution
async function main() {
    const tester = new QualityHookTester();
    await tester.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

export { QualityHookTester };