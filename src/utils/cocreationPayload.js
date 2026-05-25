/**
 * CoCreation (software) API ↔ UI field mapping.
 */

import { asArray } from './asArray';

export function toCreateSoftwarePayload(form) {
  const priceRaw = form.price;
  const price =
    priceRaw === '' || priceRaw == null ? 0 : Number(priceRaw);

  const purchaseType = form.purchaseType || 'ONE_TIME';
  const payload = {
    name: (form.name || '').trim(),
    description: (form.description || '').trim() || null,
    what_it_does: (form.whatItDoes || '').trim() || null,
    how_it_helps: (form.howItHelps || '').trim() || null,
    github_link: (form.githubLink || '').trim() || null,
    tech_stack: (form.techStack || '').trim() || null,
    category: form.category || null,
    pricing_demand: form.pricingDemand || null,
    price: Number.isNaN(price) ? 0 : price,
    purchase_type: purchaseType,
    agreement: {
      terms: Boolean(form.agreement?.terms),
    },
  };

  if (purchaseType === 'AUCTION') {
    const minBid = form.minBidPrice === '' || form.minBidPrice == null
      ? null
      : Number(form.minBidPrice);
    if (minBid != null && !Number.isNaN(minBid)) {
      payload.min_bid_price = minBid;
      // Store reference price on listing so admin/cards don't show ₹0
      payload.price = minBid;
    }
    payload.pricing_demand = null;
    if (form.auctionDuration) payload.auction_duration = form.auctionDuration;
    const rationale = (form.auctionRationale || '').trim();
    if (rationale) payload.auction_rationale = rationale;
    payload.source_code_included = Boolean(form.sourceCodeIncluded);
    payload.support_included = Boolean(form.supportIncluded);
    payload.support_days = form.supportIncluded
      ? parseInt(form.supportDays, 10) || 0
      : 0;
    const transfer = (form.transferDetails || '').trim();
    if (transfer) payload.transfer_details = transfer;
  }

  const videoLink = (form.videoLink || '').trim();
  if (videoLink) payload.video_link = videoLink;

  const liveDemo = (form.liveDemoLink || '').trim();
  if (liveDemo) payload.live_demo_link = liveDemo;

  return payload;
}

/** Map API software to edit form state (camelCase). */
export function fromSoftwareApiToForm(item) {
  const mapped = mapSoftwareForUi(item);
  return {
    name: mapped.name || '',
    description: mapped.description || '',
    videoLink: mapped.videoLink || '',
    whatItDoes: mapped.whatItDoes || '',
    howItHelps: mapped.howItHelps || '',
    githubLink: mapped.githubLink || '',
    liveDemoLink: mapped.liveDemoLink || '',
    techStack: mapped.techStack || '',
    category: mapped.category || '',
    pricingDemand: mapped.pricingDemand || '',
    price: mapped.price ?? '',
    purchaseType: mapped.purchaseType || 'ONE_TIME',
    agreement: { terms: true },
  };
}

/** PUT /api/v1/cocreation/{id} body (snake_case, no agreement). */
export function toUpdateSoftwarePayload(form) {
  const created = toCreateSoftwarePayload(form);
  const { agreement: _agreement, purchase_type: _purchaseType, ...rest } = created;
  return rest;
}

export function normalizeSoftwareAnalytics(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const revenue = Number(payload.totalRevenue);
  return {
    softwareId: payload.softwareId,
    softwareName: payload.softwareName || 'Technology listing',
    totalViews: payload.totalViews ?? 0,
    totalSales: payload.totalSales ?? 0,
    totalRevenue: Number.isFinite(revenue) ? revenue : 0,
    completionStatus: payload.completionStatus || 'Available',
    viewsByDay: payload.viewsByDay ?? {},
    byIndustry: payload.byIndustry ?? {},
    byRole: payload.byRole ?? {},
  };
}

function mapListedByForUi(user) {
  if (!user) return user;
  return {
    ...user,
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
  };
}

export function mapSoftwareForUi(item) {
  if (!item) return item;

  const listedByRaw = item.listed_by ?? item.listedBy;

  return {
    ...item,
    id: item.id,
    name: item.name,
    description: item.description,
    videoLink: item.video_link ?? item.videoLink,
    whatItDoes: item.what_it_does ?? item.whatItDoes,
    howItHelps: item.how_it_helps ?? item.howItHelps,
    githubLink: item.github_link ?? item.githubLink,
    liveDemoLink: item.live_demo_link ?? item.liveDemoLink,
    techStack: item.tech_stack ?? item.techStack,
    category: item.category,
    pricingDemand: item.pricing_demand ?? item.pricingDemand,
    price: item.price,
    purchaseType: item.purchase_type ?? item.purchaseType,
    imageUrl: item.image_url ?? item.imageUrl,
    softwareStatus: item.software_status ?? item.softwareStatus,
    status: item.status,
    views: item.views ?? 0,
    official: item.official,
    featured: item.featured,
    createdAt: item.created_at ?? item.createdAt,
    listedBy: mapListedByForUi(listedByRaw),
    buyerHasPurchased: item.buyer_has_purchased ?? item.buyerHasPurchased ?? false,
    buyerCompletionStatus: item.buyer_completion_status ?? item.buyerCompletionStatus ?? null,
  };
}

export function mapPurchaseForUi(row) {
  if (!row) return row;
  const sw = row.software ? mapSoftwareForUi(row.software) : null;
  return {
    id: row.id,
    softwareId: row.softwareId ?? row.software_id,
    paymentStatus: row.paymentStatus ?? row.payment_status,
    completionStatus: row.completionStatus ?? row.completion_status ?? 'PENDING',
    coBrotherOptIn: row.coBrotherOptIn ?? row.co_brother_opt_in ?? false,
    coBrotherHelpPaid: row.coBrotherHelpPaid ?? row.co_brother_help_paid ?? false,
    soldAt: row.soldAt ?? row.sold_at,
    software: sw,
  };
}

export function mapPurchaseListForUi(payload) {
  const rows = asArray(payload?.data ?? payload);
  return rows.map(mapPurchaseForUi);
}

export function mapSoftwareListForUi(payload) {
  return asArray(payload).map(mapSoftwareForUi);
}

export function formatCocreationApiError(err) {
  const data = err?.response?.data;
  if (!data) {
    if (err?.message === 'Network Error' && err?.code === 'ERR_NETWORK') {
      return 'Could not reach the server. Check that the API is running and CORS allows this origin.';
    }
    return err?.message || 'Request failed';
  }
  if (typeof data.message === 'string' && data.message) return data.message;
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
  return data.message || 'Request failed';
}
