import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

vi.mock('@umijs/max', () => ({
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: any) => defaultMessage,
  }),
  history: { location: { pathname: '/user/login' } },
}));

import type { FormInstance } from 'antd';
import type { Page } from './types';
import { applyFieldErrors, usePaged } from './ui';

function Harness({
  load,
}: {
  load: (
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<Page<{ id: number }>>;
}) {
  const state = usePaged(load);
  return (
    <>
      <button type="button" onClick={() => state.pagination.onChange(2, 20)}>
        Next
      </button>
      <button
        type="button"
        onClick={() => state.filter({ status: 'CONFIRMED' })}
      >
        Filter
      </button>
      <output>
        {state.error
          ? 'ERROR'
          : (state.data?.content.map((x) => x.id).join(',') ?? 'LOADING')}
      </output>
      <span data-testid="page">{state.pagination.current}</span>
    </>
  );
}
describe('SkyGo pagination and validation', () => {
  it('converts pages and resets filters to page zero', async () => {
    const load = vi
      .fn()
      .mockResolvedValue({ content: [], page: 0, size: 20, totalElements: 0 });
    const screen = await render(<Harness load={load} />);
    await vi.waitFor(() =>
      expect(load).toHaveBeenCalledWith(
        { page: 0, size: 20 },
        expect.any(AbortSignal),
      ),
    );
    await screen.getByRole('button', { name: 'Next' }).click();
    await vi.waitFor(() =>
      expect(load).toHaveBeenLastCalledWith(
        { page: 1, size: 20 },
        expect.any(AbortSignal),
      ),
    );
    await screen.getByRole('button', { name: 'Filter' }).click();
    await vi.waitFor(() =>
      expect(load).toHaveBeenLastCalledWith(
        { page: 0, size: 20, status: 'CONFIRMED' },
        expect.any(AbortSignal),
      ),
    );
    await expect.element(screen.getByTestId('page')).toHaveTextContent('1');
  });
  it('ignores a stale result after filters change', async () => {
    let resolveOld: (page: Page<{ id: number }>) => void = () => {};
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValue({
        content: [{ id: 2 }],
        page: 0,
        size: 20,
        totalElements: 1,
      });
    const screen = await render(<Harness load={load} />);
    await screen.getByRole('button', { name: 'Filter' }).click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('2');
    resolveOld({ content: [{ id: 1 }], page: 0, size: 20, totalElements: 1 });
    await expect.element(screen.getByRole('status')).toHaveTextContent('2');
    expect(load.mock.calls[0][1].aborted).toBe(true);
  });
  it('keeps an API failure distinct from an empty list', async () => {
    const load = vi.fn().mockRejectedValue(new Error('offline'));
    const screen = await render(<Harness load={load} />);
    await expect.element(screen.getByRole('status')).toHaveTextContent('ERROR');
  });
  it('maps backend nested field paths to Form field names', () => {
    const setFields = vi.fn();
    applyFieldErrors({ setFields } as unknown as FormInstance, {
      response: {
        data: {
          errors: [
            { field: 'fareClasses[1].totalSeats', message: 'Too few seats' },
          ],
        },
      },
    });
    expect(setFields).toHaveBeenCalledWith([
      { name: ['fareClasses', 1, 'totalSeats'], errors: ['Too few seats'] },
    ]);
  });
});
