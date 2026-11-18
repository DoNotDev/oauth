import { act, cleanup, renderHook } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { OAuthCredentials } from '@donotdev/core';

import {
  useOAuthConnected,
  useOAuthCredentials,
  useOAuthPartner,
  useOAuthStore,
} from '../oauthStore';

const liveCredentials: OAuthCredentials = { accessToken: 'live-test-token' };
const initialState = useOAuthStore.getInitialState();

function usePartnerSelection() {
  return {
    partner: useOAuthPartner('github'),
    connected: useOAuthConnected('github'),
    credentials: useOAuthCredentials('github'),
  };
}

type Selection = ReturnType<typeof usePartnerSelection>;

function Probe({ capture }: { capture: (selection: Selection) => void }) {
  const selection = usePartnerSelection();
  capture(selection);
  return <span>{JSON.stringify(selection)}</span>;
}

const missing: Selection = { partner: null, connected: false, credentials: null };

describe('OAuth convenience hook snapshots', () => {
  beforeEach(() => {
    useOAuthStore.setState(initialState, true);
  });

  afterEach(() => {
    cleanup();
    useOAuthStore.setState(initialState, true);
  });

  it('keeps the real server snapshot through hydration before handing off to live data', async () => {
    const serverState = useOAuthStore.getInitialState();
    const selections: Selection[] = [];
    const capture = (selection: Selection) => { selections.push(selection); };
    const tree = <Probe capture={capture} />;
    const html = renderToString(tree);
    expect(selections).toEqual([missing]);

    // Change live data after SSR but before hydration. Imperative getters must
    // keep seeing live state, even when called on an older snapshot.
    useOAuthStore.getState().setPartnerConnected('github', liveCredentials, 'authentication');
    expect(serverState.getCredentials('github')).toBe(liveCredentials);
    expect(serverState.getPartnerState('github')).toBe(useOAuthStore.getState().partners.github);
    expect(serverState.isConnected('github')).toBe(true);

    selections.length = 0;
    expect(renderToString(tree)).toBe(html);
    expect(selections).toEqual([missing]);
    selections.length = 0;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, tree, {
          onRecoverableError: (error) => { errors.push(error); },
        });
      });
      expect(errors).toEqual([]);
      expect(selections[0]).toEqual(missing);
      const expectedLive: Selection = {
        partner: useOAuthStore.getState().partners.github,
        connected: true,
        credentials: liveCredentials,
      };
      expect(selections.at(-1)).toEqual(expectedLive);
      expect(container.textContent).toBe(JSON.stringify(expectedLive));
      expect(selections.at(-1)?.partner).toBe(expectedLive.partner);
      expect(selections.at(-1)?.credentials).toBe(liveCredentials);

      act(() => { useOAuthStore.getState().setPartnerDisconnected('github'); });
      expect(selections.at(-1)?.connected).toBe(false);
      expect(selections.at(-1)?.credentials).toBeNull();
      expect(selections.at(-1)?.partner).toBe(useOAuthStore.getState().partners.github);
    } finally {
      await act(async () => { root?.unmount(); });
      container.remove();
    }
  });

  it('preserves missing defaults, partner shapes and reactive action updates', () => {
    const { result } = renderHook(usePartnerSelection);
    expect(result.current).toEqual(missing);

    const expectLiveSelection = () => {
      const state = useOAuthStore.getState();
      expect(result.current.partner).toBe(state.getPartnerState('github'));
      expect(result.current.connected).toBe(state.isConnected('github'));
      expect(result.current.credentials).toBe(state.getCredentials('github'));
    };

    act(() => { useOAuthStore.getState().setPartnerConnecting('github', true); });
    expect(result.current).toEqual({
      partner: { isConnected: false, isConnecting: true, credentials: null, error: null },
      connected: false,
      credentials: null,
    });
    expectLiveSelection();

    act(() => { useOAuthStore.getState().setPartnerConnected('github', liveCredentials, 'api-access'); });
    expect(result.current.partner).toEqual({
      isConnected: true,
      isConnecting: false,
      credentials: liveCredentials,
      error: null,
      lastConnected: expect.any(String),
      purpose: 'api-access',
    });
    expect(result.current.credentials).toBe(liveCredentials);
    expectLiveSelection();

    act(() => { useOAuthStore.getState().setPartnerError('github', 'test error'); });
    expect(result.current.partner?.error).toBe('test error');
    expect(result.current.connected).toBe(true);
    expectLiveSelection();

    const lastConnected = result.current.partner?.lastConnected;
    act(() => { useOAuthStore.getState().setPartnerDisconnected('github'); });
    expect(result.current).toEqual({
      partner: {
        isConnected: false, isConnecting: false, credentials: null, error: null, lastConnected,
      },
      connected: false,
      credentials: null,
    });
    expectLiveSelection();

    act(() => { useOAuthStore.setState({ partners: initialState.partners }); });
    expect(result.current).toEqual(missing);
  });
});
