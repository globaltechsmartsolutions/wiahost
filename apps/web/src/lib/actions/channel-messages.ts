"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { channelInboundMessageSchema } from "@wiahost/shared";

import {
  ingestChannelMessage,
  OperationMutationError,
} from "@/lib/services/operations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectWithError(message: string): never {
  redirect(`/inbox?error=${encodeURIComponent(message)}`);
}

async function requireInboxContext() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para recibir mensajes.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
}

function inboundMessageInputFromForm(formData: FormData) {
  return {
    body: formData.get("body"),
    channel: formData.get("channel"),
    externalMessageId: formData.get("externalMessageId"),
    guestEmail: formData.get("guestEmail"),
    guestFullName: formData.get("guestFullName"),
    guestPhone: formData.get("guestPhone"),
    propertyId: formData.get("propertyId"),
    reservationId: formData.get("reservationId"),
  };
}

export async function ingestChannelMessageAction(formData: FormData) {
  const parsed = channelInboundMessageSchema.safeParse(
    inboundMessageInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Mensaje entrante no valido.",
    );
  }

  const { supabase, userId } = await requireInboxContext();

  try {
    await ingestChannelMessage(supabase, parsed.data, userId);
  } catch (error) {
    if (error instanceof OperationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido normalizar el mensaje entrante.");
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/distribution");
  redirect("/inbox?received=1");
}
