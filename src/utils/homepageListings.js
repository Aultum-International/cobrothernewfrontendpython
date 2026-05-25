import { asArray } from './asArray';

/** Whether a listing should appear on the public homepage (active, not removed). */
export function isActiveListing(item, type = 'domain') {
  if (!item) return false;
  if (item.takenDown === true) return false;
  if (item.deleted === true || item.isDeleted === true) return false;
  if (item.active === false) return false;

  if (type === 'domain') {
    const status = (item.domainStatus ?? '').toString().toUpperCase();
    if (status === 'SOLD' || status === 'REMOVED' || status === 'DELETED') return false;
  }

  if (type === 'venture') {
    if (item.status && ['REMOVED', 'DELETED', 'INACTIVE'].includes(String(item.status).toUpperCase())) {
      return false;
    }
  }

  if (type === 'software') {
    const status = (item.status ?? '').toString().toUpperCase();
    if (status === 'SOLD' || status === 'REMOVED' || status === 'DELETED') return false;
  }

  if (type === 'community') {
    if (item.status && ['REMOVED', 'DELETED', 'INACTIVE'].includes(String(item.status).toUpperCase())) {
      return false;
    }
  }

  return true;
}

function normalizeRole(role) {
  return (role ?? '').toString().toUpperCase().replace(/^ROLE_/, '');
}

/** Owner account that created the listing. */
export function getListingOwner(item, type = 'domain') {
  if (!item) return null;
  if (type === 'community') return item.appUser ?? item.listedBy ?? item.user ?? null;
  if (type === 'venture') return item.listedBy ?? item.venture?.listedBy ?? null;
  return item.listedBy ?? null;
}

const ADMIN_ROLES = new Set(['ADMIN', 'COBROTHER', 'ROLE_ADMIN', 'ROLE_COBROTHER']);

/** True when listing was created by admin / official catalog (not a guest user listing). */
export function isAdminCreatedListing(item, type = 'domain') {
  if (!item) return false;
  if (item.official === true) return true;

  const owner = getListingOwner(item, type);
  if (!owner) return false;

  const role = normalizeRole(owner.role);
  return ADMIN_ROLES.has(role);
}

/** Guest-user listings only (excludes admin-created listings). */
export function isGuestCreatedListing(item, type = 'domain') {
  if (!isActiveListing(item, type)) return false;
  if (isAdminCreatedListing(item, type)) return false;

  const owner = getListingOwner(item, type);
  if (!owner) return false;

  const role = normalizeRole(owner.role);
  return !ADMIN_ROLES.has(role);
}

/** Homepage cards pinned via Admin → Homepage Features (guest listings only). */
export function isHomepageFeaturedListing(item, type = 'domain') {
  return isGuestCreatedListing(item, type) && Boolean(item.featured);
}

export function filterHomepageListings(items, type = 'domain') {
  return asArray(items).filter((item) => isActiveListing(item, type));
}

export function filterFeaturedGuestListings(items, type = 'domain') {
  return asArray(items).filter((item) => isHomepageFeaturedListing(item, type));
}
