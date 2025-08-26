# Reddit API Setup Instructions

## Issue: REDDIT_VERIFIED showing false for real usernames

The Reddit verification is failing because Reddit API credentials are not configured in production.

## Solution: Set up Reddit API credentials

### Step 1: Create Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill out the form:
   - **App Name**: `FairDataUse`
   - **App Type**: `script` (for server-side use)
   - **Description**: `Reddit username verification for FairDataUse platform`
   - **About URL**: `https://fairdatause.com` (your domain)
   - **Redirect URI**: `http://localhost:8080` (not used for script apps)

### Step 2: Get Credentials

After creating the app, you'll see:

- **Client ID**: String under the app name (looks like: `abc123def456`)
- **Client Secret**: "secret" field (looks like: `xyz789uvw012-AbC3dEf4GhI`)

### Step 3: Set Environment Variables

Set these in your production environment:

```bash
REDDIT_CLIENT_ID=your_actual_client_id_here
REDDIT_CLIENT_SECRET=your_actual_client_secret_here
```

### Step 4: Verify Setup

Once credentials are set, test with a form submission:

- The logs should show: `"[REDDIT] Client ID configured: YES"`
- The logs should show: `"[REDDIT] Client Secret configured: YES"`
- For valid Reddit users: `"[REDDIT] User 'austrie' verification result: VERIFIED"`

## Testing the Fix

After setting up credentials, submit a form with username `austrie` and check:

1. Backend logs show successful Reddit API calls
2. Database shows `reddit_verified = true` for the user
3. No more "credentials not configured" errors

## Security Notes

- Keep credentials secure and never commit them to code
- Use environment variables or secure secret management
- Reddit API has rate limits - the current implementation handles this gracefully
