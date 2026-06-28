import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="section-title">Not Found</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-accent-ink">
        That match slipped behind the sightscreen.
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        The page you asked for does not exist in the exported match bundle.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-ink"
      >
        Back to homepage
      </Link>
    </main>
  );
}
