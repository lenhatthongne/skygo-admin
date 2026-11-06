import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  me: vi.fn(),
  location: { pathname: '/overview', search: '', hash: '' },
}));
vi.mock('@umijs/max', () => ({
  history: { location: mocks.location, replace: mocks.replace },
  Link: ({ children }: any) => children,
}));
vi.mock('@/skygo/service', () => ({ authService: { me: mocks.me } }));
vi.mock('@/components', () => ({
  AvatarDropdown: () => null,
  ErrorBoundary: ({ children }: any) => children,
  Footer: () => null,
  LangDropdown: () => null,
  OfflineBanner: () => null,
}));
vi.mock('@ant-design/pro-components', () => ({ SettingDrawer: () => null }));
vi.mock('./requestErrorConfig', () => ({ errorConfig: {} }));

import { getInitialState } from './app';
import { clearSession, getToken, setToken } from './skygo/session';

const user = {
  id: 1,
  fullName: 'Admin',
  email: 'test@example.com',
  phone: '',
  role: 'ADMIN',
  emailVerified: true,
};
describe('SkyGo initial state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    Object.assign(mocks.location, {
      pathname: '/overview',
      search: '',
      hash: '',
    });
  });
  it('redirects without issuing a sample currentUser request when there is no token', async () => {
    const state = await getInitialState();
    expect(state.currentUser).toBeUndefined();
    expect(mocks.me).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalled();
  });
  it('loads the direct auth/me ADMIN response', async () => {
    setToken('test');
    mocks.me.mockResolvedValue(user);
    expect((await getInitialState()).currentUser).toEqual(user);
  });
  it('clears CUSTOMER sessions and redirects', async () => {
    setToken('test');
    mocks.me.mockResolvedValue({ ...user, role: 'CUSTOMER' });
    expect((await getInitialState()).currentUser).toBeUndefined();
    expect(getToken()).toBeUndefined();
  });
  it('does not request me on login', async () => {
    mocks.location.pathname = '/user/login';
    await getInitialState();
    expect(mocks.me).not.toHaveBeenCalled();
  });
});
