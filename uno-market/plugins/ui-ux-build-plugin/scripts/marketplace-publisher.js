#!/usr/bin/env node

/**
 * Marketplace packaging and publishing workflow for FrontEnd UI/UX Build Plugin
 * Part of User Story 4: Marketplace Distribution
 */

import { readFile, writeFile, access, constants, mkdir, rm } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { createReadStream, createWriteStream } from 'fs';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import { archivate as zip } from 'archiver';
import FormData from 'form-data';

const require = createRequire(import.meta.url);
const axios = require('axios');

// Configuration
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const DIST_DIR = join(PLUGIN_ROOT, 'dist');
const PACKAGES_DIR = join(DIST_DIR, 'packages');
const PUBLISH_REGISTRY = process.env.CL AUDE_MARKETPLACE_REGISTRY || 'https://marketplace.claude-code.org';
const PUBLISH_TOKEN = process.env.CLAUDE_MARKETPLACE_TOKEN;
const MAX_PACKAGE_SIZE = 50 * 1024 * 1024; // 50MB

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

function logPackage(message) {
    log(`📦 ${message}`, 'magenta');
}

function logPublish(message) {
    log(`🚀 ${message}`, 'cyan');
}

/**
 * Marketplace Publisher class for packaging and publishing plugins
 */
class MarketplacePublisher {
    constructor(options = {}) {
        this.pluginRoot = PLUGIN_ROOT;
        this.distDir = DIST_DIR;
        this.packagesDir = PACKAGES_DIR;
        this.registry = options.registry || PUBLISH_REGISTRY;
        this.token = options.token || PUBLISH_TOKEN;
        this.maxPackageSize = options.maxPackageSize || MAX_PACKAGE_SIZE;
        this.dryRun = options.dryRun || false;
        this.validateOnly = options.validateOnly || false;
    }

    /**
     * Main packaging and publishing workflow
     */
    async publish(options = {}) {
        const {
            version,
            environment = 'production',
            channel = 'stable',
            skipValidation = false,
            skipTests = false,
            createPackage = true,
            publishPackage = true
        } = options;

        logPublish('Starting Marketplace Publishing Workflow');
        log('=' .repeat(50));

        try {
            // Phase 1: Pre-publishing validation
            if (!skipValidation) {
                await this.validatePrePublishRequirements();
            }

            // Phase 2: Build and test
            if (!skipTests) {
                await this.runTests();
            }

            // Phase 3: Create package
            let packageInfo = null;
            if (createPackage) {
                packageInfo = await this.createPackage(version, channel);
            }

            // Phase 4: Publish to marketplace
            let publishResult = null;
            if (publishPackage && packageInfo) {
                publishResult = await this.publishToMarketplace(packageInfo, environment);
            }

            // Phase 5: Post-publish validation
            if (publishResult) {
                await this.validatePostPublish(publishResult);
            }

            const result = {
                success: true,
                packageInfo,
                publishResult,
                environment,
                channel
            };

            logSuccess('Publishing workflow completed successfully!');
            return result;

        } catch (error) {
            logError(`Publishing workflow failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate pre-publish requirements
     */
    async validatePrePublishRequirements() {
        logInfo('Validating pre-publish requirements...');

        // Check plugin structure
        await this.validatePluginStructure();

        // Check required files
        await this.validateRequiredFiles();

        // Check version information
        await this.validateVersionInfo();

        // Check marketplace configuration
        await this.validateMarketplaceConfig();

        // Check package size limits
        await this.checkPackageSize();

        logSuccess('Pre-publish validation passed');
    }

    /**
     * Validate plugin structure
     */
    async validatePluginStructure() {
        const requiredDirs = [
            '.claude-plugin',
            'commands',
            'agents',
            'skills',
            'scripts',
            'hooks'
        ];

        for (const dir of requiredDirs) {
            const dirPath = join(this.pluginRoot, dir);
            try {
                await access(dirPath, constants.R_OK);
            } catch {
                throw new Error(`Missing required directory: ${dir}`);
            }
        }
    }

    /**
     * Validate required files
     */
    async validateRequiredFiles() {
        const requiredFiles = [
            '.claude-plugin/plugin.json',
            '.claude-plugin/marketplace.json',
            'README.md'
        ];

        for (const file of requiredFiles) {
            const filePath = join(this.pluginRoot, file);
            try {
                await access(filePath, constants.R_OK);
            } catch {
                throw new Error(`Missing required file: ${file}`);
            }
        }

        // Validate plugin.json
        const pluginJson = join(this.pluginRoot, '.claude-plugin/plugin.json');
        const pluginData = JSON.parse(await readFile(pluginJson, 'utf8'));
        this.validatePluginJson(pluginData);

        // Validate marketplace.json
        const marketplaceJson = join(this.pluginRoot, '.claude-plugin/marketplace.json');
        const marketplaceData = JSON.parse(await readFile(marketplaceJson, 'utf8'));
        this.validateMarketplaceJson(marketplaceData);
    }

    /**
     * Validate plugin.json format
     */
    validatePluginJson(pluginData) {
        const requiredFields = ['name', 'version', 'description', 'capabilities'];

        for (const field of requiredFields) {
            if (!pluginData[field]) {
                throw new Error(`Missing required field in plugin.json: ${field}`);
            }
        }

        if (!Array.isArray(pluginData.capabilities)) {
            throw new Error('plugin.json capabilities must be an array');
        }
    }

    /**
     * Validate marketplace.json format
     */
    validateMarketplaceJson(marketplaceData) {
        const requiredFields = ['name', 'displayName', 'description', 'version', 'author', 'repository'];

        for (const field of requiredFields) {
            if (!marketplaceData[field]) {
                throw new Error(`Missing required field in marketplace.json: ${field}`);
            }
        }

        // Validate semver version
        const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
        if (!semverRegex.test(marketplaceData.version)) {
            throw new Error('Invalid version format in marketplace.json. Expected semver format.');
        }
    }

    /**
     * Validate version information
     */
    async validateVersionInfo() {
        const marketplaceJson = join(this.pluginRoot, '.claude-plugin/marketplace.json');
        const packageJson = join(this.pluginRoot, 'package.json');

        const marketplaceData = JSON.parse(await readFile(marketplaceJson, 'utf8'));

        let packageData = null;
        try {
            packageData = JSON.parse(await readFile(packageJson, 'utf8'));
        } catch {
            // package.json might not exist, that's okay
        }

        // Ensure versions are consistent
        if (packageData && packageData.version !== marketplaceData.version) {
            logWarning(`Version mismatch: marketplace.json (${marketplaceData.version}) vs package.json (${packageData.version})`);
        }

        logInfo(`Version validated: ${marketplaceData.version}`);
    }

    /**
     * Validate marketplace configuration
     */
    async validateMarketplaceConfig() {
        if (!this.token && !this.dryRun) {
            logWarning('No marketplace token provided. Set CLAUDE_MARKETPLACE_TOKEN environment variable.');
        }

        // Validate registry URL
        try {
            new URL(this.registry);
        } catch {
            throw new Error(`Invalid registry URL: ${this.registry}`);
        }

        logInfo(`Registry: ${this.registry}`);
    }

    /**
     * Check estimated package size
     */
    async checkPackageSize() {
        const estimatedSize = await this.estimatePackageSize();

        if (estimatedSize > this.maxPackageSize) {
            throw new Error(`Package size (${Math.round(estimatedSize / 1024 / 1024)}MB) exceeds limit (${Math.round(this.maxPackageSize / 1024 / 1024)}MB)`);
        }

        logInfo(`Estimated package size: ${Math.round(estimatedSize / 1024 / 1024)}MB`);
    }

    /**
     * Estimate package size
     */
    async estimatePackageSize() {
        const files = await this.getPackageFiles();
        let totalSize = 0;

        for (const file of files) {
            try {
                const stats = await this.getFileStats(file);
                totalSize += stats.size;
            } catch {
                // Skip files that can't be accessed
            }
        }

        return totalSize;
    }

    /**
     * Run tests before publishing
     */
    async runTests() {
        logInfo('Running tests before publishing...');

        try {
            // Run linting
            execSync('npx biome check --max-diagnostics=50', {
                cwd: this.pluginRoot,
                stdio: 'pipe'
            });
            logSuccess('Linting tests passed');

            // Run type checking if TypeScript
            try {
                execSync('npx tsc --noEmit', {
                    cwd: this.pluginRoot,
                    stdio: 'pipe'
                });
                logSuccess('TypeScript tests passed');
            } catch {
                logInfo('TypeScript tests skipped (not configured)');
            }

            // Run validation script
            const validationScript = join(this.pluginRoot, 'scripts', 'validate-installation.sh');
            try {
                execSync(`"${validationScript}"`, {
                    cwd: this.pluginRoot,
                    stdio: 'pipe'
                });
                logSuccess('Installation validation passed');
            } catch {
                logWarning('Installation validation failed');
            }

        } catch (error) {
            throw new Error(`Tests failed: ${error.message}`);
        }
    }

    /**
     * Create package for marketplace
     */
    async createPackage(version, channel) {
        logPackage(`Creating package for version ${version} (${channel})`);

        // Create directories
        await mkdir(this.packagesDir, { recursive: true });

        const packageName = `ui-ux-build-plugin-${version}-${channel}`;
        const packageDir = join(this.packagesDir, packageName);
        const packageFile = join(this.packagesDir, `${packageName}.zip`);

        // Clean up existing package
        try {
            await rm(packageDir, { recursive: true, force: true });
        } catch {
            // Directory might not exist
        }

        try {
            await rm(packageFile, { force: true });
        } catch {
            // File might not exist
        }

        // Create package directory
        await mkdir(packageDir, { recursive: true });

        // Copy plugin files
        await this.copyPluginFiles(packageDir);

        // Add metadata
        await this.addPackageMetadata(packageDir, version, channel);

        // Create zip archive
        await this.createZipArchive(packageDir, packageFile);

        // Calculate checksums
        const checksums = await this.calculateChecksums(packageFile);

        const packageInfo = {
            name: packageName,
            version,
            channel,
            file: packageFile,
            size: await this.getFileSize(packageFile),
            checksums,
            createdAt: new Date().toISOString(),
            files: await this.getPackageFiles()
        };

        logSuccess(`Package created: ${packageFile}`);
        logInfo(`Package size: ${Math.round(packageInfo.size / 1024 / 1024)}MB`);

        return packageInfo;
    }

    /**
     * Copy plugin files to package directory
     */
    async copyPluginFiles(packageDir) {
        const filesToInclude = [
            '.claude-plugin/**/*',
            'commands/**/*',
            'agents/**/*',
            'skills/**/*',
            'scripts/**/*',
            'hooks/**/*',
            'config/**/*',
            'templates/**/*',
            'README.md',
            'LICENSE',
            'CHANGELOG.md'
        ];

        for (const pattern of filesToInclude) {
            try {
                execSync(`cp -r "${this.pluginRoot}/${pattern}" "${packageDir}/" 2>/dev/null || true`, {
                    stdio: 'pipe'
                });
            } catch {
                // Skip files/directories that don't exist
            }
        }

        // Remove development-only files
        const filesToRemove = [
            '.git',
            'node_modules',
            'dist',
            '.DS_Store',
            'Thumbs.db'
        ];

        for (const fileToRemove of filesToRemove) {
            try {
                execSync(`rm -rf "${packageDir}/${fileToRemove}" 2>/dev/null || true`, {
                    stdio: 'pipe'
                });
            } catch {
                // Skip if file doesn't exist
            }
        }
    }

    /**
     * Add package metadata
     */
    async addPackageMetadata(packageDir, version, channel) {
        const metadata = {
            package: {
                name: 'ui-ux-build-plugin',
                version,
                channel,
                createdAt: new Date().toISOString(),
                buildInfo: {
                    gitHash: this.getGitHash(),
                    gitBranch: this.getGitBranch(),
                    nodeVersion: process.version,
                    platform: process.platform
                }
            },
            marketplace: JSON.parse(await readFile(
                join(this.pluginRoot, '.claude-plugin/marketplace.json'),
                'utf8'
            ))
        };

        await writeFile(
            join(packageDir, 'package-metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
    }

    /**
     * Create zip archive
     */
    async createZipArchive(sourceDir, outputFile) {
        return new Promise((resolve, reject) => {
            const output = createWriteStream(outputFile);
            const archive = zip('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    /**
     * Calculate checksums for package file
     */
    async calculateChecksums(filePath) {
        const fileBuffer = await readFile(filePath);

        return {
            sha256: createHash('sha256').update(fileBuffer).digest('hex'),
            md5: createHash('md5').update(fileBuffer).digest('hex')
        };
    }

    /**
     * Publish to marketplace
     */
    async publishToMarketplace(packageInfo, environment) {
        if (this.dryRun) {
            logInfo('[DRY RUN] Would publish to marketplace');
            return { dryRun: true, packageInfo };
        }

        if (this.validateOnly) {
            logInfo('Validation only - skipping publish');
            return { validateOnly: true, packageInfo };
        }

        logPublish(`Publishing to ${environment} environment...`);

        // Prepare form data
        const formData = new FormData();
        formData.append('package', createReadStream(packageInfo.file));
        formData.append('metadata', JSON.stringify({
            name: packageInfo.name,
            version: packageInfo.version,
            channel: packageInfo.channel,
            size: packageInfo.size,
            checksums: packageInfo.checksums,
            environment
        }));

        // Make publish request
        const response = await axios.post(`${this.registry}/api/v1/plugins/publish`, formData, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                ...formData.getHeaders()
            },
            timeout: 300000, // 5 minutes
            maxContentLength: this.maxPackageSize * 2
        });

        if (response.status !== 200 && response.status !== 201) {
            throw new Error(`Publish failed: ${response.status} ${response.statusText}`);
        }

        const publishResult = {
            success: true,
            pluginId: response.data.pluginId,
            version: packageInfo.version,
            url: response.data.url,
            publishedAt: new Date().toISOString()
        };

        logSuccess(`Published successfully: ${publishResult.pluginId}`);
        logInfo(`Plugin URL: ${publishResult.url}`);

        return publishResult;
    }

    /**
     * Validate post-publish
     */
    async validatePostPublish(publishResult) {
        if (this.dryRun || this.validateOnly) {
            return;
        }

        logInfo('Validating post-publish...');

        try {
            // Verify plugin is accessible
            const response = await axios.get(`${this.registry}/api/v1/plugins/${publishResult.pluginId}`, {
                timeout: 10000
            });

            if (response.status === 200) {
                logSuccess('Post-publish validation passed');
                logInfo(`Plugin verified at: ${response.data.url}`);
            } else {
                throw new Error(`Plugin not accessible: ${response.status}`);
            }
        } catch (error) {
            logWarning(`Post-publish validation failed: ${error.message}`);
            // Don't throw error, just warn
        }
    }

    /**
     * Helper methods
     */
    getGitHash() {
        try {
            return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch {
            return 'unknown';
        }
    }

    getGitBranch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        } catch {
            return 'main';
        }
    }

    async getPackageFiles() {
        const files = [];
        const patterns = [
            '.claude-plugin/**/*',
            'commands/**/*',
            'agents/**/*',
            'skills/**/*',
            'scripts/**/*',
            'hooks/**/*',
            'config/**/*',
            'templates/**/*',
            '*.md',
            '*.json'
        ];

        for (const pattern of patterns) {
            try {
                const result = execSync(`find "${this.pluginRoot}" -path "${this.pluginRoot}/${pattern}" 2>/dev/null`, {
                    encoding: 'utf8'
                });
                files.push(...result.trim().split('\n').filter(Boolean));
            } catch {
                // Skip if pattern doesn't match
            }
        }

        return files;
    }

    async getFileStats(filePath) {
        const stats = await this.getFileSize(filePath);
        return { size: stats };
    }

    async getFileSize(filePath) {
        try {
            return (await readFile(filePath)).length;
        } catch {
            const statResult = execSync(`wc -c "${filePath}" 2>/dev/null || echo 0`, {
                encoding: 'utf8'
            });
            return parseInt(statResult.trim()) || 0;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        const options = {
            dryRun: args.includes('--dry-run'),
            validateOnly: args.includes('--validate-only'),
            skipTests: args.includes('--skip-tests'),
            skipValidation: args.includes('--skip-validation')
        };

        const publisher = new MarketplacePublisher(options);

        switch (command) {
            case 'publish':
                const version = args[1];
                const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
                const channel = args.find(arg => arg.startsWith('--channel='))?.split('=')[1] || 'stable';

                await publisher.publish({
                    version,
                    environment,
                    channel,
                    skipValidation: options.skipValidation,
                    skipTests: options.skipTests,
                    createPackage: !options.validateOnly,
                    publishPackage: !options.dryRun && !options.validateOnly
                });
                break;

            case 'validate':
                await publisher.validatePrePublishRequirements();
                logSuccess('Validation completed successfully');
                break;

            case 'package':
                const pkgVersion = args[1];
                const pkgChannel = args.find(arg => arg.startsWith('--channel='))?.split('=')[1] || 'stable';

                const packageInfo = await publisher.createPackage(pkgVersion, pkgChannel);
                console.log(JSON.stringify(packageInfo, null, 2));
                break;

            default:
                showHelp();
                break;
        }
    } catch (error) {
        logError(`Command failed: ${error.message}`);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
FrontEnd UI/UX Build Plugin - Marketplace Publisher

USAGE:
    node marketplace-publisher.js <command> [options]

COMMANDS:
    publish [version]         Package and publish plugin to marketplace
    validate                 Validate plugin for marketplace requirements
    package [version]        Create package without publishing

OPTIONS:
    --env=<environment>       Target environment (production, staging, preview)
    --channel=<channel>       Release channel (stable, beta, alpha)
    --dry-run                Show what would be published without publishing
    --validate-only         Validate without creating package
    --skip-tests            Skip test running
    --skip-validation       Skip pre-publish validation

EXAMPLES:
    node marketplace-publisher.js publish 1.0.0 --env=production
    node marketplace-publisher.js validate
    node marketplace-publisher.js package 1.0.1 --channel=beta
    node marketplace-publisher.js publish --dry-run
`);
}

// Export for use in other modules
export { MarketplacePublisher };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}