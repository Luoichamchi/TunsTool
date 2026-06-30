// Token refresh helper for globalFetcher
import { rawPostFetcher } from './globalFetcher';

export async function refreshTokenIfNeeded(error, originalRequest) {
  if (!error || !error.message) return null;
  if (!window || typeof window === 'undefined') return null;
  if (!/401|token|expired|unauthorized/i.test(error.message)) return null;

  let data = null;
  try {
    data = await rawPostFetcher('/api/auth/refresh', {});
  } catch {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return null;
  }

  if (data && data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.tenant_code) {
        localStorage.setItem('tenant_code', data.user.tenant_code);
      }
    }
    if (typeof originalRequest === 'function') {
      return originalRequest();
    }
    return data.access_token;
  }
  return null;
}
