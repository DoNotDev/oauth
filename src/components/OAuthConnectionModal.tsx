// packages/features/oauth/src/components/OAuthConnectionModal.tsx

/**
 * @fileoverview OAuth Connection Modal - Auto-discovers OAuth providers
 * @description Just like LoginModal but for OAuth integrations - fully plug-and-play
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import { Dialog, BUTTON_VARIANT } from '@donotdev/components';
import { useTranslation, getEnabledOAuthPartners } from '@donotdev/core';

import { MultipleOAuthProviders } from './MultipleOAuthProviders';

/** Props for the OAuthConnectionModal component. */
export interface OAuthConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Purpose for OAuth connections */
  purpose?: 'api-access' | 'authentication';
  /** Optional title override */
  title?: string;
  /** Optional description override */
  description?: string;
}

/**
 * Modal dialog for OAuth connections
 * Automatically discovers enabled OAuth providers from schema + env
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 *
 * @example
 * ```tsx
 * // Just import and use - zero configuration needed!
 * <OAuthConnectionModal
 * open={showModal}
 * onOpenChange={setShowModal}
 * />
 * ```
 */
export function OAuthConnectionModal({
  open,
  onOpenChange,
  purpose = 'api-access',
  title,
  description,
}: OAuthConnectionModalProps) {
  const { t } = useTranslation('oauth');

  // Auto-discover enabled OAuth providers (zero config!)
  const enabledProviders = getEnabledOAuthPartners();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title || t('connectServices', 'Connect Services')}
      description={
        description ||
        t(
          'oauth.chooseService',
          'Choose which services to connect for enhanced functionality'
        )
      }
    >
      <div style={{ padding: 'var(--gap-md)' }}>
        {enabledProviders.length > 0 ? (
          <MultipleOAuthProviders
            providers={enabledProviders}
            purpose={purpose}
            layout="vertical"
            variant={BUTTON_VARIANT.OUTLINE}
            showLabels={true}
          />
        ) : (
          <div
            style={{
              paddingTop: 'var(--gap-lg)',
              paddingBottom: 'var(--gap-lg)',
              color: 'var(--muted-foreground)',
            }}
          >
            <p>
              {t(
                'oauth.noProvidersEnabled',
                'No OAuth providers are currently enabled'
              )}
            </p>
            <p
              style={{
                marginTop: 'var(--gap-sm)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {t(
                'oauth.checkConfiguration',
                'Check your environment configuration'
              )}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
