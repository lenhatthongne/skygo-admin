import { describe, expect, it, vi } from 'vitest';
import {
  errorConfig,
  errorText,
  expireProtectedSession,
} from './requestErrorConfig';
import { clearSession, getToken, setToken } from './skygo/session';

vi.mock('@umijs/max', () => ({
  history: { location: { pathname: '/user/login' } },
}));
describe('SkyGo problem responses and token', () => {
  it('accepts direct DTOs without a success wrapper', () =>
    expect(errorConfig.errorConfig?.errorThrower).toBeUndefined());
  it('handles missing problem fields and network failures', () => {
    expect(errorText({ response: { data: { detail: 'Dữ liệu trùng' } } })).toBe(
      'Dữ liệu trùng',
    );
    expect(errorText(new Error('network'))).toContain('Không kết nối');
    expect(
      errorText({ response: { data: { code: 'SEATS_BELOW_SOLD' } } }),
    ).toContain('đang giữ');
  });
  it('keeps the session for a login OTP 401 but clears it for a protected 401', () => {
    setToken('test-token');
    expireProtectedSession({
      response: { status: 401 },
      config: { url: '/auth/login/verify' },
    });
    expect(getToken()).toBe('test-token');
    expireProtectedSession({
      response: { status: 401 },
      config: { url: '/admin/flights' },
    });
    expect(getToken()).toBeUndefined();
    clearSession();
  });
});
