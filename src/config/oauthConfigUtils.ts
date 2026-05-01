// packages/features/oauth/src/config/oauthConfigUtils.ts

/**
 * @fileoverview OAuth configuration utilities
 * @description Utilities for OAuth partner configuration and environment variable access
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import {
  OAUTH_PARTNERS,
  type OAuthPartnerId,
  getPlatformEnvVar,
} from '@donotdev/core';

/**
 * Check if an OAuth partner is enabled in the current environment
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 * @param partnerId - The OAuth partner to check
 * @returns True if the partner is enabled
 */
export function isOAuthPartnerEnabled(partnerId: OAuthPartnerId): boolean {
  // Check if partner exists in schema
  if (!OAUTH_PARTNERS[partnerId]) {
    return false;
  }

  // Check if partner is enabled in environment
  const enabledPartners = getPlatformEnvVar('OAUTH_PARTNERS');
  if (enabledPartners) {
    const partnerList = enabledPartners.split(',').map((p: string) => p.trim());
    return partnerList.includes(partnerId);
  }

  // If no environment variable, assume not enabled
  return false;
}
