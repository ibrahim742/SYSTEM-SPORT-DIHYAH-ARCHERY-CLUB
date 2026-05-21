import { ResetPasswordForm } from "@/components/reset-password-form";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams?: Promise<{ token?: string | string[] }> }) {
  const [settings, resolvedSearchParams] = await Promise.all([getSystemSettings(), searchParams]);
  const token = Array.isArray(resolvedSearchParams?.token) ? resolvedSearchParams.token[0] : resolvedSearchParams?.token;

  return <ResetPasswordForm branding={settings} token={token ?? ""} />;
}
