import type {
  aiActorTypes,
  aiFeedbackValues,
  aiLabelSources,
  aiModelTasks,
  aiPredictionStatuses,
  bookingChannels,
  conversationStatuses,
  incidentStatuses,
  qualityAuditAreas,
  qualityAuditStatuses,
  reservationStatuses,
  severities,
  taskStatuses
} from "./constants";
import type { UserRole } from "./roles";

export type BookingChannel = (typeof bookingChannels)[number];
export type ConversationStatus = (typeof conversationStatuses)[number];
export type ReservationStatus = (typeof reservationStatuses)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type IncidentStatus = (typeof incidentStatuses)[number];
export type Severity = (typeof severities)[number];
export type AiActorType = (typeof aiActorTypes)[number];
export type AiLabelSource = (typeof aiLabelSources)[number];
export type AiModelTask = (typeof aiModelTasks)[number];
export type AiPredictionStatus = (typeof aiPredictionStatuses)[number];
export type AiFeedbackValue = (typeof aiFeedbackValues)[number];
export type QualityAuditArea = (typeof qualityAuditAreas)[number];
export type QualityAuditStatus = (typeof qualityAuditStatuses)[number];

export type PropertyStatus = "draft" | "active" | "paused" | "archived";
export type ListingStatus = "draft" | "published" | "paused" | "sync_error";
export type TaskType = "cleaning" | "maintenance" | "inspection" | "guest_request" | "admin";
export type MessageChannel = "inbox" | "email" | "whatsapp" | "sms" | "airbnb" | "booking" | "vrbo";

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
  trend?: string;
};

export type NavigationItem = {
  label: string;
  href: string;
  roles?: UserRole[];
};
