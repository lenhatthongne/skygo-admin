import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Alert, App, Button, Form, Input, Space } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { Footer } from '@/components';
import { problemOf } from '@/requestErrorConfig';
import { authService } from '@/skygo/service';
import { clearSession, safeRedirect, setToken } from '@/skygo/session';
import type { Challenge } from '@/skygo/types';
import { ApiError, applyFieldErrors, useText } from '@/skygo/ui';

const useStyles = createStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
  content: { flex: 1, padding: '48px 16px' },
}));
export default function Login() {
  const { styles } = useStyles();
  const t = useText();
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm();
  const [challenge, setChallenge] = useState<Challenge>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [resendAt, setResendAt] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const locked = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const acceptChallenge = (next: Challenge) => {
    setChallenge(next);
    form.setFieldValue('code', '');
    form.setFieldValue('password', '');
    setResendAt(Date.now() + next.resendAfterSeconds * 1000);
    setNow(Date.now());
  };
  const run = async (task: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await task();
    } catch (e) {
      clearSession();
      setError(e);
      applyFieldErrors(form, e);
      const wait = problemOf(e).retryAfterSeconds;
      if (wait) {
        setLockedUntil(Date.now() + wait * 1000);
        setResendAt(Date.now() + wait * 1000);
        setNow(Date.now());
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <LoginForm
          form={form}
          title="SkyGo Admin"
          subTitle={t('login.subtitle', 'Quản trị hệ thống đặt vé SkyGo')}
          disabled={busy || locked > 0}
          submitter={{
            searchConfig: {
              submitText: challenge
                ? t('login.verify', 'Xác thực OTP')
                : t('login.send', 'Đăng nhập và gửi OTP'),
            },
            submitButtonProps: { loading: busy, disabled: locked > 0 },
          }}
          onFinish={async (values) => {
            await run(async () => {
              if (!challenge) {
                acceptChallenge(
                  await authService.login({
                    email: values.email,
                    password: values.password,
                  }),
                );
                return;
              }
              if (challenge.purpose === 'REGISTER') {
                await authService.registerVerify(
                  challenge.challengeId,
                  values.code,
                );
                setChallenge(undefined);
                form.resetFields(['code', 'password']);
                message.success(
                  t(
                    'login.registered',
                    'Email đã xác thực. Đăng nhập lại để nhận OTP LOGIN mới.',
                  ),
                );
                return;
              }
              const result = await authService.verify(
                challenge.challengeId,
                values.code,
              );
              if (result.role !== 'ADMIN' || result.user.role !== 'ADMIN')
                throw { response: { data: { code: 'FORBIDDEN' } } };
              setToken(result.accessToken);
              const user = await authService.me();
              if (user.role !== 'ADMIN')
                throw { response: { data: { code: 'FORBIDDEN' } } };
              await setInitialState((s) => ({ ...s, currentUser: user }));
              history.replace(
                safeRedirect(
                  new URLSearchParams(window.location.search).get('redirect'),
                ),
              );
            });
            return false;
          }}
        >
          <ApiError error={error} />
          {locked > 0 && (
            <Alert
              type="warning"
              showIcon
              title={`${t('login.wait', 'Vui lòng chờ')} ${locked}s`}
            />
          )}
          {!challenge ? (
            <>
              <ProFormText
                name="email"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                  autoComplete: 'username',
                  maxLength: 255,
                }}
                placeholder="Email"
                rules={[
                  {
                    required: true,
                    type: 'email',
                    message: t('login.email', 'Nhập email hợp lệ'),
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                  autoComplete: 'current-password',
                  maxLength: 72,
                }}
                placeholder={t('login.password', 'Mật khẩu')}
                rules={[
                  {
                    required: true,
                    message: t('login.passwordRequired', 'Nhập mật khẩu'),
                  },
                ]}
              />
            </>
          ) : (
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Alert
                type="info"
                title={`${challenge.purpose === 'REGISTER' ? t('login.registration', 'Xác thực email đăng ký') : t('login.otpSent', 'OTP đăng nhập đã gửi đến')} ${challenge.email}`}
                description={`${t('login.expires', 'Hết hạn lúc')} ${new Date(challenge.expiresAt).toLocaleTimeString('vi-VN')}`}
              />
              {now >= Date.parse(challenge.expiresAt) && (
                <Alert
                  type="warning"
                  title={t(
                    'login.expired',
                    'Mã đã hết hạn. Vui lòng gửi lại OTP.',
                  )}
                />
              )}
              <Form.Item
                name="code"
                label="OTP"
                rules={[
                  {
                    required: true,
                    pattern: /^\d{6}$/,
                    message: t('login.code', 'Nhập đúng 6 chữ số'),
                  },
                ]}
              >
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </Form.Item>
              <Button
                disabled={busy || remaining > 0 || locked > 0}
                onClick={() =>
                  run(async () =>
                    acceptChallenge(
                      await authService.resend(challenge.challengeId),
                    ),
                  )
                }
              >
                {t('login.resend', 'Gửi lại mã')}
                {remaining > 0 && ` (${remaining}s)`}
              </Button>
              <Button
                type="link"
                disabled={busy}
                onClick={() => {
                  setChallenge(undefined);
                  setError(undefined);
                  form.resetFields(['code', 'password']);
                }}
              >
                {t('login.back', 'Đổi tài khoản / quay lại')}
              </Button>
            </Space>
          )}
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
}
