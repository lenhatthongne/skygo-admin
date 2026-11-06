import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  verify: vi.fn(),
  registerVerify: vi.fn(),
  resend: vi.fn(),
  me: vi.fn(),
  replace: vi.fn(),
  setInitialState: vi.fn(),
}));
vi.mock('@umijs/max', () => ({
  history: { replace: mocks.replace },
  useModel: () => ({ setInitialState: mocks.setInitialState }),
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: any) => defaultMessage,
  }),
}));
vi.mock('@/components', () => ({ Footer: () => null }));
vi.mock('@/skygo/service', () => ({ authService: mocks }));

import { clearSession, getToken } from '@/skygo/session';
import Login from './index';

const challenge = {
  challengeId: 'test-challenge',
  email: 'test@example.com',
  purpose: 'LOGIN',
  expiresAt: new Date(Date.now() + 300000).toISOString(),
  resendAfterSeconds: 0,
};
const user = {
  id: 1,
  fullName: 'Test',
  email: 'test@example.com',
  phone: '',
  role: 'ADMIN',
  emailVerified: true,
};
async function start() {
  const screen = await render(
    <App>
      <Login />
    </App>,
  );
  await screen.getByPlaceholder('Email').fill('test@example.com');
  await screen.getByPlaceholder('Mật khẩu').fill('test-password');
  await screen.getByRole('button', { name: 'Đăng nhập và gửi OTP' }).click();
  await expect
    .element(screen.getByLabelText('OTP', { exact: true }))
    .toBeVisible();
  return screen;
}
describe('SkyGo login and OTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    mocks.login.mockResolvedValue(challenge);
    mocks.me.mockResolvedValue(user);
  });
  it('does not store a token after password login; verifies OTP then me before entering Admin', async () => {
    mocks.verify.mockResolvedValue({
      accessToken: 'test-only-token',
      role: 'ADMIN',
      user,
    });
    const screen = await start();
    expect(getToken()).toBeUndefined();
    expect(mocks.replace).not.toHaveBeenCalled();
    await screen.getByLabelText('OTP', { exact: true }).fill('012345');
    await screen.getByRole('button', { name: 'Xác thực OTP' }).click();
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    expect(mocks.verify).toHaveBeenCalledWith('test-challenge', '012345');
    expect(mocks.me).toHaveBeenCalled();
    expect(getToken()).toBe('test-only-token');
  });
  it('rejects a CUSTOMER token and keeps the login page', async () => {
    mocks.verify.mockResolvedValue({
      accessToken: 'customer-token',
      role: 'CUSTOMER',
      user: { ...user, role: 'CUSTOMER' },
    });
    const screen = await start();
    await screen.getByLabelText('OTP', { exact: true }).fill('123456');
    await screen.getByRole('button', { name: 'Xác thực OTP' }).click();
    await expect
      .element(screen.getByText('Không đủ quyền quản trị.'))
      .toBeVisible();
    expect(getToken()).toBeUndefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it('handles REGISTER verification without granting a session', async () => {
    mocks.login.mockResolvedValue({ ...challenge, purpose: 'REGISTER' });
    mocks.registerVerify.mockResolvedValue(user);
    const screen = await start();
    await screen.getByLabelText('OTP', { exact: true }).fill('123456');
    await screen.getByRole('button', { name: 'Xác thực OTP' }).click();
    await expect.element(screen.getByPlaceholder('Mật khẩu')).toBeVisible();
    expect(mocks.registerVerify).toHaveBeenCalledWith(
      'test-challenge',
      '123456',
    );
    expect(getToken()).toBeUndefined();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it('resend replaces the challenge and clears the previous code', async () => {
    mocks.resend.mockResolvedValue({
      ...challenge,
      challengeId: 'new-challenge',
    });
    mocks.verify.mockRejectedValue({
      response: { data: { code: 'OTP_INVALID' } },
    });
    const screen = await start();
    await screen.getByLabelText('OTP', { exact: true }).fill('123456');
    await screen
      .getByRole('button', { name: 'Gửi lại mã', exact: true })
      .click();
    await expect
      .element(screen.getByLabelText('OTP', { exact: true }))
      .toHaveValue('');
    await screen.getByLabelText('OTP', { exact: true }).fill('012345');
    await screen.getByRole('button', { name: 'Xác thực OTP' }).click();
    await expect
      .element(screen.getByText('Mã OTP không đúng hoặc đã được thay thế.'))
      .toBeVisible();
    expect(mocks.verify).toHaveBeenCalledWith('new-challenge', '012345');
  });
});
