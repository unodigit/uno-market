#!/usr/bin/env node

/**
 * Validate plugin features work identically from marketplace installation
 * Part of User Story 4: Marketplace Distribution
 */

import { readFile, writeFile, access, constants, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Configuration
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const VALIDATION_DIR = join(PLUGIN_ROOT, '.validation-marketplace');
const ORIGINAL_PLUGIN_DIR = join(PLUGIN_ROOT, 'ui-ux-build-plugin');
const MARKETPLACE_PLUGIN_DIR = join(VALIDATION_DIR, 'marketplace-plugin');

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

function logCompare(message) {
    log(`🔄 ${message}`, 'cyan');
}

/**
 * Marketplace Feature Validator class
 */
class MarketplaceFeatureValidator {
    constructor(options = {}) {
        this.pluginRoot = PLUGIN_ROOT;
        this.validationDir = VALIDATION_DIR;
        this.originalPluginDir = ORIGINAL_PLUGIN_DIR;
        this.marketplacePluginDir = MARKETPLACE_PLUGIN_DIR;
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.validationResults = [];
        this.featureTests = [];
    }

    /**
     * Run complete marketplace feature validation
     */
    async runFeatureValidation() {
        logValidation('FrontEnd UI/UX Build Plugin - Marketplace Feature Validation');
        log('=' .repeat(60));

        try {
            // Setup validation environment
            await this.setupValidationEnvironment();

            // Phase 1: Feature consistency validation
            await this.validateFeatureConsistency();

            // Phase 2: Command parity validation
            await this.validateCommandParity();

            // Phase 3: Agent functionality parity
            await this.validateAgentParity();

            // Phase 4: Hook behavior consistency
            await this.validateHookConsistency();

            // Phase 5: Skill execution parity
            await this.validateSkillParity();

            // Phase 6: Integration scenario validation
            await this.validateIntegrationScenarios();

            // Phase 7: Performance parity validation
            await this.validatePerformanceParity();

            // Generate validation report
            this.generateValidationReport();

        } catch (error) {
            logError(`Feature validation failed: ${error.message}`);
            throw error;
        } finally {
            // Cleanup validation environment
            await this.cleanupValidationEnvironment();
        }
    }

    /**
     * Setup validation environment
     */
    async setupValidationEnvironment() {
        logInfo('Setting up validation environment...');

        // Create validation directory
        await mkdir(this.validationDir, { recursive: true });
        await mkdir(this.marketplacePluginDir, { recursive: true });

        // Simulate marketplace installation
        if (this.dryRun) {
            logInfo('[DRY RUN] Would simulate marketplace installation');
        } else {
            await this.simulateMarketplaceInstallation();
        }

        logSuccess('Validation environment setup completed');
    }

    /**
     * Simulate marketplace installation
     */
    async simulateMarketplaceInstallation() {
        logCompare('Simulating marketplace plugin installation...');

        // Copy original plugin files to simulate marketplace installation
        const filesToCopy = [
            '.claude-plugin/plugin.json',
            '.claude-plugin/marketplace.json',
            '.claude-plugin/hooks/hooks.json',
            '.claude-plugin/version.json',
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

        for (const file of filesToCopy) {
            const sourcePath = join(this.originalPluginDir, file);
            const destPath = join(this.marketplacePluginDir, file);

            try {
                const destDir = dirname(destPath);
                await mkdir(destDir, { recursive: true });
                const content = await readFile(sourcePath, 'utf8');
                await writeFile(destPath, content);
            } catch (error) {
                logWarning(`Could not copy ${file}: ${error.message}`);
            }
        }

        logCompare('Marketplace installation simulation completed');
    }

    /**
     * Validate feature consistency
     */
    async validateFeatureConsistency() {
        logValidation('Validating feature consistency...');

        const consistencyTests = [
            {
                name: 'Plugin Manifest Consistency',
                test: () => this.validatePluginManifestConsistency()
            },
            {
                name: 'Capabilities Consistency',
                test: () => this.validateCapabilitiesConsistency()
            },
            {
                name: 'Directory Structure Consistency',
                test: () => this.validateDirectoryStructureConsistency()
            },
            {
                name: 'Version Consistency',
                test: () => this.validateVersionConsistency()
            }
        ];

        for (const test of consistencyTests) {
            try {
                const result = await test.test();
                this.addValidationResult(test.name, true, result);
                logSuccess(`✓ ${test.name}`);
            } catch (error) {
                this.addValidationResult(test.name, false, error.message);
                logError(`✗ ${test.name}: ${error.message}`);
            }
        }
    }

    /**
     * Validate plugin manifest consistency
     */
    async validatePluginManifestConsistency() {
        const originalManifest = join(this.originalPluginDir, '.claude-plugin/plugin.json');
        const marketplaceManifest = join(this.marketplacePluginDir, '.claude-plugin/plugin.json');

        const originalData = JSON.parse(await readFile(originalManifest, 'utf8'));
        const marketplaceData = JSON.parse(await readFile(marketplaceManifest, 'utf8'));

        const criticalFields = ['name', 'version', 'description', 'capabilities'];
        const inconsistencies = [];

        for (const field of criticalFields) {
            if (JSON.stringify(originalData[field]) !== JSON.stringify(marketplaceData[field])) {
                inconsistencies.push(field);
            }
        }

        if (inconsistencies.length > 0) {
            throw new Error(`Plugin manifest inconsistencies in: ${inconsistencies.join(', ')}`);
        }

        return 'Plugin manifests are consistent';
    }

    /**
     * Validate capabilities consistency
     */
    async validateCapabilitiesConsistency() {
        const originalManifest = join(this.originalPluginDir, '.claude-plugin/plugin.json');
        const marketplaceManifest = join(this.marketplacePluginDir, '.claude-plugin/plugin.json');

        const originalData = JSON.parse(await readFile(originalManifest, 'utf8'));
        const marketplaceData = JSON.parse(await readFile(marketplaceManifest, 'utf8'));

        const originalCapabilities = new Set(originalData.capabilities || []);
        const marketplaceCapabilities = new Set(marketplaceData.capabilities || []);

        const missingCapabilities = [...originalCapabilities].filter(cap => !marketplaceCapabilities.has(cap));
        const extraCapabilities = [...marketplaceCapabilities].filter(cap => !originalCapabilities.has(cap));

        if (missingCapabilities.length > 0 || extraCapabilities.length > 0) {
            throw new Error(`Capability mismatch. Missing: [${missingCapabilities.join(', ')}], Extra: [${extraCapabilities.join(', ')}]`);
        }

        return 'Capabilities are consistent';
    }

    /**
     * Validate directory structure consistency
     */
    async validateDirectoryStructureConsistency() {
        const requiredDirectories = ['commands', 'agents', 'skills', 'hooks', 'scripts'];

        for (const dir of requiredDirectories) {
            const originalPath = join(this.originalPluginDir, dir);
            const marketplacePath = join(this.marketplacePluginDir, dir);

            try {
                await access(originalPath, constants.R_OK);
                await access(marketplacePath, constants.R_OK);
            } catch {
                throw new Error(`Directory ${dir} not found in one of the installations`);
            }
        }

        return 'Directory structures are consistent';
    }

    /**
     * Validate version consistency
     */
    async validateVersionConsistency() {
        const originalVersion = join(this.originalPluginDir, '.claude-plugin/version.json');
        const marketplaceVersion = join(this.marketplacePluginDir, '.claude-plugin/version.json');

        const originalData = JSON.parse(await readFile(originalVersion, 'utf8'));
        const marketplaceData = JSON.parse(await readFile(marketplaceVersion, 'utf8'));

        if (originalData.current !== marketplaceData.current) {
            throw new Error(`Version mismatch: ${originalData.current} vs ${marketplaceData.current}`);
        }

        return `Version consistency validated: ${originalData.current}`;
    }

    /**
     * Validate command parity
     */
    async validateCommandParity() {
        logValidation('Validating command parity...');

        const commands = ['scaffold-component', 'lint-fix-all', 'deploy-preview'];

        for (const command of commands) {
            try {
                const result = await this.validateCommand(command);
                this.addValidationResult(`Command: ${command}`, true, result);
                logSuccess(`✓ Command ${command} parity validated`);
            } catch (error) {
                this.addValidationResult(`Command: ${command}`, false, error.message);
                logError(`✗ Command ${command}: ${error.message}`);
            }
        }
    }

    /**
     * Validate individual command
     */
    async validateCommand(commandName) {
        const originalCommand = join(this.originalPluginDir, 'commands', `${commandName}.md`);
        const marketplaceCommand = join(this.marketplacePluginDir, 'commands', `${commandName}.md`);

        const originalContent = await readFile(originalCommand, 'utf8');
        const marketplaceContent = await readFile(marketplaceCommand, 'utf8');

        // Compare key sections
        const sections = ['description', 'USAGE:', 'EXAMPLES:'];
        const differences = [];

        for (const section of sections) {
            const originalHasSection = originalContent.includes(section);
            const marketplaceHasSection = marketplaceContent.includes(section);

            if (originalHasSection !== marketplaceHasSection) {
                differences.push(`Section ${section} mismatch`);
            }
        }

        if (differences.length > 0) {
            throw new Error(`Command differences: ${differences.join(', ')}`);
        }

        return `Command ${commandName} parity validated`;
    }

    /**
     * Validate agent parity
     */
    async validateAgentParity() {
        logValidation('Validating agent parity...');

        const agents = ['ui-architect', 'tailwind-stylist', 'vitest-tester', 'biome-linter', 'monorepo-orchestrator'];

        for (const agent of agents) {
            try {
                const result = await this.validateAgent(agent);
                this.addValidationResult(`Agent: ${agent}`, true, result);
                logSuccess(`✓ Agent ${agent} parity validated`);
            } catch (error) {
                this.addValidationResult(`Agent: ${agent}`, false, error.message);
                logError(`✗ Agent ${agent}: ${error.message}`);
            }
        }
    }

    /**
     * Validate individual agent
     */
    async validateAgent(agentName) {
        const originalAgent = join(this.originalPluginDir, 'agents', `${agentName}.md`);
        const marketplaceAgent = join(this.marketplacePluginDir, 'agents', `${agentName}.md`);

        const originalContent = await readFile(originalAgent, 'utf8');
        const marketplaceContent = await readFile(marketplaceAgent, 'utf8');

        // Compare critical sections
        const criticalSections = ['description:', 'model:', '## Role', '## Capabilities'];
        const differences = [];

        for (const section of criticalSections) {
            const originalHasSection = originalContent.includes(section);
            const marketplaceHasSection = marketplaceContent.includes(section);

            if (originalHasSection !== marketplaceHasSection) {
                differences.push(`Section ${section} mismatch`);
            }
        }

        if (differences.length > 0) {
            throw new Error(`Agent differences: ${differences.join(', ')}`);
        }

        return `Agent ${agentName} parity validated`;
    }

    /**
     * Validate hook consistency
     */
    async validateHookConsistency() {
        logValidation('Validating hook consistency...');

        const originalHooks = join(this.originalPluginDir, 'hooks', 'hooks.json');
        const marketplaceHooks = join(this.marketplacePluginDir, 'hooks', 'hooks.json');

        const originalConfig = JSON.parse(await readFile(originalHooks, 'utf8'));
        const marketplaceConfig = JSON.parse(await readFile(marketplaceHooks, 'utf8'));

        // Compare hook configurations
        const originalHookIds = new Set(originalConfig.hooks?.map(h => h.id) || []);
        const marketplaceHookIds = new Set(marketplaceConfig.hooks?.map(h => h.id) || []);

        const missingHooks = [...originalHookIds].filter(id => !marketplaceHookIds.has(id));
        const extraHooks = [...marketplaceHookIds].filter(id => !originalHookIds.has(id));

        if (missingHooks.length > 0 || extraHooks.length > 0) {
            throw new Error(`Hook configuration mismatch. Missing: [${missingHooks.join(', ')}], Extra: [${extraHooks.join(', ')}]`);
        }

        // Validate individual hook configurations
        for (const hook of originalConfig.hooks || []) {
            const marketplaceHook = marketplaceConfig.hooks?.find(h => h.id === hook.id);

            if (!marketplaceHook) {
                throw new Error(`Hook ${hook.id} not found in marketplace installation`);
            }

            // Compare critical hook properties
            const criticalProps = ['name', 'description', 'enabled', 'priority'];
            for (const prop of criticalProps) {
                if (hook[prop] !== marketplaceHook[prop]) {
                    throw new Error(`Hook ${hook.id} property ${prop} mismatch`);
                }
            }
        }

        return 'Hook configurations are consistent';
    }

    /**
     * Validate skill parity
     */
    async validateSkillParity() {
        logValidation('Validating skill parity...');

        const skills = ['type-enforcer'];

        for (const skill of skills) {
            try {
                const result = await this.validateSkill(skill);
                this.addValidationResult(`Skill: ${skill}`, true, result);
                logSuccess(`✓ Skill ${skill} parity validated`);
            } catch (error) {
                this.addValidationResult(`Skill: ${skill}`, false, error.message);
                logError(`✗ Skill ${skill}: ${error.message}`);
            }
        }
    }

    /**
     * Validate individual skill
     */
    async validateSkill(skillName) {
        const originalSkill = join(this.originalPluginDir, 'skills', `${skillName}.md`);
        const marketplaceSkill = join(this.marketplacePluginDir, 'skills', `${skillName}.md`);

        const originalContent = await readFile(originalSkill, 'utf8');
        const marketplaceContent = await readFile(marketplaceSkill, 'utf8');

        // Compare critical sections
        const criticalSections = ['description:', 'model:', '## Role'];
        const differences = [];

        for (const section of criticalSections) {
            const originalHasSection = originalContent.includes(section);
            const marketplaceHasSection = marketplaceContent.includes(section);

            if (originalHasSection !== marketplaceHasSection) {
                differences.push(`Section ${section} mismatch`);
            }
        }

        if (differences.length > 0) {
            throw new Error(`Skill differences: ${differences.join(', ')}`);
        }

        return `Skill ${skillName} parity validated`;
    }

    /**
     * Validate integration scenarios
     */
    async validateIntegrationScenarios() {
        logValidation('Validating integration scenarios...');

        const scenarios = [
            {
                name: 'Component Scaffolding Scenario',
                test: () => this.validateComponentScaffoldingScenario()
            },
            {
                name: 'Quality Enforcement Scenario',
                test: () => this.validateQualityEnforcementScenario()
            },
            {
                name: 'Plugin Installation Scenario',
                test: () => this.validatePluginInstallationScenario()
            }
        ];

        for (const scenario of scenarios) {
            try {
                const result = await scenario.test();
                this.addValidationResult(`Scenario: ${scenario.name}`, true, result);
                logSuccess(`✓ ${scenario.name}`);
            } catch (error) {
                this.addValidationResult(`Scenario: ${scenario.name}`, false, error.message);
                logError(`✗ ${scenario.name}: ${error.message}`);
            }
        }
    }

    /**
     * Validate component scaffolding scenario
     */
    async validateComponentScaffoldingScenario() {
        // Simulate component scaffolding by checking command and agent availability
        const scaffoldCommand = join(this.originalPluginDir, 'commands', 'scaffold-component.md');
        const uiArchitectAgent = join(this.originalPluginDir, 'agents', 'ui-architect.md');

        await access(scaffoldCommand, constants.R_OK);
        await access(uiArchitectAgent, constants.R_OK);

        // Check that the scenario would work identically in both installations
        const originalScaffold = await readFile(scaffoldCommand, 'utf8');
        const marketplaceScaffold = await readFile(
            join(this.marketplacePluginDir, 'commands', 'scaffold-component.md'),
            'utf8'
        );

        if (originalScaffold !== marketplaceScaffold) {
            throw new Error('Component scaffolding command differs between installations');
        }

        return 'Component scaffolding scenario validated';
    }

    /**
     * Validate quality enforcement scenario
     */
    async validateQualityEnforcementScenario() {
        // Check quality enforcement components
        const lintCommand = join(this.originalPluginDir, 'commands', 'lint-fix-all.md');
        const biomeAgent = join(this.originalPluginDir, 'agents', 'biome-linter.md');
        const typeSkill = join(this.originalPluginDir, 'skills', 'type-enforcer.md');
        const hooksConfig = join(this.originalPluginDir, 'hooks', 'hooks.json');

        await access(lintCommand, constants.R_OK);
        await access(biomeAgent, constants.R_OK);
        await access(typeSkill, constants.R_OK);
        await access(hooksConfig, constants.R_OK);

        // Verify that quality enforcement would work identically
        const hooksData = JSON.parse(await readFile(hooksConfig, 'utf8'));
        const qualityHooks = hooksData.hooks?.filter(h =>
            h.name.includes('Quality') || h.name.includes('Enforcement')
        ) || [];

        if (qualityHooks.length === 0) {
            throw new Error('No quality enforcement hooks found');
        }

        return `Quality enforcement scenario validated with ${qualityHooks.length} hooks`;
    }

    /**
     * Validate plugin installation scenario
     */
    async validatePluginInstallationScenario() {
        // Check installation script and validation
        const installScript = join(this.originalPluginDir, 'scripts', 'install.sh');
        const validationScript = join(this.originalPluginDir, 'scripts', 'validate-installation.sh');

        await access(installScript, constants.R_OK);
        await access(validationScript, constants.R_OK);

        // Verify installation components are present
        const marketplaceMetadata = join(this.originalPluginDir, '.claude-plugin/marketplace.json');
        await access(marketplaceMetadata, constants.R_OK);

        const metadata = JSON.parse(await readFile(marketplaceMetadata, 'utf8'));
        if (!metadata.installation || !metadata.installation.commands) {
            throw new Error('Installation commands not defined in marketplace metadata');
        }

        return 'Plugin installation scenario validated';
    }

    /**
     * Validate performance parity
     */
    async validatePerformanceParity() {
        logValidation('Validating performance parity...');

        const performanceMetrics = [
            {
                name: 'File Size Parity',
                test: () => this.validateFileSizeParity()
            },
            {
                name: 'Configuration Load Time',
                test: () => this.validateConfigurationLoadTime()
            },
            {
                name: 'Hook Configuration Complexity',
                test: () => this.validateHookComplexity()
            }
        ];

        for (const metric of performanceMetrics) {
            try {
                const result = await metric.test();
                this.addValidationResult(`Performance: ${metric.name}`, true, result);
                logSuccess(`✓ ${metric.name}`);
            } catch (error) {
                this.addValidationResult(`Performance: ${metric.name}`, false, error.message);
                logError(`✗ ${metric.name}: ${error.message}`);
            }
        }
    }

    /**
     * Validate file size parity
     */
    async validateFileSizeParity() {
        const filesToCompare = [
            '.claude-plugin/plugin.json',
            '.claude-plugin/marketplace.json',
            '.claude-plugin/hooks/hooks.json'
        ];

        for (const file of filesToCompare) {
            const originalFile = join(this.originalPluginDir, file);
            const marketplaceFile = join(this.marketplacePluginDir, file);

            const originalSize = (await readFile(originalFile)).length;
            const marketplaceSize = (await readFile(marketplaceFile)).length;

            if (Math.abs(originalSize - marketplaceSize) > 100) { // Allow small differences
                throw new Error(`File size difference for ${file}: ${originalSize} vs ${marketplaceSize}`);
            }
        }

        return 'File sizes are within acceptable tolerance';
    }

    /**
     * Validate configuration load time
     */
    async validateConfigurationLoadTime() {
        const startTime = process.hrtime.bigint();

        // Load configurations
        const pluginConfig = JSON.parse(await readFile(
            join(this.marketplacePluginDir, '.claude-plugin/plugin.json'),
            'utf8'
        ));
        const hooksConfig = JSON.parse(await readFile(
            join(this.marketplacePluginDir, '.claude-plugin/hooks/hooks.json'),
            'utf8'
        ));

        const endTime = process.hrtime.bigint();
        const loadTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Configuration loading should be fast (< 10ms)
        if (loadTime > 10) {
            throw new Error(`Configuration load time too slow: ${loadTime.toFixed(2)}ms`);
        }

        return `Configuration loaded in ${loadTime.toFixed(2)}ms`;
    }

    /**
     * Validate hook complexity
     */
    async validateHookComplexity() {
        const hooksConfig = JSON.parse(await readFile(
            join(this.marketplacePluginDir, '.claude-plugin/hooks/hooks.json'),
            'utf8'
        ));

        const totalHooks = hooksConfig.hooks?.length || 0;
        const totalActions = hooksConfig.hooks?.reduce((sum, hook) => sum + (hook.actions?.length || 0), 0) || 0;

        // Validate that complexity is reasonable
        if (totalHooks > 20) {
            throw new Error(`Too many hooks: ${totalHooks} (max 20 recommended)`);
        }

        if (totalActions > 100) {
            throw new Error(`Too many hook actions: ${totalActions} (max 100 recommended)`);
        }

        return `Hook complexity validated: ${totalHooks} hooks, ${totalActions} actions`;
    }

    /**
     * Add validation result
     */
    addValidationResult(testName, success, details = '') {
        this.validationResults.push({
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate validation report
     */
    generateValidationReport() {
        const totalTests = this.validationResults.length;
        const passedTests = this.validationResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

        logValidation('Validation Report Summary');
        log('=' .repeat(30));
        logInfo(`Total Tests: ${totalTests}`);
        logSuccess(`Passed: ${passedTests}`);
        if (failedTests > 0) {
            logError(`Failed: ${failedTests}`);
        }
        logInfo(`Success Rate: ${successRate}%`);

        if (failedTests > 0) {
            log('');
            logError('Failed Validations:');
            this.validationResults
                .filter(r => !r.success)
                .forEach(r => {
                    logError(`  ✗ ${r.test}: ${r.details}`);
                });
        }

        log('');
        if (successRate >= 95) {
            logSuccess('🎉 Marketplace feature validation PASSED!');
        } else {
            logError(`❌ Marketplace feature validation FAILED! (${successRate}% success rate)`);
            throw new Error(`Validation success rate ${successRate}% below threshold (95%)`);
        }
    }

    /**
     * Cleanup validation environment
     */
    async cleanupValidationEnvironment() {
        try {
            await rm(this.validationDir, { recursive: true, force: true });
            logInfo('Validation environment cleaned up');
        } catch (error) {
            logWarning(`Could not cleanup validation environment: ${error.message}`);
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
FrontEnd UI/UX Build Plugin - Marketplace Feature Validator

USAGE:
    node validate-marketplace-features.js [options]

OPTIONS:
    --dry-run          Simulate validation without actual comparisons
    --verbose          Show detailed validation output
    --help             Show this help message

EXAMPLES:
    node validate-marketplace-features.js
    node validate-marketplace-features.js --verbose
    node validate-marketplace-features.js --dry-run
`);
        process.exit(0);
    }

    const validator = new MarketplaceFeatureValidator(options);

    try {
        await validator.runFeatureValidation();
    } catch (error) {
        logError(`Feature validation failed: ${error.message}`);
        process.exit(1);
    }
}

// Export for use in other modules
export { MarketplaceFeatureValidator };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}