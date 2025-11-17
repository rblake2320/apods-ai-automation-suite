/**
 * APODS AI-Automation Suite - API Load Testing with k6
 *
 * This script performs comprehensive load testing on the backend API
 * using k6 (https://k6.io/)
 *
 * Install k6:
 *   macOS: brew install k6
 *   Windows: choco install k6
 *   Linux: https://k6.io/docs/getting-started/installation/
 *
 * Run the test:
 *   k6 run tests/performance/api-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiTrend = new Trend('api_response_time');
const successCounter = new Counter('successful_requests');
const errorCounter = new Counter('failed_requests');

// Test configuration
export const options = {
  // Stages define the load pattern
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 50 }, // Ramp down to 50 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],

  // Thresholds define success criteria
  thresholds: {
    // 95% of requests should complete within 500ms
    http_req_duration: ['p(95)<500'],

    // Error rate should be less than 1%
    errors: ['rate<0.01'],

    // 99% of requests should complete within 1000ms
    'http_req_duration{endpoint:health}': ['p(99)<100'],
    'http_req_duration{endpoint:api}': ['p(99)<1000'],

    // HTTP failures should be less than 1%
    http_req_failed: ['rate<0.01'],
  },

  // Additional configuration
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0',

  // Summary configuration
  summaryTrendStats: ['min', 'avg', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Base URL - can be overridden with -e API_BASE_URL=...
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
];

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);

  // Check if the API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);

  if (healthCheck.status !== 200) {
    throw new Error(`API is not accessible. Status: ${healthCheck.status}`);
  }

  console.log('API is accessible. Starting test...');

  return { timestamp: new Date().toISOString() };
}

/**
 * Main test function - runs for each virtual user
 */
export default function (data) {
  // Health check endpoint
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health' },
    });

    const success = check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });

    errorRate.add(!success);
    apiTrend.add(response.timings.duration);

    if (success) {
      successCounter.add(1);
    } else {
      errorCounter.add(1);
    }
  });

  sleep(1);

  // API endpoints testing
  group('API Endpoints', () => {
    // Test GET endpoint
    group('GET /api/automations', () => {
      const response = http.get(`${BASE_URL}/api/automations`, {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'api' },
      });

      const success = check(response, {
        'automations status is 200': (r) => r.status === 200,
        'automations response time < 500ms': (r) => r.timings.duration < 500,
        'automations response is array': (r) => Array.isArray(JSON.parse(r.body)),
      });

      errorRate.add(!success);
      apiTrend.add(response.timings.duration);

      if (success) {
        successCounter.add(1);
      } else {
        errorCounter.add(1);
      }
    });

    sleep(0.5);

    // Test POST endpoint
    group('POST /api/automations', () => {
      const payload = JSON.stringify({
        name: `Test Automation ${Date.now()}`,
        description: 'Load test automation',
        config: {
          trigger: 'manual',
          actions: ['test'],
        },
      });

      const response = http.post(`${BASE_URL}/api/automations`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'api' },
      });

      const success = check(response, {
        'create automation status is 201 or 200': (r) => [200, 201].includes(r.status),
        'create automation response time < 1000ms': (r) => r.timings.duration < 1000,
        'create automation response has id': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.id !== undefined;
          } catch {
            return false;
          }
        },
      });

      errorRate.add(!success);
      apiTrend.add(response.timings.duration);

      if (success) {
        successCounter.add(1);
      } else {
        errorCounter.add(1);
      }
    });
  });

  sleep(1);

  // Stress test - rapid requests
  group('Burst Test', () => {
    for (let i = 0; i < 5; i++) {
      const response = http.get(`${BASE_URL}/health`, {
        tags: { endpoint: 'burst' },
      });

      check(response, {
        'burst request successful': (r) => r.status === 200,
      });

      apiTrend.add(response.timings.duration);
    }
  });

  sleep(2);
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log(`Test completed. Started at: ${data.timestamp}`);
  console.log(`Finished at: ${new Date().toISOString()}`);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  // Generate console output
  console.log('\n=== Load Test Summary ===\n');

  const { metrics } = data;

  // HTTP metrics
  if (metrics.http_reqs) {
    console.log(`Total HTTP Requests: ${metrics.http_reqs.values.count}`);
    console.log(`Request Rate: ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  }

  // Response time metrics
  if (metrics.http_req_duration) {
    console.log(`\nResponse Time Statistics:`);
    console.log(`  Min: ${metrics.http_req_duration.values.min.toFixed(2)}ms`);
    console.log(`  Avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
    console.log(`  Med: ${metrics.http_req_duration.values.med.toFixed(2)}ms`);
    console.log(`  Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms`);
    console.log(`  P90: ${metrics.http_req_duration.values['p(90)'].toFixed(2)}ms`);
    console.log(`  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  }

  // Error metrics
  if (metrics.errors) {
    console.log(`\nError Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%`);
  }

  if (metrics.successful_requests && metrics.failed_requests) {
    const total = metrics.successful_requests.values.count + metrics.failed_requests.values.count;
    const successRate = ((metrics.successful_requests.values.count / total) * 100).toFixed(2);
    console.log(`Success Rate: ${successRate}%`);
  }

  // Return summary for k6's built-in reporters
  return {
    stdout: JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  };
}
