// packages/features/oauth/src/components/OAuthFallback.tsx

/**
 * @fileoverview OAuth Fallback Component
 * @description Graceful fallback when OAuth is not available or fails to load
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { FeatureFallback, withFeatureFallback } from '@donotdev/components';
import { isFeatureAvailable, FRAMEWORK_FEATURES } from '@donotdev/core';

/** Props for the OAuthFallback component. */
export interface OAuthFallbackProps {
  /** Custom message to display */
  message?: string;
  /** Whether to show a connect button (will be disabled) */
  showConnectButton?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Graceful fallback component when OAuth is not available
 * Prevents app crashes and provides clear feedback to users
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function OAuthFallback({
  message = 'OAuth connections are not available',
  showConnectButton = false,
  className = '',
}: OAuthFallbackProps) {
  return (
    <FeatureFallback
      featureName="OAuth Connections"
      message={message}
      icon="🔗"
      showActionButton={showConnectButton}
      actionButtonText="Connect (Unavailable)"
      className={className}
      helpText="This feature requires OAuth to be configured."
    />
  );
}

/**
 * Higher-order component that wraps OAuth components
 * Automatically shows OAuthFallback when OAuth is not available
 *
 * @param Component The OAuth component to wrap
 * @param fallbackProps Props to pass to OAuthFallback
 * @returns Wrapped component that handles OAuth availability
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function withOAuthFallback<P extends object>(
  Component: React.ComponentType<P>,
  fallbackProps?: Omit<OAuthFallbackProps, 'className'>
) {
  return withFeatureFallback(
    Component,
    'OAuth Connections',
    () => isFeatureAvailable(FRAMEWORK_FEATURES.OAUTH),
    {
      message: fallbackProps?.message,
      showActionButton: fallbackProps?.showConnectButton,
      actionButtonText: 'Connect (Unavailable)',
      icon: '🔗',
      helpText: 'This feature requires OAuth to be configured.',
    }
  );
}
