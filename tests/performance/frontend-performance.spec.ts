/**
 * APODS AI-Automation Suite - Frontend Performance Testing
 *
 * This test suite measures frontend performance using Lighthouse CI
 * and Playwright performance APIs.
 *
 * Run with: pnpm test:e2e tests/performance/frontend-performance.spec.ts
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  // Lighthouse scores (0-100)
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 90,

  // Web Vitals
  lcp: 2500, // Largest Contentful Paint (ms)
  fid: 100, // First Input Delay (ms)
  cls: 0.1, // Cumulative Layout Shift (score)
  fcp: 1800, // First Contentful Paint (ms)
  ttfb: 600, // Time to First Byte (ms)

  // Custom metrics
  domContentLoaded: 1000,
  loadEventEnd: 2000,
};

/**
 * Measures Core Web Vitals using Performance API
 */
async function measureWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
      };

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0] as any;
        metrics.fid = firstInput.processingStart - firstInput.startTime;
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      // Time to First Byte
      const navigationTiming = performance.getEntriesByType('navigation')[0] as any;
      if (navigationTiming) {
        metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      }

      // Wait a bit for metrics to be collected
      setTimeout(() => resolve(metrics), 3000);
    });
  });
}

/**
 * Measures page load performance
 */
async function measurePageLoad(page: Page) {
  return await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as any;

    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadEventEnd: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive,
      domComplete: perfData.domComplete,
      loadTime: perfData.loadEventEnd - perfData.fetchStart,
      requestTime: perfData.responseEnd - perfData.requestStart,
      responseTime: perfData.responseEnd - perfData.responseStart,
    };
  });
}

/**
 * Measures resource loading performance
 */
async function measureResourceLoad(page: Page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as any[];

    const resourceMetrics = {
      total: resources.length,
      scripts: 0,
      stylesheets: 0,
      images: 0,
      fonts: 0,
      xhr: 0,
      totalSize: 0,
      largestResource: { name: '', size: 0, duration: 0 },
      slowestResource: { name: '', size: 0, duration: 0 },
    };

    resources.forEach((resource) => {
      // Count by type
      if (resource.initiatorType === 'script') resourceMetrics.scripts++;
      else if (resource.initiatorType === 'css') resourceMetrics.stylesheets++;
      else if (resource.initiatorType === 'img') resourceMetrics.images++;
      else if (resource.initiatorType === 'font') resourceMetrics.fonts++;
      else if (resource.initiatorType === 'xmlhttprequest') resourceMetrics.xhr++;

      // Calculate size
      const size = resource.transferSize || resource.decodedBodySize || 0;
      resourceMetrics.totalSize += size;

      // Track largest resource
      if (size > resourceMetrics.largestResource.size) {
        resourceMetrics.largestResource = {
          name: resource.name,
          size,
          duration: resource.duration,
        };
      }

      // Track slowest resource
      if (resource.duration > resourceMetrics.slowestResource.duration) {
        resourceMetrics.slowestResource = {
          name: resource.name,
          size,
          duration: resource.duration,
        };
      }
    });

    return resourceMetrics;
  });
}

test.describe('Frontend Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance metrics collection
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    const webVitals = await measureWebVitals(page);

    console.log('\n=== Core Web Vitals ===');
    console.log(`LCP: ${webVitals.lcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.lcp}ms)`);
    console.log(`FID: ${webVitals.fid.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.fid}ms)`);
    console.log(`CLS: ${webVitals.cls.toFixed(3)} (threshold: ${PERFORMANCE_THRESHOLDS.cls})`);
    console.log(`FCP: ${webVitals.fcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.fcp}ms)`);
    console.log(
      `TTFB: ${webVitals.ttfb.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.ttfb}ms)`
    );

    // Assert thresholds
    expect(webVitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
    expect(webVitals.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.fid);
    expect(webVitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
    expect(webVitals.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp);
    expect(webVitals.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.ttfb);
  });

  test('should load page within acceptable time', async ({ page }) => {
    const pageLoad = await measurePageLoad(page);

    console.log('\n=== Page Load Metrics ===');
    console.log(`DOM Content Loaded: ${pageLoad.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Event: ${pageLoad.loadEventEnd.toFixed(2)}ms`);
    console.log(`Total Load Time: ${pageLoad.loadTime.toFixed(2)}ms`);
    console.log(`Request Time: ${pageLoad.requestTime.toFixed(2)}ms`);

    expect(pageLoad.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.domContentLoaded);
    expect(pageLoad.loadEventEnd).toBeLessThan(PERFORMANCE_THRESHOLDS.loadEventEnd);
  });

  test('should load resources efficiently', async ({ page }) => {
    const resourceLoad = await measureResourceLoad(page);

    console.log('\n=== Resource Load Metrics ===');
    console.log(`Total Resources: ${resourceLoad.total}`);
    console.log(`Scripts: ${resourceLoad.scripts}`);
    console.log(`Stylesheets: ${resourceLoad.stylesheets}`);
    console.log(`Images: ${resourceLoad.images}`);
    console.log(`Fonts: ${resourceLoad.fonts}`);
    console.log(`Total Size: ${(resourceLoad.totalSize / 1024).toFixed(2)} KB`);
    console.log(
      `Largest Resource: ${resourceLoad.largestResource.name} (${(resourceLoad.largestResource.size / 1024).toFixed(2)} KB)`
    );
    console.log(
      `Slowest Resource: ${resourceLoad.slowestResource.name} (${resourceLoad.slowestResource.duration.toFixed(2)}ms)`
    );

    // Assert reasonable resource counts
    expect(resourceLoad.total).toBeLessThan(100);
    expect(resourceLoad.scripts).toBeLessThan(20);
    expect(resourceLoad.stylesheets).toBeLessThan(10);

    // Total page size should be under 5MB
    expect(resourceLoad.totalSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('should have no blocking resources', async ({ page }) => {
    const blockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as any[];
      return resources.filter((resource) => {
        // Check for render-blocking resources
        return resource.renderBlockingStatus === 'blocking';
      });
    });

    console.log('\n=== Blocking Resources ===');
    console.log(`Count: ${blockingResources.length}`);

    if (blockingResources.length > 0) {
      console.log('Blocking resources:');
      blockingResources.forEach((resource) => {
        console.log(`  - ${resource.name}`);
      });
    }

    // Should have minimal blocking resources
    expect(blockingResources.length).toBeLessThan(5);
  });

  test('should have efficient memory usage', async ({ page }) => {
    const memoryMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryMetrics) {
      console.log('\n=== Memory Metrics ===');
      console.log(`Used JS Heap: ${(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total JS Heap: ${(memoryMetrics.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`JS Heap Limit: ${(memoryMetrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);

      // Memory usage should be under 100MB
      expect(memoryMetrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    }
  });

  test('should handle rapid interactions efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Simulate rapid interactions
    for (let i = 0; i < 10; i++) {
      await page.click('body');
      await page.keyboard.press('Tab');
    }

    const interactionTime = Date.now() - startTime;

    console.log('\n=== Interaction Performance ===');
    console.log(`10 interactions completed in: ${interactionTime}ms`);
    console.log(`Average per interaction: ${(interactionTime / 10).toFixed(2)}ms`);

    // All interactions should complete quickly
    expect(interactionTime).toBeLessThan(1000);
  });
});

test.describe('Bundle Size Tests', () => {
  test('should have reasonable JavaScript bundle size', async ({ page }) => {
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as any[];
      const jsFiles = resources.filter((r) => r.name.endsWith('.js'));

      return jsFiles.map((r) => ({
        name: r.name,
        size: r.transferSize || r.decodedBodySize || 0,
      }));
    });

    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);

    console.log('\n=== JavaScript Bundle Size ===');
    console.log(`Total JS Size: ${(totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`Number of JS files: ${jsResources.length}`);

    // Individual JS files
    jsResources.forEach((resource) => {
      console.log(`  - ${resource.name.split('/').pop()}: ${(resource.size / 1024).toFixed(2)} KB`);
    });

    // Total JS should be under 1MB
    expect(totalJsSize).toBeLessThan(1024 * 1024);
  });

  test('should have reasonable CSS bundle size', async ({ page }) => {
    const cssResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as any[];
      const cssFiles = resources.filter((r) => r.name.endsWith('.css'));

      return cssFiles.map((r) => ({
        name: r.name,
        size: r.transferSize || r.decodedBodySize || 0,
      }));
    });

    const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0);

    console.log('\n=== CSS Bundle Size ===');
    console.log(`Total CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB`);
    console.log(`Number of CSS files: ${cssResources.length}`);

    // Individual CSS files
    cssResources.forEach((resource) => {
      console.log(`  - ${resource.name.split('/').pop()}: ${(resource.size / 1024).toFixed(2)} KB`);
    });

    // Total CSS should be under 200KB
    expect(totalCssSize).toBeLessThan(200 * 1024);
  });
});
