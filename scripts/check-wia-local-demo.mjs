import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/wia-local-demo.json");
const args = process.argv.slice(2);

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length).trim() || fallback;
  }

  const index = args.indexOf(name);

  if (index >= 0 && args[index + 1]) {
    return args[index + 1].trim() || fallback;
  }

  return fallback;
}

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        const rawValue = valueParts.join("=").trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");

        return [key.trim(), value];
      }),
  );
}

function fail(message, details = {}) {
  const report = {
    checkedAt: new Date().toISOString(),
    details,
    message,
    status: "failed",
  };

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(`${message} Report: ${reportPath}`);
  process.exit(1);
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text.slice(0, 300) };
  }

  return {
    payload,
    status: response.status,
  };
}

const wiaEnvPath = resolve(
  root,
  argValue("--wia-env", "../WIA/.env"),
);
const wiaEnv = parseEnvFile(wiaEnvPath);
const wiaBaseUrl = (
  process.env.WIA_LOCAL_URL ??
  argValue("--wia-url", `http://localhost:${wiaEnv.PORT || "5500"}`)
).replace(/\/+$/, "");
const wiahostBaseUrl = (
  process.env.WIAHOST_LOCAL_URL ??
  argValue("--wiahost-url", wiaEnv.WIAHOST_BASE_URL || "http://localhost:3002")
).replace(/\/+$/, "");
const partnerId =
  process.env.WIAHOST_PARTNER_ID ??
  wiaEnv.WIAHOST_PARTNER_ID ??
  "worldinstitutionalassets";
const partnerKey =
  process.env.WIAHOST_PARTNER_API_KEY ?? wiaEnv.WIAHOST_PARTNER_API_KEY ?? "";

if (!partnerKey) {
  fail(`Missing WIAHOST_PARTNER_API_KEY in ${wiaEnvPath}.`);
}

const checkIn = argValue("--check-in", "2032-06-10");
const checkOut = argValue("--check-out", "2032-06-13");
const guests = argValue("--guests", "2");
const idempotencyKey = `wia-local-demo-${Date.now().toString(36)}`;

const directListings = await requestJson(
  `${wiahostBaseUrl}/api/public/v1/listings?partner=${encodeURIComponent(partnerId)}`,
);

if (directListings.status !== 401) {
  fail("WIAHost public API should reject requests without the partner key.", {
    directListingsStatus: directListings.status,
  });
}

const wiaSearch = await requestJson(
  `${wiaBaseUrl}/api/hostaway/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
);

if (
  wiaSearch.status !== 200 ||
  wiaSearch.payload?.ok !== true ||
  wiaSearch.payload?.provider !== "wiahost" ||
  Number(wiaSearch.payload?.total ?? 0) < 1
) {
  fail("WIA local did not return WIAHost availability through its backend.", {
    status: wiaSearch.status,
    total: wiaSearch.payload?.total,
    provider: wiaSearch.payload?.provider,
  });
}

const inquiry = await requestJson(`${wiahostBaseUrl}/api/public/v1/inquiries`, {
  body: JSON.stringify({
    checkIn,
    checkOut,
    consent: true,
    guestEmail: `${idempotencyKey}@example.com`,
    guestFullName: "Prueba Demo Local WIA",
    guestPhone: "+34 600 000 000",
    guestsCount: Number(guests),
    message: "Solicitud creada por el check local WIA -> WIAHost.",
    partner: partnerId,
    slug: "enjoy-your-vacation-by-the-sea",
  }),
  headers: {
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    "x-wiahost-partner-key": partnerKey,
  },
  method: "POST",
});

if (
  ![200, 201].includes(inquiry.status) ||
  inquiry.payload?.ok !== true ||
  inquiry.payload?.authMode !== "partner_app"
) {
  fail("Partner API inquiry creation failed in local demo mode.", {
    authMode: inquiry.payload?.authMode,
    status: inquiry.status,
  });
}

const status = await requestJson(
  `${wiahostBaseUrl}/api/public/v1/reservations/${encodeURIComponent(idempotencyKey)}?partner=${encodeURIComponent(partnerId)}`,
  {
    headers: {
      "x-wiahost-partner-key": partnerKey,
    },
  },
);

if (
  status.status !== 200 ||
  status.payload?.ok !== true ||
  status.payload?.data?.status !== "inquiry"
) {
  fail("Partner API status lookup failed in local demo mode.", {
    reservationStatus: status.payload?.data?.status,
    status: status.status,
  });
}

const report = {
  checkedAt: new Date().toISOString(),
  createdInquiry: {
    externalId: idempotencyKey,
    reservationId: inquiry.payload?.data?.reservationId ?? null,
    status: inquiry.payload?.data?.status ?? null,
  },
  partnerId,
  results: {
    directWithoutKey: directListings.status,
    partnerAuthMode: inquiry.payload?.authMode,
    statusLookup: status.payload?.data?.status,
    wiaSearchTotal: wiaSearch.payload?.total,
  },
  status: "passed",
  summary:
    "WIA local is connected to WIAHost local through an active partner app key.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log("WIA local demo check passed.");
console.log(`- WIA search returned ${wiaSearch.payload.total} WIAHost listing(s).`);
console.log("- WIAHost public API rejects missing partner keys.");
console.log("- Partner API created an inquiry and returned status inquiry.");
console.log(`Report: ${reportPath}`);
