/**
 * Co-venture application API payload (camelCase ↔ backend).
 */

import { asArray } from './asArray';
import { mapVentureForUi } from './venturePayload';

function mapVentureSummaryForUi(venture, ventureId) {
  if (!venture) {
    if (!ventureId) return null;
    return { id: ventureId, brandDetails: {} };
  }
  if (venture.brandDetails || venture.brand_details) {
    return mapVentureForUi(venture);
  }
  const brand = venture.brand_details ?? venture.brandDetails ?? {};
  return {
    id: venture.id ?? ventureId,
    brandDetails: {
      brandName: brand.brand_name ?? brand.brandName ?? '',
      industry: brand.industry ?? '',
      ventureType: brand.venture_type ?? brand.ventureType ?? '',
      logoUrl: brand.venture_image_url ?? brand.ventureImageUrl ?? '',
    },
  };
}

/** Map one co-venture application record for dashboard UI (camelCase). */
export function mapCoVentureApplicationForUi(app) {
  if (!app) return app;

  const ventureId = app.venture_id ?? app.ventureId;
  const venture = mapVentureSummaryForUi(app.venture, ventureId);

  return {
    ...app,
    id: app.id,
    ventureId,
    applicantUserId: app.applicant_user_id ?? app.applicantUserId,
    fullName: app.full_name ?? app.fullName ?? '',
    phone: app.phone ?? '',
    location: app.location ?? '',
    gstNo: app.gstin ?? app.gstNo ?? '',
    description: app.description ?? '',
    status: app.status,
    createdAt: app.created_at ?? app.createdAt,
    updatedAt: app.updated_at ?? app.updatedAt,
    venture,
  };
}

export function mapCoVentureApplicationsForUi(payload) {
  return asArray(payload).map(mapCoVentureApplicationForUi);
}

export function toCoVentureApplyPayload(form) {
  const payload = {
    fullName: (form.fullName || '').trim(),
    phone: (form.phone || '').trim(),
    description: (form.description || '').trim(),
  };

  const location = (form.location || '').trim();
  if (location) payload.location = location;

  const gstNo = (form.gstNo || '').trim().toUpperCase();
  if (gstNo) payload.gstNo = gstNo;

  return payload;
}

export function formatCoVentureApiError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || 'Request failed';
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string' && !data.detail) return data.message;
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
  return 'Validation failed';
}
