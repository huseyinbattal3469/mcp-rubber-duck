import { describe, it, expect } from '@jest/globals';
import { maskSensitiveData, maskSensitiveText } from '../src/utils/sensitive';

describe('Sensitive Data Masking', () => {
  describe('maskSensitiveText', () => {
    it('should mask OpenAI API keys', () => {
      const text = 'API key: sk-1234567890abcdef';
      const masked = maskSensitiveText(text);
      expect(masked).toBe('API key: sk-****...cdef');
    });

    it('should mask Bearer tokens', () => {
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const masked = maskSensitiveText(text);
      expect(masked).toBe('Authorization: Bearer ****...VCJ9');
    });

    it('should mask basic auth credentials', () => {
      const text = 'Authorization: Basic dXNlcjpwYXNzd29yZA==';
      const masked = maskSensitiveText(text);
      expect(masked).toBe('Authorization: Basic ****...ZA==');
    });

    it('should mask multiple API keys in same text', () => {
      const text = 'Key1: sk-1234567890abcdef and Key2: sk-abcdef1234567890';
      const masked = maskSensitiveText(text);
      expect(masked).toBe('Key1: sk-****...cdef and Key2: sk-****...7890');
    });

    it('should not mask short strings', () => {
      const text = 'sk-abc';
      const masked = maskSensitiveText(text);
      expect(masked).toBe(text); // Too short to mask
    });

    it('should handle empty or null text', () => {
      expect(maskSensitiveText('')).toBe('');
      expect(maskSensitiveText(null as any)).toBe(null);
      expect(maskSensitiveText(undefined as any)).toBe(undefined);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask API keys in object properties', () => {
      const data = {
        apiKey: 'sk-1234567890abcdef',
        userToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        normalField: 'not sensitive'
      };

      const masked = maskSensitiveData(data);

      expect(masked.apiKey).toBe('sk-****...cdef');
      expect(masked.userToken).toBe('Bearer ****...VCJ9');
      expect(masked.normalField).toBe('not sensitive');
    });

    it('should mask authorization headers', () => {
      const data = {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          'Content-Type': 'application/json'
        }
      };

      const masked = maskSensitiveData(data);

      expect(masked.headers['Authorization']).toBe('Bearer ****...VCJ9');
      expect(masked.headers['Content-Type']).toBe('application/json');
    });

    it('should handle nested objects', () => {
      const data = {
        config: {
          auth: {
            token: 'sk-1234567890abcdef',
            secret: 'mysecret123'
          },
          settings: {
            debug: true
          }
        }
      };

      const masked = maskSensitiveData(data);

      expect(masked.config.auth.token).toBe('sk-****...cdef');
      expect(masked.config.auth.secret).toBe('my****...123');
      expect(masked.config.settings.debug).toBe(true);
    });

    it('should handle arrays', () => {
      const data = {
        tokens: [
          'sk-1234567890abcdef',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          'not-sensitive'
        ]
      };

      const masked = maskSensitiveData(data);

      expect(masked.tokens[0]).toBe('sk-****...cdef');
      expect(masked.tokens[1]).toBe('Bearer ****...VCJ9');
      expect(masked.tokens[2]).toBe('not-sensitive');
    });

    it('should not modify original object', () => {
      const data = {
        apiKey: 'sk-1234567890abcdef'
      };

      const masked = maskSensitiveData(data);

      expect(data.apiKey).toBe('sk-1234567890abcdef'); // Original unchanged
      expect(masked.apiKey).toBe('sk-****...cdef'); // Masked copy
    });

    it('should handle null and undefined values', () => {
      const data = {
        apiKey: null,
        token: undefined,
        value: 'sk-1234567890abcdef'
      };

      const masked = maskSensitiveData(data);

      expect(masked.apiKey).toBe(null);
      expect(masked.token).toBe(undefined);
      expect(masked.value).toBe('sk-****...cdef');
    });

    it('should handle circular references gracefully', () => {
      const data: any = {
        apiKey: 'sk-1234567890abcdef'
      };
      data.self = data; // Create circular reference

      const masked = maskSensitiveData(data);

      expect(masked.apiKey).toBe('sk-****...cdef');
      expect(masked.self).toBe('[Circular Reference]');
    });

    it('should mask common sensitive field names', () => {
      const data = {
        password: 'secretpassword123',
        secret: 'topsecret',
        private_key: 'private-key-data',
        access_token: 'access-token-123',
        api_key: 'sk-1234567890abcdef',
        auth_token: 'Bearer token123'
      };

      const masked = maskSensitiveData(data);

      expect(masked.password).toBe('se****...123');
      expect(masked.secret).toBe('to****...ret');
      expect(masked.private_key).toBe('pr****...ata');
      expect(masked.access_token).toBe('ac****...123');
      expect(masked.api_key).toBe('sk-****...cdef');
      expect(masked.auth_token).toBe('Bearer ****...123');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long API keys', () => {
      const longKey = 'sk-' + 'a'.repeat(100) + 'xyz';
      const masked = maskSensitiveText(longKey);
      expect(masked).toBe('sk-****...axyz');
    });

    it('should handle malformed tokens gracefully', () => {
      const text = 'Bearer invalid-token-format';
      const masked = maskSensitiveText(text);
      expect(masked).toBe('Bearer ****...rmat');
    });

    it('should preserve JSON structure in logs', () => {
      const data = {
        request: {
          url: 'https://api.openai.com/v1/chat',
          headers: {
            'Authorization': 'Bearer sk-1234567890abcdef'
          }
        },
        response: {
          status: 200,
          data: 'success'
        }
      };

      const masked = maskSensitiveData(data);

      expect(masked.request.url).toBe('https://api.openai.com/v1/chat');
      expect(masked.request.headers['Authorization']).toBe('Bearer ****...cdef');
      expect(masked.response.status).toBe(200);
      expect(masked.response.data).toBe('success');
    });
  });
});
