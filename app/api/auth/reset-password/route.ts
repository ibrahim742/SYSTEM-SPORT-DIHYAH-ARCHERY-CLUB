import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { handleApiError, readJson } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clearLoginFailures, getClientIp, writeAuditLog } from "@/lib/security";
import { resetPasswordSchema } from "@/lib/validation";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { token, password } = await readJson(request, resetPasswordSchema);
    const hashedToken = tokenHash(token.trim());

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        identifier: { startsWith: "password-reset:" },
        expires: { gt: new Date() }
      }
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Tautan reset tidak valid atau sudah kedaluwarsa." }, { status: 400 });
    }

    const email = verificationToken.identifier.replace(/^password-reset:/, "");
    const user = await prisma.user.findFirst({
      where: {
        email,
        status: "ACTIVE",
        deletedAt: null
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    if (!user) {
      await prisma.verificationToken.deleteMany({ where: { identifier: verificationToken.identifier } });
      return NextResponse.json({ error: "Akun tidak aktif atau tidak ditemukan." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) }
      }),
      prisma.verificationToken.deleteMany({ where: { identifier: verificationToken.identifier } })
    ]);

    await writeAuditLog({
      actorId: user.id,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: user.id,
      metadata: { email, ip: getClientIp(request) }
    });
    clearLoginFailures([user.username, user.email, email], getClientIp(request));

    return NextResponse.json({ message: "Password berhasil diubah. Silakan login dengan password baru." });
  } catch (error) {
    return handleApiError(error);
  }
}
