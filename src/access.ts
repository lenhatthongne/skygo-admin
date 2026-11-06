import type { User } from './skygo/types';
export default function access(
  initialState: { currentUser?: User } | undefined,
) {
  return { canAdmin: initialState?.currentUser?.role === 'ADMIN' };
}
