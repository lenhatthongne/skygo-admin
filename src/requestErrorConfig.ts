import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { clearSession, getToken } from './skygo/session';
import type { Problem } from './skygo/types';

export function problemOf(error: unknown): Problem {
  return (error as { response?: { data?: Problem } })?.response?.data ?? {};
}
export function errorText(error: unknown): string {
  const problem = problemOf(error);
  const labels: Record<string, string> = {
    FORBIDDEN: 'Không đủ quyền quản trị.',
    ACCOUNT_BLOCKED:
      'Tài khoản đã bị quản trị viên khóa. Vui lòng liên hệ hỗ trợ.',
    UNAUTHORIZED: 'Phiên đã hết hạn. Vui lòng đăng nhập lại.',
    OTP_INVALID: 'Mã OTP không đúng hoặc đã được thay thế.',
    OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã.',
    OTP_RATE_LIMITED: 'Đã vượt giới hạn OTP. Vui lòng chờ trước khi thử lại.',
    SEATS_BELOW_SOLD:
      'Tổng ghế không được thấp hơn số ghế đã bán hoặc đang giữ.',
    EMAIL_DELIVERY_FAILED:
      'Chưa gửi được email OTP. Vui lòng kiểm tra cấu hình SMTP backend.',
  };
  return (
    (problem.code && labels[problem.code]) ||
    problem.detail ||
    problem.code ||
    'Không kết nối được API. Kiểm tra backend và cấu hình CORS rồi thử lại.'
  );
}
export function expireProtectedSession(error: unknown): void {
  const response = (
    error as { response?: { status?: number }; config?: { url?: string } }
  )?.response;
  const url = (error as { config?: { url?: string } })?.config?.url ?? '';
  if (
    response?.status === 401 &&
    !/\/auth\/(login|register|otp)(\/|$)/.test(url)
  ) {
    clearSession();
    // A full navigation also clears all in-memory user data and query caches.
    if (history.location.pathname !== '/user/login')
      window.location.replace('/user/login');
  }
}
export const errorConfig: RequestConfig = {
  errorConfig: {
    errorHandler: (error) => {
      // Callers render the error in their form or page, retaining entered values.
      throw error;
    },
  },
  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getToken();
      if (token)
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      return config;
    },
  ],
  responseInterceptors: [
    [
      (response) => response,
      (error: unknown) => {
        expireProtectedSession(error);
        return Promise.reject(error);
      },
    ],
  ],
};
