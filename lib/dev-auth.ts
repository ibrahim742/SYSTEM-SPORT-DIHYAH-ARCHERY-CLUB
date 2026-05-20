const fallbackUsers = [
  {
    id: "dev-admin",
    name: "Admin AltLit",
    username: "admin",
    password: "admin123",
    role: "ADMIN" as const,
    clubIds: []
  },
  {
    id: "dev-coach",
    name: "Coach Ardi",
    username: "coach1",
    password: "coach123",
    role: "COACH" as const,
    clubIds: ["dev-club-bhirawa", "dev-club-garuda"]
  },
  {
    id: "dev-murid",
    name: "Farhan Maulana",
    username: "farhan.maulana",
    password: "murid123",
    role: "MURID" as const,
    clubIds: []
  }
];

export async function authorizeDevelopmentUser(username: string, password: string) {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.ENABLE_DEV_AUTH !== "true") return null;

  const user = fallbackUsers.find((item) => item.username === username);
  if (!user || user.password !== password) return null;

  return {
    id: user.id,
    name: user.name,
    email: null,
    image: null,
    username: user.username,
    role: user.role,
    clubIds: user.clubIds
  };
}

export function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;

  return error.message.includes("Can't reach database server") || error.message.includes("ECONNREFUSED");
}
