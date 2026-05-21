import fs from "node:fs";
import path from "node:path";

const { Client } = require("pg");
const mysql = require("mysql2/promise");

type TableSpec = {
  name: string;
  columns: string[];
  jsonColumns?: string[];
};

const tables: TableSpec[] = [
  {
    name: "User",
    columns: [
      "id",
      "name",
      "email",
      "email_verified",
      "image",
      "username",
      "passwordHash",
      "role",
      "status",
      "lastLogin",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  { name: "Club", columns: ["id", "name", "city", "status", "createdAt", "updatedAt", "deletedAt"] },
  { name: "Sport", columns: ["id", "name", "slug", "icon", "description", "status", "createdAt", "updatedAt", "deletedAt"] },
  { name: "CoachCategory", columns: ["id", "name", "slug", "description", "status", "createdAt", "updatedAt", "deletedAt"] },
  {
    name: "SystemSetting",
    columns: [
      "id",
      "key",
      "systemName",
      "systemSubtitle",
      "loginSubtitle",
      "contactWhatsapp",
      "logoUrl",
      "faviconUrl",
      "createdAt",
      "updatedAt"
    ]
  },
  {
    name: "LandingSection",
    columns: [
      "id",
      "key",
      "title",
      "subtitle",
      "description",
      "eyebrow",
      "imageUrl",
      "ctaLabel",
      "ctaHref",
      "status",
      "sortOrder",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  {
    name: "accounts",
    columns: [
      "id",
      "user_id",
      "type",
      "provider",
      "provider_account_id",
      "refresh_token",
      "access_token",
      "expires_at",
      "token_type",
      "scope",
      "id_token",
      "session_state"
    ]
  },
  { name: "sessions", columns: ["id", "session_token", "user_id", "expires"] },
  { name: "verification_tokens", columns: ["identifier", "token", "expires"] },
  { name: "CoachClub", columns: ["id", "coachId", "clubId", "createdAt"] },
  {
    name: "CoachProfile",
    columns: [
      "id",
      "userId",
      "sportId",
      "categoryId",
      "phone",
      "gender",
      "birthDate",
      "address",
      "photoUrl",
      "experienceYears",
      "certification",
      "bio",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  {
    name: "LandingItem",
    columns: [
      "id",
      "sectionKey",
      "title",
      "subtitle",
      "description",
      "eyebrow",
      "imageUrl",
      "ctaLabel",
      "ctaHref",
      "icon",
      "value",
      "href",
      "sortOrder",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  {
    name: "Student",
    columns: [
      "id",
      "userId",
      "clubId",
      "sportId",
      "coachId",
      "name",
      "birthDate",
      "age",
      "branch",
      "level",
      "phone",
      "address",
      "photoUrl",
      "status",
      "progress",
      "attendance",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  {
    name: "Program",
    columns: [
      "id",
      "slug",
      "sportId",
      "type",
      "createdById",
      "name",
      "level",
      "duration",
      "materials",
      "intensity",
      "description",
      "status",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  {
    name: "ProgramMaterial",
    columns: ["id", "programId", "day", "material", "set", "reps", "duration", "note", "order", "createdAt", "updatedAt"]
  },
  {
    name: "ProgramAssignment",
    columns: [
      "id",
      "studentId",
      "programId",
      "status",
      "assignedAt",
      "startedAt",
      "finishedAt",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  { name: "AttendanceSession", columns: ["id", "date", "title", "note", "createdAt", "updatedAt", "deletedAt"] },
  {
    name: "AttendanceRecord",
    columns: ["id", "sessionId", "studentId", "status", "checkIn", "checkOut", "note", "createdAt", "updatedAt"]
  },
  {
    name: "CoachScore",
    columns: [
      "id",
      "studentId",
      "coachId",
      "material",
      "technique",
      "focus",
      "stamina",
      "grade",
      "note",
      "scoredAt",
      "createdAt",
      "updatedAt",
      "deletedAt"
    ]
  },
  {
    name: "TrainingLog",
    columns: ["id", "studentId", "date", "result", "duration", "rpe", "note", "status", "createdAt", "updatedAt", "deletedAt"]
  },
  {
    name: "AuditLog",
    columns: ["id", "actorId", "action", "entity", "entityId", "metadata", "createdAt"],
    jsonColumns: ["metadata"]
  },
  {
    name: "Notification",
    columns: ["id", "userId", "actorId", "title", "message", "href", "readAt", "createdAt", "deletedAt"]
  }
];

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function requireDatabaseUrl(name: string, expectedProtocol: "postgresql:" | "postgres:" | "mysql:") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it in your shell or .env before running this script.`);
  }

  const url = new URL(value);
  if (expectedProtocol === "mysql:" && url.protocol !== "mysql:") {
    throw new Error(`${name} must start with mysql://`);
  }
  if ((expectedProtocol === "postgresql:" || expectedProtocol === "postgres:") && !["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error(`${name} must start with postgresql:// or postgres://`);
  }

  return value;
}

function createPostgresClient(connectionString: string) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  return new Client({
    connectionString,
    ssl: sslMode === "require" ? { rejectUnauthorized: false } : undefined
  });
}

function pgIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function mysqlIdentifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}

function serializeValue(table: TableSpec, column: string, value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (table.jsonColumns?.includes(column)) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  return value;
}

async function truncateTarget(connection: any) {
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const table of [...tables].reverse()) {
      await connection.query(`TRUNCATE TABLE ${mysqlIdentifier(table.name)}`);
    }
  } finally {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

async function copyTable(pgClient: any, mysqlConnection: any, table: TableSpec) {
  const selectedColumns = table.columns.map(pgIdentifier).join(", ");
  const source = await pgClient.query(`SELECT ${selectedColumns} FROM ${pgIdentifier(table.name)}`);

  if (source.rows.length === 0) {
    return 0;
  }

  const mysqlColumns = table.columns.map(mysqlIdentifier).join(", ");
  const placeholders = table.columns.map(() => "?").join(", ");
  const insertSql = `INSERT INTO ${mysqlIdentifier(table.name)} (${mysqlColumns}) VALUES (${placeholders})`;

  for (const row of source.rows) {
    const values = table.columns.map((column) => serializeValue(table, column, row[column]));
    await mysqlConnection.execute(insertSql, values);
  }

  return source.rows.length;
}

async function countTargetRows(connection: any) {
  const counts = new Map<string, number>();
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM ${mysqlIdentifier(table.name)}`);
    counts.set(table.name, Number(rows[0].count));
  }
  return counts;
}

async function main() {
  loadEnvFile();

  const postgresUrl = requireDatabaseUrl("POSTGRES_DATABASE_URL", "postgresql:");
  const mysqlUrl = process.env.MYSQL_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!mysqlUrl) {
    throw new Error("Missing MYSQL_DATABASE_URL or DATABASE_URL for the MySQL target.");
  }
  process.env.MYSQL_DATABASE_URL = mysqlUrl;
  requireDatabaseUrl("MYSQL_DATABASE_URL", "mysql:");

  const shouldTruncate = process.argv.includes("--truncate");
  const pgClient = createPostgresClient(postgresUrl);
  const mysqlConnection = await mysql.createConnection(mysqlUrl);

  try {
    await pgClient.connect();

    if (shouldTruncate) {
      console.log("Truncating MySQL target tables...");
      await truncateTarget(mysqlConnection);
    }

    console.log("Copying PostgreSQL data to MySQL...");
    for (const table of tables) {
      const copied = await copyTable(pgClient, mysqlConnection, table);
      console.log(`${table.name}: copied ${copied}`);
    }

    console.log("\nMySQL row counts:");
    const counts = await countTargetRows(mysqlConnection);
    for (const table of tables) {
      console.log(`${table.name}: ${counts.get(table.name) ?? 0}`);
    }
  } finally {
    await pgClient.end();
    await mysqlConnection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
