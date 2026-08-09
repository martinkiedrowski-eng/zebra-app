export function SkeletonCard({ height = "h-20" }: { height?: string }) {
  return (
    <div
      className={`${height} animate-stripe-sweep rounded-card border border-zebra-border bg-zebra-surface`}
      style={{
        backgroundImage:
          "linear-gradient(100deg, transparent 40%, rgba(30,95,217,0.14) 50%, transparent 60%)",
        backgroundSize: "200% 100%",
      }}
      aria-hidden="true"
    />
  );
}
