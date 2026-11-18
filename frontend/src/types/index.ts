export type ProviderId = 'bookmyshow' | 'district';

export type ShowtimeStatus = 'available' | 'filling_fast' | 'almost_full' | 'sold_out';

export type EventStatus = 'success' | 'warning' | 'error';

export type DeliveryStatus = 'delivered' | 'retrying' | 'failed';

export interface MovieTarget {
  id: string;
  title: string;
  director: string;
  universe: string;
  releaseDate: string;        // "December 17, 2026"
  targetDateIso: string;      // "2026-12-17"
  targetCity: string;         // "Hyderabad"
  synopsis: string;
  targetWindow: {
    name: string;             // "Midnight Premiere Window"
    start: string;            // "12:00 AM"
    end: string;              // "04:59 AM"
    start24: string;          // "00:00"
    end24: string;            // "04:59"
  };
  supportedFormats: string[]; // ["IMAX 3D", "4DX 3D", "ScreenX", "Dolby Atmos 2D"]
  supportedLanguages: string[]; // ["English", "Telugu", "Hindi"]
  status: 'active_monitoring' | 'shows_detected' | 'paused';
  heroBackdrop: string;
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  shortName: string;
  brandColor: string;
  tagline: string;
  description: string;
  supportedFormats: string[];
  monitoringScope: string;
  defaultPollingSec: number;
  environment: 'Local + Cloud' | 'Local only' | 'Cloud only';
  status: 'idle' | 'checking' | 'active';
}

export interface CinemaShowtime {
  id: string;
  cinemaName: string;
  location: string;
  screenName: string;
  format: string;             // e.g. "IMAX 3D"
  language: string;           // e.g. "English"
  showTime: string;           // "01:15 AM"
  showTime24: string;         // "01:15"
  showDate: string;           // "2026-12-17"
  isMidnight: boolean;        // true if 00:00 <= time <= 04:59
  provider: ProviderId;
  bookingUrl: string | null;  // null or placeholder
  status: ShowtimeStatus;
  detectedAt: string;         // ISO timestamp
  isIllustrative: boolean;    // true for demo cards
}

export interface MonitoringCheck {
  id: string;
  timestamp: string;          // ISO timestamp
  displayTime: string;        // e.g. "20:45:12"
  provider: ProviderId;
  providerName: string;
  targetMovie: string;
  targetDate: string;
  showsFoundCount: number;
  newShowsCount: number;
  httpStatus: number;
  responseTimeMs: number;
  status: EventStatus;
  message: string;
  details?: string;
}

export interface TelegramNotification {
  id: string;
  timestamp: string;
  displayTime: string;
  channelName: string;
  recipientMasked: string;    // e.g. "Telegram Channel (***678)"
  targetMovie: string;
  cinemaName: string;
  showsSummary: string;
  deliveryStatus: DeliveryStatus;
  attempts: number;
  responseTimeMs: number;
  messageContent: string;
  alertType: 'midnight_show' | 'system_heartbeat' | 'retry_warning';
}

export interface DashboardMetrics {
  providersMonitored: number;
  totalChecksLogged: number;
  matchingShowsDetected: number;
  notificationsDelivered: number;
  averageLatencyMs: number;
  uptimePercent: number;
  lastCheckTimestamp: string;
  cloudCronSchedule: string;
  localPollIntervalSec: number;
}
