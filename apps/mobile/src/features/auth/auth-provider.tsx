import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@wiahost/database";
import type { UserRole } from "@wiahost/shared";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type SignUpInput = {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
};

type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function profileFromUser(user: User): Profile {
  return {
    avatar_url: null,
    created_at: user.created_at,
    full_name:
      typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : user.email ?? "Usuario WIAHost",
    id: user.id,
    phone: null,
    role:
      typeof user.user_metadata.role === "string"
        ? (user.user_metadata.role as UserRole)
        : "operator",
    updated_at: user.updated_at ?? user.created_at,
  } satisfies Profile;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const refreshProfile = useCallback(async () => {
    if (!isConfigured) {
      setProfile(null);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(error || !data ? profileFromUser(user) : data);
  }, [isConfigured]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!isConfigured) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(currentSession);
      if (currentSession?.user) {
        await refreshProfile();
      }
      setIsLoading(false);
    }

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [isConfigured, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      isLoading,
      profile,
      refreshProfile,
      session,
      signIn: async (email, password) => {
        if (!isConfigured) {
          throw new Error("Configura Supabase en apps/mobile/.env para iniciar sesion.");
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        if (!isConfigured) {
          setSession(null);
          setProfile(null);
          return;
        }

        await supabase.auth.signOut();
      },
      signUp: async ({ email, fullName, password, role }) => {
        if (!isConfigured) {
          throw new Error("Configura Supabase en apps/mobile/.env para crear cuentas.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (error) {
          throw error;
        }
      },
      user: session?.user ?? null,
    }),
    [isConfigured, isLoading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
