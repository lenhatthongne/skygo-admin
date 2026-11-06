export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  emailVerified: boolean;
}
export interface Challenge {
  challengeId: string;
  email: string;
  purpose: 'LOGIN' | 'REGISTER';
  expiresAt: string;
  resendAfterSeconds: number;
}
export interface Auth {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
  user: User;
}
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}
export interface Airline {
  code: string;
  name: string;
  logoUrl: string | null;
}
export interface Airport {
  code: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}
export type FlightStatus = 'SCHEDULED' | 'DELAYED' | 'CANCELLED';
export type FareCode = 'ECO_SAVER' | 'ECO_FLEX' | 'BUSINESS';
export interface FareInput {
  classCode: FareCode;
  baseFare: number;
  taxFee: number;
  childRatePct: number;
  infantRatePct: number;
  infantFee: number;
  cabinBaggageKg: number;
  checkedBaggageKg: number;
  refundable: boolean;
  cancelFee: number;
  totalSeats: number;
}
export interface Fare extends FareInput {
  id: number;
  seatsAvailable: number;
}
export interface FlightInput {
  flightNumber: string;
  airlineCode: string;
  originCode: string;
  destinationCode: string;
  departureAt: string;
  arrivalAt: string;
  status: FlightStatus;
  fareClasses: FareInput[];
}
export interface Flight {
  flightId: number;
  flightNumber: string;
  airline: Airline;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  status: FlightStatus;
  lowestAdultFare: number | null;
  availableFareClasses: string[];
  fareClasses: Fare[];
}
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'EXPIRED';
export interface Cancellation {
  id: number;
  bookingId: string;
  reason: string;
  cancelFeeTotal: number;
  refundAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy: number | null;
  processedAt: string | null;
  createdAt: string;
}
export interface Passenger {
  id: number;
  type: 'ADT' | 'CHD' | 'INF';
  title: string;
  fullName: string;
  dateOfBirth: string;
  accompanyingAdultId: number | null;
  fareAmount: number;
  taxAmount: number;
}
export interface Booking {
  id: string;
  bookingCode: string | null;
  status: BookingStatus;
  seatCount: number;
  totalAmount: number;
  holdExpiresAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  contact: { email: string; phone: string };
  flight: Flight;
  fareClass: Fare;
  priceSnapshot: {
    baseFare: number;
    taxFee: number;
    childRatePct: number;
    infantRatePct: number;
    infantFee: number;
    lines: {
      type: 'ADT' | 'CHD' | 'INF';
      count: number;
      fare: number;
      tax: number;
    }[];
    totalFare: number;
    totalTax: number;
    total: number;
    refundable: boolean;
    cancelFee: number;
  };
  passengers: Passenger[];
  cancellationRequests: Cancellation[];
}
export interface FaqInput {
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  visible: boolean;
}
export interface Faq extends FaqInput {
  id: number;
}
export interface Support {
  id: number;
  subject: string;
  content: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastSender: 'CUSTOMER' | 'ADMIN' | null;
  lastMessageAt: string | null;
  /** Customer messages the admins have not opened yet. */
  unread: number;
  customerName: string | null;
}
export interface SupportMessage {
  id: number;
  sender: 'CUSTOMER' | 'ADMIN';
  body: string | null;
  /** Path under the API base URL; fetch it with the admin token. */
  imageUrl: string | null;
  createdAt: string;
}
export interface SupportThread {
  request: Support;
  messages: SupportMessage[];
}
export interface SupportReply {
  adminReply: string;
  status: 'ANSWERED' | 'CLOSED';
}
export interface TicketResult {
  valid: boolean;
  bookingCode: string | null;
  status: string;
  flightNumber: string | null;
  departureAt: string | null;
  passengerCount: number;
}
export interface Problem {
  status?: number;
  code?: string;
  detail?: string;
  title?: string;
  errors?: { field: string; message: string }[];
  retryAfterSeconds?: number;
}

export type AccountStatus = 'ACTIVE' | 'UNVERIFIED' | 'LOCKED' | 'BLOCKED';
export interface Account extends User {
  status: AccountStatus;
  adminBlocked: boolean;
  blockReason: string | null;
  blockedAt: string | null;
  blockedBy: number | null;
  lockedUntil: string | null;
  otpLockedUntil: string | null;
  createdAt: string;
}

export interface ReminderSettings {
  enabled: boolean;
  /** Minutes before departure, largest first. */
  leadMinutes: number[];
}
export type ReminderStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED';
export interface ReminderLogItem {
  id: string;
  bookingId: string;
  bookingCode: string | null;
  originCode: string;
  destinationCode: string;
  /** null: sent by hand from this page. */
  leadMinutes: number | null;
  status: ReminderStatus;
  note: string | null;
  createdAt: string;
  sentAt: string | null;
}
export interface ReminderSendResult {
  queued: boolean;
  deviceCount: number;
}

export interface Overview {
  bookingsToday: number;
  revenueToday: number;
  pendingPayment: number;
  cancelRequests: number;
  supportWaiting: number;
  supportUnread: number;
  flightsToday: number;
  flightsDelayed: number;
  customers: number;
  newCustomers7Days: number;
  last7Days: { date: string; revenue: number; bookings: number }[];
  recent: {
    id: string;
    bookingCode: string | null;
    status: string;
    totalAmount: number;
    route: string;
    createdAt: string;
  }[];
}
