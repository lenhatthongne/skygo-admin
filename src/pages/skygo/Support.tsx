import {
  ArrowLeftOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Empty,
  Image,
  Input,
  Popconfirm,
  Segmented,
  Skeleton,
  Spin,
  Upload,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { errorText } from '@/requestErrorConfig';
import { supportService } from '@/skygo/service';
import {
  subscribeSupportEvents,
  useSupportSocketConnected,
} from '@/skygo/supportSocket';
import type { SupportMessage, Support as SupportRow } from '@/skygo/types';
import { Status, time, useText } from '@/skygo/ui';
import { useStyles } from './Support.style';

// Polling is the fallback: quick while the live connection is down, a safety net while it is up.
const LIST_POLL_MS = 5000;
const THREAD_POLL_MS = 4000;
const LIVE_POLL_MS = 30_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Runs `fn` now and then every `ms` while the tab is visible. */
function usePolling(fn: () => void, ms: number) {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    latest.current();
    const timer = setInterval(() => {
      if (!document.hidden) latest.current();
    }, ms);
    const onVisible = () => {
      if (!document.hidden) latest.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ms]);
}

const clock = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '';

/** A photo of a conversation; the browser cannot send the admin token, so it is fetched as a blob. */
function AuthImage({ path }: { path: string }) {
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    let url: string | undefined;
    supportService
      .image(path)
      .then((blob) => {
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);
  if (failed) return <span>Không tải được ảnh</span>;
  return src ? (
    <Image src={src} width={220} style={{ borderRadius: 12 }} />
  ) : (
    <Skeleton.Image active style={{ width: 220, height: 150 }} />
  );
}

function Thread({
  id,
  onBack,
  onChanged,
}: {
  id: number;
  onBack: () => void;
  onChanged: () => void;
}) {
  const t = useText();
  const { styles, cx } = useStyles();
  const { message } = App.useApp();
  const [request, setRequest] = useState<SupportRow>();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const busy = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const listRef = useRef<HTMLDivElement>(null);

  // A new conversation starts from its first message.
  useEffect(() => {
    lastId.current = 0;
    setMessages([]);
    setRequest(undefined);
    setError(undefined);
    setLoading(true);
    setText('');
    setImage(undefined);
  }, [id]);

  useEffect(() => {
    if (!image) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const merge = useCallback((incoming: SupportMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      const added = incoming.filter((m) => !known.has(m.id));
      return added.length === 0
        ? current
        : [...current, ...added].sort((a, b) => a.id - b.id);
    });
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
  }, []);

  const fetchNew = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const wanted = id;
    try {
      const thread = await supportService.thread(id, lastId.current);
      if (wanted !== id) return;
      setRequest(thread.request);
      if (thread.messages.length > 0) {
        merge(thread.messages);
        onChanged();
      }
      setError(undefined);
    } catch (e) {
      if (lastId.current === 0) setError(e);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [id, merge, onChanged]);

  const live = useSupportSocketConnected();
  usePolling(() => void fetchNew(), live ? LIVE_POLL_MS : THREAD_POLL_MS);
  // The server says this conversation changed: read it now, not at the next poll.
  useEffect(
    () =>
      subscribeSupportEvents((event) => {
        if (event.requestId === id) void fetchNew();
      }),
    [id, fetchNew],
  );

  // Keep the newest message in view unless the admin scrolled up to read.
  useEffect(() => {
    if (stick.current) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const choose = (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      message.warning(t('support.tooLarge', 'Ảnh quá lớn (tối đa 5 MB)'));
      return false;
    }
    setImage(file);
    return false;
  };

  const send = async () => {
    const body = text.trim();
    if ((!body && !image) || sending) return;
    setSending(true);
    try {
      const sent = await supportService.send(id, body, image);
      merge([sent]);
      setText('');
      setImage(undefined);
      stick.current = true;
      void fetchNew();
      onChanged();
    } catch (e) {
      message.error(errorText(e));
    } finally {
      setSending(false);
    }
  };

  if (loading && !request) {
    return (
      <div className={styles.empty}>
        <Spin />
      </div>
    );
  }
  if (error && !request) {
    return (
      <div className={styles.empty}>
        <Alert
          type="error"
          showIcon
          title={errorText(error)}
          action={<Button onClick={() => void fetchNew()}>Thử lại</Button>}
        />
      </div>
    );
  }

  const closed = request?.status === 'CLOSED';
  return (
    <div className={styles.threadPane}>
      <div className={styles.threadHead}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          aria-label="Về danh sách"
          onClick={onBack}
          className={styles.back}
        />
        <div className={styles.headMain}>
          <h3>{request?.customerName ?? `Khách #${id}`}</h3>
          <span>
            {request?.subject} · {time(request?.createdAt)}
          </span>
        </div>
        {request && <Status value={request.status} />}
        {!closed && (
          <Popconfirm
            title={t('support.closeAsk', 'Đóng hội thoại này?')}
            description={t(
              'support.closeHint',
              'Khách nhắn thêm thì hội thoại tự mở lại.',
            )}
            okText={t('support.close', 'Đóng hội thoại')}
            cancelText={t('cancel', 'Hủy')}
            onConfirm={async () => {
              try {
                await supportService.close(id);
                void fetchNew();
                onChanged();
              } catch (e) {
                message.error(errorText(e));
              }
            }}
          >
            <Button icon={<CloseCircleOutlined />}>
              {t('support.close', 'Đóng hội thoại')}
            </Button>
          </Popconfirm>
        )}
      </div>

      <div
        className={styles.messages}
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {messages.map((m) => {
          const mine = m.sender === 'ADMIN';
          return (
            <div
              key={m.id}
              className={cx(
                styles.row,
                mine ? styles.rowMine : styles.rowTheirs,
              )}
            >
              {m.imageUrl && <AuthImage path={m.imageUrl} />}
              {m.body && (
                <div
                  className={cx(
                    styles.bubble,
                    mine ? styles.bubbleMine : styles.bubbleTheirs,
                  )}
                >
                  {m.body}
                </div>
              )}
              <span className={styles.meta}>
                {mine ? 'Bạn' : (request?.customerName ?? 'Khách')} ·{' '}
                {clock(m.createdAt)}
              </span>
            </div>
          );
        })}
        {closed && (
          <div className={styles.note}>
            {t('support.closedNote', 'Hội thoại đã đóng.')}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={styles.composer}>
        {preview && (
          <div className={styles.attachment}>
            <img src={preview} alt="" />
            <span>{image?.name}</span>
            <Button size="small" onClick={() => setImage(undefined)}>
              {t('support.removeImage', 'Bỏ ảnh')}
            </Button>
          </div>
        )}
        <div className={styles.composerLine}>
          <Upload
            accept="image/png,image/jpeg,image/webp"
            showUploadList={false}
            beforeUpload={choose}
          >
            <Button
              icon={<PaperClipOutlined />}
              aria-label={t('support.attach', 'Đính kèm ảnh')}
            />
          </Upload>
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 5 }}
            maxLength={2000}
            placeholder={t(
              'support.placeholder',
              'Trả lời khách hàng (Enter để gửi, Shift+Enter xuống dòng)',
            )}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            onPaste={(e) => {
              const file = Array.from(e.clipboardData.files).find((f) =>
                f.type.startsWith('image/'),
              );
              if (file) {
                e.preventDefault();
                choose(file);
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            disabled={!text.trim() && !image}
            onClick={() => void send()}
          >
            {t('support.send', 'Gửi')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Support() {
  const t = useText();
  const { styles, cx } = useStyles();
  const [filter, setFilter] = useState<string>('ALL');
  const [rows, setRows] = useState<SupportRow[]>();
  const [error, setError] = useState<unknown>();
  const [selected, setSelected] = useState<number>();
  const asked = useRef(0);

  const load = useCallback(async () => {
    const mine = ++asked.current;
    try {
      const page = await supportService.list({
        status: filter === 'ALL' ? undefined : filter,
        page: 0,
        size: 50,
      });
      if (mine !== asked.current) return;
      setRows(page.content);
      setError(undefined);
    } catch (e) {
      if (mine === asked.current) setError(e);
    }
  }, [filter]);

  const live = useSupportSocketConnected();
  usePolling(() => void load(), live ? LIVE_POLL_MS : LIST_POLL_MS);
  // Any change (new message, closed conversation) refreshes the list at once.
  useEffect(() => subscribeSupportEvents(() => void load()), [load]);

  const waiting = rows?.filter((r) => r.status === 'OPEN').length ?? 0;
  const unread = rows?.reduce((sum, r) => sum + r.unread, 0) ?? 0;

  return (
    <PageContainer
      title={t('support.title', 'Hộp thư hỗ trợ')}
      subTitle={t(
        'support.subtitle',
        'Trò chuyện với khách hàng, tự cập nhật tin mới',
      )}
    >
      <div className={styles.heading}>
        <Segmented
          value={filter}
          onChange={(v) => {
            setFilter(String(v));
            setRows(undefined);
          }}
          options={[
            { value: 'ALL', label: t('support.all', 'Tất cả') },
            { value: 'OPEN', label: t('support.waiting', 'Chờ trả lời') },
            { value: 'ANSWERED', label: t('support.answered', 'Đã trả lời') },
            { value: 'CLOSED', label: t('support.closed', 'Đã đóng') },
          ]}
        />
        <div className={styles.summary}>
          <Badge
            count={waiting}
            showZero
            color={waiting ? 'orange' : 'green'}
            overflowCount={99}
          />
          <span>{t('support.waitingCount', 'cuộc chờ trả lời')}</span>
          <Badge count={unread} overflowCount={99} />
          <span>{t('support.unreadCount', 'tin chưa đọc')}</span>
        </div>
      </div>

      <div className={styles.inbox}>
        <div
          className={cx(
            styles.listPane,
            selected !== undefined && styles.hiddenOnSmall,
          )}
        >
          <div className={styles.list}>
            {error && !rows ? (
              <Alert
                type="error"
                showIcon
                title={errorText(error)}
                action={<Button onClick={() => void load()}>Thử lại</Button>}
                style={{ margin: 12 }}
              />
            ) : !rows ? (
              <div style={{ padding: 16 }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : rows.length === 0 ? (
              <Empty
                style={{ marginTop: 48 }}
                description={t('support.empty', 'Chưa có hội thoại nào')}
              />
            ) : (
              rows.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={cx(
                    styles.item,
                    selected === r.id && styles.itemActive,
                  )}
                  onClick={() => setSelected(r.id)}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.itemName}>
                      <Avatar size={22} style={{ marginRight: 8 }}>
                        {(r.customerName ?? 'K').charAt(0).toUpperCase()}
                      </Avatar>
                      {r.customerName ?? `Khách #${r.id}`}
                    </span>
                    <span className={styles.itemTime}>
                      {clock(r.lastMessageAt ?? r.createdAt)}
                    </span>
                  </div>
                  <div className={styles.itemSubject}>{r.subject}</div>
                  <div className={styles.itemPreview}>
                    <span
                      className={cx(
                        styles.previewText,
                        r.unread > 0 && styles.unreadText,
                      )}
                    >
                      {r.lastSender === 'ADMIN' ? 'Bạn: ' : ''}
                      {r.lastMessage ?? r.content}
                    </span>
                    {r.unread > 0 ? (
                      <Badge count={r.unread} overflowCount={99} />
                    ) : (
                      <Status value={r.status} />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selected === undefined ? (
          <div className={cx(styles.empty, styles.hiddenOnSmall)}>
            <Empty
              description={t(
                'support.pick',
                'Chọn một hội thoại để xem và trả lời',
              )}
            />
          </div>
        ) : (
          <Thread
            key={selected}
            id={selected}
            onBack={() => setSelected(undefined)}
            onChanged={() => void load()}
          />
        )}
      </div>
    </PageContainer>
  );
}
