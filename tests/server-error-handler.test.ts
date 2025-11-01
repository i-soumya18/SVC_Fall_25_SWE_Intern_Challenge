import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';
import { mockServer } from './setup-backend';
import { http, HttpResponse } from 'msw';

describe('Server Error Handler', () => {
  const app = createServer();

  it('should handle validation errors from Zod schemas', async () => {
    // Send invalid data to trigger Zod validation error
    const response = await request(app)
      .post('/api/social-qualify-form')
      .send({
        email: 'invalid-email', // Invalid email format
        phone: '123', // Too short
        redditUsername: '' // Empty required field
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
  });

  it('should handle missing required fields', async () => {
    const response = await request(app)
      .post('/api/contractor-request')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    // Try to create contractor request for non-existent user
    const response = await request(app)
      .post('/api/contractor-request')
      .send({
        email: 'nonexistent@example.com',
        companySlug: 'test-company',
        companyName: 'Test Company'
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('User not found');
  });

  it('should handle Reddit API failures', async () => {
    // Mock Reddit API to fail
    mockServer.use(
      http.post('https://www.reddit.com/api/v1/access_token', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const response = await request(app)
      .post('/api/social-qualify-form')
      .send({
        email: 'test-reddit-fail@example.com',
        phone: '1234567890',
        redditUsername: 'testuser'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return consistent error format', async () => {
    const response = await request(app)
      .post('/api/social-qualify-form')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('message');
    expect(response.body.success).toBe(false);
  });
});
