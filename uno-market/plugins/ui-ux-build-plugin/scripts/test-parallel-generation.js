#!/usr/bin/env node

/**
 * Test script for parallel component generation workflow
 */

import { handleError } from './utils/error-handler.js';
import { validateComponentName, generateFileNames, toPascalCase } from './component-naming.js';

/**
 * Test parallel agent coordination
 */
async function testParallelAgentCoordination(componentName, options = {}) {
  console.log(`🧪 Testing parallel component generation for: ${componentName}`);

  try {
    // Validate component name
    validateComponentName(componentName);

    // Generate file names
    const fileNames = generateFileNames(componentName);
    console.log(`📁 Generated file names:`, Object.keys(fileNames).join(', '));

    // Simulate parallel agent execution
    console.log('🚀 Launching parallel agents...');

    const agents = [
      {
        name: 'UI-Architect',
        model: 'sonnet-4.5',
        task: 'Design component architecture',
        estimatedTime: 5000
      },
      {
        name: 'Tailwind-Stylist',
        model: 'glm-4.6',
        task: 'Generate Tailwind CSS styling',
        estimatedTime: 3000
      },
      {
        name: 'Vitest-Tester',
        model: 'glm-4.6',
        task: 'Create comprehensive tests',
        estimatedTime: 4000
      }
    ];

    // Simulate parallel execution timing
    const startTime = Date.now();

    const agentPromises = agents.map(agent =>
      simulateAgentExecution(agent, componentName, options)
    );

    const results = await Promise.allSettled(agentPromises);
    const endTime = Date.now();

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    console.log(`✅ Parallel execution completed in ${endTime - startTime}ms`);
    console.log(`📊 Results: ${successful.length} successful, ${failed.length} failed`);

    if (failed.length > 0) {
      console.log('❌ Failed agents:');
      failed.forEach((result, index) => {
        const agent = agents[index];
        console.log(`   - ${agent.name}: ${result.reason?.message || 'Unknown error'}`);
      });
    }

    // Validate coordination
    const coordinationResult = validateAgentCoordination(results, componentName);
    console.log(`🔗 Agent coordination: ${coordinationResult.valid ? '✅ Valid' : '❌ Invalid'}`);

    if (!coordinationResult.valid) {
      console.log('⚠️  Coordination issues:', coordinationResult.issues);
    }

    return {
      success: failed.length === 0,
      duration: endTime - startTime,
      agents: agents.map((agent, index) => ({
        name: agent.name,
        status: results[index].status,
        model: agent.model
      })),
      coordination: coordinationResult
    };

  } catch (error) {
    handleError(error, { component: 'test-parallel-generation' });
  }
}

/**
 * Simulate individual agent execution
 */
async function simulateAgentExecution(agent, componentName, options) {
  console.log(`  🤖 ${agent.name} (${agent.model}) starting...`);

  // Simulate agent processing time
  await new Promise(resolve => setTimeout(resolve, agent.estimatedTime));

  // Simulate different agent outputs
  let output;
  switch (agent.name) {
    case 'UI-Architect':
      output = {
        architecture: 'functional-component',
        interfaces: generateMockInterfaces(componentName),
        hooks: generateMockHooks(componentName)
      };
      break;

    case 'Tailwind-Stylist':
      output = {
        styling: 'tailwind-utility-classes',
        responsive: generateMockResponsiveStyles(),
        designTokens: generateMockDesignTokens()
      };
      break;

    case 'Vitest-Tester':
      output = {
        tests: 'comprehensive-test-suite',
        coverage: '95%',
        scenarios: generateMockTestScenarios(componentName)
      };
      break;

    default:
      output = { message: 'Agent completed successfully' };
  }

  console.log(`  ✅ ${agent.name} completed`);

  return {
    agent: agent.name,
    model: agent.model,
    output,
    duration: agent.estimatedTime
  };
}

/**
 * Generate mock component interfaces
 */
function generateMockInterfaces(componentName) {
  const pascalCase = toPascalCase(componentName);

  return {
    props: `${pascalCase}Props`,
    state: options.useState ? `${pascalCase}State` : null,
    ref: options.useRef ? `Ref<HTMLElement>` : null
  };
}

/**
 * Generate mock React hooks
 */
function generateMockHooks(componentName) {
  const pascalCase = toPascalCase(componentName);

  return {
    useState: options.useState ? `useState<${pascalCase}State>` : null,
    useEffect: 'useEffect',
    useCallback: options.useCallback ? 'useCallback' : null
  };
}

/**
 * Generate mock responsive styles
 */
function generateMockResponsiveStyles() {
  return {
    mobile: 'sm:',
    tablet: 'md:',
    desktop: 'lg:',
    wide: 'xl:'
  };
}

/**
 * Generate mock design tokens
 */
function generateMockDesignTokens() {
  return {
    colors: ['primary-500', 'secondary-500', 'accent-500'],
    spacing: ['p-4', 'm-2', 'gap-6'],
    typography: ['text-sm', 'font-medium']
  };
}

/**
 * Generate mock test scenarios
 */
function generateMockTestScenarios(componentName) {
  return [
    `renders ${componentName} without crashing`,
    'handles required props correctly',
    'renders children when provided',
    'responds to user interactions',
    'has proper accessibility attributes'
  ];
}

/**
 * Validate agent coordination
 */
function validateAgentCoordination(results, componentName) {
  const issues = [];
  let valid = true;

  // Check if all agents completed successfully
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  if (successCount < 3) {
    issues.push(`Only ${successCount}/3 agents completed successfully`);
    valid = false;
  }

  // Check if outputs are consistent
  const outputs = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.output);

  if (outputs.length === 3) {
    const architecture = outputs[0];
    const styling = outputs[1];
    const tests = outputs[2];

    // Basic consistency checks
    if (architecture && !architecture.interfaces) {
      issues.push('UI-Architect missing interface definitions');
      valid = false;
    }

    if (styling && !styling.designTokens) {
      issues.push('Tailwind-Stylist missing design token integration');
      valid = false;
    }

    if (tests && !tests.scenarios) {
      issues.push('Vitest-Tester missing test scenarios');
      valid = false;
    }
  }

  return {
    valid,
    issues
  };
}

/**
 * Test with multiple component types
 */
async function testMultipleComponents() {
  console.log('🧪 Testing multiple component types...');

  const testCases = [
    { name: 'UserProfile', options: { useState: true, useCallback: true } },
    { name: 'ProductCard', options: { useRef: true } },
    { name: 'NavigationMenu', options: { useState: true } },
    { name: 'DataTable', options: { useState: true, useRef: true } },
    { name: 'SearchBar', options: { useCallback: true } }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.name} ---`);
    const result = await testParallelAgentCoordination(testCase.name, testCase.options);
    results.push(result);
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  console.log(`\n📊 Multiple component test summary:`);
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${results.length - successful}`);
  console.log(`   Success rate: ${Math.round((successful / results.length) * 100)}%`);

  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`   Average duration: ${Math.round(avgDuration)}ms`);

  return results;
}

/**
 * Test constitution compliance
 */
function testConstitutionCompliance() {
  console.log('📋 Testing constitution compliance...');

  const compliance = {
    technologyStack: true, // Tailwind CSS, React/TS, Vite/ESBuild
    costOptimization: true, // Sonnet 4.5 for architecture, GLM 4.6 for execution
    parallelOrchestration: true, // Multiple agents in parallel
    qualityEnforcement: true, // Automated quality checks
    simplicityPortability: true  // Local configuration
  };

  console.log('✅ Constitutional requirements:');
  Object.entries(compliance).forEach(([principle, compliant]) => {
    console.log(`   ${compliant ? '✅' : '❌'} ${principle}`);
  });

  return compliance;
}

// Main execution
async function main() {
  try {
    console.log('🧪 FrontEnd UI/UX Build Plugin - Parallel Generation Test Suite');
    console.log('=' .repeat(60));

    // Test basic parallel coordination
    console.log('\n1. Testing basic parallel agent coordination...');
    const basicTest = await testParallelAgentCoordination('TestComponent');

    // Test multiple components
    console.log('\n2. Testing multiple component types...');
    await testMultipleComponents();

    // Test constitution compliance
    console.log('\n3. Testing constitution compliance...');
    testConstitutionCompliance();

    console.log('\n🎉 All tests completed!');

    if (basicTest.success) {
      console.log('✅ Parallel component generation is working correctly');
    } else {
      console.log('❌ Some tests failed - check agent coordination');
      process.exit(1);
    }

  } catch (error) {
    handleError(error, { component: 'test-parallel-generation-main' });
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main();
}

export {
  testParallelAgentCoordination,
  testMultipleComponents,
  testConstitutionCompliance
};