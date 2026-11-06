import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type { FlightValues } from '@/skygo/flightForm';
import { farePayload, flightPayload, flightValues } from '@/skygo/flightForm';
import { flightService } from '@/skygo/service';
import type { Airline, Airport, Fare, FareInput, Flight } from '@/skygo/types';
import {
  ApiError,
  applyFieldErrors,
  FilterActions,
  money,
  PagedTable,
  required,
  Status,
  statusOptions,
  time,
  usePaged,
  useText,
} from '@/skygo/ui';

const fareCodes = ['ECO_SAVER', 'ECO_FLEX', 'BUSINESS'].map((value) => ({
  value,
  label: value,
}));
const fareNumbers: {
  name: keyof FareInput;
  label: string;
  max: number;
  min?: number;
}[] = [
  { name: 'baseFare', label: 'Giá vé (VND)', max: 1e9 },
  { name: 'taxFee', label: 'Thuế (VND)', max: 1e9 },
  { name: 'childRatePct', label: 'Tỷ lệ trẻ em (%)', max: 100 },
  { name: 'infantRatePct', label: 'Tỷ lệ em bé (%)', max: 100 },
  { name: 'infantFee', label: 'Phí em bé (VND)', max: 1e9 },
  { name: 'cabinBaggageKg', label: 'Hành lý xách tay (kg)', max: 100 },
  { name: 'checkedBaggageKg', label: 'Hành lý ký gửi (kg)', max: 100 },
  { name: 'cancelFee', label: 'Phí hủy (VND)', max: 1e9 },
  { name: 'totalSeats', label: 'Tổng ghế', max: 1000, min: 1 },
];
function FareFields({
  prefix = [],
  locked = false,
  occupied = 0,
}: {
  prefix?: number[];
  locked?: boolean;
  occupied?: number;
}) {
  const t = useText();
  return (
    <>
      <Form.Item
        label={t('fare.class', 'Hạng vé')}
        name={[...prefix, 'classCode']}
        rules={required}
      >
        <Select disabled={locked} options={fareCodes} />
      </Form.Item>
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
        {fareNumbers.map((field) => (
          <Form.Item
            key={field.name}
            label={t(`fare.${field.name}`, field.label)}
            name={[...prefix, field.name]}
            rules={[
              {
                required: true,
                type: 'number',
                min:
                  field.name === 'totalSeats'
                    ? Math.max(1, occupied)
                    : (field.min ?? 0),
                max: field.max,
                message: `${t('range', 'Giá trị trong khoảng')} ${field.name === 'totalSeats' ? Math.max(1, occupied) : 0}–${field.max}`,
              },
            ]}
          >
            <InputNumber
              min={
                field.name === 'totalSeats'
                  ? Math.max(1, occupied)
                  : (field.min ?? 0)
              }
              max={field.max}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        ))}
      </div>
      <Form.Item
        label={t('fare.refundable', 'Cho phép hoàn vé')}
        name={[...prefix, 'refundable']}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </>
  );
}
export default function Flights() {
  const t = useText();
  const { message } = App.useApp();
  const initialStatus =
    new URLSearchParams(window.location.search).get('status') ?? undefined;
  const state = usePaged(
    flightService.list,
    initialStatus ? { status: initialStatus } : undefined,
  );
  const [filters] = Form.useForm();
  const [form] = Form.useForm<FlightValues>();
  const [fareForm] = Form.useForm<FareInput>();
  const [catalog, setCatalog] = useState<{
    airports: Airport[];
    airlines: Airline[];
  }>();
  const [catalogError, setCatalogError] = useState<unknown>();
  const [catalogVersion, setCatalogVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setCatalogError(undefined);
    Promise.all([flightService.airports(), flightService.airlines()])
      .then(([airports, airlines]) => {
        if (active) setCatalog({ airports, airlines });
      })
      .catch((e) => {
        if (active) setCatalogError(e);
      });
    return () => {
      active = false;
    };
  }, [catalogVersion]);
  const [editor, setEditor] = useState(false);
  const [detail, setDetail] = useState<Flight>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const readId = useRef(0);
  const [fare, setFare] = useState<{ flightId: number; value: Fare }>();
  const [fareError, setFareError] = useState<unknown>();
  const close = () => {
    if (pending.current) return;
    ++readId.current;
    setEditor(false);
    setLoading(false);
  };
  const open = async (id?: number) => {
    const requestId = ++readId.current;
    setEditor(true);
    setDetail(undefined);
    setError(undefined);
    form.resetFields();
    form.setFieldsValue({
      status: 'SCHEDULED',
      fareClasses: [{ refundable: false } as FareInput],
    });
    if (id === undefined) return;
    setLoading(true);
    try {
      const next = await flightService.detail(id);
      if (requestId === readId.current) {
        setDetail(next);
        form.setFieldsValue(flightValues(next));
      }
    } catch (e) {
      if (requestId === readId.current) setError(e);
    } finally {
      if (requestId === readId.current) setLoading(false);
    }
  };
  const [editingId, setEditingId] = useState<number>();
  const openEditor = (id?: number) => {
    setEditingId(id);
    void open(id);
  };
  const openFare = async (flightId: number, fareId: number) => {
    const id = ++readId.current;
    setLoading(true);
    setFareError(undefined);
    try {
      const next = await flightService.detail(flightId);
      const value = next.fareClasses.find((x) => x.id === fareId);
      if (id === readId.current && value) {
        setFare({ flightId, value });
        fareForm.resetFields();
        fareForm.setFieldsValue(farePayload(value));
      }
    } catch (e) {
      setFareError(e);
    } finally {
      if (id === readId.current) setLoading(false);
    }
  };
  const airportOptions = catalog?.airports.map((x) => ({
    value: x.code,
    label: `${x.code} — ${x.city} (${x.name})`,
  }));
  return (
    <PageContainer
      title={t('flights.title', 'Chuyến bay và hạng vé')}
      extra={
        <Button type="primary" disabled={!catalog} onClick={() => openEditor()}>
          {t('flights.create', 'Tạo chuyến bay')}
        </Button>
      }
    >
      <ApiError
        error={catalogError}
        retry={() => setCatalogVersion((x) => x + 1)}
      />
      <ApiError error={fareError && !fare ? fareError : undefined} />
      <Card>
        <Form
          form={filters}
          layout="inline"
          initialValues={{ status: initialStatus }}
          onFinish={(values) =>
            state.filter({ ...values, date: values.date?.format('YYYY-MM-DD') })
          }
        >
          <Form.Item name="flightNumber" label={t('flight.number', 'Số hiệu')}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="status" label={t('status', 'Trạng thái')}>
            <Select
              allowClear
              style={{ width: 160 }}
              options={statusOptions(['SCHEDULED', 'DELAYED', 'CANCELLED'])}
            />
          </Form.Item>
          <Form.Item name="from" label={t('flight.from', 'Đi')}>
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              style={{ width: 200 }}
              options={airportOptions}
            />
          </Form.Item>
          <Form.Item name="to" label={t('flight.to', 'Đến')}>
            <Select
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              style={{ width: 200 }}
              options={airportOptions}
            />
          </Form.Item>
          <Form.Item name="date" label={t('flight.date', 'Ngày bay (VN)')}>
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="sort" label={t('sort', 'Sắp xếp')}>
            <Select
              allowClear
              style={{ width: 170 }}
              options={[
                {
                  value: 'departure',
                  label: t('flight.departure', 'Giờ khởi hành'),
                },
                { value: 'flightNumber', label: t('flight.number', 'Số hiệu') },
              ]}
            />
          </Form.Item>
          <FilterActions
            reset={() => {
              filters.resetFields();
              state.filter({});
            }}
          />
        </Form>
        <PagedTable<Flight>
          state={state}
          rowKey="flightId"
          columns={[
            { title: t('flight.number', 'Số hiệu'), dataIndex: 'flightNumber' },
            {
              title: t('flight.airline', 'Hãng bay'),
              render: (_, r) => r.airline.name,
            },
            {
              title: t('flight.route', 'Hành trình'),
              render: (_, r) => `${r.origin} → ${r.destination}`,
            },
            {
              title: t('flight.departure', 'Khởi hành (VN)'),
              render: (_, r) => time(r.departureAt),
            },
            {
              title: t('flight.arrival', 'Đến (VN)'),
              render: (_, r) => time(r.arrivalAt),
            },
            {
              title: t('status', 'Trạng thái'),
              render: (_, r) => <Status value={r.status} />,
            },
            {
              title: t('actions', 'Thao tác'),
              render: (_, r) => (
                <Button
                  disabled={loading}
                  onClick={() => openEditor(r.flightId)}
                >
                  {t('edit', 'Chi tiết / chỉnh sửa')}
                </Button>
              ),
            },
          ]}
          expandable={{
            expandedRowRender: (row) => (
              <Space orientation="vertical">
                {row.fareClasses.map((f) => (
                  <Space key={f.id} wrap>
                    <strong>{f.classCode}</strong>
                    <span>
                      {money(f.baseFare)} + {money(f.taxFee)} {t('tax', 'thuế')}
                    </span>
                    <span>
                      {f.seatsAvailable}/{f.totalSeats}{' '}
                      {t('fare.available', 'ghế trống')}
                    </span>
                    <Button
                      disabled={loading}
                      onClick={() => openFare(row.flightId, f.id)}
                    >
                      {t('fare.edit', 'Sửa hạng vé')}
                    </Button>
                  </Space>
                ))}
              </Space>
            ),
          }}
        />
      </Card>
      <Modal
        open={editor}
        title={
          editingId === undefined
            ? t('flights.create', 'Tạo chuyến bay')
            : t('flights.edit', 'Chi tiết / sửa chuyến bay')
        }
        width={960}
        loading={loading}
        confirmLoading={saving}
        onCancel={close}
        onOk={() => form.submit()}
        okButtonProps={{
          disabled: !catalog || loading || (editingId !== undefined && !detail),
        }}
        cancelButtonProps={{ disabled: saving }}
        destroyOnHidden
      >
        <ApiError
          error={error}
          retry={
            editingId !== undefined && !detail
              ? () => {
                  void open(editingId);
                }
              : undefined
          }
        />
        <Form
          form={form}
          layout="vertical"
          disabled={saving}
          onFinish={async (values) => {
            if (pending.current) return;
            pending.current = true;
            setSaving(true);
            setError(undefined);
            try {
              const payload = flightPayload(values);
              if (editingId === undefined) await flightService.create(payload);
              else await flightService.update(editingId, payload);
              setEditor(false);
              state.reload();
              message.success(t('saved', 'Đã lưu thành công'));
            } catch (e) {
              setError(e);
              applyFieldErrors(form, e);
            } finally {
              pending.current = false;
              setSaving(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="flightNumber"
              label={t('flight.number', 'Số hiệu')}
              rules={[...required, { max: 10 }]}
            >
              <Input maxLength={10} />
            </Form.Item>
            <Form.Item
              name="airlineCode"
              label={t('flight.airline', 'Hãng bay')}
              rules={required}
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                options={catalog?.airlines.map((x) => ({
                  value: x.code,
                  label: `${x.code} — ${x.name}`,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="originCode"
              label={t('flight.origin', 'Sân bay đi')}
              rules={required}
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                options={airportOptions}
              />
            </Form.Item>
            <Form.Item
              name="destinationCode"
              label={t('flight.destination', 'Sân bay đến')}
              dependencies={['originCode']}
              rules={[
                ...required,
                ({ getFieldValue }) => ({
                  validator: (_, value) =>
                    value !== getFieldValue('originCode')
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            t(
                              'flight.different',
                              'Sân bay đi và đến phải khác nhau',
                            ),
                          ),
                        ),
                }),
              ]}
            >
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                options={airportOptions}
              />
            </Form.Item>
            <Form.Item
              name="departureAt"
              label={t('flight.departure', 'Khởi hành (giờ Việt Nam)')}
              rules={required}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" />
            </Form.Item>
            <Form.Item
              name="arrivalAt"
              label={t('flight.arrival', 'Đến (giờ Việt Nam)')}
              dependencies={['departureAt']}
              rules={[
                ...required,
                ({ getFieldValue }) => ({
                  validator: (_, value) =>
                    !value || value.isAfter(getFieldValue('departureAt'))
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            t('flight.after', 'Giờ đến phải sau giờ khởi hành'),
                          ),
                        ),
                }),
              ]}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" />
            </Form.Item>
            <Form.Item
              name="status"
              label={t('status', 'Trạng thái')}
              rules={required}
            >
              <Select
                options={statusOptions(['SCHEDULED', 'DELAYED', 'CANCELLED'])}
              />
            </Form.Item>
          </div>
          <Form.List
            name="fareClasses"
            rules={[
              {
                validator: async (_, values: FareInput[]) => {
                  if (!values?.length || values.length > 3)
                    throw new Error(
                      t('fare.count', 'Phải có từ 1 đến 3 hạng vé'),
                    );
                  if (
                    new Set(values.map((x) => x?.classCode)).size !==
                    values.length
                  )
                    throw new Error(
                      t('fare.unique', 'Hạng vé không được trùng'),
                    );
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <Space orientation="vertical" style={{ width: '100%' }}>
                {fields.map((field) => {
                  const existing = detail?.fareClasses[field.name];
                  return (
                    <Card
                      key={field.key}
                      title={`${t('fare.title', 'Hạng vé')} ${field.name + 1}`}
                      extra={
                        !existing && (
                          <Button
                            danger
                            disabled={saving}
                            onClick={() => remove(field.name)}
                          >
                            {t('remove', 'Bỏ hạng')}
                          </Button>
                        )
                      }
                    >
                      <FareFields
                        prefix={[field.name]}
                        locked={Boolean(existing)}
                        occupied={
                          existing
                            ? existing.totalSeats - existing.seatsAvailable
                            : 0
                        }
                      />
                    </Card>
                  );
                })}
                <Form.ErrorList errors={errors} />
                <Button
                  disabled={fields.length >= 3 || saving}
                  onClick={() => add({ refundable: false })}
                >
                  {t('fare.add', 'Thêm hạng vé')}
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
      <Modal
        open={Boolean(fare)}
        title={t('fare.edit', 'Sửa hạng vé')}
        width={800}
        confirmLoading={saving}
        onCancel={() => {
          if (!pending.current) setFare(undefined);
        }}
        onOk={() => fareForm.submit()}
        cancelButtonProps={{ disabled: saving }}
        destroyOnHidden
      >
        <ApiError error={fareError} />
        <Form
          form={fareForm}
          layout="vertical"
          disabled={saving}
          onFinish={async (values) => {
            if (!fare || pending.current) return;
            pending.current = true;
            setSaving(true);
            setFareError(undefined);
            try {
              await flightService.fare(fare.value.id, farePayload(values));
              setFare(undefined);
              state.reload();
              message.success(t('saved', 'Đã lưu thành công'));
            } catch (e) {
              setFareError(e);
              applyFieldErrors(fareForm, e);
            } finally {
              pending.current = false;
              setSaving(false);
            }
          }}
        >
          <FareFields
            locked
            occupied={
              fare ? fare.value.totalSeats - fare.value.seatsAvailable : 0
            }
          />
        </Form>
      </Modal>
    </PageContainer>
  );
}
