import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { handleApiError, readJson } from "@/lib/api";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { getClientIp, writeAuditLog } from "@/lib/security";
import { forgotPasswordSchema } from "@/lib/validation";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function publicOrigin(request: Request) {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const { email } = await readJson(request, forgotPasswordSchema);
    const normalizedEmail = email.trim().toLowerCase();
    const genericResponse = NextResponse.json({
      message: "Jika email terdaftar, tautan reset password akan dikirim."
    });

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        status: "ACTIVE",
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true
      }
    });

    if (!user?.email) {
      await writeAuditLog({
        action: "PASSWORD_RESET_REQUEST_IGNORED",
        entity: "User",
        metadata: { email: normalizedEmail, ip: getClientIp(request) }
      });
      return genericResponse;
    }

    const token = randomBytes(32).toString("hex");
    const identifier = `password-reset:${normalizedEmail}`;
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const resetUrl = `${publicOrigin(request).replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: tokenHash(token),
        expires
      }
    });

    await sendMail({
      to: user.email,
      subject: "Reset password DIHYAH ARCHERY CLUB",
      text: [
        `Halo ${user.name ?? user.username},`,
        "",
        "Kami menerima permintaan reset password untuk akun DIHYAH ARCHERY CLUB.",
        "Klik tautan berikut untuk membuat password baru:",
        "",
        resetUrl,
        "",
        "Tautan ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password."
      ].join("\n")
    });

    await writeAuditLog({
      actorId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user.id,
      metadata: { email: normalizedEmail, ip: getClientIp(request), expires: expires.toISOString() }
    });

    return genericResponse;
  } catch (error) {
    return handleApiError(error);
  }
}
