export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
