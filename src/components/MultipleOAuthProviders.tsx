'use client';
// packages/features/oauth/src/components/MultipleOAuthProviders.tsx

/**
 * @fileoverview Multiple OAuth Providers - Auto-discovers OAuth providers
 * @description OAuth equivalent of MultipleAuthProviders - fully schema-driven
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { useId } from 'react';

import { Alert, type ButtonVariant, Stack, Grid } from '@donotdev/components';
import {
  useTranslation,
  getEnabledOAuthPartners,
  type OAuthPartnerId,
  type OAuthPurpose,
} from '@donotdev/core';

import { withOAuthFallback } from './OAuthFallback';
import { OAuthPartnerButton } from './OAuthPartnerButton';

/**
 * Props for the MultipleOAuthProviders component
 */
export interface MultipleOAuthProvidersProps {
  /** OAuth providers to display (defaults to auto-discovered enabled providers) */
  providers?: OAuthPartnerId[];
  /** Purpose for OAuth connections */
  purpose?: OAuthPurpose;
  /** CSS class for the container element */
  containerClassName?: string;
  /** CSS class for each provider button */
  providerClassName?: string;
  /** Button variant to use */
  variant?: ButtonVariant;
  /** Layout of the provider buttons */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** Whether to show text labels on buttons */
  showLabels?: boolean;
  /** Accessible label for the OAuth providers region */
  ariaLabel?: string;
  /** ID for the component (auto-generated if not provided) */
  id?: string;
  /** Whether buttons should take full width of their container */
  fullWidth?: boolean;
  /** Callbacks */
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Component that renders multiple OAuth provider buttons
 * Automatically discovers enabled providers from schema + env
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 * @example
 * // Zero config - auto-discovers enabled providers!
 * <MultipleOAuthProviders />
 *
 * // Customized styling
 * <MultipleOAuthProviders
 * layout="horizontal"
 * variant="outline"
 *
 * purpose="api-access"
 * />
 */
const MultipleOAuthProvidersComponent: React.ComponentType<
  MultipleOAuthProvidersProps
> = ({
  providers = getEnabledOAuthPartners(), // ✅ Auto-discover from schema + env
  purpose = 'api-access',
  containerClassName = '',
  providerClassName = '',
  variant = 'outline',
  layout = 'vertical',
  showLabels = true,
  ariaLabel,
  id,
  fullWidth = true,
  onSuccess,
  onError,
}: MultipleOAuthProvidersProps) => {
  const { t } = useTranslation('oauth');
  const reactId = useId();
  const componentId = id || `oauth-providers-${reactId}`;

  // Show helpful message if no providers are enabled
  if (providers.length === 0) {
    return (
      <Alert
        title={t('noProviders', 'No OAuth Providers')}
        description={t(
          'noProvidersMessage',
          'No OAuth providers are currently enabled. Check your environment configuration.'
        )}
      />
    );
  }

  const renderProviders = () => {
    const content = providers.map(
      (partnerId: OAuthPartnerId, index: number) => (
        <OAuthPartnerButton
          key={partnerId}
          partnerId={partnerId}
          purpose={purpose}
          className={`${providerClassName} ${fullWidth ? 'dndev-w-full' : ''}`}
          tabIndex={index === 0 ? 0 : undefined}
          id={`${componentId}-${partnerId}-button`}
          onSuccess={onSuccess}
          onOAuthError={onError}
        >
          {showLabels
            ? `${partnerId.charAt(0).toUpperCase() + partnerId.slice(1)}`
            : null}
        </OAuthPartnerButton>
      )
    );

    if (layout === 'grid') {
      return (
        <Grid
          cols={{ base: 1, sm: 2, md: 3 } as any}
          className={containerClassName}
        >
          {content}
        </Grid>
      );
    }

    return (
      <Stack
        direction={layout === 'horizontal' ? 'row' : 'column'}
        wrap={layout === 'horizontal' ? 'wrap' : undefined}
        align={layout === 'horizontal' ? 'center' : 'stretch'}
        className={containerClassName}
      >
        {content}
      </Stack>
    );
  };

  return (
    <div
      className="dndev-mx-auto"
      id={componentId}
      role="region"
      aria-label={
        ariaLabel || t('aria.connectionOptions', 'Service connection options')
      }
    >
      {renderProviders()}
    </div>
  );
};

/**
 * Multiple OAuth providers component with automatic fallback handling
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const MultipleOAuthProviders = withOAuthFallback(
  MultipleOAuthProvidersComponent,
  {
    message: 'OAuth connections are not configured',
    showConnectButton: true,
  }
);

export default MultipleOAuthProviders;
