import fetch from 'node-fetch';
import { ProviderConfig } from '../../config/types.js';
import { ChatOptions, ChatResponse, StreamChunk, ModelInfo } from '../types.js';
import { all } from '../../utils/logger.js';

export class OpenRouterAdapter {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const url = this.config.base_url.replace(/\/$/, '') + '/chat/completions';
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.api_key}`,
      'Content-Type': 'application/json',
      ...(this.config.headers || {})
    };
    const body = {
      model: options.model || this.config.default_model,
      messages: options.messages.map(m => ({ role: m.role, content: m.content }))
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
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
      const url = this.config.base_url.replace(/\/$/, '') + '/chat/completions';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.api_key}`,
        'Content-Type': 'application/json',
        ...(this.config.headers || {})
      };
      const body = {
        model: this.config.default_model,
        messages: [{ role: 'user', content: 'Say "healthy"' }]
      };
      
      try { all('OpenRouter health check', { url, model: this.config.default_model }); } catch (e) {}
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const txt = await res.text();
        try { 
          all('OpenRouter health check failed', { 
            url, 
            status: res.status, 
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: txt.slice(0, 2000) 
          }); 
        } catch (e) {}
        return false;
      }
      
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      const healthy = !!content;
      
      try { 
        all('OpenRouter health check result', { 
          healthy, 
          content: content?.slice(0, 100),
          model: body.model,
          usage: data.usage 
        }); 
      } catch (e) {}
      
      return healthy;
    } catch (error: any) {
      try { all('OpenRouter health check exception', { error: error.message, stack: error.stack?.slice(0, 1000) }); } catch (e) {}
      return false;
    }
  }

  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    // OpenRouter streaming: not implemented, fallback to single response
    const response = await this.chat(options);
    yield { content: response.content, done: true };
  }

  async listModels(): Promise<ModelInfo[]> {
    // OpenRouter does not provide a public models endpoint; use config.models
    if (this.config.models && this.config.models.length > 0) {
      return this.config.models.map(id => ({
        id,
        description: 'Configured model (OpenRouter)',
      }));
    }
    return [{ id: this.config.default_model, description: 'Default configured model' }];
  }
}
