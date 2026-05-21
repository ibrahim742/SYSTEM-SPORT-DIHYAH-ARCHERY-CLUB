import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const settings = await getSystemSettings();

  return <ForgotPasswordForm branding={settings} />;
}
