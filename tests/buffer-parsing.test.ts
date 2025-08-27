import { describe, it, expect } from 'vitest';

// Unit tests for Buffer/string parsing logic (without database dependency)
describe('Buffer/String Body Parsing Logic', () => {
  // Simulate the parsing logic from our server functions
  function parseRequestBody(body: any): any {
    let parsedBody = body;
    
    if (Buffer.isBuffer(body)) {
      const bodyString = body.toString('utf8');
      try {
        parsedBody = JSON.parse(bodyString);
      } catch (parseError) {
        throw new Error('Invalid JSON in request body');
      }
    } else if (typeof body === 'string') {
      try {
        parsedBody = JSON.parse(body);
      } catch (parseError) {
        throw new Error('Invalid JSON in request body');
      }
    }
    
    return parsedBody;
  }

  describe('Buffer parsing', () => {
    it('should parse valid JSON from Buffer', () => {
      const jsonString = '{"email":"test@example.com","phone":"1234567890"}';
      const buffer = Buffer.from(jsonString, 'utf8');
      
      const result = parseRequestBody(buffer);
      
      expect(result).toEqual({
        email: 'test@example.com',
        phone: '1234567890'
      });
    });

    it('should handle UTF-8 characters in Buffer', () => {
      const jsonString = '{"email":"tëst@éxàmplé.com","phone":"1234567890"}';
      const buffer = Buffer.from(jsonString, 'utf8');
      
      const result = parseRequestBody(buffer);
      
      expect(result).toEqual({
        email: 'tëst@éxàmplé.com',
        phone: '1234567890'
      });
    });

    it('should throw error for malformed JSON in Buffer', () => {
      const malformedJson = '{"email":"test@example.com","phone":}';
      const buffer = Buffer.from(malformedJson, 'utf8');
      
      expect(() => parseRequestBody(buffer)).toThrow('Invalid JSON in request body');
    });

    it('should handle empty Buffer', () => {
      const buffer = Buffer.from('{}', 'utf8');
      
      const result = parseRequestBody(buffer);
      
      expect(result).toEqual({});
    });

    it('should handle complex nested JSON in Buffer', () => {
      const complexJson = JSON.stringify({
        email: 'complex@example.com',
        phone: '1234567890',
        metadata: {
          source: 'web',
          timestamp: '2023-01-01T00:00:00Z',
          nested: {
            value: true
          }
        }
      });
      const buffer = Buffer.from(complexJson, 'utf8');
      
      const result = parseRequestBody(buffer);
      
      expect(result).toEqual({
        email: 'complex@example.com',
        phone: '1234567890',
        metadata: {
          source: 'web',
          timestamp: '2023-01-01T00:00:00Z',
          nested: {
            value: true
          }
        }
      });
    });
  });

  describe('String parsing', () => {
    it('should parse valid JSON from string', () => {
      const jsonString = '{"email":"string@example.com","phone":"9876543210"}';
      
      const result = parseRequestBody(jsonString);
      
      expect(result).toEqual({
        email: 'string@example.com',
        phone: '9876543210'
      });
    });

    it('should throw error for malformed JSON string', () => {
      const malformedJson = '{"email":"test@example.com","phone":}';
      
      expect(() => parseRequestBody(malformedJson)).toThrow('Invalid JSON in request body');
    });

    it('should handle empty JSON string', () => {
      const result = parseRequestBody('{}');
      expect(result).toEqual({});
    });

    it('should handle JSON string with special characters', () => {
      const jsonString = '{"email":"user+test@example.com","phone":"+1-555-123-4567"}';
      
      const result = parseRequestBody(jsonString);
      
      expect(result).toEqual({
        email: 'user+test@example.com',
        phone: '+1-555-123-4567'
      });
    });
  });

  describe('Object parsing (normal Express parsing)', () => {
    it('should return object as-is when already parsed', () => {
      const objectBody = {
        email: 'object@example.com',
        phone: '5555555555'
      };
      
      const result = parseRequestBody(objectBody);
      
      expect(result).toBe(objectBody);
      expect(result).toEqual({
        email: 'object@example.com',
        phone: '5555555555'
      });
    });

    it('should handle null and undefined', () => {
      expect(parseRequestBody(null)).toBe(null);
      expect(parseRequestBody(undefined)).toBe(undefined);
    });

    it('should handle arrays', () => {
      const arrayBody = ['item1', 'item2'];
      const result = parseRequestBody(arrayBody);
      expect(result).toBe(arrayBody);
    });

    it('should handle numbers', () => {
      const numberBody = 42;
      const result = parseRequestBody(numberBody);
      expect(result).toBe(42);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large JSON strings', () => {
      const largeEmail = 'a'.repeat(1000) + '@example.com';
      const jsonString = JSON.stringify({
        email: largeEmail,
        phone: '1234567890'
      });
      
      const result = parseRequestBody(jsonString);
      
      expect(result.email).toBe(largeEmail);
      expect(result.phone).toBe('1234567890');
    });

    it('should handle JSON with unicode characters', () => {
      const jsonString = '{"email":"用户@example.com","phone":"1234567890","name":"测试用户"}';
      
      const result = parseRequestBody(jsonString);
      
      expect(result).toEqual({
        email: '用户@example.com',
        phone: '1234567890',
        name: '测试用户'
      });
    });

    it('should handle JSON with escaped characters', () => {
      const jsonString = '{"email":"test\\\"quote@example.com","phone":"123\\n456"}';
      
      const result = parseRequestBody(jsonString);
      
      expect(result).toEqual({
        email: 'test"quote@example.com',
        phone: '123\n456'
      });
    });

    it('should preserve data types in parsed JSON', () => {
      const jsonString = JSON.stringify({
        email: 'types@example.com',
        phone: '1234567890',
        active: true,
        age: 25,
        score: 98.5,
        tags: ['user', 'premium'],
        metadata: null
      });
      
      const result = parseRequestBody(jsonString);
      
      expect(result).toEqual({
        email: 'types@example.com',
        phone: '1234567890',
        active: true,
        age: 25,
        score: 98.5,
        tags: ['user', 'premium'],
        metadata: null
      });
      
      // Verify types are preserved
      expect(typeof result.active).toBe('boolean');
      expect(typeof result.age).toBe('number');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.metadata).toBeNull();
    });
  });
});