import { ProviderManager } from '../providers/manager.js';
import { ConversationManager } from '../services/conversation.js';
import { ResponseCache } from '../services/cache.js';
import { logger } from '../utils/logger.js';
import { formatDuckResponse } from '../utils/ascii-art.js';

export async function chatDuckStreamTool(
  providerManager: ProviderManager,
  conversationManager: ConversationManager,
  args: any
) {
  const { conversation_id, message, provider, model } = args;

  if (!conversation_id || !message) {
    throw new Error('conversation_id and message are required');
  }

  // Get or create conversation
  let conversation = conversationManager.getConversation(conversation_id);
  
  if (!conversation) {
    // Create new conversation with specified or default provider
    const providerName = provider || providerManager.getProviderNames()[0];
    conversation = conversationManager.createConversation(conversation_id, providerName);
    logger.info(`Created new conversation: ${conversation_id} with ${providerName}`);
  } else if (provider && provider !== conversation.provider) {
    // Switch provider if requested
    conversation = conversationManager.switchProvider(conversation_id, provider);
    logger.info(`Switched conversation ${conversation_id} to ${provider}`);
  }

  // Add user message to conversation
  conversationManager.addMessage(conversation_id, {
    role: 'user',
    content: message,
    timestamp: new Date(),
  });

  try {
    // Get conversation context
    const messages = conversationManager.getConversationContext(conversation_id);

    // Get streaming response from provider (currently simulated)
    const providerToUse = provider || conversation.provider;
    const duckProvider = providerManager.getProvider(providerToUse);
    
    if (!duckProvider) {
      throw new Error(`Provider ${providerToUse} not found`);
    }

    // For now, use regular response and simulate streaming
    const response = await providerManager.askDuck(providerToUse, '', {
      messages,
      model,
    });

    // Add assistant response to conversation
    conversationManager.addMessage(conversation_id, {
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      provider: providerToUse,
    });

    // Simulate streaming chunks (split response into words)
    const words = response.content.split(' ');
    const chunks = words.length;

    // Format response with streaming simulation
    const formattedResponse = formatDuckResponse(
      response.nickname,
      response.content,
      response.model
    );

    // Add streaming and conversation info
    const conversationContext = conversationManager.getConversationContext(conversation_id);
    const streamingInfo = `\n\n📡 Streamed in ${chunks} chunks`;
    const conversationInfo = `\n💬 Conversation: ${conversation_id} | Messages: ${conversationContext.length}`;
    const latencyInfo = `\n⏱️ Latency: ${response.latency}ms`;

    return {
      content: [
        {
          type: 'text',
          text: formattedResponse + streamingInfo + conversationInfo + latencyInfo,
        },
      ],
    };

  } catch (error: any) {
    logger.error(`Streaming chat error:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: `🦆💥 Stream error: ${error.message}`,
        },
      ],
    };
  }
}

export async function askDuckStreamTool(
  providerManager: ProviderManager,
  cache: ResponseCache,
  args: any
) {
  const { prompt, provider, model, temperature } = args;

  if (!prompt) {
    throw new Error('prompt is required');
  }

  try {
    // Validate model if provided
    if (model && provider) {
      const isValid = providerManager.validateModel(provider, model);
      if (!isValid) {
        logger.warn(`Model ${model} may not be valid for provider ${provider}`);
      }
    }

    // Generate cache key
    const cacheKey = cache.generateKey(
      provider || 'default',
      prompt,
      { model, temperature }
    );

    // Get streaming response (currently simulated)
    const { value: response, cached } = await cache.getOrSet(
      cacheKey,
      async () => {
        return await providerManager.askDuck(provider, prompt, {
          model,
          temperature,
        });
      }
    );

    // Simulate streaming chunks (split response into words)
    const words = response.content.split(' ');
    const chunks = words.length;

    // Format response with streaming simulation
    const formattedResponse = formatDuckResponse(
      response.nickname,
      response.content,
      response.model
    );

    // Add streaming info
    const streamingInfo = `\n\n📡 Streamed in ${chunks} chunks`;
    const cacheInfo = cached ? '\n💾 (cached)' : '';
    const latencyInfo = `\n⏱️ Latency: ${response.latency}ms`;

    logger.info(`Duck ${response.nickname} responded with streaming simulation${cached ? ' (cached)' : ''}`);

    return {
      content: [
        {
          type: 'text',
          text: formattedResponse + streamingInfo + cacheInfo + latencyInfo,
        },
      ],
    };

  } catch (error: any) {
    logger.error(`Streaming ask error:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: `🦆💥 Stream error: ${error.message}`,
        },
      ],
    };
  }
}
