// packages/features/oauth/src/index.ts

/**
 * @fileoverview OAuth package
 * @description OAuth integration package for DoNotDev framework. Provides OAuth hooks, stores, components, and utilities for third-party authentication providers.
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

// Core OAuth Hook
export { useOAuth } from './useOAuth';

// Public "Lego Block" Components
export {
  MultipleOAuthProviders,
  OAuthConnectionModal,
  OAuthFallback,
  OAuthPartnerButton,
} from './components';

// Component Prop Types
export type {
  MultipleOAuthProvidersProps,
  OAuthConnectionModalProps,
  OAuthFallbackProps,
  OAuthPartnerButtonProps,
} from './components';

// Note: Internal store hooks (useOAuthStore, useOAuthLoading, etc.) are
// intentionally not re-exported to maintain a strict, minimal public API.
// All functionality should be accessed via useOAuth().
