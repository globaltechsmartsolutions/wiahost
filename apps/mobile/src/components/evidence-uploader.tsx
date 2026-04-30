import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, SectionTitle } from "@/src/components/cards";
import { PrimaryButton } from "@/src/components/form";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

type EvidenceContext =
  | {
      label: string;
      propertyId: string;
      type: "property";
    }
  | {
      incidentId: string;
      label: string;
      propertyId?: string | null;
      type: "incident";
    }
  | {
      label: string;
      propertyId?: string | null;
      reservationId?: string | null;
      taskId: string;
      type: "task";
    };

type EvidenceDocument = {
  created_at: string;
  id: string;
  mime_type: string | null;
  storage_path: string;
  title: string;
};

type PickSource = "camera" | "library";

const bucketByContext = {
  incident: "incident-attachments",
  property: "property-media",
  task: "reservation-documents",
} as const;

function cleanFilePart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extensionFromMime(mimeType: string | null | undefined) {
  if (mimeType?.includes("png")) {
    return "png";
  }

  if (mimeType?.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

function contextFolder(context: EvidenceContext) {
  if (context.type === "property") {
    return `mobile-evidence/properties/${context.propertyId}`;
  }

  if (context.type === "incident") {
    return `mobile-evidence/incidents/${context.incidentId}`;
  }

  return `mobile-evidence/tasks/${context.taskId}`;
}

function evidenceQueryKey(context: EvidenceContext) {
  const id =
    context.type === "property"
      ? context.propertyId
      : context.type === "incident"
        ? context.incidentId
        : context.taskId;

  return ["mobile-evidence", context.type, id] as const;
}

function buildDocumentPayload({
  context,
  mimeType,
  storagePath,
  title,
  userId,
}: {
  context: EvidenceContext;
  mimeType: string;
  storagePath: string;
  title: string;
  userId: string;
}) {
  return {
    incident_id: context.type === "incident" ? context.incidentId : null,
    mime_type: mimeType,
    owner_profile_id: userId,
    property_id:
      context.type === "property" ? context.propertyId : context.propertyId ?? null,
    reservation_id: context.type === "task" ? context.reservationId ?? null : null,
    storage_path: storagePath,
    title,
  };
}

async function getEvidenceDocuments(
  context: EvidenceContext,
): Promise<EvidenceDocument[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const bucket = bucketByContext[context.type];
  const storagePrefix = `${bucket}/${contextFolder(context)}/`;
  const { data, error } = await supabase
    .from("documents")
    .select("id,title,storage_path,mime_type,created_at")
    .ilike("storage_path", `${storagePrefix}%`)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw error;
  }

  return (data ?? []) as EvidenceDocument[];
}

async function uploadEvidence({
  context,
  source,
}: {
  context: EvidenceContext;
  source: PickSource;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Conecta Supabase para subir evidencias desde mobile.");
  }

  const hasValidContext =
    context.type === "property"
      ? isGuid(context.propertyId)
      : context.type === "incident"
        ? isGuid(context.incidentId)
        : isGuid(context.taskId);

  if (!hasValidContext) {
    throw new Error("Las evidencias solo se guardan sobre registros reales.");
  }

  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Necesitamos permiso para acceder a la camara o galeria.");
  }

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          mediaTypes: ["images"],
          quality: 0.82,
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: false,
          mediaTypes: ["images"],
          quality: 0.82,
        });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "image/jpeg";
  const extension = extensionFromMime(mimeType);
  const fileName = cleanFilePart(asset.fileName ?? `evidencia.${extension}`);
  const bucket = bucketByContext[context.type];
  const path = `${contextFolder(context)}/${Date.now()}-${fileName || `evidencia.${extension}`}`;
  const storagePath = `${bucket}/${path}`;
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Sesion no disponible para registrar la evidencia.");
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const title =
    context.type === "property"
      ? `Foto de ${context.label}`
      : context.type === "incident"
        ? `Evidencia incidencia - ${context.label}`
        : `Evidencia tarea - ${context.label}`;

  const { error: documentError } = await supabase
    .from("documents")
    .insert(
      buildDocumentPayload({
        context,
        mimeType,
        storagePath,
        title,
        userId: userData.user.id,
      }),
    );

  if (documentError) {
    throw documentError;
  }

  return storagePath;
}

async function openEvidence(storagePath: string) {
  const [bucket, ...pathParts] = storagePath.split("/");
  const path = pathParts.join("/");

  if (!bucket || !path) {
    return;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300);

  if (!error && data?.signedUrl) {
    await Linking.openURL(data.signedUrl);
  }
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function EvidenceUploader({
  context,
  disabled,
}: {
  context: EvidenceContext;
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const queryKey = evidenceQueryKey(context);
  const documentsQuery = useQuery({
    enabled: isSupabaseConfigured() && !disabled,
    queryFn: () => getEvidenceDocuments(context),
    queryKey,
  });
  const mutation = useMutation({
    mutationFn: uploadEvidence,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleUpload = async (source: PickSource) => {
    setError(null);

    try {
      await mutation.mutateAsync({ context, source });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No hemos podido subir la evidencia.",
      );
    }
  };

  const documents = documentsQuery.data ?? [];
  const isDisabled = disabled || mutation.isPending || !isSupabaseConfigured();

  return (
    <Card>
      <SectionTitle helper="Fotos operativas sincronizadas con Storage y documentos.">
        Evidencias
      </SectionTitle>

      <View style={styles.actions}>
        <PrimaryButton
          disabled={isDisabled}
          onPress={() => void handleUpload("camera")}
        >
          Camara
        </PrimaryButton>
        <PrimaryButton
          disabled={isDisabled}
          onPress={() => void handleUpload("library")}
          variant="secondary"
        >
          Galeria
        </PrimaryButton>
      </View>

      {!isSupabaseConfigured() ? (
        <Text style={styles.helper}>
          Conecta Supabase para guardar evidencias reales desde el movil.
        </Text>
      ) : null}
      {disabled ? (
        <Text style={styles.helper}>
          Las evidencias se activan sobre registros reales, no en modo demo.
        </Text>
      ) : null}
      {mutation.isPending ? (
        <Text style={styles.helper}>Subiendo evidencia...</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.documentList}>
        {documents.length ? (
          documents.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => void openEvidence(document.storage_path)}
              style={styles.documentItem}
            >
              <View style={styles.documentCopy}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.helper}>
                  {document.mime_type ?? "imagen"} - {shortDate(document.created_at)}
                </Text>
              </View>
              <Text style={styles.openLink}>Abrir</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.helper}>
            Todavia no hay evidencias subidas en este contexto.
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  documentCopy: {
    flex: 1,
    gap: 3,
  },
  documentItem: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12,
  },
  documentList: {
    gap: 8,
  },
  documentTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  openLink: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
  },
});
