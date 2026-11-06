import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Table,
} from 'antd';
import React from 'react';
import { bookingService } from '@/skygo/service';
import type { Booking, Passenger } from '@/skygo/types';
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
export function BookingDetails({ data }: { data: Booking }) {
  const t = useText();
  return (
    <>
      <Descriptions
        bordered
        column={1}
        items={[
          { key: 'id', label: 'ID', children: data.id },
          {
            key: 'code',
            label: t('booking.code', 'Mã đặt vé'),
            children: data.bookingCode ?? '—',
          },
          {
            key: 'status',
            label: t('status', 'Trạng thái'),
            children: <Status value={data.status} />,
          },
          {
            key: 'amount',
            label: t('booking.total', 'Tổng tiền'),
            children: money(data.totalAmount),
          },
          {
            key: 'totalFare',
            label: t('booking.totalFare', 'Tiền vé tại thời điểm đặt'),
            children: money(data.priceSnapshot.totalFare),
          },
          {
            key: 'totalTax',
            label: t('booking.totalTax', 'Tổng thuế tại thời điểm đặt'),
            children: money(data.priceSnapshot.totalTax),
          },
          {
            key: 'refundable',
            label: t('fare.refundable', 'Cho phép hoàn vé'),
            children: data.priceSnapshot.refundable
              ? t('yes', 'Có')
              : t('no', 'Không'),
          },
          {
            key: 'cancelFee',
            label: t('cancel.fee', 'Phí hủy'),
            children: money(data.priceSnapshot.cancelFee),
          },
          {
            key: 'seats',
            label: t('booking.seats', 'Số ghế'),
            children: data.seatCount,
          },
          {
            key: 'contact',
            label: t('booking.contact', 'Liên hệ'),
            children: `${data.contact.email} · ${data.contact.phone}`,
          },
          {
            key: 'flight',
            label: t('flight.number', 'Chuyến bay'),
            children: `${data.flight.flightNumber} · ${data.flight.airline.name} · ${data.flight.origin} → ${data.flight.destination}`,
          },
          {
            key: 'depart',
            label: t('flight.departure', 'Khởi hành (VN)'),
            children: time(data.flight.departureAt),
          },
          {
            key: 'arrive',
            label: t('flight.arrival', 'Đến (VN)'),
            children: time(data.flight.arrivalAt),
          },
          {
            key: 'fare',
            label: t('fare.class', 'Hạng vé'),
            children: data.fareClass.classCode,
          },
          {
            key: 'created',
            label: t('created', 'Tạo lúc'),
            children: time(data.createdAt),
          },
          {
            key: 'hold',
            label: t('booking.hold', 'Hết hạn giữ chỗ'),
            children: time(data.holdExpiresAt),
          },
          {
            key: 'confirmed',
            label: t('booking.confirmed', 'Xác nhận lúc'),
            children: time(data.confirmedAt),
          },
        ]}
      />
      <h3>{t('booking.passengers', 'Hành khách')}</h3>
      <Table<Passenger>
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content' }}
        dataSource={data.passengers}
        columns={[
          {
            title: t('passenger.name', 'Họ tên'),
            render: (_, r) => `${r.title} ${r.fullName}`,
          },
          { title: t('passenger.type', 'Loại'), dataIndex: 'type' },
          { title: t('passenger.dob', 'Ngày sinh'), dataIndex: 'dateOfBirth' },
          {
            title: t('passenger.accompanying', 'ID người lớn đi kèm'),
            dataIndex: 'accompanyingAdultId',
          },
          {
            title: t('fare.baseFare', 'Giá vé'),
            render: (_, r) => money(r.fareAmount),
          },
          { title: t('tax', 'Thuế'), render: (_, r) => money(r.taxAmount) },
        ]}
      />
      <h3>{t('booking.cancellations', 'Lịch sử yêu cầu hủy')}</h3>
      <Table
        rowKey="id"
        pagination={false}
        dataSource={data.cancellationRequests}
        columns={[
          { title: t('reason', 'Lý do'), dataIndex: 'reason' },
          {
            title: t('status', 'Trạng thái'),
            render: (_, r) => <Status value={r.status} />,
          },
          {
            title: t('refund', 'Hoàn tiền'),
            render: (_, r) => money(r.refundAmount),
          },
          {
            title: t('processed', 'Xử lý lúc'),
            render: (_, r) => time(r.processedAt),
          },
        ]}
      />
    </>
  );
}
export default function Bookings() {
  const t = useText();
  const [form] = Form.useForm();
  // The overview links here with ?status=PENDING_PAYMENT and the like.
  const initialStatus =
    new URLSearchParams(window.location.search).get('status') ?? undefined;
  const state = usePaged(
    bookingService.list,
    initialStatus ? { status: initialStatus } : undefined,
  );
  const detail = useDetail(bookingService.detail);
  return (
    <PageContainer title={t('bookings.title', 'Đơn đặt vé')}>
      <Card>
        <Form
          form={form}
          layout="inline"
          initialValues={{ status: initialStatus }}
          onFinish={(v) =>
            state.filter({ ...v, date: v.date?.format('YYYY-MM-DD') })
          }
        >
          <Form.Item name="bookingCode" label={t('booking.code', 'Mã đặt vé')}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="status" label={t('status', 'Trạng thái')}>
            <Select
              allowClear
              style={{ width: 210 }}
              options={statusOptions([
                'PENDING_PAYMENT',
                'PAYMENT_FAILED',
                'CONFIRMED',
                'CANCEL_REQUESTED',
                'CANCELLED',
                'EXPIRED',
              ])}
            />
          </Form.Item>
          <Form.Item
            name="date"
            label={t('flight.date', 'Ngày khởi hành (VN)')}
          >
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <FilterActions
            reset={() => {
              form.resetFields();
              state.filter({});
            }}
          />
        </Form>
        <PagedTable<Booking>
          state={state}
          rowKey="id"
          columns={[
            {
              title: t('booking.code', 'Mã đặt vé'),
              render: (_, r) => r.bookingCode ?? r.id,
            },
            {
              title: t('flight.number', 'Chuyến bay'),
              render: (_, r) => r.flight.flightNumber,
            },
            {
              title: t('flight.departure', 'Khởi hành (VN)'),
              render: (_, r) => time(r.flight.departureAt),
            },
            {
              title: t('status', 'Trạng thái'),
              render: (_, r) => <Status value={r.status} />,
            },
            {
              title: t('booking.total', 'Tổng tiền'),
              render: (_, r) => money(r.totalAmount),
            },
            {
              title: t('actions', 'Thao tác'),
              render: (_, r) => (
                <Button onClick={() => detail.show(r.id)}>
                  {t('detail', 'Chi tiết')}
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        open={detail.open}
        size="large"
        title={t('booking.detail', 'Chi tiết đơn đặt vé')}
        loading={detail.loading}
        onClose={detail.close}
        destroyOnHidden
      >
        <ApiError error={detail.error} retry={detail.retry} />
        {detail.data && <BookingDetails data={detail.data} />}
      </Drawer>
    </PageContainer>
  );
}
