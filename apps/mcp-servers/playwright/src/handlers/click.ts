/**
 * Click Handler - Handles click and interaction operations
 */

import { Page } from 'playwright';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, ClickOptions } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export async function handleClick(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'button', type: 'string', required: false },
    { name: 'clickCount', type: 'number', required: false },
    { name: 'delay', type: 'number', required: false },
    { name: 'force', type: 'boolean', required: false },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for click', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    button = 'left',
    clickCount = 1,
    delay = 0,
    force = false,
    timeout = 30000,
  } = params as ClickOptions;

  try {
    logger.debug('Clicking element', { selector, button, clickCount });

    await page.click(selector, {
      button: button as 'left' | 'right' | 'middle',
      clickCount,
      delay,
      force,
      timeout,
    });

    logger.info('Click successful', { selector });

    return createSuccessResponse(id, {
      clicked: true,
      selector,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Click failed', { selector, error: err.message });

    if (err.message.includes('Timeout')) {
      return createErrorResponse(
        id,
        ErrorCode.InternalError,
        `Click timeout: Element not found or not clickable - ${selector}`
      );
    }

    return createErrorResponse(id, ErrorCode.InternalError, `Click failed: ${err.message}`);
  }
}

export async function handleFill(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'value', type: 'string', required: true },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for fill', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    value,
    timeout = 30000,
  } = params as { selector: string; value: string; timeout?: number };

  try {
    logger.debug('Filling input', { selector });

    await page.fill(selector, value, { timeout });

    logger.info('Fill successful', { selector });

    return createSuccessResponse(id, {
      filled: true,
      selector,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Fill failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Fill failed: ${err.message}`);
  }
}

export async function handleType(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'text', type: 'string', required: true },
    { name: 'delay', type: 'number', required: false },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for type', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    text,
    delay = 0,
    timeout = 30000,
  } = params as { selector: string; text: string; delay?: number; timeout?: number };

  try {
    logger.debug('Typing text', { selector });

    await page.type(selector, text, { delay, timeout });

    logger.info('Type successful', { selector });

    return createSuccessResponse(id, {
      typed: true,
      selector,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Type failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Type failed: ${err.message}`);
  }
}

export async function handlePress(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'key', type: 'string', required: true },
    { name: 'delay', type: 'number', required: false },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for press', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    key,
    delay = 0,
    timeout = 30000,
  } = params as { selector: string; key: string; delay?: number; timeout?: number };

  try {
    logger.debug('Pressing key', { selector, key });

    await page.press(selector, key, { delay, timeout });

    logger.info('Press successful', { selector, key });

    return createSuccessResponse(id, {
      pressed: true,
      selector,
      key,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Press failed', { selector, key, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Press failed: ${err.message}`);
  }
}

export async function handleCheck(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for check', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { selector, timeout = 30000 } = params as { selector: string; timeout?: number };

  try {
    logger.debug('Checking checkbox', { selector });

    await page.check(selector, { timeout });

    logger.info('Check successful', { selector });

    return createSuccessResponse(id, {
      checked: true,
      selector,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Check failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Check failed: ${err.message}`);
  }
}

export async function handleUncheck(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for uncheck', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { selector, timeout = 30000 } = params as { selector: string; timeout?: number };

  try {
    logger.debug('Unchecking checkbox', { selector });

    await page.uncheck(selector, { timeout });

    logger.info('Uncheck successful', { selector });

    return createSuccessResponse(id, {
      unchecked: true,
      selector,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Uncheck failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Uncheck failed: ${err.message}`);
  }
}

export async function handleSelect(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'values', type: 'object', required: true },
    { name: 'timeout', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for select', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    values,
    timeout = 30000,
  } = params as { selector: string; values: string | string[]; timeout?: number };

  try {
    logger.debug('Selecting option', { selector });

    const selected = await page.selectOption(selector, values, { timeout });

    logger.info('Select successful', { selector, selected });

    return createSuccessResponse(id, {
      selected: true,
      selector,
      values: selected,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Select failed', { selector, error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Select failed: ${err.message}`);
  }
}
