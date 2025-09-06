#!/usr/bin/env node

// Debug test for sensitive data masking
import { maskSensitiveData, maskSensitiveText } from './dist/utils/sensitive.js';

console.log('🔍 Debug: Testing field detection...\n');

const testData = {
  secret: 'topsecretvalue123',
  password: 'mypassword123',
  normalField: 'not masked'
};

console.log('Testing field detection:');
const sensitiveKeys = [
  'api_key', 'apikey', 'key', 'token', 'secret', 'password', 'auth',
  'authorization', 'bearer', 'jwt', 'access_token', 'refresh_token',
  'client_secret', 'private_key', 'passphrase'
];

for (const [key, value] of Object.entries(testData)) {
  const keyLower = key.toLowerCase();
  const isSensitive = sensitiveKeys.some(sensitiveKey => keyLower.includes(sensitiveKey));
  console.log(`- ${key} (${keyLower}): sensitive=${isSensitive}, type=${typeof value}`);
}

console.log('\nMasking result:');
const maskedData = maskSensitiveData(testData);
console.log(JSON.stringify(maskedData, null, 2));
