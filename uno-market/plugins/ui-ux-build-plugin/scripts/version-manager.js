#!/usr/bin/env node

/**
 * Version management and update handling for FrontEnd UI/UX Build Plugin
 * Part of User Story 4: Marketplace Distribution
 */

import { readFile, writeFile, access, constants } from 'fs/promises';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const semver = require('semver');

// Configuration
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
const VERSION_FILE = join(PLUGIN_ROOT, '.claude-plugin', 'version.json');
const MARKETPLACE_FILE = join(PLUGIN_ROOT, '.claude-plugin', 'marketplace.json');
const PACKAGE_FILE = join(PLUGIN_ROOT, 'package.json');
const CHANGELOG_FILE = join(PLUGIN_ROOT, 'CHANGELOG.md');
const VERSION_HISTORY_FILE = join(PLUGIN_ROOT, '.claude-plugin', 'version-history.json');

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

function logVersion(message) {
    log(`🏷️  ${message}`, 'magenta');
}

/**
 * Version Manager class for handling plugin versioning
 */
class VersionManager {
    constructor() {
        this.pluginRoot = PLUGIN_ROOT;
        this.versionFile = VERSION_FILE;
        this.marketplaceFile = MARKETPLACE_FILE;
        this.packageFile = PACKAGE_FILE;
        this.changelogFile = CHANGELOG_FILE;
        this.versionHistoryFile = VERSION_HISTORY_FILE;
    }

    /**
     * Get current version information
     */
    async getCurrentVersion() {
        try {
            // Try marketplace.json first
            const marketplaceData = await this.readJsonFile(this.marketplaceFile);
            if (marketplaceData.version) {
                return {
                    version: marketplaceData.version,
                    source: 'marketplace.json'
                };
            }

            // Fallback to package.json
            const packageData = await this.readJsonFile(this.packageFile);
            if (packageData.version) {
                return {
                    version: packageData.version,
                    source: 'package.json'
                };
            }

            // Try version.json
            const versionData = await this.readJsonFile(this.versionFile);
            if (versionData.current) {
                return {
                    version: versionData.current,
                    source: 'version.json'
                };
            }

            // Default version if none found
            return {
                version: '1.0.0',
                source: 'default'
            };
        } catch (error) {
            logWarning(`Could not read version info: ${error.message}`);
            return {
                version: '1.0.0',
                source: 'fallback'
            };
        }
    }

    /**
     * Generate new version based on type
     */
    generateVersion(currentVersion, type = 'patch') {
        if (!semver.valid(currentVersion)) {
            throw new Error(`Invalid version format: ${currentVersion}`);
        }

        return semver.inc(currentVersion, type);
    }

    /**
     * Create a preview version
     */
    createPreviewVersion(baseVersion, identifier = 'preview') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const shortHash = this.getGitShortHash();
        return `${baseVersion}-${identifier}.${timestamp}-${shortHash}`;
    }

    /**
     * Get git short hash
     */
    getGitShortHash() {
        try {
            return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        } catch {
            return 'local';
        }
    }

    /**
     * Update version across all files
     */
    async updateVersion(newVersion, options = {}) {
        const {
            updateMarketplace = true,
            updatePackage = true,
            updateVersionFile = true,
            createChangelogEntry = false,
            changelogMessage = '',
            prerelease = false
        } = options;

        logVersion(`Updating version to: ${newVersion}`);

        const oldVersion = await this.getCurrentVersion();
        const versionUpdate = {
            oldVersion: oldVersion.version,
            newVersion: newVersion,
            timestamp: new Date().toISOString(),
            changes: []
        };

        try {
            // Update marketplace.json
            if (updateMarketplace) {
                await this.updateMarketplaceVersion(newVersion);
                versionUpdate.changes.push('marketplace.json');
            }

            // Update package.json
            if (updatePackage) {
                await this.updatePackageVersion(newVersion);
                versionUpdate.changes.push('package.json');
            }

            // Update version.json
            if (updateVersionFile) {
                await this.updateVersionFile(newVersion, oldVersion);
                versionUpdate.changes.push('version.json');
            }

            // Create changelog entry
            if (createChangelogEntry) {
                await this.addChangelogEntry(oldVersion.version, newVersion, changelogMessage, prerelease);
                versionUpdate.changes.push('CHANGELOG.md');
            }

            // Update version history
            await this.updateVersionHistory(versionUpdate);

            logSuccess(`Version updated successfully: ${oldVersion.version} → ${newVersion}`);

            return versionUpdate;

        } catch (error) {
            logError(`Failed to update version: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update marketplace.json version
     */
    async updateMarketplaceVersion(newVersion) {
        const marketplaceData = await this.readJsonFile(this.marketplaceFile);
        marketplaceData.version = newVersion;
        marketplaceData.metadata.updatedAt = new Date().toISOString();
        await this.writeJsonFile(this.marketplaceFile, marketplaceData);
        logInfo(`Updated marketplace.json: ${newVersion}`);
    }

    /**
     * Update package.json version
     */
    async updatePackageVersion(newVersion) {
        const packageData = await this.readJsonFile(this.packageFile);
        packageData.version = newVersion;
        await this.writeJsonFile(this.packageFile, packageData);
        logInfo(`Updated package.json: ${newVersion}`);
    }

    /**
     * Update version.json with comprehensive version info
     */
    async updateVersionFile(newVersion, oldVersionInfo) {
        const versionData = {
            current: newVersion,
            previous: oldVersionInfo.version,
            updatedAt: new Date().toISOString(),
            build: {
                timestamp: new Date().toISOString(),
                gitHash: this.getGitShortHash(),
                gitBranch: this.getGitBranch(),
                nodeVersion: process.version,
                platform: process.platform
            },
            release: {
                type: this.getVersionType(oldVersionInfo.version, newVersion),
                channel: this.detectReleaseChannel(newVersion),
                stable: !this.isPrerelease(newVersion)
            }
        };

        await this.writeJsonFile(this.versionFile, versionData);
        logInfo(`Updated version.json: ${newVersion}`);
    }

    /**
     * Get git branch
     */
    getGitBranch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        } catch {
            return 'main';
        }
    }

    /**
     * Determine version type (major, minor, patch)
     */
    getVersionType(oldVersion, newVersion) {
        if (!semver.valid(oldVersion) || !semver.valid(newVersion)) {
            return 'unknown';
        }

        const oldParsed = semver.parse(oldVersion);
        const newParsed = semver.parse(newVersion);

        if (newParsed.major > oldParsed.major) return 'major';
        if (newParsed.minor > oldParsed.minor) return 'minor';
        if (newParsed.patch > oldParsed.patch) return 'patch';
        return 'prerelease';
    }

    /**
     * Detect release channel
     */
    detectReleaseChannel(version) {
        if (version.includes('alpha')) return 'alpha';
        if (version.includes('beta')) return 'beta';
        if (version.includes('rc')) return 'rc';
        if (version.includes('preview')) return 'preview';
        return 'stable';
    }

    /**
     * Check if version is prerelease
     */
    isPrerelease(version) {
        return semver.prerelease(version) !== null;
    }

    /**
     * Add entry to changelog
     */
    async addChangelogEntry(oldVersion, newVersion, message, prerelease = false) {
        const timestamp = new Date().toISOString().split('T')[0];
        const entry = `## [${newVersion}] - ${timestamp}

${message || `Version ${newVersion}`}

${prerelease ? '### Prerelease\nThis is a prerelease version for testing purposes.\n\n' : ''}### Changed
- Version bump from ${oldVersion} to ${newVersion}

`;

        try {
            if (await this.fileExists(this.changelogFile)) {
                const existingContent = await readFile(this.changelogFile, 'utf8');
                const newContent = entry + existingContent;
                await writeFile(this.changelogFile, newContent);
            } else {
                // Create new changelog
                const header = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
                await writeFile(this.changelogFile, header + entry);
            }

            logInfo(`Added changelog entry for ${newVersion}`);
        } catch (error) {
            logWarning(`Could not update changelog: ${error.message}`);
        }
    }

    /**
     * Update version history
     */
    async updateVersionHistory(versionUpdate) {
        let history = [];

        try {
            if (await this.fileExists(this.versionHistoryFile)) {
                history = await this.readJsonFile(this.versionHistoryFile);
            }
        } catch (error) {
            // Start with empty history if file doesn't exist or is invalid
        }

        history.push(versionUpdate);

        // Keep only last 50 version updates
        if (history.length > 50) {
            history = history.slice(-50);
        }

        await this.writeJsonFile(this.versionHistoryFile, history);
        logInfo(`Updated version history (${history.length} entries)`);
    }

    /**
     * Get version history
     */
    async getVersionHistory(limit = 10) {
        try {
            if (await this.fileExists(this.versionHistoryFile)) {
                const history = await this.readJsonFile(this.versionHistoryFile);
                return history.slice(-limit);
            }
        } catch (error) {
            logWarning(`Could not read version history: ${error.message}`);
        }

        return [];
    }

    /**
     * Check for available updates
     */
    async checkForUpdates() {
        const currentVersion = await this.getCurrentVersion();
        logInfo(`Current version: ${currentVersion.version} (${currentVersion.source})`);

        // In a real implementation, this would check against a registry
        // For now, we'll simulate update checking
        const simulatedUpdates = {
            '1.0.0': { latest: '1.0.1', updateAvailable: true, updateType: 'patch' },
            '1.0.1': { latest: '1.0.1', updateAvailable: false, updateType: null },
            '1.1.0': { latest: '1.1.1', updateAvailable: true, updateType: 'patch' }
        };

        const versionInfo = simulatedUpdates[currentVersion.version] || {
            latest: currentVersion.version,
            updateAvailable: false,
            updateType: null
        };

        if (versionInfo.updateAvailable) {
            logWarning(`Update available: ${currentVersion.version} → ${versionInfo.latest} (${versionInfo.updateType})`);
        } else {
            logSuccess(`Plugin is up to date: ${currentVersion.version}`);
        }

        return versionInfo;
    }

    /**
     * Auto-update plugin
     */
    async autoUpdate(options = {}) {
        const {
            allowPrerelease = false,
            backup = true,
            dryRun = false
        } = options;

        logInfo('Checking for plugin updates...');

        const updateInfo = await this.checkForUpdates();

        if (!updateInfo.updateAvailable) {
            logSuccess('Plugin is already up to date');
            return null;
        }

        const currentVersion = await this.getCurrentVersion();
        const newVersion = updateInfo.latest;

        if (this.isPrerelease(newVersion) && !allowPrerelease) {
            logWarning('Prerelease update available but prereleases not allowed');
            return null;
        }

        logVersion(`Updating plugin: ${currentVersion.version} → ${newVersion}`);

        if (dryRun) {
            logInfo('DRY RUN: Would update version and download new files');
            return { dryRun: true, newVersion };
        }

        // Create backup if requested
        if (backup) {
            await this.createBackup(currentVersion.version);
        }

        // Update version
        const versionUpdate = await this.updateVersion(newVersion, {
            createChangelogEntry: true,
            changelogMessage: `Auto-update from ${currentVersion.version} to ${newVersion}`
        });

        logSuccess(`Plugin updated successfully to ${newVersion}`);
        return versionUpdate;
    }

    /**
     * Create backup before update
     */
    async createBackup(version) {
        const backupDir = join(this.pluginRoot, `.backup/${version}`);

        try {
            execSync(`mkdir -p "${backupDir}"`, { stdio: 'pipe' });
            execSync(`cp -r "${this.pluginRoot}/.claude-plugin" "${backupDir}/"`, { stdio: 'pipe' });
            execSync(`cp "${this.pluginRoot}/package.json" "${backupDir}/" 2>/dev/null || true`, { stdio: 'pipe' });
            execSync(`cp "${this.pluginRoot}/CHANGELOG.md" "${backupDir}/" 2>/dev/null || true`, { stdio: 'pipe' });

            logInfo(`Backup created: ${backupDir}`);
        } catch (error) {
            logWarning(`Could not create backup: ${error.message}`);
        }
    }

    /**
     * Validate version format
     */
    validateVersion(version) {
        return semver.valid(version) !== null;
    }

    /**
     * Compare versions
     */
    compareVersions(version1, version2) {
        return semver.compare(version1, version2);
    }

    /**
     * Get next possible versions
     */
    getNextVersions(currentVersion) {
        return {
            major: this.generateVersion(currentVersion, 'major'),
            minor: this.generateVersion(currentVersion, 'minor'),
            patch: this.generateVersion(currentVersion, 'patch'),
            prerelease: this.createPreviewVersion(currentVersion)
        };
    }

    /**
     * Helper: Read JSON file
     */
    async readJsonFile(filePath) {
        const content = await readFile(filePath, 'utf8');
        return JSON.parse(content);
    }

    /**
     * Helper: Write JSON file
     */
    async writeJsonFile(filePath, data) {
        const content = JSON.stringify(data, null, 2);
        await writeFile(filePath, content + '\n');
    }

    /**
     * Helper: Check if file exists
     */
    async fileExists(filePath) {
        try {
            await access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const versionManager = new VersionManager();

    try {
        switch (command) {
            case 'current':
                const current = await versionManager.getCurrentVersion();
                console.log(JSON.stringify(current, null, 2));
                break;

            case 'update':
                const newVersion = args[1];
                if (!newVersion) {
                    logError('Version required for update command');
                    process.exit(1);
                }
                await versionManager.updateVersion(newVersion);
                break;

            case 'bump':
                const bumpType = args[1] || 'patch';
                const currentVersion = await versionManager.getCurrentVersion();
                const bumpedVersion = versionManager.generateVersion(currentVersion.version, bumpType);
                await versionManager.updateVersion(bumpedVersion, {
                    createChangelogEntry: true,
                    changelogMessage: `Version bump (${bumpType})`
                });
                break;

            case 'preview':
                const currentForPreview = await versionManager.getCurrentVersion();
                const previewVersion = versionManager.createPreviewVersion(currentForPreview.version);
                await versionManager.updateVersion(previewVersion, {
                    createChangelogEntry: true,
                    changelogMessage: 'Preview release',
                    prerelease: true
                });
                break;

            case 'check':
                await versionManager.checkForUpdates();
                break;

            case 'auto-update':
                const autoUpdateOptions = {
                    allowPrerelease: args.includes('--prerelease'),
                    backup: !args.includes('--no-backup'),
                    dryRun: args.includes('--dry-run')
                };
                await versionManager.autoUpdate(autoUpdateOptions);
                break;

            case 'history':
                const limit = parseInt(args[1]) || 10;
                const history = await versionManager.getVersionHistory(limit);
                console.log(JSON.stringify(history, null, 2));
                break;

            case 'validate':
                const versionToValidate = args[1];
                if (!versionToValidate) {
                    logError('Version required for validate command');
                    process.exit(1);
                }
                const isValid = versionManager.validateVersion(versionToValidate);
                console.log(`${versionToValidate} is ${isValid ? 'valid' : 'invalid'}`);
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
FrontEnd UI/UX Build Plugin - Version Manager

USAGE:
    node version-manager.js <command> [options]

COMMANDS:
    current                    Show current version information
    update <version>          Update to specific version
    bump [type]               Bump version (patch|minor|major, default: patch)
    preview                   Create preview version
    check                     Check for available updates
    auto-update               Automatically update if available
    history [limit]           Show version history (default: 10)
    validate <version>        Validate version format

OPTIONS:
    --prerelease              Allow prerelease updates in auto-update
    --no-backup              Skip backup creation during update
    --dry-run                 Show what would be updated without making changes

EXAMPLES:
    node version-manager.js current
    node version-manager.js bump patch
    node version-manager.js update 1.2.0
    node version-manager.js preview
    node version-manager.js auto-update --prerelease
`);
}

// Export for use in other modules
export { VersionManager };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}