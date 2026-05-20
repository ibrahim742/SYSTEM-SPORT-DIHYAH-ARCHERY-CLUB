export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-md border bg-background p-4 text-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </section>
  );
}
