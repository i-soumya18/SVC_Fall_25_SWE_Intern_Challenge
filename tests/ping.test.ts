import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';

describe('GET /api/ping', () => {
  const app = createServer();

  it('should return ping response with default message', async () => {
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.body).toEqual({
      message: 'test ping' // From our test environment setup
    });
  });

  it('should return JSON content type', async () => {
    const response = await request(app)
      .get('/api/ping')
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('message');
  });

  it('should handle ping endpoint without authentication', async () => {
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.body.message).toBeDefined();
  });

  it('should be consistent across multiple requests', async () => {
    const responses = await Promise.all([
      request(app).get('/api/ping'),
      request(app).get('/api/ping'),
      request(app).get('/api/ping')
    ]);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('test ping');
    });
  });
});
