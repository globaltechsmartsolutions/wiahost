import type { OwnerStatementInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class OwnerStatementMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new OwnerStatementMutationError(code, message);
}

function optionalValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toStatementPayload(input: OwnerStatementInput) {
  return {
    cleaning_costs: input.cleaningCosts,
    gross_revenue: input.grossRevenue,
    maintenance_costs: input.maintenanceCosts,
    net_payout: input.netPayout,
    owner_account_id: input.ownerAccountId,
    period_end: input.periodEnd,
    period_start: input.periodStart,
    platform_fees: input.platformFees,
    property_id: optionalValue(input.propertyId),
    status: input.status,
  };
}

export async function createOwnerStatement(
  supabase: SupabaseServerClient,
  input: OwnerStatementInput,
) {
  const { data, error } = await supabase
    .from("owner_statements")
    .insert(toStatementPayload(input))
    .select("id,status,net_payout")
    .single();

  if (error || !data) {
    mutationError(
      "owner_statement_create_failed",
      "No se ha podido crear la liquidacion.",
    );
  }

  return data;
}

export async function updateOwnerStatement(
  supabase: SupabaseServerClient,
  statementId: string,
  input: OwnerStatementInput,
) {
  const { data, error } = await supabase
    .from("owner_statements")
    .update(toStatementPayload(input))
    .eq("id", statementId)
    .select("id,status,net_payout")
    .single();

  if (error || !data) {
    mutationError(
      "owner_statement_update_failed",
      "No se ha podido actualizar la liquidacion.",
    );
  }

  return data;
}

export async function deleteOwnerStatement(
  supabase: SupabaseServerClient,
  statementId: string,
) {
  const { data, error } = await supabase
    .from("owner_statements")
    .delete()
    .eq("id", statementId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "owner_statement_delete_failed",
      "No se ha podido eliminar la liquidacion.",
    );
  }

  return data;
}
