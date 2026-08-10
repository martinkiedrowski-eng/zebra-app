import Link from "next/link";
import { ChevronRight, ExternalLink, LucideIcon } from "lucide-react";

interface NavRowProps {
  icon?: LucideIcon;
  label: string;
  sublabel?: string;
  href: string;
  external?: boolean;
}

export function NavRow({ icon: Icon, label, sublabel, href, external = false }: NavRowProps) {
  const content = (
    <>
      {Icon && (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control bg-zebra-blue-dim">
          <Icon size={16} className="text-zebra-blue" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-text text-sm font-medium text-zebra-ice">{label}</span>
        {sublabel && <span className="mt-0.5 block truncate font-text text-xs text-zebra-mute">{sublabel}</span>}
      </span>
      {external ? (
        <ExternalLink size={16} className="flex-shrink-0 text-zebra-mute" aria-hidden="true" />
      ) : (
        <ChevronRight size={16} className="flex-shrink-0 text-zebra-mute" aria-hidden="true" />
      )}
    </>
  );

  const className =
    "flex items-center gap-3 rounded-card border border-zebra-border bg-zebra-surface px-3.5 py-3 transition-colors hover:border-zebra-blue/50";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
