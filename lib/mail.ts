import { spawn } from "child_process";

type MailOptions = {
  to: string;
  subject: string;
  text: string;
};

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function defaultFrom() {
  try {
    return `noreply@${new URL(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "https://dihyaharchery.com").hostname}`;
  } catch {
    return "noreply@dihyaharchery.com";
  }
}

export async function sendMail({ to, subject, text }: MailOptions) {
  const from = process.env.MAIL_FROM || defaultFrom();
  const message = [
    `From: ${sanitizeHeader(from)}`,
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text
  ].join("\n");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.env.SENDMAIL_PATH || "/usr/sbin/sendmail", ["-t", "-i"], {
      stdio: ["pipe", "ignore", "pipe"]
    });
    const errors: Buffer[] = [];

    child.stderr.on("data", (chunk) => errors.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(Buffer.concat(errors).toString("utf8") || `sendmail exited with code ${code}`));
    });

    child.stdin.end(message);
  });
}
