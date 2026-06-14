import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-3" href="/" aria-label="One Way Solutions home">
      <Image
        src="/brand/one-way-logo-transparent.png"
        alt="One Way Solutions logo"
        width={compact ? 58 : 76}
        height={compact ? 58 : 76}
        priority
        className="h-auto w-14 md:w-16"
      />
      {!compact ? (
        <span className="hidden text-sm font-semibold leading-tight text-primary sm:block">
          One Way
          <span className="block text-steel">Solutions</span>
        </span>
      ) : null}
    </Link>
  );
}
