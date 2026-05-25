/**
 * Mock rows for the hero domain strip.
 * `sold` + centered: flip → DOMAIN SOLD stamp → permanent sold UI.
 */
export const DOMAIN_HERO_MOCK = [
  {
    id: 'd1',
    name: 'brandify',
    tld: 'io',
    price: 124_000,
    status: 'available',
    bidders: '8,200+',
    successRate: '96%',
  },
  {
    id: 'd2',
    name: 'nexusflow',
    tld: 'com',
    price: 67_200,
    status: 'sold',
    owner: '@pulsehq',
    pendingSeal: true,
    bidders: '12,450+',
    successRate: '98%',
  },
  {
    id: 'd3',
    name: 'elevate',
    tld: 'ai',
    price: 189_000,
    status: 'available',
    bidders: '9,100+',
    successRate: '97%',
  },
  {
    id: 'd4',
    name: 'quantumx',
    tld: 'ai',
    price: 89_500,
    status: 'sold',
    owner: '@vertexlabs',
    pendingSeal: true,
    bidders: '11,200+',
    successRate: '99%',
  },
  {
    id: 'd5',
    name: 'orbitmint',
    tld: 'xyz',
    price: 41_800,
    status: 'available',
    bidders: '6,800+',
    successRate: '95%',
  },
];

export function tripleMock(list) {
  return [...list, ...list, ...list];
}
