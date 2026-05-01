/**
 * @fileoverview Expo API Safety Net — OAuth Package
 * @description Verifies that all @donotdev/oauth APIs consumed by @donotdev/expo exist.
 * If any test fails after a framework change, the expo package WILL break.
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { describe, it, expect, vi } from 'vitest';

const { createMockStore } = vi.hoisted(() => {
  const createMockStore = () => {
    const state: Record<string, any> = {};
    const store: any = (selector?: any) => (selector ? selector(state) : state);
    store.getState = () => state;
    store.setState = (partial: any) =>
      Object.assign(
        state,
        typeof partial === 'function' ? partial(state) : partial
      );
    store.subscribe = vi.fn(() => vi.fn());
    store.destroy = vi.fn();
    return store;
  };
  return { createMockStore };
});

vi.mock('@donotdev/core', () => ({
  FEATURE_STATUS: {
    INITIALIZING: 'initializing',
    READY: 'ready',
    DEGRADED: 'degraded',
    ERROR: 'error',
  },
  FRAMEWORK_FEATURES: { OAUTH: 'oauth' },
  handleError: vi.fn(),
  isClient: () => false,
  isDev: () => false,
  isFeatureAvailable: () => true,
  useFeatureConsent: () => true,
  useTranslation: () => ({ t: (k: string) => k }),
  redirectToExternalUrlWithErrorHandling: vi.fn(),
  createDoNotDevStore: vi.fn(() => createMockStore()),
  createSingleton: vi.fn((factory: any) => factory),
  getDndevConfig: () => ({}),
  getEnabledOAuthPartners: () => [],
  getStorageManager: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  })),
  OAUTH_PARTNERS: {},
}));

import * as mod from '@donotdev/oauth';

describe('Expo API Safety Net — @donotdev/oauth', () => {
  it('exports useOAuth hook', () => {
    expect(mod.useOAuth).toBeDefined();
    expect(typeof mod.useOAuth).toBe('function');
  });
});
