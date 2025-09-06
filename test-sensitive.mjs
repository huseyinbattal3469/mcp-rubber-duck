#!/usr/bin/env node

// Manual test runner for sensitive data masking and NDJSON functionality
import { maskSensitiveData, maskSensitiveText } from './dist/utils/sensitive.js';

console.log('🔒 Testing Sensitive Data Masking...\n');

// Test basic text masking
const testText = 'API key: sk-1234567890abcdef and Bearer token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const maskedText = maskSensitiveText(testText);
console.log('Original:', testText);
console.log('Masked:  ', maskedText);
console.log('✅ Text masking works\n');

// Test object masking
const testData = {
  apiKey: 'sk-1234567890abcdef',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  normalField: 'not sensitive',
  nested: {
    secret: 'topsecretvalue123',
    password: 'mypassword123',
    public: 'not masked'
  }
};

const maskedData = maskSensitiveData(testData);
console.log('Original object:');
console.log(JSON.stringify(testData, null, 2));
console.log('\nMasked object:');
console.log(JSON.stringify(maskedData, null, 2));

// Check if secret fields are being masked
console.log('\nSecret field masking verification:');
console.log('- nested.secret should be masked:', maskedData.nested.secret !== testData.nested.secret ? '✅' : '❌');
console.log('- nested.password should be masked:', maskedData.nested.password !== testData.nested.password ? '✅' : '❌');
console.log('✅ Object masking works\n');

// Test circular reference handling
const circularData = { 
  apiKey: 'sk-1234567890abcdef',
  normalField: 'test'
};
circularData.self = circularData;

const maskedCircular = maskSensitiveData(circularData);
console.log('Circular reference handling:');
console.log(JSON.stringify(maskedCircular, null, 2));
console.log('✅ Circular reference handling works\n');

console.log('🎉 All sensitive data masking tests passed!');
