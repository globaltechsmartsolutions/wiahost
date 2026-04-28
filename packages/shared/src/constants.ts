export const appName = "WIAHost";

export const bookingChannels = [
  "direct",
  "airbnb",
  "booking",
  "vrbo",
  "expedia",
  "google_vacation_rentals",
  "manual",
] as const;

export const messageChannels = [
  "inbox",
  "email",
  "whatsapp",
  "sms",
  "airbnb",
  "booking",
  "vrbo",
] as const;

export const automationTriggers = [
  "reservation_confirmed",
  "checkin_24h",
  "checkin_1h",
  "checkout_time",
  "cleaning_completed",
  "message_unanswered",
  "noise_alert",
  "cancellation",
  "low_review",
] as const;

export const reservationStatuses = [
  "inquiry",
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const;

export const taskStatuses = [
  "open",
  "scheduled",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
] as const;

export const incidentStatuses = [
  "open",
  "investigating",
  "resolved",
  "charged",
  "cancelled",
] as const;

export const severities = ["low", "medium", "high", "critical"] as const;

export const aiActorTypes = ["user", "system", "automation", "model"] as const;

export const aiLabelSources = ["human", "rule", "model", "import"] as const;

export const aiModelTasks = [
  "message_priority",
  "message_summary",
  "task_priority",
  "incident_risk",
  "pricing_recommendation",
  "occupancy_forecast",
  "anomaly_detection",
  "visual_audit",
  "functional_audit",
  "document_extraction",
  "other",
] as const;

export const aiPredictionStatuses = [
  "draft",
  "suggested",
  "accepted",
  "rejected",
  "expired",
  "superseded",
] as const;

export const aiFeedbackValues = [
  "accepted",
  "edited",
  "rejected",
  "ignored",
  "resolved",
  "failed",
] as const;

export const qualityAuditAreas = [
  "visual",
  "functional",
  "accessibility",
  "performance",
  "security",
  "copy",
  "other",
] as const;

export const qualityAuditStatuses = [
  "open",
  "accepted",
  "resolved",
  "ignored",
] as const;
