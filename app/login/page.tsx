import { LoginForm } from "@/components/login-form";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ callbackUrl?: string | string[] }> }) {
  const settings = await getSystemSettings();
  const resolvedSearchParams = await searchParams;
  const callbackUrl = Array.isArray(resolvedSearchParams?.callbackUrl) ? resolvedSearchParams.callbackUrl[0] : resolvedSearchParams?.callbackUrl;

  return <LoginForm branding={settings} callbackUrl={callbackUrl} />;
}
