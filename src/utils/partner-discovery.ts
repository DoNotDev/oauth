// packages/features/oauth/src/utils/partner-discovery.ts

/**
 * @fileoverview OAuth Partner discovery utilities
 * @description Demonstrates schema-driven OAuth partner discovery and configuration
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import {
  OAUTH_PARTNERS,
  type OAuthPartnerId,
  getEnabledOAuthPartners as getEnabledOAuthPartnersFromEnv,
} from '@donotdev/core';

/**
 * Get all OAuth partners from schema
 * @returns Array of all partner IDs defined in OAUTH_PARTNERS
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function getAllOAuthPartners(): OAuthPartnerId[] {
  return Object.keys(OAUTH_PARTNERS) as OAuthPartnerId[];
}

/**
 * Get enabled OAuth partners from environment variables
 * @returns Array of partner IDs that are enabled via OAUTH_PARTNERS env var
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function getEnabledOAuthPartners(): OAuthPartnerId[] {
  // Use the centralized function from @donotdev/core
  return getEnabledOAuthPartnersFromEnv();
}

/**
 * Get disabled OAuth partners (all partners not enabled via environment)
 * @returns Array of partner IDs that are not enabled via OAUTH_PARTNERS env var
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function getDisabledOAuthPartners(): OAuthPartnerId[] {
  const enabledPartners = getEnabledOAuthPartners();
  return getAllOAuthPartners().filter(
    (partnerId) => !enabledPartners.includes(partnerId)
  );
}

/**
 * Get partner configuration by ID
 * @param partnerId - The partner ID to get configuration for
 * @returns Partner configuration or undefined if not found
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function getOAuthPartnerConfig(partnerId: OAuthPartnerId) {
  return OAUTH_PARTNERS[partnerId];
}

/**
 * Get partner button component name from schema
 * @param partnerId - The partner ID
 * @returns The component name that would be generated (e.g., 'GoogleOAuthButton')
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function getOAuthPartnerButtonName(partnerId: OAuthPartnerId): string {
  const config = OAUTH_PARTNERS[partnerId];
  return config ? `${config.name}OAuthButton` : '';
}

/**
 * Utility to demonstrate schema-driven discovery
 * Logs all partner information to console
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function logOAuthPartnerDiscovery() {
  console.group('🔍 Schema-Driven OAuth Partner Discovery');

  console.log('📋 All Partners:', getAllOAuthPartners());
  console.log('✅ Enabled Partners:', getEnabledOAuthPartners());
  console.log('❌ Disabled Partners:', getDisabledOAuthPartners());

  console.group('🔲 Button Component Names:');
  getAllOAuthPartners().forEach((partnerId) => {
    const buttonName = getOAuthPartnerButtonName(partnerId);
    const isEnabled = getEnabledOAuthPartners().includes(partnerId);
    console.log(
      `${partnerId} → ${buttonName} (${isEnabled ? 'enabled' : 'disabled'})`
    );
  });
  console.groupEnd();

  console.groupEnd();
}

/**
 * Runtime validation: Check if all partners in schema have valid configurations
 * @returns Object with validation results
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export function validateOAuthPartnerIntegrity() {
  const issues: string[] = [];
  const partners = getAllOAuthPartners();

  partners.forEach((partnerId) => {
    const config = getOAuthPartnerConfig(partnerId);

    if (!config) {
      issues.push(`Partner '${partnerId}' has no configuration`);
      return;
    }

    if (!config.name) {
      issues.push(`Partner '${partnerId}' missing name`);
    }

    if (!config.endpoints?.authUrl) {
      issues.push(`Partner '${partnerId}' missing auth URL`);
    }

    if (!config.endpoints?.tokenUrl) {
      issues.push(`Partner '${partnerId}' missing token URL`);
    }

    if (!config.icon) {
      issues.push(`Partner '${partnerId}' missing icon`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    totalPartners: partners.length,
    enabledPartners: getEnabledOAuthPartners().length,
    disabledPartners: getDisabledOAuthPartners().length,
  };
}
