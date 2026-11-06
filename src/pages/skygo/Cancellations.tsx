import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Drawer, Form, Select, Space } from 'antd';
import React, { useRef, useState } from 'react';
import { bookingService, cancellationService } from '@/skygo/service';
import type { Cancellation } from '@/skygo/types';
import {
  ApiError,
  FilterActions,
  money,
  PagedTable,
  Status,
  statusOptions,
  time,
  usePaged,
  useText,
} from '@/skygo/ui';
import { useDetail } from '@/skygo/useDetail';
import { BookingDetails } from './Bookings';
export default function Cancellations() {
  const t = useText();
  const { modal, message } = App.useApp();
  const [form] = Form.useForm();
  const state = usePaged(cancellationService.list);
  const detail = useDetail(bookingService.detail);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const confirm = (row: Cancellation, action: 'approve' | 'reject') => {
    if (pending.current) return;
    modal.confirm({
      title:
        action === 'approve'
          ? t('cancel.approveConfirm', 'Duyệt yêu cầu hủy?')
          : t('cancel.rejectConfirm', 'Từ chối yêu cầu hủy?'),
      content: `${t('booking.id', 'Đơn')} ${row.bookingId} · ${t('refund', 'Hoàn tiền')}: ${money(row.refundAmount)}`,
      okText: t('confirm', 'Xác nhận'),
      cancelText: t('cancel', 'Quay lại'),
      onOk: async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError(undefined);
        try {
          await cancellationService.process(row.id, action);
          state.reload();
          message.success(t('cancel.done', 'Đã xử lý yêu cầu hủy'));
        } catch (e) {
          setError(e);
          throw e;
        } finally {
          pending.current = false;
          setBusy(false);
        }
      },
    });
  };
  return (
    <PageContainer title={t('cancellations.title', 'Yêu cầu hủy vé')}>
      <Card>
        <ApiError error={error} />
        <Form form={form} layout="inline" onFinish={state.filter}>
          <Form.Item name="status" label={t('status', 'Trạng thái')}>
            <Select
              allowClear
              style={{ width: 180 }}
              options={statusOptions(['PENDING', 'APPROVED', 'REJECTED'])}
            />
          </Form.Item>
          <FilterActions
            reset={() => {
              form.resetFields();
              state.filter({});
            }}
          />
        </Form>
        <PagedTable<Cancellation>
          state={state}
          rowKey="id"
          columns={[
            { title: 'ID', dataIndex: 'id' },
            {
              title: t('booking.id', 'Đơn đặt vé'),
              render: (_, r) => (
                <Button type="link" onClick={() => detail.show(r.bookingId)}>
                  {r.bookingId}
                </Button>
              ),
            },
            { title: t('reason', 'Lý do'), dataIndex: 'reason' },
            {
              title: t('cancel.fee', 'Phí hủy'),
              render: (_, r) => money(r.cancelFeeTotal),
            },
            {
              title: t('refund', 'Hoàn tiền'),
              render: (_, r) => money(r.refundAmount),
            },
            {
              title: t('status', 'Trạng thái'),
              render: (_, r) => <Status value={r.status} />,
            },
            {
              title: t('created', 'Tạo lúc'),
              render: (_, r) => time(r.createdAt),
            },
            {
              title: t('processed', 'Xử lý lúc'),
              render: (_, r) => time(r.processedAt),
            },
            {
              title: t('actions', 'Thao tác'),
              render: (_, r) =>
                r.status === 'PENDING' && (
                  <Space>
                    <Button
                      disabled={busy}
                      onClick={() => confirm(r, 'approve')}
                    >
                      {t('approve', 'Duyệt')}
                    </Button>
                    <Button
                      danger
                      disabled={busy}
                      onClick={() => confirm(r, 'reject')}
                    >
                      {t('reject', 'Từ chối')}
                    </Button>
                  </Space>
                ),
            },
          ]}
        />
      </Card>
      <Drawer
        open={detail.open}
        loading={detail.loading}
        size="large"
        title={t('booking.detail', 'Chi tiết đơn đặt vé')}
        onClose={detail.close}
        destroyOnHidden
      >
        <ApiError error={detail.error} retry={detail.retry} />
        {detail.data && <BookingDetails data={detail.data} />}
      </Drawer>
    </PageContainer>
  );
}
