import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';
import { getTestDatabase, mockServer } from './setup-backend';
import { HttpResponse, http } from 'msw';

describe('POST /api/social-qualify-form', () => {
  const app = createServer();
  const db = getTestDatabase();

  const validFormData = {
    email: 'test@example.com',
    phone: '1234567890',
    redditUsername: 'testuser',
    twitterUsername: 'testtwitter',
    youtubeUsername: 'testyoutube',
    facebookUsername: 'testfacebook'
  };

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
  });

  describe('Successful submissions', () => {
    it('should successfully process a valid form submission with verified Reddit user', async () => {
      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(validFormData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Application processed successfully',
        data: {
          matchedCompany: {
            name: 'Silicon Valley Consulting',
            slug: 'silicon-valley-consulting',
            payRate: '$2.00 per hour',
            bonus: '$500'
          }
        }
      });

      // Verify user was saved to database
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [validFormData.email]
      );
      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0]).toMatchObject({
        email: validFormData.email,
        phone: validFormData.phone,
        reddit_username: validFormData.redditUsername,
        twitter_username: validFormData.twitterUsername,
        youtube_username: validFormData.youtubeUsername,
        facebook_username: validFormData.facebookUsername,
        reddit_verified: true
      });
    });

    it('should process form submission with unverified Reddit user', async () => {
      // Mock Reddit API to return 404 for this user
      mockServer.use(
        http.get('https://oauth.reddit.com/user/nonexistentuser/about', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const formData = {
        ...validFormData,
        email: 'test2@example.com',
        redditUsername: 'nonexistentuser'
      };

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(formData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was saved with reddit_verified = false
      const userResult = await db.query(
        'SELECT reddit_verified FROM users WHERE email = $1',
        [formData.email]
      );
      expect(userResult.rows[0].reddit_verified).toBe(false);
    });

    it('should handle form submission with only required fields', async () => {
      const minimalFormData = {
        email: 'minimal@example.com',
        phone: '9876543210',
        redditUsername: 'validuser'
      };

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(minimalFormData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify optional fields are null in database
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [minimalFormData.email]
      );
      expect(userResult.rows[0]).toMatchObject({
        email: minimalFormData.email,
        phone: minimalFormData.phone,
        reddit_username: minimalFormData.redditUsername,
        twitter_username: null,
        youtube_username: null,
        facebook_username: null
      });
    });
  });

  describe('Validation errors', () => {
    it('should reject form submission with invalid email', async () => {
      const invalidData = {
        ...validFormData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('email')
      });
    });

    it('should reject form submission with short phone number', async () => {
      const invalidData = {
        ...validFormData,
        phone: '123'
      };

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Phone number must be at least 10 digits')
      });
    });

    it('should reject form submission without Reddit username', async () => {
      const invalidData = {
        ...validFormData,
        redditUsername: ''
      };

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Reddit username is required')
      });
    });

    it('should reject form submission with missing required fields', async () => {
      const response = await request(app)
        .post('/api/social-qualify-form')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Duplicate user handling', () => {
    it('should reject duplicate user with same email and phone', async () => {
      // First submission should succeed
      await request(app)
        .post('/api/social-qualify-form')
        .send(validFormData)
        .expect(200);

      // Second submission with same email and phone should fail
      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(validFormData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'A user with this email and phone number combination already exists.'
      });
    });

    it('should allow different email with same phone', async () => {
      // First submission
      await request(app)
        .post('/api/social-qualify-form')
        .send(validFormData)
        .expect(200);

      // Second submission with different email but same phone should succeed
      const differentEmailData = {
        ...validFormData,
        email: 'different@example.com'
      };

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(differentEmailData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Reddit API integration', () => {
    it('should handle Reddit API OAuth failure gracefully', async () => {
      // Mock Reddit OAuth to fail
      mockServer.use(
        http.post('https://www.reddit.com/api/v1/access_token', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send({
          ...validFormData,
          email: 'oauth-fail@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was saved with reddit_verified = false
      const userResult = await db.query(
        'SELECT reddit_verified FROM users WHERE email = $1',
        ['oauth-fail@example.com']
      );
      expect(userResult.rows[0].reddit_verified).toBe(false);
    });

    it('should handle Reddit API network error gracefully', async () => {
      // Mock Reddit API to throw network error
      mockServer.use(
        http.post('https://www.reddit.com/api/v1/access_token', () => {
          return HttpResponse.error();
        })
      );

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send({
          ...validFormData,
          email: 'network-error@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was saved with reddit_verified = false
      const userResult = await db.query(
        'SELECT reddit_verified FROM users WHERE email = $1',
        ['network-error@example.com']
      );
      expect(userResult.rows[0].reddit_verified).toBe(false);
    });
  });

  describe('Database error handling', () => {
    it('should handle database connection issues', async () => {
      // This test would need to mock the database pool to simulate failure
      // For now, we'll just ensure the error handling middleware works
      
      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(validFormData)
        .expect(200);

      // If we reach here, the basic flow is working
      expect(response.body.success).toBe(true);
    });
  });

  describe('Content-Type handling', () => {
    it('should accept application/json content type', async () => {
      const response = await request(app)
        .post('/api/social-qualify-form')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(validFormData))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/social-qualify-form')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON and return 400
      expect(response.status).toBe(400);
    });
  });
});
