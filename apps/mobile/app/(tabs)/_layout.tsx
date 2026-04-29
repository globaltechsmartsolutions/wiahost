import { Redirect, Tabs } from "expo-router";
import {
  Building2,
  CalendarDays,
  Home,
  Inbox,
  Settings,
  TriangleAlert,
} from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/features/auth/auth-provider";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";

function LoadingGate() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.background,
        flex: 1,
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

export default function TabLayout() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <LoadingGate />;
  }

  if (isSupabaseConfigured() && !session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 78,
          paddingBottom: 14,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: "Activos",
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Reservas",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Riesgo",
          tabBarIcon: ({ color, size }) => (
            <TriangleAlert color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
