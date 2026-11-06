import { request } from '@umijs/max';
import type {
  Account,
  Airline,
  Airport,
  Auth,
  Booking,
  Cancellation,
  Challenge,
  Faq,
  FaqInput,
  Fare,
  FareInput,
  Flight,
  FlightInput,
  Overview,
  Page,
  ReminderLogItem,
  ReminderSendResult,
  ReminderSettings,
  Support,
  SupportMessage,
  SupportReply,
  SupportThread,
  TicketResult,
  User,
} from './types';

const options = { skipErrorHandler: true };
const get = <T>(
  url: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
) => request<T>(url, { ...options, params, signal });
const post = <T>(url: string, data?: unknown) =>
  request<T>(url, { ...options, method: 'POST', data });
const put = <T>(url: string, data: unknown) =>
  request<T>(url, { ...options, method: 'PUT', data });
export const authService = {
  login: (data: { email: string; password: string }) =>
    post<Challenge>('/auth/login', data),
  verify: (challengeId: string, code: string) =>
    post<Auth>('/auth/login/verify', { challengeId, code }),
  registerVerify: (challengeId: string, code: string) =>
    post<User>('/auth/register/verify', { challengeId, code }),
  resend: (challengeId: string) =>
    post<Challenge>('/auth/otp/resend', { challengeId }),
  me: () => get<User>('/auth/me'),
};
export const flightService = {
  list: (params: Record<string, unknown>, signal?: AbortSignal) =>
    get<Page<Flight>>('/admin/flights', params, signal),
  detail: (id: number) => get<Flight>(`/admin/flights/${id}`),
  create: (data: FlightInput) => post<Flight>('/admin/flights', data),
  update: (id: number, data: FlightInput) =>
    put<Flight>(`/admin/flights/${id}`, data),
  fare: (id: number, data: FareInput) =>
    put<Fare>(`/admin/fare-classes/${id}`, data),
  airports: () => get<Airport[]>('/airports'),
  airlines: () => get<Airline[]>('/airlines'),
};
export const bookingService = {
  list: (params: Record<string, unknown>, signal?: AbortSignal) =>
    get<Page<Booking>>('/admin/bookings', params, signal),
  detail: (id: string) => get<Booking>(`/admin/bookings/${id}`),
};
export const cancellationService = {
  list: (params: Record<string, unknown>, signal?: AbortSignal) =>
    get<Page<Cancellation>>('/admin/cancellation-requests', params, signal),
  process: (id: number, action: 'approve' | 'reject') =>
    post<Cancellation>(`/admin/cancellation-requests/${id}/${action}`),
};
export const faqService = {
  list: (params: Record<string, unknown>, signal?: AbortSignal) =>
    get<Page<Faq>>('/admin/faqs', params, signal),
  detail: (id: number) => get<Faq>(`/admin/faqs/${id}`),
  create: (data: FaqInput) => post<Faq>('/admin/faqs', data),
  update: (id: number, data: FaqInput) => put<Faq>(`/admin/faqs/${id}`, data),
  remove: (id: number) =>
    request<void>(`/admin/faqs/${id}`, { ...options, method: 'DELETE' }),
};
export const supportService = {
  list: (params: Record<string, unknown>, signal?: AbortSignal) =>
    get<Page<Support>>('/admin/support-requests', params, signal),
  detail: (id: number) => get<Support>(`/admin/support-requests/${id}`),
  reply: (id: number, data: SupportReply) =>
    put<Support>(`/admin/support-requests/${id}`, data),
  /** Messages with an id above `after`; opening the conversation clears its unread count. */
  thread: (id: number, after: number, signal?: AbortSignal) =>
    get<SupportThread>(
      `/admin/support-requests/${id}/messages`,
      { after },
      signal,
    ),
  send: (id: number, body: string, image?: File) => {
    const form = new FormData();
    if (body) form.append('body', body);
    if (image) form.append('image', image);
    return request<SupportMessage>(`/admin/support-requests/${id}/messages`, {
      ...options,
      method: 'POST',
      data: form,
    });
  },
  close: (id: number) => post<Support>(`/admin/support-requests/${id}/close`),
  /** A photo of a conversation, fetched with the admin token (an <img> cannot send it). */
  image: (path: string) =>
    request<Blob>(path.replace(/^\/api/, ''), {
      ...options,
      responseType: 'blob',
    }),
};
export const verifyTicket = (qrToken: string) =>
  post<TicketResult>('/admin/tickets/verify', { qrToken });

export const accountService = {
  list: (params: Record<string, unknown>, signal?: AbortSignal) =>
    get<Page<Account>>('/admin/accounts', params, signal),
  detail: (id: number) => get<Account>(`/admin/accounts/${id}`),
  block: (id: number, reason: string) =>
    put<Account>(`/admin/accounts/${id}/block`, { reason }),
  unblock: (id: number) =>
    put<Account>(`/admin/accounts/${id}/unblock`, undefined),
};

export const reminderService = {
  settings: () => get<ReminderSettings>('/admin/flight-reminders/settings'),
  save: (data: ReminderSettings) =>
    put<ReminderSettings>('/admin/flight-reminders/settings', data),
  log: (limit = 30, signal?: AbortSignal) =>
    get<ReminderLogItem[]>('/admin/flight-reminders', { limit }, signal),
  sendNow: (bookingId: string) =>
    post<ReminderSendResult>(`/admin/bookings/${bookingId}/flight-reminder`),
};

export const overviewService = {
  get: (signal?: AbortSignal) =>
    get<Overview>('/admin/overview', undefined, signal),
};
