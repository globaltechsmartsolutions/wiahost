export type TemplateContext = Record<
  string,
  string | number | null | undefined
>;

export type RenderTemplateOptions = {
  fallback?: string;
};

export type RenderedTemplate = {
  missingVariables: string[];
  rendered: string;
  usedVariables: string[];
};

export const supportedTemplateVariables = [
  "guest_name",
  "property_name",
  "checkin_date",
  "checkout_date",
  "access_code",
  "house_rules",
  "support_phone",
] as const;

export const templatePreviewContext: TemplateContext = {
  access_code: "4826",
  checkin_date: "29 abr 2026",
  checkout_date: "03 may 2026",
  guest_name: "Sofia Martin",
  house_rules: "sin fiestas, silencio desde las 23:00",
  property_name: "Atico Gran Via Sky",
  support_phone: "+34 600 000 000",
};

function normalizeVariableName(variableName: string) {
  return variableName.trim().toLowerCase();
}

export function extractTemplateVariables(template: string) {
  const matches = template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);

  return Array.from(
    new Set(Array.from(matches, (match) => normalizeVariableName(match[1]))),
  );
}

export function renderMessageTemplate(
  template: string,
  context: TemplateContext,
  options: RenderTemplateOptions = {},
): RenderedTemplate {
  const usedVariables: string[] = [];
  const missingVariables: string[] = [];
  const fallback = options.fallback;

  const rendered = template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (placeholder, variableName: string) => {
      const normalizedVariable = normalizeVariableName(variableName);
      const value = context[normalizedVariable];

      if (!usedVariables.includes(normalizedVariable)) {
        usedVariables.push(normalizedVariable);
      }

      if (value === undefined || value === null || value === "") {
        if (!missingVariables.includes(normalizedVariable)) {
          missingVariables.push(normalizedVariable);
        }

        return fallback ?? placeholder;
      }

      return String(value);
    },
  );

  return {
    missingVariables,
    rendered,
    usedVariables,
  };
}
