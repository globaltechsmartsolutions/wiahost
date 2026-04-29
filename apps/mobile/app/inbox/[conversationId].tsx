import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema, type MessageInput } from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle, StatusBadge } from "@/src/components/cards";
import { Field, PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";

async function sendMessage(input: MessageInput) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase en apps/mobile/.env para responder.");
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

  await supabase
    .from("conversations")
    .update({
      last_message_at: sentAt,
      status: "pending_guest",
    })
    .eq("id", input.conversationId);
}

export default function InboxDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const thread = data?.inbox.find((item) => item.id === conversationId);
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
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No hemos podido enviar el mensaje.",
      );
    }
  });

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Mensaje priorizado para responder sin perder contexto."
      title={thread?.guest ?? "Conversacion"}
    >
      {thread ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{thread.guest}</Text>
                <Text style={styles.meta}>
                  {thread.property} - {thread.channel}
                </Text>
              </View>
              <StatusBadge label={thread.status} />
            </View>
          </Card>
          <Card>
            <SectionTitle helper={`Tiempo visible: ${thread.waiting}`}>
              Ultimo mensaje
            </SectionTitle>
            <Text style={styles.message}>{thread.message}</Text>
          </Card>
          <Card>
            <SectionTitle helper="La respuesta se guarda como mensaje outbound.">
              Responder
            </SectionTitle>
            {!isSupabaseConfigured() ? (
              <Text style={styles.meta}>
                Conecta Supabase para enviar respuestas reales desde mobile.
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
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
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
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
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
