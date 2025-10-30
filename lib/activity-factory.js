/**
 * Bot Framework Activity Factory
 *
 * Creates properly formatted Bot Framework Activity objects
 * following the Bot Framework v4 schema.
 *
 * Reference: https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference
 */

import { v4 as uuidv4 } from 'uuid';
import { ActivityTypes, Roles, ConversationTypes, TextFormats, Defaults } from './constants.js';

/**
 * Creates a message activity for the Bot Framework
 *
 * @param {Object} options - Activity options
 * @param {string} options.text - Message text
 * @param {Object} options.from - Sender information
 * @param {string} options.from.id - Sender ID
 * @param {string} options.from.name - Sender name
 * @param {string} options.from.aadObjectId - Azure AD Object ID
 * @param {Object} options.recipient - Recipient (bot) information
 * @param {string} options.recipient.id - Bot ID
 * @param {string} options.recipient.name - Bot name
 * @param {Object} options.conversation - Conversation context
 * @param {string} options.conversation.id - Conversation ID
 * @param {string} options.conversation.conversationType - Type of conversation
 * @param {string} options.conversation.tenantId - Azure AD Tenant ID
 * @param {string} options.serviceUrl - Bot Framework service URL
 * @param {string} options.channelId - Channel identifier (default: 'msteams')
 * @returns {Object} Bot Framework Activity object
 */
export function createMessageActivity(options) {
  const {
    text,
    from,
    recipient,
    conversation,
    serviceUrl,
    channelId = 'msteams',
    textFormat = Defaults.TEXT_FORMAT,
    locale = Defaults.LOCALE,
  } = options;

  const activity = {
    type: ActivityTypes.MESSAGE,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    channelId: channelId,

    // Sender (User)
    from: {
      id: from.id,
      name: from.name,
      aadObjectId: from.aadObjectId,
      role: Roles.USER,
    },

    // Recipient (Bot)
    recipient: {
      id: recipient.id,
      name: recipient.name || 'Bot',
      role: Roles.BOT,
    },

    // Conversation Context
    conversation: {
      id: conversation.id || `test-conversation-${uuidv4()}`,
      conversationType: conversation.conversationType || ConversationTypes.PERSONAL,
      isGroup: conversation.conversationType === ConversationTypes.GROUP ||
               conversation.conversationType === ConversationTypes.CHANNEL,
      tenantId: conversation.tenantId,
    },

    // Message Content
    text: text,
    textFormat: textFormat,
    locale: locale,

    // Service URL (required for bot to send replies)
    serviceUrl: serviceUrl,

    // Channel-specific data (Teams)
    channelData: {
      teamsChannelId: conversation.teamsChannelId,
      teamsTeamId: conversation.teamsTeamId,
      tenant: conversation.tenantId ? {
        id: conversation.tenantId,
      } : undefined,
    },
  };

  return activity;
}

/**
 * Creates a simple test message activity with minimal required fields
 *
 * @param {Object} config - Configuration object
 * @param {string} message - Message text (default: 'test')
 * @returns {Object} Bot Framework Activity object
 */
export function createTestActivity(config, message = 'test') {
  return createMessageActivity({
    text: message,
    from: {
      id: config.testUser.id,
      name: config.testUser.name,
      aadObjectId: config.testUser.aadObjectId,
    },
    recipient: {
      id: config.credentials.appId,
      name: 'Workoflow Bot',
    },
    conversation: {
      id: `test-conversation-${uuidv4()}`,
      conversationType: ConversationTypes.PERSONAL,
      tenantId: config.credentials.tenantId,
    },
    serviceUrl: config.serviceUrl,
  });
}

export default {
  createMessageActivity,
  createTestActivity,
};
