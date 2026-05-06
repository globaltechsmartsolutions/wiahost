import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(".");
const migrationsDir = resolve(root, "supabase/migrations");
const reportPath = resolve(root, "quality/reports/database-security.json");

function readText(path) {
  return readFileSync(path, "utf8");
}

function addFinding(findings, severity, code, message, target) {
  findings.push({ code, message, severity, target });
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

function matches(source, pattern) {
  return Array.from(source.matchAll(pattern)).map((match) => match[1]);
}

function extractStorageBuckets(source) {
  const buckets = [];
  const insertBlocks = source.matchAll(
    /insert\s+into\s+storage\.buckets[\s\S]*?values\s*([\s\S]*?)on\s+conflict/gi,
  );

  for (const block of insertBlocks) {
    buckets.push(...matches(block[1], /\('([^']+)'\s*,/g));
  }

  return uniqueSorted(buckets);
}

if (!existsSync(migrationsDir)) {
  const report = {
    checkedAt: new Date().toISOString(),
    findings: [
      {
        code: "missing_migrations_dir",
        message: "Supabase migrations directory is missing.",
        severity: "critical",
        target: "supabase/migrations",
      },
    ],
    status: "failed",
  };

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(`Database security audit failed. Report: ${reportPath}`);
  process.exit(1);
}

const migrationFiles = readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();
const sql = migrationFiles
  .map((fileName) => readText(join(migrationsDir, fileName)))
  .join("\n\n");

const publicTables = uniqueSorted(
  matches(sql, /create\s+table\s+public\.([a-z_][a-z0-9_]*)\s*\(/gi),
);
const rlsTables = uniqueSorted(
  matches(
    sql,
    /alter\s+table\s+public\.([a-z_][a-z0-9_]*)\s+enable\s+row\s+level\s+security/gi,
  ),
);
const policyTables = uniqueSorted(
  matches(
    sql,
    /create\s+policy\s+(?:"[^"]+"|'[^']+'|[a-z_][a-z0-9_]*)\s+on\s+public\.([a-z_][a-z0-9_]*)/gi,
  ),
);
const storageBuckets = extractStorageBuckets(sql);
const storagePolicyBuckets = uniqueSorted(
  matches(sql, /bucket_id\s*=\s*'([^']+)'/g),
);

const findings = [];

if (migrationFiles.length === 0) {
  addFinding(
    findings,
    "critical",
    "missing_migrations",
    "No SQL migration files were found.",
    "supabase/migrations",
  );
}

for (const table of publicTables) {
  if (!rlsTables.includes(table)) {
    addFinding(
      findings,
      "critical",
      "table_without_rls",
      `Public table ${table} must enable Row Level Security.`,
      `public.${table}`,
    );
  }

  if (!policyTables.includes(table)) {
    addFinding(
      findings,
      "high",
      "table_without_policy",
      `Public table ${table} has no explicit RLS policy in migrations.`,
      `public.${table}`,
    );
  }
}

for (const bucket of storageBuckets) {
  if (!storagePolicyBuckets.includes(bucket)) {
    addFinding(
      findings,
      "high",
      "bucket_without_policy",
      `Storage bucket ${bucket} has no storage.objects policy in migrations.`,
      `storage.${bucket}`,
    );
  }
}

if (/using\s*\(\s*true\s*\)/i.test(sql)) {
  addFinding(
    findings,
    "medium",
    "broad_policy_detected",
    "At least one policy uses `using (true)`. Review before production.",
    "supabase/migrations",
  );
}

if (
  !/reservations_no_active_date_overlap/i.test(sql) ||
  !/exclude\s+using\s+gist[\s\S]*daterange\s*\(\s*check_in\s*,\s*check_out\s*,\s*'\[\)'\s*\)\s+with\s+&&/i.test(
    sql,
  )
) {
  addFinding(
    findings,
    "critical",
    "missing_reservation_overlap_guard",
    "Reservations need a database-level overlap guard to prevent double bookings for active stays.",
    "public.reservations",
  );
}

const blockingFindings = findings.filter((finding) =>
  ["high", "critical"].includes(finding.severity),
);
const report = {
  checkedAt: new Date().toISOString(),
  coverage: {
    policyTables,
    publicTables,
    rlsTables,
    storageBuckets,
    storagePolicyBuckets,
  },
  findings,
  migrationFiles,
  recommendation:
    blockingFindings.length > 0
      ? "review_database_security"
      : "approve_database_security_gate",
  status: blockingFindings.length > 0 ? "failed" : "passed",
  summary:
    blockingFindings.length > 0
      ? `Database security audit found ${blockingFindings.length} blocking issue(s).`
      : "Database security audit passed with RLS and storage policies detected.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (blockingFindings.length > 0) {
  console.error(`${report.summary} Report: ${reportPath}`);
  process.exit(1);
}

console.log(`${report.summary} Report: ${reportPath}`);
