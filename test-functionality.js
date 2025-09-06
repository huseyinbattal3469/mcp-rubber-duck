#!/usr/bin/env node

// Test script for MCP Rubber Duck functionality - Environment Variables Only
import 'dotenv/config';

console.log('🦆 Testing MCP Rubber Duck Functionality (ENV ONLY)\n');
console.log('API Keys loaded from .env:');
console.log(`- OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`- Gemini: ${process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`- OpenRouter: ${process.env.OPENROUTER_API_KEY ? '✅ Found' : '❌ Missing'}`);
console.log(`- Ollama: ${process.env.OLLAMA_BASE_URL ? '✅ Found' : '❌ Missing'}\n`);

// Mock ConfigManager to prevent loading config.json
class EnvOnlyConfigManager {
  constructor() {
    this.config = this.loadFromEnvOnly();
  }
  
  loadFromEnvOnly() {
    const config = {
      log_level: process.env.LOG_LEVEL || 'info',
      default_provider: process.env.DEFAULT_PROVIDER || 'openai',
      cache_ttl: parseInt(process.env.CACHE_TTL || '300'),
      providers: {}
    };

    // Add providers based on environment variables only
    if (process.env.OPENAI_API_KEY) {
      config.providers.openai = {
        api_key: process.env.OPENAI_API_KEY,
        base_url: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        default_model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
        nickname: process.env.OPENAI_NICKNAME || 'OpenAI Duck',
        temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.TIMEOUT || '30000'),
        max_retries: parseInt(process.env.MAX_RETRIES || '3'),
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
      };
    }

    if (process.env.GEMINI_API_KEY) {
      config.providers.gemini = {
        api_key: process.env.GEMINI_API_KEY,
        base_url: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        default_model: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash',
        nickname: process.env.GEMINI_NICKNAME || 'Gemini Duck',
        temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.TIMEOUT || '30000'),
        max_retries: parseInt(process.env.MAX_RETRIES || '3'),
        models: ['gemini-1.5-flash', 'gemini-1.5-pro']
      };
    }

    if (process.env.OPENROUTER_API_KEY) {
      config.providers.openrouter = {
        api_key: process.env.OPENROUTER_API_KEY,
        base_url: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        default_model: process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-flash-1.5-8b:free',
        nickname: process.env.OPENROUTER_NICKNAME || 'OpenRouter Duck',
        temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.TIMEOUT || '30000'),
        max_retries: parseInt(process.env.MAX_RETRIES || '3'),
        models: ['google/gemini-flash-1.5-8b:free', 'meta-llama/llama-3.2-3b-instruct:free']
      };
    }

    if (process.env.OLLAMA_BASE_URL) {
      config.providers.ollama = {
        base_url: process.env.OLLAMA_BASE_URL,
        default_model: process.env.OLLAMA_DEFAULT_MODEL || 'llama3',
        nickname: process.env.OLLAMA_NICKNAME || 'Local Quacker',
        temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.TIMEOUT || '30000'),
        max_retries: parseInt(process.env.MAX_RETRIES || '3'),
        models: ['llama3', 'gemma3:4b', 'granite3.3:2b']
      };
    }

    return config;
  }
  
  getConfig() {
    return this.config;
  }
}

async function runTests() {
  try {
    // Initialize managers with environment-only config
    const configManager = new EnvOnlyConfigManager();
    
    // Import the actual modules after mocking
    const { ProviderManager } = await import('./dist/providers/manager.js');
    const { ConversationManager } = await import('./dist/services/conversation.js');
    const { ResponseCache } = await import('./dist/services/cache.js');
    const { HealthMonitor } = await import('./dist/services/health.js');

    // Import tools
    const { askDuckTool } = await import('./dist/tools/ask-duck.js');
    const { listDucksTool } = await import('./dist/tools/list-ducks.js');
    const { listModelsTool } = await import('./dist/tools/list-models.js');
    const { compareDucksTool } = await import('./dist/tools/compare-ducks.js');
    const { duckCouncilTool } = await import('./dist/tools/duck-council.js');
    const { chatDuckTool } = await import('./dist/tools/chat-duck.js');
    
    const providerManager = new ProviderManager(configManager);
    const conversationManager = new ConversationManager();
    const cache = new ResponseCache(configManager.getConfig().cache_ttl);
    const healthMonitor = new HealthMonitor(providerManager);

    console.log(`📋 Using ${Object.keys(configManager.getConfig().providers).length} providers from .env file only\n`);

    // Test 1: List all ducks
    console.log('📋 Test 1: List all ducks');
    const ducksResult = await listDucksTool(providerManager, healthMonitor, { check_health: false });
    console.log(ducksResult.content[0].text);
    console.log('\n---\n');

    // Test 2: Check health of all ducks
    console.log('🏥 Test 2: Health check');
    await healthMonitor.performHealthChecks();
    const healthyProviders = healthMonitor.getHealthyProviders();
    console.log(`Healthy providers: ${healthyProviders.join(', ')}`);
    console.log('\n---\n');

    // Test 3: List models for all providers
    console.log('📚 Test 3: List available models');
    const modelsResult = await listModelsTool(providerManager, {});
    console.log(modelsResult.content[0].text);
    console.log('\n---\n');

    // Test 4: Ask OpenAI
    console.log('🦆 Test 4: Ask OpenAI');
    try {
      const openaiResult = await askDuckTool(providerManager, cache, {
        prompt: 'What is 2+2? Answer in one word.',
        provider: 'openai'
      });
      console.log(openaiResult.content[0].text);
    } catch (error) {
      console.error(`OpenAI error: ${error.message}`);
    }
    console.log('\n---\n');

    // Test 5: Ask Gemini
    console.log('🦆 Test 5: Ask Gemini');
    try {
      const geminiResult = await askDuckTool(providerManager, cache, {
        prompt: 'What is 3+3? Answer in one word.',
        provider: 'gemini'
      });
      console.log(geminiResult.content[0].text);
    } catch (error) {
      console.error(`Gemini error: ${error.message}`);
    }
    console.log('\n---\n');

    // Test 6: Compare ducks
    console.log('🔍 Test 6: Compare ducks');
    try {
      const compareResult = await compareDucksTool(providerManager, cache, {
        prompt: 'What is the capital of France? Answer in one word.'
      });
      console.log(compareResult.content[0].text);
    } catch (error) {
      console.error(`Compare error: ${error.message}`);
    }
    console.log('\n---\n');

    // Test 7: Duck council
    console.log('🏛️ Test 7: Duck council');
    try {
      const councilResult = await duckCouncilTool(providerManager, {
        prompt: 'What is the meaning of life? Answer in exactly 5 words.'
      });
      console.log(councilResult.content[0].text);
    } catch (error) {
      console.error(`Council error: ${error.message}`);
    }
    console.log('\n---\n');

    // Test 8: Chat with context
    console.log('💬 Test 8: Chat with context');
    try {
      // First message
      await chatDuckTool(providerManager, conversationManager, {
        conversation_id: 'test-chat',
        message: 'My name is Alice.',
        provider: 'openai'
      });
      
      // Second message using context
      const chatResult = await chatDuckTool(providerManager, conversationManager, {
        conversation_id: 'test-chat',
        message: 'What is my name?'
      });
      console.log(chatResult.content[0].text);
    } catch (error) {
      console.error(`Chat error: ${error.message}`);
    }
    console.log('\n---\n');

    // Test 9: Test specific model
    console.log('🎯 Test 9: Test specific model');
    try {
      const modelResult = await askDuckTool(providerManager, cache, {
        prompt: 'Say hello',
        provider: 'openai',
        model: 'gpt-4o-mini'
      });
      console.log(modelResult.content[0].text);
    } catch (error) {
      console.error(`Model test error: ${error.message}`);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('Fatal error:', error);
  }
  
  process.exit(0);
}

// Run tests
runTests().catch(console.error);