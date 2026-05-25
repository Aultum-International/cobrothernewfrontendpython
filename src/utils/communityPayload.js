/**
 * Community profile API ↔ UI field mapping.
 */

import { unwrapApiData } from '../api/unwrap';

export function mapCommunityProfileForUi(profile) {
  if (!profile) return profile;

  const appUser = profile.app_user ?? profile.appUser ?? profile.user;

  return {
    ...profile,
    id: profile.id,
    linkedInId: profile.linked_in_id ?? profile.linkedInId,
    name: profile.name,
    imageUrl: profile.image_url ?? profile.imageUrl,
    linkedInProfileUrl:
      profile.linked_in_profile_url ?? profile.linkedInProfileUrl ?? '',
    role: profile.role ?? '',
    skills: profile.skills ?? '',
    industry: profile.industry ?? '',
    location: profile.location ?? '',
    whyImHere: profile.why_im_here ?? profile.whyImHere ?? '',
    headline: profile.headline ?? '',
    isApproved: profile.is_approved ?? profile.isApproved,
    views: profile.views ?? 0,
    appUser: appUser
      ? {
          ...appUser,
          id: appUser.id,
          firstname: appUser.firstname ?? appUser.firstName,
          lastname: appUser.lastname ?? appUser.lastName,
        }
      : appUser,
    app_user: appUser,
    user: appUser,
  };
}

export function mapCommunityProfilesForUi(axiosData) {
  const raw = unwrapApiData({ data: axiosData });
  const list = Array.isArray(raw) ? raw : Array.isArray(axiosData) ? axiosData : [];
  return list.map(mapCommunityProfileForUi);
}

export function toCommunityUpdatePayload(form) {
  const payload = {};

  if (form.role) payload.role = form.role;
  if (form.skills != null) payload.skills = form.skills;
  if (form.industry) payload.industry = form.industry;
  if (form.location != null) payload.location = form.location;

  const why = (form.whyImHere ?? '').trim();
  if (why) payload.whyImHere = why;

  const linkedIn = (form.linkedInProfileUrl ?? '').trim();
  if (linkedIn) payload.linkedInProfileUrl = linkedIn;

  return payload;
}

export function formatCommunityApiError(err) {
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
  return data.message || 'Request failed';
}
