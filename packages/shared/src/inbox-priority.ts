export type InboxPriorityInput = {
  checkInDate?: string | null;
  conversationStatus?: string | null;
  lastMessageBody: string;
  waitingMinutes?: number | null;
};

export type InboxPriorityLevel = "high" | "low" | "medium" | "urgent";

export type InboxPriorityResult = {
  label: "Alta" | "Baja" | "Media" | "Urgente";
  level: InboxPriorityLevel;
  reasons: string[];
  score: number;
};

const urgentKeywords = [
  "no puedo entrar",
  "cerradura",
  "codigo",
  "código",
  "locked",
  "lock",
  "check-in",
  "check in",
  "llegamos tarde",
  "cancelar",
  "cancel",
];

const operationalKeywords = [
  "agua",
  "caldera",
  "aire",
  "aire acondicionado",
  "ruido",
  "fuga",
  "damage",
  "broken",
  "mantenimiento",
];

function hoursUntil(dateValue: string | null | undefined) {
  if (!dateValue) {
    return null;
  }

  const time = new Date(dateValue).getTime();

  if (Number.isNaN(time)) {
    return null;
  }

  return (time - Date.now()) / 3_600_000;
}

function hasKeyword(message: string, keywords: string[]) {
  const normalized = message.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function resultFor(score: number, reasons: string[]): InboxPriorityResult {
  if (score >= 85) {
    return { label: "Urgente", level: "urgent", reasons, score };
  }

  if (score >= 65) {
    return { label: "Alta", level: "high", reasons, score };
  }

  if (score >= 35) {
    return { label: "Media", level: "medium", reasons, score };
  }

  return { label: "Baja", level: "low", reasons, score };
}

export function classifyInboxPriority(
  input: InboxPriorityInput,
): InboxPriorityResult {
  let score = 20;
  const reasons: string[] = [];
  const status = input.conversationStatus ?? "open";
  const waitingMinutes = Math.max(0, input.waitingMinutes ?? 0);
  const checkInHours = hoursUntil(input.checkInDate);

  if (["open", "pending_team"].includes(status)) {
    score += 25;
    reasons.push("Pendiente de respuesta del equipo.");
  }

  if (waitingMinutes >= 60) {
    score += 20;
    reasons.push("Lleva mas de una hora sin respuesta.");
  } else if (waitingMinutes >= 15) {
    score += 10;
    reasons.push("Supera el SLA inicial de 15 minutos.");
  }

  if (checkInHours !== null && checkInHours >= 0 && checkInHours <= 24) {
    score += 25;
    reasons.push("Check-in dentro de las proximas 24 horas.");
  }

  if (hasKeyword(input.lastMessageBody, urgentKeywords)) {
    score += 25;
    reasons.push("Mensaje relacionado con acceso, llegada o cancelacion.");
  }

  if (hasKeyword(input.lastMessageBody, operationalKeywords)) {
    score += 15;
    reasons.push("Mensaje con posible impacto operativo o mantenimiento.");
  }

  return resultFor(
    Math.min(score, 100),
    reasons.length ? reasons : ["Sin senales criticas detectadas."],
  );
}
