/**
 * Screenshot Handler - Handles screenshot and PDF operations
 */

import { Page } from 'playwright';
import {
  createSuccessResponse,
  createErrorResponse,
  validateParams,
} from '../../../shared/utils.js';
import { ErrorCode, JsonRpcResponse, ScreenshotOptions } from '../../../shared/types.js';
import { Logger } from '../../../shared/logger.js';

export async function handleScreenshot(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: false },
    { name: 'type', type: 'string', required: false },
    { name: 'quality', type: 'number', required: false },
    { name: 'fullPage', type: 'boolean', required: false },
    { name: 'clip', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for screenshot', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: screenshotPath,
    type = 'png',
    quality,
    fullPage = false,
    clip,
  } = params as ScreenshotOptions;

  try {
    logger.debug('Taking screenshot', { type, fullPage });

    const options: Record<string, unknown> = {
      type,
      fullPage,
    };

    if (screenshotPath) {
      options.path = screenshotPath;
    }

    if (type === 'jpeg' && quality !== undefined) {
      options.quality = quality;
    }

    if (clip) {
      options.clip = clip;
    }

    const screenshot = await page.screenshot(options);

    logger.info('Screenshot taken', { type, fullPage, hasPath: !!screenshotPath });

    return createSuccessResponse(id, {
      success: true,
      path: screenshotPath,
      data: screenshotPath ? undefined : screenshot.toString('base64'),
      format: type,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Screenshot failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Screenshot failed: ${err.message}`);
  }
}

export async function handleElementScreenshot(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'selector', type: 'string', required: true },
    { name: 'path', type: 'string', required: false },
    { name: 'type', type: 'string', required: false },
    { name: 'quality', type: 'number', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for elementScreenshot', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    selector,
    path: screenshotPath,
    type = 'png',
    quality,
  } = params as { selector: string; path?: string; type?: 'png' | 'jpeg'; quality?: number };

  try {
    logger.debug('Taking element screenshot', { selector, type });

    const element = await page.$(selector);
    if (!element) {
      return createErrorResponse(id, ErrorCode.NotFound, `Element not found: ${selector}`);
    }

    const options: Record<string, unknown> = {
      type,
    };

    if (screenshotPath) {
      options.path = screenshotPath;
    }

    if (type === 'jpeg' && quality !== undefined) {
      options.quality = quality;
    }

    const screenshot = await element.screenshot(options);

    logger.info('Element screenshot taken', { selector, type });

    return createSuccessResponse(id, {
      success: true,
      selector,
      path: screenshotPath,
      data: screenshotPath ? undefined : screenshot.toString('base64'),
      format: type,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Element screenshot failed', { selector, error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `Element screenshot failed: ${err.message}`
    );
  }
}

export async function handlePdf(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'path', type: 'string', required: false },
    { name: 'format', type: 'string', required: false },
    { name: 'printBackground', type: 'boolean', required: false },
    { name: 'margin', type: 'object', required: false },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for pdf', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const {
    path: pdfPath,
    format = 'A4',
    printBackground = true,
    margin,
  } = params as {
    path?: string;
    format?: string;
    printBackground?: boolean;
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
  };

  try {
    logger.debug('Generating PDF', { format });

    const options: Record<string, unknown> = {
      format,
      printBackground,
    };

    if (pdfPath) {
      options.path = pdfPath;
    }

    if (margin) {
      options.margin = margin;
    }

    const pdf = await page.pdf(options);

    logger.info('PDF generated', { format, hasPath: !!pdfPath });

    return createSuccessResponse(id, {
      success: true,
      path: pdfPath,
      data: pdfPath ? undefined : pdf.toString('base64'),
      format,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('PDF generation failed', { error: err.message });

    return createErrorResponse(
      id,
      ErrorCode.InternalError,
      `PDF generation failed: ${err.message}`
    );
  }
}

export async function handleViewport(
  id: string | number,
  params: Record<string, unknown>,
  page: Page,
  logger: Logger
): Promise<JsonRpcResponse> {
  const validation = validateParams(params, [
    { name: 'width', type: 'number', required: true },
    { name: 'height', type: 'number', required: true },
  ]);

  if (!validation.valid) {
    logger.warn('Invalid parameters for viewport', { errors: validation.errors });
    return createErrorResponse(
      id,
      ErrorCode.InvalidParams,
      'Invalid parameters',
      validation.errors
    );
  }

  const { width, height } = params as { width: number; height: number };

  try {
    logger.debug('Setting viewport', { width, height });

    await page.setViewportSize({ width, height });

    logger.info('Viewport set', { width, height });

    return createSuccessResponse(id, {
      success: true,
      viewport: { width, height },
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Set viewport failed', { error: err.message });

    return createErrorResponse(id, ErrorCode.InternalError, `Set viewport failed: ${err.message}`);
  }
}
