import AppNavbar from "@/components/AppNavbar";
import { ReactNode } from "react";
import AppFooter from "@/components/AppFooter";

export default function ConsumerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNavbar />
      <main className="mx-auto w-full max-w-[var(--content-max-width)] flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
