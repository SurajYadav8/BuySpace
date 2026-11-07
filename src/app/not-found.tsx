import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-5xl font-semibold text-ink mb-3">404</p>
      <p className="text-ink-muted mb-8">That page is not part of BuySpace.</p>
      <Link
        href="/"
        className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Back home
      </Link>
    </div>
  );
}
