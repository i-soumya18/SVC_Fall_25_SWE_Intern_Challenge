import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Ensures a local test Postgres is running for developer machines.
 * Behavior:
 * - If running in CI (GITHUB_ACTIONS), do nothing (CI provides service container).
 * - If a TEST_DATABASE_URL env var is set, print and exit.
 * - Otherwise, try to start a Docker container named 'fairdatause-test-db' (postgres:15).
 */

function log() {
  console.log('[test-db-ensure]', ...arguments);
}

async function main() {
  if (process.env.GITHUB_ACTIONS) {
    log('Running in CI - skipping local Docker startup (service container will be used).');
    return;
  }

  if (process.env.TEST_DATABASE_URL) {
    log('TEST_DATABASE_URL already set in environment:', process.env.TEST_DATABASE_URL);
    return;
  }

  // Check if docker is available
  try {
    execSync('docker version', { stdio: 'ignore' });
  } catch (err) {
    console.error('[test-db-ensure] Docker not available. Please start a Postgres instance manually or install Docker.');
    process.exit(0);
  }

  // Check if container exists
  let containerExists = false;
  try {
    const out = execSync('docker ps -a --filter "name=fairdatause-test-db" --format "{{.Names}} {{.Status}}"', { encoding: 'utf8' });
    if (out && out.includes('fairdatause-test-db')) {
      containerExists = true;
      log('Found existing container:', out.trim());
    }
  } catch (err) {
    // ignore
  }

  if (!containerExists) {
    log('Starting Postgres test container (fairdatause-test-db)...');
    try {
      execSync('docker run --name fairdatause-test-db -e POSTGRES_DB=fairdatause_test -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15', { stdio: 'inherit' });
      log('Postgres test container started.');
    } catch (err) {
      console.error('[test-db-ensure] Failed to start Docker container:', err.message || err);
      process.exit(1);
    }
  } else {
    // Start the container if it's stopped
    try {
      execSync('docker start fairdatause-test-db', { stdio: 'inherit' });
      log('Postgres test container started (was present).');
    } catch (err) {
      console.error('[test-db-ensure] Failed to start existing container:', err.message || err);
      process.exit(1);
    }
  }

  const url = 'postgresql://postgres:postgres@localhost:5432/fairdatause_test';
  console.log('\n[IMPORTANT] Add the following environment variable when running tests locally (shell example):');
  console.log(`export TEST_DATABASE_URL="${url}"`);
  // Also write a helper file tests/.test-db-url for convenience
  try {
    fs.writeFileSync('./tests/.test-db-url', url, { encoding: 'utf8' });
    log('Wrote tests/.test-db-url with connection string.');
  } catch (err) {
    // ignore
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
