import { zodResolver } from "@hookform/resolvers/zod";
import {
  conversationStatuses,
  messageSchema,
  type ConversationStatus,
  type MessageInput,
} from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import {
  Card,
  EmptyState,
  OfflineBanner,
  SectionTitle,
  StatusBadge,
} from "@/src/components/cards";
import { Field, PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import {
  StatusActionGroup,
  type StatusOption,
} from "@/src/components/status-actions";
import { useConversationDetail } from "@/src/hooks/use-conversation-detail";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

const statusLabels: Record<ConversationStatus, string> = {
  archived: "Archivada",
  open: "Abierta",
  pending_guest: "Pendiente huesped",
  pending_team: "Pendiente equipo",
  resolved: "Resuelta",
};

const statusOptions: StatusOption<ConversationStatus>[] =
  conversationStatuses.map((status) => ({
    label: statusLabels[status],
    value: status,
  }));

async function sendMessage(input: MessageInput) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase en apps/mobile/.env para responder.");
  }

  if (!isGuid(input.conversationId)) {
    throw new Error(
      "Este hilo demo es solo lectura. Con Supabase conectado sera editable.",
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sentAt = new Date().toISOString();

  const { error } = await supabase.from("conversation_messages").insert({
    body: input.body,
    channel: input.channel,
    conversation_id: input.conversationId,
    direction: "outbound",
    sender_profile_id: user?.id ?? null,
    sent_at: sentAt,
  });

  if (error) {
    throw error;
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      last_message_at: sentAt,
      status: "pending_guest",
    })
    .eq("id", input.conversationId);

  if (conversationError) {
    throw conversationError;
  }
}

async function updateConversationStatus({
  conversationId,
  status,
}: {
  conversationId: string;
  status: ConversationStatus;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase para actualizar estados desde mobile.");
  }

  if (!isGuid(conversationId)) {
    throw new Error(
      "Este hilo demo es solo lectura. Con datos reales podras cambiarlo.",
    );
  }

  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
}

function normalizeStatus(value: string): ConversationStatus {
  return conversationStatuses.includes(value as ConversationStatus)
    ? (value as ConversationStatus)
    : "open";
}

export default function InboxDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const {
    data: conversation,
    isLoading,
    refetch,
    isRefetching,
  } = useConversationDetail(conversationId);
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<MessageInput>({
    defaultValues: {
      body: "",
      channel: "inbox",
      conversationId: conversationId ?? "",
    },
    resolver: zodResolver(messageSchema) as Resolver<MessageInput>,
  });
  const mutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: async () => {
      reset({
        body: "",
        channel: "inbox",
        conversationId: conversationId ?? "",
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await refetch();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await mutation.mutateAsync({
        ...values,
        conversationId: conversationId ?? values.conversationId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["conversation-detail", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await refetch();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No hemos podido enviar el mensaje.",
      );
    }
  });
  const statusMutation = useMutation({
    mutationFn: updateConversationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversation-detail", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await refetch();
    },
  });
  const currentStatus = conversation
    ? normalizeStatus(conversation.statusValue)
    : "open";
  const canMutateConversation =
    Boolean(conversation) &&
    isSupabaseConfigured() &&
    isGuid(conversation?.id ?? "");

  const changeStatus = async (status: ConversationStatus) => {
    setStatusError(null);

    try {
      await statusMutation.mutateAsync({
        conversationId: conversationId ?? "",
        status,
      });
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "No hemos podido actualizar el estado.",
      );
    }
  };

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Mensaje priorizado para responder sin perder contexto."
      title={conversation?.guest ?? "Conversacion"}
    >
      {conversation ? (
        <>
          {conversation.source === "cache" ? (
            <OfflineBanner cachedAt={conversation.cachedAt} />
          ) : null}
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{conversation.guest}</Text>
                <Text style={styles.meta}>
                  {conversation.property} - {conversation.channel}
                </Text>
              </View>
              <StatusBadge label={conversation.status} />
            </View>
          </Card>
          <Card>
            <SectionTitle
              helper={`Ultima actividad visible: ${conversation.waiting}`}
            >
              Historial
            </SectionTitle>
            {conversation.messages.length ? (
              conversation.messages.map((message) => {
                const outbound = message.direction === "Equipo";

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      outbound && styles.outboundBubble,
                    ]}
                  >
                    <View style={styles.messageMetaRow}>
                      <Text style={styles.messageDirection}>
                        {message.direction}
                      </Text>
                      <Text style={styles.messageTime}>{message.sentAt}</Text>
                    </View>
                    <Text style={styles.message}>{message.body}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.meta}>
                Todavia no hay mensajes en este hilo.
              </Text>
            )}
          </Card>
          <Card>
            <StatusActionGroup
              currentValue={currentStatus}
              disabled={!canMutateConversation}
              helper={
                canMutateConversation
                  ? "Actualiza la bandeja sin salir del movil."
                  : "Solo lectura en modo demo. Conecta Supabase y abre un hilo real para guardar cambios."
              }
              onChange={changeStatus}
              options={statusOptions}
              pendingValue={
                statusMutation.isPending
                  ? (statusMutation.variables?.status ?? null)
                  : null
              }
              title="Estado del hilo"
            />
            {statusError ? (
              <Text style={styles.error}>{statusError}</Text>
            ) : null}
          </Card>
          <Card>
            <SectionTitle helper="La respuesta se guarda como mensaje outbound.">
              Responder
            </SectionTitle>
            {!canMutateConversation ? (
              <Text style={styles.meta}>
                Solo lectura en modo demo. Conecta Supabase para enviar
                respuestas reales desde mobile.
              </Text>
            ) : (
              <>
                <Controller
                  control={control}
                  name="body"
                  render={({ field }) => (
                    <Field
                      error={errors.body?.message}
                      label="Mensaje"
                      multiline
                      numberOfLines={4}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder="Hola, te confirmo las instrucciones..."
                      style={styles.textarea}
                      value={field.value}
                    />
                  )}
                />
                {formError ? (
                  <Text style={styles.error}>{formError}</Text>
                ) : null}
                <PrimaryButton disabled={mutation.isPending} onPress={onSubmit}>
                  {mutation.isPending ? "Enviando..." : "Enviar respuesta"}
                </PrimaryButton>
              </>
            )}
          </Card>
        </>
      ) : (
        <EmptyState title="Conversacion no encontrada">
          No hemos encontrado este hilo en la cache movil.
        </EmptyState>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  message: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  messageBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    maxWidth: "92%",
    padding: 13,
  },
  messageDirection: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  messageMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  messageTime: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  outboundBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#efffe9",
    borderColor: "#bde984",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  textarea: {
    minHeight: 118,
    paddingTop: 14,
    textAlignVertical: "top",
  },
});
