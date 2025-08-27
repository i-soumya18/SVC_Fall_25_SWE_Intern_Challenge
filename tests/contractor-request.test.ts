import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';
import { getTestDatabase } from './setup-backend';

describe('POST /api/contractor-request', () => {
  const app = createServer();
  const db = getTestDatabase();

  const testUser = {
    email: 'contractor-test@example.com',
    phone: '1234567890',
    reddit_username: 'testcontractor',
    twitter_username: 'testtwitter',
    youtube_username: 'testyoutube',
    facebook_username: 'testfacebook',
    reddit_verified: true
  };

  const validContractorRequest = {
    email: 'contractor-test@example.com',
    companySlug: 'silicon-valley-consulting',
    companyName: 'Silicon Valley Consulting'
  };

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM contractors WHERE email LIKE $1', ['%test%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);

    // Create a test user for contractor requests
    await db.query(`
      INSERT INTO users (email, phone, reddit_username, twitter_username, youtube_username, facebook_username, reddit_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      testUser.email,
      testUser.phone,
      testUser.reddit_username,
      testUser.twitter_username,
      testUser.youtube_username,
      testUser.facebook_username,
      testUser.reddit_verified
    ]);
  });

  describe('Successful contractor requests', () => {
    it('should successfully create a contractor request for existing user', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "We've just pinged them. You'll be sent an email and text invite within 72 hours."
      });

      // Verify contractor request was saved to database
      const contractorResult = await db.query(
        'SELECT * FROM contractors WHERE email = $1 AND company_slug = $2',
        [validContractorRequest.email, validContractorRequest.companySlug]
      );
      
      expect(contractorResult.rows).toHaveLength(1);
      expect(contractorResult.rows[0]).toMatchObject({
        email: validContractorRequest.email,
        company_slug: validContractorRequest.companySlug,
        company_name: validContractorRequest.companyName,
        status: 'pending',
        joined_slack: true,
        can_start_job: false
      });
    });

    it('should create contractor request with proper user relationship', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify the user_id is correctly set
      const userResult = await db.query('SELECT id FROM users WHERE email = $1', [testUser.email]);
      const contractorResult = await db.query(
        'SELECT user_id FROM contractors WHERE email = $1',
        [validContractorRequest.email]
      );

      expect(contractorResult.rows[0].user_id).toBe(userResult.rows[0].id);
    });

    it('should handle different company requests for same user', async () => {
      // First request
      await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      // Second request for different company
      const secondRequest = {
        ...validContractorRequest,
        companySlug: 'another-company',
        companyName: 'Another Company'
      };

      const response = await request(app)
        .post('/api/contractor-request')
        .send(secondRequest)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify both contractor requests exist
      const contractorResult = await db.query(
        'SELECT company_slug FROM contractors WHERE email = $1 ORDER BY company_slug',
        [validContractorRequest.email]
      );
      
      expect(contractorResult.rows).toHaveLength(2);
      expect(contractorResult.rows[0].company_slug).toBe('another-company');
      expect(contractorResult.rows[1].company_slug).toBe('silicon-valley-consulting');
    });
  });

  describe('Validation errors', () => {
    it('should reject request with invalid email format', async () => {
      const invalidRequest = {
        ...validContractorRequest,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/contractor-request')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('email')
      });
    });

    it('should reject request with missing required fields', async () => {
      const incompleteRequest = {
        email: validContractorRequest.email
        // Missing companySlug and companyName
      };

      const response = await request(app)
        .post('/api/contractor-request')
        .send(incompleteRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should reject request with empty company slug', async () => {
      const invalidRequest = {
        ...validContractorRequest,
        companySlug: ''
      };

      const response = await request(app)
        .post('/api/contractor-request')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with empty company name', async () => {
      const invalidRequest = {
        ...validContractorRequest,
        companyName: ''
      };

      const response = await request(app)
        .post('/api/contractor-request')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User not found scenarios', () => {
    it('should reject request for non-existent user', async () => {
      const nonExistentUserRequest = {
        email: 'nonexistent@example.com',
        companySlug: 'silicon-valley-consulting',
        companyName: 'Silicon Valley Consulting'
      };

      const response = await request(app)
        .post('/api/contractor-request')
        .send(nonExistentUserRequest)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found. Please complete the qualification form first.'
      });

      // Verify no contractor record was created
      const contractorResult = await db.query(
        'SELECT * FROM contractors WHERE email = $1',
        [nonExistentUserRequest.email]
      );
      expect(contractorResult.rows).toHaveLength(0);
    });
  });

  describe('Duplicate contractor request handling', () => {
    it('should reject duplicate contractor request for same user and company', async () => {
      // First request should succeed
      await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      // Second request for same user and company should fail
      const response = await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'You have already requested to join this company. Please check your email for updates.'
      });

      // Verify only one contractor record exists
      const contractorResult = await db.query(
        'SELECT * FROM contractors WHERE email = $1 AND company_slug = $2',
        [validContractorRequest.email, validContractorRequest.companySlug]
      );
      expect(contractorResult.rows).toHaveLength(1);
    });
  });

  describe('Database interaction', () => {
    it('should set correct default values for contractor fields', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      expect(response.body.success).toBe(true);

      const contractorResult = await db.query(
        'SELECT status, joined_slack, can_start_job, created_at, updated_at FROM contractors WHERE email = $1',
        [validContractorRequest.email]
      );

      const contractor = contractorResult.rows[0];
      expect(contractor.status).toBe('pending');
      expect(contractor.joined_slack).toBe(true);
      expect(contractor.can_start_job).toBe(false);
      expect(contractor.created_at).toBeDefined();
      expect(contractor.updated_at).toBeDefined();
    });

    it('should handle database timestamps correctly', async () => {
      const beforeRequest = new Date();
      
      await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      const afterRequest = new Date();

      const contractorResult = await db.query(
        'SELECT created_at, updated_at FROM contractors WHERE email = $1',
        [validContractorRequest.email]
      );

      const contractor = contractorResult.rows[0];
      const createdAt = new Date(contractor.created_at);
      const updatedAt = new Date(contractor.updated_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
    });
  });

  describe('Content-Type handling', () => {
    it('should accept application/json content type', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(validContractorRequest))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Express middleware catches malformed JSON - behavior varies by environment
      expect([400, 500]).toContain(response.status);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Response structure validation', () => {
    it('should return consistent response structure', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return JSON content type', async () => {
      await request(app)
        .post('/api/contractor-request')
        .send(validContractorRequest)
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });
});
