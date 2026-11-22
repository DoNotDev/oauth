# OAuth (Third-Party Connections)

**Most is pre-configured.** Connect to Spotify, LinkedIn, GitHub, etc. for API access. Add env vars. Framework handles OAuth flows, token exchange, refresh.

---

## Standard Use

**Environment:**
```bash
# .env (client-side, exposed to browser)
VITE_OAUTH_PARTNERS=github,google,spotify,discord
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Server-side (edge functions / cloud functions)
# Convention: {PROVIDER}_CLIENT_ID (plain config), {PROVIDER}_CLIENT_SECRET (secret)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Firebase:** create the token callables with the providers the app uses. Each one declares `{PROVIDER}_CLIENT_SECRET` for exactly those providers (bound at deploy, value in `.dndev.secrets`) and rejects any other provider (`invalid-argument`); an unknown or empty list throws at load. `{PROVIDER}_CLIENT_ID` stays in `functions/.env`.

```typescript
// functions/src/index.ts
import { createExchangeToken, createRefreshToken } from '@donotdev/functions/firebase';

export const exchangeToken = createExchangeToken(['github', 'google']);
export const refreshToken = createRefreshToken(['github', 'google']);
```

**Available:** `github`, `google`, `spotify`, `discord`, `twitch`, `reddit`, `linkedin`, `slack`, `notion`, `medium`, `twitter`, `mastodon`, `youtube`

**OAuth Provider Dashboard:** Create OAuth apps, copy Client IDs, configure redirect URIs.

---

## Advanced: Components & Hooks

```tsx
import { useOAuth } from '@donotdev/oauth';
import { MultipleOAuthProviders, OAuthPartnerButton } from '@donotdev/oauth';
import { OAuthConnectionModal } from '@donotdev/oauth';

// Hook
const connect = useOAuth('connect');
const disconnect = useOAuth('disconnect');
const isConnected = useOAuth('isConnected');
const loading = useOAuth('loading');
const error = useOAuth('error');

await connect('github', { purpose: 'api-access' });  // Purpose: 'authentication' | 'api-access'
await connect('github', { purpose: 'api-access', scopes: ['repo', 'user:email'] });  // Custom scopes
await disconnect('github');
const connected = isConnected('github');

// Components
<MultipleOAuthProviders purpose="api-access" layout="vertical" />
<OAuthPartnerButton partnerId="github" purpose="api-access" />
<OAuthConnectionModal />
```

**Pre-configured:** Auto-discovers enabled providers, handles PKCE flow, token refresh, callbacks.

---

**Add env vars, get OAuth. Framework handles the rest.**
