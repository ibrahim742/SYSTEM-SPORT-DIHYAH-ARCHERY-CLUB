import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authorizeDevelopmentUser, isDatabaseUnavailable } from "@/lib/dev-auth";
import { getClientIp, getLoginLock, recordLoginFailure, recordLoginSuccess, writeAuditLog } from "@/lib/security";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "ADMIN" | "COACH" | "MURID";
      clubIds: string[];
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: "ADMIN" | "COACH" | "MURID";
    clubIds: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: "ADMIN" | "COACH" | "MURID";
    clubIds?: string[];
  }
}

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8)
});

function userLookupWhere(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return { email: trimmed.toLowerCase() };

  return { username: trimmed };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const ip = getClientIp(request);
        const identifier = parsed.data.username.trim();
        const lock = getLoginLock(identifier, ip);

        if (lock.locked) {
          await writeAuditLog({
            action: "LOGIN_RATE_LIMITED",
            entity: "User",
            metadata: { username: identifier, ip, retryAfter: lock.retryAfter }
          });
          return null;
        }

        async function rejectLogin(reason: string) {
          recordLoginFailure(identifier, ip);
          await writeAuditLog({
            action: "LOGIN_FAILED",
            entity: "User",
            metadata: { username: identifier, ip, reason }
          });

          return null;
        }

        try {
          const user = await prisma.user.findFirst({
            where: userLookupWhere(identifier),
            include: {
              coachClubs: {
                select: {
                  clubId: true
                }
              }
            }
          });

          if (!user || user.status !== "ACTIVE" || user.deletedAt) return rejectLogin("invalid_user");

          const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
          if (!validPassword) return rejectLogin("invalid_password");

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });
          recordLoginSuccess(identifier, ip);
          recordLoginSuccess(user.username, ip);
          if (user.email) recordLoginSuccess(user.email, ip);
          await writeAuditLog({
            actorId: user.id,
            action: "LOGIN_SUCCESS",
            entity: "User",
            entityId: user.id,
            metadata: { username: identifier, resolvedUsername: user.username, ip }
          });

          return {
            id: user.id,
            name: user.name ?? user.username,
            email: user.email,
            image: user.image,
            username: user.username,
            role: user.role,
            clubIds: user.coachClubs.map((club) => club.clubId)
          };
        } catch (error) {
          if (isDatabaseUnavailable(error)) {
            const devUser = await authorizeDevelopmentUser(identifier, parsed.data.password);
            if (!devUser) return rejectLogin("dev_fallback_failed");
            recordLoginSuccess(identifier, ip);
            return devUser;
          }

          throw error;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.clubIds = user.clubIds;
      }

      return token;
    },
    session({ session, token }) {
      if (token.sub && token.username && token.role) {
        session.user.id = token.sub;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.clubIds = token.clubIds ?? [];
      }

      return session;
    }
  }
});
