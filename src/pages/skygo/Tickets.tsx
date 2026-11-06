import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Descriptions, Form, Input } from 'antd';
import React, { useRef, useState } from 'react';
import { verifyTicket } from '@/skygo/service';
import type { TicketResult } from '@/skygo/types';
import {
  ApiError,
  applyFieldErrors,
  required,
  Status,
  time,
  useText,
} from '@/skygo/ui';
export default function Tickets() {
  const t = useText();
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<unknown>();
  const [result, setResult] = useState<TicketResult>();
  return (
    <PageContainer title={t('tickets.title', 'Xác minh QR vé')}>
      <Card>
        <Form
          form={form}
          layout="vertical"
          disabled={busy}
          onValuesChange={() => setResult(undefined)}
          onFinish={async (values) => {
            if (pending.current) return;
            pending.current = true;
            setBusy(true);
            setError(undefined);
            setResult(undefined);
            try {
              setResult(await verifyTicket(values.qrToken.trim()));
              form.resetFields();
            } catch (e) {
              setError(e);
              applyFieldErrors(form, e);
            } finally {
              pending.current = false;
              setBusy(false);
            }
          }}
        >
          <Form.Item
            name="qrToken"
            label={t('ticket.content', 'Nội dung QR (SKYGO:...)')}
            rules={[...required, { max: 70 }]}
          >
            <Input.TextArea rows={3} maxLength={70} autoComplete="off" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            {t('ticket.verify', 'Xác minh')}
          </Button>
        </Form>
        <ApiError error={error} />
        {result && (
          <div className="mt-4">
            <Alert
              showIcon
              type={result.valid ? 'success' : 'warning'}
              title={
                result.valid
                  ? t('ticket.valid', 'Vé hợp lệ')
                  : t('ticket.invalid', 'Vé không hợp lệ')
              }
            />
            <Descriptions
              column={1}
              bordered
              items={[
                {
                  key: 'code',
                  label: t('booking.code', 'Mã đặt vé'),
                  children: result.bookingCode ?? '—',
                },
                {
                  key: 'status',
                  label: t('status', 'Trạng thái'),
                  children: <Status value={result.status} />,
                },
                {
                  key: 'flight',
                  label: t('flight.number', 'Chuyến bay'),
                  children: result.flightNumber ?? '—',
                },
                {
                  key: 'departure',
                  label: t('flight.departure', 'Khởi hành (VN)'),
                  children: time(result.departureAt),
                },
                {
                  key: 'passengers',
                  label: t('ticket.passengers', 'Số hành khách'),
                  children: result.passengerCount,
                },
              ]}
            />
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
