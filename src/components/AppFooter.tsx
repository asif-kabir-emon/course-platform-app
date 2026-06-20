import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="layout-container flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || "Course Platform"}</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/refunds">Refunds</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
