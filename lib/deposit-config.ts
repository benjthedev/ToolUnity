/**
 * Deposit System Configuration
 * 
 * Central config for the tool rental deposit system.
 * All deposit-related constants are defined here.
 */

// Deposit calculation constants
export const DEPOSIT_PERCENTAGE = 0.20; // 20% of tool value
export const MIN_DEPOSIT = 10.00; // Minimum deposit in GBP
export const MAX_DEPOSIT = 500.00; // Maximum deposit in GBP

// Legacy fixed deposit (fallback if tool_value is missing)
export const DEPOSIT_AMOUNT = 10.00;

// Calculate deposit based on tool value: 20% of value, min £10, max £500
export function calculateDeposit(toolValue: number | null | undefined): number {
  if (!toolValue || toolValue <= 0) return MIN_DEPOSIT;
  const deposit = toolValue * DEPOSIT_PERCENTAGE;
  return Math.round(Math.max(MIN_DEPOSIT, Math.min(deposit, MAX_DEPOSIT)) * 100) / 100;
}

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
