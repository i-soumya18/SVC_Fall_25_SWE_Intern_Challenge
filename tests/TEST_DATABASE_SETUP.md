# Test Database Setup Guide

This guide explains how to set up a local PostgreSQL database for testing, which is compatible with your production Neon PostgreSQL setup.

## Quick Start

### Option 1: Docker PostgreSQL (Recommended)

The easiest way to set up a local test database:

```bash
# Start PostgreSQL with Docker
docker run --name fairdatause-test-db \
  -e POSTGRES_DB=fairdatause_test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

Then run your tests:
```bash
npm run test:backend
```

The tests will automatically:
- Connect to the Docker database
- Create the required schema
- Run all tests with database integration

### Option 2: Native PostgreSQL Installation

If you prefer a native PostgreSQL installation:

#### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create test database
createdb fairdatause_test
```

#### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create test database
sudo -u postgres createdb fairdatause_test
```

#### Set environment variable (optional)
```bash
export TEST_DATABASE_URL="postgresql://postgres@localhost:5432/fairdatause_test"
```

## Database Configuration

### Environment Variables Priority

The test setup checks for database URLs in this order:

1. **`TEST_DATABASE_URL`** - Explicit test database (recommended for CI/CD)
2. **`DATABASE_URL`** - Production database URL (⚠️ only in test mode)
3. **Default Docker config** - `postgresql://postgres:postgres@localhost:5432/fairdatause_test`

### Configuration Examples

```bash
# Docker setup (default)
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fairdatause_test"

# Native installation
TEST_DATABASE_URL="postgresql://postgres@localhost:5432/fairdatause_test"

# Custom host/port
TEST_DATABASE_URL="postgresql://myuser:mypass@testdb.com:5433/test_db"

# Using production Neon DB for integration testing (be careful!)
TEST_DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/test_db"
```

## Schema Management

### Automatic Schema Setup

The test framework automatically:

1. **Creates tables** if they don't exist
2. **Sets up indexes** for performance
3. **Creates triggers** for `updated_at` timestamps
4. **Verifies schema** before running tests

### Manual Schema Setup

If you need to manually set up the schema:

```bash
# Connect to your database
psql -d fairdatause_test

# Run the schema file
\i tests/database-setup.sql
```

### Schema Files

- **`tests/database-setup.sql`** - Complete schema with tables, indexes, triggers
- **`tests/test-db-setup.ts`** - Database utilities and connection management

## Database Schema

### Tables Created

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    reddit_username VARCHAR(100) NOT NULL,
    twitter_username VARCHAR(100),
    youtube_username VARCHAR(100),
    facebook_username VARCHAR(100),
    reddit_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Contractors Table
```sql
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    company_slug VARCHAR(100) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    joined_slack BOOLEAN DEFAULT FALSE,
    can_start_job BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_users_email_phone` - For user existence checks
- `idx_users_email` - For email lookups
- `idx_contractors_email` - For contractor queries
- `idx_contractors_user_id` - For foreign key joins
- `idx_contractors_company_slug` - For company queries

## Testing Workflow

### Test Data Management

The testing framework automatically:

1. **Cleans up test data** after each test
2. **Isolates tests** to prevent interference
3. **Uses test-specific data** (emails with 'test' or '@example.com')

### Running Tests

```bash
# Run all backend tests
npm run test:backend

# Run specific test files
npx vitest run tests/check-user-exists.test.ts
npx vitest run tests/social-qualify-form.test.ts

# Run tests in watch mode
npm run test:backend:watch

# Run with coverage
npm run test:backend:coverage
```

## Troubleshooting

### Common Issues

#### 1. "Neither TEST_DATABASE_URL nor DATABASE_URL is set"
**Solution:** Set up a local database using Docker or native PostgreSQL

#### 2. "Connection refused" / "Could not connect to server"
**Solutions:**
- Check if PostgreSQL is running: `docker ps` or `brew services list`
- Verify the port (default 5432) isn't blocked
- Check firewall settings

#### 3. "Database does not exist"
**Solutions:**
```bash
# Docker
docker exec fairdatause-test-db createdb -U postgres fairdatause_test

# Native
createdb fairdatause_test
```

#### 4. "Permission denied" / Authentication errors
**Solutions:**
- Check username/password in connection string
- For Docker: use `postgres`/`postgres`
- For native: use your system username or `postgres`

#### 5. "Table does not exist" errors
**Solution:** The schema should auto-create. If not, run manually:
```bash
psql -d fairdatause_test -f tests/database-setup.sql
```

### Debugging

Enable verbose logging:
```bash
DEBUG=* npm run test:backend
```

Check database connection:
```bash
# Test Docker database
docker exec -it fairdatause-test-db psql -U postgres -d fairdatause_test -c "SELECT version();"

# Test native database  
psql -d fairdatause_test -c "SELECT version();"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_DB: fairdatause_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432

env:
  TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fairdatause_test
```

## Production vs Test Database

### Key Differences

| Aspect | Production (Neon) | Test (Local) |
|--------|-------------------|--------------|
| **Location** | Cloud (AWS) | Local machine |
| **SSL** | Required | Disabled |
| **Performance** | Optimized | Basic |
| **Data** | Real user data | Test data only |
| **Connection Pool** | Large (20+) | Small (5) |

### Schema Compatibility

The test schema is designed to be **100% compatible** with your Neon production database:

- ✅ Same table structure
- ✅ Same data types
- ✅ Same indexes
- ✅ Same constraints
- ✅ Same triggers

This ensures tests accurately reflect production behavior.

## Best Practices

### Test Data
- Use `@example.com` emails for test data
- Include 'test' in usernames/emails for easy cleanup
- Don't use real user data in tests

### Database Cleanup
- Tests automatically clean up after themselves
- Manual cleanup: `DELETE FROM contractors; DELETE FROM users;`

### Performance
- Keep test data minimal
- Use transactions for faster cleanup
- Run tests in parallel when possible

### Security
- Never use production credentials in tests
- Keep test databases isolated
- Don't commit database URLs to git