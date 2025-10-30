/**
 * Bot Framework Authentication Helper
 *
 * Uses Microsoft's botframework-connector library to generate
 * valid JWT tokens for authenticating with Bot Framework endpoints.
 *
 * Note: This file uses Node.js-specific modules and cannot be directly
 * imported into k6 scripts. Instead, use it via the helper scripts
 * or run it as a separate service.
 */

import { MicrosoftAppCredentials } from 'botframework-connector';

/**
 * Token cache to avoid regenerating tokens for each request
 * Tokens are cached per environment (appId + appPassword combination)
 */
const tokenCache = new Map();

/**
 * Gets a valid JWT token for Bot Framework authentication
 *
 * @param {string} appId - Microsoft App ID
 * @param {string} appPassword - Microsoft App Password
 * @param {string} audience - Token audience (optional)
 * @returns {Promise<string>} JWT Bearer token
 */
export async function getBotToken(appId, appPassword, audience = null) {
  const cacheKey = `${appId}:${appPassword}`;

  // Check cache for existing valid token
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minute buffer
    return cached.token;
  }

  try {
    // Create credentials using Microsoft's library
    const credentials = new MicrosoftAppCredentials(appId, appPassword);

    // Get token (this handles signing, expiration, etc.)
    const token = await credentials.getToken();

    // Cache the token (tokens are typically valid for 1 hour)
    tokenCache.set(cacheKey, {
      token: token,
      expiresAt: Date.now() + 3600000, // 1 hour in milliseconds
    });

    return token;
  } catch (error) {
    console.error('Error generating Bot Framework token:', error.message);
    throw new Error(`Failed to generate token: ${error.message}`);
  }
}

/**
 * Gets authorization header value with Bearer token
 *
 * @param {string} appId - Microsoft App ID
 * @param {string} appPassword - Microsoft App Password
 * @returns {Promise<string>} Authorization header value (e.g., "Bearer eyJ0...")
 */
export async function getAuthorizationHeader(appId, appPassword) {
  const token = await getBotToken(appId, appPassword);
  return `Bearer ${token}`;
}

/**
 * Clears the token cache
 * Useful for testing or forcing token refresh
 */
export function clearTokenCache() {
  tokenCache.clear();
}

/**
 * Gets token information (for debugging)
 *
 * @param {string} appId - Microsoft App ID
 * @param {string} appPassword - Microsoft App Password
 * @returns {Promise<Object>} Token information
 */
export async function getTokenInfo(appId, appPassword) {
  const token = await getBotToken(appId, appPassword);

  // Decode JWT token (basic decoding, no validation)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  return {
    token: token,
    tokenPreview: `${token.substring(0, 20)}...`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    issuer: payload.iss,
    audience: payload.aud,
    appId: payload.appid,
  };
}

export default {
  getBotToken,
  getAuthorizationHeader,
  clearTokenCache,
  getTokenInfo,
};
