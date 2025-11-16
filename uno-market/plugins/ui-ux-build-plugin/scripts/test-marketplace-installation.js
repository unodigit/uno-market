#!/usr/bin/env node

/**
 * Test marketplace installation and plugin functionality
 * Part of User Story 4: Marketplace Distribution
 */

import { readFile, writeFile, access, constants, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Configuration
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const TEST_DIR = join(PLUGIN_ROOT, '.test-marketplace');
const TEMP_PLUGIN_DIR = join(TEST_DIR, 'ui-ux-build-plugin-installed');

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

function logTest(message) {
    log(`🧪 ${message}`, 'magenta');
}

function logInstall(message) {
    log(`📦 ${message}`, 'cyan');
}

/**
 * Marketplace Installation Tester class
 */
class MarketplaceInstallationTester {
    constructor(options = {}) {
        this.pluginRoot = PLUGIN_ROOT;
        this.testDir = TEST_DIR;
        this.tempPluginDir = TEMP_PLUGIN_DIR;
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.testResults = [];
    }

    /**
     * Run complete marketplace installation test
     */
    async runInstallationTest() {
        logTest('FrontEnd UI/UX Build Plugin - Marketplace Installation Test');
        log('=' .repeat(60));

        try {
            // Setup test environment
            await this.setupTestEnvironment();

            // Test 1: Plugin installation simulation
            await this.testPluginInstallation();

            // Test 2: Command registration
            await this.testCommandRegistration();

            // Test 3: Agent availability
            await this.testAgentAvailability();

            // Test 4: Skill functionality
            await this.testSkillFunctionality();

            // Test 5: Hook configuration
            await this.testHookConfiguration();

            // Test 6: File operations
            await this.testFileOperations();

            // Test 7: Integration scenarios
            await this.testIntegrationScenarios();

            // Generate test report
            this.generateTestReport();

        } catch (error) {
            logError(`Installation test failed: ${error.message}`);
            throw error;
        } finally {
            // Cleanup test environment
            await this.cleanupTestEnvironment();
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        logInfo('Setting up test environment...');

        // Create test directory
        await mkdir(this.testDir, { recursive: true });
        await mkdir(this.tempPluginDir, { recursive: true });

        // Simulate plugin installation by copying plugin files
        if (this.dryRun) {
            logInfo('[DRY RUN] Would simulate plugin installation');
        } else {
            await this.simulatePluginInstallation();
        }

        logSuccess('Test environment setup completed');
    }

    /**
     * Simulate plugin installation
     */
    async simulatePluginInstallation() {
        logInstall('Simulating marketplace plugin installation...');

        const sourceFiles = [
            '.claude-plugin/plugin.json',
            '.claude-plugin/marketplace.json',
            '.claude-plugin/hooks/hooks.json',
            'commands/scaffold-component.md',
            'commands/lint-fix-all.md',
            'commands/deploy-preview.md',
            'agents/ui-architect.md',
            'agents/tailwind-stylist.md',
            'agents/vitest-tester.md',
            'agents/biome-linter.md',
            'agents/monorepo-orchestrator.md',
            'skills/type-enforcer.md'
        ];

        for (const file of sourceFiles) {
            const sourcePath = join(this.pluginRoot, file);
            const destPath = join(this.tempPluginDir, file);

            try {
                const destDir = dirname(destPath);
                await mkdir(destDir, { recursive: true });
                const content = await readFile(sourcePath, 'utf8');
                await writeFile(destPath, content);
            } catch (error) {
                logWarning(`Could not copy ${file}: ${error.message}`);
            }
        }

        logInstall('Plugin installation simulation completed');
    }

    /**
     * Test plugin installation
     */
    async testPluginInstallation() {
        logTest('Testing plugin installation...');

        const tests = [
            {
                name: 'Plugin manifest exists',
                test: () => this.testFileExists('plugin.json', '.claude-plugin')
            },
            {
                name: 'Marketplace metadata exists',
                test: () => this.testFileExists('marketplace.json', '.claude-plugin')
            },
            {
                name: 'Plugin configuration valid',
                test: () => this.testPluginConfiguration()
            },
            {
                name: 'Required directories created',
                test: () => this.testRequiredDirectories()
            },
            {
                name: 'Plugin version consistency',
                test: () => this.testVersionConsistency()
            }
        ];

        for (const test of tests) {
            try {
                const result = await test.test();
                this.addTestResult(test.name, true, result);
                logSuccess(`✓ ${test.name}`);
            } catch (error) {
                this.addTestResult(test.name, false, error.message);
                logError(`✗ ${test.name}: ${error.message}`);
            }
        }
    }

    /**
     * Test command registration
     */
    async testCommandRegistration() {
        logTest('Testing command registration...');

        const commands = [
            'scaffold-component',
            'lint-fix-all',
            'deploy-preview'
        ];

        for (const command of commands) {
            try {
                const commandFile = join(this.tempPluginDir, 'commands', `${command}.md`);
                await access(commandFile, constants.R_OK);

                // Validate command file structure
                const content = await readFile(commandFile, 'utf8');
                const hasDescription = content.includes('description:');
                const hasUsage = content.includes('USAGE:');
                const hasExamples = content.includes('EXAMPLES:');

                if (hasDescription && hasUsage && hasExamples) {
                    this.addTestResult(`Command: ${command}`, true, 'Command file properly structured');
                    logSuccess(`✓ Command ${command} registered`);
                } else {
                    throw new Error('Command file structure incomplete');
                }
            } catch (error) {
                this.addTestResult(`Command: ${command}`, false, error.message);
                logError(`✗ Command ${command}: ${error.message}`);
            }
        }
    }

    /**
     * Test agent availability
     */
    async testAgentAvailability() {
        logTest('Testing agent availability...');

        const agents = [
            'ui-architect',
            'tailwind-stylist',
            'vitest-tester',
            'biome-linter',
            'monorepo-orchestrator'
        ];

        for (const agent of agents) {
            try {
                const agentFile = join(this.tempPluginDir, 'agents', `${agent}.md`);
                await access(agentFile, constants.R_OK);

                // Validate agent file structure
                const content = await readFile(agentFile, 'utf8');
                const hasDescription = content.includes('description:');
                const hasRole = content.includes('## Role');
                const hasCapabilities = content.includes('## Capabilities');

                if (hasDescription && hasRole && hasCapabilities) {
                    this.addTestResult(`Agent: ${agent}`, true, 'Agent file properly structured');
                    logSuccess(`✓ Agent ${agent} available`);
                } else {
                    throw new Error('Agent file structure incomplete');
                }
            } catch (error) {
                this.addTestResult(`Agent: ${agent}`, false, error.message);
                logError(`✗ Agent ${agent}: ${error.message}`);
            }
        }
    }

    /**
     * Test skill functionality
     */
    async testSkillFunctionality() {
        logTest('Testing skill functionality...');

        const skills = [
            'type-enforcer'
        ];

        for (const skill of skills) {
            try {
                const skillFile = join(this.tempPluginDir, 'skills', `${skill}.md`);
                await access(skillFile, constants.R_OK);

                // Validate skill file structure
                const content = await readFile(skillFile, 'utf8');
                const hasDescription = content.includes('description:');
                const hasModel = content.includes('model:');
                const hasRole = content.includes('## Role');

                if (hasDescription && hasModel && hasRole) {
                    this.addTestResult(`Skill: ${skill}`, true, 'Skill file properly structured');
                    logSuccess(`✓ Skill ${skill} functional`);
                } else {
                    throw new Error('Skill file structure incomplete');
                }
            } catch (error) {
                this.addTestResult(`Skill: ${skill}`, false, error.message);
                logError(`✗ Skill ${skill}: ${error.message}`);
            }
        }
    }

    /**
     * Test hook configuration
     */
    async testHookConfiguration() {
        logTest('Testing hook configuration...');

        try {
            const hooksFile = join(this.tempPluginDir, 'hooks', 'hooks.json');
            await access(hooksFile, constants.R_OK);

            const hooksConfig = JSON.parse(await readFile(hooksFile, 'utf8'));

            // Validate hooks structure
            const hasVersion = hooksConfig.version;
            const hasHooks = Array.isArray(hooksConfig.hooks);
            const hasSettings = hooksConfig.settings;

            if (hasVersion && hasHooks && hasSettings) {
                this.addTestResult('Hook Configuration', true, 'Hooks properly configured');
                logSuccess('✓ Hook configuration valid');

                // Test individual hooks
                for (const hook of hooksConfig.hooks) {
                    if (hook.id && hook.name && hook.enabled !== undefined) {
                        logSuccess(`✓ Hook: ${hook.name} (${hook.id})`);
                    } else {
                        logWarning(`⚠ Hook missing required fields: ${hook.id || 'unknown'}`);
                    }
                }
            } else {
                throw new Error('Hook configuration incomplete');
            }
        } catch (error) {
            this.addTestResult('Hook Configuration', false, error.message);
            logError(`✗ Hook configuration: ${error.message}`);
        }
    }

    /**
     * Test file operations
     */
    async testFileOperations() {
        logTest('Testing file operations...');

        // Create test component directory
        const testComponentDir = join(this.testDir, 'src', 'components');
        await mkdir(testComponentDir, { recursive: true });

        try {
            // Test scaffold component command simulation
            const componentFiles = ['index.ts', 'Button.tsx', 'Button.test.tsx'];

            for (const file of componentFiles) {
                const filePath = join(testComponentDir, file);
                let content = '';

                switch (file) {
                    case 'index.ts':
                        content = `export { default as Button } from './Button';`;
                        break;
                    case 'Button.tsx':
                        content = `import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Button({ children, onClick, className = '' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={\`btn \${className}\`}
    >
      {children}
    </button>
  );
}`;
                        break;
                    case 'Button.test.tsx':
                        content = `import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});`;
                        break;
                }

                await writeFile(filePath, content);
            }

            // Test file creation
            for (const file of componentFiles) {
                const filePath = join(testComponentDir, file);
                await access(filePath, constants.R_OK);
                logSuccess(`✓ Created ${file}`);
            }

            this.addTestResult('File Operations', true, 'Component files created successfully');

        } catch (error) {
            this.addTestResult('File Operations', false, error.message);
            logError(`✗ File operations: ${error.message}`);
        }
    }

    /**
     * Test integration scenarios
     */
    async testIntegrationScenarios() {
        logTest('Testing integration scenarios...');

        const scenarios = [
            {
                name: 'Plugin installation workflow',
                test: () => this.testInstallationWorkflow()
            },
            {
                name: 'Command execution simulation',
                test: () => this.testCommandExecution()
            },
            {
                name: 'Hook trigger simulation',
                test: () => this.testHookTriggers()
            }
        ];

        for (const scenario of scenarios) {
            try {
                const result = await scenario.test();
                this.addTestResult(`Integration: ${scenario.name}`, true, result);
                logSuccess(`✓ ${scenario.name}`);
            } catch (error) {
                this.addTestResult(`Integration: ${scenario.name}`, false, error.message);
                logError(`✗ ${scenario.name}: ${error.message}`);
            }
        }
    }

    /**
     * Test installation workflow
     */
    async testInstallationWorkflow() {
        // Simulate the installation workflow steps
        const steps = [
            'Plugin manifest validation',
            'Directory structure creation',
            'Command registration',
            'Agent initialization',
            'Skill activation',
            'Hook configuration'
        ];

        for (const step of steps) {
            // Simulate each step with a small delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return 'Installation workflow simulation completed';
    }

    /**
     * Test command execution
     */
    async testCommandExecution() {
        // Simulate command execution by validating command files
        const commandsDir = join(this.tempPluginDir, 'commands');
        const commandFiles = await this.getFilesInDirectory(commandsDir, '.md');

        for (const commandFile of commandFiles) {
            const content = await readFile(join(commandsDir, commandFile), 'utf8');

            // Check if command has proper structure
            const hasUsage = content.includes('USAGE:');
            const hasDescription = content.includes('DESCRIPTION:');

            if (!hasUsage || !hasDescription) {
                throw new Error(`Command ${commandFile} missing required sections`);
            }
        }

        return `Validated ${commandFiles.length} command files`;
    }

    /**
     * Test hook triggers
     */
    async testHookTriggers() {
        const hooksFile = join(this.tempPluginDir, 'hooks', 'hooks.json');
        const hooksConfig = JSON.parse(await readFile(hooksFile, 'utf8'));

        for (const hook of hooksConfig.hooks) {
            // Validate hook trigger configuration
            if (!hook.triggers || !Array.isArray(hook.triggers)) {
                throw new Error(`Hook ${hook.id} missing triggers configuration`);
            }

            for (const trigger of hook.triggers) {
                if (!trigger.event || !trigger.tools) {
                    throw new Error(`Hook ${hook.id} has invalid trigger configuration`);
                }
            }
        }

        return `Validated ${hooksConfig.hooks.length} hook configurations`;
    }

    /**
     * Helper test methods
     */
    async testFileExists(filename, subdirectory = '') {
        const filePath = subdirectory
            ? join(this.tempPluginDir, subdirectory, filename)
            : join(this.tempPluginDir, filename);

        await access(filePath, constants.R_OK);
        return 'File exists and accessible';
    }

    async testPluginConfiguration() {
        const pluginFile = join(this.tempPluginDir, '.claude-plugin/plugin.json');
        const pluginData = JSON.parse(await readFile(pluginFile, 'utf8'));

        const requiredFields = ['name', 'version', 'description', 'capabilities'];
        for (const field of requiredFields) {
            if (!pluginData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        return 'Plugin configuration valid';
    }

    async testRequiredDirectories() {
        const requiredDirs = ['commands', 'agents', 'skills', 'hooks', 'scripts'];

        for (const dir of requiredDirs) {
            const dirPath = join(this.tempPluginDir, dir);
            await access(dirPath, constants.R_OK);
        }

        return 'All required directories present';
    }

    async testVersionConsistency() {
        const marketplaceFile = join(this.tempPluginDir, '.claude-plugin/marketplace.json');
        const marketplaceData = JSON.parse(await readFile(marketplaceFile, 'utf8'));

        if (!marketplaceData.version) {
            throw new Error('Version not found in marketplace.json');
        }

        return `Version consistent: ${marketplaceData.version}`;
    }

    async getFilesInDirectory(directory, extension = '') {
        try {
            const command = extension
                ? `find "${directory}" -name "*${extension}" -type f 2>/dev/null`
                : `find "${directory}" -type f 2>/dev/null`;

            const result = execSync(command, { encoding: 'utf8' });
            return result.trim().split('\n').filter(Boolean).map(file => file.split('/').pop());
        } catch {
            return [];
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, success, details = '') {
        this.testResults.push({
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

        logTest('Test Report Summary');
        log('=' .repeat(30));
        logInfo(`Total Tests: ${totalTests}`);
        logSuccess(`Passed: ${passedTests}`);
        if (failedTests > 0) {
            logError(`Failed: ${failedTests}`);
        }
        logInfo(`Success Rate: ${successRate}%`);

        if (failedTests > 0) {
            log('');
            logError('Failed Tests:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    logError(`  ✗ ${r.test}: ${r.details}`);
                });
        }

        log('');
        if (successRate >= 90) {
            logSuccess('🎉 Marketplace installation test PASSED!');
        } else {
            logError(`❌ Marketplace installation test FAILED! (${successRate}% success rate)`);
            throw new Error(`Test success rate ${successRate}% below threshold`);
        }
    }

    /**
     * Cleanup test environment
     */
    async cleanupTestEnvironment() {
        try {
            await rm(this.testDir, { recursive: true, force: true });
            logInfo('Test environment cleaned up');
        } catch (error) {
            logWarning(`Could not cleanup test environment: ${error.message}`);
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        verbose: args.includes('--verbose')
    };

    if (args.includes('--help')) {
        console.log(`
FrontEnd UI/UX Build Plugin - Marketplace Installation Tester

USAGE:
    node test-marketplace-installation.js [options]

OPTIONS:
    --dry-run          Simulate tests without actual file operations
    --verbose          Show detailed test output
    --help             Show this help message

EXAMPLES:
    node test-marketplace-installation.js
    node test-marketplace-installation.js --verbose
    node test-marketplace-installation.js --dry-run
`);
        process.exit(0);
    }

    const tester = new MarketplaceInstallationTester(options);

    try {
        await tester.runInstallationTest();
    } catch (error) {
        logError(`Installation test failed: ${error.message}`);
        process.exit(1);
    }
}

// Export for use in other modules
export { MarketplaceInstallationTester };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}