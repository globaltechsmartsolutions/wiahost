export const appName = "WIAHost";

export const bookingChannels = [
  "direct",
  "airbnb",
  "booking",
  "vrbo",
  "expedia",
  "google_vacation_rentals",
  "manual"
] as const;

export const reservationStatuses = [
  "inquiry",
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show"
] as const;

export const taskStatuses = ["open", "scheduled", "in_progress", "blocked", "done", "cancelled"] as const;

export const incidentStatuses = ["open", "investigating", "resolved", "charged", "cancelled"] as const;
