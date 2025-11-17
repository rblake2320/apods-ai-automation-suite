import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError';

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * JWT Utility Class
 * Handles token generation and verification
 */
export class JwtUtil {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

  /**
   * Generates a JWT access token
   * @param payload - Token payload containing user information
   * @returns Signed JWT token
   */
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'apods-backend',
      audience: 'apods-client',
    });
  }

  /**
   * Generates a refresh token
   * @param payload - Token payload containing user information
   * @returns Signed refresh token
   */
  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'apods-backend',
      audience: 'apods-client',
    });
  }

  /**
   * Generates both access and refresh tokens
   * @param payload - Token payload containing user information
   * @returns Object containing both tokens
   */
  static generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verifies and decodes a JWT access token
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws ApiError if token is invalid or expired
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'apods-backend',
        audience: 'apods-client',
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid token');
      }
      throw ApiError.unauthorized('Token verification failed');
    }
  }

  /**
   * Verifies and decodes a refresh token
   * @param token - Refresh token to verify
   * @returns Decoded token payload
   * @throws ApiError if token is invalid or expired
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'apods-backend',
        audience: 'apods-client',
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      throw ApiError.unauthorized('Refresh token verification failed');
    }
  }

  /**
   * Decodes a token without verifying its signature
   * Use with caution - for debugging purposes only
   * @param token - JWT token to decode
   * @returns Decoded token payload or null if invalid
   */
  static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extracts token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Extracted token or null
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}
