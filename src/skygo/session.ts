let accessToken: string | undefined;
export const getToken = () => accessToken;
export const setToken = (token: string) => {
  accessToken = token;
};
export const clearSession = () => {
  accessToken = undefined;
};
export function safeRedirect(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return '/';
  try {
    const url = new URL(value, 'http://skygo.local');
    if (url.origin !== 'http://skygo.local' || url.pathname.startsWith('/user'))
      return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
