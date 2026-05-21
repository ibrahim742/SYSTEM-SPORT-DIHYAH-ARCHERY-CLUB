import fs from "node:fs";

const { Client } = require("pg");
const mysql = require("mysql2/promise");

const tables = [
  "User",
  "Club",
  "Sport",
  "CoachCategory",
  "CoachProfile",
  "SystemSetting",
  "LandingSection",
  "accounts",
  "sessions",
  "verification_tokens",
  "CoachClub",
  "LandingItem",
  "Student",
  "Program",
  "ProgramMaterial",
  "ProgramAssignment",
  "AttendanceSession",
  "AttendanceRecord",
  "CoachScore",
  "TrainingLog",
  "AuditLog",
  "Notification"
];

const tableKeys: Record<string, string[]> = {
  User: ["id"],
  Club: ["id"],
  Sport: ["id"],
  CoachCategory: ["id"],
  CoachProfile: ["id"],
  SystemSetting: ["id"],
  LandingSection: ["id"],
  accounts: ["id"],
  sessions: ["id"],
  verification_tokens: ["identifier", "token"],
  CoachClub: ["coachId", "clubId"],
  LandingItem: ["id"],
  Student: ["id"],
  Program: ["id"],
  ProgramMaterial: ["id"],
  ProgramAssignment: ["id"],
  AttendanceSession: ["id"],
  AttendanceRecord: ["id"],
  CoachScore: ["id"],
  TrainingLog: ["id"],
  AuditLog: ["id"],
  Notification: ["id"]
};

type CheckResult = {
  name: string;
  count: number;
  severity: "error" | "warning";
};

function loadEnvFile() {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function quoteMysql(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}

function quotePg(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function compareCounts(pgClient: any, mysqlConnection: any) {
  console.log("PostgreSQL source coverage:");
  let hasMissingSourceRows = false;

  for (const table of tables) {
    const pgRows = await pgClient.query(`SELECT COUNT(*)::int AS count FROM ${quotePg(table)}`);
    const [mysqlRows] = await mysqlConnection.query(`SELECT COUNT(*) AS count FROM ${quoteMysql(table)}`);
    const pgCount = Number(pgRows.rows[0].count);
    const mysqlCount = Number(mysqlRows[0].count);
    const status = mysqlCount === pgCount ? "OK" : mysqlCount > pgCount ? "EXTRA_OK" : "MISSING";
    if (status === "MISSING") hasMissingSourceRows = true;
    console.log(`- ${table}: postgres=${pgCount} mysql=${mysqlCount} ${status}`);

    const keys = tableKeys[table];
    if (!keys?.length || pgCount === 0) continue;

    const pgKeyRows = await pgClient.query(`SELECT ${keys.map(quotePg).join(", ")} FROM ${quotePg(table)}`);
    const [mysqlKeyRows] = await mysqlConnection.query(`SELECT ${keys.map(quoteMysql).join(", ")} FROM ${quoteMysql(table)}`);
    const mysqlKeys = new Set(mysqlKeyRows.map((row: Record<string, unknown>) => keys.map((key) => String(row[key])).join("\u0000")));
    const missingKeys = pgKeyRows.rows.filter((row: Record<string, unknown>) => !mysqlKeys.has(keys.map((key) => String(row[key])).join("\u0000")));

    if (missingKeys.length) {
      hasMissingSourceRows = true;
      console.log(`  missing source keys: ${missingKeys.slice(0, 5).map((row: Record<string, unknown>) => keys.map((key) => row[key]).join("/")).join(", ")}`);
    }
  }

  return hasMissingSourceRows;
}

async function runIntegrityChecks(mysqlConnection: any): Promise<CheckResult[]> {
  const checks = [
    {
      name: "Students with assigned coach outside selected sport",
      severity: "error" as const,
      sql: `
        SELECT COUNT(*) AS count
        FROM Student st
        JOIN \`User\` u ON u.id = st.coachId
        JOIN CoachProfile cp ON cp.userId = u.id AND cp.deletedAt IS NULL
        WHERE st.coachId IS NOT NULL AND cp.sportId <> st.sportId
      `
    },
    {
      name: "Students with assigned coach outside selected club",
      severity: "error" as const,
      sql: `
        SELECT COUNT(*) AS count
        FROM Student st
        JOIN \`User\` u ON u.id = st.coachId
        LEFT JOIN CoachClub cc ON cc.coachId = u.id AND cc.clubId = st.clubId
        WHERE st.coachId IS NOT NULL AND cc.id IS NULL
      `
    },
    {
      name: "Active coaches without display name or username",
      severity: "error" as const,
      sql: `
        SELECT COUNT(*) AS count
        FROM \`User\`
        WHERE role = 'COACH'
          AND status = 'ACTIVE'
          AND deletedAt IS NULL
          AND (COALESCE(TRIM(name), '') = '' AND COALESCE(TRIM(username), '') = '')
      `
    },
    {
      name: "Active coaches without profile",
      severity: "error" as const,
      sql: `
        SELECT COUNT(*) AS count
        FROM \`User\` u
        LEFT JOIN CoachProfile cp ON cp.userId = u.id AND cp.deletedAt IS NULL
        WHERE u.role = 'COACH' AND u.status = 'ACTIVE' AND u.deletedAt IS NULL AND cp.id IS NULL
      `
    },
    {
      name: "Students without assigned coach",
      severity: "warning" as const,
      sql: "SELECT COUNT(*) AS count FROM Student WHERE coachId IS NULL AND deletedAt IS NULL"
    }
  ];

  const results: CheckResult[] = [];
  for (const check of checks) {
    const [rows] = await mysqlConnection.query(check.sql);
    results.push({ name: check.name, count: Number(rows[0].count), severity: check.severity });
  }

  return results;
}

async function main() {
  loadEnvFile();

  const mysqlUrl = process.env.MYSQL_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!mysqlUrl?.startsWith("mysql://")) {
    throw new Error("Set MYSQL_DATABASE_URL or DATABASE_URL to a mysql:// connection string.");
  }

  const mysqlConnection = await mysql.createConnection(mysqlUrl);
  let failed = false;

  try {
    if (process.env.POSTGRES_DATABASE_URL) {
      const pgClient = new Client({ connectionString: process.env.POSTGRES_DATABASE_URL });
      await pgClient.connect();
      try {
        failed = (await compareCounts(pgClient, mysqlConnection)) || failed;
      } finally {
        await pgClient.end();
      }
    }

    console.log("\nMySQL integrity checks:");
    const checks = await runIntegrityChecks(mysqlConnection);
    for (const check of checks) {
      const status = check.count === 0 ? "OK" : check.severity === "error" ? "FAIL" : "WARN";
      if (check.count > 0 && check.severity === "error") failed = true;
      console.log(`- ${check.name}: ${check.count} ${status}`);
    }
  } finally {
    await mysqlConnection.end();
  }

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
