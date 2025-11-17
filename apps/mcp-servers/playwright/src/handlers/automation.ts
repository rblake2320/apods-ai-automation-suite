/**
 * Automation Handler - Handles automation script execution
 */

import { Page, Browser } from 'playwright';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  retryWithBackoff,
} from '../../../shared/utils.js';
import {
  ErrorCode,
  JsonRpcResponse,
  AutomationScript,
  AutomationStep,
} from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export async function handleRunAutomation(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  browser: Browser,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'name', type: 'string', required: true },
    { name: 'steps', type: 'object', required: true },
    { name: 'config', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for runAutomation', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const automation = params as AutomationScript;

  try {
    logger.info('Starting automation', { name: automation.name, steps: automation.steps.length });

    const results: Array<{
      step: number;
      action: string;
      success: boolean;
      result?: unknown;
      error?: string;
    }> = [];
    let currentPage = page;

    if (automation.config) {
      if (automation.config.viewport) {
        await currentPage.setViewportSize(automation.config.viewport);
      }
      if (automation.config.userAgent) {
        await currentPage.setExtraHTTPHeaders({
          'User-Agent': automation.config.userAgent,
        });
      }
    }

    for (let i = 0; i < automation.steps.length; i++) {
      const step = automation.steps[i];
      logger.debug('Executing step', { step: i + 1, action: step.action });

      try {
        if (step.condition) {
          const conditionMet = await evaluateCondition(currentPage, step.condition);
          if (!conditionMet) {
            logger.debug('Step condition not met, skipping', { step: i + 1 });
            results.push({
              step: i + 1,
              action: step.action,
              success: true,
              result: 'skipped',
            });
            continue;
          }
        }

        const executeStep = async () => {
          return await executeAutomationStep(currentPage, step, logger);
        };

        let result: unknown;
        if (step.retry) {
          result = await retryWithBackoff(
            executeStep,
            step.retry.maxAttempts,
            step.retry.delay,
            step.retry.backoff
          );
        } else {
          result = await executeStep();
        }

        results.push({
          step: i + 1,
          action: step.action,
          success: true,
          result,
        });

        logger.debug('Step executed successfully', { step: i + 1, action: step.action });
      } catch (error) {
        const err = error as Error;
        logger.error('Step execution failed', {
          step: i + 1,
          action: step.action,
          error: err.message,
        });

        results.push({
          step: i + 1,
          action: step.action,
          success: false,
          error: err.message,
        });

        return createErrorResponse(
          id,
          ErrorCode.InternalError,
          `Automation failed at step ${i + 1}: ${err.message}`,
          { results }
        );
      }
    }

    logger.info('Automation completed successfully', {
      name: automation.name,
      totalSteps: automation.steps.length,
    });

    return createSuccessResponse(id, {
      name: automation.name,
      success: true,
      totalSteps: automation.steps.length,
      results,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Automation execution failed', {
      name: automation.name,
      error: err.message,
    });

    return createErrorResponse(id, ErrorCode.InternalError, `Automation failed: ${err.message}`);
  }
}

async function executeAutomationStep(
  page: Page,
  step: AutomationStep,
  logger: Logger
): Promise<unknown> {
  const { action, params } = step;

  switch (action) {
    case 'navigate':
      await page.goto(params.url as string, {
        waitUntil: (params.waitUntil as 'load' | 'domcontentloaded' | 'networkidle') || 'load',
        timeout: (params.timeout as number) || 30000,
      });
      return { url: page.url() };

    case 'click':
      await page.click(params.selector as string, {
        timeout: (params.timeout as number) || 30000,
      });
      return { clicked: true };

    case 'fill':
      await page.fill(params.selector as string, params.value as string, {
        timeout: (params.timeout as number) || 30000,
      });
      return { filled: true };

    case 'type':
      await page.type(params.selector as string, params.text as string, {
        delay: (params.delay as number) || 0,
        timeout: (params.timeout as number) || 30000,
      });
      return { typed: true };

    case 'press':
      await page.press(params.selector as string, params.key as string, {
        delay: (params.delay as number) || 0,
        timeout: (params.timeout as number) || 30000,
      });
      return { pressed: true };

    case 'select':
      const selected = await page.selectOption(
        params.selector as string,
        params.values as string | string[],
        { timeout: (params.timeout as number) || 30000 }
      );
      return { selected };

    case 'check':
      await page.check(params.selector as string, {
        timeout: (params.timeout as number) || 30000,
      });
      return { checked: true };

    case 'uncheck':
      await page.uncheck(params.selector as string, {
        timeout: (params.timeout as number) || 30000,
      });
      return { unchecked: true };

    case 'screenshot':
      const screenshot = await page.screenshot({
        path: params.path as string | undefined,
        type: (params.type as 'png' | 'jpeg') || 'png',
        fullPage: (params.fullPage as boolean) || false,
      });
      return {
        path: params.path,
        data: params.path ? undefined : screenshot.toString('base64'),
      };

    case 'extract':
      if (params.multiple) {
        const elements = await page.$$(params.selector as string);
        if (params.attribute) {
          return await Promise.all(
            elements.map((el) => el.getAttribute(params.attribute as string))
          );
        } else {
          return await Promise.all(elements.map((el) => el.textContent()));
        }
      } else {
        const element = await page.$(params.selector as string);
        if (!element) {
          throw new Error(`Element not found: ${params.selector}`);
        }
        if (params.attribute) {
          return await element.getAttribute(params.attribute as string);
        } else {
          return await element.textContent();
        }
      }

    case 'waitForSelector':
      await page.waitForSelector(params.selector as string, {
        state: (params.state as 'attached' | 'detached' | 'visible' | 'hidden') || 'visible',
        timeout: (params.timeout as number) || 30000,
      });
      return { found: true };

    case 'waitForTimeout':
      await page.waitForTimeout(params.timeout as number);
      return { waited: true };

    case 'evaluate':
      const result = await page.evaluate(
        new Function('...args', `return (${params.script})(...args)`),
        ...((params.args as unknown[]) || [])
      );
      return result;

    case 'goBack':
      await page.goBack({ timeout: (params.timeout as number) || 30000 });
      return { url: page.url() };

    case 'goForward':
      await page.goForward({ timeout: (params.timeout as number) || 30000 });
      return { url: page.url() };

    case 'reload':
      await page.reload({ timeout: (params.timeout as number) || 30000 });
      return { url: page.url() };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function evaluateCondition(page: Page, condition: string): Promise<boolean> {
  try {
    const result = await page.evaluate(new Function(`return !!(${condition})`));
    return result as boolean;
  } catch (error) {
    return false;
  }
}

export async function handleGetCookies(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'urls', type: 'object', required: false }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for getCookies', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  try {
    const { urls } = params as { urls?: string[] };

    const cookies = urls ? await page.context().cookies(urls) : await page.context().cookies();

    logger.info('Cookies retrieved', { count: cookies.length });

    return createSuccessResponse(id, {
      cookies,
      count: cookies.length,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Get cookies failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Get cookies failed: ${err.message}`);
  }
}

export async function handleSetCookies(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'cookies', type: 'object', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for setCookies', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  try {
    const { cookies } = params as { cookies: Array<Record<string, unknown>> };

    await page.context().addCookies(cookies);

    logger.info('Cookies set', { count: cookies.length });

    return createSuccessResponse(id, {
      success: true,
      count: cookies.length,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Set cookies failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Set cookies failed: ${err.message}`);
  }
}
