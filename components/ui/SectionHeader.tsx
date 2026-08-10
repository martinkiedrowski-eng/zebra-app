import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Wenn gesetzt, wird actionLabel als next/link statt als Button gerendert. */
  actionHref?: string;
  muted?: boolean;
}

export function SectionHeader({ title, actionLabel, onAction, actionHref, muted = false }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2
        className={`font-display uppercase tracking-wide ${
          muted ? "text-sm font-semibold text-zebra-mute" : "text-lg font-bold text-zebra-ice"
        }`}
      >
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="font-text text-xs font-medium text-zebra-mute hover:text-zebra-blue">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && (
        <button
          onClick={onAction}
          className="font-text text-xs font-medium text-zebra-mute hover:text-zebra-blue"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
