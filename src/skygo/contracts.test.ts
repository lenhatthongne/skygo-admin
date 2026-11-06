import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({
  request: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@umijs/max', () => ({ request }));

import {
  farePayload,
  flightPayload,
  flightValues,
  vietnamDate,
  vietnamInstant,
} from './flightForm';
import {
  authService,
  cancellationService,
  faqService,
  flightService,
  reminderService,
  verifyTicket,
} from './service';
import { safeRedirect } from './session';
import type { Fare, Flight } from './types';

const fare: Fare = {
  id: 4,
  classCode: 'ECO_SAVER',
  baseFare: 0,
  taxFee: 0,
  childRatePct: 0,
  infantRatePct: 0,
  infantFee: 0,
  cabinBaggageKg: 0,
  checkedBaggageKg: 0,
  refundable: false,
  cancelFee: 0,
  totalSeats: 10,
  seatsAvailable: 5,
};
describe('SkyGo request contracts', () => {
  it('preserves a leading zero OTP and uses the challenge endpoint', async () => {
    await authService.verify('test-challenge', '012345');
    expect(request).toHaveBeenLastCalledWith(
      '/auth/login/verify',
      expect.objectContaining({
        method: 'POST',
        data: { challengeId: 'test-challenge', code: '012345' },
      }),
    );
  });
  it('uses zero-based pagination with filters and no duplicate api prefix', async () => {
    await flightService.list({
      page: 1,
      size: 20,
      from: 'SGN',
      sort: 'departure',
    });
    expect(request).toHaveBeenLastCalledWith(
      '/admin/flights',
      expect.objectContaining({
        params: { page: 1, size: 20, from: 'SGN', sort: 'departure' },
      }),
    );
  });
  it('supports empty DELETE responses and bodyless cancellation decisions', async () => {
    await expect(faqService.remove(12)).resolves.toBeUndefined();
    expect(request).toHaveBeenLastCalledWith(
      '/admin/faqs/12',
      expect.objectContaining({ method: 'DELETE' }),
    );
    await cancellationService.process(3, 'reject');
    expect(request).toHaveBeenLastCalledWith(
      '/admin/cancellation-requests/3/reject',
      expect.objectContaining({ method: 'POST', data: undefined }),
    );
  });
  it('calls the flight reminder endpoints with the documented shapes', async () => {
    await reminderService.settings();
    expect(request).toHaveBeenLastCalledWith(
      '/admin/flight-reminders/settings',
      expect.anything(),
    );
    await reminderService.save({ enabled: true, leadMinutes: [1440, 180] });
    expect(request).toHaveBeenLastCalledWith(
      '/admin/flight-reminders/settings',
      expect.objectContaining({
        method: 'PUT',
        data: { enabled: true, leadMinutes: [1440, 180] },
      }),
    );
    await reminderService.log(10);
    expect(request).toHaveBeenLastCalledWith(
      '/admin/flight-reminders',
      expect.objectContaining({ params: { limit: 10 } }),
    );
    await reminderService.sendNow('b1');
    expect(request).toHaveBeenLastCalledWith(
      '/admin/bookings/b1/flight-reminder',
      expect.objectContaining({ method: 'POST' }),
    );
  });
  it('sends the QR content in JSON', async () => {
    await verifyTicket('SKYGO:test');
    expect(request).toHaveBeenLastCalledWith(
      '/admin/tickets/verify',
      expect.objectContaining({ data: { qrToken: 'SKYGO:test' } }),
    );
  });
  it('preserves false and zero and excludes read-only fare fields', () => {
    expect(farePayload(fare)).toMatchObject({ baseFare: 0, refundable: false });
    expect(farePayload(fare)).not.toHaveProperty('id');
    expect(farePayload(fare)).not.toHaveProperty('seatsAvailable');
  });
  it('round-trips every existing fare and timestamps through the flight editor', () => {
    const flight: Flight = {
      flightId: 1,
      flightNumber: 'TEST',
      airline: { code: 'VN', name: 'Test', logoUrl: null },
      origin: 'SGN',
      destination: 'HAN',
      departureAt: '2026-11-04T17:30:00Z',
      arrivalAt: '2026-11-04T19:30:00Z',
      durationMinutes: 120,
      status: 'SCHEDULED',
      lowestAdultFare: 0,
      availableFareClasses: ['ECO_SAVER'],
      fareClasses: [fare, { ...fare, id: 5, classCode: 'BUSINESS' }],
    };
    const result = flightPayload(flightValues(flight));
    expect(result.fareClasses).toHaveLength(2);
    expect(result.departureAt).toBe('2026-11-04T17:30:00.000Z');
    expect(result).not.toHaveProperty('flightId');
  });
  it('uses Vietnam time even across midnight', () => {
    expect(vietnamDate('2026-11-04T17:30:00Z').format('YYYY-MM-DD')).toBe(
      '2026-11-05',
    );
    expect(vietnamInstant(dayjs('2026-11-05T00:30:00'))).toBe(
      '2026-11-04T17:30:00.000Z',
    );
  });
  it('rejects external or login redirects', () => {
    for (const value of [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      '/user/login',
    ])
      expect(safeRedirect(value)).toBe('/');
    expect(safeRedirect('/bookings?page=2')).toBe('/bookings?page=2');
  });
});
