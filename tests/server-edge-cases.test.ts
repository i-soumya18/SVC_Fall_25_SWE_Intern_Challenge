import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';

describe('Server Edge Cases', () => {
  let originalPingMessage: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalPingMessage = process.env.PING_MESSAGE;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalPingMessage !== undefined) {
      process.env.PING_MESSAGE = originalPingMessage;
    } else {
      delete process.env.PING_MESSAGE;
    }
    
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it('should use default "ping" message when PING_MESSAGE env var is not set', async () => {
    delete process.env.PING_MESSAGE;
    
    const app = createServer();
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.body.message).toBe('ping');
  });

  it('should use PING_MESSAGE env var when set', async () => {
    process.env.PING_MESSAGE = 'custom ping message';
    
    const app = createServer();
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.body.message).toBe('custom ping message');
  });
});
