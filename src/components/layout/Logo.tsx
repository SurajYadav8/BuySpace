import Link from "next/link";

type LogoProps = {
  className?: string;
  size?: "nav" | "hero";
  linked?: boolean;
};

export default function Logo({ className = "", size = "nav", linked = true }: LogoProps) {
  const isHero = size === "hero";
  const name = (
    <span
      className={`font-display font-extrabold tracking-[-0.03em] text-ink leading-none ${
        isHero ? "text-[2.75rem] sm:text-5xl md:text-6xl" : "text-[1.08rem]"
      }`}
    >
      BuySpace
    </span>
  );

  if (!linked) {
    return <span className={`inline-flex items-center ${className}`}>{name}</span>;
  }

  return (
    <Link
      href="/"
      className={`inline-flex items-center transition-opacity hover:opacity-75 ${className}`}
      aria-label="BuySpace home"
    >
      {name}
    </Link>
  );
}
