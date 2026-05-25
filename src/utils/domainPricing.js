/** Domains with asking price above ₹5,00,000 are premium (homepage only). */
export const PREMIUM_DOMAIN_MIN_PRICE = 500_000;

export function getDomainAskingPrice(domain) {
  return Number(domain?.askingPrice ?? 0);
}

export function isPremiumDomain(domain) {
  if (!domain || domain.saleType === 'AUCTION') return false;
  return getDomainAskingPrice(domain) > PREMIUM_DOMAIN_MIN_PRICE;
}
