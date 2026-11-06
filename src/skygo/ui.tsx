import { useIntl } from '@umijs/max';
import type { FormInstance, TableProps } from 'antd';
import { Alert, Button, Form, Space, Table, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { errorText, problemOf } from '@/requestErrorConfig';
import type { Page } from './types';

export function useText() {
  const intl = useIntl();
  return (id: string, defaultMessage: string) =>
    intl.formatMessage({ id: `skygo.${id}`, defaultMessage });
}
export const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
export const time = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
const statusLabels: Record<string, string> = {
  SCHEDULED: 'Đúng lịch',
  DELAYED: 'Hoãn',
  CANCELLED: 'Đã hủy',
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  CONFIRMED: 'Đã xác nhận',
  CANCEL_REQUESTED: 'Yêu cầu hủy',
  EXPIRED: 'Hết hạn',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  OPEN: 'Mới',
  ANSWERED: 'Đã trả lời',
  CLOSED: 'Đã đóng',
};
export function Status({ value }: { value: string }) {
  const t = useText();
  return (
    <Tag
      color={
        ['CONFIRMED', 'APPROVED', 'ANSWERED', 'SCHEDULED'].includes(value)
          ? 'green'
          : ['CANCELLED', 'REJECTED', 'EXPIRED', 'PAYMENT_FAILED'].includes(
                value,
              )
            ? 'red'
            : 'blue'
      }
    >
      {t(`status.${value}`, statusLabels[value] ?? value)}
    </Tag>
  );
}
export const statusOptions = (values: string[]) =>
  values.map((value) => ({ value, label: statusLabels[value] ?? value }));
export function ApiError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const t = useText();
  return error ? (
    <Alert
      type="error"
      showIcon
      title={errorText(error)}
      action={retry && <Button onClick={retry}>{t('retry', 'Thử lại')}</Button>}
      style={{ marginBottom: 16 }}
    />
  ) : null;
}
export function applyFieldErrors(form: FormInstance, error: unknown) {
  const errors = problemOf(error).errors;
  if (Array.isArray(errors))
    form.setFields(
      errors.map(({ field, message }) => ({
        name: field
          .replace(/\[(\d+)\]/g, '.$1')
          .split('.')
          .map((x) => (/^\d+$/.test(x) ? Number(x) : x)),
        errors: [message],
      })),
    );
}
export const required = [
  { required: true, message: 'Vui lòng nhập thông tin.' },
];
export function usePaged<T>(
  loader: (
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ) => Promise<Page<T>>,
  initial?: Record<string, unknown>,
) {
  const [query, setQuery] = useState<Record<string, unknown>>({
    page: 0,
    size: 20,
    ...initial,
  });
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<Page<T>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const requestId = useRef(0);
  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    setData(undefined);
    loader(query, controller.signal)
      .then((result) => {
        if (id === requestId.current && !controller.signal.aborted) {
          if (
            !result.content.length &&
            result.totalElements > 0 &&
            Number(query.page) > 0
          ) {
            setQuery((q) => ({
              ...q,
              page: Math.max(
                0,
                Math.ceil(result.totalElements / Number(q.size)) - 1,
              ),
            }));
          } else setData(result);
        }
      })
      .catch((e) => {
        if (id === requestId.current && !controller.signal.aborted) setError(e);
      })
      .finally(() => {
        if (id === requestId.current && !controller.signal.aborted)
          setLoading(false);
      });
    return () => controller.abort();
  }, [query, version, loader]);
  return {
    data,
    loading,
    error,
    reload: () => setVersion((x) => x + 1),
    filter: (filters: Record<string, unknown>) =>
      setQuery((q) => ({ ...filters, page: 0, size: q.size })),
    pagination: {
      current: Number(query.page) + 1,
      pageSize: Number(query.size),
      total: data?.totalElements ?? 0,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50, 100],
      onChange: (current: number, size: number) =>
        setQuery((q) => ({
          ...q,
          page: size === q.size ? current - 1 : 0,
          size: Math.min(size, 100),
        })),
    },
  };
}
export function PagedTable<T extends object>({
  state,
  ...props
}: Omit<TableProps<T>, 'pagination' | 'loading' | 'dataSource'> & {
  state: ReturnType<typeof usePaged<T>>;
}) {
  const t = useText();
  return (
    <>
      <ApiError error={state.error} retry={state.reload} />
      <Table<T>
        {...props}
        scroll={{ x: 'max-content' }}
        dataSource={state.data?.content}
        loading={state.loading}
        pagination={state.pagination}
        locale={{
          emptyText: state.error
            ? t('loadFailed', 'Không tải được dữ liệu')
            : t('empty', 'Chưa có dữ liệu'),
        }}
      />
    </>
  );
}
export function FilterActions({ reset }: { reset: () => void }) {
  const t = useText();
  return (
    <Form.Item>
      <Space>
        <Button type="primary" htmlType="submit">
          {t('search', 'Tìm kiếm')}
        </Button>
        <Button onClick={reset}>{t('reset', 'Đặt lại')}</Button>
      </Space>
    </Form.Item>
  );
}
