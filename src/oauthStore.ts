// packages/features/oauth/src/oauthStore.ts

/**
 * @fileoverview OAuth Store - Simple Zustand store
 * @description Single source of truth for OAuth state.
 * Uses unified FeatureStatus enum for lifecycle management.
 *
 * **Architecture:**
 * - Pure Zustand store (no events)
 * - Direct updates from OAuth operations
 * - Persists OAuth connections
 * - Partner credential management
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { createJSONStorage } from 'zustand/middleware';

import { createDoNotDevStore, FEATURE_STATUS } from '@donotdev/core';
import type {
  FeatureStatus,
  OAuthCredentials,
  OAuthPartnerId,
  OAuthPurpose,
} from '@donotdev/core';

/**
 * OAuth connection state for a single partner
 */
interface OAuthPartnerState {
  isConnected: boolean;
  isConnecting: boolean;
  credentials: OAuthCredentials | null;
  error: string | null;
  lastConnected?: string;
  purpose?: OAuthPurpose;
}

/**
 * OAuth store state interface
 */
interface OAuthState {
  // Unified status
  status: FeatureStatus;

  // Loading states (deprecated - use status)
  loading: boolean;
  error: string | null;

  // Partner connections
  partners: Record<OAuthPartnerId, OAuthPartnerState>;

  // Actions
  setStatus: (status: FeatureStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPartnerConnecting: (
    partnerId: OAuthPartnerId,
    connecting: boolean
  ) => void;
  setPartnerConnected: (
    partnerId: OAuthPartnerId,
    credentials: OAuthCredentials,
    purpose: OAuthPurpose
  ) => void;
  setPartnerDisconnected: (partnerId: OAuthPartnerId) => void;
  setPartnerError: (partnerId: OAuthPartnerId, error: string | null) => void;

  // Computed getters
  isConnected: (partnerId: OAuthPartnerId) => boolean;
  getCredentials: (partnerId: OAuthPartnerId) => OAuthCredentials | null;
  getConnectedPartners: () => OAuthPartnerId[];
  getPartnerState: (partnerId: OAuthPartnerId) => OAuthPartnerState | null;
}

/**
 * OAuth Store - Simple Zustand store for OAuth state
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthStore = createDoNotDevStore<OAuthState>({
  name: 'oauth-store',

  createStore: (set, get) => ({
    // Initial state
    status: FEATURE_STATUS.READY, // OAuth is ready once store is created
    loading: false,
    error: null,
    partners: {} as Record<OAuthPartnerId, OAuthPartnerState>,

    // Actions
    setStatus: (status: FeatureStatus) => set({ status }),

    setLoading: (loading: boolean) => set({ loading }),

    setError: (error: string | null) => set({ error }),

    setPartnerConnecting: (partnerId: OAuthPartnerId, connecting: boolean) =>
      set((state) => {
        const existing = state.partners[partnerId];
        return {
          partners: {
            ...state.partners,
            [partnerId]: {
              ...existing,
              isConnected: existing?.isConnected ?? false,
              credentials: existing?.credentials ?? null,
              isConnecting: connecting,
              error: connecting ? null : (existing?.error ?? null),
            },
          },
        };
      }),

    setPartnerConnected: (
      partnerId: OAuthPartnerId,
      credentials: OAuthCredentials,
      purpose: OAuthPurpose
    ) =>
      set((state) => ({
        partners: {
          ...state.partners,
          [partnerId]: {
            isConnected: true,
            isConnecting: false,
            credentials,
            error: null,
            lastConnected: new Date().toISOString(),
            purpose,
          },
        },
      })),

    setPartnerDisconnected: (partnerId: OAuthPartnerId) =>
      set((state) => ({
        partners: {
          ...state.partners,
          [partnerId]: {
            isConnected: false,
            isConnecting: false,
            credentials: null,
            error: null,
            lastConnected: state.partners[partnerId]?.lastConnected,
          },
        },
      })),

    setPartnerError: (partnerId: OAuthPartnerId, error: string | null) =>
      set((state) => {
        const existing = state.partners[partnerId];
        return {
          partners: {
            ...state.partners,
            [partnerId]: {
              ...existing,
              isConnected: existing?.isConnected ?? false,
              credentials: existing?.credentials ?? null,
              isConnecting: false,
              error,
            },
          },
        };
      }),

    // Computed getters
    isConnected: (partnerId: OAuthPartnerId) => {
      const state = get();
      return state.partners[partnerId]?.isConnected || false;
    },

    getCredentials: (partnerId: OAuthPartnerId) => {
      const state = get();
      return state.partners[partnerId]?.credentials || null;
    },

    getConnectedPartners: () => {
      const state = get();
      return Object.entries(state.partners)
        .filter(([_, partner]) => partner.isConnected)
        .map(([partnerId]) => partnerId as OAuthPartnerId);
    },

    getPartnerState: (partnerId: OAuthPartnerId) => {
      const state = get();
      return state.partners[partnerId] || null;
    },
  }),

  // sessionStorage: tokens die with tab close. Prevents XSS-accessible token persistence.
  // Trade-off: user re-authenticates on new tab. Acceptable for OAuth partner tokens.
  persistOptions: {
    name: 'dndev-oauth-store',
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({
      // Only persist partner connections, not loading states
      partners: state.partners,
    }),
  },
});

/**
 * OAuth store selector hooks for specific data
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthLoading = () => useOAuthStore((state) => state.loading);

/**
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthError = () => useOAuthStore((state) => state.error);

/**
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthPartners = () => useOAuthStore((state) => state.partners);

/**
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthPartner = (partnerId: OAuthPartnerId) =>
  useOAuthStore((state) => state.getPartnerState(partnerId));

/**
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthConnected = (partnerId: OAuthPartnerId) =>
  useOAuthStore((state) => state.isConnected(partnerId));

/**
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const useOAuthCredentials = (partnerId: OAuthPartnerId) =>
  useOAuthStore((state) => state.getCredentials(partnerId));
