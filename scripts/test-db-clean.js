const { execSync } = require('child_process');
const fs = require('fs');

function log() {
  console.log('[test-db-clean]', ...arguments);
}

async function main() {
  if (process.env.GITHUB_ACTIONS) {
    log('Running in CI - skipping local Docker cleanup (service container managed by GitHub Actions).');
    return;
  }

  try {
    const out = execSync('docker ps -a --filter "name=fairdatause-test-db" --format "{{.Names}} {{.Status}}"', { encoding: 'utf8' });
    if (out && out.includes('fairdatause-test-db')) {
      log('Stopping and removing container fairdatause-test-db...');
      execSync('docker rm -f fairdatause-test-db', { stdio: 'inherit' });
      log('Container removed.');
    } else {
      log('No test container found - nothing to remove.');
    }
  } catch (err) {
    console.warn('[test-db-clean] Could not remove container or Docker not available:', err.message || err);
  }

  try {
    if (fs.existsSync('./tests/.test-db-url')) {
      fs.unlinkSync('./tests/.test-db-url');
      log('Removed tests/.test-db-url');
    }
  } catch (err) {
    // ignore
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
