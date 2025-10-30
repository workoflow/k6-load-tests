/**
 * Shared constants used across the k6 load testing suite
 */

// Bot Framework Activity Types
export const ActivityTypes = {
  MESSAGE: 'message',
  CONVERSATION_UPDATE: 'conversationUpdate',
  EVENT: 'event',
  INVOKE: 'invoke',
};

// Bot Framework Roles
export const Roles = {
  USER: 'user',
  BOT: 'bot',
  CLIENT: 'client',
};

// Conversation Types
export const ConversationTypes = {
  PERSONAL: 'personal',
  GROUP: 'group',
  CHANNEL: 'channel',
};

// Text Formats
export const TextFormats = {
  PLAIN: 'plain',
  MARKDOWN: 'markdown',
};

// Default values for Bot Framework Activities
export const Defaults = {
  TEXT_FORMAT: 'plain',
  LOCALE: 'en-US',
  CONVERSATION_TYPE: 'personal',
  USER_ROLE: 'user',
  BOT_ROLE: 'bot',
};

// HTTP Headers
export const Headers = {
  CONTENT_TYPE: 'application/json',
  AUTHORIZATION: 'Authorization',
};

// Bot Framework Endpoints
export const Endpoints = {
  TEAMS_SERVICE_URL: 'https://smba.trafficmanager.net/teams',
  BOT_CONNECTOR: 'https://api.botframework.com',
};

export default {
  ActivityTypes,
  Roles,
  ConversationTypes,
  TextFormats,
  Defaults,
  Headers,
  Endpoints,
};
