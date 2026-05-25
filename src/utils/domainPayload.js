/**
 * Domain marketplace API ↔ UI field mapping.
 */

import { asArray } from './asArray';
import { validateOptionalPhone } from './venturePayload';

export { validateOptionalPhone };

function blankToNull(value) {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

function normalizeExtension(ext) {
  const raw = (ext || '').trim();
  if (!raw) return '.com';
  return raw.startsWith('.') ? raw : `.${raw}`;
}

export function toCreateDomainListingPayload(form) {
  const saleType = form.saleType || 'ONE_TIME';
  const isAuction = saleType === 'AUCTION';
  const priceRaw = form.askingPrice;
  const askingPrice = isAuction
    ? 0
    : priceRaw === '' || priceRaw == null
      ? 0
      : Number(priceRaw);

  const contact = form.contactInfo || {};
  const email = blankToNull(contact.email);
  const phoneCheck = validateOptionalPhone(contact.phoneNumber ?? contact.phone_number);
  if (!phoneCheck.ok) {
    throw new Error(phoneCheck.error);
  }
  const phone = phoneCheck.value;

  const payload = {
    domain_name: (form.domainName || '').trim().toLowerCase(),
    domain_extension: normalizeExtension(form.domainExtension),
    asking_price: Number.isNaN(askingPrice) ? 0 : askingPrice,
    pricing_demand: form.pricingDemand || null,
    sale_type: saleType,
    agreement: {
      terms: Boolean(form.agreement?.terms),
    },
  };

  if (email || phone) {
    payload.contact_info = { email, phone_number: phone };
  }

  return payload;
}

export function mapDomainForUi(item) {
  if (!item) return item;

  const contact = item.contact_info ?? item.contactInfo;

  return {
    ...item,
    id: item.id,
    domainName: item.domain_name ?? item.domainName,
    domainExtension: item.domain_extension ?? item.domainExtension,
    askingPrice: item.asking_price ?? item.askingPrice,
    pricingDemand: item.pricing_demand ?? item.pricingDemand,
    domainStatus: item.domain_status ?? item.domainStatus,
    saleType: item.sale_type ?? item.saleType,
    logo: item.logo,
    views: item.views ?? 0,
    verified: item.verified,
    createdAt: item.created_at ?? item.createdAt,
    contactInfo: contact
      ? {
          email: contact.email,
          phoneNumber: contact.phone_number ?? contact.phoneNumber,
        }
      : item.contactInfo,
    listedBy: item.listed_by ?? item.listedBy,
    listedByUserId: item.listed_by_user_id ?? item.listedByUserId,
  };
}

export function mapDomainListForUi(payload) {
  return asArray(payload).map(mapDomainForUi);
}

/** Map API listing to edit form state. */
export function fromDomainApiToForm(item) {
  const mapped = mapDomainForUi(item);
  return {
    domainName: mapped.domainName || '',
    domainExtension: mapped.domainExtension || '.com',
    askingPrice: mapped.askingPrice ?? '',
    pricingDemand: mapped.pricingDemand || '',
    saleType: mapped.saleType || 'ONE_TIME',
    contactInfo: {
      email: mapped.contactInfo?.email || '',
      phoneNumber: mapped.contactInfo?.phoneNumber || '',
    },
  };
}

/** PUT /api/v1/domain/listings/{id} body. */
export function toUpdateDomainListingPayload(form) {
  const priceRaw = form.askingPrice;
  const askingPrice =
    priceRaw === '' || priceRaw == null ? undefined : Number(priceRaw);

  const contact = form.contactInfo || {};
  const email = blankToNull(contact.email);
  const phoneCheck = validateOptionalPhone(contact.phoneNumber ?? contact.phone_number);
  if (!phoneCheck.ok) {
    throw new Error(phoneCheck.error);
  }
  const phone = phoneCheck.value;

  const payload = {
    domain_name: (form.domainName || '').trim().toLowerCase(),
    domain_extension: normalizeExtension(form.domainExtension),
    asking_price: Number.isNaN(askingPrice) ? undefined : askingPrice,
    pricing_demand: form.pricingDemand || null,
  };

  if (email || phone) {
    payload.contact_info = { email, phone_number: phone };
  }

  return payload;
}

/** Whether the current user owns this listing (UI helper). */
export function isDomainListingOwner(domain, user, filterTab) {
  if (!user?.id) return false;
  if (filterTab === 'mine') return true;
  const ownerId = domain?.listedBy?.id ?? domain?.listedByUserId;
  return ownerId != null && String(ownerId) === String(user.id);
}

export function formatDomainApiError(err) {
  if (err?.message && !err?.response) return err.message;
  const data = err?.response?.data;
  if (!data) return err?.message || 'Request failed';
  if (Array.isArray(data.data) && data.data.length) {
    return data.data
      .map((item) => {
        const field = item.field || '';
        const msg = item.message || '';
        if (field.includes('phone_number') || field.includes('phoneNumber')) {
          return 'Phone must be a valid 10-digit number (e.g. 9876543210) or left empty.';
        }
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }
  if (typeof data.message === 'string' && data.message && data.message !== 'Validation failed') {
    return data.message;
  }
  if (typeof data.message === 'string' && data.message === 'Validation failed' && Array.isArray(data.data)) {
    return formatDomainApiError({ response: { data } });
  }
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
