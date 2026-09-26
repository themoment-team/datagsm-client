export const setCookie = (name: string, value: string): void => {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  const cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }

  return null;
};

export const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  const cookieString = `${encodeURIComponent(name)}=; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isSecure ? '; Secure' : ''}`;

  document.cookie = cookieString;
};

// 인코딩되지 않은 %가 섞여 있어 decodeURIComponent가 실패하면 원문을 그대로 쓴다.
const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const getAllCookies = (): Record<string, string> => {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (const cookie of cookieArray) {
    const c = cookie.trim();
    const separatorIndex = c.indexOf('=');
    if (separatorIndex === -1) continue;

    const name = c.substring(0, separatorIndex);
    const value = c.substring(separatorIndex + 1);
    if (name && value) {
      cookies[safeDecodeURIComponent(name)] = safeDecodeURIComponent(value);
    }
  }

  return cookies;
};

export const clearAllCookies = (): void => {
  const cookies = getAllCookies();

  for (const name in cookies) {
    deleteCookie(name);
  }
};
