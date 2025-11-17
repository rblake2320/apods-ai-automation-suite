#!/usr/bin/env node

/**
 * APODS AI-Automation Suite - Performance Testing Script
 *
 * This script runs comprehensive performance benchmarks for the application
 * including CPU, memory, and I/O performance metrics.
 */

import { performance } from 'perf_hooks';
import { cpus, totalmem, freemem } from 'os';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  cpu: 100, // CPU-intensive operations
  io: 50, // I/O operations
  memory: 1000, // Memory allocations
  json: 10, // JSON operations
};

/**
 * Formats memory size in human-readable format
 */
function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formats duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Gets status color based on performance threshold
 */
function getStatusColor(duration, threshold) {
  if (duration < threshold * 0.5) return colors.green;
  if (duration < threshold) return colors.yellow;
  return colors.red;
}

/**
 * Prints system information
 */
function printSystemInfo() {
  console.log(`\n${colors.bright}${colors.cyan}System Information:${colors.reset}`);
  console.log(`  CPU Cores: ${cpus().length}`);
  console.log(`  CPU Model: ${cpus()[0].model}`);
  console.log(`  Total Memory: ${formatBytes(totalmem())}`);
  console.log(`  Free Memory: ${formatBytes(freemem())}`);
  console.log(`  Memory Usage: ${((1 - freemem() / totalmem()) * 100).toFixed(2)}%`);
  console.log(`  Node.js Version: ${process.version}`);
  console.log(`  Platform: ${process.platform} ${process.arch}\n`);
}

/**
 * Benchmark CPU-intensive operations
 */
async function benchmarkCPU() {
  console.log(`${colors.bright}CPU Performance Tests:${colors.reset}`);

  const results = [];

  // Test 1: Fibonacci calculation
  const fibStart = performance.now();
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  fibonacci(30);
  const fibDuration = performance.now() - fibStart;
  results.push({ name: 'Fibonacci(30)', duration: fibDuration, threshold: THRESHOLDS.cpu });

  // Test 2: Prime number calculation
  const primeStart = performance.now();
  function isPrime(n) {
    if (n <= 1) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }
  const primes = [];
  for (let i = 0; i < 10000; i++) {
    if (isPrime(i)) primes.push(i);
  }
  const primeDuration = performance.now() - primeStart;
  results.push({ name: 'Prime numbers (10k)', duration: primeDuration, threshold: THRESHOLDS.cpu });

  // Test 3: Array operations
  const arrayStart = performance.now();
  const largeArray = Array.from({ length: 100000 }, (_, i) => i);
  largeArray.sort((a, b) => b - a);
  largeArray.map((x) => x * 2);
  largeArray.filter((x) => x % 2 === 0);
  const arrayDuration = performance.now() - arrayStart;
  results.push({
    name: 'Array operations (100k)',
    duration: arrayDuration,
    threshold: THRESHOLDS.cpu,
  });

  // Print results
  results.forEach(({ name, duration, threshold }) => {
    const color = getStatusColor(duration, threshold);
    const status = duration < threshold ? '✓' : '✗';
    console.log(`  ${color}${status} ${name}: ${formatDuration(duration)}${colors.reset}`);
  });

  return results;
}

/**
 * Benchmark I/O operations
 */
async function benchmarkIO() {
  console.log(`\n${colors.bright}I/O Performance Tests:${colors.reset}`);

  const results = [];
  const testDir = join(__dirname, '../.test-perf');

  try {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Test 1: File write
    const writeStart = performance.now();
    const testData = JSON.stringify(
      Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: 'x'.repeat(100),
      }))
    );
    await writeFile(join(testDir, 'test-write.json'), testData);
    const writeDuration = performance.now() - writeStart;
    results.push({
      name: 'File write (1k items)',
      duration: writeDuration,
      threshold: THRESHOLDS.io,
    });

    // Test 2: File read
    const readStart = performance.now();
    await readFile(join(testDir, 'test-write.json'), 'utf-8');
    const readDuration = performance.now() - readStart;
    results.push({
      name: 'File read (1k items)',
      duration: readDuration,
      threshold: THRESHOLDS.io,
    });

    // Test 3: Multiple small files
    const multiStart = performance.now();
    await Promise.all(
      Array.from({ length: 100 }, async (_, i) => {
        await writeFile(join(testDir, `test-${i}.txt`), `Test content ${i}`);
      })
    );
    const multiDuration = performance.now() - multiStart;
    results.push({
      name: 'Multiple files (100)',
      duration: multiDuration,
      threshold: THRESHOLDS.io * 2,
    });

    // Cleanup
    await rm(testDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`  ${colors.red}Error during I/O tests: ${error.message}${colors.reset}`);
  }

  // Print results
  results.forEach(({ name, duration, threshold }) => {
    const color = getStatusColor(duration, threshold);
    const status = duration < threshold ? '✓' : '✗';
    console.log(`  ${color}${status} ${name}: ${formatDuration(duration)}${colors.reset}`);
  });

  return results;
}

/**
 * Benchmark memory operations
 */
async function benchmarkMemory() {
  console.log(`\n${colors.bright}Memory Performance Tests:${colors.reset}`);

  const results = [];

  // Test 1: Large object allocation
  const initialMemory = process.memoryUsage().heapUsed;
  const objectStart = performance.now();
  const largeObject = {};
  for (let i = 0; i < 100000; i++) {
    largeObject[`key${i}`] = { value: i, data: 'x'.repeat(100) };
  }
  const objectDuration = performance.now() - objectStart;
  const objectMemory = process.memoryUsage().heapUsed - initialMemory;
  results.push({
    name: 'Large object (100k keys)',
    duration: objectDuration,
    memory: objectMemory,
    threshold: THRESHOLDS.memory,
  });

  // Test 2: Array allocation
  const arrayInitialMemory = process.memoryUsage().heapUsed;
  const arrayStart = performance.now();
  const largeArray = Array.from({ length: 1000000 }, (_, i) => ({
    id: i,
    value: Math.random(),
  }));
  const arrayDuration = performance.now() - arrayStart;
  const arrayMemory = process.memoryUsage().heapUsed - arrayInitialMemory;
  results.push({
    name: 'Large array (1M items)',
    duration: arrayDuration,
    memory: arrayMemory,
    threshold: THRESHOLDS.memory,
  });

  // Print results
  results.forEach(({ name, duration, memory, threshold }) => {
    const color = getStatusColor(duration, threshold);
    const status = duration < threshold ? '✓' : '✗';
    console.log(
      `  ${color}${status} ${name}: ${formatDuration(duration)} (${formatBytes(memory)})${colors.reset}`
    );
  });

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  return results;
}

/**
 * Benchmark JSON operations
 */
async function benchmarkJSON() {
  console.log(`\n${colors.bright}JSON Performance Tests:${colors.reset}`);

  const results = [];

  // Create test data
  const testData = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: 'Test description'.repeat(10),
    nested: {
      value: Math.random(),
      array: [1, 2, 3, 4, 5],
    },
  }));

  // Test 1: JSON.stringify
  const stringifyStart = performance.now();
  const jsonString = JSON.stringify(testData);
  const stringifyDuration = performance.now() - stringifyStart;
  results.push({
    name: 'JSON.stringify (10k)',
    duration: stringifyDuration,
    threshold: THRESHOLDS.json,
  });

  // Test 2: JSON.parse
  const parseStart = performance.now();
  JSON.parse(jsonString);
  const parseDuration = performance.now() - parseStart;
  results.push({ name: 'JSON.parse (10k)', duration: parseDuration, threshold: THRESHOLDS.json });

  // Print results
  results.forEach(({ name, duration, threshold }) => {
    const color = getStatusColor(duration, threshold);
    const status = duration < threshold ? '✓' : '✗';
    console.log(`  ${color}${status} ${name}: ${formatDuration(duration)}${colors.reset}`);
  });

  return results;
}

/**
 * Print summary statistics
 */
function printSummary(allResults) {
  const totalTests = allResults.length;
  const passedTests = allResults.filter((r) => r.duration < r.threshold).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n${colors.bright}${colors.cyan}Performance Summary:${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
  if (failedTests > 0) {
    console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);
  }

  const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;
  console.log(`  Average Duration: ${formatDuration(averageDuration)}`);

  const memUsage = process.memoryUsage();
  console.log(`\n${colors.bright}Final Memory Usage:${colors.reset}`);
  console.log(`  Heap Used: ${formatBytes(memUsage.heapUsed)}`);
  console.log(`  Heap Total: ${formatBytes(memUsage.heapTotal)}`);
  console.log(`  External: ${formatBytes(memUsage.external)}`);
  console.log(`  RSS: ${formatBytes(memUsage.rss)}\n`);

  if (failedTests > 0) {
    console.log(
      `${colors.red}⚠️  Some performance tests failed to meet thresholds!${colors.reset}\n`
    );
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ All performance tests passed!${colors.reset}\n`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('  APODS AI-Automation Suite - Performance Benchmarks');
  console.log('═══════════════════════════════════════════════════════');
  console.log(colors.reset);

  printSystemInfo();

  const startTime = performance.now();

  const allResults = [];

  // Run benchmarks
  allResults.push(...(await benchmarkCPU()));
  allResults.push(...(await benchmarkIO()));
  allResults.push(...(await benchmarkMemory()));
  allResults.push(...(await benchmarkJSON()));

  const totalDuration = performance.now() - startTime;

  console.log(
    `\n${colors.bright}Total Test Duration: ${formatDuration(totalDuration)}${colors.reset}`
  );

  printSummary(allResults);
}

// Run the benchmarks
main().catch(console.error);
