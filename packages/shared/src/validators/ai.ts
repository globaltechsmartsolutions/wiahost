import { z } from "zod";
import {
  aiActorTypes,
  aiFeedbackValues,
  aiLabelSources,
  aiModelTasks,
  aiPredictionStatuses,
  qualityAuditAreas,
  qualityAuditStatuses,
  severities
} from "../constants";

const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const operationalEventSchema = z.object({
  actorProfileId: z.uuid().optional(),
  actorType: z.enum(aiActorTypes).default("user"),
  eventName: z.string().trim().min(3).max(120),
  entityType: z.string().trim().min(2).max(80),
  entityId: z.uuid().optional(),
  propertyId: z.uuid().optional(),
  reservationId: z.uuid().optional(),
  conversationId: z.uuid().optional(),
  taskId: z.uuid().optional(),
  incidentId: z.uuid().optional(),
  source: z.string().trim().min(2).max(80).default("app"),
  occurredAt: z.iso.datetime().optional(),
  metadata: metadataSchema
});

export const messageLabelSchema = z
  .object({
    conversationId: z.uuid(),
    messageId: z.uuid().optional(),
    labeledBy: z.uuid().optional(),
    source: z.enum(aiLabelSources).default("human"),
    category: z.string().trim().min(2).max(80).optional(),
    urgency: z.enum(severities).optional(),
    sentiment: z.enum(["positive", "neutral", "negative", "mixed", "unknown"]).optional(),
    intent: z.string().trim().min(2).max(120).optional(),
    language: z.string().trim().min(2).max(12).optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    rationale: z.string().trim().max(1000).optional(),
    metadata: metadataSchema
  })
  .refine(
    (value) => Boolean(value.category || value.urgency || value.sentiment || value.intent || value.language),
    "La etiqueta debe incluir al menos categoria, urgencia, sentimiento, intencion o idioma."
  );

export const modelPredictionSchema = z.object({
  task: z.enum(aiModelTasks),
  modelName: z.string().trim().min(2).max(120),
  modelVersion: z.string().trim().min(1).max(80),
  entityType: z.string().trim().min(2).max(80),
  entityId: z.uuid().optional(),
  propertyId: z.uuid().optional(),
  reservationId: z.uuid().optional(),
  conversationId: z.uuid().optional(),
  taskId: z.uuid().optional(),
  incidentId: z.uuid().optional(),
  inputHash: z.string().trim().min(12).max(160),
  inputSummary: metadataSchema,
  output: metadataSchema,
  explanation: metadataSchema,
  confidence: z.coerce.number().min(0).max(1).optional(),
  status: z.enum(aiPredictionStatuses).default("suggested"),
  createdBy: z.uuid().optional()
});

export const modelPredictionReviewSchema = z.object({
  status: z.enum(aiPredictionStatuses),
  reviewedBy: z.uuid().optional(),
  feedback: z.enum(aiFeedbackValues).optional()
});

export const aiAuditLogSchema = z.object({
  predictionId: z.uuid().optional(),
  actorProfileId: z.uuid().optional(),
  action: z.string().trim().min(3).max(120),
  provider: z.string().trim().min(2).max(80).optional(),
  modelName: z.string().trim().min(2).max(120).optional(),
  promptHash: z.string().trim().min(12).max(160).optional(),
  promptSummary: metadataSchema,
  responseSummary: metadataSchema,
  riskLevel: z.enum(severities).default("low"),
  containsPersonalData: z.boolean().default(false),
  approvedBy: z.uuid().optional(),
  metadata: metadataSchema
});

export const qualityAuditMemorySchema = z.object({
  area: z.enum(qualityAuditAreas),
  route: z.string().trim().max(240).optional(),
  component: z.string().trim().max(120).optional(),
  findingHash: z.string().trim().min(12).max(160),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(2000),
  severity: z.enum(severities).default("medium"),
  status: z.enum(qualityAuditStatuses).default("open"),
  metadata: metadataSchema
});

export type OperationalEventInput = z.infer<typeof operationalEventSchema>;
export type MessageLabelInput = z.infer<typeof messageLabelSchema>;
export type ModelPredictionInput = z.infer<typeof modelPredictionSchema>;
export type AiAuditLogInput = z.infer<typeof aiAuditLogSchema>;
export type QualityAuditMemoryInput = z.infer<typeof qualityAuditMemorySchema>;
