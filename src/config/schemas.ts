// packages/features/oauth/src/config/schemas.ts

/**
 * @fileoverview OAuth validation schemas
 * @description Valibot schemas for OAuth request validation
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */

import * as v from 'valibot';

import type { OAuthPartnerId, OAuthPurpose } from '@donotdev/core';

/**
 * Schema for OAuth token exchange requests
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const exchangeTokenSchema = v.object({
  provider: v.string() as v.BaseSchema<
    unknown,
    OAuthPartnerId,
    v.BaseIssue<unknown>
  >,
  purpose: v.picklist(['authentication', 'api-access']) as v.BaseSchema<
    unknown,
    OAuthPurpose,
    v.BaseIssue<unknown>
  >,
  code: v.pipe(v.string(), v.minLength(1, 'Authorization code is required')),
  redirectUri: v.pipe(v.string(), v.url('Valid redirect URI is required')),
  codeVerifier: v.optional(v.string()),
  state: v.optional(v.string()),
  instance: v.optional(v.pipe(v.string(), v.url())),
});

/**
 * Schema for OAuth refresh token requests
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const refreshTokenSchema = v.object({
  provider: v.string() as v.BaseSchema<
    unknown,
    OAuthPartnerId,
    v.BaseIssue<unknown>
  >,
  refreshToken: v.pipe(v.string(), v.minLength(1, 'Refresh token is required')),
  redirectUri: v.pipe(v.string(), v.url('Valid redirect URI is required')),
});

/**
 * Schema for OAuth connection requests
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const connectionRequestSchema = v.object({
  provider: v.string() as v.BaseSchema<
    unknown,
    OAuthPartnerId,
    v.BaseIssue<unknown>
  >,
  purpose: v.picklist(['authentication', 'api-access']) as v.BaseSchema<
    unknown,
    OAuthPurpose,
    v.BaseIssue<unknown>
  >,
});

/**
 * Schema for OAuth disconnection requests
 *
 * @version 0.1.0
 * @since 0.0.1
 * @author AMBROISE PARK Consulting
 */
export const disconnectionRequestSchema = v.object({
  provider: v.string() as v.BaseSchema<
    unknown,
    OAuthPartnerId,
    v.BaseIssue<unknown>
  >,
  purpose: v.picklist(['authentication', 'api-access']) as v.BaseSchema<
    unknown,
    OAuthPurpose,
    v.BaseIssue<unknown>
  >,
});
