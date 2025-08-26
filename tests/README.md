# Backend Test Suite

This directory contains comprehensive tests for all backend API endpoints.

## Test Structure

- `setup-backend.ts` - Test environment setup, database utilities, and mock server configuration
- `ping.test.ts` - Tests for the `/api/ping` endpoint
- `demo.test.ts` - Tests for the `/api/demo` endpoint  
- `social-qualify-form.test.ts` - Tests for the `/api/social-qualify-form` endpoint
- `contractor-request.test.ts` - Tests for the `/api/contractor-request` endpoint

## Running Tests

### Backend Tests Only
```bash
# Run all backend tests once
npm run test:backend

# Run backend tests in watch mode
npm run test:backend:watch

# Run backend tests with coverage report
npm run test:backend:coverage
```

### All Tests
```bash
# Run both frontend and backend tests
npm run test:all

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite maintains the following minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80% 
- **Lines**: 80%
- **Statements**: 80%

Coverage reports are generated in:
- Text format (console output)
- HTML format (`./coverage/backend/index.html`)
- LCOV format (`./coverage/backend/lcov.info`)

## Test Environment

### Database Setup
Tests use the same database as the main application but with cleanup procedures to prevent data pollution:
- Each test cleans up its own data in `beforeEach` and `afterEach` hooks
- Test data uses predictable patterns (emails containing "test") for easy identification
- Database connection pool is shared but properly managed

### External API Mocking
- **Reddit API**: Fully mocked using MSW (Mock Service Worker)
- Mock responses simulate both successful verification and error scenarios
- Network timeouts and failures are also simulated

### Environment Variables
Test environment automatically sets:
- `NODE_ENV=test`
- `REDDIT_CLIENT_ID=test_client_id`
- `REDDIT_CLIENT_SECRET=test_client_secret`  
- `PING_MESSAGE=test ping`

## Test Categories

### Unit Tests
- Input validation (Zod schemas)
- Response structure validation
- Error handling scenarios

### Integration Tests  
- Full HTTP request/response cycles
- Database read/write operations
- External API integration (mocked)

### Error Handling Tests
- Malformed request data
- Missing required fields
- Database constraint violations
- External API failures
- Network errors

## Test Data Management

### User Test Data
```typescript
// Standard test user for contractor request tests
const testUser = {
  email: 'contractor-test@example.com',
  phone: '1234567890', 
  reddit_username: 'testcontractor',
  reddit_verified: true
};
```

### Cleanup Strategy
- All test emails contain "test" for easy identification
- Cleanup happens in reverse order of foreign key dependencies:
  1. Delete contractors table records
  2. Delete users table records
- Cleanup is automatic and happens after each test

## Mocked External Services

### Reddit API
- **OAuth Token Endpoint**: Returns mock access token
- **User Verification**: Responds based on username:
  - `testuser`, `validuser`, `reddituser` → Verified (200)
  - All other usernames → Not found (404)
- **Error Scenarios**: Network errors, 401 unauthorized, malformed responses

## Coverage Analysis

The test suite covers:

1. **Happy Path Scenarios**
   - Valid form submissions with all fields
   - Successful Reddit verification
   - Successful contractor requests

2. **Edge Cases**
   - Minimal required fields only
   - Optional field handling
   - Duplicate submissions
   - Different users with same phone/email

3. **Error Scenarios**
   - Input validation failures
   - External API failures
   - Database constraint violations
   - Malformed JSON requests

4. **Security & Data Integrity**
   - SQL injection prevention (parameterized queries)
   - Input sanitization through Zod validation
   - Proper error message handling (no sensitive data exposure)

## Performance Considerations

- Tests run against the same database as development to ensure real-world performance
- Database connection pooling is optimized for test scenarios (smaller pool size)
- Mock services respond instantly to avoid external API latency
- Parallel test execution is supported (tests are isolated)

## Debugging Tests

### View Coverage Report
After running `npm run test:backend:coverage`, open:
```
./coverage/backend/index.html
```

### Common Issues
1. **Database Connection**: Ensure `DATABASE_URL` is set for your Neon database
2. **Test Data Conflicts**: Check that cleanup functions are working properly
3. **Mock Server Issues**: Verify MSW handlers are correctly configured

### Logging
Test output includes:
- HTTP request/response details
- Database query results
- External API interaction logs
- Error stack traces for debugging
