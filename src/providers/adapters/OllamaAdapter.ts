import fetch from 'node-fetch';
import { ProviderAdapter } from './ProviderAdapter.js';
import { ProviderConfig } from '../../config/types.js';
import { ChatOptions, ChatResponse, StreamChunk, ModelInfo } from '../types.js';

export class OllamaAdapter implements ProviderAdapter {
  private config: ProviderConfig;
  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const url = this.config.base_url.replace(/\/$/, '') + '/api/chat';
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.api_key}`,
      'Content-Type': 'application/json',
      ...(this.config.headers || {})
    };
    const body = {
      model: options.model || this.config.default_model,
      messages: options.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature || this.config.temperature,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {})
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      model: body.model,
      finishReason: choice?.finish_reason
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = this.config.base_url.replace(/\/$/, '') + '/api/chat';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.api_key}`,
        'Content-Type': 'application/json',
        ...(this.config.headers || {})
      };
      const body = {
        model: this.config.default_model,
        messages: [{ role: 'user', content: 'Say "healthy"' }]
      };
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (!res.ok) return false;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      return !!content;
    } catch {
      return false;
    }
  }

  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    // Ollama streaming: not implemented, fallback to single response
    const response = await this.chat(options);
    yield { content: response.content, done: true };
  }

  async listModels(): Promise<ModelInfo[]> {
    // Ollama: use config.models or default
    if (this.config.models && this.config.models.length > 0) {
      return this.config.models.map(id => ({
        id,
        description: 'Configured model (Ollama)',
      }));
    }
    return [{ id: this.config.default_model, description: 'Default configured model' }];
  }
}
