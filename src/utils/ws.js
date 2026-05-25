import { API_ORIGIN } from '../config/urls';

export function buildWsUrl(path, token) {
  const wsBase = API_ORIGIN.replace(/^http/, 'ws').replace(/\/$/, '');
  const sep = path.includes('?') ? '&' : '?';
  const t = token ? `${sep}token=${encodeURIComponent(token)}` : '';
  return `${wsBase}${path.startsWith('/') ? path : `/${path}`}${t}`;
}
