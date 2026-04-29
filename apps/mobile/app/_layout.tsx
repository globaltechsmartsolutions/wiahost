import "react-native-reanimated";

import { ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/src/features/auth/auth-provider";
import { queryClient } from "@/src/lib/query-client";
import { colors } from "@/src/lib/theme";

export {
  ErrorBoundary,
} from "expo-router";

const navigationTheme = {
  colors: {
    background: colors.background,
    border: colors.border,
    card: colors.card,
    notification: colors.lime,
    primary: colors.ink,
    text: colors.ink,
  },
  dark: false,
  fonts: {
    bold: {
      fontFamily: "System",
      fontWeight: "700" as const,
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "900" as const,
    },
    medium: {
      fontFamily: "System",
      fontWeight: "600" as const,
    },
    regular: {
      fontFamily: "System",
      fontWeight: "400" as const,
    },
  },
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerBackTitle: "Volver",
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.ink, fontWeight: "900" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "Iniciar sesion" }} />
            <Stack.Screen name="register" options={{ title: "Crear cuenta" }} />
            <Stack.Screen name="+not-found" options={{ title: "No encontrado" }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
