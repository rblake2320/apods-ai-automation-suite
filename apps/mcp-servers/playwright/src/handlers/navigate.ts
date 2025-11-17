/**
 * Navigate Handler - Handles page navigation operations
 */

import { Page } from 'playwright';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, NavigationOptions } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export async function handleNavigate(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'url', type: 'string', required: true },
    { name: 'waitUntil', type: 'string', required: false },
    { name: 'timeout', type: 'number', required: false },
    { name: 'referer', type: 'string', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for navigate', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { url, waitUntil = 'load', timeout = 30000, referer } = params as NavigationOptions;

  try {
    logger.debug('Navigating to URL', { url, waitUntil });

    const response = await page.goto(url, {
      waitUntil: waitUntil as 'load' | 'domcontentloaded' | 'networkidle',
      timeout,
      referer,
    });

    const pageUrl = page.url();
    const title = await page.title();

    logger.info('Navigation successful', { url: pageUrl, title });

    return createSuccessResponse(id, {
      url: pageUrl,
      title,
      status: response?.status(),
      statusText: response?.statusText(),
      ok: response?.ok(),
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Navigation failed', { url, error: err.message });

    if (err.message.includes('Timeout')) {
      return createErrorResponse(id, ErrorCode.InternalError, `Navigation timeout: ${err.message}`);
    }

    return createErrorResponse(id, ErrorCode.InternalError, `Navigation failed: ${err.message}`);
  }
}

export async function handleGoBack(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'timeout', type: 'number', required: false }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for goBack', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { timeout = 30000 } = params as { timeout?: number };

  try {
    logger.debug('Going back in history');

    await page.goBack({ timeout });
    const url = page.url();
    const title = await page.title();

    logger.info('Go back successful', { url, title });

    return createSuccessResponse(id, {
      url,
      title,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Go back failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Go back failed: ${err.message}`);
  }
}

export async function handleGoForward(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'timeout', type: 'number', required: false }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for goForward', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { timeout = 30000 } = params as { timeout?: number };

  try {
    logger.debug('Going forward in history');

    await page.goForward({ timeout });
    const url = page.url();
    const title = await page.title();

    logger.info('Go forward successful', { url, title });

    return createSuccessResponse(id, {
      url,
      title,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Go forward failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Go forward failed: ${err.message}`);
  }
}

export async function handleReload(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [{ name: 'timeout', type: 'number', required: false }]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for reload', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { timeout = 30000 } = params as { timeout?: number };

  try {
    logger.debug('Reloading page');

    await page.reload({ timeout });
    const url = page.url();
    const title = await page.title();

    logger.info('Reload successful', { url, title });

    return createSuccessResponse(id, {
      url,
      title,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Reload failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Reload failed: ${err.message}`);
  }
}

export async function handleGetUrl(
  id: string | number,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  try {
    const url = page.url();
    const title = await page.title();

    logger.debug('Get URL', { url, title });

    return createSuccessResponse(id, {
      url,
      title,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Get URL failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Get URL failed: ${err.message}`);
  }
}
