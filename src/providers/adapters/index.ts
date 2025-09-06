import { OpenRouterAdapter } from './OpenRouterAdapter.js';
import { OpenAIAdapter } from './OpenAIAdapter.js';
import { OllamaAdapter } from './OllamaAdapter.js';
import { ProviderAdapter } from './ProviderAdapter.js';
import { ProviderConfig } from '../../config/types.js';

export function createProviderAdapter(config: ProviderConfig): ProviderAdapter | undefined {
  switch (config.type) {
    case 'openrouter':
      return new OpenRouterAdapter(config);
    case 'openai':
      return new OpenAIAdapter(config);
    case 'ollama':
      return new OllamaAdapter(config);
    default:
      return undefined;
  }
}
