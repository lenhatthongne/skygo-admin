import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { FareInput, Flight, FlightInput } from './types';

dayjs.extend(utc);
dayjs.extend(timezone);
export const vietnamDate = (value: string) =>
  dayjs(value).tz('Asia/Ho_Chi_Minh');
export const vietnamInstant = (value: Dayjs) =>
  dayjs
    .tz(value.format('YYYY-MM-DD HH:mm:ss'), 'Asia/Ho_Chi_Minh')
    .toISOString();
export const farePayload = (value: FareInput): FareInput => ({
  classCode: value.classCode,
  baseFare: value.baseFare,
  taxFee: value.taxFee,
  childRatePct: value.childRatePct,
  infantRatePct: value.infantRatePct,
  infantFee: value.infantFee,
  cabinBaggageKg: value.cabinBaggageKg,
  checkedBaggageKg: value.checkedBaggageKg,
  refundable: value.refundable,
  cancelFee: value.cancelFee,
  totalSeats: value.totalSeats,
});
export type FlightValues = Omit<FlightInput, 'departureAt' | 'arrivalAt'> & {
  departureAt: Dayjs;
  arrivalAt: Dayjs;
};
export const flightValues = (flight: Flight): FlightValues => ({
  flightNumber: flight.flightNumber,
  airlineCode: flight.airline.code,
  originCode: flight.origin,
  destinationCode: flight.destination,
  departureAt: vietnamDate(flight.departureAt),
  arrivalAt: vietnamDate(flight.arrivalAt),
  status: flight.status,
  fareClasses: flight.fareClasses.map(farePayload),
});
export const flightPayload = (values: FlightValues): FlightInput => ({
  flightNumber: values.flightNumber,
  airlineCode: values.airlineCode,
  originCode: values.originCode,
  destinationCode: values.destinationCode,
  departureAt: vietnamInstant(values.departureAt),
  arrivalAt: vietnamInstant(values.arrivalAt),
  status: values.status,
  fareClasses: values.fareClasses.map(farePayload),
});
