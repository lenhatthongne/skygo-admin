import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  RocketOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Button, Empty, Skeleton } from 'antd';
import React from 'react';
import { errorText } from '@/requestErrorConfig';
import { refreshOverview, useOverview } from '@/skygo/overviewStore';
import { money, Status, time, useText } from '@/skygo/ui';
import { useStyles } from './Overview.style';

const day = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${iso}T00:00:00`));

/** Millions with one decimal: 12,5 tr. The exact figure is in the bar's tooltip. */
const short = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1).replace('.', ',')} tr`
    : value >= 1000
      ? `${Math.round(value / 1000)}k`
      : String(value);

export default function Overview() {
  const t = useText();
  const { styles, cx } = useStyles();
  const { value, failure, loaded } = useOverview();

  const tasks = value
    ? [
        {
          key: 'cancel',
          icon: <StopOutlined />,
          count: value.cancelRequests,
          label: t('overview.cancel', 'Yêu cầu hủy chờ duyệt'),
          to: '/ops/cancellations',
        },
        {
          key: 'support',
          icon: <CustomerServiceOutlined />,
          count: value.supportWaiting,
          label: t('overview.support', 'Hội thoại chờ trả lời'),
          to: '/ops/support',
        },
        {
          key: 'pending',
          icon: <ClockCircleOutlined />,
          count: value.pendingPayment,
          label: t('overview.pending', 'Đơn đang chờ thanh toán'),
          to: '/ops/bookings?status=PENDING_PAYMENT',
        },
        {
          key: 'delayed',
          icon: <RocketOutlined />,
          count: value.flightsDelayed,
          label: t('overview.delayed', 'Chuyến bị hoãn chưa bay'),
          to: '/catalog/flights?status=DELAYED',
        },
      ]
    : [];
  const busy = tasks.some((x) => x.count > 0);
  const peak = Math.max(1, ...(value?.last7Days.map((d) => d.revenue) ?? [1]));
  const week = value?.last7Days.reduce((s, d) => s + d.revenue, 0) ?? 0;

  return (
    <PageContainer title={false}>
      <div className={styles.hello}>
        <div>
          <h2>{t('overview.title', 'Tổng quan hôm nay')}</h2>
          <span>
            {new Intl.DateTimeFormat('vi-VN', {
              dateStyle: 'full',
              timeZone: 'Asia/Ho_Chi_Minh',
            }).format(new Date())}
            {' · '}
            {t('overview.auto', 'tự cập nhật mỗi 20 giây')}
          </span>
        </div>
        <Button onClick={() => void refreshOverview()}>
          {t('overview.refresh', 'Làm mới')}
        </Button>
      </div>

      {failure && !value ? (
        <Alert
          type="error"
          showIcon
          title={errorText(failure)}
          action={
            <Button onClick={() => void refreshOverview()}>
              {t('retry', 'Thử lại')}
            </Button>
          }
        />
      ) : !loaded || !value ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div className={styles.section}>
            {t('overview.todo', 'Cần xử lý')}
          </div>
          {!busy && (
            <div className={styles.allClear}>
              <CheckCircleOutlined />
              {t('overview.clear', 'Không có việc nào đang chờ. Mọi thứ ổn.')}
            </div>
          )}
          <div className={styles.tasks}>
            {tasks.map((x) => (
              <button
                type="button"
                key={x.key}
                className={cx(styles.task, x.count > 0 && styles.taskHot)}
                onClick={() => history.push(x.to)}
              >
                <span
                  className={cx(
                    styles.taskIcon,
                    x.count > 0 && styles.taskIconHot,
                  )}
                >
                  {x.icon}
                </span>
                <span>
                  <div className={styles.taskNumber}>{x.count}</div>
                  <div className={styles.taskLabel}>{x.label}</div>
                </span>
              </button>
            ))}
          </div>

          <div className={styles.section}>
            {t('overview.numbers', 'Số liệu')}
          </div>
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>
                {t('overview.revenueToday', 'Doanh thu hôm nay')}
              </div>
              <div className={styles.kpiValue}>{money(value.revenueToday)}</div>
              <div className={styles.kpiNote}>
                {t('overview.week', '7 ngày')}: {money(week)}
              </div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>
                {t('overview.bookingsToday', 'Đơn đặt hôm nay')}
              </div>
              <div className={styles.kpiValue}>{value.bookingsToday}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>
                {t('overview.flightsToday', 'Chuyến bay hôm nay')}
              </div>
              <div className={styles.kpiValue}>{value.flightsToday}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>
                {t('overview.customers', 'Khách hàng')}
              </div>
              <div className={styles.kpiValue}>{value.customers}</div>
              <div className={styles.kpiNote}>
                +{value.newCustomers7Days} {t('overview.new7', 'trong 7 ngày')}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            {t('overview.activity', 'Hoạt động')}
          </div>
          <div className={styles.panels}>
            <div className={styles.panel}>
              <h3>{t('overview.chart', 'Doanh thu 7 ngày qua')}</h3>
              <div className={styles.bars}>
                {value.last7Days.map((d, i) => (
                  <div
                    key={d.date}
                    className={styles.barCol}
                    title={`${day(d.date)}: ${money(d.revenue)} · ${d.bookings} đơn đặt`}
                  >
                    <span className={styles.barValue}>
                      {d.revenue > 0 ? short(d.revenue) : ''}
                    </span>
                    <div
                      className={cx(
                        styles.bar,
                        i === value.last7Days.length - 1 && styles.barToday,
                      )}
                      style={{ height: `${(d.revenue / peak) * 120}px` }}
                    />
                    <span className={styles.barDay}>{day(d.date)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.panel}>
              <h3>{t('overview.recent', 'Đơn mới nhất')}</h3>
              {value.recent.length === 0 ? (
                <Empty
                  description={t('overview.noBookings', 'Chưa có đơn nào')}
                />
              ) : (
                value.recent.map((r) => (
                  <div className={styles.recentRow} key={r.id}>
                    <div className={styles.recentMain}>
                      <strong>
                        {r.bookingCode ?? '—'} · {r.route}
                      </strong>
                      <span>{time(r.createdAt)}</span>
                    </div>
                    <div className={styles.recentSide}>
                      {money(r.totalAmount)}
                      <Status value={r.status} />
                    </div>
                  </div>
                ))
              )}
              <Button
                type="link"
                style={{ paddingInline: 0, marginTop: 8 }}
                onClick={() => history.push('/ops/bookings')}
              >
                {t('overview.allBookings', 'Xem tất cả đơn')}
              </Button>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
