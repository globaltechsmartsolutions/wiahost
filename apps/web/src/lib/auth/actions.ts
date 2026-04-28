"use server";

import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "@wiahost/shared";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getSafeNextPath(formData: FormData) {
  const nextPath = getString(formData, "next");

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=Supabase%20no%20esta%20configurado.%20Copia%20.env.example%20a%20apps/web/.env.local.");
  }

  const parsed = loginSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos invalidos.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent("No se ha podido iniciar sesion. Revisa el email y la contrasena.")}`);
  }

  redirect(getSafeNextPath(formData));
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/register?error=Supabase%20no%20esta%20configurado.%20Copia%20.env.example%20a%20apps/web/.env.local.");
  }

  const parsed = registerSchema.safeParse({
    fullName: getString(formData, "fullName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    role: getString(formData, "role") || "operator",
  });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos invalidos.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent("No se ha podido crear la cuenta. Revisa la configuracion de Supabase.")}`);
  }

  if (!data.session) {
    redirect("/login?success=Cuenta%20creada.%20Revisa%20tu%20email%20si%20Supabase%20pide%20confirmacion.");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
