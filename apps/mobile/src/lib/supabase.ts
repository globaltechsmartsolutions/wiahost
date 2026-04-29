import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@wiahost/database";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return (
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes("replace_with")
  );
}

const memoryStorage = {
  getItem: async () => null,
  removeItem: async () => undefined,
  setItem: async () => undefined,
};

const authStorage =
  typeof window === "undefined" ? memoryStorage : AsyncStorage;

export const supabase = createClient<Database>(
  isSupabaseConfigured() ? supabaseUrl : "https://example.supabase.co",
  isSupabaseConfigured() ? supabaseAnonKey : "demo-anon-key",
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: authStorage,
    },
  },
);
