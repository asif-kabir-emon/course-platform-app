import AppNavbar from "@/components/AppNavbar";
import { ReactNode } from "react";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <AppNavbar />
      <main className="mx-auto w-full max-w-[var(--content-max-width)]">
        {children}
      </main>
    </>
  );
}
