/**
 * Deposit System Configuration
 * 
 * Central config for the tool rental deposit system.
 * All deposit-related constants are defined here.
 */

// Fixed deposit amount in GBP
export const DEPOSIT_AMOUNT = 10.00;

// Claim window in days - owner has this many days after return to report damage
export const CLAIM_WINDOW_DAYS = 7;

// Claim window in milliseconds
export const CLAIM_WINDOW_MS = CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// Deposit statuses
export const DEPOSIT_STATUS = {
  NONE: 'none',           // No deposit (legacy rentals before deposit system)
  HELD: 'held',           // Deposit collected and being held during rental
  PENDING_RELEASE: 'pending_release', // Tool returned, within claim window
  RELEASED: 'released',   // Deposit refunded to renter (no claim made)
  CLAIMED: 'claimed',     // Owner reported damage, under review
  FORFEITED: 'forfeited', // Admin decided deposit goes to owner
  REFUNDED: 'refunded',   // Admin decided deposit goes back to renter after claim
} as const;

export type DepositStatus = typeof DEPOSIT_STATUS[keyof typeof DEPOSIT_STATUS];
