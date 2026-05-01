'use client';
// packages/features/oauth/src/useOAuth.ts

/**
 * @fileoverview useOAuth Hook - Property-Based Access to OAuth State and Methods
 * @description React hook for property-based access to OAuth state and methods.
 * Provides reactive state access and stable method access.
 * Platform-agnostic: uses ICallableProvider (Firebase/Supabase) or HTTP fallback (Vercel/Next).
 * Uses unified FeatureStatus enum for lifecycle management.
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { useCallback } from 'react';

import {
  DEGRADED_OAUTH_API,
  FRAMEWORK_FEATURES,
  generatePKCEPair,
  generateUUID,
  getOAuthClientId,
  getOAuthPartnerConfig,
  getOAuthRedirectUri,
  getProvider,
  handleError,
  hasProvider,
  isClient,
  redirectToExternalUrlWithErrorHandling,
  useFeatureConsent,
} from '@donotdev/core';
import type {
  ConnectOptions,
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  OAuthAPI,
  OAuthCredentials,
  OAuthPartnerId,
  OAuthPurpose,
} from '@donotdev/core';

import { useOAuthStore } from './oauthStore';

// =============================================================================
// Module-level guards for error notification deduplication
// Reset after a cooldown so subsequent errors aren't permanently silenced.
// =============================================================================
const ERROR_DEDUP_COOLDOWN_MS = 10_000;
let connectErrorNotified = 0;
let disconnectErrorNotified = 0;
let callbackErrorNotified = 0;

// Store keys (state that comes from Zustand store)
const STORE_KEYS: Set<keyof OAuthAPI> = new Set([
  'status',
  'error',
  'partners',
  'connectedPartners',
]);

/**
 * React hook for OAuth with property-based access
 *
 * Single entry point for all OAuth operations.
 * Uses selectors internally to prevent unnecessary re-renders.
 *
 * **Property-based access (clean and simple):**
 * ```typescript
 * // ✅ State from store (reactive, re-renders on change)
 * const status = useOAuth('status');
 * const error = useOAuth('error');
 * const partners = useOAuth('partners');
 * const connectedPartners = useOAuth('connectedPartners');
 * const isAvailable = useOAuth('isAvailable');
 *
 * // ✅ Methods (stable, never re-renders)
 * const connect = useOAuth('connect');
 * await connect('github');
 * await connect('github', { purpose: 'api-access', scopes: ['repo', 'user:email'] });
 * const disconnect = useOAuth('disconnect');
 * const handleCallback = useOAuth('handleCallback');
 * const isConnected = useOAuth('isConnected');
 * const getCredentials = useOAuth('getCredentials');
 * ```
 *
 * **How it works:**
 * - Store properties (status, error, partners, connectedPartners) → Subscribe via Zustand (reactive)
 * - Methods (connect, disconnect, handleCallback, isConnected, getCredentials) → useCallback (stable)
 *
 * @template K - The property key from OAuthAPI
 * @param key - Property name to access
 * @returns The value of the specified property
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function useOAuth<K extends keyof OAuthAPI>(key: K): OAuthAPI[K] {
  const canProceed = useFeatureConsent(FRAMEWORK_FEATURES.OAUTH);

  // ==========================================================================
  // Service Methods (Async - OAuth operations)
  // ✅ ALL useCallback hooks MUST be called unconditionally (Rules of Hooks)
  // ==========================================================================

  const connect = useCallback(
    async (partnerId: OAuthPartnerId, options?: ConnectOptions) => {
      if (!isClient() || !canProceed) return;

      const purpose = options?.purpose ?? 'api-access';

      const state = useOAuthStore.getState();
      state.setLoading(true);
      state.setError(null);
      state.setPartnerConnecting(partnerId, true);

      try {
        const clientId = getOAuthClientId(partnerId);
        if (!clientId) {
          throw new Error(
            `${partnerId.toUpperCase()}_CLIENT_ID not configured`
          );
        }
        const redirectUri = getOAuthRedirectUri(partnerId);

        const { codeVerifier, codeChallenge } = await generatePKCEPair();

        const csrfState = `${partnerId}_${generateUUID()}`;

        const authUrl = buildAuthUrl(
          partnerId,
          clientId,
          redirectUri,
          codeChallenge,
          purpose,
          csrfState,
          options?.scopes,
          options?.additionalParams
        );

        sessionStorage.setItem(`oauth_state_${partnerId}`, csrfState);
        sessionStorage.setItem(`oauth_purpose_${partnerId}`, purpose);
        sessionStorage.setItem(`oauth_${partnerId}_verifier`, codeVerifier);

        await redirectToExternalUrlWithErrorHandling(
          authUrl,
          {},
          'Failed to redirect to OAuth provider'
        );

        // W1: reset loading on success path (redirect may not navigate in test/mock environments)
        const successState = useOAuthStore.getState();
        successState.setLoading(false);
        successState.setPartnerConnecting(partnerId, false);

        // Reset error notification flag on success
        connectErrorNotified = 0;
      } catch (error) {
        const state = useOAuthStore.getState();
        state.setLoading(false);
        state.setPartnerConnecting(partnerId, false);

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to connect';

        // Dedup error notifications with cooldown
        if (Date.now() - connectErrorNotified > ERROR_DEDUP_COOLDOWN_MS) {
          handleError(error, {
            userMessage: `Failed to connect to ${partnerId}. Please try again.`,
            context: { partnerId },
            severity: 'error',
          });
          connectErrorNotified = Date.now();
        }

        state.setPartnerError(partnerId, errorMessage);
      }
    },
    [canProceed]
  );

  const disconnect = useCallback(
    async (partnerId: OAuthPartnerId) => {
      if (!isClient() || !canProceed) return;

      const state = useOAuthStore.getState();
      state.setLoading(true);
      state.setError(null);

      try {
        state.setPartnerDisconnected(partnerId);
        sessionStorage.removeItem(`oauth_${partnerId}_verifier`);
        sessionStorage.removeItem(`oauth_${partnerId}_credentials`);
        sessionStorage.removeItem(`oauth_state_${partnerId}`);
        sessionStorage.removeItem(`oauth_purpose_${partnerId}`);

        // Reset error notification flag on success
        disconnectErrorNotified = 0;
      } catch (error) {
        const state = useOAuthStore.getState();

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to disconnect';

        // Dedup error notifications with cooldown
        if (Date.now() - disconnectErrorNotified > ERROR_DEDUP_COOLDOWN_MS) {
          handleError(error, {
            userMessage: `Failed to disconnect from ${partnerId}. Please try again.`,
            context: { partnerId },
            severity: 'error',
          });
          disconnectErrorNotified = Date.now();
        }

        state.setPartnerError(partnerId, errorMessage);
      } finally {
        const state = useOAuthStore.getState();
        state.setLoading(false);
      }
    },
    [canProceed]
  );

  const handleCallback = useCallback(
    async (partnerId: OAuthPartnerId, code: string, callbackState?: string) => {
      if (!isClient() || !canProceed) return;

      const store = useOAuthStore.getState();
      store.setLoading(true);
      store.setError(null);

      try {
        // Validate CSRF state — C1: reject if storedState is null (never skip check)
        const storedState = sessionStorage.getItem(`oauth_state_${partnerId}`);
        if (!storedState) {
          throw new Error('OAuth state not found — possible CSRF attack');
        }
        // C3: storedState is prefixed with partnerId, verify it matches
        if (!storedState.startsWith(`${partnerId}_`)) {
          throw new Error(
            'OAuth state partnerId mismatch — possible CSRF attack'
          );
        }
        if (!callbackState || callbackState !== storedState) {
          throw new Error('OAuth state mismatch — possible CSRF attack');
        }
        sessionStorage.removeItem(`oauth_state_${partnerId}`);

        const codeVerifier = sessionStorage.getItem(
          `oauth_${partnerId}_verifier`
        );
        if (!codeVerifier) {
          throw new Error('OAuth code verifier not found');
        }

        // Retrieve purpose before exchange (needed for the request)
        const purpose =
          (sessionStorage.getItem(
            `oauth_purpose_${partnerId}`
          ) as OAuthPurpose) || 'api-access';
        sessionStorage.removeItem(`oauth_purpose_${partnerId}`);

        const redirectUri = getOAuthRedirectUri(partnerId);

        const credentials = await exchangeCodeForToken({
          provider: partnerId,
          purpose,
          code,
          redirectUri,
          codeVerifier,
        });

        store.setPartnerConnected(partnerId, credentials, purpose);
        sessionStorage.removeItem(`oauth_${partnerId}_verifier`);

        // Reset error notification flag on success
        callbackErrorNotified = 0;
      } catch (error) {
        const state = useOAuthStore.getState();

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to handle callback';

        // Dedup error notifications with cooldown
        if (Date.now() - callbackErrorNotified > ERROR_DEDUP_COOLDOWN_MS) {
          handleError(error, {
            userMessage: `Failed to complete ${partnerId} authentication. Please try again.`,
            context: { partnerId },
            severity: 'error',
          });
          callbackErrorNotified = Date.now();
        }

        state.setPartnerError(partnerId, errorMessage);
      } finally {
        const state = useOAuthStore.getState();
        state.setLoading(false);
      }
    },
    [canProceed]
  );

  // ==========================================================================
  // Store Methods (from Zustand store) - STABLE
  // ==========================================================================

  const isConnected = useCallback(
    (partnerId: OAuthPartnerId) => {
      if (!isClient() || !canProceed) return false;
      const state = useOAuthStore.getState();
      return state.isConnected(partnerId);
    },
    [canProceed]
  );

  const getCredentials = useCallback(
    (partnerId: OAuthPartnerId) => {
      if (!isClient() || !canProceed) return null;
      const state = useOAuthStore.getState();
      return state.getCredentials(partnerId);
    },
    [canProceed]
  );

  const methods = {
    connect,
    disconnect,
    handleCallback,
    isConnected,
    getCredentials,
  };

  // ==========================================================================
  // Store Subscriptions (REACTIVE)
  // ✅ ALWAYS subscribe to store - call hooks unconditionally
  // ==========================================================================

  // ✅ ALWAYS subscribe to store unconditionally - condition is INSIDE selector
  const storeValue = useOAuthStore((state) => {
    if (!STORE_KEYS.has(key)) return null;
    // Handle computed values that need store methods
    if (key === 'connectedPartners') {
      return state.getConnectedPartners();
    }
    // Simple property access for direct state properties
    return (state as any)[key];
  });

  // ==========================================================================
  // NOW conditionally return values (hooks already called above)
  // ==========================================================================

  // Graceful degradation: SSR or no consent/feature enabled → return degraded API
  if (!isClient() || !canProceed) {
    return DEGRADED_OAUTH_API[key];
  }

  // Return isAvailable (true when not in degraded mode)
  if (key === 'isAvailable') {
    return true as OAuthAPI[K];
  }

  // Return store value
  if (STORE_KEYS.has(key)) {
    return storeValue as OAuthAPI[K];
  }

  // Return method
  if (key in methods) {
    return methods[key as keyof typeof methods] as OAuthAPI[K];
  }

  // Fallback (should never happen with proper types)
  return DEGRADED_OAUTH_API[key];
}

// =============================================================================
// Helper functions
// =============================================================================

function buildAuthUrl(
  partnerId: OAuthPartnerId,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  purpose: OAuthPurpose,
  csrfState: string,
  customScopes?: string[],
  additionalParams?: Record<string, string>
): string {
  const partnerConfig = getOAuthPartnerConfig(partnerId);
  if (!partnerConfig) {
    throw new Error(`OAuth partner ${partnerId} not configured`);
  }

  const authUrl = partnerConfig.endpoints.authUrl;
  if (!authUrl) {
    throw new Error(`OAuth partner ${partnerId} has no auth URL configured`);
  }

  // Custom scopes override schema defaults
  const scopes =
    customScopes ??
    (partnerConfig.scopes as Record<string, readonly string[]>)[purpose] ??
    partnerConfig.scopes['api-access'] ??
    [];
  const scopeString = Array.isArray(scopes) ? scopes.join(' ') : '';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopeString,
    state: csrfState,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  // Merge additional params (e.g., login_hint, prompt)
  if (additionalParams) {
    for (const [key, value] of Object.entries(additionalParams)) {
      params.set(key, value);
    }
  }

  return `${authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 * Uses ICallableProvider (Firebase/Supabase) if configured,
 * falls back to HTTP (Vercel/Next API routes).
 */
async function exchangeCodeForToken(
  request: ExchangeTokenRequest
): Promise<OAuthCredentials> {
  // Path 1: Callable provider (Firebase / Supabase / custom)
  if (hasProvider('callable')) {
    const result = await getProvider('callable').call<
      ExchangeTokenRequest,
      ExchangeTokenResponse
    >('exchangeToken', request);
    return normalizeCredentials(result);
  }

  // Path 2: No callable → Vercel/Next (API routes at /api/*)
  const response = await fetch('/api/oauth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  return normalizeCredentials(await response.json());
}

/**
 * Normalize credentials from any backend response format.
 * Handles: Firebase callable, Vercel API routes, and direct responses.
 */
function normalizeCredentials(data: unknown): OAuthCredentials {
  if (!data || typeof data !== 'object') {
    throw new Error('Token exchange returned invalid response');
  }

  const obj = data as Record<string, unknown>;

  // Firebase callable: { success, credentials: { accessToken, ... } }
  if (obj.credentials && typeof obj.credentials === 'object') {
    return validateCredentials(obj.credentials as Record<string, unknown>);
  }

  // Vercel wrapped: { success, data: { access_token, ... } }
  if (obj.data && typeof obj.data === 'object') {
    return mapSnakeToCamel(obj.data as Record<string, unknown>);
  }

  // Direct camelCase: { accessToken, ... }
  if (typeof obj.accessToken === 'string') {
    return validateCredentials(obj);
  }

  // Direct snake_case: { access_token, ... }
  if (typeof obj.access_token === 'string') {
    return mapSnakeToCamel(obj);
  }

  throw new Error('Token exchange returned invalid credentials');
}

/** Validate that credentials contain a non-empty accessToken */
function validateCredentials(obj: Record<string, unknown>): OAuthCredentials {
  if (typeof obj.accessToken !== 'string' || obj.accessToken === '') {
    throw new Error('Token exchange returned empty access token');
  }
  return obj as unknown as OAuthCredentials;
}

/** Map snake_case token response to camelCase OAuthCredentials */
function mapSnakeToCamel(obj: Record<string, unknown>): OAuthCredentials {
  const accessToken = obj.access_token;
  if (typeof accessToken !== 'string' || accessToken === '') {
    throw new Error('Token exchange returned empty access token');
  }

  return {
    accessToken,
    refreshToken:
      typeof obj.refresh_token === 'string' ? obj.refresh_token : undefined,
    idToken: typeof obj.id_token === 'string' ? obj.id_token : undefined,
    tokenType: typeof obj.token_type === 'string' ? obj.token_type : undefined,
    expiresIn: typeof obj.expires_in === 'number' ? obj.expires_in : undefined,
    expiresAt:
      typeof obj.expires_in === 'number'
        ? Math.floor(Date.now() / 1000) + obj.expires_in
        : undefined,
    scope: typeof obj.scope === 'string' ? obj.scope.split(' ') : undefined,
  };
}
