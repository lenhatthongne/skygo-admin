import { describe, expect, it } from 'vitest';
import access from './access';
import type { User } from './skygo/types';

const user: User = {
  id: 1,
  fullName: 'Test',
  email: 'test@example.com',
  phone: '0901234567',
  role: 'ADMIN',
  emailVerified: true,
};
describe('SkyGo access', () => {
  it('allows the real ADMIN role', () =>
    expect(access({ currentUser: user }).canAdmin).toBe(true));
  it('denies CUSTOMER and missing sessions', () => {
    expect(
      access({ currentUser: { ...user, role: 'CUSTOMER' } }).canAdmin,
    ).toBe(false);
    expect(access(undefined).canAdmin).toBe(false);
  });
  it('does not grant access from a sample access field', () =>
    expect(
      access({
        currentUser: { ...user, role: 'CUSTOMER', ...{ access: 'admin' } },
      }).canAdmin,
    ).toBe(false));
});
