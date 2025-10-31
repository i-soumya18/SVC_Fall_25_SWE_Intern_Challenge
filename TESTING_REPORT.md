# Testing Report for SWE Intern Challenge

## Original Tests Review

### What was covered well/poorly?
- **Backend**: Had basic database connection tests and some API endpoint tests (social-qualify-form, contractor-request, etc.), but coverage was set to 80% and many tests were skipped when DB unavailable. Good use of MSW for API mocking.
- **Frontend**: Minimal coverage with only one test file for utility functions. No component or integration tests.
- **Integration**: Some tests used real database connections, but lacked proper isolation. External API calls (Reddit) were mocked in some places but not all.
- **Edge cases**: Limited coverage of error handling, validation edge cases, and unhappy paths.

### Any flakiness or anti-patterns?
- Tests heavily depend on external PostgreSQL database, causing failures when not running.
- Many tests skipped instead of properly mocked when DB unavailable.
- Coverage reports committed to repository (added to .gitignore).
- Mixed package managers (pnpm in package.json but npm used for compatibility).
- No CI pipeline for automated testing.

## What I Added & Why

### New Tests Added
- Automated database setup using Docker containers in pretest/posttest scripts.
- Separate Vitest configurations for frontend (jsdom, 100% coverage) and backend (node, 100% coverage).
- GitHub Actions CI workflow with PostgreSQL service container.
- Environment configuration files (.env.example, .nvmrc).
- Coverage enforcement with 100% thresholds for statements, branches, lines, functions.
- Proper test isolation by separating frontend and backend test runs.

### Rationale
- Docker-based DB setup ensures tests run reliably without manual intervention, meeting the "npm test works out-of-the-box" requirement.
- 100% coverage gates enforce comprehensive testing as required by the challenge.
- CI ensures tests run on every push/PR with coverage reporting.
- Separate configs prevent frontend tests from needing DB and backend tests from needing jsdom.

## Issues Faced & How I Solved Them

### Database Setup Automation
- **Problem**: Tests failed because PostgreSQL wasn't running automatically, violating the "npm test works out-of-the-box" requirement.
- **Solution**: Implemented Docker-based DB setup in pretest script, with Testcontainers initially but switched to direct Docker commands for Windows compatibility.

### Testcontainers Windows Compatibility
- **Problem**: Testcontainers failed to find Docker runtime on Windows.
- **Solution**: Replaced with direct Docker run commands, which are simpler and more reliable for this use case.

### Coverage Configuration
- **Problem**: No frontend coverage config, backend coverage at 80%, no CI enforcement.
- **Solution**: Created separate Vitest configs with 100% thresholds and GitHub Actions workflow with coverage upload.

### Package Manager Conflicts
- **Problem**: Package.json specified pnpm but challenge requires npm compatibility.
- **Solution**: Used npm for all operations, ensuring npm test works as required.

## Repo Health Assessment

### Architecture
- **Strengths**: Clean monorepo structure with client/server/shared separation, TypeScript throughout, modern tooling (Vite, Vitest, MSW).
- **Issues**: Committed coverage files (fixed), mixed package managers, some unused dependencies.

### Testability
- **Good**: MSW for API mocking, Vitest for fast testing, clear test organization.
- **Needs improvement**: Better external dependency isolation, more integration tests, component testing for React app.

### Tech Debt
- Committed coverage and dist files.
- Inconsistent package manager usage.
- Missing CI/CD pipeline.
- Limited test coverage and automation.

## How to Run

1. **Prerequisites**: Node 20.x, Docker (for local DB testing)
2. **Install**: `npm install`
3. **Run tests**: `npm test` (automatically sets up/tears down DB)
4. **View coverage**: Check `coverage/backend/` and `coverage/frontend/` after test run
5. **CI**: Tests run automatically on GitHub Actions with coverage reporting

**Note**: Local testing requires Docker. CI uses GitHub Actions service containers.