import { App } from 'antd';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import type { Account } from '@/skygo/types';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  block: vi.fn(),
  unblock: vi.fn(),
}));
vi.mock('@umijs/max', () => ({
  useModel: () => ({ initialState: { currentUser: { id: 1, role: 'ADMIN' } } }),
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
      defaultMessage,
  }),
  history: { location: { pathname: '/accounts' } },
}));
vi.mock('@ant-design/pro-components', () => ({
  PageContainer: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
vi.mock('@/skygo/service', () => ({ accountService: api }));

import Accounts from './Accounts';

const customer: Account = {
  id: 2,
  fullName: 'Khách thử nghiệm',
  email: 'customer@example.com',
  phone: '0901234567',
  role: 'CUSTOMER',
  emailVerified: true,
  status: 'ACTIVE',
  adminBlocked: false,
  blockReason: null,
  blockedAt: null,
  blockedBy: null,
  lockedUntil: null,
  otpLockedUntil: null,
  createdAt: '2026-11-04T00:00:00Z',
};
const admin: Account = {
  ...customer,
  id: 1,
  role: 'ADMIN',
  fullName: 'Admin thử nghiệm',
  email: 'admin@example.com',
};
let rows: Account[];
beforeEach(() => {
  vi.resetAllMocks();
  rows = [admin, customer];
  api.list.mockImplementation(async (params) => {
    const filtered = rows.filter(
      (row) => !params.status || row.status === params.status,
    );
    return {
      content: filtered.slice(0, params.size),
      totalElements: filtered.length,
      page: params.page,
      size: params.size,
    };
  });
  api.detail.mockImplementation(async (id) =>
    rows.find((row) => row.id === id),
  );
});
const start = () =>
  render(
    <App>
      <Accounts />
    </App>,
  );
describe('Account management', () => {
  it('shows status and permits blocking customers only', async () => {
    const screen = await start();
    await expect
      .element(
        screen.getByRole('button', { name: 'Admin thử nghiệm', exact: true }),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Khóa', exact: true }))
      .toBeVisible();
    await screen
      .getByRole('button', { name: 'Admin thử nghiệm', exact: true })
      .click();
    const drawer = page.getByRole('dialog');
    await expect.element(drawer.getByText('admin@example.com')).toBeVisible();
    await expect
      .element(drawer.getByRole('button', { name: 'Khóa', exact: true }))
      .not.toBeInTheDocument();
  });
  it('filters with backend status and resets to page zero', async () => {
    const screen = await start();
    await screen.getByPlaceholder('Nhập tên hoặc email…').fill('customer');
    await screen.getByRole('button', { name: /Admin khóa/ }).click();
    await vi.waitFor(() =>
      expect(api.list).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'BLOCKED',
          search: 'customer',
          page: 0,
          size: 20,
        }),
        expect.any(AbortSignal),
      ),
    );
  });
  it('validates the reason and preserves it after a failed block request', async () => {
    api.block.mockRejectedValue({
      response: { data: { detail: 'Không thể khóa tài khoản test' } },
    });
    const screen = await start();
    await screen.getByRole('button', { name: 'Khóa', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Khóa', exact: true }).click();
    await expect
      .element(dialog.getByText('Nhập lý do khóa từ 1 đến 500 ký tự.'))
      .toBeVisible();
    expect(api.block).not.toHaveBeenCalled();
    await dialog.getByLabelText('Lý do khóa').fill('Lý do kiểm thử');
    await dialog.getByRole('button', { name: 'Khóa', exact: true }).click();
    await expect
      .element(dialog.getByText('Không thể khóa tài khoản test'))
      .toBeVisible();
    await expect
      .element(dialog.getByLabelText('Lý do khóa'))
      .toHaveValue('Lý do kiểm thử');
    expect(api.block).toHaveBeenCalledWith(2, 'Lý do kiểm thử');
  });
  it('reloads server status after unblocking instead of assuming ACTIVE', async () => {
    rows = [
      {
        ...customer,
        adminBlocked: true,
        status: 'BLOCKED',
        blockReason: 'Test',
      },
    ];
    api.unblock.mockImplementation(async () => {
      rows = [
        { ...customer, status: 'LOCKED', lockedUntil: '2026-11-04T01:00:00Z' },
      ];
      return rows[0];
    });
    const screen = await start();
    await screen.getByRole('button', { name: 'Mở khóa', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Mở khóa', exact: true })
      .click();
    await vi.waitFor(() => expect(api.unblock).toHaveBeenCalledWith(2));
    await expect
      .element(
        screen
          .getByRole('row')
          .filter({ hasText: 'Khách thử nghiệm' })
          .getByText('Tạm khóa', { exact: true }),
      )
      .toBeVisible();
  });
});
