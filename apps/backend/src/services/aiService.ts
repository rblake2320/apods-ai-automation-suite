import Anthropic from '@anthropic-ai/sdk';
import { ApiError } from '../utils/ApiError';
import { AIPromptConfig } from '../types';
import logger from '../utils/logger';
import { env } from '../config/env';

/**
 * AI Service
 * Handles Anthropic AI integration
 */
export class AIService {
  private static client: Anthropic | null = null;

  /**
   * Gets or creates the Anthropic client
   * @returns Anthropic client
   */
  private static getClient(): Anthropic {
    if (!env.ANTHROPIC_API_KEY) {
      throw ApiError.serviceUnavailable(
        'Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.'
      );
    }

    if (!this.client) {
      this.client = new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });
    }

    return this.client;
  }

  /**
   * Sends a prompt to Claude and gets a response
   * @param prompt - User prompt
   * @param config - AI configuration
   * @returns AI response
   */
  static async sendPrompt(prompt: string, config: AIPromptConfig = {}): Promise<string> {
    try {
      const client = this.getClient();

      logger.info('Sending prompt to Anthropic AI');

      const response = await client.messages.create({
        model: config.model || env.ANTHROPIC_MODEL,
        max_tokens: config.maxTokens || 1024,
        temperature: config.temperature || 1.0,
        system: config.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === 'text');

      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from AI');
      }

      logger.info('Received response from Anthropic AI');

      return textContent.text;
    } catch (error: any) {
      logger.error('Anthropic AI request failed:', error);
      if (error.status === 401) {
        throw ApiError.unauthorized('Invalid Anthropic API key');
      }
      if (error.status === 429) {
        throw ApiError.tooManyRequests('Anthropic API rate limit exceeded');
      }
      throw ApiError.internal(`AI request failed: ${error.message}`);
    }
  }

  /**
   * Generates code based on a description
   * @param description - Description of what the code should do
   * @param language - Programming language
   * @returns Generated code
   */
  static async generateCode(description: string, language = 'javascript'): Promise<string> {
    const prompt = `Generate ${language} code for the following task:\n\n${description}\n\nProvide only the code without explanations.`;

    const systemPrompt = `You are an expert ${language} programmer. Generate clean, efficient, and well-documented code. Include only the code in your response, no explanations or markdown formatting.`;

    return this.sendPrompt(prompt, { systemPrompt });
  }

  /**
   * Analyzes code and provides suggestions
   * @param code - Code to analyze
   * @param language - Programming language
   * @returns Analysis and suggestions
   */
  static async analyzeCode(code: string, language = 'javascript'): Promise<string> {
    const prompt = `Analyze the following ${language} code and provide suggestions for improvement:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const systemPrompt = `You are an expert code reviewer. Provide constructive feedback on code quality, performance, security, and best practices.`;

    return this.sendPrompt(prompt, { systemPrompt });
  }

  /**
   * Executes a custom task using AI
   * @param taskDescription - Description of the task
   * @param config - Task configuration
   * @returns Task result
   */
  static async executeCustomTask(
    taskDescription: string,
    config: Record<string, any> = {}
  ): Promise<any> {
    try {
      logger.info('Executing custom task with AI');

      const prompt = `Execute the following task:\n\n${taskDescription}\n\nProvide a structured response with the results.`;

      const systemPrompt =
        config.systemPrompt ||
        'You are a helpful AI assistant that executes tasks and provides structured responses.';

      const response = await this.sendPrompt(prompt, {
        systemPrompt,
        maxTokens: config.maxTokens || 2048,
        temperature: config.temperature,
      });

      // Try to parse as JSON if possible
      try {
        return JSON.parse(response);
      } catch {
        return { result: response };
      }
    } catch (error: any) {
      logger.error('Custom task execution failed:', error);
      throw ApiError.internal(`Custom task failed: ${error.message}`);
    }
  }

  /**
   * Generates test data based on a schema
   * @param schema - Data schema description
   * @param count - Number of records to generate
   * @returns Generated test data
   */
  static async generateTestData(schema: string, count = 10): Promise<any[]> {
    const prompt = `Generate ${count} sample data records based on this schema:\n\n${schema}\n\nReturn only a valid JSON array.`;

    const systemPrompt =
      'You are a test data generator. Generate realistic, diverse test data in valid JSON format.';

    const response = await this.sendPrompt(prompt, {
      systemPrompt,
      maxTokens: 2048,
    });

    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      throw ApiError.internal('Failed to parse generated test data');
    }
  }

  /**
   * Translates text between languages
   * @param text - Text to translate
   * @param targetLanguage - Target language
   * @param sourceLanguage - Source language (optional)
   * @returns Translated text
   */
  static async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    const sourceLang = sourceLanguage ? `from ${sourceLanguage} ` : '';
    const prompt = `Translate the following text ${sourceLang}to ${targetLanguage}:\n\n${text}\n\nProvide only the translation.`;

    const systemPrompt = 'You are a professional translator. Provide accurate translations.';

    return this.sendPrompt(prompt, { systemPrompt });
  }

  /**
   * Summarizes text
   * @param text - Text to summarize
   * @param maxLength - Maximum summary length
   * @returns Summary
   */
  static async summarizeText(text: string, maxLength = 200): Promise<string> {
    const prompt = `Summarize the following text in approximately ${maxLength} words:\n\n${text}`;

    const systemPrompt =
      'You are a skilled summarizer. Create concise, accurate summaries that capture the main points.';

    return this.sendPrompt(prompt, { systemPrompt, maxTokens: 1024 });
  }

  /**
   * Extracts structured data from unstructured text
   * @param text - Unstructured text
   * @param structure - Desired structure description
   * @returns Structured data
   */
  static async extractStructuredData(text: string, structure: string): Promise<any> {
    const prompt = `Extract the following information from the text and return as JSON:\n\nStructure: ${structure}\n\nText: ${text}\n\nReturn only valid JSON.`;

    const systemPrompt =
      'You are a data extraction expert. Extract information accurately and return it in valid JSON format.';

    const response = await this.sendPrompt(prompt, {
      systemPrompt,
      maxTokens: 1024,
    });

    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      throw ApiError.internal('Failed to parse extracted data');
    }
  }
}
