/**
 * Build complete-profile API body and format validation errors.
 */

export function toCompleteProfilePayload(form) {
  const payload = {
    firstname: (form.firstname || '').trim(),
    lastname: (form.lastname || '').trim(),
  };

  const phone = (form.phoneNumber || '').trim();
  if (phone) payload.phoneNumber = phone;

  const address = (form.address || '').trim();
  if (address) payload.address = address;

  return payload;
}

export function formatProfileApiError(err) {
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
  return 'Request failed';
}
