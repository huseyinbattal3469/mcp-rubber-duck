// Sensitive data masking utility for logging
export function maskSensitiveData(obj: any, seen = new WeakSet()): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        // Apply pattern masking to string items in arrays
        return maskSensitiveText(item);
      } else {
        return maskSensitiveData(item, seen);
      }
    });
  }

  const sensitiveKeys = [
    'api_key', 'apikey', 'key', 'token', 'secret', 'password', 'auth',
    'authorization', 'bearer', 'jwt', 'access_token', 'refresh_token',
    'client_secret', 'private_key', 'passphrase'
  ];

  const masked: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitiveKey => 
      keyLower.includes(sensitiveKey)
    );

    if (typeof value === 'string') {
      // Always try pattern-based masking first
      const patternMasked = maskSensitiveText(value);
      if (patternMasked !== value) {
        // Pattern matched, use pattern-based masking
        masked[key] = patternMasked;
      } else if (isSensitive) {
        // No pattern matched but field is sensitive, apply simple masking
        if (value.length > 8) {
          masked[key] = `${value.slice(0, 2)}****...${value.slice(-3)}`;
        } else if (value.length > 4) {
          masked[key] = `${value.slice(0, 2)}****`;
        } else {
          masked[key] = '***';
        }
      } else {
        // Not sensitive and no pattern matched
        masked[key] = value;
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value, seen);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

export function maskSensitiveText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Mask common patterns in text/URLs
  const patterns = [
    // Bearer tokens with API keys - handle "Bearer sk-xxx" case first
    /(Bearer\s+sk-)([a-zA-Z0-9-]{4,})/gi,
    /(Bearer\s+pk-)([a-zA-Z0-9-]{4,})/gi,
    /(Bearer\s+or-)([a-zA-Z0-9-]{4,})/gi,
    // API keys starting with common prefixes - capture everything after prefix
    /(sk-)([a-zA-Z0-9-]{4,})/g,
    /(pk-)([a-zA-Z0-9-]{4,})/g, 
    /(or-)([a-zA-Z0-9-]{4,})/g,
    // Bearer tokens - capture the token part
    /(Bearer\s+)([a-zA-Z0-9-_.]{4,})/gi,
    // Basic auth - capture the encoded part
    /(Basic\s+)([a-zA-Z0-9+/=]{4,})/gi,
    // Long alphanumeric strings that might be keys
    /\b([a-fA-F0-9]{24,})\b/g,
  ];

  let maskedText = text;
  patterns.forEach(pattern => {
    maskedText = maskedText.replace(pattern, (match, prefix, token) => {
      if (prefix) {
        // Handle patterns with prefix (like "sk-", "Bearer ")
        if (prefix.toLowerCase().includes('bearer')) {
          // For Bearer tokens, mask everything after "Bearer " including the key prefix
          // Use 3 characters for short tokens, 4 for longer ones
          const suffixLength = token && token.length <= 8 ? 3 : 4;
          if (token && token.length > suffixLength) {
            return `Bearer ****...${token.slice(-suffixLength)}`;
          } else {
            return `Bearer ****`;
          }
        } else {
          // For API keys, keep the prefix visible
          if (token && token.length > 4) {
            return `${prefix}****...${token.slice(-4)}`;
          } else {
            return `${prefix}****`;
          }
        }
      } else {
        // Handle standalone tokens
        if (match.length > 8) {
          return `${match.slice(0, 4)}...${match.slice(-4)}`;
        } else {
          return '***';
        }
      }
    });
  });

  return maskedText;
}
