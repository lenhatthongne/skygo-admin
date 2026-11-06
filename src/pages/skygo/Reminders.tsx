import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { bookingService, reminderService } from '@/skygo/service';
import type {
  Booking,
  ReminderLogItem,
  ReminderSettings,
  ReminderStatus,
} from '@/skygo/types';
import { ApiError, Status, time, useText } from '@/skygo/ui';

const MAX_LEAD = 20160;
const PRESETS: { label: string; leads: number[] }[] = [
  { label: '24 giờ và 3 giờ (mặc định)', leads: [1440, 180] },
  { label: 'Thử nhanh: 5 phút và 1 phút', leads: [5, 1] },
  { label: 'Thử nhanh: 2 phút', leads: [2] },
];
const NOTES: Record<string, string> = {
  NO_DEVICE: 'Khách chưa đăng ký thiết bị nhận thông báo',
  SUPERSEDED: 'Đã có mốc gần giờ bay hơn',
  FLIGHT_DEPARTED: 'Chuyến bay đã khởi hành',
  BOOKING_NOT_CONFIRMED: 'Đơn không còn ở trạng thái xác nhận',
  PROVIDER_UNAVAILABLE: 'Dịch vụ gửi thông báo tạm thời lỗi, đang thử lại',
  ATTEMPTS_EXHAUSTED: 'Đã thử nhiều lần không được',
  REJECTED: 'Thiết bị từ chối thông báo',
  ERROR: 'Lỗi khi gửi',
};
const statusColor: Record<ReminderStatus, string> = {
  PENDING: 'blue',
  SENDING: 'blue',
  SENT: 'green',
  FAILED: 'red',
  SKIPPED: 'default',
};
const statusText: Record<ReminderStatus, string> = {
  PENDING: 'Đang chờ gửi',
  SENDING: 'Đang gửi',
  SENT: 'Đã gửi',
  FAILED: 'Thất bại',
  SKIPPED: 'Bỏ qua',
};

/** 1440 → "1 ngày", 180 → "3 giờ", 2 → "2 phút". */
export const leadLabel = (minutes: number) =>
  minutes % 1440 === 0
    ? `${minutes / 1440} ngày`
    : minutes % 60 === 0
      ? `${minutes / 60} giờ`
      : `${minutes} phút`;

/** Keeps whole numbers within range, no duplicates, largest first. */
export const cleanLeads = (values: (string | number)[]) =>
  [...new Set(values.map(Number))]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_LEAD)
    .sort((a, b) => b - a);

export default function Reminders() {
  const t = useText();
  const { message } = App.useApp();
  const [saved, setSaved] = useState<ReminderSettings>();
  const [draft, setDraft] = useState<ReminderSettings>();
  const [loadError, setLoadError] = useState<unknown>();
  const [saveError, setSaveError] = useState<unknown>();
  const [saving, setSaving] = useState(false);

  const [log, setLog] = useState<ReminderLogItem[]>();
  const [logError, setLogError] = useState<unknown>();
  const [auto, setAuto] = useState(true);

  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<Booking | null>();
  const [sendError, setSendError] = useState<unknown>();
  const [sending, setSending] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoadError(undefined);
    try {
      const value = await reminderService.settings();
      setSaved(value);
      setDraft(value);
    } catch (e) {
      setLoadError(e);
    }
  }, []);
  const loadLog = useCallback(async (signal?: AbortSignal) => {
    try {
      setLog(await reminderService.log(30, signal));
      setLogError(undefined);
    } catch (e) {
      if (!signal?.aborted) setLogError(e);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);
  // The log refreshes by itself every 5 seconds so a demo shows each push as it is sent.
  useEffect(() => {
    const controller = new AbortController();
    void loadLog(controller.signal);
    if (!auto) return () => controller.abort();
    const timer = setInterval(() => void loadLog(controller.signal), 5000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [auto, loadLog]);

  const changed =
    !!saved &&
    !!draft &&
    (saved.enabled !== draft.enabled ||
      saved.leadMinutes.join() !== draft.leadMinutes.join());

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const value = await reminderService.save(draft);
      setSaved(value);
      setDraft(value);
      message.success(
        value.enabled
          ? t('reminder.savedOn', 'Đã bật nhắc giờ bay từ máy chủ')
          : t('reminder.savedOff', 'Đã tắt nhắc giờ bay từ máy chủ'),
      );
    } catch (e) {
      setSaveError(e);
    } finally {
      setSaving(false);
    }
  };

  const search = async () => {
    const value = code.trim();
    if (!value || searching) return;
    setSearching(true);
    setSendError(undefined);
    setFound(undefined);
    try {
      const page = await bookingService.list({
        bookingCode: value,
        page: 0,
        size: 1,
      });
      setFound(page.content[0] ?? null);
    } catch (e) {
      setSendError(e);
    } finally {
      setSearching(false);
    }
  };

  const sendNow = async () => {
    if (!found || sending) return;
    setSending(true);
    setSendError(undefined);
    try {
      const result = await reminderService.sendNow(found.id);
      message.success(
        t(
          'reminder.sent',
          `Đã gửi nhắc tới ${result.deviceCount} thiết bị, điện thoại sẽ nhận trong vài giây`,
        ),
      );
      void loadLog();
    } catch (e) {
      setSendError(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer title={t('reminder.title', 'Nhắc giờ bay')}>
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <Card
          title={t('reminder.settings', 'Nhắc giờ bay từ máy chủ')}
          loading={!draft && !loadError}
          extra={
            saved && (
              <Tag color={saved.enabled ? 'green' : 'default'}>
                {saved.enabled ? 'Đang bật' : 'Đang tắt'}
              </Tag>
            )
          }
        >
          <ApiError error={loadError} retry={loadSettings} />
          {draft && (
            <Space
              direction="vertical"
              size="middle"
              style={{ display: 'flex' }}
            >
              <Space>
                <Switch
                  checked={draft.enabled}
                  onChange={(enabled) => setDraft({ ...draft, enabled })}
                  aria-label="Bật nhắc giờ bay từ máy chủ"
                />
                <span>
                  {draft.enabled
                    ? 'Máy chủ tự gửi thông báo nhắc theo các mốc giờ bên dưới'
                    : 'Tắt: điện thoại khách tự nhắc bằng thông báo cục bộ (trước 1 ngày và 3 giờ)'}
                </span>
              </Space>
              <div>
                <div style={{ marginBottom: 8 }}>
                  Các mốc nhắc (số phút trước giờ bay)
                </div>
                <Select
                  mode="tags"
                  style={{ width: '100%', maxWidth: 480 }}
                  tokenSeparators={[',', ' ']}
                  value={draft.leadMinutes.map(String)}
                  placeholder="Nhập số phút rồi Enter, ví dụ 1440"
                  onChange={(values: string[]) =>
                    setDraft({ ...draft, leadMinutes: cleanLeads(values) })
                  }
                  options={draft.leadMinutes.map((m) => ({
                    value: String(m),
                    label: `${leadLabel(m)} (${m} phút)`,
                  }))}
                />
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    {PRESETS.map((p) => (
                      <Button
                        key={p.label}
                        size="small"
                        onClick={() =>
                          setDraft({ ...draft, leadMinutes: p.leads })
                        }
                      >
                        {p.label}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
              <Alert
                type="warning"
                showIcon
                title="Khi bật, máy chủ nhắc mọi đơn đã xác nhận đang nằm trong mốc giờ (kể cả đơn thử) và ứng dụng khách tự xóa nhắc cục bộ để không trùng. Mỗi đơn chỉ nhận mốc gần giờ bay nhất đã tới."
              />
              <ApiError error={saveError} />
              <Button
                type="primary"
                loading={saving}
                disabled={!changed || draft.leadMinutes.length === 0}
                onClick={save}
              >
                {t('save', 'Lưu thay đổi')}
              </Button>
            </Space>
          )}
        </Card>

        <Card title={t('reminder.sendNow', 'Gửi nhắc ngay cho một đơn')}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Space.Compact style={{ maxWidth: 480, width: '100%' }}>
              <Input
                value={code}
                placeholder="Mã đặt vé, ví dụ VSCWCQ"
                maxLength={20}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onPressEnter={search}
              />
              <Button loading={searching} onClick={search}>
                {t('reminder.find', 'Tìm đơn')}
              </Button>
            </Space.Compact>
            {found === null && (
              <Alert type="info" showIcon title="Không tìm thấy đơn này" />
            )}
            {found && (
              <>
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={[
                    {
                      key: 'status',
                      label: 'Trạng thái',
                      children: <Status value={found.status} />,
                    },
                    {
                      key: 'flight',
                      label: 'Chuyến bay',
                      children: `${found.flight.flightNumber} · ${found.flight.origin} → ${found.flight.destination}`,
                    },
                    {
                      key: 'depart',
                      label: 'Khởi hành (VN)',
                      children: time(found.flight.departureAt),
                    },
                    {
                      key: 'contact',
                      label: 'Liên hệ',
                      children: found.contact.email,
                    },
                  ]}
                />
                <ApiError error={sendError} />
                <Space>
                  <Button
                    type="primary"
                    loading={sending}
                    disabled={found.status !== 'CONFIRMED'}
                    onClick={sendNow}
                  >
                    {t('reminder.sendButton', 'Gửi nhắc ngay')}
                  </Button>
                  {found.status !== 'CONFIRMED' && (
                    <span>Chỉ nhắc được đơn đã xác nhận</span>
                  )}
                </Space>
              </>
            )}
            {!found && <ApiError error={sendError} />}
          </Space>
        </Card>

        <Card
          title={t('reminder.log', 'Nhật ký nhắc giờ bay')}
          extra={
            <Space>
              <Checkbox
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              >
                Tự làm mới (5 giây)
              </Checkbox>
              <Button onClick={() => void loadLog()}>
                {t('reload', 'Làm mới')}
              </Button>
            </Space>
          }
        >
          <ApiError error={logError} retry={() => void loadLog()} />
          <Table<ReminderLogItem>
            rowKey="id"
            size="small"
            loading={!log && !logError}
            pagination={false}
            scroll={{ x: 'max-content' }}
            dataSource={log ?? []}
            locale={{ emptyText: 'Chưa có nhắc nào' }}
            columns={[
              {
                title: 'Tạo lúc',
                render: (_, r) => time(r.createdAt),
              },
              {
                title: 'Đơn',
                render: (_, r) =>
                  `${r.bookingCode ?? '—'} · ${r.originCode} → ${r.destinationCode}`,
              },
              {
                title: 'Mốc',
                render: (_, r) =>
                  r.leadMinutes === null
                    ? 'Gửi tay'
                    : `${leadLabel(r.leadMinutes)} trước giờ bay`,
              },
              {
                title: 'Trạng thái',
                render: (_, r) => (
                  <Tag color={statusColor[r.status]}>
                    {statusText[r.status]}
                  </Tag>
                ),
              },
              {
                title: 'Ghi chú',
                render: (_, r) => (r.note ? (NOTES[r.note] ?? r.note) : '—'),
              },
              {
                title: 'Gửi lúc',
                render: (_, r) => time(r.sentAt),
              },
            ]}
          />
        </Card>
      </Space>
    </PageContainer>
  );
}
