/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Page = 'SIGN_IN' | 'DASHBOARD' | 'FINANCE' | 'PAYOUTS' | 'TICKET_PAYOUTS' | 'WEBSITE' | 'BETS' | 'RESULTS' | 'SUPPORT';

export interface Stats {
  revenue: number;
  sportTicketsCount: number;
  sportTicketsAmount: number;
  sportPayoutCount: number;
  sportPayoutAmount: number;
  depositsCount: number;
  depositsAmount: number;
  withdrawalsCount: number;
  withdrawalsAmount: number;
}
