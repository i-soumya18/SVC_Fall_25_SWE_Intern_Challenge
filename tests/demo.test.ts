import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';

describe('GET /api/demo', () => {
  const app = createServer();

  it('should return demo response with expected message', async () => {
    const response = await request(app)
      .get('/api/demo')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Hello from Express server'
    });
  });

  it('should return JSON content type', async () => {
    const response = await request(app)
      .get('/api/demo')
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });

  it('should handle demo endpoint without authentication', async () => {
    const response = await request(app)
      .get('/api/demo')
      .expect(200);

    expect(response.body.message).toBe('Hello from Express server');
  });

  it('should respond quickly', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/demo')
      .expect(200);
    
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(100); // Should respond within 100ms
  });

  it('should handle multiple concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, () => 
      request(app).get('/api/demo')
    );

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Hello from Express server');
    });
  });
});
