import { LandingPageAdminManager } from "@/components/landing-page-admin-manager";
import { auth } from "@/lib/auth";
import { ensureLandingCmsDefaults, getLandingContent } from "@/lib/landing";

export const dynamic = "force-dynamic";

export default async function CompanyProfileAdminPage() {
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    return (
      <section className="rounded-md border bg-background p-4 text-sm">
        <h2 className="font-semibold">Akses ditolak</h2>
        <p className="mt-1 text-xs text-muted-foreground">Hanya Admin yang bisa membuka CMS Landing Page.</p>
      </section>
    );
  }

  await ensureLandingCmsDefaults();
  const content = await getLandingContent({ admin: true });

  return <LandingPageAdminManager content={content} />;
}
