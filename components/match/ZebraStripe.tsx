type ZebraStripeVariant = "blue" | "pulse";

interface ZebraStripeProps {
  variant?: ZebraStripeVariant;
  className?: string;
}

/**
 * Das einzige wiederkehrende Markenzeichen von ZEBRA (siehe Phase-2-Design-
 * System, Abschnitt "Signature-Element"). Wird ausschließlich funktional
 * eingesetzt: als Rahmenakzent der Live-MatchCard, als Loading-Sweep und
 * als Radar-Marker bei hoher Relevanz — nirgendwo dekorativ.
 */
export function ZebraStripe({ variant = "blue", className = "" }: ZebraStripeProps) {
  const color = variant === "pulse" ? "#FF3B4E" : "#1E5FD9";
  return (
    <span
      aria-hidden="true"
      className={`block h-[3px] w-full rounded-full ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0 6px, transparent 6px 12px)`,
      }}
    />
  );
}
