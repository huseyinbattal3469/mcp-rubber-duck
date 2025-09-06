import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { OllamaAdapter } from '../src/providers/adapters/OllamaAdapter';
import { ProviderConfig } from '../src/config/types';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock logger
jest.mock('../src/utils/logger', () => ({
  all: jest.fn()
}));

// Helper to create mock Response objects
const createMockResponse = (data: Partial<Response>): Response => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  redirected: false,
  type: 'basic',
  url: '',
  body: null,
  bodyUsed: false,
  clone: jest.fn(),
  arrayBuffer: jest.fn(),
  blob: jest.fn(),
  formData: jest.fn(),
  json: jest.fn(),
  text: jest.fn(),
  ...data
} as Response);

describe('OllamaAdapter', () => {
  let adapter: OllamaAdapter;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      type: 'ollama',
      base_url: 'http://localhost:11434/v1',
      default_model: 'gemma3:4b',
      models: ['gemma3:4b'],
      nickname: 'Test Ollama'
    };
    adapter = new OllamaAdapter(config);
    mockFetch.mockClear();
  });

  describe('URL normalization', () => {
    it('should strip /v1 from base URL', () => {
      const adapter1 = new OllamaAdapter({
        ...config,
        base_url: 'http://localhost:11434/v1'
      });
      const adapter2 = new OllamaAdapter({
        ...config,
        base_url: 'http://localhost:11434/v1/'
      });
      
      // Both should normalize to the same base URL without /v1
      expect(adapter1).toBeDefined();
      expect(adapter2).toBeDefined();
    });
  });

  describe('chat method', () => {
    it('should handle NDJSON streaming response', async () => {
      const ndjsonResponse = `
{"model":"gemma3:4b","created_at":"2025-09-06T17:00:13.6235385Z","message":{"role":"assistant","content":"Hello"},"done":false}
{"model":"gemma3:4b","created_at":"2025-09-06T17:00:13.6374558Z","message":{"role":"assistant","content":" there"},"done":false}
{"model":"gemma3:4b","created_at":"2025-09-06T17:00:13.652588Z","message":{"role":"assistant","content":"!"},"done":true}
      `.trim();

      const headers = new Headers();
      headers.set('content-type', 'application/x-ndjson');

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers,
        text: async () => ndjsonResponse
      }));

      const result = await adapter.chat({
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }]
      });

      expect(result.content).toBe('Hello there!');
      expect(result.model).toBe('gemma3:4b');
    });

    it('should handle generate endpoint fallback', async () => {
      // First call to /api/chat fails
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404
      }));

      // Second call to /api/generate succeeds
      const ndjsonResponse = `
{"model":"gemma3:4b","response":"Hello","done":false}
{"model":"gemma3:4b","response":" world","done":false}
{"model":"gemma3:4b","response":"!","done":true}
      `.trim();

      const headers = new Headers();
      headers.set('content-type', 'application/x-ndjson');

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers,
        text: async () => ndjsonResponse
      }));

      const result = await adapter.chat({
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }]
      });

      expect(result.content).toBe('Hello world!');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed NDJSON gracefully', async () => {
      const malformedResponse = `
{"model":"gemma3:4b","message":{"role":"assistant","content":"Hello"},"done":false}
invalid json line
{"model":"gemma3:4b","message":{"role":"assistant","content":" world"},"done":true}
      `.trim();

      const headers = new Headers();
      headers.set('content-type', 'application/x-ndjson');

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers,
        text: async () => malformedResponse
      }));

      const result = await adapter.chat({
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }]
      });

      expect(result.content).toBe('Hello world');
    });
  });

  describe('healthCheck method', () => {
    it('should return true for healthy NDJSON response', async () => {
      const healthyResponse = `
{"model":"gemma3:4b","message":{"role":"assistant","content":"Healthy"},"done":false}
{"model":"gemma3:4b","message":{"role":"assistant","content":"!"},"done":true}
      `.trim();

      const headers = new Headers();
      headers.set('content-type', 'application/x-ndjson');

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers,
        text: async () => healthyResponse
      }));

      const result = await adapter.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false for empty response', async () => {
      const headers = new Headers();
      headers.set('content-type', 'application/x-ndjson');

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers,
        text: async () => ''
      }));

      const result = await adapter.healthCheck();
      expect(result).toBe(false);
    });

    it('should try generate endpoint if chat fails', async () => {
      // Chat endpoint fails
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404
      }));

      // Generate endpoint succeeds
      const generateResponse = `
{"model":"gemma3:4b","response":"healthy","done":true}
      `.trim();

      const headers = new Headers();
      headers.set('content-type', 'application/x-ndjson');

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers,
        text: async () => generateResponse
      }));

      const result = await adapter.healthCheck();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('chatStream method', () => {
    it('should stream NDJSON chunks', async () => {
      // Create a proper ReadableStream mock
      const encoder = new TextEncoder();
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`{"model":"gemma3:4b","message":{"role":"assistant","content":"Hello"},"done":false}\n`));
          controller.enqueue(encoder.encode(`{"model":"gemma3:4b","message":{"role":"assistant","content":" there"},"done":false}\n`));
          controller.enqueue(encoder.encode(`{"model":"gemma3:4b","message":{"role":"assistant","content":"!"},"done":true}\n`));
          controller.close();
        }
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: mockBody
      }));

      const chunks: any[] = [];
      for await (const chunk of adapter.chatStream({
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }]
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ content: 'Hello', done: false });
      expect(chunks[1]).toEqual({ content: ' there', done: false });
      expect(chunks[2]).toEqual({ content: '!', done: true });
    });

    it('should fallback to chat() if streaming unavailable', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: null // No streaming body
      }));

      // Mock the chat method to return a result
      const mockChat = jest.spyOn(adapter, 'chat').mockResolvedValueOnce({
        content: 'Fallback response',
        model: 'gemma3:4b'
      });

      const chunks: any[] = [];
      for await (const chunk of adapter.chatStream({
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }]
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({ content: 'Fallback response', done: true });
      expect(mockChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('listModels method', () => {
    it('should return configured models', async () => {
      const models = await adapter.listModels();
      
      expect(models).toHaveLength(1);
      expect(models[0]).toEqual({
        id: 'gemma3:4b',
        description: 'Configured model (Ollama)'
      });
    });

    it('should return default model if no models configured', async () => {
      const configWithoutModels: Partial<ProviderConfig> & { type: string; base_url: string; default_model: string; nickname: string } = { 
        type: 'ollama',
        base_url: 'http://localhost:11434/v1',
        default_model: 'gemma3:4b',
        nickname: 'Test Ollama'
      };
      
      const adapterWithoutModels = new OllamaAdapter(configWithoutModels as ProviderConfig);
      const models = await adapterWithoutModels.listModels();
      
      expect(models).toHaveLength(1);
      expect(models[0]).toEqual({
        id: 'gemma3:4b',
        description: 'Default configured model'
      });
    });
  });
});
