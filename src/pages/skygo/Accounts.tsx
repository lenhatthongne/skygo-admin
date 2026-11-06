import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Tag,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { accountService } from '@/skygo/service';
import type { Account, AccountStatus } from '@/skygo/types';
import {
  ApiError,
  applyFieldErrors,
  PagedTable,
  time,
  usePaged,
  useText,
} from '@/skygo/ui';
import { useDetail } from '@/skygo/useDetail';
import { useStyles } from './Accounts.style';

const statuses: AccountStatus[] = ['ACTIVE', 'UNVERIFIED', 'LOCKED', 'BLOCKED'];
const statusMeta = {
  ACTIVE: {
    label: 'Hoạt động',
    color: 'success',
    icon: <CheckCircleOutlined aria-hidden="true" />,
  },
  UNVERIFIED: {
    label: 'Chưa xác thực',
    color: 'gold',
    icon: <ClockCircleOutlined aria-hidden="true" />,
  },
  LOCKED: {
    label: 'Tạm khóa',
    color: 'orange',
    icon: <ClockCircleOutlined aria-hidden="true" />,
  },
  BLOCKED: {
    label: 'Admin khóa',
    color: 'error',
    icon: <LockOutlined aria-hidden="true" />,
  },
};
function AccountBadge({ status }: { status: AccountStatus }) {
  const t = useText();
  const meta = statusMeta[status];
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {t(`accounts.status.${status}`, meta.label)}
    </Tag>
  );
}
export default function Accounts() {
  const t = useText();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const state = usePaged(accountService.list);
  const detail = useDetail(accountService.detail);
  const [filters] = Form.useForm();
  const [reasonForm] = Form.useForm<{ reason: string }>();
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>();
  const [target, setTarget] = useState<Account>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [mutationError, setMutationError] = useState<unknown>();
  const [counts, setCounts] = useState<Record<string, number>>();
  const [countsError, setCountsError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCounts(undefined);
    setCountsError(undefined);
    Promise.all(
      ['ALL', ...statuses].map(async (status) => {
        const result = await accountService.list(
          { page: 0, size: 1, ...(status === 'ALL' ? {} : { status }) },
          controller.signal,
        );
        return [status, result.totalElements] as const;
      }),
    )
      .then((entries) => {
        if (!controller.signal.aborted) setCounts(Object.fromEntries(entries));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCountsError(error);
      });
    return () => controller.abort();
  }, [revision]);
  const reload = () => {
    state.reload();
    setRevision((value) => value + 1);
  };
  const applyFilters = (values: Record<string, unknown>) => {
    setSelectedStatus(values.status as AccountStatus | undefined);
    state.filter({
      ...values,
      search:
        typeof values.search === 'string'
          ? values.search.trim() || undefined
          : undefined,
    });
  };
  const chooseStatus = (status?: AccountStatus) => {
    filters.setFieldValue('status', status);
    applyFilters(filters.getFieldsValue());
  };
  const canManage = (row: Account) =>
    row.role === 'CUSTOMER' && row.id !== initialState?.currentUser?.id;
  const beginAction = (row: Account) => {
    reasonForm.resetFields();
    setMutationError(undefined);
    setTarget(row);
  };
  const closeAction = () => {
    if (!pending.current) setTarget(undefined);
  };
  const submit = async () => {
    if (!target || pending.current) return;
    let reason = '';
    if (!target.adminBlocked) {
      try {
        reason = (await reasonForm.validateFields()).reason.trim();
      } catch {
        return;
      }
    }
    pending.current = true;
    setBusy(true);
    setMutationError(undefined);
    try {
      const result = target.adminBlocked
        ? await accountService.unblock(target.id)
        : await accountService.block(target.id, reason);
      setTarget(undefined);
      reload();
      if (detail.open && detail.data?.id === result.id)
        void detail.show(result.id);
      message.success(
        target.adminBlocked
          ? t('accounts.unblocked', 'Đã mở khóa tài khoản')
          : t('accounts.blocked', 'Đã khóa tài khoản'),
      );
    } catch (error) {
      setMutationError(error);
      applyFieldErrors(reasonForm, error);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <PageContainer title={false}>
      <div className={styles.heading}>
        <div>
          <div className={styles.eyebrow}>
            <SafetyCertificateOutlined aria-hidden="true" />{' '}
            {t('accounts.eyebrow', 'QUẢN TRỊ HỆ THỐNG')}
          </div>
          <h1 className={styles.title}>
            {t('accounts.title', 'Quản lý tài khoản')}
          </h1>
          <p className={styles.subtitle}>
            {t(
              'accounts.subtitle',
              'Theo dõi trạng thái và kiểm soát quyền truy cập của khách hàng SkyGo.',
            )}
          </p>
        </div>
        <Button
          icon={<ReloadOutlined aria-hidden="true" />}
          onClick={reload}
          loading={state.loading}
        >
          {t('accounts.refresh', 'Làm mới dữ liệu')}
        </Button>
      </div>
      <div className={styles.summaryLabel}>
        {t('accounts.summary', 'Tổng quan toàn bộ tài khoản')}
      </div>
      <div className={styles.metrics}>
        {(['ALL', ...statuses] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.metric} ${(selectedStatus ?? 'ALL') === key ? styles.selectedMetric : ''}`}
            aria-pressed={(selectedStatus ?? 'ALL') === key}
            onClick={() => chooseStatus(key === 'ALL' ? undefined : key)}
          >
            <span className={styles.metricTop}>
              <span>
                {key === 'ALL'
                  ? t('accounts.all', 'Tất cả tài khoản')
                  : t(`accounts.status.${key}`, statusMeta[key].label)}
              </span>
              {key === 'ALL' ? (
                <TeamOutlined aria-hidden="true" />
              ) : (
                statusMeta[key].icon
              )}
            </span>
            <span className={styles.metricValue}>
              {counts?.[key]?.toLocaleString('vi-VN') ?? '—'}
            </span>
          </button>
        ))}
      </div>
      <ApiError
        error={countsError}
        retry={() => setRevision((value) => value + 1)}
      />
      <Card className={styles.tableCard}>
        <div className={styles.tableHeading}>
          <h2>{t('accounts.list', 'Danh sách tài khoản')}</h2>
          <span className={styles.muted}>
            {t('accounts.accessNote', 'Chỉ quản trị viên có quyền truy cập')}
          </span>
        </div>
        <Form
          form={filters}
          layout="vertical"
          className={styles.filters}
          onFinish={applyFilters}
        >
          <Form.Item
            name="search"
            label={t('accounts.search', 'Tìm tài khoản')}
            className={styles.search}
          >
            <Input
              prefix={<SearchOutlined aria-hidden="true" />}
              allowClear
              maxLength={255}
              placeholder={t(
                'accounts.searchPlaceholder',
                'Nhập tên hoặc email…',
              )}
            />
          </Form.Item>
          <Form.Item name="role" label={t('accounts.role', 'Vai trò')}>
            <Select
              allowClear
              placeholder={t('accounts.allRoles', 'Tất cả vai trò')}
              options={[
                {
                  value: 'CUSTOMER',
                  label: t('accounts.customer', 'Khách hàng'),
                },
                { value: 'ADMIN', label: t('accounts.admin', 'Quản trị viên') },
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label={t('status', 'Trạng thái')}>
            <Select
              allowClear
              placeholder={t('accounts.allStatuses', 'Tất cả trạng thái')}
              options={statuses.map((value) => ({
                value,
                label: t(`accounts.status.${value}`, statusMeta[value].label),
              }))}
            />
          </Form.Item>
          <div className={styles.filterActions}>
            <Button type="primary" htmlType="submit">
              {t('accounts.apply', 'Áp dụng')}
            </Button>
            <Button
              onClick={() => {
                filters.resetFields();
                applyFilters({});
              }}
            >
              {t('reset', 'Đặt lại')}
            </Button>
          </div>
        </Form>
        <PagedTable<Account>
          state={state}
          rowKey="id"
          size="middle"
          columns={[
            {
              title: t('accounts.account', 'Tài khoản'),
              key: 'account',
              render: (_, row) => (
                <div className={styles.identity}>
                  <Avatar
                    className={
                      row.role === 'ADMIN' ? styles.adminAvatar : styles.avatar
                    }
                    icon={<UserOutlined aria-hidden="true" />}
                  />
                  <div>
                    <Button
                      type="link"
                      className={styles.nameButton}
                      onClick={() => void detail.show(row.id)}
                    >
                      {row.fullName}
                    </Button>
                    <div className={styles.muted}>{row.email}</div>
                  </div>
                </div>
              ),
            },
            {
              title: t('accounts.role', 'Vai trò'),
              dataIndex: 'role',
              render: (role) => (
                <Tag color={role === 'ADMIN' ? 'blue' : 'default'}>
                  {role === 'ADMIN'
                    ? t('accounts.admin', 'Quản trị viên')
                    : t('accounts.customer', 'Khách hàng')}
                </Tag>
              ),
            },
            {
              title: t('status', 'Trạng thái'),
              dataIndex: 'status',
              render: (status: AccountStatus) => (
                <AccountBadge status={status} />
              ),
            },
            {
              title: t('accounts.emailStatus', 'Xác thực email'),
              dataIndex: 'emailVerified',
              render: (verified) => (
                <span className={verified ? styles.verified : styles.muted}>
                  {verified ? (
                    <CheckCircleOutlined aria-hidden="true" />
                  ) : (
                    <ClockCircleOutlined aria-hidden="true" />
                  )}{' '}
                  {verified
                    ? t('accounts.verified', 'Đã xác thực')
                    : t('accounts.pending', 'Chưa xác thực')}
                </span>
              ),
            },
            {
              title: t('accounts.created', 'Ngày tạo'),
              dataIndex: 'createdAt',
              render: (value) => time(value),
            },
            {
              title: t('actions', 'Thao tác'),
              key: 'actions',
              fixed: 'right',
              render: (_, row) => (
                <div className={styles.rowActions}>
                  <Button
                    size="small"
                    icon={<EyeOutlined aria-hidden="true" />}
                    onClick={() => void detail.show(row.id)}
                  >
                    {t('detail', 'Chi tiết')}
                  </Button>
                  {canManage(row) && (
                    <Button
                      size="small"
                      danger={!row.adminBlocked}
                      disabled={busy}
                      icon={
                        row.adminBlocked ? (
                          <UnlockOutlined aria-hidden="true" />
                        ) : (
                          <LockOutlined aria-hidden="true" />
                        )
                      }
                      onClick={() => beginAction(row)}
                    >
                      {row.adminBlocked
                        ? t('accounts.unblock', 'Mở khóa')
                        : t('accounts.block', 'Khóa')}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <div className={styles.footnote}>
          <SafetyCertificateOutlined aria-hidden="true" />{' '}
          {t(
            'accounts.statusNote',
            'Trạng thái thể hiện khả năng truy cập tài khoản, không phải trạng thái trực tuyến.',
          )}
        </div>
      </Card>
      <Drawer
        title={t('accounts.detail', 'Chi tiết tài khoản')}
        open={detail.open}
        onClose={() => {
          if (!pending.current) detail.close();
        }}
        loading={detail.loading}
        size="large"
        destroyOnHidden
      >
        <ApiError error={detail.error} retry={detail.retry} />
        {detail.data && (
          <>
            <div className={styles.detailIdentity}>
              <Avatar
                size={56}
                className={styles.adminAvatar}
                icon={<UserOutlined aria-hidden="true" />}
              />
              <div>
                <h2>{detail.data.fullName}</h2>
                <div className={styles.muted}>{detail.data.email}</div>
                <AccountBadge status={detail.data.status} />
              </div>
            </div>
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                {
                  key: 'id',
                  label: t('accounts.id', 'Mã tài khoản'),
                  children: `#${detail.data.id}`,
                },
                {
                  key: 'role',
                  label: t('accounts.role', 'Vai trò'),
                  children:
                    detail.data.role === 'ADMIN'
                      ? t('accounts.admin', 'Quản trị viên')
                      : t('accounts.customer', 'Khách hàng'),
                },
                {
                  key: 'phone',
                  label: t('accounts.phone', 'Số điện thoại'),
                  children: detail.data.phone || '—',
                },
                {
                  key: 'email',
                  label: t('accounts.emailStatus', 'Xác thực email'),
                  children: detail.data.emailVerified
                    ? t('accounts.verified', 'Đã xác thực')
                    : t('accounts.pending', 'Chưa xác thực'),
                },
                {
                  key: 'created',
                  label: t('accounts.created', 'Ngày tạo'),
                  children: time(detail.data.createdAt),
                },
                {
                  key: 'loginLock',
                  label: t('accounts.loginLock', 'Khóa mật khẩu đến'),
                  children: time(detail.data.lockedUntil),
                },
                {
                  key: 'otpLock',
                  label: t('accounts.otpLock', 'Khóa OTP đến'),
                  children: time(detail.data.otpLockedUntil),
                },
                ...(detail.data.adminBlocked
                  ? [
                      {
                        key: 'reason',
                        label: t('reason', 'Lý do'),
                        children: (
                          <span
                            style={{
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {detail.data.blockReason}
                          </span>
                        ),
                      },
                      {
                        key: 'blockedAt',
                        label: t('accounts.blockedAt', 'Thời điểm khóa'),
                        children: time(detail.data.blockedAt),
                      },
                      {
                        key: 'blockedBy',
                        label: t(
                          'accounts.blockedBy',
                          'Quản trị viên thực hiện',
                        ),
                        children: `#${detail.data.blockedBy}`,
                      },
                    ]
                  : []),
              ]}
            />
            {canManage(detail.data) && (
              <div className={styles.detailAction}>
                <h3>{t('accounts.control', 'Kiểm soát truy cập')}</h3>
                <p className={styles.muted}>
                  {t(
                    'accounts.controlHelp',
                    'Khóa tài khoản sẽ kết thúc các phiên đăng nhập và vô hiệu hóa OTP hiện tại của khách hàng.',
                  )}
                </p>
                <Button
                  danger={!detail.data.adminBlocked}
                  icon={
                    detail.data.adminBlocked ? (
                      <UnlockOutlined aria-hidden="true" />
                    ) : (
                      <LockOutlined aria-hidden="true" />
                    )
                  }
                  onClick={() => detail.data && beginAction(detail.data)}
                >
                  {detail.data.adminBlocked
                    ? t('accounts.unblock', 'Mở khóa')
                    : t('accounts.block', 'Khóa')}
                </Button>
              </div>
            )}
          </>
        )}
      </Drawer>
      <Modal
        title={
          target?.adminBlocked
            ? t('accounts.unblockConfirm', 'Mở khóa tài khoản này?')
            : t('accounts.blockConfirm', 'Khóa tài khoản này?')
        }
        open={!!target}
        onCancel={closeAction}
        onOk={() => void submit()}
        confirmLoading={busy}
        cancelButtonProps={{ disabled: busy }}
        okButtonProps={{ danger: !target?.adminBlocked }}
        okText={
          target?.adminBlocked
            ? t('accounts.unblock', 'Mở khóa')
            : t('accounts.block', 'Khóa')
        }
        cancelText={t('cancel', 'Quay lại')}
        destroyOnHidden
      >
        <ApiError error={mutationError} />
        <p>
          <strong>{target?.fullName}</strong>
          <br />
          {target?.email}
        </p>
        <Alert
          type={target?.adminBlocked ? 'info' : 'warning'}
          showIcon
          title={
            target?.adminBlocked
              ? t(
                  'accounts.unblockHelp',
                  'Khách hàng cần đăng nhập lại. Khóa tạm và trạng thái xác thực email vẫn được giữ nguyên.',
                )
              : t(
                  'accounts.blockHelp',
                  'Khách hàng sẽ không thể đăng nhập. Các phiên đăng nhập và OTP cũ sẽ mất hiệu lực.',
                )
          }
        />
        {!target?.adminBlocked && (
          <Form form={reasonForm} layout="vertical" style={{ marginTop: 20 }}>
            <Form.Item
              name="reason"
              label={t('accounts.reason', 'Lý do khóa')}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  max: 500,
                  message: t(
                    'accounts.reasonRequired',
                    'Nhập lý do khóa từ 1 đến 500 ký tự.',
                  ),
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                maxLength={500}
                showCount
                disabled={busy}
                placeholder={t(
                  'accounts.reasonPlaceholder',
                  'Nhập lý do để quản trị viên khác có thể theo dõi…',
                )}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </PageContainer>
  );
}
