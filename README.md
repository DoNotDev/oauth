# @donotdev/oauth

A type-safe OAuth integration package for DoNotDev applications, providing a uniform interface for connecting to external services. Built with security, performance, and developer experience in mind.

## Features

- 🔌 **Partner-Based Integration**: Seamless integration with Google, GitHub, Medium, LinkedIn, Twitter, Discord, Spotify, Slack, Notion, and more
- 🔍 **Dynamic Partner Discovery**: OAuth connections automatically generated based on enabled partners
- 🔒 **Secure Authentication**: PKCE flow with server-side token exchange
- 🔄 **Automatic Token Refresh**: Handles token expiration transparently
- 🌐 **Simplified API Access**: Easy interface for making authenticated API requests
- 🧩 **Composable Hooks**: Purpose-built hooks for different OAuth needs
- 🛡️ **Type Safety**: Fully typed API with central schema definitions
- 📊 **State Management**: Built-in connection tracking with Zustand store
- 🎛️ **Environment-Based Configuration**: Partners enabled/disabled via environment variables
- ⚡ **Event-Driven Architecture**: Store updates via domain-specific events

## OAuthResult Shape (Industry Standard)

All OAuth operations return a discriminated union result:

```typescript
export type OAuthResult =
  | {
      success: true;
      partner: string; // e.g., 'google', 'github'
      accessToken: string;
      refreshToken?: string;
      idToken?: string;
      expiresIn?: number;
      scope?: string;
      tokenType?: string;
      profile?: Record<string, any>; // user info, if available
    }
  | {
      success: false;
      error: string;
      errorDescription?: string;
      attemptedPartner?: string;
    };
```

- `partner`: The OAuth partner (e.g., 'google', 'github')
- `accessToken`: The OAuth access token
- `refreshToken`: The refresh token (if available)
- `idToken`: The ID token (if available)
- `expiresIn`: Token expiry in seconds (if available)
- `scope`: Granted scopes (if available)
- `tokenType`: Token type (if available)
- `profile`: User profile info (if available)
- `error`: Error message (if any)
- `errorDescription`: Detailed error (if any)
- `attemptedPartner`: Partner attempted (on error)

## Quick Start

### Installation

```bash
bun add @donotdev/oauth @donotdev/stores
```

### Configuration

1. Add OAuth client IDs to your environment:

```env
# OAuth client IDs (public, safe for client-side)
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MEDIUM_CLIENT_ID=your_medium_client_id

# Enabled OAuth partners (comma-separated)
VITE_OAUTH_PARTNERS=github,google,medium,discord,spotify

# Available partners: google, github, discord, spotify, linkedin, slack, notion, medium, twitter, mastodon, youtube
```

2. Set up server-side token exchange in Firebase Functions (or your backend):

```env
# Server environment (DO NOT expose in client)
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_MEDIUM_CLIENT_SECRET=your_medium_client_secret
```

3. Add an OAuth callback route to your application:

```tsx
// In your router
<Route path="/oauth/callback" element={<OAuthCallbackPage />} />
```

### Basic Usage

#### Connect to an OAuth Partner

```tsx
import { useOAuthPartner, OAuthPartnerButton } from '@donotdev/oauth';

function GitHubIntegration() {
  // Use the partner-agnostic hook
  const { isConnected, isConnecting, connect, disconnect, request } =
    useOAuthPartner('github');

  // Example: Fetch repositories once connected
  const fetchRepositories = async () => {
    if (!isConnected) return;

    try {
      const repos = await request('https://api.github.com/user/repos');
      console.log('Your repositories:', repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  return (
    <div>
      <h2>GitHub Integration</h2>

      {/* Option 1: Use the pre-built button component */}
      <OAuthPartnerButton
        partnerId="github"
        variant="outline"
        onSuccess={(result) => {
          if (result.success) {
            console.log('Connected!', result);
          } else {
            console.error('Connection error:', result.error);
          }
        }}
        onError={(error) => console.error('Connection error:', error)}
      />

      {/* Option 2: Build your own UI */}
      {isConnected ? (
        <>
          <button onClick={disconnect}>Disconnect GitHub</button>
          <button onClick={fetchRepositories}>Fetch Repositories</button>
        </>
      ) : (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect to GitHub'}
        </button>
      )}
    </div>
  );
}
```

#### Handle OAuth Callbacks

Create an OAuth callback page:

```tsx
import { useNavigate } from 'react-router-dom';
import { useOAuthCallback } from '@donotdev/oauth';
import { useEffect } from 'react';

export function OAuthCallbackPage() {
  const navigate = useNavigate();

  // Use the callback hook
  const { isCallback, processing, success, error, partnerName } =
    useOAuthCallback();

  // Redirect after processing
  useEffect(() => {
    if (!isCallback || (processing === false && (success || error))) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [isCallback, processing, success, error]);

  if (!isCallback) {
    return <div>Not a valid OAuth callback</div>;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          {processing
            ? 'Processing Connection'
            : success
              ? `Connected to ${partnerName}`
              : `Connection Failed`}
        </h1>

        {processing && <p>Please wait while we complete your connection...</p>}
        {success && <p>Successfully connected! Redirecting...</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
}
```

## Schema-Driven Discovery

The OAuth system uses **dynamic partner discovery** based on your schema configuration and environment variables. This provides a truly schema-driven approach to OAuth integrations.

### How OAuth Partner Discovery Works

1. **Schema Definition**: Partners are defined in `OAUTH_PARTNERS` schema with endpoints and scopes
2. **Environment Control**: `VITE_OAUTH_PARTNERS` controls which partners are enabled
3. **Dynamic Hook Generation**: OAuth hooks are automatically available for enabled partners
4. **Type Safety**: All partner configurations are fully typed

### OAuth Partner Schema

```typescript
// packages/core/types/src/schemas/partners.schema.ts
export const OAUTH_PARTNERS = {
  github: {
    name: 'GitHub',
    color: '#24292e',
    icon: 'github',
    type: 'both', // Can be used for auth AND API access
    scopes: {
      authentication: ['read:user', 'user:email'],
      'api-access': ['repo', 'user', 'read:org', 'gist', 'notifications'],
    },
    endpoints: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      profileUrl: 'https://api.github.com/user',
    },
    enabled: true,
  },
  discord: {
    name: 'Discord',
    color: '#5865F2',
    icon: 'discord',
    type: 'both',
    scopes: {
      authentication: ['identify', 'email'],
      'api-access': ['guilds', 'guilds.members.read', 'bot', 'messages.read'],
    },
    endpoints: {
      authUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      profileUrl: 'https://discord.com/api/users/@me',
    },
    enabled: true,
  },
  // ... other partners
} as const;

// Types automatically generated
export type OAuthPartnerId = keyof typeof OAUTH_PARTNERS;
```

### Dynamic OAuth Usage

Instead of importing specific partner hooks, you can discover and use them dynamically:

```typescript
import { useOAuthPartner, getEnabledOAuthPartners } from '@donotdev/oauth';

function DynamicOAuthIntegrations() {
  const enabledPartners = getEnabledOAuthPartners();

  return (
    <div>
      <h2>Available Integrations</h2>
      {enabledPartners.map(partnerId => (
        <PartnerIntegration key={partnerId} partnerId={partnerId} />
      ))}
    </div>
  );
}

function PartnerIntegration({ partnerId }: { partnerId: OAuthPartnerId }) {
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    request
  } = useOAuthPartner(partnerId);

  const partnerConfig = OAUTH_PARTNERS[partnerId];

  return (
    <div style={{ backgroundColor: partnerConfig.color }}>
      <h3>{partnerConfig.name}</h3>
      {isConnected ? (
        <button onClick={disconnect}>Disconnect</button>
      ) : (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : `Connect to ${partnerConfig.name}`}
        </button>
      )}
    </div>
  );
}
```

### Adding New OAuth Partners

To add a new OAuth partner:

1. **Update the Schema** (in `@donotdev/types`):

   ```typescript
   export const OAUTH_PARTNERS = {
     // ... existing partners
     newservice: {
       name: 'NewService',
       color: '#FF0000',
       icon: 'newservice',
       type: 'oauth',
       scopes: {
         'api-access': ['read', 'write', 'admin'],
       },
       endpoints: {
         authUrl: 'https://api.newservice.com/oauth/authorize',
         tokenUrl: 'https://api.newservice.com/oauth/token',
         profileUrl: 'https://api.newservice.com/user',
       },
       enabled: true,
     },
   } as const;
   ```

2. **Add Environment Variables**:

   ```env
   VITE_NEWSERVICE_CLIENT_ID=your_client_id
   VITE_OAUTH_PARTNERS=github,google,newservice
   ```

3. **Add Server-Side Secret** (in your backend):

   ```env
   OAUTH_NEWSERVICE_CLIENT_SECRET=your_client_secret
   ```

4. **That's it!** The system automatically:
   - Makes `useNewserviceOAuth()` hook available
   - Handles OAuth flow with correct endpoints
   - Manages token exchange and refresh
   - Provides typed API request method

### Discovery API

```typescript
import {
  getEnabledOAuthPartners,
  isOAuthPartnerEnabled,
  OAUTH_PARTNERS,
} from '@donotdev/oauth';

// Get all enabled OAuth partners
const enabledPartners = getEnabledOAuthPartners();
// Returns: ['github', 'google', 'discord']

// Check if specific partner is enabled
const isGithubEnabled = isOAuthPartnerEnabled('github');

// Get partner configuration
const githubConfig = OAUTH_PARTNERS.github;
```

## Core APIs

### Hooks

#### `useOAuthPartner(partnerId)`

Core hook for partner-specific OAuth operations.

```tsx
const {
  isConnected, // Whether currently connected
  isConnecting, // Whether connection is in progress
  error, // Current error, if any
  credentials, // Current OAuth credentials
  connect, // Function to initiate connection
  disconnect, // Function to disconnect
  refreshToken, // Function to manually refresh token
  request, // Function to make authorized API requests
} = useOAuthPartner('github');
```

#### Partner-Specific Hooks

Pre-configured hooks for specific partners:

```tsx
// Available partner hooks
const github = useGithubOAuth();
const google = useGoogleOAuth();
const medium = useMediumOAuth();
const linkedin = useLinkedInOAuth();
const mastodon = useMastodonOAuth();
const twitter = useTwitterOAuth();
```

#### `useOAuthCallback()`

Hook for handling OAuth callbacks.

```tsx
const {
  isCallback, // Whether current URL is an OAuth callback
  processing, // Whether callback is being processed
  success, // Whether connection was successful
  error, // Error during processing, if any
  partnerName, // Name of the OAuth partner
} = useOAuthCallback();
```

### Components

#### `OAuthPartnerButton`

Button component for initiating OAuth connections.

```tsx
<OAuthPartnerButton
  partnerId="github"
  purpose="api-access" // 'api-access' or 'authentication'
  variant="default" // UI variants: 'default', 'outline', etc.
  // Size variants: 'sm', 'md', 'lg'
  scopes={['repo']} // Optional override for scopes
  onSuccess={(result) => {}} // Success callback
  onError={(error) => {}} // Error callback
/>
```

#### Partner-Specific Buttons

Pre-configured buttons for specific partners:

```tsx
// Available partner buttons
<GithubOAuthButton />
<GoogleOAuthButton />
<MediumOAuthButton />
<LinkedInOAuthButton />
<MastodonOAuthButton />
<TwitterOAuthButton />
```

## Advanced Usage

### Custom API Requests

```tsx
// Making an authenticated API request
const { request, isConnected } = useGithubOAuth();

const fetchData = async () => {
  if (!isConnected) return;

  try {
    // Simple request (GET by default)
    const repos = await request('https://api.github.com/user/repos');

    // Advanced request with options
    const response = await request('https://api.github.com/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name: 'new-repo' }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      // Control token refresh behavior
      autoRefresh: true,
      // Whether to require connection
      requireConnection: true,
    });
  } catch (error) {
    // Handle errors
  }
};
```

### Custom Connection Options

```tsx
const { connect } = useGithubOAuth();

// Connect with custom options
connect({
  // Override purpose
  purpose: 'api-access',

  // Override scopes
  scopes: ['repo', 'user'],

  // Custom redirect URI
  redirectUri: 'https://your-domain.com/custom-callback',

  // Additional OAuth parameters
  additionalParams: {
    prompt: 'consent',
    access_type: 'offline',
  },

  // Callbacks
  onSuccess: (result) => console.log('Connected!', result),
  onError: (error) => console.error('Error:', error),
});
```

### Managing Multiple Connections

```tsx
import {
  useGithubOAuth,
  useGoogleOAuth,
  useMediumOAuth,
} from '@donotdev/oauth';

function IntegrationsManager() {
  // Hook instances for each partner
  const github = useGithubOAuth();
  const google = useGoogleOAuth();
  const medium = useMediumOAuth();

  return (
    <div>
      <h1>Your Integrations</h1>

      {/* GitHub Integration */}
      <div className="integration-card">
        <h2>GitHub</h2>
        <ConnectionStatus connected={github.isConnected} />
        <button
          onClick={github.isConnected ? github.disconnect : github.connect}
        >
          {github.isConnected ? 'Disconnect' : 'Connect'} GitHub
        </button>
      </div>

      {/* Google Integration */}
      <div className="integration-card">
        <h2>Google</h2>
        <ConnectionStatus connected={google.isConnected} />
        <button
          onClick={google.isConnected ? google.disconnect : google.connect}
        >
          {google.isConnected ? 'Disconnect' : 'Connect'} Google
        </button>
      </div>

      {/* Medium Integration */}
      <div className="integration-card">
        <h2>Medium</h2>
        <ConnectionStatus connected={medium.isConnected} />
        <button
          onClick={medium.isConnected ? medium.disconnect : medium.connect}
        >
          {medium.isConnected ? 'Disconnect' : 'Connect'} Medium
        </button>
      </div>
    </div>
  );
}
```

## Security Considerations

- Client secrets are never exposed in the client code
- PKCE flow is used for added security
- Token exchange happens server-side
- State parameters protect against CSRF attacks
- Tokens are securely stored and refreshed

## Troubleshooting

### Common Issues

1. **OAuth Popup Blocked**: Ensure popups are enabled for your site, or use `connect({ useRedirect: true })` to use redirect flow.

2. **"Invalid Redirect URI"**: Your redirect URI must be registered with the OAuth provider. Check your provider settings.

3. **Error Processing Callback**: Ensure your callback URL matches what you've configured with the provider.

4. **No Access Token**: This usually means the token exchange failed server-side. Check your server logs.

## License & Ownership

All rights reserved.  
The DoNotDev framework and its premium features are the exclusive property of **Ambroise Park Consulting**.

- Licensed under MIT. See LICENSE.md.

© Ambroise Park Consulting – 2025
