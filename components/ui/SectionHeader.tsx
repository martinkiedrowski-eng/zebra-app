interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  muted?: boolean;
}

export function SectionHeader({ title, actionLabel, onAction, muted = false }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2
        className={`font-display uppercase tracking-wide ${
          muted ? "text-sm font-semibold text-zebra-mute" : "text-lg font-bold text-zebra-ice"
        }`}
      >
        {title}
      </h2>
      {actionLabel && (
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
