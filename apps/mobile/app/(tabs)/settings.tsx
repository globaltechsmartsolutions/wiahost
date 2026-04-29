import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, SectionTitle, StatusBadge } from "@/src/components/cards";
import { PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/auth-provider";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";

export default function SettingsScreen() {
  const { profile, session, signOut } = useAuth();

  return (
    <Screen
      subtitle="Perfil, sesion y estado de conexion de la app movil."
      title="Ajustes"
    >
      <Card>
        <SectionTitle helper="La sesion es compartida con Supabase Auth.">
          Cuenta
        </SectionTitle>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name ?? session?.user.email ?? "W").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>
              {profile?.full_name ?? session?.user.email ?? "Modo demo"}
            </Text>
            <Text style={styles.meta}>
              {profile?.role ?? "Sin rol activo"} ·{" "}
              {isSupabaseConfigured() ? "Supabase configurado" : "Demo local"}
            </Text>
          </View>
        </View>
        <StatusBadge
          label={session ? "Sesion activa" : isSupabaseConfigured() ? "Sin sesion" : "Demo"}
        />
      </Card>

      <Card>
        <SectionTitle helper="Variables necesarias en apps/mobile/.env.">
          Conexion
        </SectionTitle>
        <Text style={styles.meta}>
          EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY conectan esta app al mismo backend que la web.
        </Text>
      </Card>

      <View style={styles.actions}>
        {session ? (
          <PrimaryButton
            onPress={() => {
              void signOut();
            }}
          >
            Cerrar sesion
          </PrimaryButton>
        ) : (
          <>
            <PrimaryButton onPress={() => router.push("/login")}>Entrar</PrimaryButton>
            <PrimaryButton
              onPress={() => router.push("/register")}
              variant="secondary"
            >
              Crear cuenta
            </PrimaryButton>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  name: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
});
