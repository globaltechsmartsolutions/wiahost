import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(".");
const args = process.argv.slice(2);
const allowRemote = args.includes("--allow-remote");
const partnerId = argValue("--partner", "worldinstitutionalassets");
const partnerKey = argValue("--partner-key", "");

const listings = [
  {
    hostawayId: "419018",
    propertyId: "21000000-0000-0000-0000-000000419018",
    listingId: "22000000-0000-0000-0000-000000419018",
    slug: "enjoy-your-vacation-by-the-sea",
    name: "Enjoy your vacation by the sea",
    description:
      "Villa costera migrada desde Hostaway para pruebas locales de World Institutional Assets en WIAHost.",
    addressLine: "Platja del Rei",
    city: "Platja del Rei",
    province: "Mallorca",
    country: "Spain",
    bedrooms: 5,
    bathrooms: 3,
    maxGuests: 10,
    basePrice: 264,
    amenities: ["Internet", "Wireless", "Air conditioning", "Kitchen"],
    thumbnailUrl:
      "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/165265-419018-5pZoo8CWW-mjGrAQSdw6Uh4GLsy31AUglciOkgkUXYQ-69386ef8365bf",
  },
  {
    hostawayId: "419019",
    propertyId: "21000000-0000-0000-0000-000000419019",
    listingId: "22000000-0000-0000-0000-000000419019",
    slug: "chalet-madrid-aeropuerto",
    name: "Chalet vanguardista de diseño en Madrid aeropuerto",
    description:
      "Chalet de diseno en Madrid migrado desde Hostaway para probar la web de WIA contra WIAHost local.",
    addressLine: "Madrid aeropuerto",
    city: "Madrid",
    province: "Madrid",
    country: "Spain",
    bedrooms: 2,
    bathrooms: 3,
    maxGuests: 6,
    basePrice: 1100,
    amenities: ["Internet", "Wireless", "Air conditioning", "Kitchen"],
    thumbnailUrl:
      "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/165265-419019-UUbxzXSCNxoXnbOrQXSePop0HaagpNRXaFSQaoXHN-A-69386ecb22090",
  },
  {
    hostawayId: "419020",
    propertyId: "21000000-0000-0000-0000-000000419020",
    listingId: "22000000-0000-0000-0000-000000419020",
    slug: "exclusive-villa-north-madrid",
    name: "Exclusive Villa North Madrid",
    description:
      "Villa exclusiva al norte de Madrid migrada desde Hostaway para validar disponibilidad y reserva directa.",
    addressLine: "Fuente el Saz de Jarama",
    city: "Fuente el Saz de Jarama",
    province: "Madrid",
    country: "Spain",
    bedrooms: 5,
    bathrooms: 2,
    maxGuests: 10,
    basePrice: 800,
    amenities: ["Internet", "Wireless", "Air conditioning", "Swimming pool"],
    thumbnailUrl:
      "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/165265-419020-UTgvE--BuE807WItlPvU2ZS8TTVD--kbwk7rkjHzvYcRY-69388c643c570",
  },
];

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

function readEnv() {
  const files = [
    resolve(root, ".env.local"),
    resolve(root, "apps/web/.env.local"),
    resolve(root, ".env"),
  ];
  const fileEnv = files.reduce(
    (env, file) => ({
      ...env,
      ...parseEnvFile(file),
    }),
    {},
  );

  return {
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      fileEnv.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      fileEnv.NEXT_PUBLIC_SUPABASE_URL,
  };
}

function assertLocalSupabase(url) {
  if (allowRemote) {
    return;
  }

  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(url)) {
    console.error(
      "Refusing to seed a non-local Supabase URL. Re-run with --allow-remote only when intentionally seeding staging.",
    );
    process.exit(1);
  }
}

function requireEnv(name, value) {
  if (!value || /replace[_-]with|your_|changeme|todo/i.test(value)) {
    console.error(`${name} is required to seed WIA listings.`);
    process.exit(1);
  }

  return value;
}

function hashApiKey(key) {
  return createHash("sha256").update(key).digest("hex");
}

async function upsertOrFail(client, table, rows) {
  const { error } = await client.from(table).upsert(rows, { onConflict: "id" });

  if (error) {
    console.error(`Failed to upsert ${table}: ${error.message}`);
    process.exit(1);
  }
}

async function upsertPartnerApp(client) {
  const key = partnerKey || process.env.WIAHOST_PARTNER_API_KEY || "";

  if (!key) {
    return;
  }

  const { error } = await client.from("partner_apps").upsert(
    {
      allowed_origins: ["http://localhost:5500"],
      display_name: "World Institutional Assets",
      key_hash: hashApiKey(key),
      key_prefix: key.slice(0, 10),
      notes:
        "Partner app local para validar que cualquier web puede conectarse a WIAHost con credencial persistida.",
      partner_id: partnerId,
      redirect_urls: ["http://localhost:5500"],
      scopes: ["listings", "availability", "inquiries", "reservations:read"],
      status: "active",
    },
    { onConflict: "partner_id" },
  );

  if (error) {
    console.error(`Failed to upsert partner_apps: ${error.message}`);
    process.exit(1);
  }
}

const env = readEnv();
const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl);
const supabaseServiceRoleKey = requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  env.supabaseServiceRoleKey,
);

assertLocalSupabase(supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const properties = listings.map((listing) => ({
  id: listing.propertyId,
  name: listing.name,
  internal_name: `WIA-HOSTAWAY-${listing.hostawayId}`,
  description: listing.description,
  address_line: listing.addressLine,
  city: listing.city,
  province: listing.province,
  country: listing.country,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  max_guests: listing.maxGuests,
  base_price: listing.basePrice,
  cleaning_fee: 0,
  status: "active",
  house_rules:
    "Solicitud sujeta a validacion del equipo de World Institutional Assets.",
  amenities: listing.amenities,
}));

const propertyListings = listings.map((listing) => ({
  id: listing.listingId,
  property_id: listing.propertyId,
  channel: "direct",
  external_listing_id: listing.hostawayId,
  public_slug: listing.slug,
  title: listing.name,
  status: "published",
  channel_url: `https://worldinstitutionalassets.holidayfuture.com/listing/${listing.hostawayId}`,
  sync_enabled: false,
  sync_notes: JSON.stringify({
    amenities: listing.amenities,
    externalListingId: listing.hostawayId,
    migrationSource: "hostaway",
    notes:
      "Migrado localmente desde Hostaway para validar World Institutional Assets en WIAHost.",
    partnerId,
    thumbnailUrl: listing.thumbnailUrl,
  }),
}));

await upsertOrFail(supabase, "properties", properties);
await upsertOrFail(supabase, "property_listings", propertyListings);
await upsertPartnerApp(supabase);

console.log(
  `Seeded ${listings.length} WIA listings for partner "${partnerId}" into ${supabaseUrl}.`,
);

if (partnerKey || process.env.WIAHOST_PARTNER_API_KEY) {
  console.log(`Seeded partner app "${partnerId}" with a hashed local key.`);
}

console.table(
  listings.map((listing) => ({
    hostawayId: listing.hostawayId,
    maxGuests: listing.maxGuests,
    price: listing.basePrice,
    slug: listing.slug,
  })),
);
