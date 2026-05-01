// packages/features/oauth/src/components/OAuthPartnerButton.tsx

/**
 * @fileoverview OAuth Partner Button - OAuth button with partner icon
 * @description OAuth button that renders the partner icon (like AuthPartnerButton)
 * and uses useOAuth() for connect/disconnect.
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { useMemo } from 'react';

import {
  Button,
  BUTTON_VARIANT,
  DISPLAY,
  Spinner,
  PROVIDER_ICONS,
  DefaultProviderIcon,
} from '@donotdev/components';
import { OAUTH_PARTNERS } from '@donotdev/core';
import type { OAuthPartnerId, OAuthPurpose } from '@donotdev/core';

import { useOAuthPartner, useOAuthStore } from '../oauthStore';
import { useOAuth } from '../useOAuth';

import type { ButtonHTMLAttributes, CSSProperties } from 'react';

/** Props for the OAuthPartnerButton component. */
export interface OAuthPartnerButtonProps {
  partnerId: OAuthPartnerId;
  purpose?: OAuthPurpose;
  onSuccess?: (result: any) => void;
  onOAuthError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  display?: (typeof DISPLAY)[keyof typeof DISPLAY];
  style?: CSSProperties;
}

/**
 * OAuth Partner Button with provider icon
 *
 * Renders the partner's branded icon and uses the Button component
 * for consistent styling with AuthPartnerButton.
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function OAuthPartnerButton({
  partnerId,
  purpose = 'api-access',
  onSuccess,
  onOAuthError,
  className = '',
  children,
  disabled = false,
  display = DISPLAY.AUTO,
  style,
  ...props
}: OAuthPartnerButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onError' | 'onSuccess'>) {
  // C1: use reactive store selector instead of useOAuth('isConnected') which calls getState() (non-reactive)
  const isConnectedToPartner = useOAuthStore(
    (state) => state.partners[partnerId]?.isConnected ?? false
  );
  const connect = useOAuth('connect');
  const disconnect = useOAuth('disconnect');
  // W2: use per-partner isConnecting from store, not global status
  const partnerState = useOAuthPartner(partnerId);
  const loading = partnerState?.isConnecting ?? false;

  const partnerConfig = OAUTH_PARTNERS[partnerId];

  const ProviderIcon = useMemo(
    () =>
      PROVIDER_ICONS[partnerId as keyof typeof PROVIDER_ICONS] ||
      DefaultProviderIcon,
    [partnerId]
  );

  const handleClick = async () => {
    try {
      if (isConnectedToPartner) {
        await disconnect(partnerId);
      } else {
        // connect() redirects the browser to the OAuth provider — onSuccess
        // cannot run here because navigation leaves the page. The success
        // callback only applies to disconnect and callback flows.
        await connect(partnerId, { purpose });
      }
    } catch (error) {
      onOAuthError?.(error as Error);
    }
  };

  const partnerName = partnerConfig?.name || partnerId;

  const getButtonText = () => {
    if (children) return children;
    if (loading) return `Connecting to ${partnerName}...`;
    if (isConnectedToPartner) return `Disconnect ${partnerName}`;
    return `Connect ${partnerName}`;
  };

  const buttonStyle = partnerConfig?.button
    ? ({
        backgroundColor: partnerConfig.button.backgroundColor,
        color: partnerConfig.button.textColor,
        borderColor: partnerConfig.button.borderColor,
        '--partner-hover-bg': partnerConfig.button.hoverBackgroundColor,
      } as CSSProperties & { '--partner-hover-bg': string })
    : undefined;

  const mergedStyle = style ? { ...buttonStyle, ...style } : buttonStyle;

  return (
    <Button
      {...props}
      variant={BUTTON_VARIANT.OUTLINE}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      display={display}
      aria-label={
        loading
          ? `Connecting to ${partnerName}...`
          : isConnectedToPartner
            ? `Disconnect ${partnerName}`
            : `Connect ${partnerName}`
      }
      tooltip={partnerState?.error || undefined}
      style={mergedStyle}
      className={className}
      icon={loading ? <Spinner aria-label="Loading" /> : ProviderIcon}
    >
      {display !== DISPLAY.COMPACT && getButtonText()}
    </Button>
  );
}
