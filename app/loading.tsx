import { AppShell } from "@/components/layout/AppShell";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function Loading() {
  return (
    <AppShell>
      <div className="mb-6 h-8 w-40 animate-stripe-sweep rounded-card bg-zebra-surface" />
      <div className="mb-6">
        <SkeletonCard height="h-28" />
      </div>
      <div className="mb-6 space-y-2">
        <SkeletonCard height="h-14" />
        <SkeletonCard height="h-14" />
        <SkeletonCard height="h-14" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SkeletonCard height="h-32" />
        <SkeletonCard height="h-32" />
      </div>
      <div className="flex gap-3">
        <SkeletonCard height="h-40" />
        <SkeletonCard height="h-40" />
      </div>
    </AppShell>
  );
}
