import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Tag,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { faqService } from '@/skygo/service';
import type { Faq, FaqInput } from '@/skygo/types';
import {
  ApiError,
  applyFieldErrors,
  PagedTable,
  required,
  usePaged,
  useText,
} from '@/skygo/ui';
import { useDetail } from '@/skygo/useDetail';
export default function Faqs() {
  const t = useText();
  const { modal, message } = App.useApp();
  const state = usePaged(faqService.list);
  const detail = useDetail(faqService.detail);
  const [form] = Form.useForm<FaqInput>();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const pending = useRef(false);
  useEffect(() => {
    if (detail.data) form.setFieldsValue(detail.data);
  }, [detail.data, form]);
  const edit = async (nextId?: number) => {
    setId(nextId);
    setError(undefined);
    form.resetFields();
    if (nextId === undefined) {
      detail.close();
      form.setFieldsValue({ visible: false, sortOrder: 0 });
      setOpen(true);
    } else {
      setOpen(true);
      const value = await detail.show(nextId);
      if (value) form.setFieldsValue(value);
    }
  };
  const close = () => {
    if (!pending.current) {
      detail.close();
      setOpen(false);
    }
  };
  const remove = (row: Faq) =>
    modal.confirm({
      title: t('faq.deleteConfirm', 'Xóa FAQ này?'),
      content: row.question,
      okText: t('delete', 'Xóa'),
      cancelText: t('cancel', 'Quay lại'),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError(undefined);
        try {
          await faqService.remove(row.id);
          state.reload();
          message.success(t('faq.deleted', 'Đã xóa FAQ'));
        } catch (e) {
          setError(e);
          throw e;
        } finally {
          pending.current = false;
          setBusy(false);
        }
      },
    });
  return (
    <PageContainer
      title={t('faq.title', 'Quản lý FAQ')}
      extra={
        <Button type="primary" disabled={busy} onClick={() => edit()}>
          {t('faq.create', 'Tạo FAQ')}
        </Button>
      }
    >
      <Card>
        {!open && <ApiError error={error} />}
        <PagedTable<Faq>
          state={state}
          rowKey="id"
          columns={[
            { title: t('faq.category', 'Danh mục'), dataIndex: 'category' },
            { title: t('faq.question', 'Câu hỏi'), dataIndex: 'question' },
            { title: t('faq.sortOrder', 'Thứ tự'), dataIndex: 'sortOrder' },
            {
              title: t('faq.visible', 'Hiển thị'),
              render: (_, r) => (
                <Tag color={r.visible ? 'green' : 'default'}>
                  {r.visible ? t('yes', 'Có') : t('no', 'Không')}
                </Tag>
              ),
            },
            {
              title: t('actions', 'Thao tác'),
              render: (_, r) => (
                <Space>
                  <Button disabled={busy} onClick={() => edit(r.id)}>
                    {t('edit', 'Chi tiết / sửa')}
                  </Button>
                  <Button danger disabled={busy} onClick={() => remove(r)}>
                    {t('delete', 'Xóa')}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        open={open}
        loading={id !== undefined && detail.loading}
        title={
          id === undefined
            ? t('faq.create', 'Tạo FAQ')
            : t('faq.edit', 'Chi tiết / sửa FAQ')
        }
        width={720}
        onCancel={close}
        onOk={() => form.submit()}
        confirmLoading={busy}
        okButtonProps={{ disabled: id !== undefined && !detail.data }}
        cancelButtonProps={{ disabled: busy }}
        destroyOnHidden
      >
        <ApiError error={detail.error} retry={detail.retry} />
        <ApiError error={error} />
        <Form
          form={form}
          layout="vertical"
          disabled={busy}
          onFinish={async (values) => {
            if (pending.current) return;
            pending.current = true;
            setBusy(true);
            setError(undefined);
            const payload: FaqInput = {
              category: values.category,
              question: values.question,
              answer: values.answer,
              sortOrder: values.sortOrder,
              visible: values.visible,
            };
            try {
              if (id === undefined) await faqService.create(payload);
              else await faqService.update(id, payload);
              setOpen(false);
              detail.close();
              state.reload();
              message.success(t('saved', 'Đã lưu thành công'));
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
            name="category"
            label={t('faq.category', 'Danh mục')}
            rules={[...required, { whitespace: true, max: 50 }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            name="question"
            label={t('faq.question', 'Câu hỏi')}
            rules={[...required, { whitespace: true, max: 1000 }]}
          >
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Form.Item
            name="answer"
            label={t('faq.answer', 'Câu trả lời')}
            rules={[...required, { whitespace: true, max: 10000 }]}
          >
            <Input.TextArea rows={8} maxLength={10000} />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label={t('faq.sortOrder', 'Thứ tự')}
            rules={required}
          >
            <InputNumber min={-2147483648} max={2147483647} precision={0} />
          </Form.Item>
          <Form.Item
            name="visible"
            label={t('faq.visible', 'Hiển thị')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
