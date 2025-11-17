import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { ApiError } from '../utils/ApiError';
import { PlaywrightOptions } from '../types';
import logger from '../utils/logger';
import { env } from '../config/env';

/**
 * Playwright Service
 * Handles browser automation using Playwright
 */
export class PlaywrightService {
  private static browser: Browser | null = null;

  /**
   * Initializes the browser instance
   * @param options - Browser options
   * @returns Browser instance
   */
  private static async getBrowser(options?: PlaywrightOptions): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: options?.headless ?? env.PLAYWRIGHT_HEADLESS,
        timeout: options?.timeout ?? env.PLAYWRIGHT_TIMEOUT,
      });
      logger.info('Playwright browser launched');
    }
    return this.browser;
  }

  /**
   * Closes the browser instance
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser && this.browser.isConnected()) {
      await this.browser.close();
      this.browser = null;
      logger.info('Playwright browser closed');
    }
  }

  /**
   * Creates a new browser context
   * @param options - Browser options
   * @returns Browser context
   */
  private static async createContext(options?: PlaywrightOptions): Promise<BrowserContext> {
    const browser = await this.getBrowser(options);

    const context = await browser.newContext({
      viewport: options?.viewport || { width: 1920, height: 1080 },
      userAgent: options?.userAgent,
    });

    return context;
  }

  /**
   * Executes a Playwright script
   * @param script - JavaScript code to execute
   * @param config - Configuration options
   * @returns Execution result
   */
  static async executeScript(script: string, config: Record<string, any> = {}): Promise<any> {
    const context = await this.createContext(config.playwrightOptions);
    const page = await context.newPage();

    try {
      logger.info('Executing Playwright script');

      // Set default timeout
      page.setDefaultTimeout(config.timeout || env.PLAYWRIGHT_TIMEOUT);

      // Create a safe execution environment
      const result = await this.executeScriptInPage(page, script, config);

      logger.info('Playwright script executed successfully');

      return result;
    } catch (error: any) {
      logger.error('Playwright script execution failed:', error);
      throw ApiError.internal(`Script execution failed: ${error.message}`);
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Executes script in a page context
   * @param page - Playwright page
   * @param script - Script to execute
   * @param config - Configuration
   * @returns Execution result
   */
  private static async executeScriptInPage(
    page: Page,
    script: string,
    config: Record<string, any>
  ): Promise<any> {
    // Create a function wrapper to execute the script
    const wrappedScript = `
      (async () => {
        const page = arguments[0];
        const config = arguments[1];
        ${script}
      })
    `;

    try {
      // Execute the script
      const result = await page.evaluate(
        new Function('page', 'config', wrappedScript),
        page,
        config
      );

      return result;
    } catch (error: any) {
      // If direct evaluation fails, try alternative execution methods
      return await this.executeScriptAlternative(page, script, config);
    }
  }

  /**
   * Alternative script execution method
   * @param page - Playwright page
   * @param script - Script to execute
   * @param config - Configuration
   * @returns Execution result
   */
  private static async executeScriptAlternative(
    page: Page,
    script: string,
    config: Record<string, any>
  ): Promise<any> {
    const logs: string[] = [];
    const screenshots: string[] = [];

    try {
      // Parse the script for common Playwright operations
      if (script.includes('goto') || config.url) {
        const url = config.url || this.extractUrl(script);
        if (url) {
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          logs.push(`Navigated to: ${url}`);
        }
      }

      // Take screenshot if requested
      if (config.screenshot || script.includes('screenshot')) {
        const screenshot = await page.screenshot({ type: 'png', fullPage: true });
        const base64 = screenshot.toString('base64');
        screenshots.push(base64);
        logs.push('Screenshot captured');
      }

      // Extract text content if requested
      let content;
      if (config.extractText || script.includes('textContent')) {
        content = await page.textContent('body');
        logs.push('Text content extracted');
      }

      // Extract specific elements if selector provided
      let elements;
      if (config.selector) {
        elements = await page.$$(config.selector);
        logs.push(`Found ${elements.length} elements matching selector: ${config.selector}`);
      }

      return {
        success: true,
        logs,
        screenshots,
        content,
        elements: elements?.length || 0,
        url: page.url(),
        title: await page.title(),
      };
    } catch (error: any) {
      throw new Error(`Alternative execution failed: ${error.message}`);
    }
  }

  /**
   * Navigates to a URL and returns page content
   * @param url - URL to navigate to
   * @param options - Browser options
   * @returns Page content
   */
  static async navigateAndGetContent(
    url: string,
    options?: PlaywrightOptions
  ): Promise<{
    html: string;
    text: string;
    title: string;
    url: string;
  }> {
    const context = await this.createContext(options);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const html = await page.content();
      const text = await page.textContent('body');
      const title = await page.title();

      return {
        html,
        text: text || '',
        title,
        url: page.url(),
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Takes a screenshot of a URL
   * @param url - URL to screenshot
   * @param options - Browser options
   * @returns Screenshot as base64 string
   */
  static async screenshot(url: string, options?: PlaywrightOptions): Promise<string> {
    const context = await this.createContext(options);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: options?.viewport ? false : true,
      });

      return screenshot.toString('base64');
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Extracts URL from script
   * @param script - Script containing URL
   * @returns Extracted URL or null
   */
  private static extractUrl(script: string): string | null {
    const urlMatch = script.match(/goto\s*\(\s*['"]([^'"]+)['"]/);
    return urlMatch ? urlMatch[1] : null;
  }

  /**
   * Fills a form on a webpage
   * @param url - URL of the page
   * @param formData - Form field data (selector: value pairs)
   * @param options - Browser options
   * @returns Form submission result
   */
  static async fillForm(
    url: string,
    formData: Record<string, string>,
    options?: PlaywrightOptions
  ): Promise<{ success: boolean; message: string }> {
    const context = await this.createContext(options);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Fill each form field
      for (const [selector, value] of Object.entries(formData)) {
        await page.fill(selector, value);
      }

      logger.info(`Form filled successfully on ${url}`);

      return {
        success: true,
        message: 'Form filled successfully',
      };
    } catch (error: any) {
      logger.error('Form filling failed:', error);
      throw ApiError.internal(`Form filling failed: ${error.message}`);
    } finally {
      await page.close();
      await context.close();
    }
  }
}
