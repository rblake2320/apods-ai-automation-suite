/**
 * Extract Handler - Handles data extraction operations
 */

import { Page } from 'playwright';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, ExtractOptions } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export async function handleExtract(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: false },
    { name: 'attribute', type: 'string', required: false },
    { name: 'multiple', type: 'boolean', required: false },
    { name: 'format', type: 'string', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for extract', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { selector, attribute, multiple = false, format = 'text' } = params as ExtractOptions;

  try {
    logger.debug('Extracting data', { selector, attribute, format, multiple });

    let result: unknown;

    if (!selector) {
      if (format === 'html') {
        result = await page.content();
      } else {
        result = await page.textContent('body');
      }
    } else if (multiple) {
      const elements = await page.$$(selector);

      if (attribute) {
        result = await Promise.all(elements.map((el) => el.getAttribute(attribute)));
      } else if (format === 'html') {
        result = await Promise.all(elements.map((el) => el.innerHTML()));
      } else if (format === 'text') {
        result = await Promise.all(elements.map((el) => el.textContent()));
      }
    } else {
      const element = await page.$(selector);

      if (!element) {
        return createErrorResponse(id, ErrorCode.NotFound, `Element not found: ${selector}`);
      }

      if (attribute) {
        result = await element.getAttribute(attribute);
      } else if (format === 'html') {
        result = await element.innerHTML();
      } else if (format === 'text') {
        result = await element.textContent();
      }
    }

    logger.info('Data extracted', { selector, format });

    return createSuccessResponse(id, {
      data: result,
      selector,
      format,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Extract failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Extract failed: ${err.message}`);
  }
}

export async function handleEvaluate(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'script', type: 'string', required: true },
    { name: 'args', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for evaluate', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { script, args = [] } = params as { script: string; args?: unknown[] };

  try {
    logger.debug('Evaluating script');

    const result = await page.evaluate(
      new Function('...args', `return (${script})(...args)`),
      ...args
    );

    logger.info('Script evaluated successfully');

    return createSuccessResponse(id, {
      result,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Evaluate failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Evaluate failed: ${err.message}`);
  }
}

export async function handleWaitForSelector(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'state', type: 'string', required: false },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for waitForSelector', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    state = 'visible',
    timeout = 30000,
  } = params as { selector: string; state?: string; timeout?: number };

  try {
    logger.debug('Waiting for selector', { selector, state });

    await page.waitForSelector(selector, {
      state: state as 'attached' | 'detached' | 'visible' | 'hidden',
      timeout,
    });

    logger.info('Selector found', { selector, state });

    return createSuccessResponse(id, {
      found: true,
      selector,
      state,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Wait for selector failed', { selector, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Wait for selector failed: ${err.message}`
    );
  }
}

export async function handleWaitForTimeout(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'timeout', type: 'number', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for waitForTimeout', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { timeout } = params as { timeout: number };

  try {
    logger.debug('Waiting for timeout', { timeout });

    await page.waitForTimeout(timeout);

    logger.info('Timeout complete', { timeout });

    return createSuccessResponse(id, {
      waited: true,
      timeout,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Wait for timeout failed', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Wait for timeout failed: ${err.message}`
    );
  }
}

export async function handleGetAttribute(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'attribute', type: 'string', required: true },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for getAttribute', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { selector, attribute } = params as { selector: string; attribute: string };

  try {
    logger.debug('Getting attribute', { selector, attribute });

    const value = await page.getAttribute(selector, attribute);

    logger.info('Attribute retrieved', { selector, attribute });

    return createSuccessResponse(id, {
      selector,
      attribute,
      value,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Get attribute failed', { selector, attribute, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Get attribute failed: ${err.message}`);
  }
}

export async function handleIsVisible(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'selector', type: 'string', required: true }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for isVisible', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { selector } = params as { selector: string };

  try {
    logger.debug('Checking visibility', { selector });

    const visible = await page.isVisible(selector);

    logger.info('Visibility checked', { selector, visible });

    return createSuccessResponse(id, {
      selector,
      visible,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Is visible failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Is visible failed: ${err.message}`);
  }
}
