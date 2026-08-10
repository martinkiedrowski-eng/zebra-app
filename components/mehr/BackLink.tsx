import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink() {
  return (
    <Link href="/mehr" className="mb-4 flex items-center gap-1.5 font-text text-sm text-zebra-mute hover:text-zebra-ice">
      <ArrowLeft size={18} strokeWidth={2} />
      Zurück
    </Link>
  );
}
