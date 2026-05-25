/**
 * Map venture form state (camelCase) to FastAPI CreateVentureRequest / UpdateVentureRequest (snake_case).
 */

import { asArray } from './asArray';

function blankToNull(value) {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

/** Normalize Indian 10-digit numbers and other inputs to E.164 for the API. */
export function normalizePhoneE164(phone) {
  const raw = blankToNull(phone);
  if (!raw) return null;
  const compact = String(raw).replace(/[\s\-().]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  if (/^\d{10}$/.test(compact)) return `+91${compact}`;
  return null;
}

/** Optional phone field: blank is ok; partial/invalid returns an error message. */
export function validateOptionalPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return { ok: true, value: null };
  const normalized = normalizePhoneE164(digits);
  if (!normalized) {
    return {
      ok: false,
      error: 'Enter a valid 10-digit phone number (e.g. 9876543210) or leave the field empty.',
    };
  }
  return { ok: true, value: normalized };
}

function mapBrandDetails(brand = {}, { isAuction } = {}) {
  const website = blankToNull(brand.website);
  const videoUrl = blankToNull(brand.videoUrl ?? brand.video_url);
  const imageUrl = blankToNull(
    brand.ventureImageUrl ?? brand.venture_image_url ?? brand.referenceImageUrl ?? brand.reference_image_url,
  );

  const dealRaw = brand.dealValue ?? brand.deal_value;
  let dealValue = null;
  if (!isAuction && dealRaw !== '' && dealRaw != null) {
    dealValue = Number(dealRaw);
    if (Number.isNaN(dealValue)) dealValue = null;
  }

  const out = {
    brand_name: blankToNull(brand.brandName ?? brand.brand_name),
    description: blankToNull(brand.description),
    website: website === 'https://' ? null : website,
    video_url: videoUrl,
    industry: blankToNull(brand.industry),
    venture_type: blankToNull(brand.ventureType ?? brand.venture_type),
    deal_value: dealValue,
  };

  if (imageUrl) out.venture_image_url = imageUrl;

  return out;
}

function mapContactInfo(contact = {}) {
  const email = blankToNull(contact.email);
  const phone = normalizePhoneE164(contact.phoneNumber ?? contact.phone_number);
  if (!email && !phone) return null;
  return { email, phone_number: phone };
}

function mapRoles(form) {
  const lookingFor = blankToNull(form.lookingFor ?? form.looking_for);
  if (lookingFor) {
    return [{ description: lookingFor }];
  }
  const roles = form.roles;
  if (!Array.isArray(roles) || roles.length === 0) return [];
  return roles.map((r) => ({
    type: blankToNull(r.type),
    title: blankToNull(r.title),
    skill_domain: blankToNull(r.skillDomain ?? r.skill_domain),
    description: blankToNull(r.description),
    commitment: blankToNull(r.commitment),
    location: blankToNull(r.location),
    experience_level: blankToNull(r.experienceLevel ?? r.experience_level),
    equity_min: r.equityMin ?? r.equity_min ?? null,
    equity_max: r.equityMax ?? r.equity_max ?? null,
    vesting_terms: blankToNull(r.vestingTerms ?? r.vesting_terms),
    salary_min: r.salaryMin ?? r.salary_min ?? null,
    salary_max: r.salaryMax ?? r.salary_max ?? null,
    budget_min: r.budgetMin ?? r.budget_min ?? null,
    budget_max: r.budgetMax ?? r.budget_max ?? null,
    investment_min: r.investmentMin ?? r.investment_min ?? null,
    investment_max: r.investmentMax ?? r.investment_max ?? null,
  }));
}

/** Build POST /api/v1/venture/ body from form state. */
export function toVentureApiPayload(form) {
  const saleType = form.saleType ?? form.sale_type ?? 'REGULAR';
  const isAuction = saleType === 'AUCTION';

  const auctionMin = form.auctionMinBidPrice ?? form.auction_min_bid_price;
  const auctionDuration = form.auctionDuration ?? form.auction_duration;

  return {
    brand_details: mapBrandDetails(form.brandDetails ?? form.brand_details ?? {}, { isAuction }),
    contact_info: mapContactInfo(form.contactInfo ?? form.contact_info ?? {}),
    agreement: {
      terms: Boolean(form.agreement?.terms),
    },
    status: form.status !== false,
    stage: blankToNull(form.stage),
    current_problem: blankToNull(form.currentProblem ?? form.current_problem),
    sale_type: saleType,
    auction_min_bid_price:
      isAuction && auctionMin !== '' && auctionMin != null ? Number(auctionMin) : null,
    auction_duration: isAuction ? blankToNull(auctionDuration) : null,
    roles: mapRoles(form),
  };
}

/** Map API venture (snake_case) to VentureForm initial state (camelCase). */
export function fromVentureApiToForm(venture) {
  if (!venture) return null;

  const brand = venture.brand_details ?? venture.brandDetails ?? {};
  const contact = venture.contact_info ?? venture.contactInfo ?? {};
  const agreement = venture.agreement ?? { terms: false };
  const roles = venture.roles ?? [];
  const firstRole = roles[0];

  const phone = contact.phone_number ?? contact.phoneNumber ?? '';
  const phoneDigits = phone.startsWith('+91')
    ? phone.slice(3)
    : phone.replace(/\D/g, '').slice(-10);

  return {
    brandDetails: {
      brandName: brand.brand_name ?? brand.brandName ?? '',
      description: brand.description ?? '',
      website: brand.website ?? 'https://',
      videoUrl: brand.video_url ?? brand.videoUrl ?? '',
      industry: brand.industry ?? '',
      dealValue: brand.deal_value ?? brand.dealValue ?? '',
      ventureType: brand.venture_type ?? brand.ventureType ?? '',
      ventureImageUrl: brand.venture_image_url ?? brand.ventureImageUrl ?? '',
      referenceImageUrl: brand.venture_image_url ?? brand.ventureImageUrl ?? '',
    },
    contactInfo: {
      email: contact.email ?? '',
      phoneNumber: phoneDigits,
    },
    agreement: { terms: Boolean(agreement.terms) },
    status: venture.status !== false,
    stage: venture.stage ?? '',
    lookingFor: firstRole?.description ?? venture.looking_for ?? venture.lookingFor ?? '',
    currentProblem: venture.current_problem ?? venture.currentProblem ?? '',
    saleType: venture.sale_type ?? venture.saleType ?? 'REGULAR',
    auctionMinBidPrice: venture.auction_min_bid_price ?? venture.auctionMinBidPrice ?? '',
    auctionDuration: venture.auction_duration ?? venture.auctionDuration ?? '',
    roles,
  };
}

function mapBrandDetailsForUi(brand = {}) {
  const imageUrl = brand.venture_image_url ?? brand.ventureImageUrl ?? '';
  return {
    brandName: brand.brand_name ?? brand.brandName ?? '',
    description: brand.description ?? '',
    website: brand.website ?? '',
    videoUrl: brand.video_url ?? brand.videoUrl ?? '',
    industry: brand.industry ?? '',
    dealValue: brand.deal_value ?? brand.dealValue ?? null,
    ventureType: brand.venture_type ?? brand.ventureType ?? '',
    ventureImageUrl: imageUrl,
    logoUrl: brand.logoUrl ?? imageUrl,
  };
}

function mapListedByForUi(user) {
  if (!user) return null;
  return {
    ...user,
    id: user.id,
    email: user.email,
    fullName: user.full_name ?? user.fullName,
    displayName: user.display_name ?? user.displayName,
  };
}

/** Map a single venture API record (snake_case) to UI shape (camelCase). */
export function mapVentureForUi(venture) {
  if (!venture) return venture;

  const brand = venture.brand_details ?? venture.brandDetails ?? {};
  const contact = venture.contact_info ?? venture.contactInfo;
  const agreement = venture.agreement;
  const listedBy = venture.listed_by ?? venture.listedBy;
  const roles = venture.roles ?? [];
  const firstRole = roles[0];

  return {
    ...venture,
    id: venture.id,
    status: venture.status,
    views: venture.views ?? 0,
    stage: venture.stage,
    currentProblem: venture.current_problem ?? venture.currentProblem,
    saleType: venture.sale_type ?? venture.saleType ?? 'REGULAR',
    auctionMinBidPrice: venture.auction_min_bid_price ?? venture.auctionMinBidPrice,
    auctionDuration: venture.auction_duration ?? venture.auctionDuration,
    verified: venture.verified,
    verifiedAt: venture.verified_at ?? venture.verifiedAt,
    gstinVerified: venture.gstin_verified ?? venture.gstinVerified,
    featured: venture.featured,
    createdAt: venture.created_at ?? venture.createdAt,
    updatedAt: venture.updated_at ?? venture.updatedAt,
    coVentureApplicationCount:
      venture.co_venture_application_count ?? venture.coVentureApplicationCount ?? 0,
    brandDetails: mapBrandDetailsForUi(brand),
    contactInfo: contact
      ? {
          email: contact.email ?? '',
          phoneNumber: contact.phone_number ?? contact.phoneNumber ?? '',
        }
      : venture.contactInfo,
    agreement,
    listedBy: mapListedByForUi(listedBy),
    roles,
    lookingFor: firstRole?.description ?? venture.lookingFor ?? '',
    auction: venture.auction,
  };
}

/** Map venture auction API object to camelCase for cards/dashboard. */
export function mapVentureAuctionForUi(auction) {
  if (!auction) return null;
  return {
    id: auction.id,
    ventureId: auction.venture_id ?? auction.ventureId,
    status: auction.status,
    approvalStatus: auction.approval_status ?? auction.approvalStatus,
    duration: auction.duration,
    minBidPrice: auction.min_bid_price ?? auction.minBidPrice ?? 0,
    currentHighestBid: auction.current_highest_bid ?? auction.currentHighestBid ?? 0,
    totalBids: auction.total_bids ?? auction.totalBids ?? 0,
    endTime: auction.end_time ?? auction.endTime,
    startTime: auction.start_time ?? auction.startTime,
    rejectionReason: auction.rejection_reason ?? auction.rejectionReason,
  };
}

/** Fetch auction metadata for each AUCTION venture and merge into list items. */
export async function attachVentureAuctions(ventures, ventureAuctionAPI) {
  const auctionVentures = ventures.filter((v) => v.saleType === 'AUCTION');
  if (auctionVentures.length === 0) return ventures;

  const pairs = await Promise.all(
    auctionVentures.map(async (v) => {
      try {
        const { data } = await ventureAuctionAPI.getByVenture(v.id);
        const body = data?.data ?? data;
        return { id: v.id, auction: mapVentureAuctionForUi(body?.auction) };
      } catch {
        return { id: v.id, auction: null };
      }
    }),
  );

  const byId = Object.fromEntries(pairs.map((p) => [p.id, p.auction]));
  return ventures.map((v) => {
    if (v.saleType !== 'AUCTION') return v;
    const auction = byId[v.id];
    const minFromVenture = v.auctionMinBidPrice;
    return {
      ...v,
      auction: auction ?? (minFromVenture
        ? { minBidPrice: minFromVenture, status: 'DRAFT', totalBids: 0, currentHighestBid: 0 }
        : null),
    };
  });
}

/** Extract ventures from list API payload (`{ items: [...] }`) and map for UI. */
export function mapVenturesForUi(payload) {
  return asArray(payload).map(mapVentureForUi);
}

export function formatVentureApiError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || 'Request failed';
  if (typeof data.error === 'string') return data.error;
  if (data.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          const loc = Array.isArray(item.loc) ? item.loc.join('.') : '';
          const msg = item.msg || item.message || JSON.stringify(item);
          return loc ? `${loc}: ${msg}` : msg;
        })
        .join('; ');
    }
    return String(data.detail);
  }
  return 'Request failed';
}
