import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { useAuth } from "@/src/features/auth/auth-provider";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type PushStatus =
  | "demo"
  | "disabled"
  | "granted"
  | "needs_device"
  | "needs_eas_project"
  | "needs_permission"
  | "registered";

type PushRegistrationResult = {
  message: string;
  status: PushStatus;
  token?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

function platformName() {
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
    return Platform.OS;
  }

  return "unknown";
}

async function getCurrentPushStatus(): Promise<PushRegistrationResult> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Modo demo: conecta Supabase para guardar este dispositivo.",
      status: "demo",
    };
  }

  if (!Device.isDevice) {
    return {
      message: "Las push remotas necesitan un dispositivo fisico.",
      status: "needs_device",
    };
  }

  const permissions = await Notifications.getPermissionsAsync();

  if (permissions.status !== "granted") {
    return {
      message: "Permiso pendiente. Activalo para recibir avisos operativos.",
      status: "needs_permission",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "Inicia sesion para asociar este dispositivo.",
      status: "disabled",
    };
  }

  const { data } = await supabase
    .from("mobile_push_tokens")
    .select("expo_push_token,last_seen_at")
    .eq("profile_id", user.id)
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.expo_push_token) {
    return {
      message: "Este dispositivo ya esta registrado para avisos operativos.",
      status: "registered",
      token: data.expo_push_token,
    };
  }

  return {
    message: "Permiso concedido. Falta registrar el token push.",
    status: "granted",
  };
}

async function registerPushToken(): Promise<PushRegistrationResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase para registrar notificaciones push.");
  }

  if (!Device.isDevice) {
    return {
      message: "Usa un movil fisico para registrar push notifications.",
      status: "needs_device",
    };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("operations", {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#d7ff5f",
      name: "Operacion WIAHost",
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  const finalPermissions =
    currentPermissions.status === "granted"
      ? currentPermissions
      : await Notifications.requestPermissionsAsync();

  if (finalPermissions.status !== "granted") {
    return {
      message: "Permiso denegado. Puedes activarlo despues desde ajustes del sistema.",
      status: "needs_permission",
    };
  }

  const projectId = getProjectId();

  if (!projectId) {
    return {
      message: "Permiso listo. Falta configurar EAS projectId para obtener el token Expo.",
      status: "needs_eas_project",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Inicia sesion para registrar este dispositivo.");
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase
    .from("mobile_push_tokens")
    .upsert(
      {
        app_version: Constants.expoConfig?.version ?? null,
        device_name: Device.deviceName ?? Device.modelName ?? null,
        expo_push_token: token.data,
        last_seen_at: new Date().toISOString(),
        platform: platformName(),
        profile_id: user.id,
      },
      { onConflict: "profile_id,expo_push_token" },
    );

  if (error) {
    throw error;
  }

  return {
    message: "Dispositivo registrado. Ya esta preparado para avisos operativos.",
    status: "registered",
    token: token.data,
  };
}

export function usePushNotifications() {
  const { session } = useAuth();
  const statusQuery = useQuery({
    enabled: Boolean(session),
    queryFn: getCurrentPushStatus,
    queryKey: ["mobile-push-status", session?.user.id],
  });
  const registerMutation = useMutation({
    mutationFn: registerPushToken,
    onSuccess: async () => {
      await statusQuery.refetch();
    },
  });

  return {
    isRegistering: registerMutation.isPending,
    register: registerMutation.mutateAsync,
    registration: registerMutation.data,
    registrationError: registerMutation.error,
    status: statusQuery.data,
    statusError: statusQuery.error,
    statusLoading: statusQuery.isLoading,
  };
}
